export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_CONFIG = {
  new:       { label: "Pending Review", cls: "bg-amber-100 text-amber-800" },
  pending:   { label: "Pending Review", cls: "bg-amber-100 text-amber-800" },
  reviewing: { label: "Under Review",   cls: "bg-blue-100 text-blue-800" },
  accepted:  { label: "Accepted ✓",     cls: "bg-emerald-100 text-emerald-800" },
  rejected:  { label: "Not Accepted",   cls: "bg-red-100 text-red-800" },
} as const;

export default async function MyLeasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: leases, error } = await supabase
    .from("lease_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("My leases error:", error);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My lease requests</h1>
          <p className="mt-1 text-slate-500">Track the status of your vehicle lease submissions.</p>
        </div>
        <Link
          href="/lease"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          + Submit new
        </Link>
      </div>

      {(!leases || leases.length === 0) ? (
        <div className="mt-16 text-center">
          <p className="text-slate-500">You haven&apos;t submitted any lease requests yet.</p>
          <Link href="/lease" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Lease your car with NovaDrive →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {leases.map((lease) => {
            const statusKey = (lease.status ?? "new") as keyof typeof STATUS_CONFIG;
            const { label, cls } = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.new;

            // Parse phone_numbers (stored as JSON string in TEXT column)
            let phones: string[] = [];
            try {
              const raw = lease.phone_numbers;
              phones = Array.isArray(raw) ? raw : (raw ? JSON.parse(raw as string) : []);
            } catch { /* no-op */ }

            return (
              <li
                key={lease.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-ink">
                      {lease.brand} {lease.model}
                      <span className="ml-2 text-sm font-normal text-slate-500">({lease.year})</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {Number(lease.mileage_km).toLocaleString()} km
                      {lease.lease_duration_months ? ` • ${lease.lease_duration_months} months` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
                    {label}
                  </span>
                </div>

                {phones.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {phones.map((p) => (
                      <span key={p} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        📞 {p}
                      </span>
                    ))}
                  </div>
                )}

                {statusKey === "accepted" && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    🎉 Your lease request has been accepted! Our team will contact you shortly to finalise the arrangement.
                  </div>
                )}
                {statusKey === "rejected" && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Unfortunately your request wasn&apos;t accepted at this time. You&apos;re welcome to submit a new request.
                  </div>
                )}
                {(statusKey === "reviewing") && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    Our team is currently reviewing your request. We may contact you for more details.
                  </div>
                )}

                <p className="mt-3 text-xs text-slate-400">
                  Submitted {new Date(lease.created_at).toLocaleString()}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
