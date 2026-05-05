import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema/auth";
import { users } from "@/lib/db/schema/users";
import { and, eq, gt, isNull } from "drizzle-orm";
import { signSession, verifySession } from "@/lib/jwt/session-token";
import { AppError } from "@/lib/errors";

export const COOKIE_NAME = "tshl_session";
const TTL_DAYS = 14;

export async function createSession(userId: string, ipHash: string, userAgent: string | null) {
  const [row] = await db.insert(sessions).values({
    userId,
    expiresAt: new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000),
    ipHash,
    userAgent,
  }).returning();
  if (!row) throw new AppError("SESSION_DB_FAIL", "could not create session", 500);
  return { sid: row.id, jwt: await signSession(row.id, userId, { ttlSeconds: TTL_DAYS * 24 * 60 * 60 }) };
}

export async function getCurrentUser(cookieValue: string | undefined) {
  if (!cookieValue) return null;
  let payload: { sid: string; uid: string };
  try { payload = await verifySession(cookieValue); } catch { return null; }
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, payload.sid), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || row.userId !== payload.uid) return null;
  const [u] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  return u ?? null;
}

export async function revokeSession(sid: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sid));
}
