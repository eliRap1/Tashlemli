import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { flights } from "@/lib/db/schema/flights";
import { documents, documentVersions } from "@/lib/db/schema/documents";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq } from "drizzle-orm";
import { generateLetter } from "@/services/letters/generator";
import { isAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const [c] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [f] = c.flightId ? await db.select().from(flights).where(eq(flights.id, c.flightId)).limit(1) : [];

  const letter = await generateLetter({
    passenger_name: c.passengerName,
    flight_number: f?.flightNumber ?? "—",
    flight_date: f?.date ?? "—",
    origin_iata: f?.departureIata ?? "—",
    destination_iata: f?.arrivalIata ?? "—",
    airline_name: c.airlineIata,
    amount_ils: c.amountIls,
    jurisdiction: c.jurisdiction as "EU261" | "IL2012" | "BOTH",
    grounds: [],
    rationale_he: "",
    reason_category: c.reasonCategory,
    lawyer: {
      firm: process.env.LAWYER_FIRM ?? "תשלם לי",
      name: process.env.LAWYER_NAME ?? "עו״ד דניאל גולן",
      bar_license: process.env.LAWYER_BAR ?? "78214",
      address: process.env.LAWYER_ADDRESS ?? "רוטשילד 22, תל אביב",
      phone: process.env.LAWYER_PHONE ?? "+972-50-000-0000",
      email: process.env.LAWYER_EMAIL ?? "lawyer@tashlemli.co.il",
    },
  });

  const [doc] = await db
    .insert(documents)
    .values({ claimId: id, kind: "demand_letter", language: "he+en", currentVersion: 1, status: "draft" })
    .returning();
  if (!doc) return NextResponse.json({ error: "db_fail" }, { status: 500 });
  await db.insert(documentVersions).values({ documentId: doc.id, version: 1, diffSummary: "AI draft v1" });
  await db.insert(claimEvents).values({ claimId: id, code: "demand.drafted", actor: "system", labelHe: "מכתב דרישה הוכן", labelEn: "Demand letter drafted", metadata: { documentId: doc.id, letter } });

  return NextResponse.json({ documentId: doc.id, letter });
}
