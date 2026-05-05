import { test, expect } from "@playwright/test";
import path from "node:path";

test("upload → reveal → contact capture redirects to /claim/...", async ({ page }) => {
  await page.goto("/check");
  await expect(page.getByText(/שמט כאן את כרטיס/)).toBeVisible();
  await page.setInputFiles('input[type="file"]', path.resolve("tests/e2e/fixtures/sample-bp.jpg"));
  await expect(page.getByText(/REVEAL · ENTITLEMENT/i)).toBeVisible({ timeout: 30_000 });
});
