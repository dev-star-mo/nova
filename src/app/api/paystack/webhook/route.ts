import { NextResponse } from "next/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("Paystack secret key is not configured.");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const rawBody = await req.text();
  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Handle charge.success
  if (event.event === "charge.success") {
    const { metadata, reference } = event.data;
    const booking_id = metadata?.booking_id;


    if (!booking_id) {
      console.error("No booking_id found in Paystack metadata.");
      return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "paid",
        paystack_reference: reference, // Ensure it's updated if not already
      })
      .eq("id", booking_id);

    if (updateError) {
      console.error("Error updating booking status:", updateError);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    // Deduct units_available from the car
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("car_id")
      .eq("id", booking_id)
      .single();

    if (booking?.car_id) {
      const { data: car } = await supabaseAdmin
        .from("cars")
        .select("units_available")
        .eq("id", booking.car_id)
        .single();
      
      if (car) {
        const newUnits = Math.max(0, (car.units_available ?? 1) - 1);
        await supabaseAdmin
          .from("cars")
          .update({ units_available: newUnits })
          .eq("id", booking.car_id);
      }
    }

    revalidatePath("/my-bookings");
    revalidatePath(`/cars/${booking?.car_id}`);
    console.log(`Booking ${booking_id} marked as paid and car units deducted.`);
  }

  return NextResponse.json({ status: "success" });
}
