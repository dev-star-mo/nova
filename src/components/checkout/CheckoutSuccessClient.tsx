"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CheckoutSuccessClient({ reference }: { reference: string }) {
  const [state, setState] = useState<"verifying" | "paid" | "pending" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    let mounted = true;
    const verify = async () => {
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const json = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setState("failed");
          setMessage(json.error ?? "Could not verify payment.");
          return;
        }
        if (json.status === "paid") {
          setState("paid");
          setMessage("Payment confirmed. Your booking is now marked as paid.");
          return;
        }
        setState("pending");
        setMessage("Payment is still processing. Please refresh My bookings shortly.");
      } catch {
        if (!mounted) return;
        setState("failed");
        setMessage("Network error while verifying payment.");
      }
    };
    void verify();
    return () => {
      mounted = false;
    };
  }, [reference]);

  const tone =
    state === "paid"
      ? "text-emerald-700"
      : state === "verifying"
        ? "text-slate-700"
        : state === "pending"
          ? "text-amber-700"
          : "text-red-700";

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Payment status</h1>
      <p className={`mt-3 ${tone}`}>{message}</p>
      <Link
        href="/my-bookings"
        className="mt-8 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
      >
        My bookings
      </Link>
    </div>
  );
}

