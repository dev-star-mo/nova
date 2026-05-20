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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!templateId) {
    return NextResponse.json(
      { error: "Zoho is not configured. Set ZOHO_TEMPLATE_ID." },
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
    // Obtain a fresh Zoho access token via the shared helper
    const accessToken = await generateZohoAccessToken();
    console.log("Zoho access token:", accessToken);

    // Build the createBody exactly as Zoho's API requires for this template.
    // action_id and role are fixed values from the template configuration.
    const actionId = process.env.ZOHO_ACTION_ID ?? "584934000000047014";

    const prefill = body.prefill || {};
    // Separate text values from boolean values so they map to the correct Zoho field_data keys
    const field_text_data: Record<string, string> = {};
    const field_boolean_data: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(prefill)) {
      if (typeof v === "boolean") {
        field_boolean_data[k] = v;
      } else {
        field_text_data[k] = v == null ? "" : String(v);
      }
    }

    // Construct create request for Zoho Sign template.
    // Do NOT request embedded signing — we want Zoho to email the customer directly.
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
            // omit is_embedded so Zoho will send an email to the recipient
          },
        ],
      },
    };

    console.log("Zoho create body:", JSON.stringify(createBody, null, 2));

    const accessHeader = `Zoho-oauthtoken ${accessToken}`;
    const createRes = await fetch(`https://sign.zoho.com/api/v1/templates/${encodeURIComponent(templateId)}/createdocument`, {
      method: "POST",
      headers: {
        Authorization: accessHeader,
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
    console.log("Zoho create response:", JSON.stringify(createJson, null, 2));

    // The createdocument response nests data under "requests" at the top level
    const requestId: string | undefined =
      createJson?.requests?.request_id ||
      createJson?.data?.request_id ||
      createJson?.request_id;

    if (!requestId) {
      console.error("Zoho create failed — could not extract request_id", { status: createRes.status, body: createJson });
      return NextResponse.json({ error: "Failed to create Zoho request", status: createRes.status, detail: createJson }, { status: 502 });
    }

    // Extract the action_id that Zoho assigned to the created document.
    // This is distinct from the template action_id and is required for the embedtoken call.
    const createdActionId: string | undefined =
      createJson?.requests?.actions?.[0]?.action_id ||
      createJson?.data?.actions?.[0]?.action_id;

    if (!createdActionId) {
      console.error("Zoho create — could not extract action_id from response", createJson);
      return NextResponse.json({ error: "Failed to extract action_id from created Zoho document", detail: createJson }, { status: 502 });
    }

    // Save the Zoho request id, action id and request status to the booking
    const { error: updateError } = await supabase.from("bookings").update({
      zoho_request_id: requestId,
      zoho_action_id: createdActionId,
      zoho_status: createJson?.requests?.status || createJson?.data?.status || null,
      status: "pending_signature",
    }).eq("id", booking.id);

    if (updateError) {
      console.error("Zoho create: failed to update booking in database:", updateError);
      // We don't necessarily want to fail the whole request if the document was created,
      // but the webhook will certainly fail later if we don't fix this.
      // Given the previous issue, we'll return an error to let the user know.
      return NextResponse.json({
        error: "Failed to update booking status in database",
        detail: updateError,
        zoho_request_id: requestId
      }, { status: 500 });
    }

    console.log(`Zoho create: updated booking ${booking.id} with request_id ${requestId}`);

    // Return minimal success information. The customer will receive an email
    // directly from Zoho. Client should show the success confirmation page.
    return NextResponse.json({
      message: "Zoho request created; signing email sent",
      zoho_request_id: requestId,
      zoho_action_id: createdActionId,
      request_status: createJson?.requests?.status || createJson?.data?.status || null,
    });
  } catch (err) {
    console.error("Zoho create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
