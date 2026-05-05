import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const ISSUER = "tashlemli";
const AUDIENCE = "tashlemli:claim";
const DEFAULT_TTL = 60 * 60 * 24 * 90;

let cachedKey: Uint8Array | null = null;
function key() {
  if (!cachedKey) cachedKey = new TextEncoder().encode(env.JWT_CLAIM_SECRET);
  return cachedKey;
}

export async function signClaimToken(claimId: string, opts?: { ttlSeconds?: number }) {
  const ttl = opts?.ttlSeconds ?? DEFAULT_TTL;
  return await new SignJWT({ claim_id: claimId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(claimId)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(key());
}

export async function verifyClaimToken(token: string): Promise<{ claim_id: string }> {
  const { payload } = await jwtVerify(token, key(), { issuer: ISSUER, audience: AUDIENCE });
  if (typeof payload.claim_id !== "string") throw new Error("claim_id missing");
  return { claim_id: payload.claim_id };
}
