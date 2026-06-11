export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContractClient } from "@/components/contract/ContractClient";

type Search = { booking?: string };

// Server component: authenticates user and pre-fetches booking + car data
export default async function ContractPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const bookingId = sp.booking;

  // Redirect to cars page if no booking ID provided
  if (!bookingId || typeof bookingId !== "string") {
    redirect("/cars");
  }

  const supabase = await createClient();

  // Ensure user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/?auth=contract&booking=${encodeURIComponent(bookingId)}`);

  // Fetch the booking record
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  // Ensure booking exists and belongs to the authenticated user
  if (!booking || booking.user_id !== user.id) {
    redirect("/cars");
  }

  // If the booking is already paid, skip contract and go to checkout
  if (booking.status === "paid") {
    redirect(`/checkout?booking=${encodeURIComponent(bookingId)}`);
  }

  // Fetch the associated car details
  const { data: car } = await supabase
    .from("cars")
    .select(
      "id, make, model, year, slug, category, price_per_day, price_per_week, price_per_month, location, image_url, images, description, features, available, seats, transmission, fuel_type, units_available, created_at"
    )
    .eq("id", booking.car_id)
    .single();

  return <ContractClient booking={booking} car={car} />;
}
