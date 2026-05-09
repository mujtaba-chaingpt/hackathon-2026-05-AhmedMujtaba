import { test, expect } from '@playwright/test';

/**
 * SUITE 4 — Authenticated page flows (mocked JWT session)
 *
 * We inject a real JWT (from the .env or test fixture) into localStorage
 * so we can test pages that require auth without going through Google OAuth.
 *
 * Set TEST_JWT env var to a real, non-expired token for full coverage.
 * Without it, tests use a structurally valid expired token and only verify
 * redirect/graceful-failure behaviour.
 */

const JWT = process.env.TEST_JWT ?? '';
const HAS_JWT = JWT.length > 0;

async function injectToken(page: import('@playwright/test').Page, token: string) {
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('mm_token', t), token);
}

test.describe('Dashboard (authenticated)', () => {
  test.skip(!HAS_JWT, 'TEST_JWT not set — skipping authenticated suite');

  test('dashboard loads and shows coin balance', async ({ page }) => {
    await injectToken(page, JWT);
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/dashboard');
    // Coin balance display
    await expect(page.locator('[aria-label*="coin"], text=/\\d+ ⊙/')).toBeVisible();
  });

  test('dashboard shows difficulty selector cards', async ({ page }) => {
    await injectToken(page, JWT);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Easy')).toBeVisible();
    await expect(page.locator('text=Medium')).toBeVisible();
    await expect(page.locator('text=Hard')).toBeVisible();
  });

  test('game/new loads and shows difficulty options', async ({ page }) => {
    await injectToken(page, JWT);
    await page.goto('/game/new');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/game/new');
    await expect(page.locator('text=Easy')).toBeVisible();
  });

  test('starting a case on easy difficulty reaches the game page', async ({ page }) => {
    test.setTimeout(120_000); // AI generation can take up to 60s
    await injectToken(page, JWT);
    await page.goto('/game/new');
    await page.waitForTimeout(1500);

    // Click Easy
    const easyBtn = page.locator('button').filter({ hasText: /easy/i }).first();
    await easyBtn.click();

    // Click the Start Investigation / Begin button
    const startBtn = page.locator('button').filter({ hasText: /start|begin|investigate/i }).first();
    await startBtn.click();

    // Wait for AI to generate and redirect to game page
    await page.waitForURL(/\/game\/[a-f0-9-]{36}/, { timeout: 90_000 });
    expect(page.url()).toMatch(/\/game\/[a-f0-9-]{36}/);
  });

  test('game page shows timer, suspect list, and interrogation area', async ({ page }) => {
    test.setTimeout(120_000);
    await injectToken(page, JWT);
    await page.goto('/game/new');
    await page.waitForTimeout(1500);

    const easyBtn = page.locator('button').filter({ hasText: /easy/i }).first();
    await easyBtn.click();
    const startBtn = page.locator('button').filter({ hasText: /start|begin|investigate/i }).first();
    await startBtn.click();

    await page.waitForURL(/\/game\/[a-f0-9-]{36}/, { timeout: 90_000 });

    // Timer visible
    await expect(page.locator('text=/\\d{2}:\\d{2}/')).toBeVisible({ timeout: 15_000 });
    // Suspect list
    await expect(page.locator('text=/Persons of Interest|Suspects/i').first()).toBeVisible();
    // Chat input
    await expect(page.locator('input[type="text"], textarea').first()).toBeVisible();
  });

  test('logout clears token and returns to landing', async ({ page }) => {
    await injectToken(page, JWT);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    const logoutBtn = page.locator('button, a').filter({ hasText: /log.?out|sign.?out/i }).first();
    await logoutBtn.click();
    await page.waitForTimeout(2000);

    const stored = await page.evaluate(() => localStorage.getItem('mm_token'));
    expect(stored).toBeNull();
    expect(page.url()).not.toContain('/dashboard');
  });
});

test.describe('Authenticated redirect behaviour (no JWT)', () => {
  test('dashboard without JWT redirects to landing', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('mm_token'));
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/dashboard');
  });

  test('game/new without JWT redirects to landing', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('mm_token'));
    await page.goto('/game/new');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/game/new');
  });

  test('result page without JWT redirects to landing', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('mm_token'));
    await page.goto('/result/fake-session-id');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/result');
  });
});
