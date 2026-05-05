import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export type FetchedFlight = {
  flight_number: string;
  date: string;
  status: string;
  airline_iata: string | null;
  departure_iata: string | null;
  arrival_iata: string | null;
  scheduled_dep: Date | null;
  actual_dep: Date | null;
  scheduled_arr: Date | null;
  actual_arr: Date | null;
  raw: unknown;
};

function toDate(s: string | null | undefined): Date | null {
  return s ? new Date(s) : null;
}

function isStubKey(): boolean {
  const k = env.AVIATIONSTACK_KEY;
  return !k || k === "build_placeholder" || k === "local_stub" || k.startsWith("stub");
}

const ROUTES: Record<string, { dep: string; arr: string; airline: string }> = {
  LY381:  { dep: "TLV", arr: "ATH", airline: "LY" },
  LY343:  { dep: "TLV", arr: "LCA", airline: "LY" },
  LH686:  { dep: "TLV", arr: "FRA", airline: "LH" },
  LH1812: { dep: "TLV", arr: "FRA", airline: "LH" },
  U28123: { dep: "TLV", arr: "ATH", airline: "U2" },
  TK785:  { dep: "TLV", arr: "IST", airline: "TK" },
  AF1521: { dep: "TLV", arr: "CDG", airline: "AF" },
  BA164:  { dep: "TLV", arr: "LHR", airline: "BA" },
};

function stubFor(flightNumber: string, date: string): FetchedFlight {
  const norm = flightNumber.replace(/\s+/g, "").toUpperCase();
  const meta = ROUTES[norm] ?? { dep: "TLV", arr: "ATH", airline: norm.slice(0, 2) };
  // Deterministic delay derived from the flight code so the demo is repeatable.
  const seed = [...norm].reduce((s, c) => s + c.charCodeAt(0), 0);
  const delayMin = 180 + (seed % 360); // between 3h and 9h
  const cancelled = seed % 13 === 0;
  const sched = new Date(`${date}T08:00:00Z`);
  const arrSched = new Date(sched.getTime() + 3 * 3600_000);
  const arrActual = cancelled ? null : new Date(arrSched.getTime() + delayMin * 60_000);
  return {
    flight_number: norm,
    date,
    status: cancelled ? "cancelled" : "delayed",
    airline_iata: meta.airline,
    departure_iata: meta.dep,
    arrival_iata: meta.arr,
    scheduled_dep: sched,
    actual_dep: cancelled ? null : new Date(sched.getTime() + delayMin * 60_000),
    scheduled_arr: arrSched,
    actual_arr: arrActual,
    raw: { stub: true, delay_minutes: delayMin },
  };
}

export async function fetchFlight(flightNumber: string, date: string): Promise<FetchedFlight> {
  // POC: when AviationStack key is missing or a placeholder, return synthetic data so
  // the demo flow works end-to-end without a paid API. Replace with real data the
  // moment a key is set on Vercel.
  if (isStubKey()) return stubFor(flightNumber, date);

  const url = new URL("https://api.aviationstack.com/v1/flights");
  url.searchParams.set("access_key", env.AVIATIONSTACK_KEY);
  url.searchParams.set("flight_iata", flightNumber.replace(/\s+/g, ""));
  url.searchParams.set("flight_date", date);
  url.searchParams.set("limit", "1");

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new AppError("AVIATIONSTACK_HTTP", `AviationStack ${r.status}`, 502);
  const json = (await r.json()) as { data: any[] };
  if (!json.data?.length) {
    throw new AppError("AVIATIONSTACK_NOT_FOUND", `Flight ${flightNumber} on ${date} not found`, 404);
  }
  const f = json.data[0];
  return {
    flight_number: f.flight?.iata ?? flightNumber,
    date,
    status: f.flight_status ?? "unknown",
    airline_iata: f.airline?.iata ?? null,
    departure_iata: f.departure?.iata ?? null,
    arrival_iata: f.arrival?.iata ?? null,
    scheduled_dep: toDate(f.departure?.scheduled),
    actual_dep: toDate(f.departure?.actual),
    scheduled_arr: toDate(f.arrival?.scheduled),
    actual_arr: toDate(f.arrival?.actual),
    raw: f,
  };
}
