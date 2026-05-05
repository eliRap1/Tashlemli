import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/inbound/classifier", () => ({
  classifyReply: vi.fn(async () => ({
    intent: "settlement_offered", is_automated: false, offered_amount_ils: 2100, offered_currency: "ILS", deadline_for_us: null, requires_lawyer: true, summary_he: "הצעה ₪2,100",
  })),
}));
vi.mock("@/services/inbound/match", () => ({
  matchClaim: vi.fn(async () => "00000000-0000-0000-0000-000000000099"),
}));

const inserts: any[] = [];
vi.mock("@/lib/db/client", () => ({
  db: {
    insert: () => ({ values: async (v: any) => { inserts.push(v); return [v]; } }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
  },
}));

describe("airline-mailbox webhook", () => {
  it("classifies and inserts settlement.offered", async () => {
    const { POST } = await import("@/app/api/webhooks/airline-mailbox/route");
    const req = new Request("http://x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: { email: "claims@lh.com" }, to: [{ email: "claims+abc@in.tashlemli.co.il" }], subject: "Re: …", text: "We offer 2100 ILS." }),
    });
    const r = await POST(req);
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.code).toBe("settlement.offered");
    expect(inserts.find((i) => i.code === "settlement.offered")).toBeTruthy();
  });
});
