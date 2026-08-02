import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth/admin";

const STAGE_LABELS: Record<string, { he: string; en: string; index: number }> = {
  "intake.received":    { he: "תיק התקבל",        en: "Claim received",         index: 1 },
  "poa.sent":           { he: "ייפוי כוח נשלח",    en: "POA sent",               index: 2 },
  "poa.signed":         { he: "ייפוי כוח נחתם",    en: "POA signed",             index: 3 },
  "evidence.collected": { he: "עדויות נאספו",      en: "Evidence collected",     index: 4 },
  "demand.drafted":     { he: "מכתב דרישה הוכן",   en: "Demand letter drafted",  index: 5 },
  "demand.reviewed":    { he: "נסקר על ידי עו״ד",   en: "Reviewed by counsel",   index: 6 },
  "demand.sent":        { he: "נשלח לחברת התעופה",  en: "Demand sent",           index: 7 },
  "airline.delivered":  { he: "החברה קיבלה",       en: "Airline delivered",      index: 8 },
  "airline.replied":    { he: "החברה השיבה",      en: "Airline replied",         index: 9 },
  "negotiation.open":   { he: "משא ומתן פתוח",    en: "Negotiation open",        index: 10 },
  "settlement.offered": { he: "הצעה להסדר",       en: "Settlement offered",      index: 11 },
  "settlement.accepted":{ he: "ההסדר התקבל",      en: "Settlement accepted",     index: 12 },
  "payout.requested":   { he: "תשלום בדרך",       en: "Payout requested",        index: 13 },
  "payout.complete":    { he: "הכסף הועבר",        en: "Payout complete",        index: 14 },
  "claim.closed":       { he: "תיק נסגר",          en: "Claim closed",           index: 15 },
};

const Body = z.object({ code: z.string(), metadata: z.record(z.string(), z.any()).optional() });

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const claimId = z.string().uuid().parse(id);
  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  const stage = STAGE_LABELS[parsed.data.code];
  if (!stage) return NextResponse.json({ error: "unknown_code" }, { status: 400 });

  await db.insert(claimEvents).values({
    claimId, code: parsed.data.code, actor: "lawyer",
    labelHe: stage.he, labelEn: stage.en,
    metadata: parsed.data.metadata ?? null,
  });
  await db.update(claims).set({ currentState: parsed.data.code, currentStageIndex: stage.index }).where(eq(claims.id, claimId));

  return NextResponse.json({ ok: true });
}
