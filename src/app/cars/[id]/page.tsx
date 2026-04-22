export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CarDetailActions } from "@/components/cars/CarDetailActions";
import { CarImageGallery } from "@/components/cars/CarImageGallery";
import { ReviewSection } from "@/components/cars/ReviewSection";
import type { Car } from "@/types/database";

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: car } = await supabase.from("cars").select("*").eq("id", id).single();

  if (!car) notFound();
  const c = car as Car;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/cars" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to fleet
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <CarImageGallery
          make={c.make}
          model={c.model}
          image_url={c.image_url}
          images={c.images}
          soldOut={c.units_available === 0}
        />
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            {c.make} {c.model}
          </h1>
          <p className="mt-1 text-slate-500">{c.year} · {c.location}</p>
          <p className="mt-4 text-slate-600">{c.description || "Premium rental vehicle."}</p>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Key features
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            {(c.features?.length ? c.features : ["Well maintained", "Roadside support"]).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <dl className="mt-8 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <dt>Per day</dt>
              <dd className="font-semibold">Ksh. {Number(c.price_per_day).toLocaleString()}</dd>
            </div>
            {c.price_per_week != null && (
              <div className="flex justify-between">
                <dt>Per week</dt>
                <dd className="font-semibold">Ksh. {Number(c.price_per_week).toLocaleString()}</dd>
              </div>
            )}
            {c.price_per_month != null && (
              <div className="flex justify-between">
                <dt>Per month</dt>
                <dd className="font-semibold">Ksh. {Number(c.price_per_month).toLocaleString()}</dd>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <dt>Seats / transmission / fuel</dt>
              <dd>
                {c.seats} · {c.transmission} · {c.fuel_type}
              </dd>
            </div>
          </dl>
          <CarDetailActions car={c} />
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection carId={c.id} />
    </div>
  );
}
