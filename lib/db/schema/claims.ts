import { pgTable, uuid, text, integer, smallint, timestamp, customType, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { flights } from "./flights";
import { airlines } from "./airlines";

const citext = customType<{ data: string }>({ dataType: () => "citext" });

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    flightId: uuid("flight_id").references(() => flights.id),
    airlineIata: text("airline_iata").references(() => airlines.iata),
    jurisdiction: text("jurisdiction").notNull(),
    reasonCategory: text("reason_category").notNull(),
    amountIls: integer("amount_ils").notNull(),
    currentState: text("current_state").notNull().default("intake.received"),
    currentStageIndex: smallint("current_stage_index").notNull().default(1),
    passengerName: text("passenger_name").notNull(),
    passengerIdHe: text("passenger_id_he"),
    contactEmail: citext("contact_email"),
    contactPhone: text("contact_phone"),
    claimToken: text("claim_token").notNull().unique(),
    source: text("source").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("claims_user_created_idx").on(t.userId, t.createdAt),
    stateIdx: index("claims_state_updated_idx").on(t.currentState, t.updatedAt),
  }),
);

export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
