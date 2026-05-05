import { generateObject } from "ai";
import { anthropic, SONNET } from "@/lib/ai/gateway";
import { LetterSchema, type Letter } from "./schema";
import { SYSTEM_PROMPT } from "./prompts";

export async function generateLetter(input: {
  passenger_name: string;
  flight_number: string;
  flight_date: string;
  origin_iata: string;
  destination_iata: string;
  airline_name: string | null;
  amount_ils: number;
  jurisdiction: "EU261" | "IL2012" | "BOTH";
  grounds: string[];
  rationale_he: string;
  reason_category: string;
  lawyer: { firm: string; name: string; bar_license: string; address: string; phone: string; email: string };
}): Promise<Letter> {
  const { object } = await generateObject({
    model: anthropic(SONNET),
    schema: LetterSchema,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: JSON.stringify(input) },
    ],
    maxRetries: 1,
  });
  return object;
}
