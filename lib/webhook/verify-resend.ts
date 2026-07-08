/**
 * Resend webhook signature verification (Svix format).
 *
 * Resend signs webhook deliveries using HMAC-SHA-256.  The signed content is
 * `{svix-id}.{svix-timestamp}.{rawBody}` and the key is the base64-decoded
 * webhook secret (strip the leading "whsec_" prefix first).
 *
 * See https://resend.com/docs/dashboard/webhooks/introduction
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const TOLERANCE_SECONDS = 300; // reject payloads older than 5 minutes

export async function verifyResendWebhook(req: Request): Promise<{ ok: boolean; rawBody: string }> {
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Secret not configured — fail secure: reject the request.
    return { ok: false, rawBody: "" };
  }

  const msgId = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const sigHeader = req.headers.get("svix-signature");

  if (!msgId || !timestamp || !sigHeader) {
    return { ok: false, rawBody: "" };
  }

  // Reject stale payloads.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) {
    return { ok: false, rawBody: "" };
  }

  const rawBody = await req.text();

  // Decode the signing key (strip "whsec_" prefix, then base64-decode).
  const keyBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const toSign = `${msgId}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", keyBytes).update(toSign).digest();

  // svix-signature may contain multiple space-separated "v1,<base64>" values.
  let matched = false;
  for (const part of sigHeader.split(" ")) {
    const b64 = part.replace(/^v1,/, "");
    try {
      const incoming = Buffer.from(b64, "base64");
      if (incoming.length === expected.length && timingSafeEqual(incoming, expected)) {
        matched = true;
        break;
      }
    } catch {
      // invalid base64 — skip
    }
  }

  return { ok: matched, rawBody };
}
