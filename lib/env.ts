import { z } from "zod";

const Schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_CLAIM_SECRET: z.string().min(32),
  JWT_SESSION_SECRET: z.string().min(32),
  AI_GATEWAY_API_KEY: z.string().min(1),
  AI_GATEWAY_BASE_URL: z.string().url(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().min(3),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  AVIATIONSTACK_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof Schema>;

export function parseEnv(input: NodeJS.ProcessEnv | Record<string, unknown> = process.env): Env {
  const result = Schema.safeParse(input);
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors;
    const msg = Object.entries(flat)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${msg}`);
  }
  return result.data;
}

let _env: Env | undefined;
export const env: Env = new Proxy({} as Env, {
  get(_t, prop) {
    if (!_env) _env = parseEnv();
    return (_env as Record<string | symbol, unknown>)[prop];
  },
});
