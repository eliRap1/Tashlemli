import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { opsInbox } from "@/lib/db/schema/ops";
import { eq } from "drizzle-orm";
import { classifyReply } from "@/services/inbound/classifier";
import { isAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const { from, subject, body } = await req.json() as { from: string; subject: string; body: string };
  const cls = await classifyReply({ from, subject, body });

  const codeMap: Record<string, string> = {
    acknowledged: "airline.replied",
    info_requested: "airline.info_requested",
    denied: "airline.denied",
    settlement_offered: "settlement.offered",
    auto_reply: "airline.replied",
    unrelated: "airline.replied",
  };
  const code = codeMap[cls.intent];
  await db.insert(claimEvents).values({ claimId: id, code, actor: "airline", labelHe: cls.summary_he, labelEn: subject, metadata: { manual: true, classification: cls, from, subject } });
  if (cls.requires_lawyer) await db.insert(opsInbox).values({ claimId: id, kind: code, payload: { from, subject, body, cls } });
  await db.update(claims).set({ currentState: code }).where(eq(claims.id, id));
  return NextResponse.json({ ok: true, code, classification: cls });
}
