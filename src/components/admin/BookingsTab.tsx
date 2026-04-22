"use client";

import { useState } from "react";
import type { Booking } from "@/types/database";

type Props = { bookings: (Booking & { car_make?: string; car_model?: string })[] };

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export function BookingsTab({ bookings }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<(Booking & { car_make?: string; car_model?: string }) | null>(null);

  const statuses = ["all", ...Array.from(new Set(bookings.map((b) => b.status)))];
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="flex h-full gap-6">
      {/* Table */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors ${filter === s
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-400"
                }`}
            >
              {s === "all" ? `All (${bookings.length})` : s}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Car</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-indigo-50/50 ${selected?.id === b.id ? "bg-indigo-50" : ""
                    }`}
                  onClick={() => setSelected(selected?.id === b.id ? null : b)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{b.full_name}</div>
                    <div className="text-xs text-slate-500">{b.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.car_make && b.car_model ? `${b.car_make} ${b.car_model}` : b.car_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <div>{new Date(b.pickup_at).toLocaleDateString('en-US')}</div>
                    <div>→ {new Date(b.return_at).toLocaleDateString('en-US')}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    KSh {Number(b.total_amount).toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[b.status] ?? "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="p-12 text-center text-slate-400">No bookings found.</p>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <aside className="w-80 flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Booking Details</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
          </div>
          <div className="space-y-3 text-sm">
            <DetailRow label="Booking ID" value={selected.id.slice(0, 12) + "…"} />
            <DetailRow label="Status">
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[selected.status] ?? "bg-slate-100"}`}>
                {selected.status}
              </span>
            </DetailRow>
            <hr className="border-slate-100" />
            <DetailRow label="Customer" value={selected.full_name} />
            <DetailRow label="Email" value={selected.email} />
            <DetailRow label="Phone" value={selected.phone} />
            <hr className="border-slate-100" />
            <DetailRow label="Car"
              value={selected.car_make ? `${selected.car_make} ${selected.car_model}` : selected.car_id}
            />
            <DetailRow label="Pickup" value={new Date(selected.pickup_at).toLocaleString()} />
            <DetailRow label="Return" value={new Date(selected.return_at).toLocaleString()} />
            <DetailRow label="Duration" value={selected.rental_duration} />
            <DetailRow label="Driving mode" value={selected.driving_mode} />
            <DetailRow label="Pickup location" value={selected.pickup_location ?? "—"} />
            <DetailRow label="Drop-off" value={selected.dropoff_location ?? "—"} />
            {selected.special_requests && (
              <DetailRow label="Special requests" value={selected.special_requests} />
            )}
            <hr className="border-slate-100" />
            <DetailRow label="Total" value={`KSh ${Number(selected.total_amount).toLocaleString()}`} />
            <DetailRow label="Paystack ref" value={selected.paystack_reference ?? "—"} />
            <DetailRow label="Booked at" value={new Date(selected.created_at).toLocaleString()} />
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <a
              href={`mailto:${selected.email}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              ✉️ Email customer
            </a>
            <a
              href={`https://wa.me/${selected.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                `Hello ${selected.full_name}, regarding your NovaDrive booking (Ref: ${selected.paystack_reference ?? selected.id.slice(0, 8)})…`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              💬 WhatsApp customer
            </a>
          </div>
        </aside>
      )}
    </div>
  );
}

function DetailRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-900 text-right font-medium break-all">{children ?? value}</span>
    </div>
  );
}
