# Daily Cost Log — Ahmed Mujtaba — AI Murder Mystery Detective

| Day | Spend (USD) | Sessions | Hours coding | $/hour | Notes |
| --- | ----------- | -------- | ------------ | ------ | ----- |
| Thu May 7 | ~$8–12 est. | 2–3 | ~10 | ~$1.00 | Backend foundation: NestJS modules, DB schema, Google OAuth, JWT, 4 AI endpoints, all four prompt templates, Sequelize models + migrations |
| Fri May 8 | ~$10–15 est. | 3–4 | ~10 | ~$1.20 | Frontend UI, full game loop wiring, TTS all 5 steps, gender-aware voices, noir theme, dashboard, landing page, voice INPUT (free Web Speech), background music, layout invariant fix |
| Sat May 9 | ~$14–22 est. | 6–7 | ~12 | ~$1.40 | Vercel deployment (3 attempts → root-cause lockfile stub), Railway backend deployment (3 attempts → `/health` endpoint + `railway.json`), Playwright E2E suite (40 tests, 6 suites), PostHog frontend (19 typed events), Sentry backend (global filter + Express handler), polish wave 2 (onboarding tour, font upgrade, murderer reveal, layout fixes), README.md, full MD doc refresh |
| **Total** | **~$32–49 est.** | 11–14 | **~32** | **~$1.30** | Well under $75/day soft cap; never approached $100/day hard cap |

**Soft cap:** $75/day. **Hard cap:** $100/day.

---

## Spend breakdown by feature area

