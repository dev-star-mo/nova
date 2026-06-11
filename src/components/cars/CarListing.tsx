"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Users,
  Settings,
  Fuel,
  ChevronRight,
  CheckCircle2,
  Filter,
  Car as CarIcon
} from "lucide-react";
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

const categoryStyle: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  small_car: { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-900", iconBg: "bg-brand-100" },
  mid_sized_car: { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-900", iconBg: "bg-brand-100" },
  suv: { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-900", iconBg: "bg-brand-100" },
  luxury: { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-900", iconBg: "bg-brand-100" },
  corporate_group: { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-900", iconBg: "bg-brand-100" },
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
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-brand-600 mb-4 font-bold text-sm uppercase tracking-[0.2em]">
          <span className="h-[2px] w-8 bg-brand-600" />
          Elite Mobility
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl font-bold text-onyx-950 tracking-tight">Our <span className="text-brand-600">Premium</span> Fleet</h1>
            <p className="mt-4 text-slate-500 text-lg max-w-2xl">Discover an unparalleled selection of high-end vehicles tailored for the discerning traveler across Kenya.</p>
          </div>
          {initialFrom && initialTo && (
            <div className="rounded-2xl bg-brand-50 border border-brand-100 px-5 py-3 text-sm font-medium text-brand-900 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              Requested window: <span className="font-bold">{initialFrom}</span> → <span className="font-bold">{initialTo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Selection */}
      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-6 py-2.5 text-sm font-bold tracking-wide transition-all duration-300 border ${activeCategory === "all"
            ? "bg-onyx-950 text-white border-onyx-950 shadow-xl scale-105"
            : "bg-white text-slate-600 border-slate-200 hover:border-brand-600 hover:text-brand-600"
            }`}
        >
          All Vehicles
        </button>
        {CAR_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`rounded-full px-6 py-2.5 text-sm font-bold tracking-wide border transition-all duration-300 ${isActive
                ? "bg-brand-600 text-white border-transparent shadow-xl scale-105"
                : "bg-white text-slate-600 border-slate-200 hover:border-brand-600 hover:text-brand-600"
                }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Modern Filter Section */}
      <div className="mb-16 rounded-[2.5rem] bg-onyx-950 p-8 shadow-2xl border border-onyx-800">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              className="w-full rounded-2xl bg-onyx-900 border border-onyx-800 px-10 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
              placeholder="Search make or model..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              className="w-full rounded-2xl bg-onyx-900 border border-onyx-800 px-10 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
              placeholder="Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="relative">
            <Settings className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              className="w-full appearance-none rounded-2xl bg-onyx-900 border border-onyx-800 px-10 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all cursor-pointer"
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
            >
              <option value="">Any Transmission</option>
              {transmissions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="relative">
            <Fuel className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              className="w-full appearance-none rounded-2xl bg-onyx-900 border border-onyx-800 px-10 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all cursor-pointer"
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
            >
              <option value="">Any Fuel Type</option>
              {fuels.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-sm font-bold text-brand-600">KSh</span>
            <input
              type="number"
              className="w-full rounded-2xl bg-onyx-900 border border-onyx-800 px-12 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Grouped car sections */}
      {grouped.length === 0 && (
        <div className="py-24 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-6">
            <CarIcon className="h-10 w-10" />
          </div>
          <p className="text-slate-500 text-xl font-medium tracking-tight">No vehicles found matching your criteria.</p>
          <button onClick={() => { setQ(""); setLocation(""); setTransmission(""); setFuel(""); setMaxPrice(""); setActiveCategory("all"); }} className="mt-4 text-brand-600 font-bold hover:underline">Clear all filters</button>
        </div>
      )}

      <div className="space-y-24">
        {grouped.map(({ category, cars: groupCars }) => {
          const catMeta = CAR_CATEGORIES.find((c) => c.value === category);
          const style = categoryStyle[category] ?? categoryStyle.small_car;

          return (
            <section key={category} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg} ${style.text} shadow-sm`}>
                    <CarIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-onyx-950 tracking-tight">{catMeta?.label ?? "Vehicles"}</h2>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">{groupCars.length} options available</p>
                  </div>
                </div>
                <div className="h-[1px] flex-1 bg-slate-100 mx-8 hidden md:block" />
              </div>

              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {groupCars.map((car) => {
                  const isAvailable = car.available && (car.units_available ?? 0) > 0;
                  const img = car.image_url || car.images?.[0] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80";

                  return (
                    <article
                      key={car.id}
                      className="premium-card group flex flex-col h-full rounded-[2.5rem] bg-white overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.04)]"
                    >
                      {/* Image Area */}
                      <div className="relative aspect-[16/11] overflow-hidden">
                        <Image
                          src={img}
                          alt={`${car.make} ${car.model}`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized={img.includes("unsplash.com")}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-onyx-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Tags */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-onyx-950 shadow-sm border border-white/20">
                            {car.year}
                          </span>
                        </div>

                        {!isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-onyx-950/60 backdrop-blur-[4px]">
                            <span className="rounded-full bg-red-600 px-6 py-2 text-sm font-bold uppercase tracking-widest text-white shadow-2xl">Fully Booked</span>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="flex flex-1 flex-col p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="h-1 w-4 bg-brand-600 rounded-full" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">{catMeta?.label}</span>
                            </div>
                            <h3 className="font-display text-2xl font-bold text-onyx-950 group-hover:text-brand-600 transition-colors">
                              {car.make} {car.model}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-onyx-950">Ksh. {Number(car.price_per_day).toLocaleString()}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Per Day</div>
                          </div>
                        </div>

                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6">
                          {car.description || "Experience supreme comfort and performance with this meticulously maintained vehicle."}
                        </p>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-8">
                          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-3 text-onyx-950 group/spec transition-colors hover:bg-brand-50">
                            <Users className="h-4 w-4 mb-2 text-slate-400 group-hover/spec:text-brand-600" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{car.seats} Seats</span>
                          </div>
                          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-3 text-onyx-950 group/spec transition-colors hover:bg-brand-50">
                            <Settings className="h-4 w-4 mb-2 text-slate-400 group-hover/spec:text-brand-600" />
                            <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">{car.transmission}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-3 text-onyx-950 group/spec transition-colors hover:bg-brand-50">
                            <Fuel className="h-4 w-4 mb-2 text-slate-400 group-hover/spec:text-brand-600" />
                            <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">{car.fuel_type}</span>
                          </div>
                        </div>

                        {/* Action Area */}
                        <div className="mt-auto flex gap-3">
                          <button
                            type="button"
                            onClick={() => isAvailable && book(car)}
                            disabled={!isAvailable}
                            className={`group/btn relative flex-[2] overflow-hidden rounded-2xl py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${isAvailable
                              ? "bg-brand-600 text-white shadow-[0_10px_20px_rgba(197,160,89,0.2)] hover:shadow-[0_15px_30px_rgba(197,160,89,0.3)] hover:-translate-y-1"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              {isAvailable ? (
                                <>Reserve Now <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" /></>
                              ) : "Unavailable"}
                            </span>
                          </button>
                          <Link
                            href={`/cars/${car.id}`}
                            className="flex-1 rounded-2xl border-2 border-slate-100 bg-white py-4 text-center text-[10px] font-extrabold uppercase tracking-widest text-onyx-950 hover:border-brand-600 hover:text-brand-600 transition-all duration-300"
                          >
                            Details
                          </Link>
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
    </div>
  );
}
