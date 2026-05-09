import { test, expect, request } from '@playwright/test';

/**
 * SUITE 6 — API contract & input validation
 * Tests the backend's validation layer and response shapes.
 */

const BACKEND = 'https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app';
const JWT = process.env.TEST_JWT ?? '';
const HAS_JWT = JWT.length > 0;

function authCtx() {
  return request.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${JWT}` },
  });
}

test.describe('Input validation (no auth required to test 400 vs 401)', () => {
  test('POST /case/start with missing body returns 400 or 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${BACKEND}/case/start`, { data: {} });
    expect([400, 401]).toContain(res.status());
  });

  test('POST /case/start with invalid difficulty returns 400 or 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${BACKEND}/case/start`, {
      data: { difficulty: 'impossible' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('POST /interrogate with missing fields returns 400 or 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${BACKEND}/interrogate`, { data: {} });
    expect([400, 401]).toContain(res.status());
  });

  test('GET /case/nonexistent-session returns 401 (auth first)', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${BACKEND}/case/00000000-0000-0000-0000-000000000000`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Authenticated API contract', () => {
  test.skip(!HAS_JWT, 'TEST_JWT not set — skipping authenticated API suite');

  test('GET /auth/me returns user shape', async () => {
    const ctx = await authCtx();
    const res = await ctx.get(`${BACKEND}/auth/me`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('coinBalance');
    expect(typeof body.coinBalance).toBe('number');
    expect(body.coinBalance).toBeGreaterThanOrEqual(0);
  });

  test('POST /case/start with easy returns session shape', async () => {
    test.setTimeout(90_000);
    const ctx = await authCtx();
    const res = await ctx.post(`${BACKEND}/case/start`, {
      data: { difficulty: 'easy' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('sessionId');
    expect(body).toHaveProperty('difficulty', 'easy');
    expect(body).toHaveProperty('expiresAt');
    expect(body).toHaveProperty('coinBalance');
    expect(body).toHaveProperty('case');
    // Case shape
    expect(body.case).toHaveProperty('victim');
    expect(body.case).toHaveProperty('suspects');
    expect(body.case.suspects.length).toBeGreaterThan(0);
    // Private fields must NOT be present
    expect(JSON.stringify(body.case)).not.toContain('private_truth');
    expect(JSON.stringify(body.case)).not.toContain('alibi_is_true');
    expect(JSON.stringify(body.case)).not.toContain('will_crack_if');
  });

  test('coin balance decreases after starting a case', async () => {
    test.setTimeout(90_000);
    const ctx = await authCtx();
    const meBefore = await (await ctx.get(`${BACKEND}/auth/me`)).json();
    const caseRes = await ctx.post(`${BACKEND}/case/start`, {
      data: { difficulty: 'easy' },
    });
    expect(caseRes.status()).toBe(201);
    const caseBody = await caseRes.json();
    // coinBalance in response should be reduced by 50 (easy cost)
    expect(caseBody.coinBalance).toBe(meBefore.coinBalance - 50);
  });

  test('POST /interrogate returns answer for a valid session', async () => {
    test.setTimeout(120_000);
    const ctx = await authCtx();
    // Start a case first
    const caseRes = await ctx.post(`${BACKEND}/case/start`, {
      data: { difficulty: 'easy' },
    });
    const { sessionId, case: caseData } = await caseRes.json();
    const suspectId = caseData.suspects[0].id;

    const intRes = await ctx.post(`${BACKEND}/interrogate`, {
      data: { sessionId, suspectId, question: 'Where were you the night of the murder?' },
    });
    expect(intRes.status()).toBe(201);
    const intBody = await intRes.json();
    expect(intBody).toHaveProperty('answer');
    expect(typeof intBody.answer).toBe('string');
    expect(intBody.answer.length).toBeGreaterThan(10);
  });

  test('POST /hint returns a hint and blocks second request', async () => {
    test.setTimeout(120_000);
    const ctx = await authCtx();
    const caseRes = await ctx.post(`${BACKEND}/case/start`, {
      data: { difficulty: 'easy' },
    });
    const { sessionId } = await caseRes.json();

    const h1 = await ctx.post(`${BACKEND}/hint`, { data: { sessionId } });
    expect(h1.status()).toBe(201);
    const h1Body = await h1.json();
    expect(h1Body).toHaveProperty('hint');
    expect(h1Body.hint.length).toBeGreaterThan(5);

    // Second hint on same session must fail
    const h2 = await ctx.post(`${BACKEND}/hint`, { data: { sessionId } });
    expect(h2.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /verdict returns correct/incorrect result', async () => {
    test.setTimeout(120_000);
    const ctx = await authCtx();
    const caseRes = await ctx.post(`${BACKEND}/case/start`, {
      data: { difficulty: 'easy' },
    });
    const { sessionId, case: caseData } = await caseRes.json();
    const anyId = caseData.suspects[0].id;

    const vRes = await ctx.post(`${BACKEND}/verdict`, {
      data: { sessionId, accusedSuspectId: anyId },
    });
    expect(vRes.status()).toBe(201);
    const vBody = await vRes.json();
    expect(vBody).toHaveProperty('correct');
    expect(vBody).toHaveProperty('reveal');
    expect(vBody).toHaveProperty('coinBalance');
    expect(typeof vBody.correct).toBe('boolean');
    expect(vBody.reveal.length).toBeGreaterThan(20);
  });
});
