import { pgTable, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";

export const airlines = pgTable("airlines", {
  iata: text("iata").primaryKey(),
  legalName: text("legal_name"),
  legalEntityCountry: text("legal_entity_country"),
  primaryContactEmail: text("primary_contact_email"),
  fallbackContactEmail: text("fallback_contact_email"),
  preferredLanguage: text("preferred_language"),
  jurisdictionResponse: text("jurisdiction_response"),
  toneProfile: text("tone_profile"),
  historicalSuccessRate: numeric("historical_success_rate"),
  medianSettlementDays: integer("median_settlement_days"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Airline = typeof airlines.$inferSelect;
