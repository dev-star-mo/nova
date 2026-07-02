import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type CookieRow = { name: string; value: string; options?: CookieOptions };

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_VERCEL_URL ??
  "https://novadriverentacar.com";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "recovery" | "signup" | undefined
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieRow[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Password-reset link → open the update-password form
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }
      // Email confirmation link → home page with verified banner
      if (type === "signup") {
        return NextResponse.redirect(`${SITE_URL}/?verified=1`);
      }
      // OAuth (Google, etc.) or generic redirect — strip the code param by
      // redirecting to the clean site URL (no ?code= in the final URL).
      const destination = next === "/" ? SITE_URL : `${SITE_URL}${next}`;
      return NextResponse.redirect(destination);
    }
  }

  // Link expired / invalid → redirect to clean home URL so the browser never
  // shows the ugly ?auth=error#error=... query string. The VerifiedBanner
  // component will display an inline error message instead.
  return NextResponse.redirect(`${SITE_URL}/?link_expired=1`);
}
