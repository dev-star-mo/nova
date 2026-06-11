import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { booking_id, rating, comment, liked, disliked, complaints } = body;

  if (!booking_id || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid booking ID or rating" }, { status: 400 });
  }

  // Verify booking ownership and return date elapsed
  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .select("user_id, car_id, return_at, full_name")
    .eq("id", booking_id)
    .single();

  if (bErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (new Date(booking.return_at) > new Date()) {
    return NextResponse.json({ error: "Cannot review a booking before its return date elapses" }, { status: 400 });
  }

  // Insert review
  const { data: review, error: rErr } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      car_id: booking.car_id,
      booking_id,
      rating,
      comment: comment ?? null,
      liked: liked ?? null,
      disliked: disliked ?? null,
      complaints: complaints ?? null,
      user_name: booking.full_name,
    })
    .select("*")
    .single();

  if (rErr) {
    // If unique constraint violation
    if (rErr.code === "23505") {
      return NextResponse.json({ error: "You have already reviewed this booking" }, { status: 400 });
    }
    return NextResponse.json({ error: rErr.message }, { status: 400 });
  }

  return NextResponse.json(review);
}
