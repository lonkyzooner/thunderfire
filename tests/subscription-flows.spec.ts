import { test, expect } from '@playwright/test';

// Update these URLs and selectors to match your app
const BASE_URL = 'http://localhost:5173'; // or your deployed app URL
const TEST_EMAIL = `testuser+${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Subscription Flows', () => {
  test('Stripe checkout: sign up, pay, and confirm access is granted', async ({ page }) => {
    // 1. Sign up as a new user
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    // Optionally, handle email verification if required

    // 2. Start the subscription/upgrade flow
    await page.goto(`${BASE_URL}/account`); // or wherever the upgrade button is
    await page.click('text=Upgrade'); // Update selector as needed

    // 3. Complete payment via Stripe Checkout (test mode)
    await page.waitForURL(/stripe\.com/);
    // Fill in Stripe test card details
    await page.fill('input[name="cardnumber"]', '4242 4242 4242 4242');
    await page.fill('input[name="exp-date"]', '12/34');
    await page.fill('input[name="cvc"]', '123');
    await page.fill('input[name="postal"]', '12345');
    await page.click('button[type="submit"]');
    // Wait for redirect back to app
    await page.waitForURL(`${BASE_URL}/payment-success*`);

    // 4. Confirm access to premium features is granted
    await page.goto(`${BASE_URL}/premium-feature`); // Update as needed
    await expect(page.locator('text=Premium Feature')).toBeVisible();
  });

  test('Subscription cancellation: confirm access is revoked', async ({ page }) => {
    // 1. Log in as the test user
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // 2. Go to customer portal and cancel subscription
    await page.goto(`${BASE_URL}/account`);
    await page.click('text=Manage Subscription'); // Update selector as needed
    await page.waitForURL(/stripe\.com/);
    // Simulate cancellation in Stripe portal (manual step or automate if possible)

    // 3. Wait for webhook to process (may need to poll or wait)
    await page.waitForTimeout(5000);

    // 4. Confirm access to premium features is revoked
    await page.goto(`${BASE_URL}/premium-feature`);
    await expect(page.locator('text=Upgrade to access')).toBeVisible();
  });
});