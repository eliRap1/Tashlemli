import { createAnthropic } from "@ai-sdk/anthropic";
import { env } from "@/lib/env";

// Lazy singleton — defers construction (and env reads) to first actual AI call,
// not to module import time.  This keeps cold-start imports side-effect-free.
let _anthropic: ReturnType<typeof createAnthropic> | undefined;

export function anthropic(...args: Parameters<ReturnType<typeof createAnthropic>>) {
  if (!_anthropic) {
    _anthropic = createAnthropic({
      apiKey: env.AI_GATEWAY_API_KEY,
      baseURL: env.AI_GATEWAY_BASE_URL,
    });
  }
  return _anthropic(...args);
}

export const HAIKU = "anthropic/claude-haiku-4-5";
export const SONNET = "anthropic/claude-sonnet-4-6";
