"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Phone,
  CreditCard,
  ChevronLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Car } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  pickup_at: string;
  return_at: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  destination: string | null;
  rental_duration: string;
  driving_mode: string;
  special_requests: string | null;
  total_amount: number;
  status: string;
  car_id: string;
  id_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  signature_name?: string | null;
  profile_photo_url?: string | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Format an ISO datetime string into a human-readable local date/time
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContractClient({
  booking,
  car,
}: {
  booking: BookingRow;
  car: Car | null;
}) {
  const router = useRouter();

  // Stable Supabase browser client — created once to avoid re-initialising on every render
  const supabase = useRef(createClient()).current;

  // ── Text / field state ────────────────────────────────────────────────────

  // Renter's national ID or passport number (required for the agreement)
  const [idNumber, setIdNumber] = useState(booking.id_number || "");

  // Emergency contact name and phone number
  const [emergencyName, setEmergencyName] = useState(booking.emergency_contact_name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(booking.emergency_contact_phone || "");

  // No local signature capture: signing will happen inside Zoho embedded iframe
  // Zoho embedded signing URL (if user chooses to sign via Zoho)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [zohoLoading, setZohoLoading] = useState(false);
  const [zohoError, setZohoError] = useState<string | null>(null);

  // ── Acknowledgement checkboxes ────────────────────────────────────────────
  // All must be ticked before the "Proceed to Payment" button becomes active

  const [ackTerms, setAckTerms] = useState(false);   // T&C acceptance
  const [ackDamage, setAckDamage] = useState(false); // Damage liability
  const [ackLegal, setAckLegal] = useState(false);   // Legal use only
  const [ackFuel, setAckFuel] = useState(false);     // Fuel policy
  const [ackReturn, setAckReturn] = useState(false); // On-time return
  const [ackClean, setAckClean] = useState(false);   // Clean vehicle return

  // ── Document upload state ─────────────────────────────────────────────────
  // Each slot holds the File the user selected; null means not yet chosen

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);

  const existingProfile = booking.profile_photo_url;
  const existingFront = booking.id_front_url;
  const existingBack = booking.id_back_url;

  // Shows "Uploading documents…" text on the proceed button while uploading
  const [uploading, setUploading] = useState(false);

  // Error / validation message shown at the bottom of the form
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  // ── Derived values ────────────────────────────────────────────────────────

  const carLabel = car ? `${car.make} ${car.model} (${car.year})` : "Vehicle";

  // Count how many of the 3 document slots have been filled
  const hasProfile = profilePhoto || existingProfile;
  const hasFront = docFront || existingFront;
  const hasBack = docBack || existingBack;
  const docCount = [hasProfile, hasFront, hasBack].filter(Boolean).length;
  const allDocsSelected = docCount === 3;

  // All six acknowledgement boxes must be ticked
  const allAcknowledged =
    ackTerms && ackDamage && ackLegal && ackFuel && ackReturn && ackClean;

  // "Proceed to Payment" is gated on: required text fields + all docs + all checkboxes + signature
  const canProceed =
    idNumber.trim() !== "" &&
    emergencyName.trim() !== "" &&
    emergencyPhone.trim() !== "" &&
    allDocsSelected &&
    allDocsSelected &&
    allAcknowledged;

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Create a temporary object-URL so a just-selected image can be previewed immediately
  function previewUrl(file: File | null): string | null {
    if (!file) return null;
    return URL.createObjectURL(file);
  }

  // Upload a single file to the "contract-docs" Supabase Storage bucket
  // Path: contract-docs/<booking_id>/<slot>.<extension>
  async function uploadDoc(file: File, slot: string): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${booking.id}/${slot}.${ext}`;
    const { error } = await supabase.storage
      .from("contract-docs")
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg"
      });
    if (error) throw new Error(`Upload failed for ${slot}: ${error.message}`);
    // Return the public URL for future reference (admin can view docs)
    const { data } = supabase.storage.from("contract-docs").getPublicUrl(path);
    return data.publicUrl;
  }

  // (no local signature upload — signing is handled by Zoho embedded session)

  // ── Submit handler ────────────────────────────────────────────────────────

  // Validates the form, concurrently uploads all 3 documents, then redirects to checkout
  const handleProceed = async () => {
    if (!canProceed) {
      setValidationMsg(
        "Please complete all required fields, upload all 3 documents, " +
        "and tick every acknowledgement box before proceeding."
      );
      return;
    }
    setValidationMsg(null);
    setUploading(true);
    try {
      // Upload all three document images concurrently to Supabase Storage
      const [pUrl, fUrl, bUrl] = await Promise.all([
        profilePhoto ? uploadDoc(profilePhoto, "profile-photo") : Promise.resolve(existingProfile!),
        docFront ? uploadDoc(docFront, "document-front") : Promise.resolve(existingFront!),
        docBack ? uploadDoc(docBack, "document-back") : Promise.resolve(existingBack!),
      ]);

      // Save renter details and document URLs to the database
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          id_number: idNumber,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          profile_photo_url: pUrl,
          id_front_url: fUrl,
          id_back_url: bUrl,
        })
        .eq("id", booking.id);

      if (updateError) throw updateError;

      // All data saved — create Zoho request which will email the agreement
      const res = await fetch(`/api/contract/zoho-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          prefill: {
            id_number: idNumber,
            emergency_contact_name: emergencyName,
            emergency_contact_phone: emergencyPhone,
            ackTerms,
            ackDamage,
            ackLegal,
            ackFuel,
            ackReturn,
            ackClean,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create Zoho request");

      // Redirect to the user-facing confirmation/sent page
      router.push(`/contract/sent?booking=${encodeURIComponent(booking.id)}`);
    } catch (err) {
      console.error("Submission error:", err);
      // If any upload or update fails, surface the error and abort navigation
      setValidationMsg(
        err instanceof Error ? err.message : "Submission failed. Please try again."
      );
      setUploading(false);
    }
  };

  // Note: signing is handled by email — server will create and send the Zoho request.

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-onyx-50 py-16 px-4">
      <div className="mx-auto max-w-4xl">

        {/* ── Page header ── */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-[2rem] bg-onyx-950 flex items-center justify-center shadow-2xl shadow-onyx-950/20 border border-white/10 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <FileText className="h-8 w-8 text-brand-600 relative z-10" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-black text-onyx-950 tracking-tight uppercase">
            Rental <span className="text-brand-600">Agreement</span>
          </h1>
          <p className="mt-4 text-sm text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            Please read the agreement carefully and fill it in to proceed with your reservation.
          </p>
        </div>

        <div className="space-y-10">

          {/* ── Section 1: Vehicle Details ── */}
          <section className="rounded-[2.5rem] bg-white p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 transition-all hover:shadow-[0_48px_80px_-24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1.5 w-6 bg-brand-600 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-onyx-950">
                01. Asset Allocation
              </h2>
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-12 gap-y-6 text-sm">
              {/* Make, model and year */}
              <div className="space-y-1">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle Model</dt>
                <dd className="text-base font-bold text-onyx-950">{carLabel}</dd>
              </div>
              {/* Category (e.g. SUV, Luxury) */}
              {car?.category && (
                <div className="space-y-1">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tier Category</dt>
                  <dd className="text-base font-bold text-onyx-950 capitalize">
                    {car.category.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
              {/* Gearbox type */}
              {car?.transmission && (
                <div className="space-y-1">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transmission</dt>
                  <dd className="text-base font-bold text-onyx-950">{car.transmission}</dd>
                </div>
              )}
              {/* Number of seats */}
              {car?.seats && (
                <div className="space-y-1">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seat Capacity</dt>
                  <dd className="text-base font-bold text-onyx-950">{car.seats} Seats</dd>
                </div>
              )}
            </dl>
          </section>

          {/* ── Section 2: Renter Details ── */}
          <section className="rounded-[2.5rem] bg-white p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1.5 w-6 bg-brand-600 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-onyx-950">
                02. Client Profile
              </h2>
            </div>

            {/* Read-only fields pulled from the booking record */}
            <dl className="grid sm:grid-cols-2 gap-x-12 gap-y-6 text-sm mb-10">
              <div className="space-y-1">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</dt>
                <dd className="text-base font-bold text-onyx-950">{booking.full_name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</dt>
                <dd className="text-base font-bold text-onyx-950">{booking.phone}</dd>
              </div>
              <div className="sm:col-span-2 space-y-1 outline-none">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered Email</dt>
                <dd className="text-base font-bold text-onyx-950">{booking.email}</dd>
              </div>
            </dl>

            <div className="grid gap-8">
              {/* National ID / Passport number — required for identification */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
                  <FileText className="h-3 w-3 text-brand-600" /> National ID / Passport Number
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all shadow-sm"
                  placeholder="e.g. 12345678 or A12345678"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>

              {/* Emergency contact — required for all rentals */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
                    <User className="h-3 w-3 text-brand-600" /> Emergency Contact Name <span className="text-brand-600 text-[8px] animate-pulse">*</span>
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all shadow-sm"
                    placeholder="e.g. Jane Doe"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950 flex items-center gap-2">
                    <Phone className="h-3 w-3 text-brand-600" /> Emergency Phone <span className="text-brand-600 text-[8px] animate-pulse">*</span>
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white transition-all shadow-sm"
                    placeholder="e.g. +254 700 000 000"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 3: Rental Details ── */}
          <section className="rounded-[2.5rem] bg-white p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1.5 w-6 bg-brand-600 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-onyx-950">
                03. Scheduling
              </h2>
            </div>

            <dl className="grid sm:grid-cols-2 gap-x-12 gap-y-8 text-sm">
              <div className="space-y-1">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pickup</dt>
                <dd className="text-base font-bold text-onyx-950">{formatDate(booking.pickup_at)}</dd>
                {booking.pickup_location && (
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mt-1">{booking.pickup_location}</p>
                )}
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Return</dt>
                <dd className="text-base font-bold text-onyx-950">{formatDate(booking.return_at)}</dd>
                {booking.dropoff_location && (
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mt-1">{booking.dropoff_location}</p>
                )}
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rental Duration</dt>
                <dd className="text-base font-bold text-onyx-950">{booking.rental_duration}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Mode</dt>
                <dd className="text-base font-bold text-onyx-950">{booking.driving_mode}</dd>
              </div>
              {booking.destination && (
                <div className="sm:col-span-2 space-y-1">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</dt>
                  <dd className="text-base font-bold text-onyx-950">{booking.destination}</dd>
                </div>
              )}
            </dl>

            {/* Prominently displayed total amount */}
            <div className="mt-12 flex items-center justify-between rounded-3xl bg-onyx-950 px-8 py-6 shadow-2xl shadow-onyx-950/20 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-transparent" />
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Total Amount</span>
                <span className="text-3xl font-black text-white">
                  $ {Number(booking.total_amount).toLocaleString("en-US")}
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10 backdrop-blur-sm">
                <CreditCard className="h-6 w-6 text-brand-600" />
              </div>
            </div>
          </section>

          {/* ── Section 4: Terms & Conditions ── */}
          <section className="rounded-[2.5rem] bg-white p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1.5 w-6 bg-brand-600 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-onyx-950">
                04. Contract Agreement
              </h2>
            </div>

            {/* Scrollable T&C block — customer must scroll to read before ticking checkboxes */}
            <div className="h-64 overflow-y-auto rounded-3xl border border-slate-100 bg-slate-50/50 p-6 text-[11px] leading-relaxed text-slate-500 space-y-4 scrollbar-thin scrollbar-thumb-brand-200">
              <p>
                <strong>1. Eligibility.</strong> The renter must be at least 23 years of age and
                hold a valid driving licence applicable to the vehicle category. For self-drive
                rentals, the licence must have been held for a minimum of 2 years.
              </p>
              <p>
                <strong>2. Payment.</strong> Full payment of the agreed rental amount is required
                at the time of booking confirmation. The company accepts Paystack-supported payment
                methods. All charges are in Kenyan Shillings (KES).
              </p>
              <p>
                <strong>3. Security Deposit.</strong> A refundable security deposit may be required
                prior to vehicle collection. This will be communicated to you by our team. The
                deposit is refunded within 7 working days after the vehicle is returned in
                satisfactory condition.
              </p>
              <p>
                <strong>4. Vehicle Use.</strong> The vehicle shall only be used on public roads
                suitable for the vehicle type. It must not be used for sub-letting, driving
                instruction, racing, rallying, or any illegal activity. The renter may not drive
                the vehicle outside Kenya without prior written consent.
              </p>
              <p>
                <strong>5. Damage &amp; Liability.</strong> The renter is fully liable for any
                loss, damage, or destruction of the vehicle during the rental period, including
                loss due to theft. In the event of an accident, the renter must immediately notify
                the company and relevant authorities. A police abstract must be obtained within
                24 hours.
              </p>
              <p>
                <strong>6. Fuel Policy.</strong> The vehicle is provided with a set fuel level and
                must be returned with the same fuel level. If not, the renter will be charged for
                the difference plus a service fee.
              </p>
              <p>
                <strong>7. Cleanliness.</strong> The vehicle must be returned in a clean condition,
                both exterior and interior. If the vehicle requires cleaning upon return, a car
                wash charge will be levied against the renter.
              </p>
              <p>
                <strong>8. Return of Vehicle.</strong> The vehicle must be returned at the agreed
                location and time. Late returns will incur additional daily charges. The company
                reserves the right to recover the vehicle if it is overdue without prior notice.
              </p>
              <p>
                <strong>9. Traffic Violations.</strong> The renter is solely responsible for all
                traffic fines, penalties, and infringement notices incurred during the rental
                period. Any fines paid by the company on behalf of the renter will be recovered
                together with an administrative fee.
              </p>
              <p>
                <strong>10. Cancellation.</strong> Cancellations made more than 48 hours before
                pickup are eligible for a full refund. Cancellations within 48 hours of pickup
                forfeit 50% of the rental amount. No-shows forfeit the full payment.
              </p>
              <p>
                <strong>11. Governing Law.</strong> This agreement is governed by the laws of
                Kenya. Any disputes shall be resolved through arbitration in Nairobi, Kenya.
              </p>
            </div>
          </section>

          {/* ── Section 5: Document Uploads ── */}
          <section className="rounded-[2.5rem] bg-white p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-6 bg-brand-600 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-onyx-950">
                05. Verification
              </h2>
            </div>
            <p className="mb-8 text-sm text-slate-500 font-medium">
              Upload clear high-fidelity captures of your credentials. Verified documentation is mandatory for booking.
            </p>

            {/* 2-column grid of upload slots */}
            <div className="grid gap-5 sm:grid-cols-2">

              {/* Selfie / profile photo */}
              <DocUploadSlot
                label="Your Photo (Selfie)"
                hint="A clear, recent photo of your face"
                file={profilePhoto}
                existingUrl={existingProfile}
                accept="image/*"
                onSelect={setProfilePhoto}
                previewUrl={previewUrl}
              />

              {/* Document — front side */}
              <DocUploadSlot
                label="ID / Licence / Passport — Front"
                hint="Front side of your identification document"
                file={docFront}
                existingUrl={existingFront}
                accept="image/*"
                onSelect={setDocFront}
                previewUrl={previewUrl}
              />

              {/* Document — back side */}
              <DocUploadSlot
                label="ID / Licence / Passport — Back"
                hint="Back side of your identification document"
                file={docBack}
                existingUrl={existingBack}
                accept="image/*"
                onSelect={setDocBack}
                previewUrl={previewUrl}
              />

            </div>

            {/* Progress bar showing how many of the 3 slots have been filled */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-onyx-950">Verification Status</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">{docCount} / 3 Completed</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-700 shadow-[0_0_12px_rgba(197,160,89,0.3)]"
                  style={{ width: `${(docCount / 3) * 100}%` }}
                />
              </div>
            </div>
          </section>

          {/* ── Section 6: Acknowledgements ── */}
          <section className="rounded-[2.5rem] bg-white p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-6 bg-brand-600 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-onyx-950">
                06. Contract Acceptance
              </h2>
            </div>
            <p className="mb-8 text-sm text-slate-500 font-medium">
              Please finalize the agreement by confirming the following clauses:
            </p>

            {/* Each checkbox covers a distinct policy area */}
            <div className="space-y-4">

              {/* Terms & Conditions */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-600 cursor-pointer"
                  checked={ackTerms}
                  onChange={(e) => setAckTerms(e.target.checked)}
                />
                <span className="text-sm text-slate-700">
                  I have read and I fully accept the Terms &amp; Conditions of this Car Rental
                  Agreement.
                </span>
              </label>

              {/* Damage liability */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-600 cursor-pointer"
                  checked={ackDamage}
                  onChange={(e) => setAckDamage(e.target.checked)}
                />
                <span className="text-sm text-slate-700">
                  I understand that I am fully liable for any damage, loss, or theft of the vehicle
                  during the rental period and accept the damage liability policy.
                </span>
              </label>

              {/* Legal use */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-600 cursor-pointer"
                  checked={ackLegal}
                  onChange={(e) => setAckLegal(e.target.checked)}
                />
                <span className="text-sm text-slate-700">
                  I confirm that the vehicle will not be used for any illegal activity, sub-letting,
                  racing, or any purpose not permitted under this agreement.
                </span>
              </label>

              {/* Fuel policy */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-600 cursor-pointer"
                  checked={ackFuel}
                  onChange={(e) => setAckFuel(e.target.checked)}
                />
                <span className="text-sm text-slate-700">
                  I understand the fuel policy and agree to return the vehicle with the same amount
                  of fuel it had when I picked it up.
                </span>
              </label>

              {/* Return policy */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-600 cursor-pointer"
                  checked={ackReturn}
                  onChange={(e) => setAckReturn(e.target.checked)}
                />
                <span className="text-sm text-slate-700">
                  I agree to return the vehicle to the agreed drop-off location by the agreed return
                  date and time, and I accept the applicable late-return charges.
                </span>
              </label>

              {/* Clean vehicle return */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-600 cursor-pointer"
                  checked={ackClean}
                  onChange={(e) => setAckClean(e.target.checked)}
                />
                <span className="text-sm text-slate-700">
                  I agree to return the vehicle clean or incur car wash charges.
                </span>
              </label>

            </div>
          </section>

          {/* ── Section 7: Agreement Signing ── */}
          <section className="rounded-[2.5rem] bg-white p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1.5 w-6 bg-brand-600 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-onyx-950">
                07. Protocol Execution
              </h2>
            </div>

            <div className="rounded-3xl bg-brand-50/50 p-6 border border-brand-100/50 space-y-4">
              <p className="text-sm text-onyx-950 font-bold leading-relaxed">
                A digital copy of this contract and the payment details will be sent to <span className="text-brand-600 underline decoration-2 underline-offset-4">{booking.email}</span>. First sign the contract and then make the payment.
              </p>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Verification of digital signature triggers the secure payment gateway.</p>
              </div>
            </div>
          </section>

          {/* ── Validation / error message ── */}
          {validationMsg && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-6 flex items-start gap-4 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs font-black uppercase tracking-widest text-red-700 leading-relaxed">
                {validationMsg}
              </p>
            </div>
          )}

          {/* ── Proceed to payment button ── */}
          <div className="pt-6">
            <button
              type="button"
              disabled={!canProceed || uploading}
              onClick={() => void handleProceed()}
              className="w-full rounded-[2rem] bg-onyx-950 py-6 text-xs font-black uppercase tracking-[0.4em] text-white shadow-2xl hover:bg-brand-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-1 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-transform" />
              <span className="relative z-10">{uploading ? "Processing" : "Finalize Contract"}</span>
            </button>

            {/* Helper text explaining why the button may still be disabled */}
            {!canProceed && (
              <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-[0.2em]">
                Mandatory documentation & acceptance required to proceed
              </p>
            )}

            {/* Back navigation link */}
            <Link
              href="/my-bookings"
              className="mt-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 hover:text-onyx-950 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Back to My Bookings
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── DocUploadSlot sub-component ──────────────────────────────────────────────
// Renders a labelled file-picker card with an image thumbnail preview once a file is chosen

function DocUploadSlot({
  label,
  hint,
  file,
  existingUrl,
  accept,
  onSelect,
  previewUrl,
}: {
  label: string;
  hint: string;
  file: File | null;
  existingUrl?: string | null;
  accept: string;
  onSelect: (f: File) => void;
  previewUrl: (f: File | null) => string | null;
}) {
  // Hidden file input is triggered programmatically by the visible button
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = previewUrl(file) || existingUrl;

  return (
    <div className="flex flex-col gap-2">
      {/* Slot label and descriptive hint */}
      <span className="text-sm font-medium text-slate-700">
        {label} <span className="text-red-500">*</span>
      </span>
      <span className="text-xs text-slate-400">{hint}</span>

      {/* Clickable upload area — shows preview thumbnail or upload placeholder */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${file
          ? "border-brand-600 bg-brand-50/30 shadow-inner"
          : "border-slate-100 bg-slate-50/50 hover:border-brand-600 hover:bg-white hover:shadow-xl transition-all duration-500"
          }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {preview ? (
          /* Show selected image as a thumbnail */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={label}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          /* Upload prompt shown when no file is selected yet */
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-xs">Click to upload</span>
          </div>
        )}
      </button>

      {/* Hidden file input — the visible button above triggers it */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />

      {/* Show the selected filename below the upload area */}
      {file && <p className="truncate text-[10px] font-black uppercase tracking-widest text-brand-600 px-2">{file.name}</p>}
    </div>
  );
}

// ─── SignaturePad sub-component ─────────────────────────────────────────────
// Signature capture is now handled inside the Zoho embedded iframe.
