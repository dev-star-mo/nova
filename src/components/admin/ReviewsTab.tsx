"use client";

import { useState } from "react";
import type { Review } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

type Props = { initialReviews: Review[] };

export function ReviewsTab({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Review | null>(null);

  const supabase = createClient();

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
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
    return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <>
      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-xl">✕</button>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Review Details</h2>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-xl ${i < selected.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
              ))}
              <span className="ml-2 text-sm font-semibold text-slate-700">{selected.rating}/5</span>
            </div>

            <Section title="👤 Customer">
              <Row label="Name" value={selected.user_name} />
              <Row label="Email" value={selected.user_email} />
            </Section>

            <Section title="🚗 Car Hired">
              <Row
                label="Vehicle"
                value={selected.car_make && selected.car_model
                  ? `${selected.car_make} ${selected.car_model}${selected.car_year ? ` (${selected.car_year})` : ""}`
                  : "—"}
              />
            </Section>

            <Section title="📅 Hire Dates">
              <Row label="Pickup" value={fmt(selected.pickup_at)} />
              <Row label="Return" value={fmt(selected.return_at)} />
              <Row label="Pickup location" value={selected.pickup_location} />
              <Row label="Dropoff location" value={selected.dropoff_location} />
            </Section>

            {(selected.comment || selected.liked || selected.disliked || selected.complaints) && (
              <Section title="💬 Feedback">
                {selected.comment && <Row label="Comment" value={selected.comment} />}
                {selected.liked && <Row label="Liked" value={selected.liked} />}
                {selected.disliked && <Row label="Disliked" value={selected.disliked} />}
                {selected.complaints && <Row label="Complaints" value={selected.complaints} />}
              </Section>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => void deleteReview(selected.id)}
                disabled={busyId === selected.id}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {busyId === selected.id ? "Deleting…" : "Delete review"}
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Car hired</th>
                <th className="px-6 py-4">Hire dates</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Comment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">No reviews found.</td>
                </tr>
              )}
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{r.user_name}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {r.car_make && r.car_model
                      ? `${r.car_make} ${r.car_model}${r.car_year ? ` (${r.car_year})` : ""}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {fmt(r.pickup_at)} — {fmt(r.return_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < r.rating ? "★" : "☆"}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{r.comment ?? "—"}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelected(r)}
                        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        More details
                      </button>
                      <button
                        onClick={() => void deleteReview(r.id)}
                        disabled={busyId === r.id}
                        className="text-red-600 hover:text-red-700 font-semibold disabled:opacity-50 text-xs"
                      >
                        {busyId === r.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}
