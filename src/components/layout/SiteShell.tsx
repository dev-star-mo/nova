"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { UserSessionProvider } from "@/components/providers/user-session-provider";
import { AppUIProvider } from "@/components/providers/app-ui-provider";
import { AuthModal } from "@/components/auth/AuthModal";
import { BookingModal } from "@/components/booking/BookingModal";
import { WhatsAppFAB } from "@/components/layout/WhatsAppFAB";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("denied") === "admin") {
      params.delete("denied");
      const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <UserSessionProvider>
      <AppUIProvider>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <AuthModal />
        <BookingModal />
        <WhatsAppFAB />
      </AppUIProvider>
    </UserSessionProvider>
  );
}