| Feature | Claude calls | Avg tokens/call | Est. cost | Notes |
| ------- | ------------ | --------------- | --------- | ----- |
| Architecture / planning spike (plan mode) | ~3 | ~1 300 | ~$0.015 | Used before any code; locked the "private truth never reaches client" invariant |
| **Backend (NestJS)** | | | | |
| Backend code generation (5 NestJS modules) | ~15 | ~900 | ~$0.022 | auth, case, interrogate, hint, verdict, coin, ai |
| Backend `gender` field on case schema + sanitize | ~2 | ~700 | ~$0.002 | Drives gender-aware TTS voice selection on the frontend |
| Backend murderer-name reveal (verdict service returns `murdererName` / `murdererId` / `accusedName`) | ~1 | ~600 | ~$0.002 | Polish wave 2 — separates the literal answer from the AI narrative |
| **AI prompt engineering (server-side)** | | | | |
| Case generation prompt | 1 | ~2 200 | ~$0.008 | Groq llama-3.3-70b; full schema with `alibi_is_true`, `will_crack_if`, `private_truth` |
| Interrogation prompt | 1 | ~920 | ~$0.003 | Full case JSON injected server-side |
| Hint prompt | 1 | ~960 | ~$0.003 | First-person nudge, 2 sentences max |
| Verdict reveal prompt | 1 | ~1 400 | ~$0.005 | Cinematic noir narrative |
| **Frontend (Next.js)** | | | | |
| Frontend UI generation (pages + components) | ~30 | ~1 100 | ~$0.055 | Noir theme, game page, result page |
| Dashboard redesign (background agent) | 1 agent run | ~44 000 total | ~$0.050 | 16 tool uses, parallel execution while main session worked on audio |
| Dashboard pixel-perfect compression | ~3 | ~1 100 | ~$0.005 | Literal diff spec (Hero 26px, Detective Badge horizontal, etc.) |
| Landing page enhancements | ~5 | ~800 | ~$0.007 | Feature cards, marquee, crime tape |
| Case file CoverPage redesign (polaroid + classified stamp) | ~2 | ~1 200 | ~$0.005 | |
| Interrogation chat empty-state redesign | ~2 | ~1 100 | ~$0.005 | Sonar avatar + opening lines + brass send button |
| Suspect list refined to muted noir palette | ~2 | ~900 | ~$0.003 | Cream-bg dicebear avatars |
| Difficulty cards rewrite (equal heights, filled CTAs, 720p fit) | ~1 | ~1 400 | ~$0.005 | Polish wave 2 |
| Murderer reveal stamped dossier card on result page | ~1 | ~800 | ~$0.003 | Polish wave 2 |
| Onboarding tour (5 slides, framer-motion, localStorage persistence) | ~1 | ~1 800 | ~$0.006 | Polish wave 2 |
| Font upgrade — Cinzel + Cormorant Garamond + Outfit + JetBrains Mono | ~1 | ~700 | ~$0.002 | Polish wave 2 |
| **Audio & voice** | | | | |
| TTS engine + hooks (`tts.ts`, `use-tts.ts`) | ~8 | ~800 | ~$0.010 | |
| Gender-aware voice selection | ~4 | ~700 | ~$0.004 | |
| Audio engine (`audio.ts`) — noise-based thunder, rain removal | ~6 | ~700 | ~$0.007 | |
| Canvas background — 60 leaves, lightning, thunder sync | ~5 | ~1 000 | ~$0.008 | |
| Case file auto-narration (with `mm_case_file_autoplay`) | ~2 | ~900 | ~$0.003 | |
| Voice INPUT (free Web Speech Recognition) | ~2 | ~1 000 | ~$0.005 | |
| Background music (mystery-thriller score, route-aware on/off) | ~1 | ~900 | ~$0.004 | |
| Music silenced at "Begin Investigation" click (covers cinematic overlay) | ~1 | ~400 | ~$0.001 | Polish wave 2 |
| **Layout / UX hardening** | | | | |
| `<body>` fixed-viewport layout invariant | ~1 | ~700 | ~$0.003 | |
| **Observability** | | | | |
| **PostHog frontend integration** (19 typed events, identify/reset, route-aware page_view, autocapture off) | ~2 | ~1 600 | ~$0.008 | `lib/posthog.ts` + `providers/posthog-provider.tsx` + 6 page/component touch-points wired in one pass |
| **Sentry backend integration** (instrument.ts first-import, global `SentryExceptionFilter`, 4xx skip, 5xx scope with user/request, Express error handler) | ~2 | ~1 700 | ~$0.008 | NestJS-specific filter pattern via `APP_FILTER` and `HttpAdapterHost` injection |
| **Testing** | | | | |
| **Playwright E2E suite** — 40 tests across 6 suites, runs against live Vercel URL | ~3 | ~2 200 | ~$0.013 | 01-landing, 02-auth-callback, 03-api-health, 04-authenticated-flows, 05-responsive-ui (5 viewports × 4 checks), 06-api-contract |
| **Documentation** | | | | |
| MD file updates across all sessions | ~16 | ~1 400 | ~$0.034 | CLAUDE.md, PHASES.md, PHASE_8_deployment.md, VOICE_FEATURES.md, SPEC.md, PROMPT_LOG.md, SCORECARD.md, COST_LOG.md, DEMO_SCRIPT.md, REFLECTION.md, STANDUP.md, README.md (new) |
| **Vercel deployment debugging** | ~8 | ~900 | ~$0.012 | 3× "No Next.js version detected" diagnosis; 813-line lockfile stub fix; CVE-2025-66478 upgrade; `.npmrc` legacy-peer-deps; monorepo `vercel.json`; CLI temp-dir deploy with `--archive=tgz` |
| **Railway backend deployment** | ~5 | ~1 000 | ~$0.008 | "No start command detected" → explicit `railway.json` builder; healthcheck loop → `/health` endpoint via `httpAdapter.get()`; project-token auth (no `railway link`) → manual `.railway/config.json`; FRONTEND_URL mismatch → corrected after OAuth 404 |
| **`.gitignore` creation + git index clean-up** | ~2 | ~700 | ~$0.002 | Root, frontend, backend gitignores; `git rm --cached .claude/settings.local.json` |
| **Total (estimate)** | **~140 calls** | — | **~$0.36** | Direct Claude API spend; Groq runtime separate (free tier); PostHog/Sentry/Vercel/Railway free tiers |

