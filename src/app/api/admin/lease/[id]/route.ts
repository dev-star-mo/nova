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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status, category, price_per_day, location } = await req.json();
  
  if (!["new", "reviewing", "accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (status === "accepted") {
    const { data: lease, error: leaseError } = await admin
      .from("lease_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (leaseError || !lease) {
      return NextResponse.json({ error: leaseError?.message ?? "Lease request not found" }, { status: 404 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required when accepting a lease" }, { status: 400 });
    }

    const leaseImages = Array.isArray(lease.image_urls) && lease.image_urls.length > 0
      ? lease.image_urls
      : lease.image_url
        ? [lease.image_url]
        : [];

    const { error: insertError } = await admin.from("cars").insert({
      make: lease.brand,
      model: lease.model,
      year: Number(lease.year),
      category,
      price_per_day: Number(price_per_day) > 0 ? Number(price_per_day) : 1,
      price_per_week: null,
      price_per_month: null,
      location: location || "Nairobi",
      image_url: leaseImages[0] ?? null,
      images: leaseImages,
      description: `Leased vehicle from ${lease.user_full_name ?? "partner"}.`,
      features: [],
      available: true,
      seats: 5,
      transmission: "Automatic",
      fuel_type: "Petrol",
      units_available: 1,
    });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  const { error } = await admin.from("lease_requests").update({ status }).eq("id", id);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
