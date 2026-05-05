import { describe, expect, it } from "vitest";

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
