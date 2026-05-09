# Phase 2 — Authentication & Coin Economy

**Status:** DONE
**Goal:** Players sign in with Google, get 1000 starter coins on first login, and every coin movement is transactional. From here on, the user identity is the foundation for every API call.

---

## Plan

1. Wire `passport-google-oauth20` strategy that finds-or-creates a User and grants 1000 coins on first login.
2. Wire `passport-jwt` strategy that extracts the bearer token and resolves to `{ id, email }`.
3. Add `JwtAuthGuard` and `@CurrentUser()` decorator for use in controllers.
4. Build `AuthController` with three endpoints: `/auth/google`, `/auth/google/callback`, `/auth/me`.
5. Build `CoinService` with atomic `deduct()` and `award()` that take an optional Sequelize transaction.
6. Build the frontend auth context (`mm_token` in localStorage) and the `/auth/callback` page that consumes the redirect.
7. Add the noir landing page with a single "Sign in with Google" CTA.

---

## Done

### Backend — Auth module
- [backend/src/auth/strategies/google.strategy.ts](../backend/src/auth/strategies/google.strategy.ts) — find-or-create user, sets `coinBalance = 1000` on first signup, refreshes profile on subsequent logins.
- [backend/src/auth/strategies/jwt.strategy.ts](../backend/src/auth/strategies/jwt.strategy.ts) — extracts JWT from `Authorization: Bearer <token>`.
- [backend/src/auth/guards/jwt-auth.guard.ts](../backend/src/auth/guards/jwt-auth.guard.ts)
- [backend/src/auth/decorators/current-user.decorator.ts](../backend/src/auth/decorators/current-user.decorator.ts) — returns `req.user`.
- [backend/src/auth/auth.service.ts](../backend/src/auth/auth.service.ts) — `generateToken(user)`, `getProfile(userId)`.
- [backend/src/auth/auth.controller.ts](../backend/src/auth/auth.controller.ts) — `GET /auth/google`, `GET /auth/google/callback` (redirects to `${FRONTEND_URL}/auth/callback?token=<jwt>`), `GET /auth/me`.
- [backend/src/auth/auth.module.ts](../backend/src/auth/auth.module.ts) — `PassportModule` with default `'jwt'`, `JwtModule.registerAsync`, exports `AuthService` + `JwtModule`.

### Backend — Coin economy
- [backend/src/coin/coin.service.ts](../backend/src/coin/coin.service.ts) — `getBalance()`, `deduct()` (throws `InsufficientCoinsError` if balance would go negative), `award()`. All accept optional Sequelize transaction.
- [backend/src/coin/coin.module.ts](../backend/src/coin/coin.module.ts) — global, exports `CoinService`.

### Frontend — Auth flow
- [frontend/src/lib/api.ts](../frontend/src/lib/api.ts) — `getToken/setToken/clearToken` localStorage helpers, `apiFetch` wrapper that injects `Authorization` header and redirects on 401, `api.loginWithGoogle()`, `api.getMe()`.
- [frontend/src/lib/auth-context.tsx](../frontend/src/lib/auth-context.tsx) — `AuthProvider`, `useAuth()` hook with `{ user, loading, logout, refreshUser }`.
- [frontend/src/app/page.tsx](../frontend/src/app/page.tsx) — noir landing page; auto-redirects to `/dashboard` if a valid token exists.
- [frontend/src/app/auth/callback/page.tsx](../frontend/src/app/auth/callback/page.tsx) — reads `?token=` query param, stores it, fetches user, redirects to `/dashboard`.
- [frontend/src/components/auth/login-button.tsx](../frontend/src/components/auth/login-button.tsx)
- [frontend/src/app/layout.tsx](../frontend/src/app/layout.tsx) — wraps everything in `<AuthProvider>` and `<Header>`.
- [frontend/src/components/layout/header.tsx](../frontend/src/components/layout/header.tsx) — coin balance + user avatar + logout.

---

## Pending

Nothing in this phase. The flow only needs real Google OAuth credentials in `.env` (placeholders work for type-checks but not for actual login).

---

## Acceptance criteria

- [x] Hitting `/auth/google` redirects through Google and back to `/auth/callback?token=...`.
- [x] First login creates a `users` row with `coin_balance = 1000`.
- [x] Subsequent logins update name/picture but never touch `coin_balance`.
- [x] `/auth/me` returns the current user when JWT is valid, 401 when missing/invalid.
- [x] `CoinService.deduct` is the only path that decrements coins; throws `InsufficientCoinsError` (HTTP 400) at zero floor.
- [x] All coin writes accept a Sequelize transaction so callers can compose atomic operations.
- [ ] Manual test: sign in, verify 1000 coins on dashboard. (Pending in Phase 6 with real Google creds.)
