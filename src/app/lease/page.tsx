"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
    title: "Small",
    desc: "Great for city errands and daily commutes.",
    image: "https://media.autochek.africa/file/8JNfy70D.webp",
  },
  {
    title: "Saloon",
    desc: "Comfortable, efficient, and perfect for everyday trips.",
    image: "https://kai-and-karo.ams3.cdn.digitaloceanspaces.com/media/vehicles/thumbnails/5716207d-190c-466f-9f9c-66ec300d9d37.jpeg",
  },
  {
    title: "Executive",
    desc: "Premium comfort for business and VIP movement.",
    image: "https://kai-and-karo.ams3.cdn.digitaloceanspaces.com/media/vehicles/thumbnails/344abc39-eeb1-47f3-91b0-ac3d4f274214.jpeg",
  },
  {
    title: "7-Seater",
    desc: "Family travel with extra space for luggage.",
    image: "https://kai-and-karo.ams3.cdn.digitaloceanspaces.com/media/vehicles/images/IMG-20230513-WA0211.jpg",
  },
  {
    title: "SUV",
    desc: "Higher clearance and comfort for longer routes.",
    image: "https://media.dealersyard.com/vehicles/01kmabqw59hbfewzzqf8rs643y/IxPtlZ5J5fhd4oQ5DwrDWSgGO09m9yctXXpB0mpq6OqwO3Lo3nRjwmXTcxNpjQ7T.jpg",
  },
  {
    title: "4x4 / V8",
    desc: "Built for tougher terrain and safari routes.",
    image: "https://gybird.co.ke/site/images/car_images/untitled-design-73-1771333789.jpg",
  },
];

export default function LeasePage() {
  const { user, loading } = useUserSession();
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

  const { profile } = useUserSession();

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
    if (!Number.isFinite(y) || y < 1990 || y > new Date().getFullYear() + 1) {
      setError("Please enter a valid year.");
      return;
    }
    if (!Number.isFinite(km) || km < 0) {
      setError("Please enter a valid mileage.");
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
          upsert: false,
          contentType: file.type || "image/jpeg",
        });
        if (uploadError) {
          setError(`Upload failed: ${uploadError.message}`);
          setBusy(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
        image_urls.push(publicUrlData.publicUrl);
      }

      const res = await fetch("/api/lease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          model,
          year: y,
          mileage_km: km,
          lease_duration_months: dur,
          image_urls,
          phone_numbers: validPhones,
          user_full_name: profile?.full_name ?? user.email,
          user_email: user.email,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Submission failed");
        return;
      }

      setSuccess("Thanks — we received your lease request with " + photos.length + " photos. Our team will reach out shortly.");
      setBrand("");
      setModel("");
      setYear("");
      setMileage("");
      setDuration("");
      setPhotos([]);
      setPhones([""]);
      setSubmitted(false);
    } catch (err: unknown) {
      setError(`Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Lease your car with NovaDrive
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Earn with your vehicle while we handle marketing, customer support, and booking
            coordination. Submit your car details and we’ll get in touch.
          </p>
          <button
            type="button"
            onClick={() => {
              if (user) {
                document.getElementById("lease-form")?.scrollIntoView({ behavior: "smooth" });
              } else {
                openAuth("gate");
              }
            }}
            className="mt-8 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Lease Your Car With Us
          </button>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-ink">Categories we accept</h2>
          <p className="mt-2 text-slate-600">
            We work with a wide range of vehicles — here are common categories requested by our
            customers.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <div
                key={c.title}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[16/10] bg-slate-100">
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 360px, 100vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-ink">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lease-form" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl font-bold text-ink">Lease request form</h2>
            <p className="mt-2 text-sm text-slate-600">
              You must be signed in to submit a lease request.
            </p>

            {!loading && !user ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">Sign in required</div>
                <div className="mt-1">
                  Please sign in to continue. If the login modal didn’t open, click the button
                  below.
                </div>
                <button
                  type="button"
                  className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                  onClick={() => openAuth("gate")}
                >
                  Sign in / Create account
                </button>
              </div>
            ) : null}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-4 text-sm text-emerald-700">{success}</p>}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(
                    brand
                  )}`}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={!user || busy}
                  placeholder="e.g. Toyota"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(
                    model
                  )}`}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={!user || busy}
                  placeholder="e.g. Prado"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(
                    year
                  )}`}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={!user || busy}
                  placeholder="e.g. 2021"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Mileage (km) <span className="text-red-500">*</span>
                </label>
                <input
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(
                    mileage
                  )}`}
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  disabled={!user || busy}
                  placeholder="e.g. 85000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Lease Duration (Months) <span className="text-red-500">*</span>
                </label>
                <input
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(
                    duration
                  )}`}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={!user || busy}
                  placeholder="e.g. 12"
                  inputMode="numeric"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Phone number(s) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 space-y-2">
                  {phones.map((p, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${submitted && !p.trim() ? "border-red-500 ring-1 ring-red-400" : "border-slate-200"
                          }`}
                        value={p}
                        onChange={(e) => {
                          const n = [...phones];
                          n[idx] = e.target.value;
                          setPhones(n);
                        }}
                        placeholder="e.g. 0722000000"
                        disabled={!user || busy}
                      />
                      {phones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                          className="rounded-xl border border-slate-200 px-3 text-slate-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhones([...phones, ""])}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                    disabled={!user || busy}
                  >
                    + Add another phone number
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Vehicle photos (Upload clear exterior and interior photo) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none ${submitted && photos.length === 0 ? "border-red-500 ring-1 ring-red-400" : "border-slate-200"
                    }`}
                  onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
                  disabled={!user || busy}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Tip: Upload clear exterior and interior photo in good lighting. {photos.length > 0 && `(${photos.length} files selected)`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={!user || busy}
              className="mt-6 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {busy ? "Submitting…" : "Submit lease request"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

