export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import AdminDashboardClient from "./AdminDashboardClient";
import type { Booking, BookingWithCar } from "@/types/database";

export default async function AdminPage() {
  const admin = createAdminClient();

  // Fetch bookings with car info joined
  const { data: bookings } = await admin
    .from("bookings")
    .select(`
      id, user_id, car_id, full_name, phone, email,
      pickup_at, return_at, pickup_location, dropoff_location, destination,
      rental_duration, driving_mode, special_requests,
      total_amount, status, paystack_reference, created_at,
      cars ( make, model )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  // Fetch all cars
  const { data: cars } = await admin.from("cars").select("*").order("make");

  // Fetch lease requests
  const { data: leaseRequests } = await admin
    .from("lease_requests")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch all reviews, joined with booking and car info
  const { data: rawReviews } = await admin
    .from("reviews")
    .select(`
      id, user_id, car_id, booking_id, rating, comment, liked, disliked, complaints, created_at, user_name,
      bookings ( email, pickup_at, return_at, pickup_location, dropoff_location ),
      cars ( make, model, year )
    `)
    .order("created_at", { ascending: false });

  type RawReview = {
    id: string; user_id: string; car_id: string; booking_id: string;
    rating: number; comment: string | null; liked: string | null; disliked: string | null;
    complaints: string | null; created_at: string; user_name: string;
    bookings: { email: string; pickup_at: string; return_at: string; pickup_location: string | null; dropoff_location: string | null } | null;
    cars: { make: string; model: string; year: number } | null;
  };

  const reviews = (rawReviews ?? []).map((r) => {
    const raw = r as unknown as RawReview;
    return {
      id: raw.id, user_id: raw.user_id, car_id: raw.car_id, booking_id: raw.booking_id,
      rating: raw.rating, comment: raw.comment, liked: raw.liked, disliked: raw.disliked,
      complaints: raw.complaints, created_at: raw.created_at, user_name: raw.user_name,
      user_email: raw.bookings?.email ?? null,
      car_make: raw.cars?.make ?? null, car_model: raw.cars?.model ?? null, car_year: raw.cars?.year ?? null,
      pickup_at: raw.bookings?.pickup_at ?? null, return_at: raw.bookings?.return_at ?? null,
      pickup_location: raw.bookings?.pickup_location ?? null, dropoff_location: raw.bookings?.dropoff_location ?? null,
    };
  });

  type RawBooking = Omit<Booking, "car_make" | "car_model"> & {
    cars: { make: string; model: string } | null;
  };

  const flatBookings: BookingWithCar[] = (bookings ?? []).map((b) => {
    const raw = b as unknown as RawBooking;
    return {
      id: raw.id,
      user_id: raw.user_id,
      car_id: raw.car_id,
      full_name: raw.full_name,
      phone: raw.phone,
      email: raw.email,
      pickup_at: raw.pickup_at,
      return_at: raw.return_at,
      pickup_location: raw.pickup_location,
      dropoff_location: raw.dropoff_location,
      destination: raw.destination,
      rental_duration: raw.rental_duration,
      driving_mode: raw.driving_mode,
      special_requests: raw.special_requests,
      total_amount: raw.total_amount,
      status: raw.status,
      paystack_reference: raw.paystack_reference,
      created_at: raw.created_at,
      car_make: raw.cars?.make ?? undefined,
      car_model: raw.cars?.model ?? undefined,
    };
  });


  return (
    <AdminDashboardClient
      bookings={flatBookings}
      cars={cars ?? []}
      leaseRequests={leaseRequests ?? []}
      reviews={reviews ?? []}
    />
  );
}
