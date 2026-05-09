# Phase 6 — Integration Testing & QA

**Status:** IN PROGRESS
**Goal:** Get the app actually running locally with real Postgres + real Google OAuth + real Gemini, then walk through every code path until nothing breaks. This is the phase where assumptions die.

---

## Plan

### Step 1 — Local environment
1. ~~Install Postgres 16 locally~~ — **Using Neon serverless Postgres** (`ep-square-wind-aqfpoe66.c-8.us-east-1.aws.neon.tech/neondb`). No local DB needed.
2. ~~Create the database~~ — Neon DB provisioned via `npx neonctl@latest init`.
3. ✅ Google OAuth credentials provisioned at [console.cloud.google.com](https://console.cloud.google.com/) — real `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in `backend/.env`.
4. ✅ Gemini API key in `backend/.env`.
5. ✅ `backend/.env` filled with real values. `frontend/.env` created with `NEXT_PUBLIC_API_URL=http://localhost:3001`.
6. ✅ Migrations run: `pnpm --filter backend db:migrate` — all 3 tables created on Neon (`users`, `game_sessions`, `interrogation_turns`).
7. ✅ `pnpm install` from root — packages installed.
8. ✅ Backend running on :3001, frontend ready on :3000.

**Note:** SSL is required for Neon. Added `dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }` to both `db.module.ts` and `src/db/config.js` (development block).

### Step 2 — Smoke test (golden path)
Walk through the full happy flow once on each difficulty. Time each step; note anything that takes more than a few seconds.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `http://localhost:3000` | Noir landing visible |
| 2 | Click "Sign in with Google" | Redirects to Google, then back to `/dashboard` |
| 3 | Verify dashboard | Coin balance shows 1000 (first login) |
| 4 | Click "New Investigation" | `/game/new` shows three difficulty cards |
| 5 | Pick Easy (50 coins) | Spinner → redirects to `/game/[sessionId]`; balance 950 |
| 6 | Verify case file | Victim, suspects (3 for easy), crime scene description visible |
| 7 | Click a suspect | Right panel switches to interrogation chat |
| 8 | Ask 3 questions | Each returns in <10s, in-character; conversation history visible |
| 9 | Request hint | Subtle nudge appears; second hint button → "already used" |
| 10 | Make accusation | Modal opens; pick a suspect; submit |
| 11 | Verdict reveal | Typewriter narrative; coin balance updates |
| 12 | Repeat for Medium and Hard | All three difficulties work end-to-end |

### Step 3 — Edge cases
Test each scenario explicitly. Each should fail gracefully with a clear message.

- [ ] **Insufficient coins** — drain balance below 50, try to start an Easy case → expect 400 with `InsufficientCoinsError` message in UI.
- [ ] **Timer expiry** — start a case, wait for timer to hit 0 → expect "TIME'S UP" overlay → auto-redirect to result page → registers as loss in DB.
- [ ] **Double hint** — call `/hint` twice for the same session → second call returns 400.
- [ ] **Stale session navigation** — finish a case, manually navigate back to `/game/[sessionId]` → redirects to `/dashboard`.
- [ ] **Cross-user access** — try to load another user's session ID → expect 404 (`SessionNotFoundError`).
- [ ] **Empty question** — submit blank interrogation question → DTO validation rejects with 400.
- [ ] **Question >500 chars** — DTO validation rejects.
- [ ] **JWT expiry** — manually set token to expired value → next API call returns 401 → frontend redirects to `/`.
- [ ] **Malformed Gemini response** — temporarily break the JSON parser → confirm error path; restore.

### Step 4 — Backend invariants (manual SQL verification)
After each test scenario, query Postgres to verify state:

```sql
-- After a winning Easy game:
SELECT id, coin_balance FROM users WHERE id = '<user_id>';
-- Expect: 1000 - 50 + 100 = 1050

SELECT id, status, hint_used, accused_suspect_id, ended_at FROM game_sessions WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 5;
-- Expect: latest session status = 'won', ended_at IS NOT NULL

SELECT COUNT(*) FROM interrogation_turns WHERE game_session_id = '<session_id>';
-- Expect: number of questions you asked
```

Verify **no private case fields** appear in any HTTP response — open Network tab, inspect every response body.

### Step 5 — API contract drift check
Open browser DevTools → Network tab during a full play. Verify:
- `/case/start` response shape matches `StartCaseResponse` (`sessionId`, `case`, `coinBalance`, `expiresAt`).
- `/case/:id` response shape matches `GameSession` (`sessionId`, `case`, `status`, `hintUsed`, `expiresAt`).
- `/interrogate`, `/hint`, `/verdict` response shapes match their typed interfaces.

### Step 6 — Browser matrix
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop, if Mac available)
- [ ] Mobile Chrome / Safari — verify left/right panel toggle works on small screens.

### Step 7 — Cost check
- After each play, note the time and check the Gemini console for token usage.
- Estimate cost per game: ~1 case-gen call + ~10–20 interrogation calls + 0–1 hint + 1 verdict = roughly $0.02–0.05 per Easy game on `gemini-1.5-flash`.
- If it trends higher, see Phase 7 "prompt tightening".

---

## Done

_(Update as you complete each scenario. Use checkboxes above. Add notes here for anything surprising.)_

---

## Pending

All of Step 1 through Step 7. This phase blocks Phase 7 (don't polish what isn't working).

---

## Acceptance criteria

- [ ] Golden path completes on all three difficulties.
- [ ] Every edge case in Step 3 fails gracefully with a user-readable message.
- [ ] Database state matches expected values after each scenario in Step 4.
- [ ] No private case fields visible in any network response (Step 5).
- [ ] App is usable on both desktop and mobile (Step 6).
- [ ] Spend per game is within budget (Step 7).
- [ ] Update [COST_LOG.md](../COST_LOG.md) with actual spend after a few plays.

---

## Bug log

_(Add bugs as you find them, with file paths. Move to "fixed" when patched.)_

### Found

_(none yet)_

### Fixed
- `key_clues` was being sent to the client in `sanitizeCase` — fixed in [backend/src/case/case.service.ts](../backend/src/case/case.service.ts).
- Verdict service threw `SuspectNotFoundError` on blank `accusedSuspectId` (timer expiry) — fixed to register as automatic loss.
- API contract drift: backend returned `publicCase`, frontend expected `case`; backend `getSession` returned a nested `{ session, publicCase }` instead of a flat shape; status enum was `'solved'/'failed'` in frontend types vs `'won'/'lost'` on backend. All three reconciled.
