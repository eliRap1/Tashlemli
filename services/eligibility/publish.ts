import { db } from "@/lib/db/client";
import { jobEvents } from "@/lib/db/schema/job-events";
import type { JobEvent } from "./types";

export async function publishJobEvent(jobId: string, event: JobEvent) {
  await db.insert(jobEvents).values({
    jobId,
    kind: event.kind,
    payload: event,
  });
}
