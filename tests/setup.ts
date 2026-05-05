import { beforeAll } from "vitest";

beforeAll(() => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://u:p@h/db";
  process.env.JWT_CLAIM_SECRET = process.env.JWT_CLAIM_SECRET ?? "x".repeat(32);
  process.env.JWT_SESSION_SECRET = process.env.JWT_SESSION_SECRET ?? "y".repeat(32);
  process.env.AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY ?? "k";
  process.env.AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL ?? "https://gw/v1";
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? "re_test";
  process.env.RESEND_FROM = process.env.RESEND_FROM ?? "x@x";
  process.env.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN ?? "t";
  process.env.AVIATIONSTACK_KEY = process.env.AVIATIONSTACK_KEY ?? "k";
  process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL ?? "https://r";
  process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "t";
  process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? "https://x";
});
