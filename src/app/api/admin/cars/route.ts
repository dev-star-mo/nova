import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("cars").select("*").order("make");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cars")
    .insert({
      make: body.make,
      model: body.model,
      year: Number(body.year),
      price_per_day: Number(body.price_per_day),
      price_per_week: body.price_per_week ? Number(body.price_per_week) : null,
      price_per_month: body.price_per_month ? Number(body.price_per_month) : null,
      location: body.location,
      seats: Number(body.seats),
      transmission: body.transmission,
      fuel_type: body.fuel_type,
      description: body.description || null,
      available: body.available ?? true,
      slug: body.slug || null,
      category: body.category || "small_car",
      image_url: body.image_url || null,
      images: body.images || null,
      features: body.features || null,
      units_available: body.units_available !== undefined ? Number(body.units_available) : 1,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
