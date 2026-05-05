import { createHash } from "node:crypto";

export function sha256Hex(input: string | Buffer): string {
  const data = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return createHash("sha256").update(data).digest("hex");
}

export async function hashIp(ip: string): Promise<string> {
  return createHash("sha256").update(`tshl:ip:${ip}`).digest("hex").slice(0, 32);
}
