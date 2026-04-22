"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { Car } from "@/types/database";
import { CAR_CATEGORIES } from "@/types/database";

type Props = { initialCars: Car[]; onAddCar: () => void };

const categoryLabel = (val: string | null | undefined) => {
  const c = CAR_CATEGORIES.find((x) => x.value === val);
  return c ? `${c.icon} ${c.label}` : "—";
};

const categoryColor = (val: string | null | undefined) => {
  switch (val) {
    case "small_car": return "bg-blue-100 text-blue-700";
    case "mid_sized_car": return "bg-violet-100 text-violet-700";
    case "suv": return "bg-amber-100 text-amber-700";
    case "luxury": return "bg-rose-100 text-rose-700";
    case "corporate_group": return "bg-teal-100 text-teal-700";
    default: return "bg-slate-100 text-slate-600";
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
    if (!confirm("Delete this car? This cannot be undone.")) return;
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
    if (!confirm("Delete this image?")) return;
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
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{cars.length} vehicle{cars.length !== 1 ? "s" : ""} in fleet</p>
        <button
          onClick={onAddCar}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          + Add car
        </button>
      </div>
      {err && <p className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{err}</p>}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cars.map((car) => {
          const img = car.image_url ?? car.images?.[0] ?? null;
          const isEditing = editingId === car.id;

          return (
            <div key={car.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="relative aspect-[16/10] bg-slate-100">
                {img ? (
                  <Image src={img} alt={`${car.make} ${car.model}`} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">No image</div>
                )}
                {/* Category badge */}
                <span className={`absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${categoryColor(car.category)}`}>
                  {categoryLabel(car.category)}
                </span>
                {/* Image count badge */}
                {(car.images?.length ?? 0) > 1 && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                    {car.images!.length} photos
                  </span>
                )}
              </div>

              <div className="p-4">
                {isEditing ? (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <input className={editInp} placeholder="Make" value={editForm.make ?? ""} onChange={(e) => setField("make", e.target.value)} />
                      <input className={editInp} placeholder="Model" value={editForm.model ?? ""} onChange={(e) => setField("model", e.target.value)} />
                      <input type="number" className={editInp} placeholder="Year" value={editForm.year ?? ""} onChange={(e) => setField("year", Number(e.target.value))} />
                      <input type="number" className={editInp} placeholder="Price/day (KSh)" value={editForm.price_per_day ?? ""} onChange={(e) => setField("price_per_day", Number(e.target.value))} />
                      <input className={`${editInp} col-span-2`} placeholder="Location" value={editForm.location ?? ""} onChange={(e) => setField("location", e.target.value)} />
                      <div className="col-span-2">
                        <label className="text-[10px] font-medium text-slate-500 block mb-1">Category</label>
                        <select className={`${editInp} w-full`} value={editForm.category ?? "small_car"} onChange={(e) => setField("category", e.target.value)}>
                          {CAR_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                          ))}
                        </select>
                      </div>
                      <input type="number" className={editInp} placeholder="Seats" value={editForm.seats ?? ""} onChange={(e) => setField("seats", Number(e.target.value))} />
                      <select className={editInp} value={editForm.transmission ?? ""} onChange={(e) => setField("transmission", e.target.value)}>
                        <option value="" disabled>Transmission</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                      <select className={editInp} value={editForm.fuel_type ?? ""} onChange={(e) => setField("fuel_type", e.target.value)}>
                        <option value="">Fuel</option>
                        <option>Petrol</option><option>Diesel</option><option>Electric</option><option>Hybrid</option>
                      </select>
                      <label className="flex items-center gap-2 text-xs col-span-1 cursor-pointer">
                        <input type="checkbox" checked={editForm.available ?? true} onChange={(e) => setField("available", e.target.checked)} />
                        Available
                      </label>
                      <div className="col-span-1">
                        <label className="text-[10px] font-medium text-slate-500 block">Units</label>
                        <input type="number" min={0} className={`w-full ${editInp}`} value={editForm.units_available ?? 0} onChange={(e) => setField("units_available", Number(e.target.value))} />
                      </div>
                    </div>
                    <textarea className={`w-full ${editInp}`} rows={2} placeholder="Description" value={editForm.description ?? ""} onChange={(e) => setField("description", e.target.value)} />
                    {err && <p className="text-xs text-red-600">{err}</p>}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => void saveEdit(car.id)} disabled={saving} className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button onClick={cancelEdit} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{car.make} {car.model} ({car.year})</h3>
                        <p className="text-xs text-slate-500">{car.location}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${car.available && (car.units_available ?? 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                          {car.available && (car.units_available ?? 0) > 0 ? "Available" : ((car.units_available ?? 0) === 0 ? "Sold Out" : "Unavailable")}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {car.units_available ?? 0} units
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm font-bold text-indigo-700">
                      KSh {Number(car.price_per_day).toLocaleString()} <span className="text-xs font-normal text-slate-500">/ day</span>
                    </p>
                    {(car.images?.length ?? 0) > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {(car.images ?? []).slice(0, 4).map((src) => (
                          <div key={src} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                            <Image src={src} alt="Car image" fill className="object-cover" unoptimized />
                            <button
                              type="button"
                              onClick={() => void removeImage(car.id, src)}
                              disabled={uploading === car.id}
                              className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
                              title="Delete image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => startEdit(car)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">✏️ Edit</button>
                      <button
                        onClick={() => fileRefs.current[car.id]?.click()}
                        disabled={uploading === car.id}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        {uploading === car.id ? "Uploading…" : "🖼 Upload image"}
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
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting === car.id ? "Deleting…" : "🗑 Delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {cars.length === 0 && (
        <p className="mt-16 text-center text-slate-400">No cars in fleet. Add one above.</p>
      )}
    </div>
  );
}

const editInp = "rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400";
