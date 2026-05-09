# Phase 1 — Foundation

**Status:** DONE
**Goal:** Stand up the monorepo, install both frameworks, define the database schema. Nothing ships in this phase — it's the floor everything else stands on.

---

## Plan

1. Initialize pnpm workspace at the repo root with two packages: `frontend/`, `backend/`.
2. Scaffold a NestJS 10 backend with TypeScript, Sequelize, Postgres, JWT, Passport, Gemini SDK, class-validator wired in `package.json`.
3. Scaffold a Next.js 15 frontend with App Router, Tailwind, and a custom dark noir colour palette.
4. Define three Sequelize models: `User`, `GameSession`, `InterrogationTurn`.
5. Write three Sequelize migrations matching those models.
6. Add a typed exceptions file and a logger wrapper for the backend.
7. Pin environment variable contracts via `.env.example` files.

---

## Done

### Monorepo root
- [package.json](../package.json) — workspace scripts (`pnpm dev` runs both via concurrently).
- [pnpm-workspace.yaml](../pnpm-workspace.yaml) — declares `frontend/` and `backend/`.
- [.gitignore](../.gitignore) — node_modules, dist, .env, .next, .DS_Store, coverage.

### Backend scaffold
- [backend/package.json](../backend/package.json) — NestJS 10, @nestjs/sequelize, @nestjs/jwt, @nestjs/passport, passport-google-oauth20, passport-jwt, @google/generative-ai, class-validator, sequelize-cli.
- [backend/tsconfig.json](../backend/tsconfig.json) + [tsconfig.build.json](../backend/tsconfig.build.json) — ES2021, decorators on, source maps.
- [backend/nest-cli.json](../backend/nest-cli.json)
- [backend/.sequelizerc](../backend/.sequelizerc) + [backend/src/db/config.js](../backend/src/db/config.js) — sequelize-cli paths and dev/prod DB config.
- [backend/.env.example](../backend/.env.example) — DB_*, GOOGLE_*, JWT_*, GEMINI_API_KEY, FRONTEND_URL, PORT.

### Frontend scaffold
- [frontend/package.json](../frontend/package.json) — Next 15, React 19, Tailwind, lucide-react, clsx, tailwind-merge.
- [frontend/tsconfig.json](../frontend/tsconfig.json) — `@/*` path alias.
- [frontend/next.config.ts](../frontend/next.config.ts), [tailwind.config.ts](../frontend/tailwind.config.ts), [postcss.config.js](../frontend/postcss.config.js).
- [frontend/src/app/globals.css](../frontend/src/app/globals.css) — noir palette CSS variables, custom scrollbar, typewriter keyframe.
- [frontend/.env.example](../frontend/.env.example) — `NEXT_PUBLIC_API_URL`.

### Database layer
- [backend/src/db/db.module.ts](../backend/src/db/db.module.ts) — global module; `SequelizeModule.forRootAsync` with `synchronize: false` (migrations only).
- [backend/src/db/models/user.model.ts](../backend/src/db/models/user.model.ts) — UUID PK, googleId unique, coinBalance default 1000, hasMany GameSessions.
- [backend/src/db/models/game-session.model.ts](../backend/src/db/models/game-session.model.ts) — JSONB caseData, ENUM difficulty/status, belongsTo User, hasMany InterrogationTurns.
- [backend/src/db/models/interrogation-turn.model.ts](../backend/src/db/models/interrogation-turn.model.ts) — belongsTo GameSession, only `createdAt`.
- [backend/src/db/migrations/20260507000001-create-users.js](../backend/src/db/migrations/20260507000001-create-users.js)
- [backend/src/db/migrations/20260507000002-create-game-sessions.js](../backend/src/db/migrations/20260507000002-create-game-sessions.js)
- [backend/src/db/migrations/20260507000003-create-interrogation-turns.js](../backend/src/db/migrations/20260507000003-create-interrogation-turns.js)

### Common infrastructure
- [backend/src/common/errors/game.exceptions.ts](../backend/src/common/errors/game.exceptions.ts) — `InsufficientCoinsError`, `HintAlreadyUsedError`, `SessionNotFoundError`, `SessionNotActiveError`, `SessionExpiredError`, `SuspectNotFoundError`.
- [backend/src/common/logger/app-logger.service.ts](../backend/src/common/logger/app-logger.service.ts)
- [backend/src/main.ts](../backend/src/main.ts) — CORS to `FRONTEND_URL`, global `ValidationPipe` (whitelist + transform), listens on `PORT` (default 3001).

---

## Pending

Nothing in this phase. Move to Phase 2.

---

## Acceptance criteria

- [x] `pnpm install` from root resolves both workspaces.
- [x] All three migrations up cleanly against a fresh Postgres database.
- [x] `pnpm --filter backend build` produces `dist/` with no TS errors.
- [x] `pnpm --filter frontend build` produces a Next.js build with no errors.
- [x] No secrets committed; all secrets read from env.
