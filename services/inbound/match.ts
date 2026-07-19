import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { or, sql } from "drizzle-orm";

export async function matchClaim(plusAddress: string | undefined, references: string[], inReplyTo: string | null): Promise<string | null> {
  if (plusAddress) {
    const m = plusAddress.match(/claims\+([^@]+)@/i);
    if (m) {
      const short = m[1]; // hex UUID prefix (no dashes), e.g. first 24 chars of c.id.replace(/-/g,'')
      // Match against the claim UUID stripped of dashes.  The plus-address is
      // derived from replace(id::text, '-', '') so a prefix match is safe and
      // unique — unlike a prefix match on claimToken whose first 24 chars are
      // an identical HS256 JWT header for every claim.
      const [c] = await db
        .select({ id: claims.id })
        .from(claims)
        .where(sql`replace(${claims.id}::text, '-', '') LIKE ${short + "%"}`)
        .limit(1);
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
