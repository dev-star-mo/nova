"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  PlusCircle,
  Edit3,
  Upload,
  Trash2,
  MapPin,
  Users,
  Fuel,
  Settings2,
  X,
  Check,
  ImageIcon,
  Maximize2
} from "lucide-react";
import type { Car } from "@/types/database";
import { CAR_CATEGORIES } from "@/types/database";

type Props = { initialCars: Car[]; onAddCar: () => void };

const categoryLabel = (val: string | null | undefined) => {
  const c = CAR_CATEGORIES.find((x) => x.value === val);
  return c ? `${c.icon} ${c.label}` : "—";
};

const categoryColor = (val: string | null | undefined) => {
  switch (val) {
    case "small_car": return "bg-blue-50 text-blue-600 border-blue-100";
    case "mid_sized_car": return "bg-violet-50 text-violet-600 border-violet-100";
    case "suv": return "bg-brand-50 text-brand-900 border-brand-200";
    case "luxury": return "bg-amber-50 text-brand-600 border-brand-200";
    case "corporate_group": return "bg-teal-50 text-teal-600 border-teal-100";
    default: return "bg-slate-50 text-slate-600 border-slate-100";
  }
};

export function FleetTab({ initialCars, onAddCar }: Props) {
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Car>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const startEdit = (car: Car) => {
    setEditingId(car.id);
    setEditForm({ ...car });
    setErr(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/cars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...editForm } as Car : c)));
      setEditingId(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    }
    setSaving(false);
  };

  const deleteCar = async (id: string) => {
    if (!confirm("Confirm vehicle decommissioning? This action is irreversible.")) return;
    setDeleting(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/cars/${id}`, { method: "DELETE" });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setCars((prev) => prev.filter((c) => c.id !== id));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    }
    setDeleting(null);
  };

  const uploadImage = async (id: string, file: File) => {
    setUploading(id);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/cars/${id}/images`, { method: "POST", body: fd });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      const { url } = await res.json();
      setCars((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, images: [...(c.images ?? []), url], image_url: c.image_url ?? url }
            : c
        )
      );
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to upload");
    }
    setUploading(null);
  };

  const removeImage = async (id: string, imageUrl: string) => {
    if (!confirm("Delete this asset image?")) return;
    setUploading(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/cars/${id}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error);
      }
      const json = await res.json();
      setCars((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              images: json.images ?? (c.images ?? []).filter((img) => img !== imageUrl),
              image_url: json.image_url ?? c.image_url,
            }
            : c
        )
      );
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to delete image");
    }
    setUploading(null);
  };

  const setField = (key: keyof Car, val: unknown) =>
    setEditForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="pb-20">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-8 bg-brand-600 rounded-full" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Inventory Status: <span className="text-onyx-950">{cars.length} Fleet Assets</span></p>
        </div>
      </div>

      {err && (
        <div className="mb-8 rounded-2xl bg-red-50 border border-red-100 p-5 text-sm font-bold text-red-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Maximize2 className="h-4 w-4 rotate-45" /> {err}
        </div>
      )}

      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {cars.map((car) => {
          const img = car.image_url ?? car.images?.[0] ?? null;
          const isEditing = editingId === car.id;

          return (
            <div key={car.id} className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-50 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
              {/* Image Preview Tier */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
                {img ? (
                  <Image src={img} alt={`${car.make} ${car.model}`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-300">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Visual Assets</span>
                  </div>
                )}

                {/* Overlay Badges */}
                <div className="absolute inset-x-4 top-4 flex items-center justify-between pointer-events-none">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md bg-white/90 shadow-sm ${categoryColor(car.category)}`}>
                    {categoryLabel(car.category)}
                  </span>
                  {(car.images?.length ?? 0) > 1 && (
                    <span className="rounded-full bg-onyx-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      {car.images!.length} Portfolio Shots
                    </span>
                  )}
                </div>
              </div>

              <div className="p-8">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className={labelStyle}>Designation</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input className={editInp} placeholder="Make" value={editForm.make ?? ""} onChange={(e) => setField("make", e.target.value)} />
                          <input className={editInp} placeholder="Model" value={editForm.model ?? ""} onChange={(e) => setField("model", e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className={labelStyle}>Year</label>
                        <input type="number" className={editInp} value={editForm.year ?? ""} onChange={(e) => setField("year", Number(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelStyle}>Daily Rate (KSh)</label>
                        <input type="number" className={editInp} value={editForm.price_per_day ?? ""} onChange={(e) => setField("price_per_day", Number(e.target.value))} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className={labelStyle}>Operating Location</label>
                        <input className={editInp} value={editForm.location ?? ""} onChange={(e) => setField("location", e.target.value)} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className={labelStyle}>Category</label>
                        <select className={`${editInp} appearance-none cursor-pointer`} value={editForm.category ?? "small_car"} onChange={(e) => setField("category", e.target.value)}>
                          {CAR_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className={labelStyle}>Available Units</label>
                        <input type="number" min={0} className={editInp} value={editForm.units_available ?? 0} onChange={(e) => setField("units_available", Number(e.target.value))} />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer text-slate-500">
                          <input type="checkbox" className="h-4 w-4 rounded-md border-slate-200 text-brand-600 focus:ring-brand-600" checked={editForm.available ?? true} onChange={(e) => setField("available", e.target.checked)} />
                          Online
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-50">
                      <button onClick={() => void saveEdit(car.id)} disabled={saving} className="flex-1 rounded-2xl bg-brand-600 py-4 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl hover:bg-brand-700 transition-all disabled:opacity-50">
                        {saving ? "Updating..." : "Commit Changes"}
                      </button>
                      <button onClick={cancelEdit} className="flex-1 rounded-2xl border border-slate-100 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display text-xl font-bold text-onyx-950 group-hover:text-brand-600 transition-colors">{car.make} {car.model}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{car.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${car.available && (car.units_available ?? 0) > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                          {car.available && (car.units_available ?? 0) > 0 ? "In Stock" : "Reserved"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                          {car.units_available ?? 0} Inventory
                        </span>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Pricing</span>
                      <span className="text-xl font-bold text-onyx-950 px-2">KSh {Number(car.price_per_day).toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ 24H</span>
                    </div>

                    {/* Quick Portfolio Preview */}
                    {(car.images?.length ?? 0) > 0 && (
                      <div className="mb-8 grid grid-cols-4 gap-2">
                        {(car.images ?? []).slice(0, 4).map((src) => (
                          <div key={src} className="group/img relative aspect-square overflow-hidden rounded-xl bg-slate-50 ring-2 ring-transparent hover:ring-brand-600/20 transition-all">
                            <Image src={src} alt="Portfolio" fill className="object-cover" unoptimized />
                            <button
                              type="button"
                              onClick={() => void removeImage(car.id, src)}
                              disabled={uploading === car.id}
                              className="absolute inset-0 bg-red-600/90 text-white opacity-0 transition-opacity group-hover/img:opacity-100 flex items-center justify-center disabled:opacity-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(car)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-onyx-950 transition-all hover:border-brand-600 hover:text-brand-600"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Modify
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => fileRefs.current[car.id]?.click()}
                          disabled={uploading === car.id}
                          className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-onyx-950 hover:text-brand-600 transition-all border border-slate-100 disabled:opacity-50"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => { fileRefs.current[car.id] = el; }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(car.id, f); e.target.value = ""; }}
                        />
                        <button
                          onClick={() => void deleteCar(car.id)}
                          disabled={deleting === car.id}
                          className="h-11 w-11 rounded-2xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-600 hover:text-white transition-all border border-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Progress Bar for uploads */}
              {uploading === car.id && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-600 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {cars.length === 0 && (
        <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50">
          <div className="mx-auto h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
            <Settings2 className="h-10 w-10" />
          </div>
          <h3 className="font-display text-2xl font-bold text-onyx-950 tracking-tight">Fleet Depleted</h3>
          <p className="mt-2 text-slate-500 font-medium">No refined automotive assets currently registered.</p>
          <button onClick={onAddCar} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-2xl hover:bg-brand-700 transition-all hover:-translate-y-1">
            <PlusCircle className="h-4 w-4" /> Register First Asset
          </button>
        </div>
      )}
    </div>
  );
}

const editInp = "w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all";
const labelStyle = "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1";
