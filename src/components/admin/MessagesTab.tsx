"use client";

import { useState } from "react";
import { MessageSquare, Mail, MessageCircle, User, Calendar, MapPin, CreditCard, ChevronRight, Search, Zap, AlertCircle } from "lucide-react";
import type { Booking } from "@/types/database";

type Props = { bookings: Booking[] };

type Channel = "email" | "whatsapp";

export function MessagesTab({ bookings }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [channel, setChannel] = useState<Channel>("email");
  const [message, setMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const booking = bookings.find((b) => b.id === selectedId);

  const defaultMessage = booking
    ? channel === "whatsapp"
      ? `Hello ${booking.full_name},\n\nThank you for booking with NovaDrive! Your booking is confirmed.\n\nDetails:\n- Pickup: ${new Date(booking.pickup_at).toLocaleString('en-US')}\n- Return: ${new Date(booking.return_at).toLocaleString('en-US')}\n- Amount: KSh ${Number(booking.total_amount).toLocaleString('en-US')}\n\nPlease don't hesitate to reach out if you need anything.\n\nBest regards,\nNovaDrive Team`
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
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-10">
        <span className="h-1.5 w-8 bg-brand-600 rounded-full" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Communication Desk: <span className="text-onyx-950">Broadcast Protocol</span></p>
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Left: Configuration */}
        <div className="lg:col-span-3 space-y-8">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 md:p-10 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-brand-50/50 rounded-bl-[100%] pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-onyx-950 flex items-center justify-center text-brand-600 shadow-xl shadow-onyx-950/10">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-display font-bold text-onyx-950 tracking-tight">Outgoing Transmission</h3>
              </div>

              {/* Custom Booking selector */}
              <div className="space-y-3 mb-8 relative">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950 ml-1">
                  <Search className="h-3 w-3 text-brand-600" /> Selective Engagement
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all text-onyx-950"
                  >
                    <span className={booking ? "text-onyx-950" : "text-slate-400"}>
                      {booking
                        ? `${booking.full_name} (${booking.paystack_reference?.slice(0, 8) || "N/A"})`
                        : "— DEPLOY BROADCAST TO —"}
                    </span>
                    <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-90" : ""}`} />
                  </button>

                  {/* Dropdown List */}
                  {isDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-[1.5rem] border border-onyx-800 bg-onyx-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar focus:outline-none">
                          {bookings.length === 0 ? (
                            <div className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-slate-600">No active enquiries</div>
                          ) : (
                            bookings.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => {
                                  setSelectedId(b.id);
                                  setMessage("");
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full text-left px-5 py-4 flex items-center justify-between transition-colors ${selectedId === b.id
                                    ? "bg-brand-600 text-white"
                                    : "text-slate-400 hover:bg-onyx-800 hover:text-white"
                                  }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">{b.full_name}</span>
                                  <span className={`text-[10px] font-medium uppercase tracking-widest ${selectedId === b.id ? "text-white/70" : "text-slate-500"}`}>
                                    Ref: {b.paystack_reference?.slice(0, 8) || "N/A"} • {b.status}
                                  </span>
                                </div>
                                {selectedId === b.id && <Zap className="h-3 w-3 fill-white" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Channel */}
              <div className="space-y-4 mb-8">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950 ml-1">
                  <Zap className="h-3 w-3 text-brand-600" /> Channel Protocol
                </label>
                <div className="flex gap-4">
                  {(["email", "whatsapp"] as Channel[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => { setChannel(c); setMessage(""); }}
                      className={`flex-1 group relative flex items-center justify-center gap-3 rounded-[1.5rem] py-5 text-xs font-bold uppercase tracking-widest transition-all ${channel === c
                        ? c === "whatsapp"
                          ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20"
                          : "bg-onyx-950 text-white shadow-xl shadow-onyx-950/20"
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                    >
                      {c === "email" ? <Mail className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950 ml-1">
                  <Zap className="h-3 w-3 text-brand-600" /> Intelligence Body
                  <span className="font-medium text-slate-400 normal-case tracking-normal ml-auto">(Leave blank for default protocol)</span>
                </label>
                <textarea
                  className="w-full rounded-3xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all min-h-[220px] placeholder:text-slate-400"
                  placeholder={booking ? "Brief constructed. You may override here..." : "Select a booking to initialize..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!booking}
                />
              </div>

              <div className="mt-10">
                <button
                  onClick={handleSend}
                  disabled={!booking}
                  className={`w-full group rounded-[2rem] py-6 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:-translate-y-1 disabled:opacity-30 flex items-center justify-center gap-3 ${channel === "whatsapp"
                    ? "bg-emerald-600 shadow-emerald-600/20"
                    : "bg-onyx-950 shadow-onyx-950/20"
                    }`}
                >
                  {channel === "email" ? "Open Secure Mail Agent" : "Initialize WhatsApp Relay"}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <AlertCircle className="h-3 w-3 text-slate-300" />
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">
                    Operational continuity enforced via client application handover.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selected Booking Context */}
        <div className="lg:col-span-2">
          {booking ? (
            <div className="sticky top-10 space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="rounded-[2.5rem] bg-onyx-950 p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 h-40 w-40 bg-brand-600/5 rounded-bl-[100%] pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-brand-600/10 flex items-center justify-center text-brand-600 border border-brand-600/20">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-display text-xl font-bold tracking-tight">{booking.full_name}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Verified Client Profile</span>
                    </div>
                  </div>

                  <div className="space-y-6 border-t border-white/5 pt-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Mailbox</span>
                        </div>
                        <span className="text-xs font-medium">{booking.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                          <MessageCircle className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Line</span>
                        </div>
                        <span className="text-xs font-medium">{booking.phone}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                        <Calendar className="h-3.5 w-3.5 text-brand-600 mb-2" />
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Window</p>
                        <p className="text-[10px] font-bold mt-1 uppercase tracking-tight truncate">
                          {new Date(booking.pickup_at).toLocaleDateString('en-US')}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                        <MapPin className="h-3.5 w-3.5 text-brand-600 mb-2" />
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Sector</p>
                        <p className="text-[10px] font-bold mt-1 uppercase tracking-tight truncate">
                          {booking.pickup_location || "Central"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4 border border-white/5 col-span-2">
                        <CreditCard className="h-3.5 w-3.5 text-brand-600 mb-2" />
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Status & Liquidity</p>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{booking.status}</span>
                          <span className="text-xs font-bold text-brand-600">KSh {Number(booking.total_amount).toLocaleString('en-US')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/20">
                <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Brief Preview</h5>
                <div className="text-[11px] font-medium text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-2xl p-6 italic shadow-inner">
                  &quot;{defaultMessage.split('\n')[0]}...&quot;
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center text-slate-300">
              <User className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Select a target to view profile intelligence</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
