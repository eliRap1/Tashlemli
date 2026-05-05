import { describe, expect, it, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("aviationstack adapter", () => {
  it("hits live endpoint and parses fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                flight_date: "2026-04-01",
                flight_status: "delayed",
                flight: { iata: "LY381" },
                airline: { iata: "LY" },
                departure: { iata: "TLV", scheduled: "2026-04-01T14:00:00+00:00", actual: "2026-04-01T20:12:00+00:00" },
                arrival: { iata: "ATH", scheduled: "2026-04-01T17:30:00+00:00", actual: "2026-04-01T23:30:00+00:00" },
              },
            ],
          }),
        ),
      ),
    );
    const { fetchFlight } = await import("@/services/flights/aviationstack");
    const out = await fetchFlight("LY381", "2026-04-01");
    expect(out.status).toBe("delayed");
    expect(out.airline_iata).toBe("LY");
    expect(out.departure_iata).toBe("TLV");
    expect(out.actual_dep).toEqual(new Date("2026-04-01T20:12:00+00:00"));
  });

  it("throws when no data returned", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: [] }))));
    const { fetchFlight } = await import("@/services/flights/aviationstack");
    await expect(fetchFlight("LY999", "2026-04-01")).rejects.toThrow(/not found/i);
  });
});
