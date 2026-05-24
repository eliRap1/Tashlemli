import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { documents } from "@/lib/db/schema/documents";
import { opsInbox } from "@/lib/db/schema/ops";
import { and, eq } from "drizzle-orm";
import { parseEml } from "@/services/inbound/parser";
import { matchClaim } from "@/services/inbound/match";
import { classifyReply } from "@/services/inbound/classifier";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Verify a Svix webhook signature (used by Resend).
 * See https://docs.svix.com/receiving/verifying-payloads/how
 */
function verifySvixSignature(
  payload: string,
  headers: Headers,
  secret: string,
): boolean {
  const msgId = headers.get("svix-id") ?? "";
  const msgTimestamp = headers.get("svix-timestamp") ?? "";
  const msgSignature = headers.get("svix-signature") ?? "";
  if (!msgId || !msgTimestamp || !msgSignature) return false;

  // Svix secret is prefixed with "whsec_"; strip it to get the raw base64 key.
  const rawSecret = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice("whsec_".length), "base64")
    : Buffer.from(secret, "base64");

  const signedContent = `${msgId}.${msgTimestamp}.${payload}`;
  const expectedSig = createHmac("sha256", rawSecret)
    .update(signedContent)
    .digest("base64");

  // svix-signature may contain multiple space-separated "v1,<base64>" entries.
  return msgSignature.split(" ").some((entry) => {
    const [, sig] = entry.split(",");
    if (!sig) return false;
    try {
      const a = Buffer.from(expectedSig, "base64");
      const b = Buffer.from(sig, "base64");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    if (!verifySvixSignature(rawBody, req.headers, webhookSecret)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  } else {
    console.warn("[airline-mailbox] RESEND_WEBHOOK_SECRET is not set — skipping signature verification (dev mode)");
  }

  const ct = req.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? JSON.parse(rawBody) : null;
  if (!body) return NextResponse.json({ error: "unsupported" }, { status: 415 });

  const raw = body.raw ?? body.email?.raw ?? null;
  const parsed = raw ? await parseEml(raw) : {
    from: body.from?.email ?? "",
    to: (body.to ?? []).map((t: any) => t.email),
    subject: body.subject ?? "",
    text: body.text ?? "",
    html: body.html ?? null,
    messageId: body.message_id ?? null,
    inReplyTo: body.in_reply_to ?? null,
    references: body.references ?? [],
    receivedHeaders: body.received ?? [],
  };

  const plusAddress = parsed.to.find((a: string) => a.toLowerCase().startsWith("claims+"));
  const claimId = await matchClaim(plusAddress, parsed.references, parsed.inReplyTo);
  if (!claimId) return NextResponse.json({ error: "no_claim_match" }, { status: 422 });

  const cls = await classifyReply({ from: parsed.from, subject: parsed.subject, body: parsed.text });
  if (cls.is_automated) {
    await db.insert(opsInbox).values({ claimId, kind: "auto_reply", payload: { parsed, cls } });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const codeMap: Record<string, string> = {
    acknowledged:        "airline.replied",
    info_requested:      "airline.info_requested",
    denied:              "airline.denied",
    settlement_offered:  "settlement.offered",
    auto_reply:          "airline.replied",
    unrelated:           "airline.replied",
  };
  const labels: Record<string, [string, string, number]> = {
    "airline.replied":         ["החברה השיבה",         "Airline replied",         9],
    "airline.info_requested":  ["החברה ביקשה פרטים",   "Airline requested info",  9],
    "airline.denied":          ["החברה דחתה",         "Airline denied",          9],
    "settlement.offered":      ["הצעה להסדר",         "Settlement offered",     11],
  };
  const code = codeMap[cls.intent];
  const [labelHe, labelEn, idx] = labels[code] ?? labels["airline.replied"];

  await db.insert(claimEvents).values({
    claimId,
    code,
    actor: "airline",
    labelHe,
    labelEn,
    metadata: { from: parsed.from, subject: parsed.subject, classification: cls, messageId: parsed.messageId },
  });
  await db.update(claims).set({ currentState: code, currentStageIndex: idx }).where(eq(claims.id, claimId));

  const [doc] = await db.select().from(documents).where(and(eq(documents.claimId, claimId), eq(documents.kind, "demand_letter"))).limit(1);
  if (doc) await db.update(documents).set({ status: "received" }).where(eq(documents.id, doc.id));

  if (cls.requires_lawyer) {
    await db.insert(opsInbox).values({ claimId, kind: code, payload: { parsed, cls } });
  }

  return NextResponse.json({ ok: true, code });
}
