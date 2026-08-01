"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  Edit3,
  ChevronRight,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Plus,
  Briefcase,
  Navigation,
  CreditCard,
  ChevronDown
} from "lucide-react";
import { computeRentalTotal } from "@/lib/pricing";
import type { Car, Review } from "@/types/database";

type BookingRow = {
  id: string;
  status: string;
  total_amount: number;
  pickup_at: string;
  return_at: string;
  car_id: string;
  destination: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  driving_mode: string;
  special_requests: string | null;
};

type CarInfo = {
  id: string;
  make: string;
  model: string;
} & Partial<Car>;

const DRIVING = ["Self-driven", "Chauffeured"] as const;

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ReviewModal({
  booking,
  car,
  onClose,
  onSaved,
}: {
  booking: BookingRow;
  car: CarInfo | null;
  onClose: () => void;
  onSaved: (review: Review) => void;
}) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [complaints, setComplaints] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    if (!rating || rating < 1 || rating > 5) {
      setError("Please provide a valid rating between 1 and 5.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          rating,
          comment,
          liked,
          disliked,
          complaints,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save review.");
        setSaving(false);
        return;
      }
      onSaved(json);
      onClose();
    } catch {
      setError("Network error.");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-onyx-950/60 transition-all duration-500">
      <div className="absolute inset-0" aria-hidden onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-xl rounded-[2.5rem] bg-white p-8 shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95 fill-mode-forwards sm:p-12">
        <button
          type="button"
          className="absolute right-8 top-8 rounded-full bg-slate-50 p-2 text-slate-400 hover:bg-slate-100 hover:text-onyx-950 transition-all"
          onClick={() => !saving && onClose()}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-2 text-brand-600 mb-3 font-bold text-xs uppercase tracking-widest">
            <Star className="h-4 w-4 fill-brand-600" />
            Client Experience
          </div>
          <h2 className="font-display text-3xl font-bold text-onyx-950 leading-tight">Rate Your Journey</h2>
          <p className="mt-2 text-slate-500 font-medium">
            Sharing your experience with the {car?.make} {car?.model} helps us maintain excellence.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Overall Rating</label>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${rating >= s ? "bg-brand-600 text-white shadow-lg" : "bg-slate-50 text-slate-300 hover:bg-brand-50 hover:text-brand-600"}`}
                >
                  <Star className={`h-6 w-6 ${rating >= s ? "fill-white" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Highlights</label>
              <textarea
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
                rows={2}
                placeholder="What exceeded expectations?"
                value={liked}
                onChange={(e) => setLiked(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Improvements</label>
              <textarea
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
                rows={2}
                placeholder="Any aspects to refine?"
                value={disliked}
                onChange={(e) => setDisliked(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Comments</label>
            <textarea
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all"
              rows={3}
              placeholder="Detailed testimonials foster community trust..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-2xl border-2 border-slate-100 py-4 text-xs font-bold uppercase tracking-widest text-onyx-950 hover:bg-slate-50 hover:border-slate-200 transition-all disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex-[2] rounded-2xl bg-brand-600 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl hover:bg-brand-700 hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              {saving ? "Publishing…" : "Publish Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  booking,
  car,
  onClose,
  onSaved,
}: {
  booking: BookingRow;
  car: CarInfo | null;
  onClose: () => void;
  onSaved: (updated: BookingRow) => void;
}) {
  const [pickupAt, setPickupAt] = useState(toDateTimeLocal(booking.pickup_at));
  const [returnAt, setReturnAt] = useState(toDateTimeLocal(booking.return_at));
  const [pickupLoc, setPickupLoc] = useState(booking.pickup_location ?? "");
  const [dropLoc, setDropLoc] = useState(booking.dropoff_location ?? "");
  const [destination, setDestination] = useState(booking.destination ?? "");
  const [drivingMode, setDrivingMode] = useState(booking.driving_mode);
  const [specialReqs, setSpecialReqs] = useState(booking.special_requests ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveTotal = useMemo(() => {
    if (!car || !(car as Car).price_per_day) return 0;
    if (!pickupAt || !returnAt) return 0;
    const p = new Date(pickupAt);
    const r = new Date(returnAt);
    if (r <= p) return 0;
    let base = computeRentalTotal(car as Car, p, r);
    if (drivingMode === "Chauffeured") base = Math.round(base * 1.35 * 100) / 100;
    return base;
  }, [car, pickupAt, returnAt, drivingMode]);

  const save = async () => {
    setError(null);
    const p = new Date(pickupAt);
    const r = new Date(returnAt);
    if (r <= p) {
      setError("Return must be after pickup.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_at: p.toISOString(),
          return_at: r.toISOString(),
          pickup_location: pickupLoc,
          dropoff_location: dropLoc,
          destination: destination,
          driving_mode: drivingMode,
          special_requests: specialReqs,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save changes.");
        setSaving(false);
        return;
      }
      onSaved(json);
      onClose();
    } catch {
      setError("Network error.");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-onyx-950/60">
      <div className="absolute inset-0" aria-hidden onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-2xl rounded-[2.5rem] bg-white p-8 shadow-2xl sm:p-12 overflow-y-auto max-h-[90vh]">
        <button
          type="button"
          className="absolute right-8 top-8 rounded-[1.25rem] bg-onyx-50 p-2.5 text-slate-400 hover:bg-onyx-950 hover:text-brand-600 transition-all duration-300"
          onClick={() => !saving && onClose()}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1.5 w-6 bg-brand-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Reservation Management</span>
          </div>
          <h2 className="font-display text-3xl font-black text-onyx-950 uppercase tracking-tight">Modify <span className="text-brand-600">Details</span></h2>
          <p className="mt-3 text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Modifications are permitted for pending reservations only.</p>
        </div>

        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
                <Clock className="h-3 w-3 text-brand-600" /> Pickup Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white focus:shadow-2xl focus:shadow-brand-600/5 transition-all appearance-none cursor-pointer"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
                <Clock className="h-3 w-3 text-brand-600" /> Return Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white focus:shadow-2xl focus:shadow-brand-600/5 transition-all appearance-none cursor-pointer"
                value={returnAt}
                onChange={(e) => setReturnAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
                <MapPin className="h-3 w-3 text-brand-600" /> Pickup Point
              </label>
              <input
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all"
                value={pickupLoc}
                onChange={(e) => setPickupLoc(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
                <MapPin className="h-3 w-3 text-brand-600" /> Drop-off Point
              </label>
              <input
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all"
                value={dropLoc}
                onChange={(e) => setDropLoc(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
              <Navigation className="h-3 w-3 text-brand-600" /> Destination
            </label>
            <input
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
              <Briefcase className="h-3 w-3 text-brand-600" /> Service Tier
            </label>
            <div className="relative">
              <select
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all appearance-none cursor-pointer"
                value={drivingMode}
                onChange={(e) => setDrivingMode(e.target.value)}
              >
                {DRIVING.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {liveTotal > 0 && (
            <div className="rounded-[2.5rem] bg-onyx-950 px-8 py-7 flex items-center justify-between border border-white/5 shadow-2xl shadow-onyx-950/20 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-transparent" />
              <div className="relative z-10">
                <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[9px] block mb-1">Estimated New Total</span>
                <span className="text-3xl font-black text-white">$ {liveTotal.toLocaleString('en-US')}</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10 backdrop-blur-sm">
                <CreditCard className="h-6 w-6 text-brand-600" />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 p-5 flex items-start gap-4 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-[2rem] border border-slate-100 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-onyx-950 hover:text-onyx-950 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex-[2] rounded-[2rem] bg-onyx-950 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl hover:bg-brand-600 hover:-translate-y-1 transition-all active:scale-95 group flex items-center justify-center gap-3"
            >
              <CheckCircle2 className="h-4 w-4 text-brand-600 group-hover:text-white transition-colors" />
              {saving ? "Updating..." : "Commit Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyBookingsClient({
  initialBookings,
  carMap,
  initialReviews = [],
}: {
  initialBookings: BookingRow[];
  carMap: Record<string, CarInfo>;
  initialReviews?: Review[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [reviews, setReviews] = useState(initialReviews);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const editingBooking = editingId ? bookings.find((b) => b.id === editingId) ?? null : null;
  const editingCar = editingBooking ? carMap[editingBooking.car_id] ?? null : null;

  const reviewingBooking = reviewingId ? bookings.find((b) => b.id === reviewingId) ?? null : null;
  const reviewingCar = reviewingBooking ? carMap[reviewingBooking.car_id] ?? null : null;

  const handleSavedEdit = (updated: BookingRow) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
  };

  const handleSavedReview = (savedReview: Review) => {
    setReviews((prev) => [...prev, savedReview]);
  };

  const now = new Date();

  return (
    <>
      {editingBooking && (
        <EditModal
          booking={editingBooking}
          car={editingCar}
          onClose={() => setEditingId(null)}
          onSaved={handleSavedEdit}
        />
      )}

      {reviewingBooking && (
        <ReviewModal
          booking={reviewingBooking}
          car={reviewingCar}
          onClose={() => setReviewingId(null)}
          onSaved={handleSavedReview}
        />
      )}

      <div className="space-y-6 mt-12 pb-16">
        {bookings.map((b) => {
          const c = carMap[b.car_id];
          const isPending = b.status === "pending";
          const isElapsed = new Date(b.return_at) < now;
          const hasReviewed = reviews.some((r) => r.booking_id === b.id);

          const statusConfig: Record<string, { bg: string, text: string, icon: any }> = {
            paid: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
            confirmed: { bg: "bg-brand-50", text: "text-brand-900", icon: CheckCircle2 },
            pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
            cancelled: { bg: "bg-red-50", text: "text-red-700", icon: AlertCircle },
          };
          const config = statusConfig[b.status] || statusConfig.pending;

          return (
            <div
              key={b.id}
              className="premium-card group relative overflow-hidden rounded-[2.5rem] bg-white p-8 transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:p-10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.bg} ${config.text}`}>
                      <config.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="h-1 w-3 bg-brand-600 rounded-full" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">Active Reservation</span>
                      </div>
                      <h3 className="font-display text-2xl font-bold text-onyx-950 group-hover:text-brand-600 transition-colors">
                        {c ? `${c.make} ${c.model}` : "Premium Vehicle"}
                      </h3>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex items-start gap-4">
                      <Calendar className="h-5 w-5 mt-1 text-slate-300" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rental Period</div>
                        <p className="text-sm font-bold text-onyx-950 leading-relaxed">
                          {new Date(b.pickup_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} — {new Date(b.return_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {b.pickup_location && (
                      <div className="flex items-start gap-4">
                        <MapPin className="h-5 w-5 mt-1 text-slate-300" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Collection & Recovery</div>
                          <p className="text-sm font-bold text-onyx-950 leading-relaxed line-clamp-1">
                            {b.pickup_location} → {b.dropoff_location}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:w-px md:h-24 bg-slate-100 hidden md:block" />

                <div className="flex flex-col items-start md:items-end justify-center md:min-w-[200px]">
                  <div className="mb-4 text-left md:text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Investment</div>
                    <div className="text-3xl font-bold text-onyx-950">$ {Number(b.total_amount).toLocaleString('en-US')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasReviewed && (
                      <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 border border-emerald-100">
                        <Star className="h-3 w-3 fill-emerald-600" /> Verified Experience
                      </div>
                    )}
                    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${config.bg} ${config.text} border border-current/10 shadow-sm`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => setEditingId(b.id)}
                      className="group/btn inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-3 text-xs font-bold uppercase tracking-widest text-onyx-950 transition-all hover:border-brand-600 hover:text-brand-600"
                    >
                      <Edit3 className="h-3.5 w-3.5 transition-transform group-hover/btn:-rotate-12" /> Modify
                    </button>
                  )}
                  {isElapsed && !hasReviewed && (
                    <button
                      type="button"
                      onClick={() => setReviewingId(b.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:bg-brand-700 hover:-translate-y-1"
                    >
                      <Star className="h-3.5 w-3.5 fill-white" /> Write Review
                    </button>
                  )}
                  {b.status !== "paid" && (
                    <Link
                      href={`/contract?booking=${b.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-onyx-950 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:bg-black hover:-translate-y-1"
                    >
                      Process Payment <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                <Link href={`/my-bookings/${b.id}`} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-brand-600 transition-colors">
                  View full summary
                </Link>
              </div>
            </div>
          );
        })}

        {bookings.length === 0 && (
          <div className="py-32 text-center rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50">
            <div className="mx-auto h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
              <Calendar className="h-10 w-10" />
            </div>
            <h3 className="font-display text-2xl font-bold text-onyx-950 tracking-tight">No Reservatons Yet</h3>
            <p className="mt-2 text-slate-500 font-medium">Your premium automotive journey starts here.</p>
            <Link href="/cars" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-2xl hover:bg-brand-700 transition-all hover:-translate-y-1">
              Explore The Fleet <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
