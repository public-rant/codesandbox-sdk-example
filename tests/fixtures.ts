import { test as base, expect } from "@playwright/test";

/**
 * Custom test fixture for Playwright that provides a `slug` parameter.
 * Usage in your test:
 *   import { test, expect } from "./fixtures";
 *   test("...", async ({ page, slug }) => { await page.goto(slug); });
 */

type SlugFixture = {
  slug: string;
};

export const test = base.extend<SlugFixture>({
  // You can set a default value here, or override per-test with test.use({ slug: ... })
  slug: async ({}, use) => {
    await use("/scenario-page-7-copy/");
  },
});

export { expect };
