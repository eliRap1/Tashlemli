import { db } from "@/lib/db/client";
import { eligibilityJobs } from "@/lib/db/schema/eligibility-jobs";
import { flights } from "@/lib/db/schema/flights";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { signClaimToken } from "@/lib/jwt/claim-token";
import { AppError } from "@/lib/errors";
import { randomUUID } from "node:crypto";

export async function promoteJobToClaim(jobId: string, contact: { email?: string; phone?: string }) {
  const [job] = await db.select().from(eligibilityJobs).where(eq(eligibilityJobs.id, jobId)).limit(1);
  if (!job) throw new AppError("PROMOTE_NO_JOB", "job not found", 404);
  if (job.status !== "ready" || !job.result) throw new AppError("PROMOTE_NOT_READY", "job not ready", 409);
  if (job.claimId) {
    const [existing] = await db.select().from(claims).where(eq(claims.id, job.claimId)).limit(1);
    if (existing) return existing;
  }
  const extracted = job.extracted as any;
  const result = job.result as any;
  if (!result.eligible) throw new AppError("PROMOTE_INELIGIBLE", "claim is not eligible", 422);

  // ComputeResult has no airline_iata field.  Derive it from the flight row
  // that was persisted by the runner (job.flightId is set after lookupFlight).
  const [flightRow] = job.flightId
    ? await db.select({ airlineIata: flights.airlineIata }).from(flights).where(eq(flights.id, job.flightId)).limit(1)
    : [undefined];

  let userId: string | undefined;
  if (contact.email || contact.phone) {
    const [u] = await db
      .insert(users)
      .values({ email: contact.email, phone: contact.phone, language: "he" })
      .onConflictDoNothing()
      .returning({ id: users.id });
    userId = u?.id ?? (
      contact.email
        ? (await db.select({ id: users.id }).from(users).where(eq(users.email, contact.email)).limit(1))[0]?.id
        : (await db.select({ id: users.id }).from(users).where(eq(users.phone, contact.phone!)).limit(1))[0]?.id
    );
  }

  const newClaim = {
    userId,
    flightId: job.flightId ?? undefined,
    airlineIata: flightRow?.airlineIata ?? null,
    jurisdiction: result.jurisdiction ?? "BOTH",
    reasonCategory: extracted?.incident_hint ?? "unknown",
    amountIls: result.amount_ils as number,
    passengerName: extracted?.passenger_name ?? "passenger",
    contactEmail: contact.email,
    contactPhone: contact.phone,
    claimToken: `pending:${randomUUID()}`,
    source: "file_to_claim",
  } as const;

  const [inserted] = await db.insert(claims).values(newClaim).returning();
  if (!inserted) throw new AppError("PROMOTE_DB_FAIL", "could not create claim", 500);
  const token = await signClaimToken(inserted.id);
  const [withToken] = await db.update(claims).set({ claimToken: token }).where(eq(claims.id, inserted.id)).returning();
  if (!withToken) throw new AppError("PROMOTE_TOKEN_FAIL", "could not persist claim token", 500);

  await db.update(eligibilityJobs).set({ claimId: inserted.id }).where(eq(eligibilityJobs.id, jobId));
  await db.insert(claimEvents).values({
    claimId: inserted.id,
    code: "intake.received",
    actor: "system",
    labelHe: "תיק התקבל",
    labelEn: "Claim received",
    metadata: { from_job: jobId },
  });
  return withToken;
}
