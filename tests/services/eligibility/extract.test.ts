import { describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(async () => ({
    object: {
      flight_number: "LY 381",
      departure_date: "2026-04-01",
      origin_iata: "TLV",
      destination_iata: "ATH",
      passenger_name: "NOA COHEN",
      booking_ref: "ABCDEF",
      airline_name: "EL AL",
      delay_minutes_from_doc: null,
      incident_hint: "delay",
      confidence: 0.91,
    },
  })),
}));

describe("extractFromImage", () => {
  it("returns parsed object on confidence ≥ 0.6", async () => {
    const { extractFromImage } = await import("@/services/eligibility/extract");
    const out = await extractFromImage(Buffer.from([1, 2, 3]), "image/jpeg");
    expect(out.flight_number).toBe("LY 381");
    expect(out.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it("rejects low confidence", async () => {
    const { generateObject } = await import("ai");
    vi.mocked(generateObject).mockResolvedValueOnce({ object: { ...(await mockObj()), confidence: 0.4 } } as any);
    const { extractFromImage } = await import("@/services/eligibility/extract");
    await expect(extractFromImage(Buffer.from([1]), "image/jpeg")).rejects.toThrow(/below threshold 0\.6/);
  });
});

async function mockObj() {
  return {
    flight_number: "LY 381",
    departure_date: "2026-04-01",
    origin_iata: "TLV",
    destination_iata: "ATH",
    passenger_name: null,
    booking_ref: null,
    airline_name: null,
    delay_minutes_from_doc: null,
    incident_hint: "unknown" as const,
  };
}
