# AI Murder Mystery Detective

## Stack
- Language: TypeScript 5.4
- Frontend framework: Next.js 15 App Router (React 19)
- Backend framework: NestJS 10 (Node 22) — lives in `backend/`
- DB: Neon PostgreSQL (serverless Postgres) via Sequelize ORM + Sequelize migrations
- Package manager: pnpm 9 (workspaces: `frontend/`, `backend/`)
- Auth: Google OAuth — handled by backend; JWT issued to frontend
- AI: Groq — model `llama-3.3-70b-versatile` (groq-sdk)
- UI: Tailwind CSS v3 + shadcn/ui (dark noir theme, CSS vars in `globals.css`)
- Audio: Web Audio API (procedural SFX + thunder); Web Speech API (TTS narration)
- Animations: framer-motion (AnimatePresence, spring physics, stagger)
- Deploy: Vercel (frontend) + Railway / Render (backend)

## Architecture (1 paragraph)
Frontend is a Next.js App Router SPA that talks exclusively to the NestJS backend over REST. The backend owns all business logic: Google OAuth callback issues a JWT, four AI-backed endpoints handle case generation, suspect interrogation, hint delivery, and verdict reveal. The full case JSON (including suspect private truths and the murderer's identity) is stored in Postgres per active session and **never sent to the frontend**. Coin state is transactional — all reads and writes go through `CoinService`. The countdown timer lives client-side; on expiry the frontend POSTs to `/verdict` which treats it as a loss. The TTS voice pipeline (Web Speech API) is entirely client-side — no server calls. Stats are tracked in `localStorage` under the key `detective_stats`. The 5 most important files are: `backend/src/case/case.service.ts`, `backend/src/verdict/verdict.service.ts`, `backend/src/ai/ai.service.ts`, `backend/src/coin/coin.service.ts`, `backend/src/db/models/game-session.model.ts`.

## Directory map
```
frontend/
  src/
    app/
      page.tsx              — Landing page (ScrambleText, EvidenceMarker, feature cards, marquee)
      dashboard/page.tsx    — Dashboard (stat cards, perf bars, difficulty bento, how-to)
      game/new/page.tsx     — Difficulty selector + case start
      game/[sessionId]/page.tsx  — Main game: timer, suspect list, interrogation chat
      result/[sessionId]/page.tsx — Verdict reveal with win/lose animation
    components/
      game/                 — case-file-book, countdown-timer, suspect-list,
                              interrogation-chat, hint-button, accusation-panel
      layout/               — navbar, coin-display
      ui/                   — noir-background (canvas), spinner, modal, button
    lib/
      api.ts                — Typed fetch wrapper (all backend calls go here)
      auth-context.tsx      — Google OAuth JWT context
      audio.ts              — Web Audio API: SFX + exported playThunderClap()
      audio-context.tsx     — React context exposing startAmbient/stopAmbient/SFX
      tts.ts                — Web Speech API: speak(), stop(), getCharacterVoice()
      types.ts              — Shared TypeScript interfaces (Suspect, Witness, GameSession…)
    hooks/
      use-tts.ts            — React hook wrapping tts.ts with reactive speaking state

backend/
  src/
    app.module.ts           — Root module (imports all feature modules)
    main.ts                 — Bootstrap, CORS, ValidationPipe, port 3001
    auth/                   — Google OAuth strategy, JWT strategy, AuthModule
    case/                   — POST /case/start, GET /case/:id, CaseService
    interrogate/            — POST /interrogate, InterrogateService
    hint/                   — POST /hint, HintService
    verdict/                — POST /verdict, VerdictService
    ai/                     — AiService wrapping Groq SDK + 4 prompt templates
      prompts/              — case-generation, interrogation, hint, verdict-reveal prompts
    coin/                   — CoinService (deduct/award, transactional)
    db/
      models/               — Sequelize model definitions (User, GameSession, etc.)
      migrations/           — Generated migration files (never edit by hand)
    common/
      errors/               — Typed error classes (game.exceptions.ts)
```

## Conventions
- Errors: throw typed errors from `backend/src/common/errors/game.exceptions.ts`. Never throw raw strings.
- Logging: use NestJS built-in `Logger` (`new Logger(ClassName.name)`). Never `console.log`.
- DB access: only inside feature service files (e.g. `backend/src/case/case.service.ts`). Controllers call services, never Sequelize directly.
- AI calls: only inside `backend/src/ai/`. Services call `AiService` methods, not the Groq SDK directly.
- Naming: services are `<domain>.service.ts` (kebab-case, NestJS convention, e.g. `case.service.ts`, `coin.service.ts`). DB tables are snake_case plural.
- Coin writes: always go through `CoinService.deduct()` / `CoinService.award()` — never update coins inline.
- Frontend API calls: always go through `frontend/src/lib/api.ts` — never raw `fetch` in components.
- TTS calls: always go through `frontend/src/lib/tts.ts` (`speak()`, `stop()`, `getCharacterVoice()`). Never call `window.speechSynthesis` directly in components.
- Audio SFX: always go through `frontend/src/lib/audio-context.tsx` (`useAudio()` hook). Never call `audio.ts` functions directly in components.
- CORS: backend allows only the frontend origin. Configured in `backend/src/main.ts`.
- Stats: client-side game stats are stored in `localStorage` under key `detective_stats` with shape `{ total, wins, easy: {t,w}, medium: {t,w}, hard: {t,w} }`. The result page writes; the dashboard reads. Guard against double-writes with `mm_stats_recorded_${sessionId}` key.
- MD hygiene: whenever you write or modify code, update the relevant MD files (CLAUDE.md, PHASES.md, the active phase doc) in the same step. Never leave docs describing a state that no longer matches the code.

## Build / test / deploy commands
- Install all: `pnpm install` (from repo root — installs both workspaces)
- Dev (both): `pnpm dev` (root script runs frontend + backend concurrently)
- Dev frontend only: `pnpm --filter frontend dev`
- Dev backend only: `pnpm --filter backend dev`
- Test: `pnpm --filter backend test`
- Lint: `pnpm lint`
- Build frontend: `pnpm --filter frontend build`
- Build backend: `pnpm --filter backend build`
- DB migrate: `pnpm --filter backend db:migrate`
- DB migration create: `pnpm --filter backend db:migration:create --name <name>`
- Deploy frontend: `vercel --prod` (from `frontend/`)
- Deploy backend: push to Railway / Render (auto-deploys from `backend/`)

## Things to NEVER do
- Never send suspect `private_truth`, `alibi_is_true`, or `will_crack_if` fields to the frontend.
- Never let coins drop below 0. `CoinService.deduct()` must throw `InsufficientCoinsError` if balance would go negative.
- Never write Sequelize queries outside feature service files (e.g. `backend/src/case/case.service.ts`).
- Never use raw SQL strings. Use Sequelize model methods.
- Never call the Groq SDK outside `backend/src/ai/`.
- Never add API routes to the Next.js `app/api/` folder — all API logic lives in the NestJS backend.
- Never commit secrets. Use `.env` in each workspace (gitignored). Production secrets go in Railway / Vercel env vars.
- Never edit `backend/src/db/migrations/` by hand. Generate via `pnpm --filter backend db:migration:create`.
- Never call `window.speechSynthesis` directly from a component — always use `tts.ts` exports.
- Never start ambient audio while the game page (`/game/[sessionId]`) is active — TTS voices must be clearly audible.

## Game rules (encode as invariants, not just docs)
- One hint per case. `HintService.requestHint()` must throw `HintAlreadyUsedError` if a hint was already issued for this game session.
- Coin costs: Easy = 50, Medium = 100, Hard = 200. Deducted at case start before generation.
- Coin rewards on WIN: Easy = 150, Medium = 300, Hard = 200. On loss: no reward, cost already deducted.
- Timer: Easy = 25 min, Medium = 35 min, Hard = 55 min. Timer starts CLIENT-SIDE after user clicks "Begin Investigation" in the CaseFileBook. Auto-submit on expiry counts as a loss.
- Suspects & Witnesses: AI generates both in the `suspects` array. Suspects have `role: 'suspect'`, witnesses have `role: 'witness'`. `sanitizeCase` splits them into separate `suspects` and `witnesses` arrays in the public response. Both carry a `gender: 'male' | 'female'` field for TTS voice selection.
- Case diversity: `buildCaseGenerationPrompt` picks a random setting from 24+ options and enforces culturally diverse, non-generic character names.
- Starter balance: 1 000 coins granted on first Google login only.

## Voice / audio architecture
- **Ambient audio** (`audio.ts` + `audio-context.tsx`): Web Audio API engine. `startAmbient()` warms up the AudioContext only — no rain or wind layers. Thunder is canvas-synced: `NoirBackground` calls `playThunderClap()` (exported from `audio.ts`) 0.8–3.5 s after each lightning flash.
- **Background music** (`audio-context.tsx` → `frontend/public/music/mystery-thriller.mp3`): a looping HTMLAudioElement managed by `AudioProvider`. Plays on the landing / dashboard / `/game/new` pages. Volume hardcoded at `0.32` so it never overpowers TTS or SFX. **Stopped on mount** of `/game/[sessionId]` (alongside ambient) so suspect voices stay clearly audible, and **resumed on unmount** when the user returns to the dashboard or result page. The mute button in the header also pauses/resumes music. Browsers block autoplay until first user interaction — `AudioProvider` waits for the first `click`/`keydown` then starts both ambient and music; `play()` rejections are silently swallowed.
- **SFX** (`audio.ts`): click, hover, send, receive, coin, win, lose, timerWarning — all procedurally generated, played through master gain node.
- **TTS output** (`tts.ts`): Web Speech API. `getCharacterVoice(name, role, gender?)` selects gender-specific browser voices (`getBestFemaleVoice()` / `getBestMaleVoice()`) and applies deterministic pitch/rate from a djb2 hash of the character's name. Volume is hardcoded at 1.0. The game page mutes ambient (`stopAmbient()`) so TTS is always clearly audible.
- **Case file auto-narration**: `CaseFileBook` auto-fires `handleReadAll()` ~900 ms after mount (lets Firefox load voices). The `mm_case_file_autoplay` localStorage key (`'1'` default, `'0'` to opt out) is toggled from the file's top bar via the `Auto` button. The `Stop` button still mutes the current playback without changing the persistent preference.
- **Voice INPUT (speech-to-text)** (`interrogation-chat.tsx`): browser-native `window.SpeechRecognition` / `webkitSpeechRecognition` (no API key, no server cost). Mic button next to the chat input transcribes speech into the input field as the user speaks. Hidden on browsers without API support (e.g. Firefox). Auto-stops on send, on unmount, and when TTS playback starts to avoid feedback. Errors surface as a small crimson hint above the input (`'Microphone access denied'`, `'No speech detected'`, …).

## Layout / scrolling architecture
- **`<body>` is fixed-height** (`h-[100dvh] overflow-hidden flex flex-col`) — the page itself never scrolls.
- The inner z-10 wrapper and `<main>` use `flex-1 min-h-0` so flex children can shrink below their natural content size.
- **Each page chooses its own scroll behaviour:**
  - `dashboard`, `result`, `game/new`, landing → `overflow-y-auto` on their own root (page can scroll if content overflows).
  - `game/[sessionId]` → `overflow-hidden` everywhere; only the chat's internal messages container scrolls (`InterrogationChat`'s `<div className="flex-1 overflow-y-auto …">`). The suspect list also scrolls independently. The page itself, the header, the case-info bar and the accusation button all stay anchored regardless of conversation length.
