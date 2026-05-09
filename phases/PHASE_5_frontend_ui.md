# Phase 5 — Frontend UI

**Status:** DONE
**Goal:** Build every page and component the player touches. Six pages, twelve components, all dressed in noir.

---

## Plan

1. Define a typed `api.ts` client that mirrors every backend endpoint and centralises JWT handling + 401 redirects.
2. Build a noir landing page that auto-redirects authenticated users to `/dashboard`.
3. Auth callback page — reads `?token=`, persists it, redirects.
4. Dashboard — coin balance + "New Investigation" CTA + how-to-play.
5. Difficulty selection — three cards (easy/medium/hard) with cost + suspect count + timer.
6. Game page — two-panel layout: case file + suspect list on the left, interrogation chat on the right; countdown timer, hint, accusation modal.
7. Result page — verdict reveal with typewriter animation.
8. Layout primitives — Header, Card, Button, Modal, Spinner.
9. Game-specific components — CountdownTimer, CaseFile, SuspectList, InterrogationChat, HintButton, AccusationPanel.
10. Apply the noir palette consistently: `#0a0a0a` background, `#b8960c` gold accent, serif headlines.

---

## Done

### Lib
- [frontend/src/lib/types.ts](../frontend/src/lib/types.ts) — `User`, `Suspect`, `PublicCase`, `GameSession`, `InterrogationMessage`, `VerdictResult`, `Difficulty`, `DIFFICULTY_INFO` constants.
- [frontend/src/lib/api.ts](../frontend/src/lib/api.ts) — typed wrapper for all 7 endpoints, JWT in localStorage under `mm_token`, 401 → redirect to `/`.
- [frontend/src/lib/auth-context.tsx](../frontend/src/lib/auth-context.tsx) — `AuthProvider`, `useAuth()`.

### Pages
- [frontend/src/app/layout.tsx](../frontend/src/app/layout.tsx) — root layout, AuthProvider, Header.
- [frontend/src/app/page.tsx](../frontend/src/app/page.tsx) — noir landing.
- [frontend/src/app/auth/callback/page.tsx](../frontend/src/app/auth/callback/page.tsx) — token consumer (Suspense-wrapped for `useSearchParams`).
- [frontend/src/app/dashboard/page.tsx](../frontend/src/app/dashboard/page.tsx) — coin balance, CTA, difficulty preview.
- [frontend/src/app/game/new/page.tsx](../frontend/src/app/game/new/page.tsx) — three difficulty cards; affordability gating.
- [frontend/src/app/game/[sessionId]/page.tsx](../frontend/src/app/game/[sessionId]/page.tsx) — main game; mobile tab toggle for case-file vs interrogation.
- [frontend/src/app/result/[sessionId]/page.tsx](../frontend/src/app/result/[sessionId]/page.tsx) — typewriter reveal; reads `result_${sessionId}` from sessionStorage.

### Components — UI primitives
- [frontend/src/components/ui/button.tsx](../frontend/src/components/ui/button.tsx) — variants: default (gold), destructive, outline, ghost; sizes sm/md/lg.
- [frontend/src/components/ui/card.tsx](../frontend/src/components/ui/card.tsx)
- [frontend/src/components/ui/modal.tsx](../frontend/src/components/ui/modal.tsx)
- [frontend/src/components/ui/spinner.tsx](../frontend/src/components/ui/spinner.tsx) — `Spinner` + `FullPageSpinner`.

### Components — Layout
- [frontend/src/components/layout/header.tsx](../frontend/src/components/layout/header.tsx)
- [frontend/src/components/layout/coin-display.tsx](../frontend/src/components/layout/coin-display.tsx)

### Components — Auth
- [frontend/src/components/auth/login-button.tsx](../frontend/src/components/auth/login-button.tsx)

### Components — Game
- [frontend/src/components/game/countdown-timer.tsx](../frontend/src/components/game/countdown-timer.tsx) — gold default → amber under 5min → red pulsing under 2min → calls `onExpire()` at zero.
- [frontend/src/components/game/case-file.tsx](../frontend/src/components/game/case-file.tsx) — police-report styling.
- [frontend/src/components/game/suspect-list.tsx](../frontend/src/components/game/suspect-list.tsx) — selected card gets gold border.
- [frontend/src/components/game/interrogation-chat.tsx](../frontend/src/components/game/interrogation-chat.tsx) — auto-scroll, typing indicator, disabled while loading.
- [frontend/src/components/game/hint-button.tsx](../frontend/src/components/game/hint-button.tsx) — confirm step before spending; renders the hint as a styled card after.
- [frontend/src/components/game/accusation-panel.tsx](../frontend/src/components/game/accusation-panel.tsx) — irreversibility warning + dropdown.

### Theme
- [frontend/src/app/globals.css](../frontend/src/app/globals.css) — CSS variables, custom scrollbar, typewriter keyframe.
- [frontend/tailwind.config.ts](../frontend/tailwind.config.ts) — extended palette (background/surface/border/foreground/muted/accent/danger/success), serif + mono font stacks, fade-in/typewriter animations.

---

## Pending

Move to Phase 6 to actually run the app end-to-end and find the friction.

---

## Acceptance criteria

- [x] No raw `fetch` outside `lib/api.ts`.
- [x] Every protected page redirects to `/` if no auth.
- [x] Game page is responsive — left/right panels stack on mobile via tab toggle.
- [x] Timer expiry triggers `onExpire()` exactly once (guarded by `expireHandledRef`).
- [x] Verdict result is passed to `/result/[sessionId]` via sessionStorage; missing key redirects to dashboard.
- [x] All async actions show loading state; all errors surface visibly.
- [ ] Real walkthrough on desktop + mobile (Phase 6).
