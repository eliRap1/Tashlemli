import { pgTable, uuid, text, timestamp, customType, index } from "drizzle-orm/pg-core";
import { users } from "./users";

const bytea = customType<{ data: Buffer; default: false }>({
  dataType: () => "bytea",
});

export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: bytea("token_hash").notNull(),
    channel: text("channel").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userExpIdx: index("mlt_user_exp_idx").on(t.userId, t.expiresAt) }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userExpIdx: index("sessions_user_exp_idx").on(t.userId, t.expiresAt) }),
);

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type Session = typeof sessions.$inferSelect;
