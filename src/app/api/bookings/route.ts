import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Email must match your signed-in account email." },
      { status: 400 }
    );
  }

  const {
    car_id,
    full_name,
    phone,
    pickup_at,
    return_at,
    pickup_location,
    dropoff_location,
    rental_duration,
    driving_mode,
    special_requests,
    total_amount,
  } = body;

  if (!car_id || !full_name || !phone || !pickup_at || !return_at || !rental_duration || !driving_mode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check availability
  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("available, units_available")
    .eq("id", car_id)
    .single();

  if (carError || !car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  if (!car.available || (car.units_available ?? 0) <= 0) {
    return NextResponse.json({ error: "This car is currently unavailable for booking." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      car_id,
      full_name: String(full_name).trim(),
      phone: String(phone).trim(),
      email: user.email,
      pickup_at,
      return_at,
      pickup_location: pickup_location || null,
      dropoff_location: dropoff_location || null,
      rental_duration: String(rental_duration),
      driving_mode: String(driving_mode),
      special_requests: special_requests || null,
      total_amount: Number(total_amount),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id });
}
