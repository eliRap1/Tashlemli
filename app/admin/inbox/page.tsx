import { db } from "@/lib/db/client";
import { opsInbox } from "@/lib/db/schema/ops";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function Inbox() {
  const rows = await db.select().from(opsInbox).orderBy(desc(opsInbox.createdAt)).limit(100);
  return (
    <div dir="rtl" className="space-y-3">
      <h1 className="font-heebo font-black text-3xl mb-6">תיבת ops ({rows.length})</h1>
      {rows.map((r) => (
        <Link key={r.id} href={`/admin/claims/${r.claimId}`} className="block rounded-xl bg-[#0c1118] ring-1 ring-fluorescent/6 px-5 py-4 hover:ring-reversal/40">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-reversal/80">{r.kind}</span>
            <span className="font-mono text-xs text-fluorescent/45">{new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ")}</span>
          </div>
          <pre className="font-mono text-xs text-fluorescent/65 mt-2 whitespace-pre-wrap break-all">{JSON.stringify(r.payload, null, 2).slice(0, 600)}</pre>
        </Link>
      ))}
    </div>
  );
}
