import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn(async () => true) }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(async () => ({ ok: true, remaining: 4 })) }));
vi.mock("sharp", () => ({ default: () => ({ rotate: () => ({ jpeg: () => ({ toBuffer: async () => Buffer.from([1, 2, 3]) }) }) }) }));
vi.mock("@/lib/blob/client", () => ({ putPublic: vi.fn(async (k: string) => ({ url: `https://blob/${k}` })) }));
vi.mock("@/services/eligibility/runner", () => ({ runJob: vi.fn(async () => undefined) }));
vi.mock("@/services/eligibility/publish", () => ({ publishJobEvent: vi.fn(async () => undefined) }));

const insertReturning = vi.fn(async () => [{ id: "00000000-0000-0000-0000-000000000099" }]);
const dbMock = {
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
  insert: () => ({ values: () => ({ returning: insertReturning }) }),
};
vi.mock("@/lib/db/client", () => ({ db: dbMock }));

describe("POST /api/eligibility/upload", () => {
  it("returns jobId and sseUrl on a valid jpeg", async () => {
    const fd = new FormData();
    fd.set("file", new File([Buffer.from([1])], "bp.jpg", { type: "image/jpeg" }));
    fd.set("turnstile", "ok");
    const req = new Request("http://localhost/api/eligibility/upload", { method: "POST", body: fd });
    const { POST } = await import("@/app/api/eligibility/upload/route");
    const r = await POST(req);
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.jobId).toMatch(/^[0-9a-f-]{36}$/);
    expect(j.sseUrl).toContain("/sse");
  });
});
