import { createHmac, timingSafeEqual } from "node:crypto";

export function razorpayCheckoutSignature(
  orderId: string,
  paymentId: string,
  secret: string,
): string {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function verifyRazorpayCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!input.secret || !input.signature) return false;
  const expected = razorpayCheckoutSignature(input.orderId, input.paymentId, input.secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyRazorpayWebhookSignature(input: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  if (!input.secret || !input.signature) return false;
  const expected = createHmac("sha256", input.secret).update(input.rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
