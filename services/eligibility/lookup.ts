import { db } from "@/lib/db/client";
import { flights, type Flight } from "@/lib/db/schema/flights";
import { fetchFlight, type FetchedFlight } from "@/services/flights/aviationstack";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/errors";

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function lookupFlight(flightNumber: string, date: string): Promise<Flight> {
  const norm = flightNumber.replace(/\s+/g, "").toUpperCase();
  const [hit] = await db
    .select()
    .from(flights)
    .where(and(eq(flights.flightNumber, norm), eq(flights.date, date)))
    .limit(1);
  if (hit && Date.now() - new Date(hit.fetchedAt).getTime() < TTL_MS) return hit;

  let live: FetchedFlight;
  try {
    live = await fetchFlight(norm, date);
  } catch (e) {
    if (hit) return hit;
    throw e;
  }
  const row = {
    flightNumber: live.flight_number,
    date: live.date,
    airlineIata: live.airline_iata,
    departureIata: live.departure_iata,
    arrivalIata: live.arrival_iata,
    scheduledDep: live.scheduled_dep,
    actualDep: live.actual_dep,
    scheduledArr: live.scheduled_arr,
    actualArr: live.actual_arr,
    status: live.status,
    raw: live.raw,
  };
  const [inserted] = await db
    .insert(flights)
    .values(row)
    .onConflictDoUpdate({ target: [flights.flightNumber, flights.date], set: row })
    .returning();
  if (!inserted) throw new AppError("LOOKUP_DB_FAIL", "could not persist flight", 500);
  return inserted;
}

export function computeFacts(f: Flight): { delay_minutes: number; cancellation: boolean; distance_km: number } {
  const cancellation = f.status === "cancelled";
  const delay_minutes =
    f.actualArr && f.scheduledArr
      ? Math.max(0, Math.round((f.actualArr.getTime() - f.scheduledArr.getTime()) / 60000))
      : 0;
  return {
    delay_minutes,
    cancellation,
    distance_km: distanceFromIata(f.departureIata, f.arrivalIata),
  };
}

function distanceFromIata(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const M: Record<string, [number, number]> = {
    TLV: [32.0114, 34.8866],
    LCA: [34.875, 33.624],
    ATH: [37.937, 23.945],
    FRA: [50.037, 8.562],
    JFK: [40.6413, -73.7781],
    BKK: [13.69, 100.75],
    IST: [41.275, 28.751],
    AMS: [52.31, 4.7683],
    LHR: [51.47, -0.4543],
    CDG: [49.0097, 2.5479],
  };
  const p = M[a]; const q = M[b];
  if (!p || !q) throw new AppError("LOOKUP_UNKNOWN_ROUTE", `Unknown airport pair: ${a}-${b}`, 422);
  const R = 6371;
  const dLat = ((q[0] - p[0]) * Math.PI) / 180;
  const dLon = ((q[1] - p[1]) * Math.PI) / 180;
  const lat1 = (p[0] * Math.PI) / 180; const lat2 = (q[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}
