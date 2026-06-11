import type { ReactNode } from "react";

/** Auth routes use a dedicated full-screen shell — no site header or footer. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-onyx-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(197,160,89,0.35), transparent 60%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(197,160,89,0.12), transparent 50%)",
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
