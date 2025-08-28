import { test, expect } from "./fixtures";
import "./custom-matchers";

test("test with originalDomain and originalSlug", async ({
  page,
  originalDomain,
  originalSlug,
  slug,
}) => {
  // Visit the original remote URL first
  const originalUrl = `${originalDomain}${originalSlug}`;
  await page.goto(originalUrl);

  const originalSnapshot = `- heading "Black Thursday" [level=2]`;

  // Optionally collect information, for demonstration grabbing the h1 (if any)
  // const headingText = await page.locator("h1").textContent();

  // Now visit the local slug for your actual test
  await page.goto(slug);
  const localSnapshot = `- heading "Schwarz Donnerstag" [level=2]`;

  // Use the custom LLM translation grader matcher
  await expect(originalSnapshot).toMatchLocalisation(localSnapshot, 50);
});
