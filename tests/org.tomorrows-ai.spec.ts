import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:4321/scenario-page-7-copy/");
  await expect(page.locator('[id="_top"]')).toMatchAriaSnapshot(
    `- heading "The Metamorphic Guide" [level=1]`,
  );
});
