import { describe, expect, it, vi } from "vitest";

const sessionRow = { id: "sid1", userId: "u1", revokedAt: null, expiresAt: new Date(Date.now() + 86400e3) };
const user = { id: "u1", email: "noa@example.com" };

vi.mock("@/lib/db/client", () => ({
  db: {
    insert: () => ({ values: () => ({ returning: async () => [sessionRow] }) }),
    select: () => ({ from: (_t: any) => ({ where: () => ({ limit: async () => [sessionRow] }) }) }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  },
}));

describe("session", () => {
  it("createSession returns sid + jwt", async () => {
    const { createSession } = await import("@/services/auth/session");
    const r = await createSession("u1", "ip", "ua");
    expect(r.sid).toBe("sid1");
    expect(typeof r.jwt).toBe("string");
  });
});
