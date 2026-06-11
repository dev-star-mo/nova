"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { computeRentalTotal } from "@/lib/pricing";
import type { Car } from "@/types/database";

type BookingRow = {
  id: string;
  total_amount: number;
  status: string;
  full_name: string;
  pickup_at: string;
  return_at: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  driving_mode: string;
  special_requests: string | null;
  car_id: string;
};

const DRIVING = ["Self-driven", "Chauffeured"] as const;

function toDateTimeLocal(iso: string): string {
  // Convert ISO string to "YYYY-MM-DDTHH:mm" for datetime-local input
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CheckoutClient({
  booking: initialBooking,
  car,
}: {
  booking: BookingRow;
  car: Car | null;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState(initialBooking);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [pickupAt, setPickupAt] = useState(toDateTimeLocal(booking.pickup_at));
  const [returnAt, setReturnAt] = useState(toDateTimeLocal(booking.return_at));
  const [pickupLoc, setPickupLoc] = useState(booking.pickup_location ?? "");
  const [dropLoc, setDropLoc] = useState(booking.dropoff_location ?? "");
  const [drivingMode, setDrivingMode] = useState(booking.driving_mode);
  const [specialReqs, setSpecialReqs] = useState(booking.special_requests ?? "");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Live price estimate while editing
  const liveTotal = useMemo(() => {
    if (!car || !pickupAt || !returnAt) return 0;
    const p = new Date(pickupAt);
    const r = new Date(returnAt);
    if (r <= p) return 0;
    let base = computeRentalTotal(car, p, r);
    if (drivingMode === "Chauffeured") base = Math.round(base * 1.35 * 100) / 100;
    return base;
  }, [car, pickupAt, returnAt, drivingMode]);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not start payment");
        setBusy(false);
        return;
      }
      if (json.authorization_url) {
        window.location.href = json.authorization_url;
        return;
      }
    } catch {
      setError("Network error");
    }
    setBusy(false);
  };

  const saveEdit = async () => {
    setEditError(null);
    const p = new Date(pickupAt);
    const r = new Date(returnAt);
    if (r <= p) {
      setEditError("Return must be after pickup.");
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
          driving_mode: drivingMode,
          special_requests: specialReqs,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditError(json.error ?? "Failed to save changes.");
        setSaving(false);
        return;
      }
      setBooking(json);
      setEditing(false);
      router.refresh();
    } catch {
      setEditError("Network error.");
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    // Reset edit fields to current booking values
    setPickupAt(toDateTimeLocal(booking.pickup_at));
    setReturnAt(toDateTimeLocal(booking.return_at));
    setPickupLoc(booking.pickup_location ?? "");
    setDropLoc(booking.dropoff_location ?? "");
    setDrivingMode(booking.driving_mode);
    setSpecialReqs(booking.special_requests ?? "");
    setEditError(null);
    setEditing(false);
  };

  const carLabel = car ? `${car.make} ${car.model}` : "Vehicle";
  const isPending = booking.status === "pending";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Checkout</h1>
      <p className="mt-2 text-sm text-slate-600">
        Review your reservation and pay securely with Paystack.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {!editing ? (
          <>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Vehicle</dt>
                <dd className="font-medium text-ink">{carLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Renter</dt>
                <dd className="font-medium text-ink">{booking.full_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Pickup</dt>
                <dd className="text-right font-medium text-ink">
                  {new Date(booking.pickup_at).toLocaleString("en-US")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Return</dt>
                <dd className="text-right font-medium text-ink">
                  {new Date(booking.return_at).toLocaleString("en-US")}
                </dd>
              </div>
              {booking.pickup_location && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Pickup location</dt>
                  <dd className="text-right font-medium text-ink max-w-[60%]">{booking.pickup_location}</dd>
                </div>
              )}
              {booking.dropoff_location && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Drop-off location</dt>
                  <dd className="text-right font-medium text-ink max-w-[60%]">{booking.dropoff_location}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Driving mode</dt>
                <dd className="font-medium text-ink">{booking.driving_mode}</dd>
              </div>
              {booking.special_requests && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Special requests</dt>
                  <dd className="text-right font-medium text-ink max-w-[60%]">{booking.special_requests}</dd>
                </div>
              )}
              <div className="border-t border-slate-100 pt-3 flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd className="text-brand-700">
                  KSh. {Number(booking.total_amount).toLocaleString("en-US")}
                </dd>
              </div>
            </dl>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <p className="mt-4 text-xs text-slate-500">
              Payment will be processed securely through Paystack (KES).
            </p>

            {booking.status === "paid" ? (
              <p className="mt-6 text-center font-medium text-green-700">
                This booking is already paid.
              </p>
            ) : (
              <>
                {isPending && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-4 w-full rounded-xl border border-brand-600 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    ✏️ Edit booking details
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void pay()}
                  className="mt-3 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {busy ? "Redirecting…" : "Pay with Paystack"}
                </button>
              </>
            )}
          </>
        ) : (
          /* ── Edit form ─────────────────────────────────────────── */
          <div className="space-y-4">
            <h2 className="font-semibold text-ink">Edit booking details</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Pickup date &amp; time
                </label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={pickupAt}
                  onChange={(e) => setPickupAt(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Return date &amp; time
                </label>
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
              <label className="text-sm font-medium text-slate-700">
                Special requests (optional)
              </label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={2}
                value={specialReqs}
                onChange={(e) => setSpecialReqs(e.target.value)}
              />
            </div>

            {/* Live price preview */}
            {liveTotal > 0 && (
              <div className="rounded-xl bg-slate-50 px-4 py-3 flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-600">Updated total</span>
                <span className="text-brand-700 text-base">
                  KSh. {liveTotal.toLocaleString("en-US")}
                </span>
              </div>
            )}

            {editError && <p className="text-sm text-red-600">{editError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={saving}
                className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        <Link
          href="/my-bookings"
          className="mt-4 block text-center text-sm text-brand-600 hover:underline"
        >
          View my bookings
        </Link>
      </div>
    </div>
  );
}
