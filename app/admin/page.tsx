import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function AdminQueue() {
  const rows = await db.select().from(claims).orderBy(desc(claims.updatedAt)).limit(200);
  return (
    <div dir="rtl">
      <h1 className="font-heebo font-black text-3xl mb-8">תור תיקים ({rows.length})</h1>
      <div className="grid gap-2">
        {rows.map((c) => (
          <Link key={c.id} href={`/admin/claims/${c.id}`} className="grid grid-cols-12 gap-3 items-center rounded-xl bg-[#0c1118] ring-1 ring-fluorescent/6 px-5 py-4 hover:ring-reversal/40">
            <div className="col-span-3 font-mono text-[11px] uppercase tracking-[0.3em] text-reversal/75">{c.currentState}</div>
            <div className="col-span-3 font-heebo font-bold">{c.passengerName}</div>
            <div className="col-span-2 font-mono text-fluorescent/60 text-sm">{c.airlineIata ?? "—"}</div>
            <div className="col-span-2 font-mono text-fluorescent/60 text-sm">{c.contactEmail ?? c.contactPhone ?? "—"}</div>
            <div className="col-span-2 text-end font-mono text-reversal text-base tabular-nums">₪ {c.amountIls.toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
