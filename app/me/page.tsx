import { requireUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { desc, eq } from "drizzle-orm";
import { ClaimRow } from "@/components/me/ClaimRow";
import Link from "next/link";

export default async function MeDashboard() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(claims)
    .where(eq(claims.userId, user.id))
    .orderBy(desc(claims.createdAt))
    .limit(50);

  return (
    <main dir="rtl" className="min-h-screen bg-terminal text-fluorescent py-16 px-6">
      <div className="mx-auto max-w-[1080px]">
        <header className="flex items-end justify-between mb-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">DASHBOARD</span>
            <h1 className="mt-3 font-heebo font-black tracking-tightest text-4xl sm:text-5xl">שלום, {user.fullName ?? user.email}</h1>
          </div>
          <Link href="/me/settings" className="font-mono text-xs uppercase tracking-[0.3em] text-fluorescent/55 hover:text-reversal">
            הגדרות
          </Link>
        </header>

        {rows.length === 0 ? (
          <div className="font-heebo text-fluorescent/65">
            אין תיקים עדיין. <Link href="/check" className="text-reversal underline">בדקי טיסה.</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((c) => <ClaimRow key={c.id} claim={c} />)}
          </div>
        )}
      </div>
    </main>
  );
}
