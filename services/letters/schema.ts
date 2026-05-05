import { z } from "zod";

export const LetterSchema = z.object({
  subject_he: z.string(),
  subject_en: z.string(),
  letterhead: z.object({
    firm: z.string(),
    lawyer: z.string(),
    bar_license: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }),
  facts_paragraph_he: z.string(),
  facts_paragraph_en: z.string(),
  legal_grounds: z.array(z.object({
    citation: z.string(),
    article: z.string().nullable(),
    jurisdiction: z.enum(["EU261", "IL2012"]),
    applied_to_facts_he: z.string(),
    applied_to_facts_en: z.string(),
  })).min(1),
  demand_amount_ils: z.number().int().positive(),
  deadline_iso: z.string().date(),
  payment_terms_he: z.string(),
  payment_terms_en: z.string(),
  sign_off_he: z.string(),
  sign_off_en: z.string(),
});
export type Letter = z.infer<typeof LetterSchema>;
