import { describe, expect, it } from "vitest";
import { compute } from "@/services/eligibility/engine";
import { FIXTURES } from "@/services/eligibility/engine.fixtures";

describe("eligibility engine", () => {
  it.each(FIXTURES)(
    "$name",
    ({ input, expected }) => {
      const r = compute(input);
      expect(r.eligible).toBe(expected.eligible);
      if (expected.eligible) {
        expect(r.amount_ils).toBe(expected.amount_ils);
        expect(r.grounds).toEqual(expect.arrayContaining(expected.grounds));
      } else if (expected.rejection_reason) {
        expect(r.rejection_reason).toBe(expected.rejection_reason);
      }
    },
  );
});
