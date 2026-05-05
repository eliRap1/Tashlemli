import { describe, expect, it, vi } from "vitest";

const job = {
  id: "00000000-0000-0000-0000-000000000001",
  status: "ready",
  extracted: { passenger_name: "NOA COHEN", incident_hint: "delay" },
  result: { eligible: true, amount_ils: 2450, jurisdiction: "BOTH" },
  flightId: "00000000-0000-0000-0000-000000000010",
  blobKey: "x", blobSha256: "x", ipHash: "x",
} as any;

let userId: string | undefined = "00000000-0000-0000-0000-0000000000aa";
let inserted: any;

vi.mock("@/lib/db/client", () => {
  const select = () => ({ from: () => ({ where: () => ({ limit: async () => [job] }) }) });
  const insert = (_table: any) => ({
    values: (vals: any) => ({
      onConflictDoNothing: () => ({ returning: async () => [{ id: userId }] }),
      returning: async () => {
        inserted = { ...vals, id: "00000000-0000-0000-0000-000000000099", claimToken: "tmp" };
        return [inserted];
      },
    }),
  });
  const update = () => ({ set: (_v: any) => ({ where: () => ({ returning: async () => [{ ...inserted, claimToken: "JWT" }] }) }) });
  return { db: { select, insert, update } };
});

vi.mock("@/lib/jwt/claim-token", () => ({ signClaimToken: vi.fn(async () => "JWT") }));

describe("POST /api/eligibility/:jobId/claim", () => {
  it("creates a claim from a ready job", async () => {
    const { POST } = await import("@/app/api/eligibility/[jobId]/claim/route");
    const req = new Request("http://x", { method: "POST", body: JSON.stringify({ email: "noa@example.com" }), headers: { "content-type": "application/json" } });
    const r = await POST(req, { params: Promise.resolve({ jobId: "00000000-0000-0000-0000-000000000001" }) });
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.claim_token).toBe("JWT");
    expect(j.tracker_url).toMatch(/^\/claim\//);
  });
});
