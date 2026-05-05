import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { claims } from "./claims";
import { opsUsers } from "./ops";

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").references(() => claims.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  documensoId: text("documenso_id"),
  blobKey: text("blob_key"),
  hashSha256: text("hash_sha256"),
  language: text("language"),
  currentVersion: integer("current_version").notNull().default(1),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  blobKey: text("blob_key"),
  hashSha256: text("hash_sha256"),
  diffSummary: text("diff_summary"),
  createdBy: uuid("created_by").references(() => opsUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
