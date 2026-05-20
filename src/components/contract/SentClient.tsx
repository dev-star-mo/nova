"use client";
import React, { useState } from "react";

export default function SentClient({ bookingId, email }: { bookingId: string; email?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const resend = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/contract/zoho-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to resend agreement");
      setMsg("Agreement resent to your email.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      <button onClick={resend} disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        {busy ? "Sending…" : "Resend agreement"}
      </button>
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
    </div>
  );
}
