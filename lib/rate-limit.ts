import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; remaining: number }> {
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  // Pipeline INCR + EXPIRE so both commands are sent atomically in one round-trip,
  // preventing the window where a key incremented to 1 could expire before EXPIRE
  // was called (non-atomic INCR then EXPIRE).
  const p = redis.pipeline();
  p.incr(k);
  p.expire(k, windowSeconds);
  const [count] = await p.exec() as [number, number];
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}
