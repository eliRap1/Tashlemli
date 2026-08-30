// TODO(audit): add Resend webhook signature verification
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { opsInbox } from "@/lib/db/schema/ops";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const evt = await req.json() as { type?: string; data?: { message_id?: string; reason?: string } };
  if (evt.type !== "email.bounced") return NextResponse.json({ ok: true });
  const messageId = evt.data?.message_id;
  if (!messageId) return NextResponse.json({ error: "no_msgid" }, { status: 400 });

  const [demand] = await db.select({ claimId: claimEvents.claimId }).from(claimEvents).where(sql`code = 'demand.sent' and metadata->>'messageId' = ${messageId}`).limit(1);
  if (!demand) return NextResponse.json({ ok: true, ignored: true });

  await db.insert(claimEvents).values({ claimId: demand.claimId, code: "airline.bounced", actor: "airline", labelHe: "המכתב חזר", labelEn: "Email bounced", metadata: { reason: evt.data?.reason ?? null } });
  await db.insert(opsInbox).values({ claimId: demand.claimId, kind: "airline.bounced", payload: evt });
  await db.update(claims).set({ currentState: "airline.bounced" }).where(eq(claims.id, demand.claimId));
  return NextResponse.json({ ok: true });
}
