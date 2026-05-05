import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("returns parsed values when all required keys present", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://u:p@h/db",
      JWT_CLAIM_SECRET: "x".repeat(32),
      JWT_SESSION_SECRET: "y".repeat(32),
      AI_GATEWAY_API_KEY: "k",
      AI_GATEWAY_BASE_URL: "https://gateway.ai.cloudflare.example/v1",
      RESEND_API_KEY: "re_test",
      RESEND_FROM: "no-reply@tashlemli.co.il",
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_xxx",
      AVIATIONSTACK_KEY: "av_test",
      UPSTASH_REDIS_REST_URL: "https://r.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "u_test",
      APP_BASE_URL: "https://tashlemli.co.il",
      NODE_ENV: "test",
    });
    expect(env.JWT_CLAIM_SECRET).toHaveLength(32);
    expect(env.NODE_ENV).toBe("test");
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() =>
      parseEnv({ JWT_CLAIM_SECRET: "x".repeat(32) }),
    ).toThrow(/DATABASE_URL/);
  });

  it("throws when JWT_CLAIM_SECRET is shorter than 32 chars", () => {
    expect(() =>
      parseEnv({ ...validBase(), JWT_CLAIM_SECRET: "short" }),
    ).toThrow(/JWT_CLAIM_SECRET/);
  });
});

function validBase() {
  return {
    DATABASE_URL: "postgres://u:p@h/db",
    JWT_CLAIM_SECRET: "x".repeat(32),
    JWT_SESSION_SECRET: "y".repeat(32),
    AI_GATEWAY_API_KEY: "k",
    AI_GATEWAY_BASE_URL: "https://gw/v1",
    RESEND_API_KEY: "re_test",
    RESEND_FROM: "x@x",
    BLOB_READ_WRITE_TOKEN: "t",
    AVIATIONSTACK_KEY: "k",
    UPSTASH_REDIS_REST_URL: "https://r",
    UPSTASH_REDIS_REST_TOKEN: "t",
    APP_BASE_URL: "https://x",
    NODE_ENV: "test",
  };
}
