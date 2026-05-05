import { pgTable, uuid, text, boolean, timestamp, customType, bigserial, jsonb } from "drizzle-orm/pg-core";
import { claims } from "./claims";

const citext = customType<{ data: string }>({ dataType: () => "citext" });
const bytea = customType<{ data: Buffer; default: false }>({ dataType: () => "bytea" });

export const opsUsers = pgTable("ops_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: citext("email").notNull().unique(),
  fullName: text("full_name"),
  totpSecretEncrypted: bytea("totp_secret_encrypted"),
  passwordHash: text("password_hash"),
  barLicenseNumber: text("bar_license_number"),
  role: text("role").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  opsUserId: uuid("ops_user_id").references(() => opsUsers.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  ipHash: text("ip_hash"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export const opsInbox = pgTable("ops_inbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").references(() => claims.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  payload: jsonb("payload"),
  readBy: uuid("read_by").references(() => opsUsers.id),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OpsUser = typeof opsUsers.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type OpsInboxItem = typeof opsInbox.$inferSelect;
