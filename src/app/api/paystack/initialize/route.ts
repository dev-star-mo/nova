import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: { authorization_url: string; reference: string };
};

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Paystack is not configured (PAYSTACK_SECRET_KEY)." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { booking_id } = await req.json();
  if (!booking_id) {
    return NextResponse.json({ error: "booking_id required" }, { status: 400 });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, total_amount, email, user_id, status")
    .eq("id", booking_id)
    .single();

  if (error || !booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const amountKobo = Math.round(Number(booking.total_amount) * 100);
  if (amountKobo < 100) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const reference = `NV_${booking.id.slice(0, 8)}_${Date.now()}`;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: booking.email,
      amount: amountKobo,
      currency: "KES",
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/checkout/success`,
      metadata: { booking_id: booking.id },
    }),
  });

  const json = (await res.json()) as PaystackInitResponse;
  if (!json.status || !json.data?.authorization_url) {
    return NextResponse.json(
      { error: json.message || "Paystack initialization failed" },
      { status: 502 }
    );
  }

  await supabase
    .from("bookings")
    .update({ paystack_reference: reference })
    .eq("id", booking.id);

  return NextResponse.json({
    authorization_url: json.data.authorization_url,
    reference: json.data.reference,
  });
}
