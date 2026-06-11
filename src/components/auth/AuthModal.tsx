"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppUI } from "@/components/providers/app-ui-provider";
import { useUserSession } from "@/components/providers/user-session-provider";

/** Password field with show/hide toggle */
function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

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
    if (!user) return;
    // Close the modal for fully authenticated users:
    // - Google/OAuth users always have email_confirmed_at set
    // - Email users who have confirmed their email
    // - Email users where confirmation is disabled (email_confirmed_at may also be set)
    if (user.email_confirmed_at || user.app_metadata?.provider === "google") {
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

  // Populate email in unverified view from the current user
  useEffect(() => {
    if (authView === "unverified" && user?.email) {
      setEmail(user.email);
    }
  }, [authView, user?.email]);

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
        "Please confirm your email before signing in. Check your inbox for the verification link."
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
    const { data: signUpData, error: e } = await supabase.auth.signUp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback?type=signup` },
      password,
    });
    setBusy(false);
    if (e) {
      // Supabase returns this message when the email is already registered (confirm mode ON)
      if (
        e.message.toLowerCase().includes("already registered") ||
        e.message.toLowerCase().includes("already exists") ||
        e.message.toLowerCase().includes("user already")
      ) {
        setError(
          "An account with this email already exists. Please sign in instead."
        );
        return;
      }
      setError(e.message);
      return;
    }
    // When email confirmations are DISABLED, Supabase returns a fake success
    // with an empty identities array when the email is already registered.
    if (
      signUpData.user &&
      Array.isArray(signUpData.user.identities) &&
      signUpData.user.identities.length === 0
    ) {
      setError(
        "An account with this email already exists. Please sign in instead."
      );
      return;
    }
    setEmail("");
    setPassword("");
    setConfirm("");
    setAuthView("signin");
    setInfo(
      "Account created! Check your inbox to confirm your email. You can sign in once your email is verified."
    );
  };

  const sendReset = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setInfo("If an account exists for this email, a reset link has been sent.");
  };

  const resendVerification = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const { error: e } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback?type=signup` },
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setInfo("Verification email resent! Check your inbox.");
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

        {/* ── Unverified account gate ── */}
        {authView === "unverified" && (
          <>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl">
                📧
              </span>
              <h2 className="font-display text-xl font-bold text-ink">Verify your email</h2>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Only verified accounts can book a car. A verification email has been sent to{" "}
              <strong>{email || user?.email}</strong>. Please click the link in that email to
              confirm your account, then come back to book.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {info && <p className="mt-2 text-sm text-green-700">{info}</p>}
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              disabled={busy}
              onClick={() => void resendVerification()}
            >
              {busy ? "Sending…" : "Resend verification email"}
            </button>
            <button
              type="button"
              className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={closeAuth}
            >
              Close
            </button>
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
              <GoogleIcon />
              Sign in with Google
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
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="Enter your password"
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
            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
                {error.includes("already exists") && (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="font-semibold text-brand-600 hover:underline"
                      onClick={() => {
                        setError(null);
                        setInfo(null);
                        setAuthView("signin");
                      }}
                    >
                      Sign in instead →
                    </button>
                  </>
                )}
              </p>
            )}
            {/* Google sign-up */}
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium hover:bg-slate-50"
              onClick={() => void signInGoogle()}
              disabled={busy}
            >
              <GoogleIcon />
              Sign up with Google
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase text-slate-400">
                <span className="bg-white px-2">Or sign up with email</span>
              </div>
            </div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="mt-3 block text-sm font-medium text-slate-700">Password</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
            <label className="mt-3 block text-sm font-medium text-slate-700">Confirm password</label>
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              placeholder="Repeat your password"
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

function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/** Simple coloured Google "G" icon */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
