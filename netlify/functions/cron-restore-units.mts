/** @type {import('@netlify/functions').Config} */
export const config = {
  schedule: "0 3 * * *", // runs daily at 03:00 UTC
};

/**
 * Netlify Scheduled Function — calls the Next.js cron API route
 * with the shared CRON_SECRET so the route's auth guard passes.
 *
 * Deploy environment variable required:
 *   CRON_SECRET   — same value set in your Next.js environment
 *   NEXT_PUBLIC_SITE_URL — your production URL (no trailing slash)
 */
export default async function handler() {
  const secret = process.env.CRON_SECRET;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.URL ?? // Netlify sets $URL automatically in production
    "http://localhost:3000";

  if (!secret) {
    console.error("[cron-restore-units] CRON_SECRET is not set – aborting.");
    return;
  }

  const url = `${siteUrl.replace(/\/$/, "")}/api/cron/restore-units`;

  console.log(`[cron-restore-units] Calling ${url}`);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[cron-restore-units] Route returned ${res.status}: ${body}`);
    return;
  }

  const json = await res.json();
  console.log("[cron-restore-units] Result:", JSON.stringify(json));
}
