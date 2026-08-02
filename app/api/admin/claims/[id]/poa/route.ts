import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { documents } from "@/lib/db/schema/documents";
import { poaSignatures } from "@/lib/db/schema/poa";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PoaPDF } from "@/services/poa/template";
import { createDocumentSimple } from "@/services/poa/documenso";
import { isValidTeudatZehut } from "@/lib/validators/teudat-zehut";
import { isAdmin } from "@/lib/auth/admin";

const PoaBody = z.object({
  israeli_id: z.string().min(1).max(20),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: z.string().min(1).max(300),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const claimId = z.string().uuid().parse(id);
  const parsed = PoaBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 422 });
  const body = parsed.data;

  if (!isValidTeudatZehut(body.israeli_id)) return NextResponse.json({ error: "bad_id" }, { status: 422 });

  const [c] = await db.select().from(claims).where(eq(claims.id, claimId)).limit(1);
  if (!c?.contactEmail) return NextResponse.json({ error: "no_email" }, { status: 412 });

  const buf = await renderToBuffer(React.createElement(PoaPDF, {
    full_name: c.passengerName,
    israeli_id: body.israeli_id,
    date_of_birth: body.date_of_birth,
    address: body.address,
    phone: c.contactPhone ?? "—",
    claim_id: claimId,
    lawyer_name: process.env.LAWYER_NAME ?? "עו״ד דניאל גולן",
    bar_license_number: process.env.LAWYER_BAR ?? "78214",
  }) as any);

  const { id: documensoId, signingUrl } = await createDocumentSimple({
    title: `POA · ${c.passengerName} · ${claimId.slice(0, 8)}`,
    pdfBase64: buf.toString("base64"),
    recipientEmail: c.contactEmail,
    recipientName: c.passengerName,
  });

  const [doc] = await db.insert(documents).values({ claimId, kind: "poa", documensoId, status: "sent", language: "he" }).returning();
  await db.insert(poaSignatures).values({ claimId, documentId: doc?.id, documensoId });
  await db.insert(claimEvents).values({ claimId, code: "poa.sent", actor: "system", labelHe: "ייפוי כוח נשלח", labelEn: "POA sent", metadata: { documensoId } });
  await db.update(claims).set({ currentState: "poa.sent", currentStageIndex: 2 }).where(eq(claims.id, claimId));

  return NextResponse.json({ documensoId, signingUrl });
}
