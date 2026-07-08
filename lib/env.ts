import { z } from "zod";

const Schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_CLAIM_SECRET: z.string().min(32),
  JWT_SESSION_SECRET: z.string().min(32),
  AI_GATEWAY_API_KEY: z.string().min(1),
  AI_GATEWAY_BASE_URL: z.string().url(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().min(3),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
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

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export const env: Env = new Proxy({} as Env, {
  get(_t, prop) {
    // During `next build`, page data collection imports modules that may read
    // env at module-load time. Vercel does not surface project env vars to the
    // build container by default, so strict validation would fail. Return raw
    // process.env (or empty placeholders) and defer validation to runtime.
    if (isBuildPhase) {
      const key = prop as string;
      const raw = process.env[key];
      if (raw !== undefined) return raw;
      if (key === "NODE_ENV") return "production";
      // SDKs frequently validate URLs/emails at construction. Return shape-valid
      // placeholders so module-load code in routes doesn't throw during the
      // build collect-page-data phase. Real values are required at runtime.
      if (key === "DATABASE_URL") return "postgres://stub:stub@localhost:5432/stub";
      if (key.endsWith("_URL")) return "https://stub.example.com";
      if (key === "RESEND_FROM") return "stub@example.com";
      return "build_placeholder";
    }
    if (!_env) _env = parseEnv();
    return (_env as Record<string | symbol, unknown>)[prop];
  },
});
