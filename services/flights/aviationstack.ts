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

export async function fetchFlight(flightNumber: string, date: string): Promise<FetchedFlight> {
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
