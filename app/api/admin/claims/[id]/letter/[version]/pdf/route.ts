import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema/documents";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { and, eq } from "drizzle-orm";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { DemandLetterPDF } from "@/services/letters/pdf";
import { isAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;

  const [doc] = await db.select().from(documents).where(and(eq(documents.claimId, id), eq(documents.kind, "demand_letter"))).limit(1);
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [drafted] = await db.select().from(claimEvents).where(and(eq(claimEvents.claimId, id), eq(claimEvents.code, "demand.drafted"))).limit(1);
  const letter = (drafted?.metadata as any)?.letter;
  if (!letter) return NextResponse.json({ error: "no_letter" }, { status: 404 });

  const stream = await renderToStream(React.createElement(DemandLetterPDF, { letter }) as any);
  return new Response(stream as any, { headers: { "content-type": "application/pdf", "cache-control": "no-store" } });
}
