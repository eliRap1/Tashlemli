import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { claims } from "./claims";
import { documents } from "./documents";

export const poaSignatures = pgTable("poa_signatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").references(() => documents.id),
  documensoId: text("documenso_id"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  signedIpHash: text("signed_ip_hash"),
  signedPdfBlobKey: text("signed_pdf_blob_key"),
});

export type PoaSignature = typeof poaSignatures.$inferSelect;
export type NewPoaSignature = typeof poaSignatures.$inferInsert;
