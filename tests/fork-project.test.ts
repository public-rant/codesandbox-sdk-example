import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await expect(page.getByRole("link")).toMatchAriaSnapshot(`
    - img
    - img
    - heading "chromium" [level=3]
    - img
    - text: "/Created Aug \\\\d+, \\\\d+ FORK: 1/"
    `);
});
