import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; remaining: number }> {
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  // Use a Lua script so the INCR and EXPIRE are atomic — avoids a permanent
  // stuck key if the process dies between the two commands.
  const count = (await redis.eval(
    `local c = redis.call('INCR', KEYS[1])
     if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
     return c`,
    [k],
    [windowSeconds],
  )) as number;
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}
