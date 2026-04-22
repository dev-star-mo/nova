"use client";

import type { Car } from "@/types/database";
import { useUserSession } from "@/components/providers/user-session-provider";
import { useAppUI } from "@/components/providers/app-ui-provider";

export function CarDetailActions({ car }: { car: Car }) {
  const { user } = useUserSession();
  const { openAuth, openBooking } = useAppUI();

  const book = () => {
    if (!user) {
      openAuth("gate");
      return;
    }
    openBooking(car);
  };

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={book}
        className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Book Now
      </button>
    </div>
  );
}
