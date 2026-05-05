import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { eligibilityJobs } from "@/lib/db/schema/eligibility-jobs";
import { eq } from "drizzle-orm";
import { hashIp } from "@/lib/hash";

const Body = z.object({
  flight_number: z.string().regex(/^[A-Z]{2,3}\s?\d{1,4}$/i),
  departure_date: z.string().date(),
  delay_minutes: z.number().int().min(0).max(72 * 60).optional(),
  cancellation: z.boolean().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";

  const [job] = await db.insert(eligibilityJobs).values({
    blobKey: "manual://no-file",
    blobSha256: "manual-" + Math.random().toString(36).slice(2),
    ipHash: await hashIp(ip),
    status: "queued",
    extracted: {
      flight_number: parsed.data.flight_number.toUpperCase().replace(/\s+/g, ""),
      departure_date: parsed.data.departure_date,
      origin_iata: "TLV", destination_iata: "ATH",
      passenger_name: null, booking_ref: null, airline_name: null,
      delay_minutes_from_doc: parsed.data.delay_minutes ?? null,
      incident_hint: parsed.data.cancellation ? "cancellation" : "delay",
      confidence: 1.0,
    },
  }).returning();
  if (!job) return NextResponse.json({ error: "db_fail" }, { status: 500 });

  // Run the pipeline inline so Vercel Functions does not kill the work after the
  // response. Steps are fast (cached flight lookup + pure compute) so this is well
  // within the function timeout.
  const { lookupFlight, computeFacts } = await import("@/services/eligibility/lookup");
  const { compute } = await import("@/services/eligibility/engine");
  const { publishJobEvent } = await import("@/services/eligibility/publish");
  try {
    await publishJobEvent(job.id, { kind: "looking_up" });
    const flight = await lookupFlight(parsed.data.flight_number, parsed.data.departure_date);
    const facts = computeFacts(flight);
    await publishJobEvent(job.id, { kind: "looked_up", flight_id: flight.id });
    await publishJobEvent(job.id, { kind: "computing" });
    const result = compute({
      distance_km: facts.distance_km,
      delay_minutes: parsed.data.delay_minutes ?? facts.delay_minutes,
      cancellation: parsed.data.cancellation ?? facts.cancellation,
      jurisdiction: flight.airlineIata === "LY" ? "BOTH" : "EU261",
      reason_category: "unknown",
      flight_date: parsed.data.departure_date,
    });
    await db.update(eligibilityJobs).set({ status: "ready", flightId: flight.id, result }).where(eq(eligibilityJobs.id, job.id));
    await publishJobEvent(job.id, {
      kind: "ready",
      result,
      passenger: "passenger",
      flight: parsed.data.flight_number,
      route: `${flight.departureIata ?? "TLV"} → ${flight.arrivalIata ?? "?"}`,
    });
  } catch (e: any) {
    await db.update(eligibilityJobs).set({ status: "failed", failureCode: e.code ?? "MANUAL_FAIL" }).where(eq(eligibilityJobs.id, job.id));
    await publishJobEvent(job.id, { kind: "failed", code: e.code ?? "MANUAL_FAIL", message: e.message ?? "fail" });
  }

  return NextResponse.json({ jobId: job.id, sseUrl: `/api/eligibility/${job.id}/sse` });
}
