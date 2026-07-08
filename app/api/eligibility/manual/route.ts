import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { eligibilityJobs } from "@/lib/db/schema/eligibility-jobs";
import { eq } from "drizzle-orm";
import { hashIp } from "@/lib/hash";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

// IATA airline codes can include digits (U2 = easyJet, LS = Jet2, 4U = Germanwings).
const Body = z.object({
  flight_number: z.string().regex(/^[A-Z0-9]{2,3}\s?\d{1,4}$/i),
  departure_date: z.string().date(),
  delay_minutes: z.number().int().min(0).max(72 * 60).optional(),
  cancellation: z.boolean().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // Mirror the guard pattern used in the upload route: rate-limit and bot-check
  // before touching AviationStack (100 req/month free quota) or the DB.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ipHash = await hashIp(ip);
  const rl = await rateLimit(`manual:${ipHash}`, 10, 3600);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  const turnstile = typeof raw?.turnstile === "string" ? raw.turnstile : "";
  if (!(await verifyTurnstile(turnstile, ip))) return NextResponse.json({ error: "bot" }, { status: 403 });

  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  const [job] = await db.insert(eligibilityJobs).values({
    blobKey: "manual://no-file",
    blobSha256: "manual-" + Math.random().toString(36).slice(2),
    ipHash,
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

  // Run the pipeline inline. The manual flow is fast enough to complete within a
  // single function invocation; we return the result directly so the client can
  // jump straight to the reveal stage without depending on SSE delivery.
  const { lookupFlight, computeFacts } = await import("@/services/eligibility/lookup");
  const { compute } = await import("@/services/eligibility/engine");
  const { publishJobEvent } = await import("@/services/eligibility/publish");
  try {
    const flight = await lookupFlight(parsed.data.flight_number, parsed.data.departure_date);
    const facts = computeFacts(flight);
    const result = compute({
      distance_km: facts.distance_km,
      delay_minutes: parsed.data.delay_minutes ?? facts.delay_minutes,
      cancellation: parsed.data.cancellation ?? facts.cancellation,
      jurisdiction: flight.airlineIata === "LY" ? "BOTH" : "EU261",
      reason_category: "unknown",
      flight_date: parsed.data.departure_date,
    });
    await db.update(eligibilityJobs).set({ status: "ready", flightId: flight.id, result }).where(eq(eligibilityJobs.id, job.id));
    const route = `${flight.departureIata ?? "TLV"} → ${flight.arrivalIata ?? "?"}`;
    await publishJobEvent(job.id, { kind: "ready", result, passenger: "passenger", flight: parsed.data.flight_number, route });
    return NextResponse.json({
      jobId: job.id,
      sseUrl: `/api/eligibility/${job.id}/sse`,
      result,
      passenger: "passenger",
      flight: parsed.data.flight_number,
      route,
    });
  } catch (e: any) {
    const code = e.code ?? "MANUAL_FAIL";
    const message = e.message ?? "fail";
    await db.update(eligibilityJobs).set({ status: "failed", failureCode: code }).where(eq(eligibilityJobs.id, job.id));
    await publishJobEvent(job.id, { kind: "failed", code, message });
    return NextResponse.json({ jobId: job.id, error: code, message }, { status: 502 });
  }
}
