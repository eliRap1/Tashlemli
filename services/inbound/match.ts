import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq, or, sql } from "drizzle-orm";

export async function matchClaim(plusAddress: string | undefined, references: string[], inReplyTo: string | null): Promise<string | null> {
  if (plusAddress) {
    const m = plusAddress.match(/claims\+([^@]+)@/i);
    if (m) {
      // The subaddress is the claim UUID (set in letter/send/route.ts).
      // Previously used claimToken.slice(0,24) which is non-unique across claims
      // because all HS256 JWTs share the same 24-char header prefix.
      const claimId = m[1];
      const [c] = await db.select().from(claims).where(eq(claims.id, claimId)).limit(1);
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
