"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";

export function HeroSearch() {
  const router = useRouter();
  const { user } = useUserSession();
  const { openBooking, openAuth } = useAppUI();
  const [name, setName] = useState("");

  const search = () => {
    const q = new URLSearchParams();
    if (name) q.set("name", name);
    router.push(`/cars?${q.toString()}`);
  };

  const book = () => {
    if (!user) {
      openAuth("gate");
      return;
    }
    openBooking(null);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 text-white">
      <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=60')] bg-cover bg-center mix-blend-overlay" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-200">
            Logistics & mobility
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            NovaDrive CarLink Solutions
          </h1>
          <p className="mt-6 text-lg text-slate-200 leading-relaxed">
            We specialize in efficient point-to-point movement of goods and logistics services. Our
            expertise ensures timely and cost-effective delivery solutions for your business needs.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={book}
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-brand-900 shadow-lg hover:bg-brand-50"
            >
              Book Now
            </button>
            <a
              href="#fleet"
              className="rounded-full border-2 border-white/40 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              View our fleet
            </a>
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md sm:p-6">
          <p className="text-sm font-medium text-brand-100">Find a vehicle</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              className="rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 sm:col-span-3"
              placeholder="Search by vehicle name (e.g. BMW, Toyota...)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
            />
            <button
              type="button"
              onClick={search}
              className="rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-400"
            >
              Search cars
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
