import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { claims } from "./claims";

export const claimEvents = pgTable(
  "claim_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimId: uuid("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    actor: text("actor").notNull(),
    labelHe: text("label_he").notNull(),
    labelEn: text("label_en").notNull(),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ claimIdx: index("claim_events_claim_occurred_idx").on(t.claimId, t.occurredAt) }),
);

export type ClaimEvent = typeof claimEvents.$inferSelect;
export type NewClaimEvent = typeof claimEvents.$inferInsert;
