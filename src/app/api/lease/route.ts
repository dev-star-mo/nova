import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const brand = String(body.brand ?? "").trim();
  const model = String(body.model ?? "").trim();
  const year = Number(body.year);
  const mileage_km = Number(body.mileage_km);
  const lease_duration_months = Number(body.lease_duration_months);
  const image_urls = (body.image_urls as string[]) ?? [];
  const phone_numbers = (body.phone_numbers as string[]) ?? [];
  const user_full_name = String(body.user_full_name ?? "").trim();
  const user_email = String(body.user_email ?? "").trim();

  if (!brand || !model || !Number.isFinite(year) || !Number.isFinite(mileage_km)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lease_requests")
    .insert({
      user_id: user.id,
      brand,
      model,
      year,
      mileage_km,
      lease_duration_months,
      image_url: image_urls[0] ?? null,
      // Columns are TEXT in the DB, so serialize arrays as JSON strings
      image_urls: JSON.stringify(image_urls),
      phone_numbers: JSON.stringify(phone_numbers),
      user_full_name,
      user_email,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Lease request insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id });
}
