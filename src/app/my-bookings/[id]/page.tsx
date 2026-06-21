export const dynamic = "force-dynamic";

import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Calendar,
  MapPin,
  Car,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  User,
  CreditCard,
  FileText,
} from "lucide-react";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/"); //check is user exists

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, total_amount, pickup_at, return_at, car_id, pickup_location, dropoff_location, destination, driving_mode, special_requests, created_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!booking) notFound();

  const { data: car } = booking.car_id
    ? await supabase
      .from("cars")
      .select("id, make, model, year, image_url, slug")
      .eq("id", booking.car_id)
      .single()
    : { data: null };

  const statusConfig: Record<
    string,
    { bg: string; text: string; border: string; icon: React.ElementType; label: string }
  > = {
    paid: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      icon: CheckCircle2,
      label: "Paid",
    },
    confirmed: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      icon: CheckCircle2,
      label: "Confirmed",
    },
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      icon: Clock,
      label: "Pending",
    },
    cancelled: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
      icon: AlertCircle,
      label: "Cancelled",
    },
  };

  const cfg = statusConfig[booking.status] ?? statusConfig.pending;
  const StatusIcon = cfg.icon;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Back */}
      <Link
        href="/my-bookings"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-brand-600 transition-colors mb-10"
      >
        <ChevronLeft className="h-4 w-4" />
        My Bookings
      </Link>

      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-brand-600 mb-2 font-bold text-xs uppercase tracking-widest">
            <FileText className="h-4 w-4" />
            Booking Summary
          </div>
          <h1 className="font-display text-3xl font-bold text-onyx-950 leading-tight">
            {car ? `${car.make} ${car.model}` : "Premium Vehicle"}
            {car?.year && (
              <span className="ml-2 text-slate-400 font-normal text-2xl">{car.year}</span>
            )}
          </h1>
          <p className="mt-1 text-slate-400 text-xs font-mono">
            Ref: {booking.id}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
          <StatusIcon className="h-4 w-4" />
          {cfg.label}
        </span>
      </div>

      {/* Details grid */}
      <div className="space-y-4">
        {/* Cost */}
        <div className="rounded-[2rem] bg-onyx-950 px-8 py-7 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Total Investment
            </div>
            <div className="text-4xl font-bold text-white">
              $ {Number(booking.total_amount).toLocaleString()}
            </div>
          </div>
          <CreditCard className="h-10 w-10 text-slate-600" />
        </div>

        {/* Dates */}
        <div className="rounded-[2rem] bg-white border border-slate-100 px-8 py-7 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Calendar className="h-4 w-4" />
            Rental Period
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Collection
              </div>
              <p className="font-bold text-onyx-950">{fmt(booking.pickup_at)}</p>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Return
              </div>
              <p className="font-bold text-onyx-950">{fmt(booking.return_at)}</p>
            </div>
          </div>
        </div>

        {/* Locations */}
        {(booking.pickup_location || booking.destination) && (
          <div className="rounded-[2rem] bg-white border border-slate-100 px-8 py-7 space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <MapPin className="h-4 w-4" />
              Locations
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {booking.pickup_location && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Pickup Point
                  </div>
                  <p className="font-bold text-onyx-950">{booking.pickup_location}</p>
                </div>
              )}
              {booking.dropoff_location && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Drop-off Point
                  </div>
                  <p className="font-bold text-onyx-950">{booking.dropoff_location}</p>
                </div>
              )}
              {booking.destination && (
                <div className="sm:col-span-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Final Destination
                  </div>
                  <p className="font-bold text-onyx-950">{booking.destination}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service */}
        <div className="rounded-[2rem] bg-white border border-slate-100 px-8 py-7 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <User className="h-4 w-4" />
            Service Details
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Service Tier
              </div>
              <p className="font-bold text-onyx-950">{booking.driving_mode}</p>
            </div>
            {car && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Vehicle
                </div>
                <Link
                  href={`/cars/${car.slug ?? car.id}`}
                  className="font-bold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  {car.make} {car.model}
                  {car.year && ` (${car.year})`}
                </Link>
              </div>
            )}
            {booking.special_requests && (
              <div className="sm:col-span-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Special Requests
                </div>
                <p className="font-medium text-slate-600">{booking.special_requests}</p>
              </div>
            )}
          </div>
        </div>

        {/* Booked on */}
        <p className="text-center text-xs text-slate-400 font-medium pt-2">
          Booked on {new Date(booking.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {/* CTA */}
        {booking.status !== "paid" && (
          <Link
            href={`/contract?booking=${booking.id}`}
            className="mt-4 flex items-center justify-center gap-2 w-full rounded-[2rem] bg-onyx-950 py-5 text-xs font-bold uppercase tracking-widest text-white shadow-xl hover:bg-black hover:-translate-y-1 transition-all"
          >
            <Car className="h-4 w-4" />
            Process Payment
          </Link>
        )}
      </div>
    </div>
  );
}
