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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const admin = createAdminClient();
  const ext = file.name.split(".").pop();
  const path = `cars/${id}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("car-images")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from("car-images").getPublicUrl(path);

  // Append to car's images array
  const { data: car } = await admin.from("cars").select("images, image_url").eq("id", id).single();
  const existingImages: string[] = car?.images ?? [];
  const newImages = [...existingImages, publicUrl];
  const isFirst = existingImages.length === 0;

  await admin.from("cars").update({
    images: newImages,
    ...(isFirst ? { image_url: publicUrl } : {}),
  }).eq("id", id);

  return NextResponse.json({ url: publicUrl });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { imageUrl } = await req.json();
  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: car, error: fetchError } = await admin
    .from("cars")
    .select("images, image_url")
    .eq("id", id)
    .single();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });

  const existingImages: string[] = car?.images ?? [];
  const newImages = existingImages.filter((u) => u !== imageUrl);
  const nextPrimary = newImages[0] ?? null;

  const { error: updateError } = await admin
    .from("cars")
    .update({
      images: newImages,
      image_url: car?.image_url === imageUrl ? nextPrimary : car?.image_url,
    })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  if (imageUrl.includes("/storage/v1/object/public/car-images/")) {
    const key = imageUrl.split("/storage/v1/object/public/car-images/")[1];
    if (key) {
      await admin.storage.from("car-images").remove([key]);
    }
  }

  return NextResponse.json({ success: true, images: newImages, image_url: nextPrimary });
}
