import { test as base, expect } from "@playwright/test";

/**
 * Custom test fixture for Playwright that provides:
 * - originalDomain: The source domain, e.g., 'https://tomorrows-ai.org'
 * - originalSlug:   The path portion, default '/'
 * - slug:           The local route (relative to local baseURL), default '/scenario-page-7-copy/'
 */
type MyFixtures = {
  originalDomain: string;
  originalSlug: string;
  slug: string;
  originalSnapshot: string;
  translatedSnapshot: string;
};

export const test = base.extend<MyFixtures>({
  // Fallback domain for original (fully qualified, including protocol)
  originalDomain: ["https://tomorrows-ai.org", { option: true }],
  originalSlug: ["/", { option: true }],
  slug: ["/", { option: true }],
  originalSnapshot: [
    '- heading "Hello world" [level=2]', // Default: basic English heading
    { option: true },
  ],
  translatedSnapshot: [
    '- heading "Lorem ipsum" [level=2]', // Default: unrelated, intentionally fails translation
    { option: true },
  ],
});

export { expect };
