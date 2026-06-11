"use client";

import { useState } from "react";
import {
  Star,
  Trash2,
  MessageSquare,
  User,
  Car,
  Calendar,
  MapPin,
  X,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Maximize2
} from "lucide-react";
import type { Review } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

type Props = { initialReviews: Review[] };

export function ReviewsTab({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Review | null>(null);

  const supabase = createClient();

  const deleteReview = async (id: string) => {
    if (!confirm("Confirm testimonial removal? This action is permanent.")) return;
    setBusyId(id);
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="pb-20">
      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-onyx-950/40 backdrop-blur-md" />
          <div className="relative w-full max-w-2xl rounded-[3rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="absolute right-8 top-8 z-10">
              <button onClick={() => setSelected(null)} className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-onyx-950 hover:text-brand-600 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row">
              <div className="bg-onyx-950 md:w-[240px] p-8 text-white flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center mb-6 shadow-xl shadow-brand-600/20">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-widest text-brand-600 mb-2">Review Dossier</h2>
                  {/* NOTE: id may be a number (DB integer PK) — convert to string before slicing */}
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">ID: {String(selected.id).slice(0, 8)}</p>
                </div>

                <div className="mt-12 space-y-4">
                  <div className="flex items-center gap-1.5 py-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < selected.rating ? "fill-brand-600 text-brand-600" : "text-white/10"}`} />
                    ))}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{selected.rating}/5.0 Satisfaction</p>
                </div>
              </div>

              <div className="flex-1 p-10 max-h-[80vh] overflow-y-auto">
                <div className="space-y-10">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-4 w-4 text-brand-600" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Collaborator Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 rounded-3xl bg-slate-50 p-6 border border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Client Name</p>
                        <p className="font-bold text-onyx-950">{selected.user_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Client Email</p>
                        <p className="font-medium text-slate-600">{selected.user_email || "Anonymous"}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Car className="h-4 w-4 text-brand-600" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Service engagement</span>
                    </div>
                    <div className="grid gap-4">
                      <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
                        <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Vehicle Selection</p>
                        <p className="font-bold text-onyx-950 text-lg">
                          {selected.car_make && selected.car_model ? `${selected.car_make} ${selected.car_model}` : "Premium Selection"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl bg-slate-50 p-5 border border-slate-100">
                          <Calendar className="h-3.5 w-3.5 text-brand-600 mb-2" />
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Service Window</p>
                          <p className="text-xs font-bold mt-1">{fmt(selected.pickup_at)} → {fmt(selected.return_at)}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-5 border border-slate-100">
                          <MapPin className="h-3.5 w-3.5 text-brand-600 mb-2" />
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Deployment</p>
                          <p className="text-xs font-bold mt-1 line-clamp-1">{selected.pickup_location || "Central Station"}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="h-4 w-4 text-brand-600" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Statement of Feedback</span>
                    </div>
                    <div className="space-y-4">
                      {selected.comment && (
                        <div className="rounded-3xl bg-brand-50/30 p-6 border border-brand-100">
                          <p className="text-sm font-medium text-onyx-800 leading-relaxed italic">
                            &quot;{selected.comment}&quot;
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {selected.liked && (
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                            <ThumbsUp className="h-3.5 w-3.5 text-emerald-600 mb-2" />
                            <p className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Positive Elements</p>
                            <p className="text-xs text-slate-600">{selected.liked}</p>
                          </div>
                        )}
                        {selected.disliked && (
                          <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                            <ThumbsDown className="h-3.5 w-3.5 text-red-600 mb-2" />
                            <p className="text-[10px] uppercase text-red-600 font-bold mb-1">Pain Points</p>
                            <p className="text-xs text-slate-600">{selected.disliked}</p>
                          </div>
                        )}
                      </div>
                      {selected.complaints && (
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
                          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase text-amber-600 font-bold mb-1">Formal Complaints</p>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{selected.complaints}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="flex justify-end gap-3 pt-6">
                    <button
                      onClick={() => void deleteReview(selected.id)}
                      disabled={busyId === selected.id}
                      className="px-8 py-4 rounded-2xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/10 disabled:opacity-50"
                    >
                      {busyId === selected.id ? "Expunging..." : "Expunge Record"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-10">
        <span className="h-1.5 w-8 bg-brand-600 rounded-full" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Public Reputation: <span className="text-onyx-950">{reviews.length} Client Testimonials</span></p>
      </div>

      <div className="rounded-[2.5rem] border border-slate-50 bg-white overflow-hidden shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Client Agent</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Asset Selection</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Experience Rating</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Statement</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No reputation history captured</p>
                  </td>
                </tr>
              )}
              {reviews.map((r) => (
                <tr key={r.id} className="group hover:bg-slate-50/80 transition-all">
                  <td className="px-8 py-6">
                    <div className="font-bold text-onyx-950">{r.user_name}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                      <span className="text-sm font-bold text-onyx-800">
                        {r.car_make && r.car_model ? `${r.car_make} ${r.car_model}` : "High-End Series"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-brand-600 text-brand-600" : "text-slate-100"}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-slate-600 max-w-[240px] truncate italic font-medium">
                      &quot;{r.comment ?? "Statement withheld"}&quot;
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelected(r)}
                        className="h-10 px-4 rounded-xl bg-white border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-onyx-950 hover:border-brand-600 hover:text-brand-600 transition-all"
                      >
                        Examine
                      </button>
                      <button
                        onClick={() => void deleteReview(r.id)}
                        disabled={busyId === r.id}
                        className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
