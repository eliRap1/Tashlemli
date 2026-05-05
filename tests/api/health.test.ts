import { describe, expect, it } from "vitest";

describe("/api/health", () => {
  it("returns ok payload", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET(new Request("http://localhost/api/health"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(typeof body.commit).toBe("string");
  });
});
