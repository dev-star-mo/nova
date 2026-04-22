"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Car } from "@/types/database";

type AuthView = "gate" | "signin" | "signup" | "reset";

type AppUIContextValue = {
  authOpen: boolean;
  authView: AuthView;
  openAuth: (view?: AuthView) => void;
  closeAuth: () => void;
  setAuthView: (v: AuthView) => void;
  bookingOpen: boolean;
  preselectedCar: Car | null;
  openBooking: (car?: Car | null) => void;
  closeBooking: () => void;
};

const AppUIContext = createContext<AppUIContextValue | null>(null);

export function AppUIProvider({ children }: { children: ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("signin");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedCar, setPreselectedCar] = useState<Car | null>(null);

  const openAuth = useCallback((view: AuthView = "signin") => {
    setAuthView(view);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const openBooking = useCallback((car?: Car | null) => {
    setPreselectedCar(car ?? null);
    setBookingOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    setBookingOpen(false);
    setPreselectedCar(null);
  }, []);

  const value = useMemo(
    () => ({
      authOpen,
      authView,
      openAuth,
      closeAuth,
      setAuthView,
      bookingOpen,
      preselectedCar,
      openBooking,
      closeBooking,
    }),
    [
      authOpen,
      authView,
      openAuth,
      closeAuth,
      bookingOpen,
      preselectedCar,
      openBooking,
      closeBooking,
    ]
  );

  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>;
}

export function useAppUI() {
  const ctx = useContext(AppUIContext);
  if (!ctx) throw new Error("useAppUI must be used within AppUIProvider");
  return ctx;
}
