import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { flights } from "./flights";
import { claims } from "./claims";

export const eligibilityJobs = pgTable(
  "eligibility_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blobKey: text("blob_key").notNull(),
    blobSha256: text("blob_sha256").notNull(),
    ipHash: text("ip_hash").notNull(),
    status: text("status").notNull(),
    extracted: jsonb("extracted"),
    flightId: uuid("flight_id").references(() => flights.id),
    result: jsonb("result"),
    failureCode: text("failure_code"),
    claimId: uuid("claim_id").references(() => claims.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ statusIdx: index("ej_status_updated_idx").on(t.status, t.updatedAt) }),
);

export type EligibilityJob = typeof eligibilityJobs.$inferSelect;
export type NewEligibilityJob = typeof eligibilityJobs.$inferInsert;
