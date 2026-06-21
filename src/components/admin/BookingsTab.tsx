"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  User,
  CreditCard,
  ChevronRight,
  Filter,
  X,
  MessageCircle
} from "lucide-react";
import type { Booking } from "@/types/database";

type Props = { bookings: (Booking & { car_make?: string; car_model?: string })[] };

const STATUS_CONFIG: Record<string, { bg: string, text: string, dot: string }> = {
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  confirmed: { bg: "bg-brand-50", text: "text-brand-900", dot: "bg-brand-600" },
};

export function BookingsTab({ bookings }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<(Booking & { car_make?: string; car_model?: string }) | null>(null);

  const statuses = ["all", ...Array.from(new Set(bookings.map((b) => b.status)))];
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start mb-20">
      {/* Table Section */}
      <div className="flex-1 min-w-0 w-full">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 mr-2">
            <Filter className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Filter By</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-[1.25rem] px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${filter === s
                  ? "bg-onyx-950 text-brand-600 shadow-md"
                  : "bg-white text-slate-500 hover:text-onyx-950 border border-slate-100"
                  }`}
              >
                {s === "all" ? `All Reservations (${bookings.length})` : s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/40 border border-slate-50">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Client Details</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Model Selection</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Service Window</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Investment</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((b) => {
                  const config = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  return (
                    <tr
                      key={b.id}
                      className={`group cursor-pointer transition-all hover:bg-slate-50/80 ${selected?.id === b.id ? "bg-brand-50/30" : ""
                        }`}
                      onClick={() => setSelected(selected?.id === b.id ? null : b)}
                    >
                      <td className="px-8 py-6">
                        <div className="font-bold text-onyx-950">{b.full_name}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{b.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                          <span className="text-sm font-bold text-onyx-800">
                            {b.car_make && b.car_model ? `${b.car_make} ${b.car_model}` : "Premium Model"}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{b.driving_mode}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-xs font-bold text-onyx-950">
                          {new Date(b.pickup_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          <span className="mx-2 text-slate-300">→</span>
                          {new Date(b.return_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {b.rental_duration}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="font-bold text-onyx-950">$ {Number(b.total_amount).toLocaleString('en-US')}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${config.bg} ${config.text} border border-current/10 shadow-sm`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${config.dot} animate-pulse`} />
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4 border border-dashed border-slate-200">
                <Filter className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching dossiers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Sidebar */}
      {selected && (
        <aside className="w-full lg:w-[400px] flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-500 sticky top-8">
          <div className="rounded-[2.5rem] bg-onyx-950 p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-bold text-brand-600">Dossier Overview</h3>
                {/* NOTE: id may be a number (DB integer PK) — convert to string before slicing */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ref: {String(selected.id).slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-brand-600" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Client Info</span>
                </div>
                <div className="space-y-4 rounded-2xl bg-white/5 p-5 border border-white/5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Legal Name</p>
                    <p className="font-bold text-sm">{selected.full_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-3.5 w-3.5 text-brand-600" />
                    <p className="text-xs font-medium text-slate-300">{selected.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-3.5 w-3.5 text-brand-600" />
                    <p className="text-xs font-medium text-slate-300">{selected.phone}</p>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-brand-600" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Journey Details</span>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Service Period</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-[10px] uppercase text-slate-400">Collection</p>
                        <p className="text-xs font-bold">{new Date(selected.pickup_at).toLocaleDateString()}</p>
                      </div>
                      <div className="h-px flex-1 bg-white/10" />
                      <div className="flex-1 text-right">
                        <p className="text-[10px] uppercase text-slate-400">Recovery</p>
                        <p className="text-xs font-bold">{new Date(selected.return_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                      <MapPin className="h-4 w-4 text-brand-600 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Destination</p>
                      <p className="text-xs font-bold mt-1 line-clamp-1">{selected.destination || "Not Specified"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                      <CreditCard className="h-4 w-4 text-brand-600 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Investment</p>
                      <p className="text-xs font-bold mt-1">$ {Number(selected.total_amount).toLocaleString('en-US')}</p>
                    </div>
                  </div>
                </div>
              </section>

              {selected.special_requests && (
                <section>
                  <div className="rounded-2xl bg-brand-600/10 p-5 border border-brand-600/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 mb-2">Intelligence Brief</p>
                    <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                      &quot;{selected.special_requests}&quot;
                    </p>
                  </div>
                </section>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4">
                <a
                  href={`mailto:${selected.email}`}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                >
                  <Mail className="h-4 w-4" /> Email
                </a>
                <a
                  href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl hover:bg-emerald-700 transition-all hover:-translate-y-1"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
