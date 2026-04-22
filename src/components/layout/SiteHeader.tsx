"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";
import { UserMenu } from "@/components/layout/UserMenu";

const nav = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/lease", label: "Lease Your Car" },
  { href: "/cars", label: "Cars" },
  { href: "/#offers", label: "Offers" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, isAdmin } = useUserSession();
  const { openBooking, openAuth } = useAppUI();

  const handleBookNow = () => {
    setMobileOpen(false);
    if (!user) {
      openAuth("gate");
      return;
    }
    openBooking(null);
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => mobile && setMobileOpen(false)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === item.href.split("#")[0] && !item.href.includes("#")
              ? "bg-brand-50 text-brand-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-ink"
          } ${mobile ? "block" : ""}`}
        >
          {item.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => mobile && setMobileOpen(false)}
          className={`rounded-lg px-3 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 ${
            mobile ? "block" : ""
          }`}
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 shrink-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-lg font-bold text-white shadow-md">
            N
          </span>
          <span className="font-display min-w-0 leading-tight">
            <span className="block text-sm font-bold text-ink sm:text-lg">NovaDrive</span>
            <span className="block text-xs font-medium text-slate-500 sm:text-sm">
              CarLink Solutions
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-700"
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>
          <button
            type="button"
            onClick={handleBookNow}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            Book Now
          </button>
          {!loading && !user && (
            <button
              type="button"
              onClick={() => openAuth("signin")}
              className="hidden sm:block rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sign In
            </button>
          )}
          {!loading && user ? (
            <UserMenu />
          ) : null}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            <NavLinks mobile />
          </nav>
        </div>
      )}
    </header>
  );
}
