import { generateObject } from "ai";
import { z } from "zod";
import { anthropic, HAIKU } from "@/lib/ai/gateway";

export const ClassificationSchema = z.object({
  intent: z.enum(["acknowledged", "denied", "info_requested", "settlement_offered", "auto_reply", "unrelated"]),
  is_automated: z.boolean(),
  offered_amount_ils: z.number().nullable(),
  offered_currency: z.string().nullable(),
  deadline_for_us: z.string().nullable(),
  requires_lawyer: z.boolean(),
  summary_he: z.string(),
});
export type Classification = z.infer<typeof ClassificationSchema>;

const SYSTEM = `Classify a single email reply from an airline to a passenger compensation demand.
Respond strictly per schema. Do not invent amounts.
If body language sounds like an automated acknowledgement ("we received your message and will respond"), set is_automated=true and intent="auto_reply".`;

export async function classifyReply(input: { from: string; subject: string; body: string }): Promise<Classification> {
  const { object } = await generateObject({
    model: anthropic(HAIKU),
    schema: ClassificationSchema,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(input) }],
    maxRetries: 1,
  });
  return object;
}
