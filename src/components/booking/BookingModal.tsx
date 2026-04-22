"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";
import { computeRentalTotal } from "@/lib/pricing";
import type { Car } from "@/types/database";

const DRIVING = ["Self-driven", "Chauffeured"] as const;

function computeDurationDays(pickupAt: string, returnAt: string): number {
  if (!pickupAt || !returnAt) return 0;
  const p = new Date(pickupAt);
  const r = new Date(returnAt);
  if (r <= p) return 0;
  return Math.max(1, Math.ceil((r.getTime() - p.getTime()) / (1000 * 60 * 60 * 24)));
}

export function BookingModal() {
  const { bookingOpen, closeBooking, preselectedCar } = useAppUI();
  const { user } = useUserSession();
  // stabilise the supabase client so it doesn't change on every render
  const supabase = useRef(createClient()).current;

  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<string>("");
  const [carQuery, setCarQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [pickupLoc, setPickupLoc] = useState("");
  const [dropLoc, setDropLoc] = useState("");
  const [driving, setDriving] = useState<string>(DRIVING[0]);
  const [special, setSpecial] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!bookingOpen) return;
    void (async () => {
      setCarsLoading(true);
      const { data, error: fetchError } = await supabase
        .from("cars")
        .select("*")
        .eq("available", true)
        .order("make");
      if (fetchError) {
        setError(fetchError.message);
        setCars([]);
        setCarsLoading(false);
        return;
      }
      setCars((data as Car[]) ?? []);
      setCarsLoading(false);
    })();
  }, [bookingOpen, supabase]);

  useEffect(() => {
    if (preselectedCar?.id) {
      setCarId(preselectedCar.id);
      const c = preselectedCar;
      setCarQuery(`${c.make} ${c.model} (${c.year})`);
    }
  }, [preselectedCar]);

  const filteredCars = useMemo(() => {
    const q = carQuery.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter(
      (c) =>
        `${c.make} ${c.model}`.toLowerCase().includes(q) ||
        `${c.make} ${c.model} ${c.year}`.toLowerCase().includes(q) ||
        (c.location ?? "").toLowerCase().includes(q) ||
        (c.slug ?? "").toLowerCase().includes(q)
    );
  }, [cars, carQuery]);

  const selectedCar = cars.find((c) => c.id === carId) ?? preselectedCar;
  const durationDays = computeDurationDays(pickupAt, returnAt);
  const durationLabel = durationDays ? `${durationDays} ${durationDays === 1 ? "day" : "days"}` : "";

  const total = useMemo(() => {
    if (!selectedCar || !pickupAt || !returnAt) return 0;
    const p = new Date(pickupAt);
    const r = new Date(returnAt);
    if (r <= p) return 0;
    let base = computeRentalTotal(selectedCar, p, r);
    if (driving === "Chauffeured") base = Math.round(base * 1.35 * 100) / 100;
    return base;
  }, [selectedCar, pickupAt, returnAt, driving]);

  const fieldErr = (val: string) =>
    submitted && !val.trim() ? "border-red-500 ring-1 ring-red-400" : "border-slate-200";

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!user?.email) return;
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !carId ||
      !pickupAt ||
      !returnAt ||
      !pickupLoc.trim() ||
      !dropLoc.trim()
    ) {
      setError("Please complete all required fields highlighted in red.");
      return;
    }
    const p = new Date(pickupAt);
    const r = new Date(returnAt);
    if (r <= p) {
      setError("Return must be after pickup.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_id: carId,
          full_name: fullName,
          phone,
          email: user.email,
          pickup_at: p.toISOString(),
          return_at: r.toISOString(),
          pickup_location: pickupLoc,
          dropoff_location: dropLoc,
          rental_duration: durationLabel,
          driving_mode: driving,
          special_requests: special,
          total_amount: total,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Booking failed");
        setBusy(false);
        return;
      }
      closeBooking();
      window.location.href = `/checkout?booking=${encodeURIComponent(json.id)}`;
    } catch {
      setError("Something went wrong.");
    }
    setBusy(false);
  };

  if (!bookingOpen || !user) return null;

  const carIdErr = submitted && !carId ? "border-red-500 ring-1 ring-red-400" : "border-slate-200";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="absolute inset-0" aria-hidden onClick={() => !busy && closeBooking()} />
      <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          onClick={() => !busy && closeBooking()}
        >
          ✕
        </button>
        <h2 className="font-display text-xl font-bold text-ink pr-8">Book your car with us</h2>
        <p className="mt-2 text-sm text-slate-600">
          Fill out the form below to reserve your vehicle. We&apos;ll confirm your booking within
          minutes.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {/* Full name */}
          <div>
            <label className="text-sm font-medium text-slate-700">Full name <span className="text-red-500">*</span></label>
            <input
              className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(fullName)}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-slate-700">Phone number <span className="text-red-500">*</span></label>
            <input
              className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(phone)}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Email address — must match your account
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              type="email"
              readOnly
              value={user.email ?? ""}
            />
          </div>

          {/* Car selector — custom dropdown */}
          <div className="relative">
            <label className="text-sm font-medium text-slate-700">Car <span className="text-red-500">*</span></label>
            <input
              className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${carIdErr}`}
              placeholder="Search by name…"
              value={carQuery}
              onChange={(e) => {
                setCarQuery(e.target.value);
                setCarId("");
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            />
            {dropdownOpen && (
              <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg text-sm">
                {carsLoading ? (
                  <li className="px-4 py-3 text-slate-400">Loading vehicles…</li>
                ) : filteredCars.length === 0 ? (
                  <li className="px-4 py-3 text-slate-400">No vehicles found</li>
                ) : (
                  filteredCars.map((c) => (
                    <li
                      key={c.id}
                      className="cursor-pointer px-4 py-2.5 hover:bg-brand-50 hover:text-brand-700"
                      onMouseDown={() => {
                        setCarId(c.id);
                        setCarQuery(`${c.make} ${c.model} (${c.year})`);
                        setDropdownOpen(false);
                      }}
                    >
                      {c.make} {c.model} ({c.year}) — {c.location}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Dates */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Pickup date &amp; time <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${submitted && !pickupAt ? "border-red-500 ring-1 ring-red-400" : "border-slate-200"}`}
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Return date &amp; time <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${submitted && !returnAt ? "border-red-500 ring-1 ring-red-400" : "border-slate-200"}`}
                value={returnAt}
                onChange={(e) => setReturnAt(e.target.value)}
              />
            </div>
          </div>

          {/* Rental duration — auto-computed */}
          {durationLabel && (
            <div>
              <label className="text-sm font-medium text-slate-700">Rental duration</label>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                {durationLabel}
              </div>
            </div>
          )}

          {/* Pickup location */}
          <div>
            <label className="text-sm font-medium text-slate-700">Pickup location <span className="text-red-500">*</span></label>
            <input
              className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(pickupLoc)}`}
              value={pickupLoc}
              onChange={(e) => setPickupLoc(e.target.value)}
              placeholder="e.g. JKIA Terminal 1, Nairobi"
            />
          </div>

          {/* Drop-off location */}
          <div>
            <label className="text-sm font-medium text-slate-700">Drop-off location <span className="text-red-500">*</span></label>
            <input
              className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${fieldErr(dropLoc)}`}
              value={dropLoc}
              onChange={(e) => setDropLoc(e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
            />
          </div>

          {/* Driving mode */}
          <div>
            <label className="text-sm font-medium text-slate-700">Driving mode</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={driving}
              onChange={(e) => setDriving(e.target.value)}
            >
              {DRIVING.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Special requests */}
          <div>
            <label className="text-sm font-medium text-slate-700">Special requests (optional)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              placeholder="Any special requirements, child seats, etc."
              value={special}
              onChange={(e) => setSpecial(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between text-lg font-bold text-ink">
            <span>Total</span>
            <span>
              {total > 0 ? `KSh. ${total.toLocaleString('en-US')}` : "—"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Payment will be processed securely through Paystack.
          </p>
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          disabled={busy || total <= 0}
          onClick={() => void submit()}
        >
          {busy ? "Saving…" : "Continue to payment"}
        </button>
      </div>
    </div>
  );
}
