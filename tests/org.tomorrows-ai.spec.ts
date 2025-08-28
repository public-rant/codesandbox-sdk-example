import { test, expect } from "./fixtures";

test("test with originalDomain and originalSlug", async ({
  page,
  originalDomain,
  originalSlug,
  slug,
}) => {
  // Visit the original remote URL first
  const originalUrl = `${originalDomain}${originalSlug}`;
  await page.goto(originalUrl);

  const snapshot = `- heading "Black Thursday" [level=2]`;

  // Optionally collect information, for demonstration grabbing the h1 (if any)
  // const headingText = await page.locator("h1").textContent();

  // Now visit the local slug for your actual test
  await page.goto(slug);
  await expect(page.locator('[id="_top"]')).toMatchAriaSnapshot(
    `- heading "Schwarz Donnerstag" [level=2]`,
  );
});
