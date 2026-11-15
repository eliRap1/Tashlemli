import { Redis } from "@upstash/redis";

// Lazy singleton — evaluated on first call, not at module load.
// When Upstash is not configured the function returns a permissive no-op
// so the system can still run without Redis (rate limiting disabled).
let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { ok: true, remaining: limit };
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  const count = await redis.incr(k);
  if (count === 1) await redis.expire(k, windowSeconds);
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}
