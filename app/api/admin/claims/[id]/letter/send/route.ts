import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { documents } from "@/lib/db/schema/documents";
import { airlines } from "@/lib/db/schema/airlines";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { auditLog } from "@/lib/db/schema/ops";
import { and, eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { DemandLetterPDF } from "@/services/letters/pdf";
import { sendEmail } from "@/lib/email/resend";
import { putPublic } from "@/lib/blob/client";
import { sha256Hex } from "@/lib/hash";
import { isAdmin } from "@/lib/auth/admin";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;

  const [c] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [drafted] = await db.select().from(claimEvents).where(and(eq(claimEvents.claimId, id), eq(claimEvents.code, "demand.drafted"))).limit(1);
  const letter = (drafted?.metadata as any)?.letter;
  if (!letter) return NextResponse.json({ error: "no_letter" }, { status: 409 });
  const [air] = c.airlineIata ? await db.select().from(airlines).where(eq(airlines.iata, c.airlineIata)).limit(1) : [];
  const to = air?.primaryContactEmail ?? air?.fallbackContactEmail;
  if (!to) return NextResponse.json({ error: "no_airline_email" }, { status: 412 });

  const buf = await renderToBuffer(React.createElement(DemandLetterPDF, { letter }) as any);
  const hash = sha256Hex(buf);
  const blobKey = `letters/${id}/v1-${hash.slice(0, 12)}.pdf`;
  const stored = await putPublic(blobKey, buf, "application/pdf");

  const [doc] = await db.select().from(documents).where(and(eq(documents.claimId, id), eq(documents.kind, "demand_letter"))).limit(1);
  if (doc) {
    await db.update(documents).set({ status: "sent_to_airline", blobKey: stored.url, hashSha256: hash }).where(eq(documents.id, doc.id));
  }

  // Use the claim UUID (hex, no dashes) as the plus-address token.
  // claimToken is a JWT whose first ~24 chars are an identical HS256 header
  // prefix for every claim, so slicing the JWT would route all replies to
  // whichever claim happened to be inserted first.
  const shortId = c.id.replace(/-/g, "").slice(0, 24);
  const replyTo = `claims+${shortId}@in.tashlemli.co.il`;
  const messageId = `<${id}.${Date.now()}@${env.APP_BASE_URL.replace(/^https?:\/\//, "")}>`;
  await sendEmail({
    to,
    subject: letter.subject_en,
    html: `<p>Please see attached.</p><p>${letter.subject_he}</p>`,
    text: letter.subject_en,
    replyTo,
    headers: { "Message-Id": messageId },
    attachments: [{ filename: `tashlemli-demand-${id.slice(0, 8)}.pdf`, content: buf, contentType: "application/pdf" }],
  });

  await db.insert(claimEvents).values({ claimId: id, code: "demand.sent", actor: "lawyer", labelHe: "נשלח לחברת התעופה", labelEn: "Demand sent", metadata: { messageId, to } });
  await db.update(claims).set({ currentState: "demand.sent", currentStageIndex: 7 }).where(eq(claims.id, id));

  await db.insert(auditLog).values({ action: "letter.send", resourceType: "claim", resourceId: id, after: { messageId, to, blobKey: stored.url } });

  return NextResponse.json({ ok: true, blobUrl: stored.url, messageId });
}
