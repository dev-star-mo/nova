type InitResult = { authorization_url: string; reference: string } | null;

export async function initializePaystackPayment({
  amountKES,
  email,
  bookingId,
}: {
  amountKES: number;
  email: string;
  bookingId: string;
}): Promise<InitResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack secret not configured");

  const amountKobo = Math.round(amountKES * 100);

  const reference = `NV_${bookingId.slice(0, 8)}_${Date.now()}`;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: "KES",
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/checkout/success`,
      metadata: { booking_id: bookingId },
    }),
  });

  const json = await res.json();
  if (!json?.status || !json?.data?.authorization_url) {
    console.error("Paystack init failed", json);
    return null;
  }

  return { authorization_url: json.data.authorization_url, reference };
}
