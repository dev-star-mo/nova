// Lightweight mailer util. Supports SendGrid (SENDGRID_API_KEY) or logs the message when not configured.
type MailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail(opts: MailOptions): Promise<boolean> {
  const brevoKey = process.env.BREVO_API_KEY;
  const sender = { email: process.env.SUPPORT_EMAIL ?? "no-reply@example.com", name: process.env.SUPPORT_NAME ?? "Support" };

  if (!brevoKey) {
    // In non-production/dev environments we still log the email so it's easy to copy
    console.warn("BREVO_API_KEY not set — logging email instead of sending.");
    console.log("--- EMAIL (logged) ---");
    console.log("To:", opts.to);
    console.log("From:", sender);
    console.log("Subject:", opts.subject);
    console.log("HTML:", opts.html);
    console.log("--- END EMAIL ---");
    return true;
  }

  const payload = {
    sender,
    to: [{ email: opts.to }],
    subject: opts.subject,
    htmlContent: opts.html,
  } as const;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Try to surface Brevo error details for easier debugging
      let bodyText: string;
      try {
        bodyText = await res.text();
      } catch (e) {
        bodyText = `<could not read response body: ${String(e)}>`;
      }
      console.error("Brevo send error", { status: res.status, body: bodyText });
      return false;
    }

    console.info(`Email sent to ${opts.to} via Brevo`);
    return true;
  } catch (err) {
    console.error("Brevo send exception", err);
    return false;
  }
}

export function paymentRequestHtml({ fullName, bookingRef, amount, paymentLink, deadline }: { fullName: string; bookingRef: string; amount: number; paymentLink: string; deadline?: string; }) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;line-height:1.4">
    <h2 style="color:#0f172a">Thank you for signing your agreement, ${fullName}.</h2>
    <p>Your booking reference: <strong>${bookingRef}</strong></p>
    <p>Amount due: <strong>KSh ${amount.toLocaleString()}</strong></p>
    <p>Please complete payment securely using the link below:</p>
    <p><a href="${paymentLink}" style="display:inline-block;background:#10b981;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">Pay Now</a></p>
    ${deadline ? `<p>Payment due by: ${deadline}</p>` : ""}
    <hr />
    <p>If you did not sign this agreement or need help, reply to this email or contact support.</p>
  </div>
  `;
}

export function confirmationHtml({ fullName, bookingRef, amount }: { fullName: string; bookingRef: string; amount: number; }) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;line-height:1.4">
    <h2>Booking confirmed — Thank you, ${fullName}!</h2>
    <p>Your booking <strong>${bookingRef}</strong> is now confirmed. Amount paid: <strong>KSh ${amount.toLocaleString()}</strong>.</p>
    <p>We look forward to serving you. Contact support for any questions.</p>
  </div>
  `;
}
