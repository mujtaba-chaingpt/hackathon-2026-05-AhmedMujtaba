import { test, expect, request } from '@playwright/test';

/**
 * SUITE 3 — Backend API health & contract tests
 * Tests the Railway backend directly (no browser needed).
 */

const BACKEND = 'https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app';

test.describe('Backend API', () => {
  test('GET /health returns 200 with ok status', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${BACKEND}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
  });

  test('GET /auth/me without token returns 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${BACKEND}/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('POST /case/start without token returns 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${BACKEND}/case/start`, {
      data: { difficulty: 'easy' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /interrogate without token returns 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${BACKEND}/interrogate`, {
      data: { sessionId: 'fake', suspectId: 'fake', question: 'Where were you?' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /hint without token returns 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${BACKEND}/hint`, {
      data: { sessionId: 'fake' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /verdict without token returns 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${BACKEND}/verdict`, {
      data: { sessionId: 'fake', accusedSuspectId: 'fake' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /auth/google redirects to Google OAuth', async () => {
    const ctx = await request.newContext({ maxRedirects: 0 });
    const res = await ctx.get(`${BACKEND}/auth/google`);
    // Should 302 to accounts.google.com
    expect([301, 302, 303]).toContain(res.status());
    const location = res.headers()['location'] ?? '';
    expect(location).toContain('google');
  });

  test('POST /case/start with invalid token returns 401', async () => {
    const ctx = await request.newContext({
      extraHTTPHeaders: { Authorization: 'Bearer invalid.token.here' },
    });
    const res = await ctx.post(`${BACKEND}/case/start`, {
      data: { difficulty: 'easy' },
    });
    expect(res.status()).toBe(401);
  });

  test('CORS header present for frontend origin', async () => {
    const ctx = await request.newContext({
      extraHTTPHeaders: {
        Origin: 'https://hackathon-2026-05-ahmed-mujtaba-eta.vercel.app',
      },
    });
    const res = await ctx.get(`${BACKEND}/health`);
    const acao = res.headers()['access-control-allow-origin'];
    expect(acao).toBeTruthy();
  });
});
