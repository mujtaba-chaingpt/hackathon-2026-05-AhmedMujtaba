import { test, expect } from '@playwright/test';

/**
 * SUITE 1 — Landing page
 * Tests the public-facing landing page: structure, visibility, auth redirect.
 */
test.describe('Landing page', () => {
  test('loads with 200 and shows hero title', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    // Title words rendered
    await expect(page.locator('h1').filter({ hasText: 'MURDER' }).first()).toBeVisible();
    await expect(page.locator('h1').filter({ hasText: 'MYSTERY' }).first()).toBeVisible();
    await expect(page.locator('h1').filter({ hasText: 'DETECTIVE' }).first()).toBeVisible();
  });

  test('shows Sign In with Google button', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('button, a').filter({ hasText: /sign in with google/i }).first();
    await expect(btn).toBeVisible();
  });

  test('feature cards are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=AI Suspects')).toBeVisible();
    await expect(page.locator('text=Voice Narration')).toBeVisible();
    await expect(page.locator('text=3 Difficulties')).toBeVisible();
  });

  test('marquee strip is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=METROPOLITAN DETECTIVE AGENCY').first()).toBeVisible();
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Filter out known third-party noise
    const real = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('google-analytics') &&
      !e.includes('gtag') &&
      !e.includes('ERR_BLOCKED_BY_CLIENT')
    );
    expect(real).toHaveLength(0);
  });

  test('unauthenticated user cannot access dashboard (redirected)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    // Should redirect to landing '/' or show landing content
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  test('unauthenticated user cannot access game/new (redirected)', async ({ page }) => {
    await page.goto('/game/new');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/game/new');
  });
});
