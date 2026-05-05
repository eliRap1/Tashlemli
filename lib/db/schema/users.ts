import { pgTable, uuid, text, timestamp, customType } from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({ dataType: () => "citext" });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: citext("email").unique(),
  phone: text("phone").unique(),
  fullName: text("full_name"),
  privacyMode: text("privacy_mode").notNull().default("anonymous"),
  language: text("language").notNull().default("he"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
