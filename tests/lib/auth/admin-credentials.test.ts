import { describe, expect, it } from "vitest";
import { hasValidAdminCookie, hasValidAdminPassword } from "@/lib/auth/admin-credentials";

describe("admin credentials", () => {
  it("rejects missing secrets even when the input is empty", () => {
    expect(hasValidAdminPassword(undefined, {} as NodeJS.ProcessEnv)).toBe(false);
    expect(hasValidAdminCookie(undefined, {} as NodeJS.ProcessEnv)).toBe(false);
  });

  it("rejects short configured secrets", () => {
    const env = { OPS_PASSWORD: "short", OPS_COOKIE: "also-short" } as NodeJS.ProcessEnv;
    expect(hasValidAdminPassword("short", env)).toBe(false);
    expect(hasValidAdminCookie("also-short", env)).toBe(false);
  });

  it("accepts exact configured admin secrets", () => {
    const env = {
      OPS_PASSWORD: "password-secret-123",
      OPS_COOKIE: "cookie-secret-1234",
    } as NodeJS.ProcessEnv;
    expect(hasValidAdminPassword("password-secret-123", env)).toBe(true);
    expect(hasValidAdminCookie("cookie-secret-1234", env)).toBe(true);
  });

  it("rejects non-matching configured admin secrets", () => {
    const env = {
      OPS_PASSWORD: "password-secret-123",
      OPS_COOKIE: "cookie-secret-1234",
    } as NodeJS.ProcessEnv;
    expect(hasValidAdminPassword("password-secret-124", env)).toBe(false);
    expect(hasValidAdminCookie("cookie-secret-1235", env)).toBe(false);
  });
});
