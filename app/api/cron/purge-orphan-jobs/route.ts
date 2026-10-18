import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { eligibilityJobs } from "@/lib/db/schema/eligibility-jobs";
import { and, eq, isNull, lt } from "drizzle-orm";
import { deleteBlob } from "@/lib/blob/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const orphans = await db.select().from(eligibilityJobs).where(and(isNull(eligibilityJobs.claimId), lt(eligibilityJobs.createdAt, cutoff))).limit(500);
  let deleted = 0;
  for (const j of orphans) {
    try { if (j.blobKey?.startsWith("https://")) await deleteBlob(j.blobKey); } catch {}
    await db.delete(eligibilityJobs).where(eq(eligibilityJobs.id, j.id));
    deleted++;
  }
  return NextResponse.json({ deleted });
}
