import { db, createListenClient } from "@/lib/db/client";
import { jobEvents } from "@/lib/db/schema/job-events";
import { asc, eq, gt } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ENC = new TextEncoder();
function frame(id: string, data: unknown): Uint8Array {
  return ENC.encode(`id: ${id}\n` + `data: ${JSON.stringify(data)}\n\n`);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const lastId = req.headers.get("last-event-id") ?? null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sql = createListenClient();

      const past = await db
        .select()
        .from(jobEvents)
        .where(lastId ? gt(jobEvents.id, lastId) : eq(jobEvents.jobId, jobId))
        .orderBy(asc(jobEvents.occurredAt));
      for (const ev of past) {
        if (ev.jobId !== jobId) continue;
        controller.enqueue(frame(ev.id, ev.payload));
      }

      const onNotify = async (rowId: string) => {
        const [row] = await db.select().from(jobEvents).where(eq(jobEvents.id, rowId)).limit(1);
        if (row) controller.enqueue(frame(row.id, row.payload));
      };

      await sql.listen(`job_events:${jobId}`, onNotify);

      const hb = setInterval(() => controller.enqueue(ENC.encode(`: hb\n\n`)), 25_000);

      const close = async () => {
        clearInterval(hb);
        try { await sql.end(); } catch {}
        try { controller.close(); } catch {}
      };
      (req as any).signal?.addEventListener?.("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}
