import { describe, expect, it } from "vitest";

describe("session token", () => {
  it("round-trips sid + uid", async () => {
    const { signSession, verifySession } = await import("@/lib/jwt/session-token");
    const t = await signSession("sid-1", "uid-1");
    const out = await verifySession(t);
    expect(out).toEqual({ sid: "sid-1", uid: "uid-1" });
  });
});
