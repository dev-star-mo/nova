"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  const submit = async () => {
    setErr(null);
    setMsg(null);
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("Password updated. You can sign in with your new password.");
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-display text-2xl font-bold text-ink">Set new password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Choose a new password for your NovaDrive account.
      </p>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}
      <label className="mt-6 block text-sm font-medium text-slate-700">New password</label>
      <input
        type="password"
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <label className="mt-4 block text-sm font-medium text-slate-700">Confirm password</label>
      <input
        type="password"
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="mt-6 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Update password"}
      </button>
      <Link href="/" className="mt-4 block text-center text-sm text-brand-600 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
