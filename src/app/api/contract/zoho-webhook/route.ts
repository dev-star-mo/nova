import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializePaystackPayment } from "@/lib/paystack";
import { sendMail, paymentRequestHtml } from "@/lib/mailer";

// Zoho webhook handler. Verifies shared secret and responds to request completion.
export async function POST(req: Request) {
  const admin = createAdminClient();

  const secret = process.env.ZOHO_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (secret) {
    // Zoho sends signature in header 'x-zs-webhook-signature'
    const sig = req.headers.get("x-zs-webhook-signature") || req.headers.get("x-zoho-signature") || req.headers.get("x-zs-signature") || req.headers.get("x-hook-signature");
    if (!sig) {
      console.error("Zoho webhook: missing signature header. Headers present:", Object.fromEntries(req.headers.entries()));
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Compute HMAC-SHA256 and compare base64/hex possibilities
    const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest();
    const hmacBase64 = hmac.toString("base64");
    const hmacHex = hmac.toString("hex");

    if (sig !== hmacBase64 && sig !== hmacHex) {
      console.error("Zoho webhook: signature mismatch", { got: sig, expectedBase64: hmacBase64 });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("Zoho webhook: invalid JSON", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Zoho Sign usually includes request_id and actions with statuses.
  const requestId = event?.request_id || event?.data?.request_id || event?.requests?.request_id || event?.requests?.requestId;
  const actions = event?.data?.actions || event?.requests?.actions || event?.actions || [];

  // Check operation type or status
  const operationType = event?.notifications?.operation_type || event?.operation_type;
  const status = event?.data?.status || event?.status || event?.requests?.status || null;

  // Find any action with status COMPLETED (case-insensitive)
  const actionCompleted = Array.isArray(actions) && actions.find((a: any) => String(a?.status).toLowerCase() === "completed");

  const isCompletedEvent = String(operationType).toLowerCase().includes("completed") ||
                           String(status).toLowerCase() === "completed" ||
                           !!actionCompleted;

  if (!isCompletedEvent) {
    console.log("Zoho webhook: status not completed — ignoring", { requestId, operationType, status });
    console.log("Raw payload for debug:", rawBody);
    return NextResponse.json({ status: "ignored" });
  }

  try {
    // Find booking by Zoho notes (we saved BookingID:<id> in notes) or by zoho_request_id
    const noteString = event?.data?.notes || event?.notes || event?.requests?.notes || "";
    const bookingIdFromNotes = noteString.match(/BookingID:([0-9a-fA-F-]+)/)?.[1];
    const searchId = bookingIdFromNotes || requestId;

    if (!searchId) {
      console.error("Zoho webhook: cannot determine booking id or request id", { event });
      return NextResponse.json({ error: "No booking reference" }, { status: 400 });
    }

    // Determine query based on whether searchId looks like a UUID
    let query = admin.from("bookings").select("id,email,total_amount,car_id,full_name,status");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchId);
    
    console.log("Zoho webhook: searching for booking", { searchId, isUuid, source: bookingIdFromNotes ? "notes" : "requestId" });

    if (isUuid) {
      query = query.or(`id.eq.${searchId},zoho_request_id.eq.${searchId}`);
    } else {
      query = query.eq("zoho_request_id", searchId);
    }

    const { data: booking, error: dbError } = await query.single();

    if (dbError || !booking) {
      console.error("Zoho webhook: booking not found in DB.", { 
        searchId, 
        isUuid, 
        dbError,
        hint: "Ensure zoho_request_id was saved during creation and database constraints are updated."
      });
      return NextResponse.json({ 
        error: "Booking not found", 
        searchId, 
        dbError 
      }, { status: 404 });
    }

    console.log("Zoho webhook: found booking", { id: booking.id, current_status: booking.status });

    // Update booking status to signed_pending_payment
    const updatePayload: any = {
      status: "signed_pending_payment",
      zoho_status: "completed",
      signed_at: new Date().toISOString(),
    };

    if (requestId) updatePayload.zoho_request_id = requestId;
    if (actionCompleted?.action_id) updatePayload.zoho_action_id = actionCompleted.action_id;

    await admin.from("bookings").update(updatePayload).eq("id", booking.id);

    // Initialize Paystack payment server-side
    const init = await initializePaystackPayment({ amountKES: Number(booking.total_amount), email: booking.email, bookingId: booking.id });

    if (!init) {
      console.error("Zoho webhook: failed to initialize paystack payment for booking", booking.id);
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
    }

    // Save payment info to booking
    await admin.from("bookings").update({
      paystack_reference: init.reference,
      payment_link: init.authorization_url,
      payment_status: "pending",
    }).eq("id", booking.id);

    // Send payment email to customer
    const html = paymentRequestHtml({ fullName: booking.full_name ?? booking.email, bookingRef: init.reference, amount: Number(booking.total_amount), paymentLink: init.authorization_url, deadline: undefined });
    await sendMail({ to: booking.email, subject: "Please complete payment for your booking", html });

    console.log(`Zoho webhook: booking ${booking.id} marked signed; payment requested (${init.reference})`);
  } catch (err) {
    console.error("Zoho webhook handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
