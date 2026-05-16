import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.ZOHO_WEBHOOK_SECRET;

  // If a webhook secret is configured, attempt to verify the signature.
  if (secret) {
    const sigHeader = req.headers.get("x-zs-signature") || req.headers.get("x-zoho-signature") || "";
    const h = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (!sigHeader || (sigHeader && !sigHeader.includes(h))) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Zoho places custom notes/metadata in different places depending on request type.
    // Try several common locations to find the booking id we stored earlier.
    const bookingId =
      payload?.data?.request?.notes || payload?.data?.request?.notes_field || payload?.request?.notes || payload?.notes || payload?.data?.notes;

    const requestId = payload?.data?.request?.request_id || payload?.data?.request?.id || payload?.request?.request_id || payload?.request?.id;

    if (!bookingId) {
      // If we can't find the booking id, store the webhook payload to a diagnostics table
      await supabase.from("bookings").insert?.({});
      return NextResponse.json({ received: true });
    }

    // Mark the booking as signed and save Zoho metadata
    await supabase
      .from("bookings")
      .update({
        contract_signed: true,
        contract_signed_at: new Date().toISOString(),
        zoho_request_id: requestId || null,
        zoho_payload: payload,
      })
      .eq("id", bookingId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Zoho webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
