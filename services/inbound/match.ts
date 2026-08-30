import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { or, sql } from "drizzle-orm";

/** Escape LIKE metacharacters so a plus-address token cannot act as a wildcard. */
function escapeLike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function matchClaim(plusAddress: string | undefined, references: string[], inReplyTo: string | null): Promise<string | null> {
  if (plusAddress) {
    const m = plusAddress.match(/claims\+([^@]+)@/i);
    if (m) {
      const short = escapeLike(m[1]);
      const [c] = await db.select().from(claims).where(sql`${claims.claimToken} LIKE ${short + "%"} ESCAPE '\\'`).limit(1);
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
