const { test, expect } = require('@playwright/test');

test.describe('Complete Platform Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load homepage and navigate to login', async ({ page }) => {
    await page.screenshot({ path: 'tests/screenshots/00-homepage.png' });

    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    }

    await page.screenshot({ path: 'tests/screenshots/01-login-page.png' });
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  test('should complete full OTP authentication flow', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="phone"]').fill('9876543210');
    await page.locator('button[type="submit"]').click();

    const otpInput = page.locator('#otp');
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill('123456');

    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/dashboard|home|admin/, { timeout: 15000 });
    await page.screenshot({ path: 'tests/screenshots/05-login-complete.png' });
  });

  test('should test dashboard functionality', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="phone"]').fill('9876543210');
    await page.locator('button[type="submit"]').click();

    const otpInput = page.locator('#otp');
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill('123456');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/dashboard|home|admin/, { timeout: 15000 });
    await page.screenshot({ path: 'tests/screenshots/06-dashboard.png' });

    // Try navigate to grievances if link exists
    const grievancesLink = page.locator('a[href*="grievance"], text=/Grievances|Complaints/i').first();
    if (await grievancesLink.count()) {
      await grievancesLink.first().click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'tests/screenshots/07-grievances-page.png' });
    }

    // Departments
    const departmentsLink = page.locator('a[href*="department"], text=/Departments/i').first();
    if (await departmentsLink.count()) {
      await departmentsLink.first().click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'tests/screenshots/08-departments-page.png' });
    }

    // Officers
    const officersLink = page.locator('a[href*="officer"], text=/Officers/i').first();
    if (await officersLink.count()) {
      await officersLink.first().click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'tests/screenshots/09-officers-page.png' });
    }

    // Analytics
    const analyticsLink = page.locator('a[href*="analytics"], text=/Analytics|Reports/i').first();
    if (await analyticsLink.count()) {
      await analyticsLink.first().click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'tests/screenshots/10-analytics-page.png' });
    }
  });

  test('should test grievance creation', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="phone"]').fill('9876543210');
    await page.locator('button[type="submit"]').click();

    const otpInput = page.locator('#otp');
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill('123456');
    await page.locator('button[type="submit"]').click();

    await page.goto('/grievances');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/11-grievances-list.png' });
  });

  test('should test mobile responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/15-mobile-homepage.png' });
  });

  test('should test error handling', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="phone"]').fill('invalid');
    await page.locator('button[type="submit"]').click();

    const validation = page.locator('text=Invalid phone number');
    await expect(validation).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#otp')).toHaveCount(0);

    await page.screenshot({ path: 'tests/screenshots/17-error-handling.png' });
  });
});