**Model default:** claude-sonnet-4-6 (every session)
**Opus used:** Zero times for production code — Sonnet handled all architecture, all UI, all observability work; Opus was logged as an anti-pattern after one over-engineered card component on May 7.
**Background agents:** 1 — dashboard + landing rewrite in 265 s, 16 tool uses, ~$0.05.
**Custom skills consulted:** `design-taste-frontend`, `high-end-visual-design` (both global, applied to noir polish + font pairing decision).
**Workflow tools:** Plan mode (3×), parallel tool calls (every multi-file edit), background tasks for long-running deploys (Vercel + Railway).

> **Reconciliation between per-feature column and day totals:**
> The per-feature column above sums *direct prompt costs* — the literal request that produced a specific feature. Day-row totals also include exploratory plan-mode chats, multi-turn debugging conversations, MCP tool invocations (Vercel deploy MCP, Railway CLI wrapper, GitHub PR creation), and tool-use overhead that resists clean attribution. The $32–49 range is the realistic envelope for the full three-day build; the $0.36 per-feature sum is the floor.

---

## Groq API runtime cost (in-game AI calls — the player's bill, not the developer's)
On Groq's free tier these are **$0**. On the paid tier at ~$0.59/M tokens for `llama-3.3-70b-versatile`:
- Case generation: ~$0.002 per game
- Full interrogation session (10 turns): ~$0.030 per game
- Hint + verdict: ~$0.010 per game
- **Total per full game session: ~$0.04** (negligible even at scale)

---

## Voice runtime cost (TTS + STT)
**$0 ongoing.** Both run entirely in the user's browser via the Web Speech API:
- Output: `window.speechSynthesis` for case file narration, full briefing, suspect responses (gender-aware voice with deterministic per-character pitch).
- Input: `window.SpeechRecognition` / `webkitSpeechRecognition` for voice questions in the interrogation chat.
- No API keys, no servers, no per-call cost. Hidden gracefully on browsers without API support.

---

## Observability runtime cost
- **PostHog:** Free tier — 1 M events/month. We send ~30 events per full game session, so headroom is ~33 000 sessions/month at zero cost.
- **Sentry:** Free tier — 5 K errors/month. Filter discipline (4xx skipped) means only true server bugs hit the quota; expected usage <50/month.

---

## Hosting runtime cost
- **Vercel** (frontend) — Hobby tier: $0. Bandwidth and serverless are well within free limits for hackathon scale.
- **Railway** (backend) — $5/month starter credit; live usage <$2/month at current traffic.
- **Neon Postgres** — Free tier (0.5 GB). Game sessions average 8 KB each → ~65 K sessions before approaching the limit.

**All-in monthly hosting + observability for hackathon scale: ~$2/month.**

---

## Notes & lessons captured
- Track spend in real time via `claude /cost` or the Anthropic console.
- Switch all prompts to Sonnet (already default) and disable streaming previews if daily spend hits $75.
- At $100 hard cap, commit and stop for the day — no exceptions.
- Background agents are efficient: the dashboard agent did 16 tool calls and a full page rewrite in 265 s for ~$0.05. Default to them for any rewrite that touches >3 files.
- Always include the exact data schema in prompts when writing code that reads from another component's output (avoids format mismatches like the `{t,w}` vs `{total,wins}` incident — caught before deploy).
- A literal diff specification (old → new values per component) is consistently cheaper and more accurate than a stylistic prompt. The dashboard pixel-perfect compression cost ~$0.005 and landed in one pass.
- Opus is reserved for architectural decisions only. The single time it was used for a UI component, it produced ~5× the cost of Sonnet for an over-engineered output. Logged as an anti-pattern.
- Deployment debugging is more cost-efficient when you state the *symptom and observed root cause together*. The Vercel lockfile fix landed in one prompt after I included `wc -l package-lock.json` output (`813` lines vs the expected 6 K+).
- Adding `instrument.ts` as the first import of `main.ts` for Sentry — and **always** calling out import ordering as a hard requirement in the prompt — prevents subtle "Sentry is initialised but doesn't capture anything" silent failures.
- For PostHog in Next.js App Router, the provider must be wrapped in `<Suspense>` because `useSearchParams()` is asynchronous. Building once, getting a clear error, and asking Claude with the exact stack trace yielded a one-shot fix.
