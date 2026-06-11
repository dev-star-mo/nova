"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  ShieldCheck,
  Zap,
  Headphones,
  MapPin,
  Users,
  Gem
} from "lucide-react";

const tiles = [
  { icon: <Calendar className="h-6 w-6" />, title: "Elite Flexibility", desc: "Change plans with bespoke policies designed around your schedule." },
  { icon: <Gem className="h-6 w-6" />, title: "Curated Fleet", desc: "Pristine, late-model vehicles meticulously inspected for perfection." },
  { icon: <Zap className="h-6 w-6" />, title: "Swift Reservation", desc: "Our streamlined digital concierge secures your vehicle in seconds." },
  { icon: <Headphones className="h-6 w-6" />, title: "Personal Support", desc: "Dedicated lifestyle managers available around the clock for your needs." },
  { icon: <MapPin className="h-6 w-6" />, title: "Global Access", desc: "Seamless pickup and return experiences at premier locations." },
  { icon: <Users className="h-6 w-6" />, title: "Corporate Solutions", desc: "Tailored mobility packages for distinguishing business needs." },
  { icon: <ShieldCheck className="h-6 w-6" />, title: "Full Coverage", desc: "Comprehensive protection plans for complete peace of mind." },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-onyx-900">Exceptional Services</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Beyond the drive, we offer a comprehensive suite of services dedicated to
            elevating your mobility experience.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tiles.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="premium-card group relative overflow-hidden rounded-[2rem] bg-white p-8"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                {t.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-onyx-900">{t.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t.desc}</p>
            </motion.div> //how does this motion.div work?
          ))}
        </div>
      </div>
    </section>
  );
}
