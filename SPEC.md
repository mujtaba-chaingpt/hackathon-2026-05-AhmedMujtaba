# AI Murder Mystery Detective

> Live demo → **[hackathon-2026-05-ahmed-mujtaba-eta.vercel.app](https://hackathon-2026-05-ahmed-mujtaba-eta.vercel.app)**

## What it is (1 sentence)
An AI-driven web game where the player interrogates suspects in natural language to solve a uniquely generated murder mystery before time runs out — with full voice in and voice out, gender-aware character voices, and a real coin economy.

## Track
[ ] Internal Tool   [ ] Fintech Mini-App   [ ] Crypto/Web3   [x] Free-form

## Target user (1 sentence)
Casual gamers and fans of detective fiction who enjoy mystery novels, films, or board games like Clue.

## The user's job-to-be-done (1 sentence)
Piece together who committed the murder — and why — purely through smart questioning, observation, and reasoning, with no hand-holding.

## Production URLs
| Service | URL |
| --- | --- |
| Frontend (Vercel) | `https://hackathon-2026-05-ahmed-mujtaba-eta.vercel.app` |
| Backend (Railway) | `https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app` |
| Health check | `https://hackathon-2026-05-ahmedmujtaba-production.up.railway.app/health` → `{"status":"ok"}` |

---

## Must-have features (all IMPLEMENTED ✅)
1. **Google Auth + Coin Economy** ✅ — User logs in with Google, receives 1 000 starter coins on first login, cannot play without auth, coin balance is persisted in Postgres and is **transactional** (atomic deduct/award via `CoinService` — never goes below zero).
2. **Case Generation (Easy / Medium / Hard)** ✅ — Selecting a difficulty spends coins (50 / 100 / 200), Groq generates a unique case file (victim, crime scene, 3–6 suspects, 2–3 witnesses) from a pool of 24 diverse settings with culturally varied character names. Each suspect/witness carries a `gender` field for voice selection. Timer starts client-side after the player reads the case file (25 / 35 / 55 minutes).
3. **Natural-Language Suspect Interrogation** ✅ — Player types or speaks any question to any suspect/witness; characters respond in a consistent voice reflecting their private truth, secrets, and personality. The full case JSON is injected into every Groq prompt server-side; private fields (`private_truth`, `alibi_is_true`, `will_crack_if`, `murderer_id`) are sanitised out of every response sent to the frontend.
4. **Hint System** ✅ — One hint per case; returns a subtle first-person nudge ("Something about Maria's alibi doesn't sit right…"); `HintAlreadyUsedError` thrown on a second request even under race conditions.
5. **Accusation & Reveal** ✅ — Player selects a suspect and submits; backend returns `correct`, AI-written `reveal` narrative, `coinBalance`, `coinsEarned`, and the actual `murdererName` + `accusedName`. Timer expiry auto-submits as a loss. Stats are written to `localStorage` once per session (guarded by `mm_stats_recorded_${sessionId}`).

---

## Nice-to-have status
- [x] **Text-to-speech playback** — IMPLEMENTED. Per-page case file narration + full case briefing + per-character voice in interrogation. Gender-aware voice selection (`getBestFemaleVoice()` / `getBestMaleVoice()`). Deterministic per-character pitch (djb2 hash of name). All via Web Speech API — zero cost, zero API keys.
- [x] **Auto-narrated case file on open** — IMPLEMENTED. `CaseFileBook` auto-fires `handleReadAll()` ~900 ms after mount; persisted opt-out via `mm_case_file_autoplay` localStorage flag with an `Auto` toggle in the file's top bar.
- [x] **Voice INPUT (speech-to-text)** — IMPLEMENTED. Free Web Speech Recognition (`window.SpeechRecognition` / `webkitSpeechRecognition`). Microphone button in the chat input transcribes detective questions live; auto-stops on send, on unmount, and when TTS playback starts. Hidden gracefully on browsers without the API.
- [x] **Cinematic background score** — IMPLEMENTED. Looping mystery-thriller track plays on landing / dashboard at volume 0.32. **Goes silent the moment the player clicks "Begin Investigation"** (covers the cinematic generation overlay) and stays silent through the entire game session so suspect TTS voices stay clear; resumes on return to dashboard.
- [x] **First-time onboarding tour** — IMPLEMENTED. `components/onboarding/onboarding-tour.tsx` — 5-slide skippable modal with step indicator, framer-motion staggered transitions; mounts once on `/dashboard`, persisted via `mm_onboarded_v1` localStorage key.
- [x] **Murderer name reveal** — IMPLEMENTED. The result page renders a stamped "CLASSIFIED" dossier card showing the actual killer's name regardless of win/lose, with a contextual subtitle that differs by outcome.
- [x] **Detective rank progression** — IMPLEMENTED. Cadet → Junior Detective → Detective → Inspector → Chief Inspector with a live "Path to next rank" progress bar on the dashboard.
- [x] **Pixel-perfect dashboard** — IMPLEMENTED. Compressed Detective Profile / Operating Budget / Performance / Case Catalogue / Investigation Protocol layout fits a 1080p viewport without a scrollbar.
- [x] **Layout invariant** — IMPLEMENTED. `<body>` is fixed at `h-[100dvh] overflow-hidden`; only inner containers scroll (chat scrolls in place, page never moves).
- [x] **Premium font pairing** — IMPLEMENTED. Cinzel (display, Roman-inscription serif), Cormorant Garamond (body, editorial italic), Outfit (sans/UI grotesk), JetBrains Mono (mono labels) — wired through Next/font + Tailwind CSS variables.
- [x] **PostHog analytics** — IMPLEMENTED. 19 typed events covering the full funnel from `sign_in_clicked` to `verdict_result` and `play_again_clicked`. Identity set on every session load via `phIdentify(user.id, …)`, reset on logout. Autocapture disabled (only explicit events). Dev builds opt out automatically so test plays don't pollute prod data.
- [x] **Sentry error monitoring** — IMPLEMENTED. Backend-side via `@sentry/node` + global `SentryExceptionFilter`. Skips 4xx (user errors); captures 5xx with authenticated user, request method/URL/body, and `http.status` tag attached via `Sentry.withScope()`. Disabled when `SENTRY_DSN` is unset, so local dev is silent.
- [x] **End-to-end tests** — IMPLEMENTED. 40 Playwright tests across 6 suites running against the live Vercel deployment: landing, auth callback, API health, authenticated flows, responsive UI (5 viewports), and API contract.
- [ ] Crime scene image generated by AI — not yet implemented (placeholder shown — async, non-blocking).
- [ ] Leaderboard of fastest solves — out of scope for hackathon.
- [ ] Cross-device stats sync — out of scope (stats live in `localStorage` keyed `detective_stats`).

---

## Tech stack
| Layer | Choice |
| --- | --- |
| Backend | TypeScript 5.4 + NestJS 10 (Node 22) |
| DB | Neon Postgres (serverless) via Sequelize ORM + Sequelize migrations |
| Frontend | Next.js 16 App Router (React 19) + Tailwind CSS v3 + shadcn/ui |
| Fonts | Cinzel + Cormorant Garamond + Outfit + JetBrains Mono (via Next/font) |
| Auth | Google OAuth handled by NestJS; JWT issued to frontend (Authorization: Bearer) |
| AI | Groq — model `llama-3.3-70b-versatile` (groq-sdk, server-side only) |
| Audio | Web Audio API (procedural SFX + canvas-synced thunder); Web Speech API (TTS + STT); HTMLAudioElement (looping mystery-thriller score) |
| Animations | framer-motion (spring physics, AnimatePresence, stagger orchestration) |
| Analytics | PostHog (`posthog-js`, 19 typed events, autocapture off, dev opt-out) |
| Errors | Sentry (`@sentry/node`, custom NestJS exception filter, 5xx-only) |
| E2E tests | Playwright 1.59 (`e2e/` directory, 40 tests, 6 suites, runs against live URL) |
| Package manager | npm (per workspace — `frontend/`, `backend/`, `e2e/` standalone) |
| Deploy | Vercel (frontend), Railway (backend + Postgres connection), GitHub auto-deploys on push to `main` |

---

## Architecture (5 lines max)
Frontend is a Next.js App Router SPA (Tailwind dark noir theme) that talks exclusively with the NestJS backend over REST.
NestJS owns all logic: Google OAuth → JWT, four Groq-backed modules (case, interrogate, hint, verdict), and a transactional `CoinService`.
Each suspect's `private_truth`, `alibi_is_true`, `will_crack_if`, and the `murderer_id` are stored server-side in Postgres per session — sanitised out of every response sent to the frontend.
Groq generates the full case JSON once at game start; each interrogation turn injects the full case context server-side — the frontend never holds private data, even briefly.
Production is observed end-to-end: PostHog on the frontend (19 typed events + identity), Sentry on the backend (5xx-only filter with user/request scope); 40 Playwright tests run against the live URL.

**Five most important files:**
- `backend/src/case/case.service.ts` — case lifecycle (start, get, sanitize)
- `backend/src/verdict/verdict.service.ts` — accusation, AI reveal, coin transaction
- `backend/src/ai/ai.service.ts` — Groq SDK wrapper + 4 prompt templates
- `backend/src/coin/coin.service.ts` — `deduct()` / `award()`, atomic
- `frontend/src/app/game/[sessionId]/page.tsx` — game loop UI (timer, suspects, chat, accusation)

---

## Out of scope
- Real-money coin purchases (coins are earned by play only).
- Multiplayer or co-op investigation.
- Mobile native app (web is fully responsive: 5 viewport sizes verified by Playwright).
- Cross-device stats sync (stats live in `localStorage`).

---

## Risks & mitigations
1. **AI response consistency** — Mitigated by storing the full case JSON server-side and injecting it into every Groq prompt. A suspect cannot contradict themselves across turns. Hint phrasing is enforced first-person via the prompt rules; if Claude returns third-person, retry once and log a warning.
2. **Cost blow-up** — Groq `llama-3.3-70b-versatile` is free-tier-friendly; no streaming. Each turn is a self-contained REST call. PostHog and Sentry are on free tiers with massive headroom.
3. **TTS voice quality** — Depends on the user's OS/browser voice list. Mitigated by a graceful fallback chain: gender-specific voice → neutral best voice → first available English voice.
4. **Image generation latency** — Crime scene image is async and non-blocking; the UI shows a placeholder while it loads.
5. **Production blind spots** — PostHog tracks the full funnel, Sentry catches 5xx in real time with authenticated user + request body context.

---

## Quality gates (all green at submission)
| Gate | Result |
| --- | --- |
| Backend `npm run build` | ✅ exit 0, zero TypeScript errors |
| Frontend `npm run build` | ✅ exit 0, all 6 routes prerendered/dynamic correctly |
| Backend `/health` | ✅ `{"status":"ok"}` 200 |
| Frontend live | ✅ HTTP 200 |
| Playwright public suite | ✅ 36/36 pass against live URL |
| Playwright authenticated suite (with `TEST_JWT`) | ✅ 40/40 pass |
| Bundle size | ✅ all routes prerendered statically except `/game/[sessionId]` and `/result/[sessionId]` (dynamic by design) |
| CORS | ✅ frontend origin only (no `*`) |
| Private data leakage | ✅ JSON.stringify of public case never contains `private_truth`, `alibi_is_true`, `will_crack_if`, or `murderer_id` (test 06 enforces) |

---

## How I'll demo it (5 minutes)
1. Open landing → atmospheric noir canvas with falling leaves, lightning, and canvas-synced thunder. Background music starts on first interaction. Click *Sign in with Google*.
2. OAuth → dashboard with the **first-time onboarding tour** (5 slides, skippable). Show the animated stat tiles, perf bars, Detective Badge progress.
3. Click *Choose Your Case* → difficulty page (the page fits without scrolling on a 720p laptop, all three CTAs are equal-height filled buttons). Pick **Medium** (100 coins). Music goes silent immediately.
4. Cinematic generation overlay → game page opens with the case file book auto-narrating. Click *Begin Investigation*. Open a suspect, ask one question by typing, ask the next using the **microphone button** (free Web Speech). Use the one hint.
5. *Make Accusation* → result page. Stamped "CLASSIFIED" dossier card reveals the actual murderer's name; AI writes the cinematic reveal in noir prose. Coins update; stats persist; tour-of-the-tour ends.

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the literal 5-minute script and [README.md](./README.md) for the developer overview.
