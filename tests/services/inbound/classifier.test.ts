import { describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(async () => ({
    object: {
      intent: "settlement_offered",
      is_automated: false,
      offered_amount_ils: 2100,
      offered_currency: "ILS",
      deadline_for_us: null,
      requires_lawyer: true,
      summary_he: "החברה מציעה ₪2,100 כפשרה.",
    },
  })),
}));

describe("classifyReply", () => {
  it("returns settlement_offered with parsed amount", async () => {
    const { classifyReply } = await import("@/services/inbound/classifier");
    const r = await classifyReply({ from: "claims@lh.com", subject: "Re: …", body: "We offer 2100 ILS as goodwill." });
    expect(r.intent).toBe("settlement_offered");
    expect(r.offered_amount_ils).toBe(2100);
  });
});
