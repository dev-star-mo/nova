"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import type { Car, CarCategory } from "@/types/database";
import { CAR_CATEGORIES } from "@/types/database";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";

type Props = {
  initialCars: Car[];
  initialQuery?: string;
  initialLocation?: string;
  initialFrom?: string;
  initialTo?: string;
};

const categoryColor: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  small_car: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", accent: "bg-sky-600" },
  mid_sized_car: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", accent: "bg-violet-600" },
  suv: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", accent: "bg-amber-600" },
  luxury: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", accent: "bg-rose-600" },
  corporate_group: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", accent: "bg-teal-600" },
};

const normalizedCategory = (car: Car): CarCategory => (car.category ?? "small_car") as CarCategory;

export function CarListing({
  initialCars,
  initialQuery = "",
  initialLocation = "",
  initialFrom = "",
  initialTo = "",
}: Props) {
  const [cars] = useState(initialCars);
  const [q, setQ] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [transmission, setTransmission] = useState("");
  const [fuel, setFuel] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [activeCategory, setActiveCategory] = useState<CarCategory | "all">("all");
  const { user } = useUserSession();
  const { openAuth, openBooking } = useAppUI();

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cars.filter((c) => {
      if (term && !`${c.make} ${c.model} ${c.description ?? ""}`.toLowerCase().includes(term)) return false;
      if (location && !c.location.toLowerCase().includes(location.trim().toLowerCase())) return false;
      if (transmission && c.transmission !== transmission) return false;
      if (fuel && c.fuel_type !== fuel) return false;
      if (maxPrice !== "" && Number(c.price_per_day) > maxPrice) return false;
      if (activeCategory !== "all" && normalizedCategory(c) !== activeCategory) return false;
      return true;
    });
  }, [cars, q, location, transmission, fuel, maxPrice, activeCategory]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (activeCategory !== "all") {
      return [{ category: activeCategory, cars: filtered }];
    }
    const groups: { category: CarCategory; cars: Car[] }[] = [];
    for (const cat of CAR_CATEGORIES) {
      const catCars = filtered.filter((c) => normalizedCategory(c) === cat.value);
      if (catCars.length > 0) {
        groups.push({ category: cat.value, cars: catCars });
      }
    }
    return groups;
  }, [filtered, activeCategory]);

  const book = (car: Car) => {
    if (!user) { openAuth("gate"); return; }
    openBooking(car);
  };

  const transmissions = useMemo(() => [...new Set(cars.map((c) => c.transmission))].sort(), [cars]);
  const fuels = useMemo(() => [...new Set(cars.map((c) => c.fuel_type))].sort(), [cars]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-2 text-sm text-slate-500">
        {initialFrom && initialTo && (
          <span>Requested window: {initialFrom} → {initialTo}</span>
        )}
      </div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-extrabold text-slate-900 tracking-tight">Our Fleet</h1>
        <p className="mt-2 text-slate-500 text-lg">Find the perfect vehicle for your journey across Kenya.</p>
      </div>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold border transition-all ${activeCategory === "all"
            ? "bg-slate-900 text-white border-slate-900 shadow-md"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
        >
          🚘 All Vehicles
        </button>
        {CAR_CATEGORIES.map((cat) => {
          const col = categoryColor[cat.value];
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition-all ${isActive
                ? `${col.accent} text-white border-transparent shadow-md scale-105`
                : `bg-white ${col.text} ${col.border} hover:${col.bg}`
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-10 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-5">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="🔍 Search by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="📍 Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={transmission}
          onChange={(e) => setTransmission(e.target.value)}
        >
          <option value="">Any transmission</option>
          {transmissions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={fuel}
          onChange={(e) => setFuel(e.target.value)}
        >
          <option value="">Any fuel</option>
          {fuels.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <input
          type="number"
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Max price / day (KSh)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>

      {/* Grouped car sections */}
      {grouped.length === 0 && (
        <p className="mt-12 text-center text-slate-500 text-lg">No vehicles match your filters.</p>
      )}

      {grouped.map(({ category, cars: groupCars }) => {
        const catMeta = CAR_CATEGORIES.find((c) => c.value === category);
        const col = categoryColor[category] ?? categoryColor.small_car;

        return (
          <section key={category} className="mb-14">
            {/* Category section header */}
            <div className={`mb-5 flex items-center gap-3 rounded-2xl border ${col.border} ${col.bg} px-5 py-4`}>
              <span className="text-3xl">{catMeta?.icon ?? "🚗"}</span>
              <div>
                <h2 className={`text-xl font-bold ${col.text}`}>{catMeta?.label ?? "Vehicles"}</h2>
                <p className="text-sm text-slate-500">{groupCars.length} vehicle{groupCars.length !== 1 ? "s" : ""} available</p>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {groupCars.map((car) => {
                const isAvailable = car.available && (car.units_available ?? 0) > 0;
                const img = car.image_url || car.images?.[0] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80";

                const alternatives = isAvailable
                  ? []
                  : cars
                    .filter((c) => c.id !== car.id && c.available && (c.units_available ?? 0) > 0)
                    .filter((c) => Math.abs(c.price_per_day - car.price_per_day) <= car.price_per_day * 0.3)
                    .slice(0, 2);

                return (
                  <article
                    key={car.id}
                    className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${!isAvailable ? "opacity-75" : ""
                      }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                      <Image
                        src={img}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized={img.includes("unsplash.com")}
                      />
                      {/* Category tag */}
                      <span className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${col.bg} ${col.text} border ${col.border}`}>
                        {catMeta?.icon} {catMeta?.label ?? "Car"}
                      </span>
                      {/* Availability overlay */}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                          <span className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg">Unavailable</span>
                        </div>
                      )}
                      {/* Photo count */}
                      {(car.images?.length ?? 0) > 1 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                          {car.images!.length} photos
                        </span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-lg font-bold text-slate-900">
                            {car.make} {car.model}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>📍</span> {car.location}
                          </p>
                        </div>
                        {isAvailable && (
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            Available
                          </span>
                        )}
                      </div>

                      <p className="mt-2.5 text-sm text-slate-600 line-clamp-2">{car.description}</p>

                      {/* Feature chips */}
                      <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                        <li className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{car.seats} seats</li>
                        <li className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{car.transmission}</li>
                        <li className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{car.fuel_type}</li>
                      </ul>

                      {/* Price + CTA */}
                      <div className="mt-auto pt-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xl font-extrabold text-slate-900">
                              Ksh. {Number(car.price_per_day).toLocaleString("en-US")}
                            </p>
                            <p className="text-xs text-slate-400">per day</p>
                          </div>
                          {car.price_per_week && (
                            <p className="text-xs text-slate-400">
                              Ksh. {Number(car.price_per_week).toLocaleString('en-US')} / week
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => isAvailable && book(car)}
                            disabled={!isAvailable}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${isAvailable
                              ? "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200 hover:shadow-md"
                              : "bg-slate-300 cursor-not-allowed"
                              }`}
                          >
                            {isAvailable ? "Book Now" : "Sold Out"}
                          </button>
                          <Link
                            href={`/cars/${car.id}`}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Details
                          </Link>
                        </div>

                        {/* Alternatives */}
                        {!isAvailable && alternatives.length > 0 && (
                          <div className="mt-5 border-t border-slate-100 pt-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Suggested alternatives:
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {alternatives.map((alt) => (
                                <Link
                                  key={alt.id}
                                  href={`/cars/${alt.id}`}
                                  className="group flex flex-col rounded-lg border border-slate-100 bg-slate-50 p-2 transition hover:border-indigo-200 hover:bg-indigo-50"
                                >
                                  <span className="truncate text-xs font-bold text-slate-900">{alt.make} {alt.model}</span>
                                  <span className="text-[10px] text-indigo-600">Ksh. {Number(alt.price_per_day).toLocaleString()}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
