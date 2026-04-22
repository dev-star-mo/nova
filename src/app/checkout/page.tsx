export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

type Search = { booking?: string };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const bookingId = sp.booking;
  if (!bookingId || typeof bookingId !== "string") {
    redirect("/cars");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/?auth=checkout&booking=${encodeURIComponent(bookingId)}`);

  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();

  if (!booking || booking.user_id !== user.id) {
    redirect("/cars");
  }

  const { data: car } = await supabase
    .from("cars")
    .select(
      "id, make, model, year, slug, category, price_per_day, price_per_week, price_per_month, location, image_url, images, description, features, available, seats, transmission, fuel_type, units_available, created_at"
    )
    .eq("id", booking.car_id)
    .single();

  return <CheckoutClient booking={booking} car={car} />;
}
