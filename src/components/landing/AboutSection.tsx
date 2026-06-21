"use client";

import Link from "next/link";

import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-onyx-900 leading-tight">
                Crafting Extraordinary <br />
                <span className="text-brand-600">Journeys Since 2020</span>
              </h2>
              <p className="mt-8 text-lg text-muted leading-relaxed">
                NovaDrive offers a meticulously curated selection of vehicles, from high-performance
                sports cars to reliable SUVs. We believe that a rental is more than
                just a car — it&apos;s a statement of style and a commitment to quality.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-3xl font-bold text-onyx-900">500+</p>
                  <p className="mt-1 text-sm text-muted font-medium uppercase tracking-wider">Premium Miles</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-onyx-900">24/7</p>
                  <p className="mt-1 text-sm text-muted font-medium uppercase tracking-wider">Elite Support</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-brand-600/10 mix-blend-multiply z-10" />
              <img
                src="/cars_front.webp"
                alt="Luxury Car Interior"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute -bottom-6 -right-6 h-32 w-32 border-r-4 border-b-4 border-brand-600 rounded-br-[2rem] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
