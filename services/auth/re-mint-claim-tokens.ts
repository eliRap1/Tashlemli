import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { eq } from "drizzle-orm";
import { signClaimToken } from "@/lib/jwt/claim-token";

export async function reMintUserClaimTokens(userId: string) {
  const rows = await db.select().from(claims).where(eq(claims.userId, userId));
  for (const c of rows) {
    const token = await signClaimToken(c.id);
    await db.update(claims).set({ claimToken: token }).where(eq(claims.id, c.id));
  }
  return rows.length;
}
