"use client";

import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";

export function OffersSection() {
  return (
    <section id="offers" className="py-16 bg-gradient-to-r from-brand-700 to-brand-600 text-white">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Seasonal offers</h2>
        <p className="mx-auto mt-3 max-w-2xl text-brand-100">
          Weekend bundles and corporate packages — ask our team for the latest promotions when you
          book.
        </p>
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
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold text-ink">Ready to experience our services?</h2>
        <p className="mt-4 text-lg text-slate-600">
          Join thousands of satisfied customers who trust NovaDrive for their car rental needs. Book
          now and experience the difference.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={book}
            className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Book Now
          </button>
          <a
            href="#contact"
            className="rounded-full border-2 border-slate-200 px-8 py-3 text-sm font-semibold text-slate-800 hover:border-brand-300"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
