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
};

export const test = base.extend<MyFixtures>({
  // Fallback domain for original (fully qualified, including protocol)
  originalDomain: ["https://tomorrows-ai.org", { option: true }],
  originalSlug: ["/", { option: true }],
  slug: ["/", { option: true }],
});

export { expect };
