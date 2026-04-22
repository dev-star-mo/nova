"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppUI } from "@/components/providers/app-ui-provider";
import { useUserSession } from "@/components/providers/user-session-provider";

export function AuthModal() {
  const { authOpen, authView, closeAuth, setAuthView } = useAppUI();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const { user } = useUserSession();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      closeAuth();
    }
  }, [user, closeAuth]);

  useEffect(() => {
    if (!authOpen) {
      setError(null);
      setInfo(null);
      setEmail("");
      setPassword("");
      setConfirm("");
    }
  }, [authOpen]);

  if (!authOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const signInGoogle = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    setBusy(false);
    if (e) setError(e.message);
  };

  const signInEmail = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    const { data, error: e } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    if (data.user && !data.user.email_confirmed_at) {
      setInfo(
        "A confirmation email was sent to your address. Please confirm your email before signing in."
      );
      await supabase.auth.signOut();
      return;
    }
    closeAuth();
  };

  const signUp = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError("Password and confirm password must match.");
      setBusy(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setBusy(false);
      return;
    }
    const { error: e } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setEmail("");
    setPassword("");
    setConfirm("");
    setAuthView("signin");
    setInfo(
      "Account created. Check your inbox to confirm your email before signing in. You can sign in once your email is verified."
    );
  };

  const sendReset = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/update-password`,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setInfo("If an account exists for this email, a reset link has been sent.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={() => !busy && closeAuth()}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          onClick={() => !busy && closeAuth()}
          aria-label="Close"
        >
          ✕
        </button>

        {authView === "gate" && (
          <>
            <h2 className="font-display text-xl font-bold text-ink">Book your car</h2>
            <p className="mt-3 text-slate-600">
              You need to be signed in to make a booking. This ensures your booking is secure and you
              can track your reservation.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={closeAuth}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                onClick={() => setAuthView("signin")}
              >
                Sign in
              </button>
            </div>
          </>
        )}

        {authView === "signin" && (
          <>
            <h2 className="font-display text-xl font-bold text-ink">Sign in</h2>
            {info && <p className="mt-2 text-sm text-brand-700">{info}</p>}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium hover:bg-slate-50"
              onClick={() => void signInGoogle()}
              disabled={busy}
            >
              <span className="text-lg">G</span> Sign in with Google
            </button>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase text-slate-400">
                <span className="bg-white px-2">Or continue with email</span>
              </div>
            </div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="mt-3 block text-sm font-medium text-slate-700">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="mt-1 text-sm text-brand-600 hover:underline"
              onClick={() => {
                setError(null);
                setAuthView("reset");
              }}
            >
              Forgot password?
            </button>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              disabled={busy}
              onClick={() => void signInEmail()}
            >
              Sign in
            </button>
            <p className="mt-4 text-center text-sm text-slate-600">
              No account?{" "}
              <button
                type="button"
                className="font-semibold text-brand-600 hover:underline"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setAuthView("signup");
                }}
              >
                Create account
              </button>
            </p>
          </>
        )}

        {authView === "signup" && (
          <>
            <h2 className="font-display text-xl font-bold text-ink">Create account</h2>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <label className="mt-4 block text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="mt-3 block text-sm font-medium text-slate-700">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="mt-3 block text-sm font-medium text-slate-700">Confirm password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              disabled={busy}
              onClick={() => void signUp()}
            >
              Create account
            </button>
            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-brand-600 hover:underline"
                onClick={() => setAuthView("signin")}
              >
                Sign in
              </button>
            </p>
          </>
        )}

        {authView === "reset" && (
          <>
            <h2 className="font-display text-xl font-bold text-ink">Reset password</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter your email and we will send you a link to choose a new password.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {info && <p className="mt-2 text-sm text-brand-700">{info}</p>}
            <label className="mt-4 block text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium hover:bg-slate-50"
                onClick={() => setAuthView("signin")}
              >
                Back
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                disabled={busy}
                onClick={() => void sendReset()}
              >
                Send link
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
