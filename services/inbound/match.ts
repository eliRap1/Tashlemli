import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { or, sql } from "drizzle-orm";

export async function matchClaim(plusAddress: string | undefined, references: string[], inReplyTo: string | null): Promise<string | null> {
  if (plusAddress) {
    const m = plusAddress.match(/claims\+([0-9a-f]+)@/i);
    if (m) {
      // The routing token is the claim UUID with hyphens removed (32 hex chars).
      // Re-insert the hyphens to reconstruct the canonical UUID for a precise
      // equality lookup. Previously we used a LIKE prefix on claimToken, but all
      // HS256 JWTs share the same 24-char header prefix so that approach always
      // returned the same first claim in the DB.
      const hex = m[1].toLowerCase();
      if (hex.length === 32) {
        const uuid = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
        const [c] = await db.select({ id: claims.id }).from(claims).where(sql`id = ${uuid}::uuid`).limit(1);
        if (c) return c.id;
      }
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
