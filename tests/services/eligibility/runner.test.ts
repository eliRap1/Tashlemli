import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/eligibility/extract", () => ({
  extractFromImage: vi.fn(async () => ({
    flight_number: "LY 381",
    departure_date: "2026-04-01",
    origin_iata: "TLV",
    destination_iata: "ATH",
    passenger_name: "NOA COHEN",
    booking_ref: null,
    airline_name: "EL AL",
    delay_minutes_from_doc: null,
    incident_hint: "delay",
    confidence: 0.92,
  })),
}));

vi.mock("@/services/eligibility/lookup", () => ({
  lookupFlight: vi.fn(async () => ({
    id: "00000000-0000-0000-0000-000000000010",
    flightNumber: "LY381",
    date: "2026-04-01",
    airlineIata: "LY",
    departureIata: "TLV",
    arrivalIata: "ATH",
    scheduledArr: new Date("2026-04-01T17:30:00Z"),
    actualArr: new Date("2026-04-01T23:30:00Z"),
    status: "delayed",
    raw: {},
    fetchedAt: new Date(),
  })),
  computeFacts: vi.fn(() => ({ delay_minutes: 360, cancellation: false, distance_km: 1500 })),
}));

const publishCalls: any[] = [];
vi.mock("@/services/eligibility/publish", () => ({
  publishJobEvent: vi.fn(async (_jid: string, ev: any) => { publishCalls.push(ev); }),
}));

const updateMock = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn(async () => undefined) }) });
vi.mock("@/lib/db/client", () => ({
  db: { update: updateMock },
}));

describe("runJob", () => {
  it("emits extracting → extracted → looked_up → ready", async () => {
    const { runJob } = await import("@/services/eligibility/runner");
    await runJob("00000000-0000-0000-0000-000000000001", Buffer.from([1]), "image/jpeg");
    const kinds = publishCalls.map((e) => e.kind);
    expect(kinds).toEqual(["extracting", "extracted", "looked_up", "ready"]);
    const ready = publishCalls.find((e) => e.kind === "ready");
    expect(ready.result.eligible).toBe(true);
    expect(ready.passenger).toBe("NOA COHEN");
  });
});
