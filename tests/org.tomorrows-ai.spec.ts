import { test, expect } from "./fixtures";

test("test", async ({ page, slug }) => {
  await page.goto(slug);
  await expect(page.locator('[id="_top"]')).toMatchAriaSnapshot(
    `- heading "The Metamorphic Guide" [level=1]`,
  );
});
