import { describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(async () => ({
    object: {
      subject_he: "דרישת פיצוי – טיסה LY 0381",
      subject_en: "Demand for Compensation – Flight LY 0381",
      letterhead: { firm: "T", lawyer: "L", bar_license: "78214", address: "TLV", phone: "+972", email: "l@x.co.il" },
      facts_paragraph_he: "ב-1 באפריל…",
      facts_paragraph_en: "On 1 April…",
      legal_grounds: [{ citation: "EU 261/2004", article: "art.7(1)(b)", jurisdiction: "EU261", applied_to_facts_he: "x", applied_to_facts_en: "x" }],
      demand_amount_ils: 2450,
      deadline_iso: "2026-05-30",
      payment_terms_he: "x", payment_terms_en: "x",
      sign_off_he: "בכבוד רב", sign_off_en: "Sincerely",
    },
  })),
}));

describe("generateLetter", () => {
  it("returns a parsed letter", async () => {
    const { generateLetter } = await import("@/services/letters/generator");
    const out = await generateLetter({
      passenger_name: "Noa Cohen",
      flight_number: "LY 0381",
      flight_date: "2026-04-01",
      origin_iata: "TLV",
      destination_iata: "ATH",
      airline_name: "EL AL",
      amount_ils: 2450,
      jurisdiction: "EU261",
      grounds: ["EU 261 art.7(1)(b)"],
      rationale_he: "x",
      reason_category: "carrier_fault",
      lawyer: { firm: "T", name: "L", bar_license: "78214", address: "TLV", phone: "+972", email: "l@x.co.il" },
    });
    expect(out.demand_amount_ils).toBe(2450);
  });
});
