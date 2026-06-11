import type { Car } from "@/types/database";

export function rentalDays(pickup: Date, returnDate: Date): number {
  const ms = returnDate.getTime() - pickup.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Compute rental total using strict overflow math:
 *   >= 30 days → floor(days/30) months + (days % 30) day-rate days
 *   >= 7 days  → floor(days/7) weeks   + (days % 7) day-rate days
 *   < 7 days   → days × day rate
 *
 * Examples (given price_per_day=1000, price_per_week=6000, price_per_month=22000):
 *   7 days  → 1×6000 = 6000
 *   8 days  → 1×6000 + 1×1000 = 7000
 *  14 days  → 2×6000 = 12000
 *  30 days  → 1×22000 = 22000
 *  31 days  → 1×22000 + 1×1000 = 23000
 */
export function computeRentalTotal(car: Car, pickup: Date, returnDate: Date): number {
  const days = rentalDays(pickup, returnDate);
  const perDay = Number(car.price_per_day);
  const perWeek = car.price_per_week != null ? Number(car.price_per_week) : perDay * 7;
  const perMonth = car.price_per_month != null ? Number(car.price_per_month) : perDay * 30;

  let total: number;
  if (days >= 30) {
    const months = Math.floor(days / 30);
    const leftoverDays = days % 30;
    total = months * perMonth + leftoverDays * perDay;
  } else if (days >= 7) {
    const weeks = Math.floor(days / 7);
    const leftoverDays = days % 7;
    total = weeks * perWeek + leftoverDays * perDay;
  } else {
    total = days * perDay;
  }

  return Math.round(total * 100) / 100;
}
