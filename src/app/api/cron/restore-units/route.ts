import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * GET /api/cron/restore-units
 *
 * Called by the Netlify Scheduled Function (netlify/functions/cron-restore-units.mts)
 * on a daily schedule, or manually by an admin.
 * Finds all paid bookings whose return_at has passed and whose
 * units have NOT yet been restored, then increments the car's
 * units_available by 1 for each such booking.
 *
 * Security: requires Authorization: Bearer <CRON_SECRET> header.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Find expired, paid bookings that haven't had their units restored yet
  const { data: bookings, error: fetchError } = await supabase
    .from("bookings")
    .select("id, car_id")
    .eq("status", "paid")
    .eq("units_restored", false)
    .lt("return_at", now);

  if (fetchError) {
    console.error("[restore-units] Failed to fetch bookings:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ processed: 0, message: "No expired bookings to restore." });
  }

  const results: { bookingId: string; carId: string; success: boolean }[] = [];

  for (const booking of bookings) {
    const { car_id, id: bookingId } = booking;

    // Fetch current units_available for this car
    const { data: car, error: carFetchError } = await supabase
      .from("cars")
      .select("units_available")
      .eq("id", car_id)
      .single();

    if (carFetchError || !car) {
      console.error(`[restore-units] Could not fetch car ${car_id}:`, carFetchError);
      results.push({ bookingId, carId: car_id, success: false });
      continue;
    }

    const newUnits = (car.units_available ?? 0) + 1;

    // Increment car units
    const { error: carUpdateError } = await supabase
      .from("cars")
      .update({ units_available: newUnits })
      .eq("id", car_id);

    if (carUpdateError) {
      console.error(`[restore-units] Failed to update car ${car_id}:`, carUpdateError);
      results.push({ bookingId, carId: car_id, success: false });
      continue;
    }

    // Mark booking as restored so this never runs twice
    const { error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({ units_restored: true })
      .eq("id", bookingId);

    if (bookingUpdateError) {
      console.error(`[restore-units] Failed to mark booking ${bookingId} restored:`, bookingUpdateError);
      results.push({ bookingId, carId: car_id, success: false });
      continue;
    }

    revalidatePath(`/cars/${car_id}`);
    results.push({ bookingId, carId: car_id, success: true });
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`[restore-units] Processed ${successCount}/${bookings.length} bookings.`);

  return NextResponse.json({
    processed: successCount,
    failed: bookings.length - successCount,
    details: results,
  });
}
