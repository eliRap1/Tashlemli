import { db } from "@/lib/db/client";
import { eligibilityJobs } from "@/lib/db/schema/eligibility-jobs";
import { eq } from "drizzle-orm";
import { extractFromImage } from "./extract";
import { lookupFlight, computeFacts } from "./lookup";
import { compute } from "./engine";
import { publishJobEvent } from "./publish";
import type { Extracted } from "./types";
import { AppError } from "@/lib/errors";

async function setStatus(jobId: string, status: string, patch: Partial<typeof eligibilityJobs.$inferInsert> = {}) {
  await db.update(eligibilityJobs).set({ status, updatedAt: new Date(), ...patch }).where(eq(eligibilityJobs.id, jobId));
}

export async function runJob(jobId: string, fileBytes: Buffer, contentType: string) {
  try {
    await setStatus(jobId, "extracting");
    await publishJobEvent(jobId, { kind: "extracting" });
    const extracted: Extracted = await extractFromImage(fileBytes, contentType);
    await setStatus(jobId, "looking_up", { extracted });
    await publishJobEvent(jobId, { kind: "extracted", extracted });

    const flight = await lookupFlight(extracted.flight_number, extracted.departure_date);
    await setStatus(jobId, "computing", { flightId: flight.id });
    await publishJobEvent(jobId, { kind: "looked_up", flight_id: flight.id });

    const facts = computeFacts(flight);
    const result = compute({
      distance_km: facts.distance_km,
      delay_minutes: facts.delay_minutes,
      cancellation: facts.cancellation,
      jurisdiction: flight.airlineIata === "LY" ? "BOTH" : "EU261",
      reason_category: extracted.incident_hint === "cancellation" ? "carrier_fault" : "unknown",
      flight_date: extracted.departure_date,
    });

    await setStatus(jobId, "ready", { result });
    await publishJobEvent(jobId, {
      kind: "ready",
      result,
      passenger: extracted.passenger_name ?? "passenger",
      flight: extracted.flight_number,
      route: `${extracted.origin_iata} → ${extracted.destination_iata}`,
    });
  } catch (e) {
    const err = e instanceof AppError ? e : new AppError("RUNNER_FAIL", String((e as Error).message ?? e), 500);
    await setStatus(jobId, "failed", { failureCode: err.code });
    await publishJobEvent(jobId, { kind: "failed", code: err.code, message: err.message });
  }
}
