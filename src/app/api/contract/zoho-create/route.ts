import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateZohoAccessToken } from "@/lib/zoho";

type JsonBody = {
  booking_id?: string;
  prefill?: Record<string, any>;
  signature_data_url?: string | null;
};

export async function POST(req: Request) {
  const templateId = process.env.ZOHO_TEMPLATE_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Validate critical configuration
  if (!templateId) {
    console.error("Zoho error: ZOHO_TEMPLATE_ID is missing");
    return NextResponse.json({ error: "Zoho is not configured. Set ZOHO_TEMPLATE_ID." }, { status: 503 });
  }

  try {
    const body = (await req.json()) as JsonBody;
    const bookingId = body.booking_id;
    if (!bookingId) return NextResponse.json({ error: "booking_id required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json({ error: "Unauthorized", detail: authError?.message }, { status: 401 });
    }

    const { data: booking, error: dbError } = await supabase
      .from("bookings")
      .select("id, full_name, email, user_id")
      .eq("id", bookingId)
      .single();

    if (dbError || !booking) {
      console.error("Database error fetching booking:", dbError);
      return NextResponse.json({ error: "Booking not found", detail: dbError?.message }, { status: 404 });
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Obtain a fresh Zoho access token
    let accessToken: string;
    try {
      accessToken = await generateZohoAccessToken();
    } catch (tokenErr: any) {
      console.error("Failed to generate Zoho token:", tokenErr);
      return NextResponse.json({
        error: "Zoho Authentication Failed",
        detail: tokenErr.message || "Unknown OAuth error"
      }, { status: 502 });
    }

    const actionId = process.env.ZOHO_ACTION_ID ?? "584934000000047014";
    const prefill = body.prefill || {};
    const field_text_data: Record<string, string> = {};
    const field_boolean_data: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(prefill)) {
      if (typeof v === "boolean") {
        field_boolean_data[k] = v;
      } else {
        field_text_data[k] = v == null ? "" : String(v);
      }
    }

    const createBody = {
      templates: {
        field_data: {
          field_text_data,
          field_boolean_data,
          field_date_data: {},
          field_radio_data: {},
          field_checkboxgroup_data: {},
        },
        notes: `BookingID:${booking.id}`,
        actions: [
          {
            recipient_name: booking.full_name,
            recipient_email: booking.email,
            action_id: actionId,
            action_type: "SIGN",
            signing_order: 1,
            role: "Customer",
            verify_recipient: false,
            private_notes: "",
          },
        ],
      },
    };

    const createRes = await fetch(`https://sign.zoho.com/api/v1/templates/${encodeURIComponent(templateId)}/createdocument`, {
      method: "POST",
      headers: {
        Authorization: 'Zoho-oauthtoken 1000.30102b0f75d73fc387c0ecc5850cf722.8cc7047775d48226c6e182f2323ae785',
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

    if (!createRes.ok || createJson.status === "failure") {
      console.error("Zoho contract creation failure:", createJson);
      return NextResponse.json({
        error: "Zoho contract creation failed",
        status: createRes.status,
        detail: createJson
      }, { status: 502 });
    }

    const requestId = createJson?.requests?.request_id || createJson?.data?.request_id || createJson?.request_id;
    const createdActionId = createJson?.requests?.actions?.[0]?.action_id || createJson?.data?.actions?.[0]?.action_id;

    if (!requestId || !createdActionId) {
      console.error("Zoho response missing identifiers:", createJson);
      return NextResponse.json({
        error: "Zoho response missing request_id or action_id",
        detail: createJson
      }, { status: 502 });
    }

    // Save identifiers to database
    const { error: updateError } = await supabase.from("bookings").update({
      zoho_request_id: requestId,
      zoho_action_id: createdActionId,
      zoho_status: createJson?.requests?.status || createJson?.data?.status || null,
      status: "pending_signature",
    }).eq("id", booking.id);

    if (updateError) {
      console.error("Database update error (booking status):", updateError);
      return NextResponse.json({
        error: "Failed to update booking status in database",
        detail: updateError.message,
        zoho_request_id: requestId
      }, { status: 500 });
    }

    return NextResponse.json({
      message: "Zoho request created; signing email sent",
      zoho_request_id: requestId,
      zoho_action_id: createdActionId,
    });
  } catch (err: any) {
    console.error("Zoho create unexpected error:", err);
    return NextResponse.json({
      error: "Internal server error",
      message: err.message || "An unexpected error occurred"
    }, { status: 500 });
  }
}
