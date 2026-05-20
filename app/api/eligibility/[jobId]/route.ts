import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { eligibilityJobs } from "@/lib/db/schema/eligibility-jobs";
import { jobEvents } from "@/lib/db/schema/job-events";
import { asc, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const since = new URL(req.url).searchParams.get("since");
  const [job] = await db.select().from(eligibilityJobs).where(eq(eligibilityJobs.id, jobId)).limit(1);
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const rows = await db
    .select()
    .from(jobEvents)
    .where(eq(jobEvents.jobId, jobId))
    .orderBy(asc(jobEvents.occurredAt));
  const idx = since ? rows.findIndex((e) => e.id === since) : -1;
  const events = idx >= 0 ? rows.slice(idx + 1) : rows;
  return NextResponse.json({ job, events });
}
