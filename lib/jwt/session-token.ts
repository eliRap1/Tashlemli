import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const ISSUER = "tashlemli";
const AUDIENCE = "tashlemli:session";
const DEFAULT_TTL = 60 * 60 * 24 * 14;

let cachedKey: Uint8Array | null = null;
function key() {
  if (!cachedKey) cachedKey = new TextEncoder().encode(env.JWT_SESSION_SECRET);
  return cachedKey;
}

export async function signSession(sid: string, userId: string, opts?: { ttlSeconds?: number }) {
  const ttl = opts?.ttlSeconds ?? DEFAULT_TTL;
  return await new SignJWT({ sid, uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(sid)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(key());
}

export async function verifySession(token: string): Promise<{ sid: string; uid: string }> {
  const { payload } = await jwtVerify(token, key(), { issuer: ISSUER, audience: AUDIENCE });
  if (typeof payload.sid !== "string" || typeof payload.uid !== "string") {
    throw new Error("session payload invalid");
  }
  return { sid: payload.sid, uid: payload.uid };
}
