"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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

//for writing reviews
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="absolute inset-0" aria-hidden onClick={() => !saving && onClose()} />
      <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          onClick={() => !saving && onClose()}
        >
          ✕
        </button>

        <h2 className="font-display text-xl font-bold text-ink pr-8">Write a Review</h2>
        <p className="mt-1 text-sm text-slate-500">
          How was your experience with the {car?.make} {car?.model}?
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Rating (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">What did you like?</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              rows={2}
              value={liked}
              onChange={(e) => setLiked(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">What didn&apos;t you like / can be improved?</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              rows={2}
              value={disliked}
              onChange={(e) => setDisliked(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Any complaints?</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              rows={2}
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Overall comments</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
//end of writing reviews

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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="absolute inset-0" aria-hidden onClick={() => !saving && onClose()} />
      <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          onClick={() => !saving && onClose()}
        >
          ✕
        </button>

        <h2 className="font-display text-xl font-bold text-ink pr-8">Edit booking</h2>
        <p className="mt-1 text-sm text-slate-500">
          Only pending bookings can be edited.
        </p>

        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Pickup date &amp; time</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Return date &amp; time</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={returnAt}
                onChange={(e) => setReturnAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Pickup location</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={pickupLoc}
              onChange={(e) => setPickupLoc(e.target.value)}
              placeholder="e.g. JKIA Terminal 1, Nairobi"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Drop-off location</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={dropLoc}
              onChange={(e) => setDropLoc(e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Destination</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Mombasa, Naivasha, etc."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Driving mode</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={drivingMode}
              onChange={(e) => setDrivingMode(e.target.value)}
            >
              {DRIVING.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Special requests (optional)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              rows={2}
              value={specialReqs}
              onChange={(e) => setSpecialReqs(e.target.value)}
            />
          </div>

          {liveTotal > 0 && (
            <div className="rounded-xl bg-slate-50 px-4 py-3 flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-600">Updated total</span>
              <span className="text-brand-700 text-base">
                KSh. {liveTotal.toLocaleString("en-US")}
              </span>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
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

      <ul className="mt-8 space-y-4">
        {bookings.map((b) => {
          const c = carMap[b.car_id];
          const isPending = b.status === "pending";
          const isElapsed = new Date(b.return_at) < now;
          const hasReviewed = reviews.some((r) => r.booking_id === b.id);

          return (
            <li
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">
                    {c ? `${c.make} ${c.model}` : "Vehicle"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(b.pickup_at).toLocaleString()} →{" "}
                    {new Date(b.return_at).toLocaleString()}
                  </p>
                  {b.pickup_location && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      📍 {b.pickup_location} → {b.dropoff_location}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${b.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : b.status === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                      }`}
                  >
                    {b.status}
                  </span>
                  {hasReviewed && (
                    <span className="text-xs font-semibold text-emerald-600">
                      ★ Reviewed
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm font-medium text-brand-700">
                KSh. {Number(b.total_amount).toLocaleString()}
              </p>

              <div className="mt-3 flex flex-wrap gap-3 items-center">
                {isPending && (
                  <button
                    type="button"
                    onClick={() => setEditingId(b.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                )}
                {isElapsed && !hasReviewed && (
                  <button
                    type="button"
                    onClick={() => setReviewingId(b.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600 px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    📝 Write Review
                  </button>
                )}
                {b.status !== "paid" && (
                  <Link
                    href={`/checkout?booking=${b.id}`}
                    className="inline-flex items-center text-sm font-semibold text-brand-600 hover:underline"
                  >
                    Continue to payment →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {bookings.length === 0 && (
        <p className="mt-10 text-center text-slate-500">
          No bookings yet.{" "}
          <Link href="/cars" className="text-brand-600 hover:underline">
            Browse fleet
          </Link>
        </p>
      )}
    </>
  );
}