- Never re-introduce `min-h-[100dvh]` on a page root — that would let the page grow taller than the viewport and re-introduce the "whole page scrolls when chat is long" bug.

## Open questions / known weirdness
- Crime scene image generation is async and may be slow — the UI shows a placeholder while it loads. This is intentional; do not add a blocking await.
- Hint phrasing must always be first-person ("Something about X doesn't sit right..."). If Claude returns a third-person hint, retry once then log a warning.
- `window.speechSynthesis.getVoices()` returns an empty array until `onvoiceschanged` fires on Firefox — the voice caches in `tts.ts` handle this gracefully by returning `null` and falling back to the default voice.
- `localStorage` stats only accumulate from sessions played in the current browser. Cross-device sync is out of scope.

## Useful sub-files
- `SPEC.md`             — full project spec, acceptance criteria, demo plan
- `PROMPT_LOG.md`       — prompts that worked, prompts that didn't, workflow patterns
- `COST_LOG.md`         — daily spend tracking
- `DEMO_SCRIPT.md`      — 5-minute demo run-of-show
- `SCORECARD.md`        — judges' scoring rubric + self-assessment
- `VOICE_FEATURES.md`   — detailed TTS implementation plan and status
- `PHASES.md`           — phased build plan with status tracking
- `frontend/.env.example`  — required frontend env vars
- `backend/.env.example`   — required backend env vars
