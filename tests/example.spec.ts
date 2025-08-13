import { test, expect } from "@playwright/test";

test.describe("Application Baseline Tests", () => {
  test("has correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CodeSandbox Clone/);
  });

  test("shows GitHub token error when token is missing", async ({ page }) => {
    await page.goto("/");

    // Check for the error heading
    await expect(
      page.getByRole("heading", { name: "Missing GitHub Token" }),
    ).toBeVisible();

    // Verify setup instructions are shown
    await expect(page.getByText("Setup Instructions:")).toBeVisible();

    // Check for the retry button
    await expect(
      page.getByRole("button", { name: "Check Again" }),
    ).toBeVisible();

    // Verify the page contains instructions about GitHub token
    await expect(page.getByText(/Personal access tokens/)).toBeVisible();
  });

  test("GitHub token error page has retry functionality", async ({ page }) => {
    await page.goto("/");

    // Click the Check Again button
    const retryButton = page.getByRole("button", { name: "Check Again" });
    await expect(retryButton).toBeVisible();

    // Click and verify it attempts to check again (button should still be visible since no token)
    await retryButton.click();

    // After clicking, the error should still be present (since we don't have a token)
    await expect(
      page.getByRole("heading", { name: "Missing GitHub Token" }),
    ).toBeVisible();
  });

  test("maintains correct title in error state", async ({ page }) => {
    await page.goto("/");

    // Even in error state, the page title should be correct
    await expect(page).toHaveTitle("CodeSandbox Clone");
  });

  test.describe("When GitHub token is configured", () => {
    test.skip("should show login form", async ({ page }) => {
      // This test is skipped by default since it requires GITHUB_TOKEN env var
      // To run: set GITHUB_TOKEN and remove .skip
      await page.goto("/");

      // Wait for any redirects or loading
      await page.waitForLoadState("networkidle");

      // Should show login form elements
      await expect(page.locator('input[type="text"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
    });

    test.skip("should show app header after login", async ({ page }) => {
      // This test requires both GITHUB_TOKEN and valid credentials
      await page.goto("/");

      // Perform login
      await page.fill('input[type="text"]', "testuser");
      await page.fill('input[type="password"]', "Test123!@#");
      await page.getByRole("button", { name: /login/i }).click();

      // After successful login, should see the main app header
      await expect(
        page.getByRole("heading", { name: "CodeSandbox Clone" }),
      ).toBeVisible();

      // Should see the Create Project button
      await expect(
        page.getByRole("button", { name: "Create Project" }),
      ).toBeVisible();
    });
  });
});
