import { createAnthropic } from "@ai-sdk/anthropic";
import { env } from "@/lib/env";

export const anthropic = createAnthropic({
  apiKey: env.AI_GATEWAY_API_KEY,
  baseURL: env.AI_GATEWAY_BASE_URL,
});

export const HAIKU = "anthropic/claude-haiku-4-5";
export const SONNET = "anthropic/claude-sonnet-4-6";
