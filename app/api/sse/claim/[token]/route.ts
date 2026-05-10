import { db, createListenClient } from "@/lib/db/client";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { and, asc, eq, gt } from "drizzle-orm";
import { verifyClaimToken } from "@/lib/jwt/claim-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ENC = new TextEncoder();
const frame = (id: string, data: unknown) => ENC.encode(`id: ${id}\ndata: ${JSON.stringify(data)}\n\n`);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let claimId: string;
  try { claimId = (await verifyClaimToken(token)).claim_id; }
  catch { return new Response("forbidden", { status: 403 }); }

  const lastId = req.headers.get("last-event-id") ?? null;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sql = createListenClient();

      const past = await db
        .select()
        .from(claimEvents)
        .where(lastId ? and(eq(claimEvents.claimId, claimId), gt(claimEvents.id, lastId)) : eq(claimEvents.claimId, claimId))
        .orderBy(asc(claimEvents.occurredAt));
      for (const e of past) {
        controller.enqueue(frame(e.id, e));
      }

      sql.listen("claim_events", async (payload) => {
        if (payload !== claimId) return;
        const recent = await db.select().from(claimEvents).where(eq(claimEvents.claimId, claimId)).orderBy(asc(claimEvents.occurredAt));
        const last = recent[recent.length - 1];
        if (last) controller.enqueue(frame(last.id, last));
      });

      const hb = setInterval(() => controller.enqueue(ENC.encode(`: hb\n\n`)), 25_000);
      const close = async () => { clearInterval(hb); try { await sql.end(); } catch {} try { controller.close(); } catch {} };
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
