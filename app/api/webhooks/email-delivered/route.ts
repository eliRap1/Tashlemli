// TODO(audit): add Resend webhook signature verification
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const evt = await req.json() as { type?: string; data?: { message_id?: string; tags?: any; smtp?: { remote_host?: string; remote_ip?: string } } };
  if (evt.type !== "email.delivered") return NextResponse.json({ ok: true });
  const messageId = evt.data?.message_id;
  if (!messageId) return NextResponse.json({ error: "no_msgid" }, { status: 400 });

  const [demand] = await db
    .select({ claimId: claimEvents.claimId })
    .from(claimEvents)
    .where(sql`code = 'demand.sent' and metadata->>'messageId' = ${messageId}`)
    .limit(1);
  if (!demand) return NextResponse.json({ ok: true, ignored: true });

  const meta = {
    mail_server: {
      host: evt.data?.smtp?.remote_host ?? null,
      ip: evt.data?.smtp?.remote_ip ?? null,
    },
    messageId,
  };
  await db.insert(claimEvents).values({
    claimId: demand.claimId,
    code: "airline.delivered",
    actor: "airline",
    labelHe: "החברה קיבלה",
    labelEn: "Airline delivered",
    metadata: meta,
  });
  await db.update(claims).set({ currentState: "airline.delivered", currentStageIndex: 8 }).where(eq(claims.id, demand.claimId));
  return NextResponse.json({ ok: true });
}
