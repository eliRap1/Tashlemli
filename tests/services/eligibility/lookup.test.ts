import { describe, expect, it } from "vitest";
import { computeFacts } from "@/services/eligibility/lookup";

describe("computeFacts", () => {
  it("computes delay from scheduled vs actual arrival", () => {
    const f = {
      id: "x", flightNumber: "LY381", date: "2026-04-01",
      airlineIata: "LY", departureIata: "TLV", arrivalIata: "ATH",
      scheduledDep: null, actualDep: null,
      scheduledArr: new Date("2026-04-01T17:30:00Z"),
      actualArr: new Date("2026-04-01T23:30:00Z"),
      status: "delayed", raw: {}, fetchedAt: new Date(),
    } as any;
    const r = computeFacts(f);
    expect(r.delay_minutes).toBe(360);
    expect(r.cancellation).toBe(false);
    expect(r.distance_km).toBeGreaterThan(1000);
  });
  it("flags cancellation", () => {
    const r = computeFacts({ ...(stub("LY381")), status: "cancelled" } as any);
    expect(r.cancellation).toBe(true);
  });
});

function stub(fn: string) {
  return { id: "x", flightNumber: fn, date: "2026-01-01", airlineIata: null, departureIata: "TLV", arrivalIata: "ATH", scheduledDep: null, actualDep: null, scheduledArr: null, actualArr: null, status: "on-time", raw: {}, fetchedAt: new Date() };
}
