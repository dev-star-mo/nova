"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, X } from "lucide-react";

type BannerState = "verified" | "link_expired" | null;

export function VerifiedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<BannerState>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;

    if (url.searchParams.get("verified") === "1") {
      setState("verified");
      url.searchParams.delete("verified");
      changed = true;
    } else if (url.searchParams.get("link_expired") === "1") {
      setState("link_expired");
      url.searchParams.delete("link_expired");
      changed = true;
    }

    // Also strip any stray ?code= that may appear after OAuth
    if (url.searchParams.has("code")) {
      url.searchParams.delete("code");
      changed = true;
    }

    if (changed) {
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state) return null;

  if (state === "verified") {
    return (
      <div
        role="status"
        className="fixed inset-x-0 top-4 z-[200] mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-green-600 px-5 py-3.5 text-white shadow-lg"
      >
        <CheckCircle className="h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm font-medium">
          Your email has been confirmed! You can now book a car.
        </p>
        <button
          type="button"
          aria-label="Dismiss"
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => setState(null)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // link_expired
  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-4 z-[200] mx-auto flex max-w-lg items-start gap-3 rounded-2xl bg-red-600 px-5 py-4 text-white shadow-lg"
    >
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold">Password reset link has expired.</p>
        <p className="mt-0.5 text-xs font-medium opacity-85">
          Please go to Sign In and request a new password reset link.
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        className="opacity-70 hover:opacity-100 transition-opacity"
        onClick={() => setState(null)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
