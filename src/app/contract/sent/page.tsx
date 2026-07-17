import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SentPage({ searchParams }: { searchParams: Promise<{ booking?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const bookingId = resolvedSearchParams.booking;
  const admin = createAdminClient();

  let booking: any = null;
  if (bookingId) {
    const { data } = await admin.from("bookings").select("id,full_name,email").eq("id", bookingId).single();
    booking = data;
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Agreement & Payment Sent</h1>
        <p className="mt-3 text-sm text-slate-600">Your agreement and payment instructions have been sent to your email.</p>

        {booking && (
          <div className="mt-6 text-left">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500 text-center mb-1">Booking Reference</p>
              <p className="text-center font-mono font-medium text-ink">{booking.id}</p>
              <p className="text-center text-sm text-slate-500 mt-2">
                Sent to: <span className="font-medium text-ink">{booking.email}</span>
              </p>
            </div>

            <div className="mt-8 bg-slate-50 rounded-xl p-6 text-left border border-slate-100">
              <h2 className="text-lg font-semibold text-ink mb-5">Next Steps</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">1</span>
                  <div>
                    <p className="font-medium text-ink">Open your email</p>
                    <p className="text-sm text-slate-500 mt-1">Check your inbox for an email from BoldSign.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">2</span>
                  <div>
                    <p className="font-medium text-ink">Review and sign</p>
                    <p className="text-sm text-slate-500 mt-1">Follow the BoldSign link to sign your rental agreement.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">3</span>
                  <div>
                    <p className="font-medium text-ink">Receive payment link</p>
                    <p className="text-sm text-slate-500 mt-1">After signing, you will receive a secure Paystack payment link via email.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">4</span>
                  <div>
                    <p className="font-medium text-ink">Booking Confirmed</p>
                    <p className="text-sm text-slate-500 mt-1">Your booking is confirmed once payment completes.</p>
                  </div>
                </li>
              </ul>
            </div>

            <a href={`mailto:${process.env.SUPPORT_EMAIL ?? "support@company.com"}`} className="mt-6 block text-center text-sm font-medium text-brand-600 hover:underline">Contact support</a>
          </div>
        )}
      </div>
    </main>
  );
}
