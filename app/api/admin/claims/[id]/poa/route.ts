import { NextResponse } from "next/server";
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

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const formData = await req.formData();
  const body = {
    israeli_id: formData.get("israeli_id") as string ?? "",
    date_of_birth: formData.get("date_of_birth") as string ?? "",
    address: formData.get("address") as string ?? "",
  };

  if (!isValidTeudatZehut(body.israeli_id)) return NextResponse.json({ error: "bad_id" }, { status: 422 });

  const [c] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!c?.contactEmail) return NextResponse.json({ error: "no_email" }, { status: 412 });

  const buf = await renderToBuffer(React.createElement(PoaPDF, {
    full_name: c.passengerName,
    israeli_id: body.israeli_id,
    date_of_birth: body.date_of_birth,
    address: body.address,
    phone: c.contactPhone ?? "—",
    claim_id: id,
    lawyer_name: process.env.LAWYER_NAME ?? "עו״ד דניאל גולן",
    bar_license_number: process.env.LAWYER_BAR ?? "78214",
  }) as any);

  const { id: documensoId, signingUrl } = await createDocumentSimple({
    title: `POA · ${c.passengerName} · ${id.slice(0, 8)}`,
    pdfBase64: buf.toString("base64"),
    recipientEmail: c.contactEmail,
    recipientName: c.passengerName,
  });

  const [doc] = await db.insert(documents).values({ claimId: id, kind: "poa", documensoId, status: "sent", language: "he" }).returning();
  await db.insert(poaSignatures).values({ claimId: id, documentId: doc?.id, documensoId });
  await db.insert(claimEvents).values({ claimId: id, code: "poa.sent", actor: "system", labelHe: "ייפוי כוח נשלח", labelEn: "POA sent", metadata: { documensoId } });
  await db.update(claims).set({ currentState: "poa.sent", currentStageIndex: 2 }).where(eq(claims.id, id));

  return NextResponse.json({ documensoId, signingUrl });
}
