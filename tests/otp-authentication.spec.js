const { test, expect } = require('@playwright/test');

test.describe('OTP Authentication Flow', () => {
  test('should send OTP successfully', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/screenshots/01-login-page.png' });

    // Fill 10-digit phone (country code is selected separately on UI)
    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.fill('9876543210');

    await page.screenshot({ path: 'tests/screenshots/02-phone-filled.png' });

    // Click submit button to send OTP (Marathi text: "लॉगिन करा")
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for OTP input to appear
    const otpInput = page.locator('#otp');
    await expect(otpInput).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'tests/screenshots/03-otp-sent.png' });
  });

  test('should verify OTP and login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="phone"]').fill('9876543210');
    await page.locator('button[type="submit"]').click();

    const otpInput = page.locator('#otp');
    await expect(otpInput).toBeVisible({ timeout: 10000 });

    await otpInput.fill('123456');
    await page.screenshot({ path: 'tests/screenshots/04-otp-filled.png' });

    // Click verify (button text switches to Marathi: "OTP सत्यापित करा")
    await page.locator('button[type="submit"]').click();

    // Expect navigation to dashboard
    await expect(page).toHaveURL(/dashboard|home|admin/, { timeout: 15000 });
    await page.screenshot({ path: 'tests/screenshots/05-login-success.png' });
  });

  test('should handle phone validation errors gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="phone"]').fill('12345');
    await page.locator('button[type="submit"]').click();

    // Expect validation message
    const validation = page.locator('text=Invalid phone number');
    await expect(validation).toBeVisible({ timeout: 5000 });

    // Ensure OTP field is not shown
    await expect(page.locator('#otp')).toHaveCount(0);
    await page.screenshot({ path: 'tests/screenshots/06-phone-validation.png' });
  });
});
