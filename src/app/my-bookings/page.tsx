export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MyBookingsClient } from "@/components/booking/MyBookingsClient";
import type { Review } from "@/types/database";

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: rows } = await supabase
    .from("bookings")
    .select(
      "id, status, total_amount, pickup_at, return_at, car_id, pickup_location, dropoff_location, destination, driving_mode, special_requests, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const bookingIds = (rows ?? []).map((r) => r.id);
  const { data: reviews } = bookingIds.length > 0 
    ? await supabase.from("reviews").select("*").in("booking_id", bookingIds)
    : { data: [] };

  const carIds = [...new Set((rows ?? []).map((r) => r.car_id))];
  const { data: cars } =
    carIds.length > 0
      ? await supabase
          .from("cars")
          .select(
            "id, make, model, year, price_per_day, price_per_week, price_per_month, location, image_url, images, description, features, available, seats, transmission, fuel_type, units_available, slug, created_at"
          )
          .in("id", carIds)
      : { data: [] };

  const carMap = Object.fromEntries((cars ?? []).map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">My bookings</h1>
      <p className="mt-2 text-slate-600">Track reservations and continue payment if needed.</p>

      <MyBookingsClient
        initialBookings={(rows ?? []) as Parameters<typeof MyBookingsClient>[0]["initialBookings"]}
        carMap={carMap as Parameters<typeof MyBookingsClient>[0]["carMap"]}
        initialReviews={(reviews ?? []) as Review[]}
      />
    </div>
  );
}
