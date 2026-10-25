import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a Resend webhook request using the Svix signing scheme.
 * Returns the raw body as a string, ready for JSON parsing.
 * Throws if the signature is invalid.
 * If RESEND_WEBHOOK_SECRET is not set, verification is skipped (dev fallback).
 */
export async function verifyResendWebhook(req: Request): Promise<string> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const body = await req.text();
  if (!secret) return body;

  const msgId = req.headers.get("svix-id");
  const msgTs = req.headers.get("svix-timestamp");
  const sigHeader = req.headers.get("svix-signature");

  if (!msgId || !msgTs || !sigHeader) {
    throw new Error("missing_svix_headers");
  }

  // Reject replays older than 5 minutes.
  if (Math.abs(Date.now() / 1000 - parseInt(msgTs, 10)) > 300) {
    throw new Error("stale_timestamp");
  }

  const keyBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", keyBytes)
    .update(`${msgId}.${msgTs}.${body}`)
    .digest("base64");

  const sigs = sigHeader.split(" ");
  const valid = sigs.some((s) => {
    try {
      const given = Buffer.from(s.replace(/^v1,/, ""), "base64");
      const exp = Buffer.from(expected, "base64");
      return given.length === exp.length && timingSafeEqual(given, exp);
    } catch {
      return false;
    }
  });

  if (!valid) throw new Error("invalid_signature");
  return body;
}
