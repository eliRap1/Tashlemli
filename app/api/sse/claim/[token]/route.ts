import { db, createListenClient } from "@/lib/db/client";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { asc, eq } from "drizzle-orm";
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

      const rows = await db
        .select()
        .from(claimEvents)
        .where(eq(claimEvents.claimId, claimId))
        .orderBy(asc(claimEvents.occurredAt));
      const idx = lastId ? rows.findIndex((e) => e.id === lastId) : -1;
      const past = idx >= 0 ? rows.slice(idx + 1) : rows;
      for (const e of past) {
        controller.enqueue(frame(e.id, e));
      }

      // The pg trigger now emits "{claimId}:{rowId}" so we can do a targeted
      // single-row fetch.  The previous approach re-fetched all rows and took
      // the last one, which silently dropped the first event when two rows were
      // inserted in rapid succession (both callbacks saw the same latest row).
      await sql.listen("claim_events", async (payload) => {
        const colonIdx = payload?.indexOf(":");
        if (colonIdx === -1 || !payload) return;
        const payloadClaimId = payload.slice(0, colonIdx);
        const rowId = payload.slice(colonIdx + 1);
        if (payloadClaimId !== claimId || !rowId) return;
        const [evt] = await db.select().from(claimEvents).where(eq(claimEvents.id, rowId)).limit(1);
        if (evt) controller.enqueue(frame(evt.id, evt));
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
