"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  //signature_name?: string | null;
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

  // Digital signature — renter types their full name to sign
  //const [signature, setSignature] = useState(booking.signature_name || "");
  // BoldSign embedded signing URL — set when the user clicks "Open Contract Agreement"
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  // Loading flag shown on the button while the server generates the sign link
  const [boldSignLoading, setBoldSignLoading] = useState(false);
  // Error message displayed below the button if the API call fails
  const [boldSignError, setBoldSignError] = useState<string | null>(null);
  // Set to true once BoldSign fires the onDocumentSigned postMessage — gates the Pay button
  const [contractSigned, setContractSigned] = useState(false);

  // ── Acknowledgement checkboxes ────────────────────────────────────────────
  // All must be ticked before the "Proceed to Payment" button becomes active

  const [ackTerms, setAckTerms] = useState(false);   // T&C acceptance

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

  //  Acknowledgement boxes must be ticked
  const allAcknowledged =
    ackTerms;

  // Required text fields filled (used to gate "Open Contract Agreement" button)
  const requiredFieldsFilled =
    idNumber.trim() !== "" &&
    emergencyName.trim() !== "" &&
    emergencyPhone.trim() !== "";

  // "Open Contract Agreement" is gated on: required fields + all acknowledgements ticked
  const canOpenContract = requiredFieldsFilled && allAcknowledged;

  // "Proceed to Payment" is gated on: required text fields + all docs + ack checkbox + contract signed
  const canProceed =
    idNumber.trim() !== "" &&
    emergencyName.trim() !== "" &&
    emergencyPhone.trim() !== "" &&
    allDocsSelected &&
    allAcknowledged &&
    contractSigned;

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

  // ── Submit handler ────────────────────────────────────────────────────────

  // Validates the form, concurrently uploads all 3 documents, then redirects to checkout
  const handleProceed = async () => {
    if (!canProceed) {
      setValidationMsg(
        "Please complete all required fields, upload all 3 documents, " +
        "and tick the acknowledgement box before proceeding."
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
          //signature_name: signature,
          profile_photo_url: pUrl,
          id_front_url: fUrl,
          id_back_url: bUrl,
        })
        .eq("id", booking.id);

      if (updateError) throw updateError;

      // All data saved — proceed to the existing Paystack checkout page
      router.push(`/checkout?booking=${encodeURIComponent(booking.id)}`);
    } catch (err) {
      console.error("Submission error:", err);
      // If any upload or update fails, surface the error and abort navigation
      setValidationMsg(
        err instanceof Error ? err.message : "Submission failed. Please try again."
      );
      setUploading(false);
    }
  };

  // ── BoldSign embedded signing ────────────────────────────────────────────
  //
  // Calls our server-side API route (/api/contract/boldsign-create) which:
  //   1. Creates a document from the BoldSign template
  //   2. Returns a short-lived embedded signing URL
  // We then render that URL inside a full-screen modal <iframe>.
  //
  // We also attach a window "message" listener so BoldSign's iframe can tell us
  // when the document has been signed (onDocumentSigned postMessage event).

  // Stable handler reference so we can remove the listener when the component unmounts
  const handleBoldSignMessage = useCallback((event: MessageEvent) => {
    // Only trust messages from the BoldSign app origin
    if (event.origin !== "https://app-eu.boldsign.com") return;
    if (event.data?.action === "onDocumentSigned") {
      setContractSigned(true);
      setEmbedUrl(null); // close the modal automatically
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleBoldSignMessage);
    return () => window.removeEventListener("message", handleBoldSignMessage);
  }, [handleBoldSignMessage]);

  const openBoldSign = async () => {
    setBoldSignError(null);
    setBoldSignLoading(true);
    try {
      // Hit the server route — the API key never leaves the server
      const res = await fetch("/api/contract/boldsign-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id }),
      });
      const json = await res.json();
      // Throw so the catch block can surface the error message to the user
      if (!res.ok) throw new Error(json?.error ?? "Failed to create BoldSign document");
      // embed_url is the short-lived BoldSign signing URL for the iframe
      setEmbedUrl(json.embed_url);
    } catch (err) {
      console.error("BoldSign open error:", err);
      setBoldSignError(err instanceof Error ? err.message : String(err));
    } finally {
      setBoldSignLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-3xl">

        {/* ── Page header ── */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-ink">Car Rental Agreement</h1>
          <p className="mt-2 text-sm text-slate-500">
            Please read the agreement carefully, complete all required fields, and sign before
            proceeding to payment.
          </p>
        </div>

        <div className="space-y-6">

          {/* ── Section 1: Vehicle Details ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-ink border-b border-slate-100 pb-2">
              1. Vehicle Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {/* Make, model and year */}
              <div>
                <dt className="text-slate-500">Vehicle</dt>
                <dd className="font-medium text-ink">{carLabel}</dd>
              </div>
              {/* Category (e.g. SUV, Luxury) */}
              {car?.category && (
                <div>
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-medium text-ink capitalize">
                    {car.category.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
              {/* Gearbox type */}
              {car?.transmission && (
                <div>
                  <dt className="text-slate-500">Transmission</dt>
                  <dd className="font-medium text-ink">{car.transmission}</dd>
                </div>
              )}
              {/* Number of seats */}
              {car?.seats && (
                <div>
                  <dt className="text-slate-500">Seats</dt>
                  <dd className="font-medium text-ink">{car.seats}</dd>
                </div>
              )}
              {/* Petrol / Diesel / Electric */}
              {car?.fuel_type && (
                <div>
                  <dt className="text-slate-500">Fuel Type</dt>
                  <dd className="font-medium text-ink">{car.fuel_type}</dd>
                </div>
              )}
              {/* Base collection location */}
              {car?.location && (
                <div>
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-medium text-ink">{car.location}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* ── Section 2: Renter Details ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-ink border-b border-slate-100 pb-2">
              2. Renter Details
            </h2>

            {/* Read-only fields pulled from the booking record */}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-5">
              <div>
                <dt className="text-slate-500">Full Name</dt>
                <dd className="font-medium text-ink">{booking.full_name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-ink">{booking.phone}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-ink">{booking.email}</dd>
              </div>
            </dl>

            {/* National ID / Passport number — required for identification */}
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700">
                National ID / Passport Number <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="e.g. 12345678 or A12345678"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
              />
            </div>

            {/* Emergency contact — required for all rentals */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Emergency Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="e.g. Jane Doe"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Emergency Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="e.g. +254 700 000 000"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ── Section 3: Rental Details ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-ink border-b border-slate-100 pb-2">
              3. Rental Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {/* Pickup date and time */}
              <div>
                <dt className="text-slate-500">Pickup Date &amp; Time</dt>
                <dd className="font-medium text-ink">{formatDate(booking.pickup_at)}</dd>
              </div>
              {/* Return date and time */}
              <div>
                <dt className="text-slate-500">Return Date &amp; Time</dt>
                <dd className="font-medium text-ink">{formatDate(booking.return_at)}</dd>
              </div>
              {/* Duration computed at booking time */}
              <div>
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-medium text-ink">{booking.rental_duration}</dd>
              </div>
              {/* Self-driven or Chauffeured */}
              <div>
                <dt className="text-slate-500">Driving Mode</dt>
                <dd className="font-medium text-ink">{booking.driving_mode}</dd>
              </div>
              {/* Where the car will be collected */}
              {booking.pickup_location && (
                <div>
                  <dt className="text-slate-500">Pickup Location</dt>
                  <dd className="font-medium text-ink">{booking.pickup_location}</dd>
                </div>
              )}
              {/* Where the car should be returned */}
              {booking.dropoff_location && (
                <div>
                  <dt className="text-slate-500">Drop-off Location</dt>
                  <dd className="font-medium text-ink">{booking.dropoff_location}</dd>
                </div>
              )}
              {/* Intended travel destination */}
              {booking.destination && (
                <div>
                  <dt className="text-slate-500">Destination</dt>
                  <dd className="font-medium text-ink">{booking.destination}</dd>
                </div>
              )}
              {/* Any special requests noted at booking */}
              {booking.special_requests && (
                <div className="col-span-2">
                  <dt className="text-slate-500">Special Requests</dt>
                  <dd className="font-medium text-ink">{booking.special_requests}</dd>
                </div>
              )}
            </dl>

            {/* Prominently displayed total amount */}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Total Amount</span>
              <span className="text-lg font-bold text-brand-700">
                KSh. {Number(booking.total_amount).toLocaleString("en-US")}
              </span>
            </div>
          </section>

          {/* ── Section 4: Terms & Conditions ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-ink border-b border-slate-100 pb-2">
              4. Terms &amp; Conditions
            </h2>

            {/* Scrollable T&C block — customer must scroll to read before ticking checkboxes */}
            <div className="h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 space-y-3">
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
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-ink border-b border-slate-100 pb-2">
              5. Document Uploads
            </h2>
            <p className="mb-5 mt-3 text-sm text-slate-500">
              Upload clear images of the following documents. All 3 are required before you can
              proceed to payment.
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
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${(docCount / 3) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{docCount} / 3 uploaded</span>
            </div>
          </section>

          {/* ── Section 6: Acknowledgements ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-ink border-b border-slate-100 pb-2">
              6. Acknowledgements <span className="text-red-500">*</span>
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              All boxes below are required. Please tick each one to confirm your understanding
              and acceptance before opening the contract:
            </p>

            {/* Each checkbox covers a distinct policy area */}
            <div className="space-y-3">

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

            </div>

            {/* Progress indicator for acknowledgements */}
            {!allAcknowledged && (
              <p className="mt-4 text-xs text-amber-600">
                ⚠ {[ackTerms].filter(Boolean).length} / 1
                acknowledgements completed — this is required.
              </p>
            )}
            {allAcknowledged && (
              <p className="mt-4 text-xs text-green-600">✓ All acknowledgements confirmed.</p>
            )}
          </section>

          {/* ── Section 7: Digital Signature ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">



            {/* Live signature preview — mimics a handwritten signature block */}
            {/*
            {signature.trim() && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-400 mb-1">Signature Preview</p>
                <p className="font-bold text-2xl text-ink italic">{signature}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Signed on{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            */}

            {/* Contract signed status badge */}
            {contractSigned ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-green-800">Contract signed successfully</p>
                  <p className="text-xs text-green-600">You may now proceed to payment.</p>
                </div>
              </div>
            ) : (
              <>
                {/* BoldSign embedded signing — opens a full-screen modal iframe */}
                {/* Disabled until the client fills all required fields and ticks the acknowledgement */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void openBoldSign()}
                    disabled={boldSignLoading || !canOpenContract}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {boldSignLoading ? "Preparing contract…" : "Open Contract Agreement (Sign on this site)"}
                  </button>

                  {/* Explain why the button is locked */}
                  {!canOpenContract && (
                    <p className="mt-2 text-xs text-amber-600">
                      {!requiredFieldsFilled
                        ? "Fill in your ID number, emergency contact name & phone to unlock."
                        : "Tick the acknowledgement box above to unlock the contract."}
                    </p>
                  )}

                  {/* Remind the user that signing is required before payment */}
                  {canOpenContract && !contractSigned && (
                    <p className="mt-2 text-xs text-slate-500">
                      You must complete the contract signing before payment is enabled.
                    </p>
                  )}

                  {/* Show any API error directly below the button */}
                  {boldSignError && (
                    <p className="mt-2 text-xs text-red-600">Error preparing contract: {boldSignError}</p>
                  )}
                </div>
              </>
            )}

            {/* Full-screen modal — rendered once we have an embed URL from BoldSign */}
            {embedUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="mx-4 max-w-4xl w-full rounded-xl bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Sign Agreement</h3>
                    {/* Close button dismisses the iframe without marking as signed */}
                    <button
                      onClick={() => setEmbedUrl(null)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  {/* BoldSign renders its full signing UI inside this iframe */}
                  <div className="h-[80vh]">
                    <iframe
                      src={embedUrl}
                      title="BoldSign — Sign Agreement"
                      className="h-full w-full rounded-md border"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Validation / error message ── */}
          {validationMsg && (
            <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {validationMsg}
            </p>
          )}

          {/* ── Proceed to payment button ── */}
          {/* Disabled until all fields, documents, checkboxes, and signature are complete */}
          <button
            type="button"
            disabled={!canProceed || uploading}
            onClick={() => void handleProceed()}
            className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "Uploading documents…" : "Proceed to Payment"}
          </button>

          {/* Helper text explaining why the button may still be disabled */}
          {!canProceed && (
            <p className="text-center text-xs text-slate-400">
              {!contractSigned
                ? "You must open and complete the contract agreement before payment is enabled."
                : "Complete all required fields and upload all 3 documents to enable payment."}
            </p>
          )}

          {/* Back navigation link */}
          <Link
            href="/my-bookings"
            className="block text-center text-sm text-brand-600 hover:underline"
          >
            ← Back to my bookings
          </Link>

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
          ? "border-brand-400 bg-brand-50"
          : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/40"
          }`}
      >
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
      {file && <p className="truncate text-xs text-brand-600">{file.name}</p>}
    </div>
  );
}
