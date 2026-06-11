"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Car,
  ChevronRight,
  ShieldCheck,
  Zap,
  Ear,
  Calendar
} from "lucide-react";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";
import { createClient } from "@/lib/supabase/client";

type LeaseCategory = {
  title: string;
  desc: string;
  image: string;
};

const categories: LeaseCategory[] = [
  {
    title: "Eco City",
    desc: "Compact and efficient, perfect for urban mobility.",
    image: "https://media.autochek.africa/file/8JNfy70D.webp",
  },
  {
    title: "Executive Saloon",
    desc: "Sleek professionalism for business and prestige travel.",
    image: "https://kai-and-karo.ams3.cdn.digitaloceanspaces.com/media/vehicles/thumbnails/5716207d-190c-466f-9f9c-66ec300d9d37.jpeg",
  },
  {
    title: "Luxury Elite",
    desc: "Uncompromising comfort and status for VIP movement.",
    image: "https://kai-and-karo.ams3.cdn.digitaloceanspaces.com/media/vehicles/thumbnails/344abc39-eeb1-47f3-91b0-ac3d4f274214.jpeg",
  },
  {
    title: "Grand Explorer",
    desc: "Seven-seater capacity for family and group luxury.",
    image: "https://kai-and-karo.ams3.cdn.digitaloceanspaces.com/media/vehicles/images/IMG-20230513-WA0211.jpg",
  },
  {
    title: "Luxury SUV",
    desc: "Commanding presence with refined road dominance.",
    image: "https://media.dealersyard.com/vehicles/01kmabqw59hbfewzzqf8rs643y/IxPtlZ5J5fhd4oQ5DwrDWSgGO09m9yctXXpB0mpq6OqwO3Lo3nRjwmXTcxNpjQ7T.jpg",
  },
  {
    title: "Off-Road Legend",
    desc: "Built to conquer the wild without sacrificing comfort.",
    image: "https://gybird.co.ke/site/images/car_images/untitled-design-73-1771333789.jpg",
  },
];

