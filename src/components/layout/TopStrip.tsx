"use client";

import { useAppUI } from "@/components/providers/app-ui-provider";

const PHONE = "+254 733 555 638";
const LOCATION = "Nairobi, Kenya";

export function TopStrip() {
  const { openAuth } = useAppUI();

  return (
    <div className="bg-ink text-white text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-white/90">
          <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="hover:text-white">
            {PHONE}
          </a>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="text-white/90">{LOCATION}</span>
        </div>
        <button
          type="button"
          onClick={() => openAuth("signin")}
          className="font-medium text-brand-100 hover:text-white transition-colors"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
