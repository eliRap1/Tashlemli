import { describe, expect, it } from "vitest";
import { sha256Hex, hashIp } from "@/lib/hash";

describe("hash", () => {
  it("sha256Hex matches known vector", async () => {
    const h = await sha256Hex("abc");
    expect(h).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("hashIp returns 32-hex string", async () => {
    const h = await hashIp("1.2.3.4");
    expect(h).toMatch(/^[a-f0-9]{32}$/);
  });
});
