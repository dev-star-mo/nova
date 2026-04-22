"use client";

import { useState } from "react";
import type { LeaseRequest } from "@/types/database";
import type { CarCategory } from "@/types/database";
import { CAR_CATEGORIES } from "@/types/database";
import Image from "next/image";

type Props = { initialRequests: LeaseRequest[] };

// Helper: safely parse JSON-string arrays stored in TEXT columns
function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { return JSON.parse(val) as string[]; } catch { return []; }
  }
  return [];
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  reviewing: "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export function LeaseRequestsTab({ initialRequests }: Props) {
  const [requests, setRequests] = useState<LeaseRequest[]>(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryById, setCategoryById] = useState<Record<string, CarCategory>>({});
  const [priceById, setPriceById] = useState<Record<string, string>>({});
  const [locationById, setLocationById] = useState<Record<string, string>>({});

  const updateStatus = async (id: string, status: LeaseRequest["status"]) => {
    setBusyId(id);
    try {
      const payload: Record<string, string> = { status };
      if (status === "accepted") {
        payload.category = categoryById[id] ?? "small_car";
        payload.price_per_day = priceById[id] ?? "";
        payload.location = locationById[id] ?? "";
      }
      const res = await fetch(`/api/admin/lease/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to update status");
      }
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) {
    return <p className="py-16 text-center text-slate-400">No lease requests yet.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{requests.length} lease request{requests.length !== 1 ? "s" : ""}</p>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {requests.map((req) => {
          const images = parseJsonArray(req.image_urls as unknown);
          const phones = parseJsonArray(req.phone_numbers as unknown);
          const thumb = images[0] ?? req.image_url ?? null;
          const isExpanded = expandedId === req.id;

          return (
            <div
              key={req.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Image */}
              <div className="relative aspect-video bg-slate-100 flex-shrink-0">
                {thumb ? (
                  <Image src={thumb} alt={`${req.brand} ${req.model}`} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                )}
                <div className="absolute left-2 top-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[req.status] ?? "bg-slate-100 text-slate-700"}`}>
                    {/* change new status to pending */}
                    {req.status === "new" ? "pending" : req.status}
                  </span>
                </div>
                {images.length > 1 && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                    {images.length} photos
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold text-slate-900">
                  {req.brand} {req.model} ({req.year})
                </h3>
                <p className="text-xs text-slate-500">
                  {Number(req.mileage_km).toLocaleString()} km
                  {req.lease_duration_months ? ` • ${req.lease_duration_months} months` : ""}
                </p>

                {/* Submitter info */}
                <div className="mt-3 rounded-xl bg-slate-50 p-3 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted by</p>
                  <p className="text-sm font-semibold text-slate-800">{req.user_full_name || "—"}</p>
                  <p className="text-xs text-slate-500">{req.user_email || "—"}</p>
                  {phones.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {phones.map((p) => (
                        <a
                          key={p}
                          href={`tel:${p}`}
                          className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 hover:underline"
                        >
                          📞 {p}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* More photos toggle */}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="mt-2 text-left text-xs text-brand-600 hover:underline"
                  >
                    {isExpanded ? "Hide photos" : `View all ${images.length} photos`}
                  </button>
                )}
                {isExpanded && (
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {images.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                          <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" unoptimized />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Accept into fleet settings
                  </p>
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs"
                    value={categoryById[req.id] ?? "small_car"}
                    onChange={(e) =>
                      setCategoryById((prev) => ({
                        ...prev,
                        [req.id]: e.target.value as CarCategory,
                      }))
                    }
                  >
                    {CAR_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs"
                      placeholder="Price/day (KSh)"
                      value={priceById[req.id] ?? ""}
                      onChange={(e) =>
                        setPriceById((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs"
                      placeholder="Location"
                      value={locationById[req.id] ?? ""}
                      onChange={(e) =>
                        setLocationById((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateStatus(req.id, "accepted")}
                    disabled={busyId === req.id || req.status === "accepted"}
                    className="rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                  >
                    ✓ Accept
                  </button>
                  {req.user_email && (
                    <a
                      href={`mailto:${req.user_email}?subject=Your lease request — ${req.brand} ${req.model}&body=Hi ${req.user_full_name ?? ""},`}
                      className="rounded-lg border border-blue-200 py-2 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                      onClick={() => updateStatus(req.id, "reviewing")}
                    >
                      ✉ Contact
                    </a>
                  )}
                  <button
                    onClick={() => updateStatus(req.id, "rejected")}
                    disabled={busyId === req.id || req.status === "rejected"}
                    className="rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                  >
                    ✕ Reject
                  </button>
                </div>

                <p className="mt-3 text-[10px] text-slate-400">
                  Submitted {new Date(req.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
