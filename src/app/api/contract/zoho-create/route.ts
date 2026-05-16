import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type JsonBody = {
  booking_id?: string;
  prefill?: Record<string, any>;
  signature_data_url?: string | null;
};

export async function POST(req: Request) {
  const env = process.env;
  const clientId = env.ZOHO_CLIENT_ID;
  const clientSecret = env.ZOHO_CLIENT_SECRET;
  const refreshToken = env.ZOHO_REFRESH_TOKEN;
  const templateId = env.ZOHO_TEMPLATE_ID;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!clientId || !clientSecret || !refreshToken || !templateId) {
    return NextResponse.json(
      { error: "Zoho is not configured. Set ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN/TEMPLATE_ID." },
      { status: 503 }
    );
  }

  const body = (await req.json()) as JsonBody;
  const bookingId = body.booking_id;
  if (!bookingId) return NextResponse.json({ error: "booking_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, full_name, email, user_id")
    .eq("id", bookingId)
    .single();

  if (error || !booking || booking.user_id !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  try {
    // Exchange refresh token for access token
    const tokenRes = await fetch(
      `https://accounts.zoho.com/oauth/v2/token?refresh_token=${encodeURIComponent(refreshToken)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=refresh_token`,
      { method: "POST" }
    );
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: "Unable to fetch Zoho access token", detail: tokenJson }, { status: 502 });
    }

    // Create a Zoho Sign request using the configured template.
    // We instruct Zoho not to email the recipient and instead create an embedded signing session.
    // Build the request body and include merge/prefill fields from the frontend when available.
    // Map incoming prefill keys to Zoho's field_data structure.
    // Your Zoho template must have text fields named exactly to match these keys.
    const prefill = body.prefill || {};
    const field_data = Object.entries(prefill).map(([k, v]) => ({
      field_name: k,
      field_value: v == null ? "" : String(v),
    }));

    const createBody: any = {
  templates: {
    template_id: templateId,
    request_name: `Rental Agreement - ${booking.id}`,
    is_sequential: false,
    notes: `BookingID:${booking.id}`, // Tracking tag for your Supabase webhook
    actions: [
      {
        recipient_name: booking.full_name,
        recipient_email: booking.email,
        action_type: "SIGN",
        signing_order: 1,
        role: "SIGNER", // Ensure this matches the exact Role Name inside your Zoho Template settings
        field_data: {
          fields: field_data // Your array of mapped prefill input values
        }
      }
    ]
  }
};

console.log("Zoho create body:", JSON.stringify(createBody, null, 2));

    const createRes = await fetch("https://sign.zoho.com/api/v1/requests", {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBody),
    });

    const createText = await createRes.text();
    let createJson: any;
    try {
      createJson = JSON.parse(createText);
    } catch {
      createJson = { raw: createText };
    }
    // log the full response from Zoho in case of errors to help with debugging
    const requestId =
      createJson?.data?.request_id ||
      createJson?.request_id ||
      createJson?.data?.id ||
      createJson?.data?.requests?.[0]?.request_id ||
      createJson?.data?.requests?.[0]?.id ||
      createJson?.requests?.[0]?.request_id ||
      createJson?.requests?.[0]?.id;
    if (!requestId) {
      console.error("Zoho create failed", { status: createRes.status, body: createJson });
      return NextResponse.json({ error: "Failed to create Zoho request", status: createRes.status, detail: createJson }, { status: 502 });
    }

    // Save the Zoho request id to the booking for later correlation
    await supabase.from("bookings").update({ zoho_request_id: requestId }).eq("id", booking.id);

    // Create an embedded signing URL (displayed in an iframe)
    const embedBody = {
      data: {
        request: {
          redirect_url: `${siteUrl}/my-bookings`,
          display: "IFRAME",
        },
      },
    };

    const embedRes = await fetch(`https://sign.zoho.com/api/v1/requests/${encodeURIComponent(requestId)}/embeddedurl`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(embedBody),
    });

    const embedText = await embedRes.text();
    let embedJson: any;
    try {
      embedJson = JSON.parse(embedText);
    } catch {
      embedJson = { raw: embedText };
    }
    const embedUrl = embedJson?.data?.embedded_url || embedJson?.data?.embed_url || embedJson?.embedded_url || embedJson?.url;
    if (!embedUrl) {
      console.error("Zoho embed URL failed", { status: embedRes.status, body: embedJson });
      return NextResponse.json({ error: "Failed to obtain Zoho embedded URL", status: embedRes.status, detail: embedJson }, { status: 502 });
    }

    return NextResponse.json({ embed_url: embedUrl });
  } catch (err) {
    console.error("Zoho create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
