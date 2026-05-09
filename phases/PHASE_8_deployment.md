# Phase 8 — Deployment

**Status:** PENDING
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

_(Add live URLs here once deployed.)_

- Backend URL: _(pending)_
- Frontend URL: _(pending)_
- First deploy: _(date)_

---

## Pending

All of Steps 1–9. Don't start until Phase 6 passes locally (deploying broken code wastes Railway minutes).

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
