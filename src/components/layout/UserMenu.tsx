"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUserSession } from "@/components/providers/user-session-provider";

export function UserMenu() {
  const { user, profile, isAdmin, signOut } = useUserSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  if (!user) return null;

  const initial = (profile?.full_name || user.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-50 text-sm font-bold text-brand-800 hover:border-brand-400 transition-colors"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500 truncate">
            {user.email}
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-3 py-2 text-sm text-amber-800 hover:bg-amber-50"
              onClick={() => setOpen(false)}
            >
              Admin dashboard
            </Link>
          )}
          <Link
            href="/my-bookings"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            My bookings
          </Link>
          <Link
            href="/my-leases"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            My lease requests
          </Link>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
