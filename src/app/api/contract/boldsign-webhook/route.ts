import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentApi } from "boldsign";
import crypto from "crypto";

// ─── POST /api/contract/boldsign-webhook ──────────────────────────────────────
//
// BoldSign calls this endpoint when document events occur (e.g. a signer
// completes their signature).  We use it to:
//
//  1. Verify the request is genuinely from BoldSign (HMAC-SHA256 signature)
//  2. Detect the "Completed" event (all signers have signed)
//  3. Download the final signed PDF from BoldSign
//  4. Upload the PDF to Supabase Storage for local archiving
//  5. Mark the booking as contract_signed in the database
//
// In your BoldSign dashboard → Webhooks, point the URL to:
//   https://yourcarhiresite.com/api/contract/boldsign-webhook
// and enable the "Document Completed" (Completed) event.
//
// Set BOLDSIGN_WEBHOOK_SECRET in your environment to the signing secret
// BoldSign provides so we can verify every incoming request.

export async function POST(req: Request) {
  // ── 1. Read the raw body before parsing ──────────────────────────────────
  // We need the raw bytes to verify the HMAC signature; parsing JSON first
  // would lose the exact byte representation.

  const raw = await req.text();

  // ── 2. Signature verification (optional but strongly recommended) ─────────
  //
  // BoldSign signs every webhook delivery with HMAC-SHA256 using your webhook
  // secret and sends the hex digest in the "X-BoldSign-Signature" header.
  // If BOLDSIGN_WEBHOOK_SECRET is configured we verify it; otherwise we skip.

  const webhookSecret = process.env.BOLDSIGN_WEBHOOK_SECRET;

  if (webhookSecret) {
    const sigHeader = req.headers.get("X-BoldSign-Signature") ?? "";
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(raw)
      .digest("hex");

    // Reject the request if the signature does not match
    if (!sigHeader || !sigHeader.includes(expectedSig)) {
      console.warn("BoldSign webhook: invalid signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  // ── 3. Parse the JSON payload ─────────────────────────────────────────────

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── 4. Filter to "Completed" events only ──────────────────────────────────
  //
  // BoldSign sends many event types; we only act on "Completed" which means
  // all required signers have finished signing the document.
  //
  // Payload shape (simplified):
  //   { event: { eventType: "Completed" }, data: { documentId: "...", ... } }

  const eventType: string = payload?.event?.eventType ?? payload?.eventType ?? "";
  const documentId: string = payload?.data?.documentId ?? payload?.documentId ?? "";

  if (eventType !== "Completed") {
    // Acknowledge receipt so BoldSign stops retrying, but take no action
    return NextResponse.json({ received: true, action: "ignored" });
  }

  if (!documentId) {
    console.error("BoldSign webhook: Completed event missing documentId", payload);
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }

  // ── 5. Recover the booking ID from document metadata ─────────────────────
  //
  // We embedded metaData.bookingId when creating the document in boldsign-create.
  // BoldSign echoes this back in the webhook so we can identify the booking.

  const bookingId: string =
    payload?.data?.metaData?.bookingId ??
    payload?.metaData?.bookingId ??
    "";

  const apiKey = process.env.BOLDSIGN_API_KEY ?? "";

  try {
    const supabase = await createClient();

    // ── 6. Download the signed PDF from BoldSign (via SDK) ────────────────
    //
    // DocumentApi.downloadDocument returns a Buffer directly — no manual
    // header management required.  We upload it to Supabase Storage to keep
    // a permanent local copy for legal compliance.

    let pdfStoragePath: string | null = null;

    if (apiKey) {
      try {
        const documentApi = new DocumentApi("https://api-eu.boldsign.com");
        documentApi.setApiKey(apiKey);

        const pdfBuffer = await documentApi.downloadDocument(documentId);

        // Upload to the "contract-docs" Supabase Storage bucket under a
        // predictable path so admins can retrieve it later.
        const storagePath = bookingId
          ? `${bookingId}/signed-contract.pdf`
          : `boldsign/${documentId}/signed-contract.pdf`;

        const { error: uploadError } = await supabase.storage
          .from("contract-docs")
          .upload(storagePath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true, // overwrite if a previous version exists
          });

        if (uploadError) {
          // Log but don't fail — the booking status update below is still valuable
          console.error("BoldSign webhook: PDF upload to Supabase failed", uploadError);
        } else {
          pdfStoragePath = storagePath;
          console.log(`BoldSign webhook: signed PDF saved to contract-docs/${storagePath}`);
        }
      } catch (downloadErr) {
        console.error("BoldSign webhook: failed to download PDF via SDK", downloadErr);
      }
    }

    // ── 7. Update the booking record ──────────────────────────────────────
    //
    // Mark the contract as signed and record the BoldSign document ID and
    // the path of the stored PDF so admins can retrieve it from the dashboard.

    if (bookingId) {
      const { error: dbError } = await supabase
        .from("bookings")
        .update({
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
          boldsign_document_id: documentId,
          // Store the Supabase Storage path to the signed PDF (if upload succeeded)
          ...(pdfStoragePath ? { signed_pdf_path: pdfStoragePath } : {}),
        })
        .eq("id", bookingId);

      if (dbError) {
        console.error("BoldSign webhook: DB update failed", dbError);
      }
    } else {
      // We received a completed event but couldn't match it to a booking.
      // Log the documentId so an admin can manually correlate if needed.
      console.warn(
        `BoldSign webhook: Completed event for documentId "${documentId}" has no bookingId in metadata`
      );
    }

    // Always respond 200 quickly — BoldSign retries if it doesn't get a 2xx
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("BoldSign webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
