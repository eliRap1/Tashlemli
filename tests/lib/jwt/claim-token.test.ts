import { describe, expect, it, beforeAll } from "vitest";

beforeAll(() => {
  process.env.JWT_CLAIM_SECRET = "x".repeat(32);
  process.env.JWT_SESSION_SECRET = "y".repeat(32);
  process.env.DATABASE_URL = "postgres://u:p@h/db";
  process.env.AI_GATEWAY_API_KEY = "k";
  process.env.AI_GATEWAY_BASE_URL = "https://gw/v1";
  process.env.RESEND_API_KEY = "r";
  process.env.RESEND_FROM = "x@x";
  process.env.BLOB_READ_WRITE_TOKEN = "t";
  process.env.AVIATIONSTACK_KEY = "k";
  process.env.UPSTASH_REDIS_REST_URL = "https://r";
  process.env.UPSTASH_REDIS_REST_TOKEN = "t";
  process.env.APP_BASE_URL = "https://x";
});

describe("claim token", () => {
  it("round-trips a claim_id", async () => {
    const { signClaimToken, verifyClaimToken } = await import("@/lib/jwt/claim-token");
    const t = await signClaimToken("00000000-0000-0000-0000-000000000001");
    const out = await verifyClaimToken(t);
    expect(out.claim_id).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("rejects tampered token", async () => {
    const { signClaimToken, verifyClaimToken } = await import("@/lib/jwt/claim-token");
    const t = await signClaimToken("00000000-0000-0000-0000-000000000001");
    await expect(verifyClaimToken(t + "x")).rejects.toThrow();
  });

  it("rejects expired token", async () => {
    const { signClaimToken, verifyClaimToken } = await import("@/lib/jwt/claim-token");
    const t = await signClaimToken("00000000-0000-0000-0000-000000000001", { ttlSeconds: -1 });
    await expect(verifyClaimToken(t)).rejects.toThrow();
  });
});
