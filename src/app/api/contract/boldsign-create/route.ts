import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentApi, TemplateApi } from "boldsign";

// ─── Types ────────────────────────────────────────────────────────────────────

type JsonBody = { booking_id?: string };

// ─── POST /api/contract/boldsign-create ───────────────────────────────────────
//
// Flow:
//  1. Validate env vars + request body
//  2. Look up the booking (and verify the caller owns it)
//  3. Send a document from the BoldSign template → receive a documentId
//  4. Generate an embedded signing URL for that document
//  5. Return { embed_url } to the client so it can render the iframe
//
// All BoldSign API calls are made server-side so the API key never reaches
// the browser.

export async function POST(req: Request) {
  // ── 1. Config validation ──────────────────────────────────────────────────

  const apiKey = process.env.BOLDSIGN_API_KEY;
  const templateId = process.env.BOLDSIGN_TEMPLATE_ID;

  if (!apiKey || !templateId) {
    return NextResponse.json(
      { error: "BoldSign is not configured. Set BOLDSIGN_API_KEY and BOLDSIGN_TEMPLATE_ID." },
      { status: 503 }
    );
  }

  // ── 2. Auth + booking look-up ─────────────────────────────────────────────

  const body = (await req.json()) as JsonBody;
  const bookingId = body.booking_id;
  if (!bookingId) {
    return NextResponse.json({ error: "booking_id required" }, { status: 400 });
  }

  // Use the server-side Supabase client (reads the auth cookie automatically)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch only the fields we need; also verify the booking belongs to this user
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, full_name, email, user_id, car_id")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  try {
    // ── 3. Send document from template (via SDK) ──────────────────────────
    //
    // We set disableEmails: true so the customer is NOT emailed a standalone
    // signing link — they will sign directly inside the embedded iframe instead.
    //
    // We also pass metaData.bookingId so the webhook can identify which booking
    // was signed without any additional database look-ups.

    const templateApi = new TemplateApi("https://api-eu.boldsign.com");
    templateApi.setApiKey(apiKey);

    const sendResult = await templateApi.sendUsingTemplate(templateId, {
      title: `Rental Agreement - Booking #${booking.id}`,
      disableEmails: true, // suppress standalone email; signing is done via iframe
      roles: [
        {
          // roleIndex must match the signer role index defined in your BoldSign template
          roleIndex: 1,
          signerName: booking.full_name,
          signerEmail: booking.email,
        },
      ],
      // Store our internal booking ID on the document so the webhook can correlate
      metaData: {
        bookingId: String(booking.id),
      },
    });

    const documentId = sendResult.documentId;

    if (!documentId) {
      return NextResponse.json(
        { error: "BoldSign did not return a documentId", detail: sendResult },
        { status: 502 }
      );
    }

    // Persist the BoldSign document ID on the booking row so we can reference
    // it later (e.g. to download the signed PDF or correlate with the webhook)
    await supabase
      .from("bookings")
      .update({ boldsign_document_id: documentId })
      .eq("id", booking.id);

    // ── 4. Generate embedded signing URL (via SDK) ────────────────────────
    //
    // getEmbeddedSignLink returns a short-lived URL that loads the BoldSign
    // signing UI inside an <iframe> — no redirect to an external site required.

    const documentApi = new DocumentApi("https://api-eu.boldsign.com");
    documentApi.setApiKey(apiKey);

    const embedResult = await documentApi.getEmbeddedSignLink(
      documentId,
      booking.email
    );

    const embedUrl = embedResult.signLink;

    if (!embedUrl) {
      return NextResponse.json(
        { error: "BoldSign returned no signLink", detail: embedResult },
        { status: 502 }
      );
    }

    // ── 5. Return the embed URL to the frontend ───────────────────────────

    return NextResponse.json({ embed_url: embedUrl });
  } catch (err) {
    console.error("BoldSign create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
