"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  User,
  Phone,
  Car as CarIcon,
  Calendar,
  MapPin,
  Navigation,
  Briefcase,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  Search,
  Clock
} from "lucide-react";
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
  const [destination, setDestination] = useState("");
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

  const fieldStatus = (val: string) =>
    submitted && !val.trim()
      ? "border-red-500 bg-red-50/10 text-red-900 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
      : "border-slate-100 bg-slate-50/50 hover:border-brand-600/30 focus:border-brand-600 focus:bg-white focus:shadow-xl focus:shadow-brand-600/5";

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!user?.email) return;
    if (!user.email_confirmed_at) {
      setError("Only verified accounts can make a booking. Please confirm your email first.");
      setBusy(false);
      return;
    }
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !carId ||
      !pickupAt ||
      !returnAt ||
      !pickupLoc.trim() ||
      !dropLoc.trim() ||
      !destination.trim()
    ) {
      setError("Please complete all required fields.");
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
          destination: destination,
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
      // Redirect to contract page so customer signs agreement before payment
      window.location.href = `/contract?booking=${encodeURIComponent(json.id)}`;
    } catch {
      setError("Something went wrong.");
    }
    setBusy(false);
  };

  if (!bookingOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-onyx-950/40 backdrop-blur-md" onClick={() => !busy && closeBooking()} />

      <div className="relative w-full max-w-4xl rounded-[3rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">

        {/* Reservation Sidebar Summary */}
        <div className="bg-onyx-950 md:w-[340px] p-10 text-white flex flex-col relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.1),transparent_70%)]" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-brand-600/10 rounded-full blur-3xl group-hover:bg-brand-600/20 transition-all duration-700" />

          <div className="mb-12 relative z-10">
            <div className="h-16 w-16 rounded-[2rem] bg-brand-600 flex items-center justify-center mb-8 shadow-2xl shadow-brand-600/30 border border-white/10 group-hover:scale-110 transition-transform duration-500">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-brand-600 mb-2">Reservation</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 opacity-80">Nova Executive Fleet</p>
          </div>

          <div className="space-y-8 flex-1">
            {selectedCar ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Selected Asset</p>
                  <p className="text-lg font-bold text-white">{selectedCar.make} {selectedCar.model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Rate Mode</p>
                  <p className="text-sm font-bold text-brand-600">{driving}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Select a vehicle to view configuration summary.</p>
            )}

            {durationLabel && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Duration</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-brand-600" />
                  <span className="text-sm font-bold">{durationLabel}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-10 border-t border-white/5 relative z-10">
            <div className="flex items-center justify-between mb-3 text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-widest">Investment Summary</span>
              <div className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse" />
            </div>
            <div className="text-4xl font-display font-black text-white tracking-tight">
              {total > 0 ? (
                <span className="flex items-baseline gap-2">
                  <span className="text-xs text-brand-600 font-bold">KSh</span>
                  {total.toLocaleString('en-US')}
                </span>
              ) : "—"}
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-brand-600" />
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                Paystack Secure Gateway
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 bg-white p-6 md:p-12 overflow-y-auto">
          <div className="absolute right-8 top-8 z-10">
            <button
              onClick={() => !busy && closeBooking()}
              className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-onyx-950 hover:text-brand-600 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-w-xl">
            <h3 className="text-2xl font-black text-onyx-950 uppercase tracking-widest mb-2">Deployment <span className="text-brand-600">Brief</span></h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60 mb-12">Client mandate for executive asset mobilization.</p>

            {error && (
              <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-10">
              {/* Tier 1: Personal Credentials */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-1 w-6 bg-brand-600 rounded-full" ></span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Personal Credentials</span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950">
                      <User className="h-3 w-3 text-brand-600" /> Full Name
                    </label>
                    <input
                      className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold focus:outline-none transition-all ${fieldStatus(fullName)}`}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950">
                      <Phone className="h-3 w-3 text-brand-600" /> Phone Number
                    </label>
                    <input
                      className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold focus:outline-none transition-all ${fieldStatus(phone)}`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254..."
                    />
                  </div>
                </div>
              </section>

              {/* Tier 2: Asset Allocation */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-1 w-6 bg-brand-600 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Asset & Configuration</span>
                </div>
                <div className="space-y-6">
                  <div className="relative space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-onyx-950">
                      <CarIcon className="h-3 w-3 text-brand-600" /> Asset Selection
                    </label>
                    <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                      <input
                        className={`w-full rounded-2xl border pl-14 pr-6 py-5 text-sm font-bold focus:outline-none transition-all ${submitted && !carId ? "border-red-500 bg-red-50 shadow-[0_0_20px_rgba(239,68,68,0.05)]" : "border-slate-100 bg-slate-50/50 focus:border-brand-600 focus:bg-white focus:shadow-2xl focus:shadow-brand-600/5"}`}
                        placeholder="Search fleet inventory..."
                        value={carQuery}
                        onChange={(e) => {
                          setCarQuery(e.target.value);
                          setCarId("");
                          setDropdownOpen(true);
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                      />
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                    </div>
                    {dropdownOpen && (
                      <ul className="absolute z-[110] mt-2 max-h-64 w-full overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-2xl p-2 text-sm animate-in fade-in zoom-in-95">
                        {carsLoading ? (
                          <li className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing database...</li>
                        ) : filteredCars.length === 0 ? (
                          <li className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">No assets found</li>
                        ) : (
                          filteredCars.map((c) => (
                            <li
                              key={c.id}
                              className="cursor-pointer rounded-2xl px-6 py-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                              onMouseDown={() => {
                                setCarId(c.id);
                                setCarQuery(`${c.make} ${c.model} (${c.year})`);
                                setDropdownOpen(false);
                              }}
                            >
                              <div>
                                <p className="font-bold text-onyx-950">{c.make} {c.model}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{c.location}</p>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 opacity-0 group-hover:opacity-100">Select Asset</span>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950">
                        <Briefcase className="h-3 w-3 text-brand-600" /> Driving Mode
                      </label>
                      <select
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer"
                        value={driving}
                        onChange={(e) => setDriving(e.target.value)}
                      >
                        {DRIVING.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Policy Note</p>
                      <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-wider italic">
                        Chauffeured mode includes a certified executive pilot.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tier 3: Scheduling & Logistics */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-1 w-6 bg-brand-600 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Scheduling & Deployment</span>
                </div>
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-onyx-950">
                        <Clock className="h-3 w-3 text-brand-600" /> Pickup Date
                      </label>
                      <input
                        type="datetime-local"
                        className={`w-full rounded-2xl border px-6 py-5 text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer ${submitted && !pickupAt ? "border-red-500 bg-red-50" : "border-slate-100 bg-slate-50/50 focus:border-brand-600 focus:bg-white focus:shadow-xl shadow-brand-600/5 hover:border-brand-600/30"}`}
                        value={pickupAt}
                        onChange={(e) => setPickupAt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-onyx-950">
                        <Clock className="h-3 w-3 text-brand-600" /> Return Date
                      </label>
                      <input
                        type="datetime-local"
                        className={`w-full rounded-2xl border px-6 py-5 text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer ${submitted && !returnAt ? "border-red-500 bg-red-50" : "border-slate-100 bg-slate-50/50 focus:border-brand-600 focus:bg-white focus:shadow-xl shadow-brand-600/5 hover:border-brand-600/30"}`}
                        value={returnAt}
                        onChange={(e) => setReturnAt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950">
                        <MapPin className="h-3 w-3 text-brand-600" /> Pickup Location
                      </label>
                      <input
                        className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold focus:outline-none transition-all ${fieldStatus(pickupLoc)}`}
                        value={pickupLoc}
                        onChange={(e) => setPickupLoc(e.target.value)}
                        placeholder="Nairobi (Headquarters)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950">
                        <MapPin className="h-3 w-3 text-brand-600" /> Dropoff Location
                      </label>
                      <input
                        className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold focus:outline-none transition-all ${fieldStatus(dropLoc)}`}
                        value={dropLoc}
                        onChange={(e) => setDropLoc(e.target.value)}
                        placeholder="Nairobi (Central)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950">
                      <Navigation className="h-3 w-3 text-brand-600" /> Destination
                    </label>
                    <input
                      className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold focus:outline-none transition-all ${fieldStatus(destination)}`}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Mara Luxury Camp"
                    />
                  </div>
                </div>
              </section>

              {/* Tier 4: Operational Extras */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-1 w-6 bg-brand-600 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Additional Instructions</span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950">
                    <MessageSquare className="h-3 w-3 text-brand-600" /> Special Directives
                  </label>
                  <textarea
                    className="w-full rounded-3xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold focus:outline-none transition-all min-h-[120px]"
                    placeholder="Special requirements, child seats, or security detail needs..."
                    value={special}
                    onChange={(e) => setSpecial(e.target.value)}
                  />
                </div>
              </section>
            </div>

            <div className="mt-16 flex items-center gap-4">
              <button
                type="button"
                disabled={busy || total <= 0}
                onClick={() => void submit()}
                className="flex-1 rounded-[2rem] bg-onyx-950 py-6 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-2xl hover:bg-brand-600 transition-all disabled:opacity-50 group flex items-center justify-center gap-3"
              >
                {busy ? "Securing Dossier..." : (
                  <>
                    <CreditCard className="h-5 w-5 text-brand-600 group-hover:text-white transition-colors" />
                    Proceed to Checkout
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => !busy && closeBooking()}
                className="px-10 py-6 rounded-[2rem] border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:border-onyx-950 hover:text-onyx-950 transition-all"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
