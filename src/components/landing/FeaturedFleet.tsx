"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Fuel, Gauge, Users, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";
import type { Car } from "@/types/database";

export function FeaturedFleet() {
  const [cars, setCars] = useState<Car[]>([]);
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(0);
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

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setIdx((prevIdx) => (prevIdx + newDirection + n) % n);
  }, [n]);

  const prev = () => paginate(-1);
  const next = () => paginate(1);

  useEffect(() => {
    if (n <= 1) return;
    const timer = window.setInterval(() => {
      next();
    }, 8000);
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
      <section id="fleet" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-onyx-900">Featured Vehicles</h2>
          <p className="mt-4 text-muted">Fleet data will appear once your Supabase project is seeded.</p>
          <Link
            href="/cars"
            className="mt-8 inline-block rounded-full bg-brand-600 px-8 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Browse All Cars
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

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <section id="fleet" className="py-24 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold uppercase tracking-widest text-brand-600"
          >
            Our Collection
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 text-onyx-900"
          >
            Featured Vehicles
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-muted"
          >
            Experience pure convenience and performance with our hand-selected featured fleet.
          </motion.p>
        </div>

        <div className="relative mt-16 flex items-center justify-center overflow-hidden py-10">
          <div className="relative aspect-[16/9] w-full max-w-6xl overflow-visible">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={idx}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4 }
                }}
                className="absolute inset-0 flex flex-col items-center justify-center px-4"
              >
                <div className="premium-card w-full overflow-hidden rounded-[2.5rem] bg-white lg:flex">
                  <div className="relative h-64 w-full bg-slate-100 lg:h-auto lg:w-3/5">
                    <Image
                      src={img}
                      alt={`${car.make} ${car.model}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      unoptimized={img.startsWith("https://images.unsplash")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:bg-gradient-to-r" />
                  </div>

                  <div className="flex flex-col justify-center p-8 lg:w-2/5 lg:p-12">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                        {car.transmission}
                      </span>
                      <span className="rounded-full bg-onyx-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-onyx-700">
                        {car.fuel_type}
                      </span>
                    </div>

                    <h3 className="mt-4 text-3xl font-bold text-onyx-900 lg:text-4xl">
                      {car.make} {car.model}
                    </h3>

                    <div className="mt-8 grid grid-cols-3 gap-6">
                      <div className="flex flex-col items-center gap-1">
                        <Users className="h-5 w-5 text-brand-600" />
                        <span className="text-xs font-medium text-muted">{car.seats} Seats</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Zap className="h-5 w-5 text-brand-600" />
                        <span className="text-xs font-medium text-muted">{car.year}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Fuel className="h-5 w-5 text-brand-600" />
                        <span className="text-xs font-medium text-muted">{car.fuel_type}</span>
                      </div>
                    </div>

                    <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
                      <div>
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">Per Day</p>
                        <p className="text-2xl font-bold text-onyx-900">
                          $ <span className="text-brand-600">{Number(car.price_per_day).toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDetail(car)}
                          className="rounded-full border border-slate-200 p-3 text-onyx-700 transition-colors hover:bg-slate-50"
                        >
                          <Gauge className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => book(car)}
                          className="rounded-full bg-onyx-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-black hover:shadow-lg active:scale-95"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/50 bg-white/30 p-4 text-onyx-900 shadow-xl backdrop-blur-md transition-all hover:bg-white md:left-8"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/50 bg-white/30 p-4 text-onyx-900 shadow-xl backdrop-blur-md transition-all hover:bg-white md:right-8"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          {cars.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => {
                setDirection(i > idx ? 1 : -1);
                setIdx(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === idx ? "w-12 bg-brand-600" : "w-3 bg-slate-300 hover:bg-slate-400"}`}
            />
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            href="/cars"
            className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-onyx-900 transition-colors hover:text-brand-600"
          >
            Explore Complete Fleet
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setDetail(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <button
                type="button"
                className="absolute right-6 top-6 z-10 rounded-full bg-white/80 p-2 text-onyx-900 backdrop-blur-sm transition-colors hover:bg-white"
                onClick={() => setDetail(null)}
              >
                <ChevronRight className="h-6 w-6 rotate-45" />
              </button>

              <div className="grid md:grid-cols-2">
                <div className="relative aspect-square md:aspect-auto">
                  <Image
                    src={detail.image_url || detail.images?.[0] || img}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={(detail.image_url || "").startsWith("https://images.unsplash")}
                  />
                </div>
                <div className="flex flex-col p-8 lg:p-12">
                  <h3 className="text-3xl font-bold text-onyx-900">
                    {detail.make} {detail.model}
                  </h3>
                  <p className="mt-4 text-muted leading-relaxed">
                    {detail.description || "Indulge in the perfect blend of luxury, comfort, and performance. This vehicle is maintained to the highest standards, ensuring a seamless driving experience for your journey."}
                  </p>

                  <div className="mt-8 space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-onyx-900">
                      <Zap className="h-4 w-4 text-brand-600" />
                      Premium Features
                    </h4>
                    <ul className="grid grid-cols-2 gap-3">
                      {(detail.features?.length ? detail.features : ["GPS Navigation", "Leather Interior", "Premium Audio", "Safety Assist"]).map(
                        (f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted">
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                            {f}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="mt-auto pt-10">
                    <div className="flex items-end justify-between border-t border-slate-100 pt-6">
                      <div>
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">Starting at</p>
                        <p className="text-3xl font-bold text-onyx-900">
                          $ {Number(detail.price_per_day).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDetail(null);
                          book(detail);
                        }}
                        className="rounded-full bg-brand-600 px-8 py-4 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-brand-700 active:scale-95"
                      >
                        Book This Vehicle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
