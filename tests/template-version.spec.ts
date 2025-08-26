import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('link', { name: 'chromium Created Aug 25, 2025' })).toBeVisible();

  await page.getByRole('button', { name: 'Create Project' }).click();
  await expect(page.locator('form')).toMatchAriaSnapshot(`- text: Template Version (optional)`);
});