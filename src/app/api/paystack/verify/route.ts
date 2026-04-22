import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PaystackVerifyResponse = {
  status: boolean;
  data?: {
    status: string;
    reference: string;
    metadata?: { booking_id?: string };
  };
  message?: string;
};

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Paystack is not configured." }, { status: 503 });
  }

  const { reference } = await req.json();
  if (!reference || typeof reference !== "string") {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const verifyJson = (await verifyRes.json()) as PaystackVerifyResponse;

  if (!verifyRes.ok || !verifyJson.status || !verifyJson.data) {
    return NextResponse.json({ error: verifyJson.message ?? "Verification failed" }, { status: 400 });
  }

  if (verifyJson.data.status !== "success") {
    return NextResponse.json({ status: verifyJson.data.status });
  }

  const bookingId = verifyJson.data.metadata?.booking_id;
  if (!bookingId) {
    return NextResponse.json({ error: "No booking_id in transaction metadata" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existingBooking, error: bookingFetchError } = await admin
    .from("bookings")
    .select("id, car_id, status")
    .eq("id", bookingId)
    .single();
  if (bookingFetchError || !existingBooking) {
    return NextResponse.json({ error: bookingFetchError?.message ?? "Booking not found" }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from("bookings")
    .update({ status: "paid", paystack_reference: reference })
    .eq("id", bookingId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  if (existingBooking.status !== "paid" && existingBooking.car_id) {
    const { data: car } = await admin
      .from("cars")
      .select("units_available")
      .eq("id", existingBooking.car_id)
      .single();
    if (car) {
      await admin
        .from("cars")
        .update({ units_available: Math.max(0, (car.units_available ?? 1) - 1) })
        .eq("id", existingBooking.car_id);
    }
  }

  return NextResponse.json({ status: "paid", booking_id: bookingId });
}

