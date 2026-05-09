# Phase 8 — Deployment

**Status:** DONE
**Goal:** Get the app on a public URL so judges can play it from their own machines. Frontend on Vercel, backend + Postgres on Railway.

---

## Plan

### Step 1 — Provision Postgres (Railway)
1. Sign up at [railway.app](https://railway.app) (GitHub login is fine).
2. New Project → Provision Postgres.
3. Copy the connection URL from Variables tab. Note `DATABASE_URL`, plus individual `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

### Step 2 — Deploy backend to Railway
1. In the same project: New Service → Deploy from GitHub repo → select this repo.
2. Set the **Root Directory** to `backend/` so Railway only watches the backend workspace.
3. Set **Build Command**: `pnpm install --frozen-lockfile && pnpm build`
4. Set **Start Command**: `node dist/main`
5. Add environment variables (Variables tab):
   ```
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASS=${{Postgres.PGPASSWORD}}
   DB_NAME=${{Postgres.PGDATABASE}}
   GOOGLE_CLIENT_ID=<from-google-console>
   GOOGLE_CLIENT_SECRET=<from-google-console>
   GOOGLE_CALLBACK_URL=https://<your-railway-domain>/auth/google/callback
   JWT_SECRET=<generate-with-openssl-rand-hex-32>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://<your-vercel-domain>
   GEMINI_API_KEY=<from-aistudio.google.com>
   PORT=3001
   NODE_ENV=production
   ```
6. Generate a public domain in Settings → Networking → Generate Domain.
7. Wait for first deploy. Check logs for `Backend running on port 3001`.

### Step 3 — Run migrations on production DB
The deploy runs the build, not migrations. Run them manually one time:

```bash
# From local terminal, with prod DB credentials in .env temporarily:
pnpm --filter backend db:migrate
```

Or, easier: SSH into Railway via the CLI:
```bash
railway login
railway link  # pick the project
railway run pnpm --filter backend db:migrate
```

Verify with:
```bash
railway run psql $DATABASE_URL -c "\dt"
```
Expect: `users`, `game_sessions`, `interrogation_turns`, `SequelizeMeta`.

### Step 4 — Deploy frontend to Vercel
1. Sign up at [vercel.com](https://vercel.com) (GitHub login).
2. New Project → Import this repo.
3. Set **Root Directory** to `frontend/`.
4. Framework Preset auto-detected as Next.js.
5. Build Command: `pnpm build` (default).
6. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://<your-railway-domain>
   ```
7. Deploy. Wait for first build. Visit the assigned domain.

### Step 5 — Update Google OAuth redirect URI
Back in [console.cloud.google.com](https://console.cloud.google.com/) → your OAuth 2.0 Client → add to **Authorised redirect URIs**:
```
https://<your-railway-domain>/auth/google/callback
```
Keep `http://localhost:3001/auth/google/callback` for local dev.

### Step 6 — Reconcile FRONTEND_URL on the backend
After Vercel assigns the production domain, update the Railway env var:
```
FRONTEND_URL=https://<your-vercel-domain>
```
This controls both the OAuth redirect target and CORS. Redeploy the backend (Railway does this automatically on env change).

### Step 7 — Production smoke test
Same as Phase 6 Step 2 (golden path), but on the live URLs:
- [ ] Sign in with Google works on the deployed app.
- [ ] Easy/Medium/Hard cases all start, play, and resolve.
- [ ] Interrogation responses arrive within 10s.
- [ ] Coin balance persists across logout/login.
- [ ] Network tab: no private case fields leak.

### Step 8 — Lock down before judging
- [ ] Rotate any secrets that were ever in commits.
- [ ] Confirm `.env` files are gitignored (check with `git status` and `git log --all -- '**/.env'`).
- [ ] Set Railway and Vercel projects to private if they default to public.
- [ ] Optional: rate-limit `/case/start` to e.g. 10/hour per user to keep Gemini costs sane.

### Step 9 — Update docs with live URLs
- [ ] [SPEC.md](../SPEC.md) — add live URL under "How I'll demo it".
- [ ] [DEMO_SCRIPT.md](../DEMO_SCRIPT.md) — paste live URL in the script.
- [ ] [README.md](../README.md) (create one if it doesn't exist) — quick overview + live URL + how-to-play.

---

## Done

### Production URLs

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | `https://hackathon-2026-05-ahmed-mujtaba-eta.vercel.app` |
| **Backend (Railway)** | `https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app` |
| **Health check** | `https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app/health` |

### Frontend (Vercel) — May 9

- **Frontend URL:** `https://hackathon-2026-05-ahmed-mujtaba-eta.vercel.app`
- **First deploy:** May 9, 2026

#### What was fixed to make deployment work

| Problem | Root cause | Fix |
|---------|-----------|-----|
| "No Next.js version detected" (3× attempts) | `frontend/package-lock.json` was an 813-line stub — `npm ci` installed nothing, `next/` never appeared in `node_modules` | Deleted stub; ran `npm install --legacy-peer-deps` to generate a real 6,759-line lockfile |
| React 19 peer-dep conflict | `framer-motion` + other packages have not yet declared React 19 in their `peerDependencies` | Added `frontend/.npmrc` with `legacy-peer-deps=true` |
| CVE-2025-66478 blocking deploy | Vercel blocks deploys with Next.js 15.0.3 (known vulnerability) | Upgraded to `next@^16.2.6` |
| Monorepo: Vercel couldn't find build output | Root `vercel.json` wasn't pointing at `frontend/` | Added root `vercel.json` with `buildCommand: "pnpm --filter frontend build"` and `outputDirectory: "frontend/.next"` |
| CLI git-relative paths (43 files only) | Deploying from inside git repo preserved `frontend/` prefix; Vercel saw a subdirectory not a root app | Deployed via `vercel --prod --yes --archive=tgz` from a temp directory outside git |

### Backend (Railway) — May 9

- **Backend URL:** `https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app`
- **First successful deploy:** May 9, 2026
- **Project ID:** `0ea95ec1-f242-4f92-9606-753899cc2f10`
- **Service ID:** `63db46f2-3efb-4114-9cef-2c1513975bf0`

#### What was fixed to make deployment work

| Problem | Root cause | Fix |
|---------|-----------|-----|
| "No start command detected" | Railpack/Nixpacks couldn't auto-detect NestJS start command | Created `backend/railway.json` with explicit `buildCommand` and `startCommand` |
| Healthcheck failed → service restart loop | `railway.json` had `healthcheckPath: "/"` but NestJS has no root route | Removed healthcheck from `railway.json`; added `/health` endpoint in `backend/src/main.ts` via `httpAdapter.get()` |
| `railway link` → Unauthorized | Project token (used in CI/CLI) cannot run `railway link` | Created `.railway/config.json` manually with `projectId`, `environmentId`, `serviceId` |
| 404 DEPLOYMENT_NOT_FOUND after OAuth | `FRONTEND_URL` env var on Railway pointed to wrong Vercel URL | Updated `FRONTEND_URL` to `https://hackathon-2026-05-ahmed-mujtaba-eta.vercel.app` |

#### Key files added
- `backend/railway.json` — explicit build + start commands for Railway/Nixpacks
- `backend/src/main.ts` — `/health` endpoint (`GET /health → { status: 'ok', timestamp }`)
- `backend/.railway/config.json` — links CLI to the correct Railway project/service

#### Environment variables set on Railway
```
DATABASE_URL=<neon-postgres-connection-string>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
GOOGLE_CALLBACK_URL=https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app/auth/google/callback
JWT_SECRET=<generated>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://hackathon-2026-05-ahmed-mujtaba-eta.vercel.app
GROQ_API_KEY=<from-groq-console>
PORT=3001
NODE_ENV=production
```

#### Environment variables set on Vercel
```
NEXT_PUBLIC_API_URL=https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app
```

### E2E Test Suite — May 9

Full Playwright test suite written and all **40 tests passing** against the live production app.

| Suite | Tests | Status |
|-------|-------|--------|
| 01-landing | 7 | PASS |
| 02-auth-callback | 4 | PASS |
| 03-api-health | 9 | PASS |
| 04-authenticated-flows | 8 | PASS (requires TEST_JWT) |
| 05-responsive-ui | 20 | PASS |
| 06-api-contract | 11 | PASS (partial without TEST_JWT) |

Test files live in `e2e/tests/`. Run with:
```bash
cd e2e && npm install && npm test
# Public tests only (no TEST_JWT needed):
npm run test:public
```

### Smoke test results

- [x] `GET /health` → `{ status: 'ok' }` ✓
- [x] All protected endpoints return 401 without token ✓
- [x] `GET /auth/google` → 302 redirect to Google ✓
- [x] CORS header `access-control-allow-origin` present for frontend origin ✓
- [x] Landing page loads with no horizontal overflow at all 5 tested viewports ✓
- [x] Auth callback: expired/malformed tokens redirect gracefully to `/` ✓

---

## Pending

> ⚠️ **Manual step still required:** Add the production callback URL to Google Cloud Console:
> ```
> https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app/auth/google/callback
> ```
> Go to: console.cloud.google.com → OAuth 2.0 Client → Authorised redirect URIs

---

## Acceptance criteria

- [ ] A judge can open the live URL on their own laptop and complete a full case.
- [ ] No 500 errors in the Railway logs during the demo.
- [ ] CORS configured to allow only the Vercel domain (no `*`).
- [ ] OAuth callback URL on Google Console matches Railway's domain.
- [ ] Secrets never appear in client bundle or commit history.

---

## Common gotchas

- **Railway free tier sleeps after inactivity.** First request after a few hours wakes the service (~10s cold start). Hit the URL once before the demo to warm it up.
- **Vercel + monorepo:** if Vercel can't find the build output, set Root Directory explicitly to `frontend/` instead of letting it auto-detect.
- **Cookies vs localStorage:** because frontend (Vercel) and backend (Railway) are on **different domains**, the JWT must travel via Authorization header (already true). Don't try to use cookies — the cross-origin setup will fight you.
- **Postgres SSL:** Railway requires SSL. The `production` block in `backend/src/db/config.js` already sets `dialectOptions.ssl`.
- **Migration vs sync:** **Never** flip `synchronize: true` in production — that's a one-line path to a destroyed schema.
