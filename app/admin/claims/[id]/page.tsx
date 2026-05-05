import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";

export default async function ClaimAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!c) return <div>not found</div>;
  const events = await db.select().from(claimEvents).where(eq(claimEvents.claimId, id)).orderBy(asc(claimEvents.occurredAt));

  return (
    <div dir="rtl" className="grid grid-cols-12 gap-6">
      <aside className="col-span-4 space-y-3">
        <div className="rounded-2xl bg-[#0c1118] p-5 ring-1 ring-fluorescent/8">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/45 mb-2">CLAIM</div>
          <div className="font-heebo font-black text-2xl">{c.passengerName}</div>
          <div className="font-mono text-sm text-fluorescent/60 mt-1">{c.airlineIata ?? "—"} · ₪ {c.amountIls.toLocaleString()}</div>
          <div className="font-mono text-[10px] text-fluorescent/45 mt-3 uppercase tracking-[0.3em]">{c.currentState}</div>
        </div>
        <div className="rounded-2xl bg-[#0c1118] p-5 ring-1 ring-fluorescent/8 space-y-2">
          <Link className="block rounded-full bg-reversal px-4 py-2 font-heebo font-bold text-terminal text-center" href={`/admin/claims/${id}/letter`}>פתח עורך מכתב</Link>
          <form action={`/api/admin/claims/${id}/poa`} method="POST" className="space-y-2">
            <input name="israeli_id" required placeholder="ת.ז." className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-4 py-2 font-mono text-fluorescent" dir="ltr" />
            <input name="date_of_birth" required type="date" className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-4 py-2 font-mono text-fluorescent" dir="ltr" />
            <input name="address" required placeholder="כתובת" className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-4 py-2 font-mono text-fluorescent" />
            <button className="w-full rounded-full bg-fluorescent/10 py-2 font-heebo">שלח POA</button>
          </form>
        </div>
      </aside>
      <section className="col-span-8 space-y-3">
        {events.map((e) => (
          <div key={e.id} className="rounded-xl bg-[#0c1118] p-4 ring-1 ring-fluorescent/6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-reversal/80">{e.code}</span>
              <span className="font-mono text-xs text-fluorescent/45">{new Date(e.occurredAt).toISOString().slice(0, 16).replace("T", " ")}</span>
            </div>
            <div className="font-heebo font-bold mt-1">{e.labelHe}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
