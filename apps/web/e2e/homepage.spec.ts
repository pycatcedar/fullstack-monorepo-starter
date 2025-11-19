import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await expect(page).toHaveTitle(/fullstack-monorepo-starter/i);
  });

  test('should display main content', async ({ page }) => {
    await page.goto('/');

    // Check for main heading or content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have auth button', async ({ page }) => {
    await page.goto('/');

    // Look for sign in button
    const authButton = page.getByRole('button', { name: /sign in/i });
    await expect(authButton).toBeVisible();
  });
});
