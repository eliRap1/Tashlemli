import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { like, or, sql } from "drizzle-orm";

export async function matchClaim(plusAddress: string | undefined, references: string[], inReplyTo: string | null): Promise<string | null> {
  if (plusAddress) {
    const m = plusAddress.match(/claims\+([^@]+)@/i);
    if (m) {
      // Strip LIKE wildcard chars so a plus-address like claims+%@... can't match all tokens.
      const short = m[1].replace(/[%_\\]/g, '');
      if (!short) return null;
      const [c] = await db.select().from(claims).where(like(claims.claimToken, `${short}%`)).limit(1);
      if (c) return c.id;
    }
  }
  const candidates = [inReplyTo, ...references].filter(Boolean) as string[];
  if (candidates.length) {
    const [hit] = await db
      .select({ claimId: claimEvents.claimId })
      .from(claimEvents)
      .where(or(...candidates.map((mid) => sql`metadata->>'messageId' = ${mid}`)))
      .limit(1);
    if (hit) return hit.claimId;
  }
  return null;
}
