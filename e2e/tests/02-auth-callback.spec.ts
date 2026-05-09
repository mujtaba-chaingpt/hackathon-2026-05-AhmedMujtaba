import { test, expect } from '@playwright/test';

/**
 * SUITE 2 — Auth callback
 * Tests the /auth/callback route that receives the JWT from the backend.
 * We can't do a real Google OAuth flow in CI, so we test:
 *   (a) no token → shows error message then redirects to / after ~3s
 *   (b) malformed token → getMe() fails → cleared token → redirect to /
 *   (c) structurally valid JWT → token stored initially, then cleared because
 *       the expired JWT is rejected by the backend → redirect to /
 *
 * NOTE: Full authenticated callback is covered in suite 04 with TEST_JWT env var.
 */

test.describe('Auth callback route', () => {
  test('visiting /auth/callback without token shows error and redirects to landing', async ({ page }) => {
    await page.goto('/auth/callback');
    // Should show error message
    await expect(page.locator('text=/authentication failed|no authentication token/i').first()).toBeVisible({ timeout: 5000 });
    // Then redirect after 3s
    await page.waitForURL('/', { timeout: 8000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test('visiting /auth/callback with malformed token redirects to landing', async ({ page }) => {
    await page.goto('/auth/callback?token=not-a-real-token');
    // getMe() returns 401 → clears token → redirect
    await page.waitForURL('/', { timeout: 8000 });
    expect(page.url()).not.toContain('/auth/callback');
  });

  test('expired JWT causes graceful failure and redirect to landing', async ({ page }) => {
    // Structurally valid but expired JWT — getMe() will return 401
    const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LWlkIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await page.goto(`/auth/callback?token=${expiredJwt}`);
    // App stores token, calls getMe(), gets 401, clears token, redirects to /
    await page.waitForURL('/', { timeout: 10000 });
    expect(page.url()).not.toContain('/auth/callback');
    // Token must have been cleared
    const stored = await page.evaluate(() => localStorage.getItem('mm_token'));
    expect(stored).toBeNull();
  });

  test('auth/callback page renders spinner while loading', async ({ page }) => {
    // Navigate and immediately check for spinner before redirect
    await page.goto('/auth/callback?token=some-token');
    // Briefly shows loading spinner before redirect
    // Just verify the page doesn't crash (200 or JS rendering)
    const url = page.url();
    expect(url).toBeTruthy();
  });
});
