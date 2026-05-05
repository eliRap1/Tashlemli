import { pgTable, uuid, text, timestamp, date, jsonb, unique } from "drizzle-orm/pg-core";

export const flights = pgTable(
  "flights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flightNumber: text("flight_number").notNull(),
    date: date("date").notNull(),
    airlineIata: text("airline_iata"),
    departureIata: text("departure_iata"),
    arrivalIata: text("arrival_iata"),
    scheduledDep: timestamp("scheduled_dep", { withTimezone: true }),
    actualDep: timestamp("actual_dep", { withTimezone: true }),
    scheduledArr: timestamp("scheduled_arr", { withTimezone: true }),
    actualArr: timestamp("actual_arr", { withTimezone: true }),
    status: text("status"),
    raw: jsonb("raw"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ uniq: unique("flights_uniq").on(t.flightNumber, t.date) }),
);

export type Flight = typeof flights.$inferSelect;
