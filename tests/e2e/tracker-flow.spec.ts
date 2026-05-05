import { test, expect } from "@playwright/test";

test("tracker SSE reflects stage advance", async ({ page, request }) => {
  const token = process.env.E2E_DEMO_CLAIM_TOKEN ?? "";
  test.skip(!token, "set E2E_DEMO_CLAIM_TOKEN");

  await page.goto(`/claim/${encodeURIComponent(token)}`);
  await expect(page.getByText(/STATUS · /)).toBeVisible();

  const r = await request.post(`/api/admin/claims/${process.env.E2E_DEMO_CLAIM_ID!}/advance`, {
    headers: { "x-ops-password": process.env.OPS_PASSWORD! },
    data: { code: "demand.sent" },
  });
  expect(r.ok()).toBe(true);

  await expect(page.getByText(/נשלח לחברת התעופה/)).toBeVisible({ timeout: 10_000 });
});
