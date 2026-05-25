"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function VerifiedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setShow(true);
      // Clean the URL without triggering a reload
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-4 z-[200] mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-green-600 px-5 py-3.5 text-white shadow-lg"
    >
      <span className="text-xl">✅</span>
      <p className="flex-1 text-sm font-medium">
        Your email has been confirmed! You can now book a car.
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        className="ml-2 text-lg leading-none opacity-70 hover:opacity-100"
        onClick={() => setShow(false)}
      >
        ✕
      </button>
    </div>
  );
}
