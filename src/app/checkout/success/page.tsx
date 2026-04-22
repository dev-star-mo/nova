import Link from "next/link";
import { CheckoutSuccessClient } from "@/components/checkout/CheckoutSuccessClient";

type Search = { reference?: string; trxref?: string };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const reference = typeof sp.reference === "string" ? sp.reference : typeof sp.trxref === "string" ? sp.trxref : "";

  if (reference) {
    return <CheckoutSuccessClient reference={reference} />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Payment initiated</h1>
      <p className="mt-3 text-slate-600">
        If you completed payment on Paystack, your booking will update shortly. You can always check
        status under My bookings.
      </p>
      <Link
        href="/my-bookings"
        className="mt-8 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
      >
        My bookings
      </Link>
    </div>
  );
}
