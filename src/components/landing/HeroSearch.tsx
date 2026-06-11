"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
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
    <section className="relative min-h-[90vh] overflow-hidden bg-onyx-950 text-white flex items-center">
      <div className="absolute inset-0 z-0 scale-110">
        <div className="absolute inset-0 bg-gradient-to-r from-onyx-950 via-onyx-950/80 to-transparent z-10" />
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=60')] bg-cover bg-center opacity-50 mix-blend-luminosity"
        />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-xs font-bold uppercase tracking-[0.2em] text-brand-400">
              Luxury On Wheels
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] sm:text-6xl lg:text-7xl text-white">
              NovaDrive <span className="text-brand-600">Logistics</span>
            </h1>
            <p className="mt-8 text-xl text-slate-300 leading-relaxed max-w-2xl">
              Experience the pinnacle of automotive excellence. We provide bespoke rental solutions
              tailored for those who demand performance, comfort, and distinction.
            </p>

            <div className="mt-12 flex flex-wrap gap-5">
              <button
                type="button"
                onClick={book}
                className="rounded-full bg-brand-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-brand-600/20 transition-all hover:bg-brand-700 hover:scale-105 active:scale-95"
              >
                Book Your Experience
              </button>
              <a
                href="#fleet"
                className="rounded-full border border-white/20 bg-white/5 px-10 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Explore Fleet
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 rounded-[2rem] border border-white/10 bg-onyx-900/40 p-1.5 backdrop-blur-xl max-w-4xl"
        >
          <div className="flex flex-col md:flex-row gap-2 p-2">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                className="w-full rounded-2xl border-none bg-white/10 px-12 py-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-600/50 outline-none"
                placeholder="Search by model or manufacturer..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    search();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={search}
              className="rounded-2xl bg-white px-10 py-4 text-sm font-bold text-onyx-900 transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              Search Vehicles
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 opacity-50">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
        <div className="h-10 w-[1px] bg-gradient-to-b from-white to-transparent" />
      </div>
    </section>
  );
}
