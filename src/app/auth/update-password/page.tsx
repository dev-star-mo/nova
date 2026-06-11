"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-onyx-950">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 pr-12 text-sm font-medium text-onyx-950 outline-none transition-all focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/20"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        setHasSession(!!session);
        setSessionReady(true);
      }
    };

    void checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(!!session);
        setSessionReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setErr(null);

    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErr("Your reset link has expired or is invalid. Please request a new password reset.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErr(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("[update-password] Unexpected error:", error);
      setErr(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <Link href="/" className="mb-6 flex items-center gap-3 transition-opacity hover:opacity-80">
          <Image
            src="/logo.png"
            alt="NovaDrive Logo"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <span className="font-display text-xl font-bold tracking-tight text-white">
            NovaDrive <span className="text-brand-600">Logistics</span>
          </span>
        </Link>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 border border-brand-600/20">
          <KeyRound className="h-7 w-7 text-brand-600" />
        </div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">
          Set New Password
        </h1>
        <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-slate-400">
          Choose a secure password for your NovaDrive account. You&apos;ll be redirected home once it&apos;s saved.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white p-8 shadow-2xl shadow-black/40">
        {!sessionReady ? (
          <p className="text-center text-sm text-slate-500">Verifying your reset link…</p>
        ) : !hasSession ? (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              Your reset link has expired or is invalid. Request a new link from the sign-in page.
            </p>
            <Link
              href="/"
              className="inline-block rounded-2xl bg-onyx-950 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-600"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-5">
            {err && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-xs font-medium leading-relaxed text-red-700">{err}</p>
              </div>
            )}

            <PasswordField
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />

            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              placeholder="Re-enter your password"
            />

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-onyx-950 py-4 text-xs font-black uppercase tracking-[0.3em] text-white shadow-xl transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>

      {hasSession && sessionReady && (
        <p className="mt-6 text-center text-xs font-medium text-slate-500">
          <Link href="/" className="text-brand-600 transition-colors hover:text-brand-500">
            Cancel and return home
          </Link>
        </p>
      )}
    </div>
  );
}
