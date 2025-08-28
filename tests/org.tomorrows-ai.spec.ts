import { test, expect } from "./fixtures";
import "./custom-matchers";

test("test with originalDomain and originalSlug", async ({
  page,
  originalDomain,
  originalSlug,
  slug,
  originalSnapshot,
  translatedSnapshot,
}) => {
  // Visit the original remote URL first
  const originalUrl = `${originalDomain}${originalSlug}`;
  await page.goto(originalUrl);

  // Now visit the local slug for your actual test
  await page.goto(slug);

  // Use the fixture-provided ARIA snapshots for translation grading
  await expect(originalSnapshot).toMatchLocalisation(translatedSnapshot, 101);
});