export default function LeasePage() {
  const { user, loading, profile } = useUserSession();
  const { openAuth } = useAppUI();
  const supabase = useMemo(() => createClient(), []);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [duration, setDuration] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [phones, setPhones] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      openAuth("gate");
    }
  }, [loading, user, openAuth]);

  const fieldErr = (val: string) =>
    submitted && !val.trim() ? "border-red-500 ring-1 ring-red-400" : "border-slate-200";

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      openAuth("gate");
      return;
    }

    const y = Number(year);
    const km = Number(mileage);
    const dur = Number(duration);
    const validPhones = phones.filter((p) => p.trim());

    if (!brand.trim() || !model.trim() || !year.trim() || !mileage.trim() || !duration.trim() || photos.length === 0 || validPhones.length === 0) {
      setError("Please complete all required fields highlighted in red.");
      return;
    }

    setBusy(true);
    try {
      const bucket = "car-images";
      const image_urls: string[] = [];

      for (const file of photos) {
        const path = `lease-requests/${user.id}/${Date.now()}-${file.name}`.replace(/\s+/g, "-");
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || "image/jpeg",
        });
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        image_urls.push(data.publicUrl);
      }

      const res = await fetch("/api/lease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand, model, year: y, mileage_km: km, lease_duration_months: dur,
          image_urls, phone_numbers: validPhones,
          user_full_name: profile?.full_name ?? user.email,
          user_email: user.email,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Submission failed");
      }

      setSuccess("Your lease request has been submitted successfully. Our team will contact you shortly.");
      setBrand(""); setModel(""); setYear(""); setMileage(""); setDuration(""); setPhotos([]); setPhones([""]);
      setSubmitted(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-onyx-950 py-24 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80')] bg-cover bg-center bg-no-repeat opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-onyx-950/80 via-onyx-950/90 to-onyx-950" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-brand-600 mb-6 font-bold text-sm uppercase tracking-[0.3em]">
              <span className="h-[2px] w-12 bg-brand-600" />
              Strategic Partnerships
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-7xl leading-[1.1]">
              Lease Your <span className="text-brand-600">Assets</span> <br />
              With NovaDrive
            </h1>
            <p className="mt-8 text-xl text-slate-400 leading-relaxed">
              Unlock the earning potential of your vehicle. We provide full-service management,
              marketing, and elite customer support while you enjoy consistent returns.
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => document.getElementById("lease-form")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-2xl bg-brand-600 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-2xl hover:bg-brand-700 transition-all hover:-translate-y-1"
              >
                Get Started
              </button>
              <div className="flex items-center gap-4 px-6 text-white/60">
                <ShieldCheck className="h-6 w-6 text-brand-600" />
                <span className="text-sm font-medium">Fully Insured & Managed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-onyx-950">Elite Fleet Categories</h2>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto">We maintain a curated selection of vehicle tiers to meet our clients&apos; exacting standards.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <div
                key={c.title}
                className="group relative overflow-hidden rounded-[2.5rem] bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(min-width: 1024px) 360px, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-onyx-950/80 to-transparent" />
                  <div className="absolute bottom-6 left-8">
                    <h3 className="font-display text-2xl font-bold text-white">{c.title}</h3>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-slate-500 leading-relaxed text-sm">{c.desc}</p>
                  <div className="mt-6 flex items-center text-brand-600 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Acceptance Criteria <ChevronRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="lease-form" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[4rem] bg-white border border-slate-50 p-8 shadow-2xl shadow-slate-200/50 sm:p-20 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-brand-50/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-slate-50 rounded-full blur-3xl" />

            <div className="relative mb-20">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-1.5 w-10 bg-brand-600 rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Collaborator Intake</span>
              </div>
              <h2 className="font-display text-5xl font-bold text-onyx-950 tracking-tight">Dossier <span className="text-brand-600">Submission</span></h2>
              <p className="mt-4 text-lg text-slate-500 font-medium max-w-xl">
                Initiate the strategic evaluation of your asset. Our acquisition team will review your credentials and inventory documentation.
              </p>
            </div>

            {error && (
              <div className="mb-12 rounded-[2rem] bg-red-50 border border-red-100 p-6 text-sm text-red-600 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold uppercase tracking-widest text-[10px]">Submission Exception</p>
                  <p className="font-medium mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-12 rounded-[3rem] bg-onyx-950 p-10 text-white flex flex-col items-center text-center animate-in zoom-in-95">
                <div className="h-20 w-20 rounded-[2rem] bg-brand-600 flex items-center justify-center mb-6 shadow-2xl shadow-brand-600/20">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold uppercase tracking-widest text-brand-600 mb-2">Inquiry Captured</h3>
                <p className="text-slate-400 font-medium max-w-md uppercase tracking-wider text-xs leading-relaxed">
                  Your portfolio has been secured. Our acquisitions desk will brief you following the internal asset review.
                </p>
              </div>
            )}

            <div className="space-y-16">
              {/* Identity & Contact Tier */}
              <section>
                <div className="flex items-center gap-2 mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">01. Identity & Communications</span>
                </div>
                <div className="space-y-6">
                  {phones.map((p, idx) => (
                    <div key={idx} className="group flex gap-4 animate-in fade-in slide-in-from-left-2 transition-all">
                      <div className="flex-1 relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2">
                          <Zap className="h-4 w-4 text-brand-600" />
                        </div>
                        <input
                          className={`w-full rounded-[2rem] border bg-slate-50/50 pl-14 pr-8 py-5 text-sm font-bold focus:outline-none transition-all ${submitted && !p.trim() ? "border-red-500 bg-red-50" : "border-slate-100 focus:border-brand-600 focus:bg-white focus:shadow-xl focus:shadow-brand-600/5"}`}
                          value={p}
                          onChange={(e) => {
                            const n = [...phones];
                            n[idx] = e.target.value;
                            setPhones(n);
                          }}
                          placeholder={idx === 0 ? "PRIMARY SECURE LINE" : "SECONDARY SECURE LINE"}
                          disabled={!user || busy}
                        />
                      </div>
                      {phones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                          className="h-16 w-16 rounded-[2rem] border border-slate-100 bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all active:scale-95"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhones([...phones, ""])}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white border border-slate-100 text-[10px] font-bold text-onyx-950 uppercase tracking-widest hover:border-onyx-950 transition-all active:scale-95"
                    disabled={!user || busy}
                  >
                    <Plus className="h-3 w-3 text-brand-600" /> Add Redundant Line
                  </button>
                </div>
              </section>

              {/* Asset Specifications Tier */}
              <section>
                <div className="flex items-center gap-2 mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">02. Asset Specifications</span>
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  {[
                    { label: "Asset Brand", value: brand, setter: setBrand, placeholder: "E.G. RANGE ROVER", icon: ShieldCheck },
                    { label: "Asset Model", value: model, setter: setModel, placeholder: "E.G. AUTOBIOGRAPHY", icon: Car },
                    { label: "Release Year", value: year, setter: setYear, placeholder: "YYYY", icon: Calendar, inputMode: "numeric" as const },
                    { label: "Total Mileage", value: mileage, setter: setMileage, placeholder: "KM", icon: Zap, inputMode: "numeric" as const },
                  ].map((field) => (
                    <div key={field.label} className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-onyx-950 ml-2">
                        <field.icon className="h-3 w-3 text-brand-600" /> {field.label}
                      </label>
                      <input
                        className={`w-full rounded-[2rem] border bg-slate-50/50 px-8 py-5 text-sm font-bold focus:outline-none transition-all ${fieldErr(field.value)}`}
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        disabled={!user || busy}
                        placeholder={field.placeholder}
                        inputMode={field.inputMode}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-onyx-950 ml-2">
                    <ShieldCheck className="h-3 w-3 text-brand-600" /> Term Commitment (Months)
                  </label>
                  <input
                    className={`w-full rounded-[2rem] border bg-slate-50/50 px-8 py-5 text-sm font-bold focus:outline-none transition-all ${fieldErr(duration)}`}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={!user || busy}
                    placeholder="DURATION OF SERVICE"
                    inputMode="numeric"
                  />
                </div>
              </section>

              {/* Asset Documentation Tier */}
              <section>
                <div className="flex items-center gap-2 mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">03. Visual Documentation</span>
                </div>
                <div
                  className={`group relative cursor-pointer rounded-[3rem] border-2 border-dashed p-16 text-center transition-all ${photos.length > 0 ? "border-brand-600 bg-brand-50/30" : "border-slate-100 hover:border-brand-600 hover:bg-slate-50"}`}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
                    disabled={!user || busy}
                  />
                  <div className={`mx-auto h-20 w-20 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl transition-all ${photos.length > 0 ? "bg-brand-600 text-white shadow-brand-600/20" : "bg-white text-slate-300 group-hover:text-brand-600 shadow-slate-200/50"}`}>
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="text-xl font-bold text-onyx-950 uppercase tracking-widest">
                    {photos.length > 0 ? `${photos.length} Assets Captured` : "Upload Portfolio"}
                  </p>
                  <p className="mt-3 text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">
                    Provide high-fidelity exterior & cabin perspectives
                  </p>
                </div>
              </section>

              {/* Final Action */}
              <div className="pt-10">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!user || busy}
                  className="w-full h-24 relative overflow-hidden group rounded-[2rem] bg-onyx-950 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 hover:bg-brand-600 hover:-translate-y-2 disabled:opacity-50"
                >
                  <div className="relative z-10 flex items-center justify-center gap-6">
                    <span className="text-sm font-bold uppercase tracking-[0.4em] ml-4">
                      {busy ? "Encrypting Dossier..." : "Commit Inquiry"}
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-onyx-950 transition-all">
                      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </button>
                <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                  By committing, you agree to our <span className="text-brand-600 underline">Strategic Partner Protocol</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
