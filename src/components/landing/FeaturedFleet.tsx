"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";
import type { Car } from "@/types/database";

export function FeaturedFleet() {
  const [cars, setCars] = useState<Car[]>([]);
  const [idx, setIdx] = useState(0);
  const [detail, setDetail] = useState<Car | null>(null);
  const { user } = useUserSession();
  const { openAuth, openBooking } = useAppUI();
  const supabase = createClient();

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("cars").select("*").eq("available", true).limit(6);
      setCars((data as Car[]) ?? []);
    })();
  }, [supabase]);

  const n = cars.length;
  const prev = useCallback(() => setIdx((i) => (i - 1 + n) % n), [n]);
  const next = useCallback(() => setIdx((i) => (i + 1) % n), [n]);

  useEffect(() => {
    if (n <= 1) return;
    const timer = window.setInterval(() => {
      setIdx((i) => (i + 1) % n);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [n]);

  const book = (car: Car) => {
    if (!user) {
      openAuth("gate");
      return;
    }
    openBooking(car);
  };

  if (n === 0) {
    return (
      <section id="fleet" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-ink">Featured vehicles</h2>
          <p className="mt-2 text-slate-600">Fleet data will appear once your Supabase project is seeded.</p>
          <Link
            href="/cars"
            className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Browse all cars
          </Link>
        </div>
      </section>
    );
  }

  const car = cars[idx]!;
  const img =
    car.image_url ||
    car.images?.[0] ||
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80";

  return (
    <section id="fleet" className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-bold text-ink">Featured vehicles</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
          Explore a rotating selection from our premium fleet. Swipe through or use the arrows.
        </p>

        <div className="relative mx-auto mt-10 max-w-5xl">
          <div className="lift-hover overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative aspect-[4/3] bg-slate-100 md:aspect-auto md:min-h-[280px]">
                <Image
                  src={img}
                  alt={`${car.make} ${car.model}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={img.startsWith("https://images.unsplash")}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/90">
                    Featured pick
                  </p>
                  <p className="text-sm font-medium">{car.make} {car.model} • {car.year}</p>
                </div>
              </div>
              <div className="flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 p-8">
                <h3 className="font-display text-2xl font-bold text-ink">
                  {car.make} {car.model}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{car.year}</p>
                <ul className="mt-4 grid gap-2 text-sm text-slate-600">
                  <li>
                    <span className="font-medium text-ink">From</span> KSh.{" "}
                    {Number(car.price_per_day).toLocaleString()} / day
                  </li>
                  <li>
                    Seats: <span className="font-medium text-ink">{car.seats}</span>
                  </li>
                  <li>
                    Transmission:{" "}
                    <span className="font-medium text-ink">{car.transmission}</span>
                  </li>
                  <li>
                    Fuel: <span className="font-medium text-ink">{car.fuel_type}</span>
                  </li>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    Instant booking
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {car.available ? "Available now" : "Limited availability"}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => book(car)}
                    className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Book Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetail(car)}
                    className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 z-10 -translate-x-2 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-3 shadow-md hover:bg-slate-50 md:-translate-x-4"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-2 rounded-full border border-slate-200 bg-white p-3 shadow-md hover:bg-slate-50 md:translate-x-4"
            aria-label="Next"
          >
            ›
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {cars.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all duration-500 ${i === idx ? "w-8 bg-brand-600" : "w-2 bg-slate-300"}`}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/cars"
            className="rounded-full border-2 border-brand-600 bg-white px-8 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Browse all cars
          </Link>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={() => setDetail(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              onClick={() => setDetail(null)}
            >
              ✕
            </button>
            <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={detail.image_url || detail.images?.[0] || img}
                alt=""
                fill
                className="object-cover"
                unoptimized={(detail.image_url || "").startsWith("https://images.unsplash")}
              />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold">
              {detail.make} {detail.model}
            </h3>
            <p className="mt-2 text-slate-600">{detail.description || "Premium rental vehicle."}</p>
            <h4 className="mt-4 text-sm font-semibold text-ink">Key features</h4>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {(detail.features?.length ? detail.features : ["Well maintained", "Full documentation", "Roadside assistance"]).map(
                (f, i) => (
                  <li key={i}>{f}</li>
                )
              )}
            </ul>
            <div className="mt-6 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span>Per day</span>
                <span className="font-semibold">KSh. {Number(detail.price_per_day).toLocaleString()}</span>
              </div>
              {detail.price_per_week != null && (
                <div className="flex justify-between">
                  <span>Per week</span>
                  <span className="font-semibold">KSh. {Number(detail.price_per_week).toLocaleString()}</span>
                </div>
              )}
              {detail.price_per_month != null && (
                <div className="flex justify-between">
                  <span>Per month</span>
                  <span className="font-semibold">KSh. {Number(detail.price_per_month).toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDetail(null);
                  book(detail);
                }}
                className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
