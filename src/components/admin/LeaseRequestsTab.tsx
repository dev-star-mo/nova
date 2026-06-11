"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  Tag,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Car,
  ExternalLink,
  MessageSquare
} from "lucide-react";
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

const STATUS_CONFIG: Record<string, { bg: string, text: string, icon: any }> = {
  new: { bg: "bg-brand-50", text: "text-brand-900", icon: Clock },
  pending: { bg: "bg-brand-50", text: "text-brand-900", icon: Clock },
  reviewing: { bg: "bg-blue-50", text: "text-blue-700", icon: ExternalLink },
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  rejected: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
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
    return (
      <div className="py-32 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
          <Tag className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-onyx-950 uppercase tracking-widest">No Incoming Dossiers</h3>
        <p className="text-slate-400 mt-2 font-medium">The lease request queue is currently clear.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-8 bg-brand-600 rounded-full" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Pipeline Status: <span className="text-onyx-950">{requests.length} Active Enquiries</span></p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {requests.map((req) => {
          const images = parseJsonArray(req.image_urls as unknown);
          const phones = parseJsonArray(req.phone_numbers as unknown);
          const thumb = images[0] ?? req.image_url ?? null;
          const isExpanded = expandedId === req.id;
          const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
          const StatusIcon = config.icon;

          return (
            <div
              key={req.id}
              className="group flex flex-col overflow-hidden rounded-[2.5rem] bg-white border border-slate-50 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Asset Snapshot Tier */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
                {thumb ? (
                  <Image src={thumb} alt={`${req.brand} ${req.model}`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-300">
                    <Car className="h-10 w-10 mb-2 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Snapshot Required</span>
                  </div>
                )}
                <div className="absolute inset-x-4 top-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md bg-white/90 border border-current/10 shadow-sm ${config.text}`}>
                    <StatusIcon className="h-3 w-3" />
                    {req.status === "new" ? "Incoming" : req.status}
                  </span>
                </div>
                {images.length > 1 && (
                  <span className="absolute bottom-4 right-4 rounded-full bg-onyx-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    {images.length} Portfolio Images
                  </span>
                )}
              </div>

              {/* Dossier Content Tier */}
              <div className="flex flex-1 flex-col p-8">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold text-onyx-950 group-hover:text-brand-600 transition-colors">
                    {req.brand} {req.model}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">{req.year} Edition</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{Number(req.mileage_km).toLocaleString()} KM Captured</span>
                  </div>
                </div>

                {/* Submitter Credentials */}
                <div className="mb-6 rounded-2xl bg-slate-50 p-5 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-3.5 w-3.5 text-brand-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Owner Details</span>
                  </div>
                  <p className="text-sm font-bold text-onyx-950">{req.user_full_name || "Anonymous Requester"}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{req.user_email || "Not Provided"}</p>

                  {phones.length > 0 && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/50">
                      <MessageSquare className="h-3.5 w-3.5 text-brand-600" />
                      <div className="flex flex-wrap gap-2">
                        {phones.map((p) => (
                          <a
                            key={p}
                            href={`tel:${p}`}
                            className="text-[10px] font-bold uppercase tracking-widest text-brand-700 hover:text-brand-600 underline"
                          >
                            {p}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Extended Portfolio Access */}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="mb-4 flex items-center justify-between w-full px-5 py-3.5 rounded-xl bg-white border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-brand-600 hover:text-brand-600 transition-all"
                  >
                    <span>{isExpanded ? "Collapse Portfolio" : `Examine ${images.length} Assets`}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}

                {isExpanded && (
                  <div className="mb-6 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2">
                    {images.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block ring-2 ring-transparent hover:ring-brand-600 rounded-xl transition-all overflow-hidden">
                        <div className="relative aspect-square bg-slate-50">
                          <Image src={src} alt={`Asset ${i + 1}`} fill className="object-cover" unoptimized />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* Fleet Integration System */}
                <div className="mt-auto pt-6 border-t border-slate-50">
                  <div className="mb-6 space-y-4 rounded-2xl bg-onyx-950 p-5 shadow-xl text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Inventory Configuration</p>
                    <div className="space-y-3">
                      <div className="relative">
                        <Car className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <select
                          className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-xs font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-brand-600 focus:outline-none transition-all"
                          value={categoryById[req.id] ?? "small_car"}
                          onChange={(e) => setCategoryById((prev) => ({ ...prev, [req.id]: e.target.value as CarCategory }))}
                        >
                          {CAR_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value} className="text-onyx-950">
                              {c.icon} {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[10px] font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-brand-600 focus:outline-none transition-all"
                          placeholder="DAILY RATE (KSH)"
                          value={priceById[req.id] ?? ""}
                          onChange={(e) => setPriceById((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        />
                        <input
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[10px] font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-brand-600 focus:outline-none transition-all"
                          placeholder="LOCATION"
                          value={locationById[req.id] ?? ""}
                          onChange={(e) => setLocationById((prev) => ({ ...prev, [req.id]: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Administrative Actions */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => updateStatus(req.id, "accepted")}
                      disabled={busyId === req.id || req.status === "accepted"}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Commit
                    </button>
                    {req.user_email && (
                      <a
                        href={`mailto:${req.user_email}?subject=NovaDrive Dossier Review: ${req.brand} ${req.model}`}
                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 py-4 text-[10px] font-bold uppercase tracking-widest text-onyx-950 hover:bg-slate-50 transition-all"
                        onClick={() => updateStatus(req.id, "reviewing")}
                      >
                        <Mail className="h-4 w-4 text-brand-600" /> Brief
                      </a>
                    )}
                    <button
                      onClick={() => updateStatus(req.id, "rejected")}
                      disabled={busyId === req.id || req.status === "rejected"}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 py-4 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>Submitted</span>
                    </div>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
