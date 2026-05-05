import { describe, expect, it } from "vitest";
import { redactPassenger } from "@/services/tracker/publicView";

describe("redactPassenger", () => {
  it("returns full anonymized label in anonymous mode", () => {
    expect(redactPassenger("Noa Cohen", "anonymous")).toBe("נוסע/ת ישראלי/ת");
  });
  it("returns first + last initial in public_default mode", () => {
    expect(redactPassenger("Noa Cohen", "public_default")).toBe("Noa C.");
  });
  it("handles single-word names", () => {
    expect(redactPassenger("Noa", "public_default")).toBe("Noa");
  });
});
