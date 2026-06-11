import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/?auth=required");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/?denied=admin");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-onyx-950 shadow-xl shadow-onyx-950/10 transition-transform hover:scale-105">
              <span className="text-sm font-bold text-brand-600">N</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-onyx-950 tracking-tight leading-none">Nova Intelligence</span>
              <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-brand-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] text-brand-700 border border-brand-100">
                Administrative Desk
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-onyx-950 uppercase tracking-widest leading-none">
                {profile?.full_name ?? user.email?.split('@')[0]}
              </span>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">Authenticated Officer</span>
            </div>
            <Link
              href="/"
              className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-onyx-950 hover:text-onyx-950 hover:bg-white transition-all active:scale-95"
            >
              ← Terminate Session
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-screen-xl px-5 py-8">
        {children}
      </main>
    </div>
  );
}
