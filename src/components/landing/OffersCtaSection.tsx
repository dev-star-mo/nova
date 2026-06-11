"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";

export function OffersSection() {
  return (
    <section id="offers" className="py-20 bg-onyx-950 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-600/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Limited-Time</span>
          <h2 className="mt-4 text-white leading-tight">Seasonal Curations</h2>
          <p className="mx-auto mt-6 max-w-2xl text-slate-400">
            From exclusive weekend retreats to bespoke corporate fleet management, 
            our latest promotions are designed for the discerning traveler.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export function MidCtaSection() {
  const { user } = useUserSession();
  const { openBooking, openAuth } = useAppUI();

  const book = () => {
    if (!user) {
      openAuth("gate");
      return;
    }
    openBooking(null);
  };

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="rounded-[3rem] bg-premium-gradient p-12 lg:p-16 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
          
          <div className="relative z-10">
            <h2 className="text-white">Begin Your Exceptional Journey</h2>
            <p className="mt-6 text-lg text-slate-300">
              Join an elite community that values time, performance, and peerless service. 
              Your next destination deserves a vehicle of distinction.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <button
                type="button"
                onClick={book}
                className="rounded-full bg-brand-600 px-10 py-4 text-sm font-bold text-white transition-all hover:bg-brand-700 hover:scale-105 active:scale-95"
              >
                Inquire Now
              </button>
              <a
                href="#contact"
                className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-10 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Connect With Us
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
