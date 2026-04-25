import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeRentalTotal, rentalDays } from "@/lib/pricing";
import type { Car } from "@/types/database";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the booking – confirm it belongs to this user
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, user_id, status, car_id, driving_mode")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending bookings can be edited." },
      { status: 400 }
    );
  }

  const body = await req.json() as {
    pickup_at?: string;
    return_at?: string;
    pickup_location?: string;
    dropoff_location?: string;
    destination?: string;
    driving_mode?: string;
    special_requests?: string;
  };

  const {
    pickup_at,
    return_at,
    pickup_location,
    dropoff_location,
    destination,
    driving_mode,
    special_requests,
  } = body;

  if (!pickup_at || !return_at) {
    return NextResponse.json(
      { error: "pickup_at and return_at are required" },
      { status: 400 }
    );
  }

  const pickupDate = new Date(pickup_at);
  const returnDate = new Date(return_at);

  if (returnDate <= pickupDate) {
    return NextResponse.json(
      { error: "Return must be after pickup." },
      { status: 400 }
    );
  }

  // Get car to recalculate price
  const { data: car, error: carErr } = await supabase
    .from("cars")
    .select("id, make, model, year, slug, price_per_day, price_per_week, price_per_month, location, image_url, images, description, features, available, seats, transmission, fuel_type, units_available, created_at")
    .eq("id", booking.car_id)
    .single();

  if (carErr || !car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  const effectiveDriving = driving_mode ?? booking.driving_mode;
  let total = computeRentalTotal(car as Car, pickupDate, returnDate);
  if (effectiveDriving === "Chauffeured") {
    total = Math.round(total * 1.35 * 100) / 100;
  }

  const days = rentalDays(pickupDate, returnDate);
  const rental_duration = `${days} ${days === 1 ? "day" : "days"}`;

  const { data: updated, error: updateErr } = await supabase
    .from("bookings")
    .update({
      pickup_at,
      return_at,
      pickup_location: pickup_location ?? null,
      dropoff_location: dropoff_location ?? null,
      destination: destination !== undefined ? String(destination).trim() : undefined,
      driving_mode: effectiveDriving,
      special_requests: special_requests ?? null,
      total_amount: total,
      rental_duration,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json(updated);
}
