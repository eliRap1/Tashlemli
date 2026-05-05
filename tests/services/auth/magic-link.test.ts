import { describe, expect, it, vi, beforeEach } from "vitest";

const dbState = { tokens: [] as any[] };

vi.mock("@/lib/db/client", () => {
  const mockDb = {
    insert: (_table: any) => ({
      values: (vals: any) => {
        const builder = {
          onConflictDoNothing: () => ({
            returning: async () => [],
          }),
          returning: async () => {
            const row = { ...vals, id: "tok1" };
            dbState.tokens.push(row);
            return [row];
          },
          then: (resolve: any, reject: any) => {
            dbState.tokens.push({ ...vals, id: "tok1" });
            return Promise.resolve(undefined).then(resolve, reject);
          },
        };
        return builder;
      },
    }),
    select: (_fields?: any) => ({
      from: (_table: any) => ({
        where: (_cond: any) => ({
          limit: async () => [{ id: "u1" }],
        }),
      }),
    }),
    update: (_table: any) => ({
      set: (_vals: any) => ({
        where: async () => undefined,
      }),
    }),
  };
  return { db: mockDb };
});

vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(async () => ({ ok: true, remaining: 4 })) }));

beforeEach(() => {
  dbState.tokens = [];
  vi.resetModules();
});

describe("magic-link", () => {
  it("requestMagicLink stores hash and returns token", async () => {
    const { requestMagicLink } = await import("@/services/auth/magic-link");
    const { token } = await requestMagicLink({ email: "noa@example.com", ipHash: "ip" });
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(dbState.tokens[0].tokenHash).toBeInstanceOf(Buffer);
  });

  it("throws MAGIC_RATE_LIMIT when rate limit exceeded", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0 });
    const { requestMagicLink } = await import("@/services/auth/magic-link");
    await expect(requestMagicLink({ email: "noa@example.com", ipHash: "ip" })).rejects.toMatchObject({ code: "MAGIC_RATE_LIMIT" });
  });
});
