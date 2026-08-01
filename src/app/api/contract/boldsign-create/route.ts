import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentApi, TemplateApi } from "boldsign";

// ─── Types ────────────────────────────────────────────────────────────────────

type JsonBody = {
  booking_id?: string;
  // Three fields the user types in ContractClient before opening the contract.
  // They may not have been saved to the DB yet, so the client sends them directly.
  id_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
};

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

  // Fetch all fields we need to prefill the contract; also verifies ownership
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      id, user_id,
      full_name, phone, email,
      id_number, emergency_contact_name, emergency_contact_phone,
      pickup_at, return_at, rental_duration, driving_mode,
      pickup_location, dropoff_location, destination,
      special_requests, total_amount, car_id,
      cars ( make, model, year, category, transmission, fuel_type, seats, location )
    `)
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

    // ── 3a. Resolve form fields ────────────────────────────────────────────
    //
    // Prefer the live values the client just sent (user may not have saved yet);
    // fall back to whatever is already stored on the booking row.

    const car = booking.cars as {
      make?: string; model?: string; year?: number;
      category?: string; transmission?: string;
      fuel_type?: string; seats?: number; location?: string;
    } | null;

    const idNumber = body.id_number || booking.id_number || "";
    const emergencyName = body.emergency_contact_name || booking.emergency_contact_name || "";
    const emergencyPhone = body.emergency_contact_phone || booking.emergency_contact_phone || "";

    // Helper so we can skip empty strings (BoldSign ignores null-ish values anyway)
    const field = (id: string, value: string | number | null | undefined) =>
      value != null && String(value).trim() !== ""
        ? { id, value: String(value) }
        : null;

    const templateApi = new TemplateApi("https://api-eu.boldsign.com");
    templateApi.setApiKey(apiKey);

    const existingFormFields = [
      // ── Renter details ──
      field("full_name", booking.full_name),
      field("phone", booking.phone),
      field("email", booking.email),
      field("id_number", idNumber),
      field("emergency_contact_name", emergencyName),
      field("emergency_contact_phone", emergencyPhone),
      // ── Rental details ──
      field("pickup_at", booking.pickup_at ? new Date(booking.pickup_at).toLocaleString("en-US") : ""),
      field("return_at", booking.return_at ? new Date(booking.return_at).toLocaleString("en-US") : ""),
      field("rental_duration", booking.rental_duration),
      field("driving_mode", booking.driving_mode),
      field("pickup_location", booking.pickup_location),
      field("dropoff_location", booking.dropoff_location),
      field("destination", booking.destination),
      field("special_requests", booking.special_requests),
      field("total_amount", booking.total_amount != null ? `$${Number(booking.total_amount).toLocaleString("en-US")}` : ""),
      // ── Vehicle details ──
      field("vehicle", car ? `${car.make} ${car.model} (${car.year})` : ""),
      field("category", car?.category),
      field("transmission", car?.transmission),
      field("fuel_type", car?.fuel_type),
      field("seats", car?.seats),
      field("car_location", car?.location),
    ].filter(Boolean) as { id: string; value: string }[];

    const sendResult = await templateApi.sendUsingTemplate(templateId, {
      title: `Rental Agreement - Booking #${booking.id}`,
      disableEmails: true, // suppress standalone email; signing is done via iframe
      roles: [
        {
          // roleIndex must match the signer role index defined in your BoldSign template
          roleIndex: 1,
          signerName: booking.full_name,
          signerEmail: booking.email,
          existingFormFields,
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
