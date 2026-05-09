import { test, expect } from '@playwright/test';

/**
 * SUITE 5 — Responsive UI & visual integrity
 * Tests the landing page at multiple viewport sizes to catch overflow/clip bugs.
 */

const VIEWPORTS = [
  { name: 'mobile-sm',  width: 375,  height: 667  },
  { name: 'mobile-lg',  width: 414,  height: 896  },
  { name: 'tablet',     width: 768,  height: 1024 },
  { name: 'desktop',    width: 1280, height: 720  },
  { name: 'desktop-lg', width: 1440, height: 900  },
];

for (const vp of VIEWPORTS) {
  test.describe(`Viewport ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('landing page has no horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow).toBe(false);
    });

    test('hero title is visible without scrolling', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);
      // At least one of the title words is in the viewport
      const titleVisible = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('h1'));
        return els.some(el => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0;
        });
      });
      expect(titleVisible).toBe(true);
    });

    test('Sign In button is reachable in viewport', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);
      const btn = page.locator('button, a').filter({ hasText: /sign in with google/i }).first();
      await expect(btn).toBeInViewport();
    });

    test('page body does not scroll (fixed layout)', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);
      const bodyOverflow = await page.evaluate(() => {
        const style = window.getComputedStyle(document.body);
        return style.overflow;
      });
      // body should be overflow:hidden per layout architecture
      expect(bodyOverflow).toBe('hidden');
    });
  });
}
