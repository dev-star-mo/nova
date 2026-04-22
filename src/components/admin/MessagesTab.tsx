"use client";

import { useState } from "react";
import type { Booking } from "@/types/database";

type Props = { bookings: Booking[] };

type Channel = "email" | "whatsapp";

export function MessagesTab({ bookings }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [channel, setChannel] = useState<Channel>("email");
  const [message, setMessage] = useState("");

  const booking = bookings.find((b) => b.id === selectedId);

  const defaultMessage = booking
    ? channel === "whatsapp"
      ? `Hello ${booking.full_name},\n\nThank you for booking with NovaDrive! Your booking is confirmed.\n\nDetails:\n- Pickup: ${new Date(booking.pickup_at).toLocaleString()}\n- Return: ${new Date(booking.return_at).toLocaleString()}\n- Amount: KSh ${Number(booking.total_amount).toLocaleString()}\n\nPlease don't hesitate to reach out if you need anything.\n\nBest regards,\nNovaDrive Team`
      : `Hello ${booking.full_name},\n\nWe appreciate you choosing NovaDrive. Your booking ${booking.paystack_reference ? `(Ref: ${booking.paystack_reference})` : ""} has been received and is currently ${booking.status}.\n\nPlease feel free to reach out if you have any questions.\n\nWarm regards,\nNovaDrive Team`
    : "";

  const handleSend = () => {
    if (!booking) return;
    const text = message.trim() || defaultMessage;
    if (channel === "email") {
      window.open(`mailto:${booking.email}?subject=Your NovaDrive Booking&body=${encodeURIComponent(text)}`, "_blank");
    } else {
      const phone = booking.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Send a message to a customer</h3>

        {/* Booking selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Select booking</label>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setMessage(""); }}
          >
            <option value="">— Choose a booking —</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.full_name} — {b.email} ({b.status})
              </option>
            ))}
          </select>
        </div>

        {booking && (
          <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
            <p><span className="font-semibold">Customer:</span> {booking.full_name}</p>
            <p><span className="font-semibold">Email:</span> {booking.email}</p>
            <p><span className="font-semibold">Phone:</span> {booking.phone}</p>
            <p><span className="font-semibold">Status:</span> {booking.status}</p>
          </div>
        )}

        {/* Channel */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Channel</label>
          <div className="flex gap-2">
            {(["email", "whatsapp"] as Channel[]).map((c) => (
              <button
                key={c}
                onClick={() => { setChannel(c); setMessage(""); }}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors capitalize ${
                  channel === c
                    ? c === "whatsapp"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c === "email" ? "✉️ Email" : "💬 WhatsApp"}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Message <span className="font-normal text-slate-400">(leave blank to use default)</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows={6}
            placeholder={booking ? defaultMessage : "Select a booking first…"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!booking}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!booking}
          className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40 ${
            channel === "whatsapp"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {channel === "email" ? "Open email client →" : "Open WhatsApp →"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">
          {channel === "email"
            ? "This will open your email client with the message pre-filled."
            : "This will open WhatsApp Web with the message pre-filled."}
        </p>
      </div>
    </div>
  );
}
