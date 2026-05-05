import { describe, expect, it } from "vitest";
import { isValidTeudatZehut, normalizeTeudatZehut } from "@/lib/validators/teudat-zehut";

describe("teudat zehut", () => {
  it("accepts known-good IDs", () => {
    expect(isValidTeudatZehut("000000018")).toBe(true);
    expect(isValidTeudatZehut("123456782")).toBe(true);
    expect(isValidTeudatZehut("12345-678-2")).toBe(true);
  });
  it("rejects bad checksum", () => {
    expect(isValidTeudatZehut("123456789")).toBe(false);
  });
  it("rejects too-short", () => {
    expect(isValidTeudatZehut("12345")).toBe(false);
  });
  it("normalizes by left-padding to 9 digits", () => {
    expect(normalizeTeudatZehut("18")).toBe("000000018");
  });
});
