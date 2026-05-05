import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { eligibilityJobs } from "./eligibility-jobs";

export const jobEvents = pgTable(
  "job_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").notNull().references(() => eligibilityJobs.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    payload: jsonb("payload"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ jobIdx: index("job_events_job_occurred_idx").on(t.jobId, t.occurredAt) }),
);
export type JobEventRow = typeof jobEvents.$inferSelect;
