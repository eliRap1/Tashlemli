import { db } from "@/lib/db/client";
import { magicLinkTokens } from "@/lib/db/schema/auth";
import { users } from "@/lib/db/schema/users";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";

const TTL_MS = 15 * 60 * 1000;

export type RequestInput = { email: string; ipHash: string };

export async function requestMagicLink({ email, ipHash }: RequestInput): Promise<{ token: string; userId: string }> {
  const rl = await rateLimit(`magic:${email}:${ipHash}`, 5, 600);
  if (!rl.ok) throw new AppError("MAGIC_RATE_LIMIT", "too many requests", 429);

  const [u] = await db
    .insert(users)
    .values({ email })
    .onConflictDoNothing()
    .returning({ id: users.id });
  const userId = u?.id ?? (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0]?.id;
  if (!userId) throw new AppError("MAGIC_USER_FAIL", "could not upsert user", 500);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest();
  await db.insert(magicLinkTokens).values({
    userId,
    tokenHash: tokenHash as any,
    channel: "email",
    expiresAt: new Date(Date.now() + TTL_MS),
    ipHash,
  });
  return { token, userId };
}

export type ConsumeInput = { token: string; ipHash: string };

// Scan window for timing-safe token lookup. Must exceed the realistic count
// of unexpired tokens at peak load; 500 gives ~8 hours of headroom at 1 req/min.
const CONSUME_SCAN_LIMIT = 500;

export async function consumeMagicLink({ token }: ConsumeInput): Promise<{ userId: string }> {
  const tokenHash = createHash("sha256").update(token).digest();
  const candidates = await db
    .select()
    .from(magicLinkTokens)
    .where(and(isNull(magicLinkTokens.consumedAt), gt(magicLinkTokens.expiresAt, new Date())))
    .limit(CONSUME_SCAN_LIMIT);

  let found: typeof candidates[number] | undefined;
  for (const row of candidates) {
    const stored = row.tokenHash as unknown as Buffer;
    if (stored.length === tokenHash.length && timingSafeEqual(stored, tokenHash)) {
      found = row;
      break;
    }
  }
  if (!found) throw new AppError("MAGIC_INVALID", "invalid or expired token", 401);

  // Atomic consumption: update only if still unconsumed. Protects against
  // concurrent requests replaying the same token.
  const updated = await db
    .update(magicLinkTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(magicLinkTokens.id, found.id), isNull(magicLinkTokens.consumedAt)))
    .returning({ id: magicLinkTokens.id });
  if (!updated[0]) throw new AppError("MAGIC_INVALID", "invalid or expired token", 401);

  return { userId: found.userId };
}
