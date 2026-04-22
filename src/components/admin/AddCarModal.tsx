"use client";

import { useState } from "react";
import { CAR_CATEGORIES } from "@/types/database";

type Props = { onClose: () => void; onAdded: (car: Record<string, unknown>) => void };

const DEFAULTS = {
  make: "", model: "", year: new Date().getFullYear(), price_per_day: "", price_per_week: "",
  price_per_month: "", location: "", seats: 5, transmission: "Automatic",
  fuel_type: "Petrol", description: "", available: true, slug: "",
  units_available: 1,
  category: "small_car" as string,
};

export function AddCarModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (key: keyof typeof DEFAULTS, val: unknown) =>
    setForm((p) => ({ ...p, [key]: val }));

  const submit = async () => {
    if (!form.make || !form.model || !form.price_per_day || !form.location) {
      setErr("Please fill in all required fields."); return;
    }
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          price_per_day: Number(form.price_per_day),
          price_per_week: form.price_per_week ? Number(form.price_per_week) : null,
          price_per_month: form.price_per_month ? Number(form.price_per_month) : null,
          seats: Number(form.seats),
          units_available: Number(form.units_available),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onAdded({ ...form, id: json.id });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to add car");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-xl">✕</button>
        <h2 className="text-lg font-bold text-slate-900 pr-8">Add new car</h2>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Field label="Make *"><input className={inp} value={form.make} onChange={(e) => set("make", e.target.value)} /></Field>
          <Field label="Model *"><input className={inp} value={form.model} onChange={(e) => set("model", e.target.value)} /></Field>
          <Field label="Year">
            <input type="number" className={inp} value={form.year} onChange={(e) => set("year", e.target.value)} />
          </Field>
          <Field label="Price/day (KSh) *">
            <input type="number" className={inp} value={form.price_per_day} onChange={(e) => set("price_per_day", e.target.value)} />
          </Field>
          <Field label="Price/week (KSh)">
            <input type="number" className={inp} value={form.price_per_week} onChange={(e) => set("price_per_week", e.target.value)} />
          </Field>
          <Field label="Price/month (KSh)">
            <input type="number" className={inp} value={form.price_per_month} onChange={(e) => set("price_per_month", e.target.value)} />
          </Field>
          <Field label="Category *" className="col-span-2">
            <select className={inp} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CAR_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Location *" className="col-span-2">
            <input className={inp} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Westlands, Nairobi" />
          </Field>
          <Field label="Seats">
            <input type="number" className={inp} value={form.seats} onChange={(e) => set("seats", e.target.value)} />
          </Field>
          <Field label="Transmission">
            <select className={inp} value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
              <option>Automatic</option><option>Manual</option>
            </select>
          </Field>
          <Field label="Fuel type">
            <select className={inp} value={form.fuel_type} onChange={(e) => set("fuel_type", e.target.value)}>
              <option>Petrol</option><option>Diesel</option><option>Electric</option><option>Hybrid</option>
            </select>
          </Field>
          <Field label="Slug (URL)">
            <input className={inp} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="e.g. toyota-prado-2022" />
          </Field>
          <Field label="Description" className="col-span-2">
            <textarea className={inp} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Available" className="col-span-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} className="w-4 h-4" />
              <span className="text-slate-700">Available</span>
            </label>
          </Field>
          <Field label="Units available (Stock)">
            <input type="number" className={inp} value={form.units_available} onChange={(e) => set("units_available", e.target.value)} min={0} />
          </Field>
        </div>

        <button
          onClick={() => void submit()}
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {busy ? "Adding car…" : "Add car"}
        </button>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
