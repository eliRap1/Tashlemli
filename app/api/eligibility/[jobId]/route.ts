import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { eligibilityJobs } from "@/lib/db/schema/eligibility-jobs";
import { jobEvents } from "@/lib/db/schema/job-events";
import { asc, eq, gt } from "drizzle-orm";

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
  const events = await db
    .select()
    .from(jobEvents)
    .where(since ? gt(jobEvents.id, since) : eq(jobEvents.jobId, jobId))
    .orderBy(asc(jobEvents.occurredAt));
  return NextResponse.json({ job, events });
}
