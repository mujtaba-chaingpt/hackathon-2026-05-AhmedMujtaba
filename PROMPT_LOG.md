# Prompt Log — Ahmed Mujtaba — AI Murder Mystery Detective

> **22 prompts logged across 3 build days (May 7–9).** Entries 1–5 are the foundational
> backend prompts; 6–10 are the Friday voice/audio/visual polish wave; 11–15 are the
> Saturday UX hardening + deployment; 16–22 are the post-deployment observability,
> testing, and polish-wave-2 work. Each entry captures context, the literal prompt
> used, why it worked, output quality (1–5), the model, and the approximate cost.
> Three explicit anti-patterns are recorded under "Bottom 3 prompts that wasted time".

## Foundational prompts (May 7) — backend & AI

### 1. Full case generation in one shot
**Context:** I needed a single Claude call to produce a complete, internally consistent murder mystery — victim, crime scene, 3–6 suspects with private truths, one murderer, motive, and red herrings — ready to drive the whole game.
**Prompt:**
```
You are a murder mystery author. Generate a complete murder mystery case as a JSON object.

Difficulty: {{difficulty}}

The JSON must include:
- victim: { name, occupation, found_at, time_of_death, cause }
- crime_scene_description: string (2–3 vivid sentences)
- murderer_id: string (must match one suspect's id)
- motive: string
- how_it_was_done: string
- how_it_was_concealed: string
- suspects: array of {
    id, name, age, relationship_to_victim,
    private_truth: string,   // what ONLY they know — may be unrelated to murder
    alibi: string,           // what they'll claim publicly
    alibi_is_true: boolean,
    personality: string,     // e.g. "nervous, deflects with sarcasm"
    secrets: string[],       // non-murder secrets they'll protect
    will_crack_if: string    // what question or confrontation breaks them
  }
- key_clues: string[]
- red_herrings: string[]

For {{difficulty}}=hard, plant at least 2 red herrings and ensure the murderer has a perfect alibi that can be disproved only by cross-referencing two suspects.

Return ONLY valid JSON. No commentary.
```
**Why it worked:** Explicit schema with boolean `alibi_is_true` and `will_crack_if` fields gave the interrogation engine concrete rules without extra prompting. The difficulty injection kept the design contract clear.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx tokens / cost:** ~1 200 input / ~900 output ≈ $0.008

---

### 2. Stateful suspect interrogation with injected case context
**Context:** Each interrogation turn needed the suspect to stay consistent with their private truth across many questions, while never leaking the murderer directly.
**Prompt:**
```
You are {{suspect.name}}, {{suspect.age}}, {{suspect.relationship_to_victim}}.

Your personality: {{suspect.personality}}
Your alibi (what you claim publicly): {{suspect.alibi}}
Your alibi is actually {{suspect.alibi_is_true ? "true" : "false"}}.
Your private truth (never reveal directly): {{suspect.private_truth}}
Your secrets you will protect: {{suspect.secrets}}
You will crack and hint at the truth if: {{suspect.will_crack_if}}

The detective is questioning you. Respond in character — {{suspect.personality}}.
Never confess outright. If the detective hits {{suspect.will_crack_if}}, become visibly nervous or contradict yourself in a subtle way.
Keep answers under 4 sentences.

Conversation so far:
{{conversation_history}}

Detective says: "{{player_question}}"
```
**Why it worked:** Injecting the full suspect object (server-side only) gave Claude enough context to stay in character. The explicit crack condition created natural dramatic moments without hard-coding branching logic.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx tokens / cost:** ~800 input / ~120 output ≈ $0.003 per turn

---

### 3. Hint generation without spoiling the answer
**Context:** The hint system needed to nudge players without revealing the murderer — a tricky balance.
**Prompt:**
```
You are a detective's inner voice — a gut instinct, not a narrator.

Full case (do not reveal): {{case_json}}
Player's interrogation history so far: {{conversation_history}}

The player is stuck. Generate ONE hint — a subtle, first-person instinct that points toward something they may have missed.
Rules:
- Do NOT name the murderer.
- Do NOT quote evidence verbatim.
- Frame it as: "Something about [vague reference] doesn't sit right..."
- Max 2 sentences.
```
**Why it worked:** Persona framing ("inner voice") naturally constrained the output to stay vague. Hard rules prevented spoilers while the case JSON gave Claude enough context to make the hint genuinely useful.
**Output quality:** 4
**Model used:** Sonnet 4.6
**Approx tokens / cost:** ~900 input / ~60 output ≈ $0.003

---

### 4. Narrative verdict reveal
**Context:** After the player submits their accusation, the game reveals the full story as a cinematic noir closing scene.
**Prompt:**
```
Write the closing scene of a noir detective story.

Case facts: {{case_json}}
Player accused: {{accused_name}}
Player was: {{correct ? "correct" : "wrong"}}

Structure:
1. Open with the detective's realisation (1 paragraph).
2. Reveal the true sequence of events — motive, method, concealment (2 paragraphs).
3. Note which suspects were lying and why (1 paragraph).
4. Close with a single atmospheric line.

Tone: serious, cinematic, noir. No humour. Respect the reader's intelligence.
```
**Why it worked:** Tight structure + tone directive produced consistently strong narrative prose. The correct/wrong flag let Claude write two emotionally distinct versions without separate prompts.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx tokens / cost:** ~800 input / ~400 output ≈ $0.004

---

### 5. Plan-mode architecture spike before writing any code
**Context:** Before touching a line of code I used Claude Code plan mode to map out the full data model and API surface.
**Prompt:**
```
/plan

I'm building AI Murder Mystery Detective — see SPEC.md and idea.txt.

Design:
1. Postgres schema (all tables, columns, types, relations)
2. NestJS module surface (controller, service, DTO per feature)
3. Server-side session state shape for an active game
4. Where Groq AI calls happen and what data they need

Constraints: coins never go below 0. Private suspect truths never reach the client. One hint per case.
```
**Why it worked:** Running this before any code meant the architecture was locked before implementation started. Plan mode forced Claude to surface the "private truth never reaches client" invariant as a concrete data-flow constraint rather than a vague rule.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx tokens / cost:** ~600 input / ~700 output ≈ $0.005

---

## Polish wave 1 (May 8) — voice, audio, visual

### 6. Gender-aware TTS voice selection
**Context:** Characters needed to sound female or male using the browser's built-in voice list.
**Prompt:**
```
Add gender-aware voice selection to getCharacterVoice(name, role, gender?) in tts.ts.
Female characters should use getBestFemaleVoice() — scan the browser voice list for names
like "Google UK English Female", "Microsoft Zira", "Samantha", "Karen", "Moira", etc.
Male characters use getBestMaleVoice() — "Google UK English Male", "Microsoft George",
"Daniel", "Alex", etc. Both fall back to getBestVoice() if not found.
Use higher pitch range (1.05–1.25) for female, lower (0.85–1.12) for male.
Volume always 1.0. All three caches bust on onvoiceschanged.
```
**Why it worked:** Listing the exact voice names from different OS/browser combos let the code work on Windows/Mac/Chrome/Firefox without guessing. The cache pattern prevented repeated voice-list scans.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.004

---

### 7. Canvas-synced thunder (remove rain)
**Context:** User wanted silence except for thunder that fires exactly when a lightning flash appears on the canvas — not on a timer.
**Prompt:**
```
In audio.ts: remove startRain, startWind, scheduleWindSweep, scheduleThunder.
Make playThunderClap() a standalone exported function that calls getCtx() internally.
startAmbient() becomes a noop that just calls getCtx() to warm up the AudioContext.
In noir-background.tsx: import playThunderClap from @/lib/audio.
In triggerLightning(), add: setTimeout(() => playThunderClap(), 800 + Math.random() * 2700)
so thunder follows 0.8–3.5 s after the visual flash (simulates distance).
```
**Why it worked:** Making thunder entirely event-driven (canvas → audio) rather than timer-driven meant perfect sync. The 0.8–3.5 s delay range adds realism — far lightning takes longer.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.003

---

### 8. 55 scattered leaves across full screen
**Context:** Leaves were only spawning from the top and there were only 32 — the user wanted them "all over the place."
**Prompt:**
```
In createLeaf(), add optional initialY param for scatter positioning.
Increase leaf count from 32 to 55. On init, use Math.random() * (h + 200) - 100 for Y
so leaves start everywhere on screen, not just above the top edge.
Increase vx range to ±3.2, vy to 0.60–2.60, sizeW 14–36px. On respawn (y > h+60),
create new leaf from top as before.
```
**Why it worked:** The optional `initialY` parameter meant init scatter used real positions but respawn still came from the top, keeping the falling-leaves illusion intact. Wider velocity ranges created the "chaotic" feel the user wanted.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.002

---

### 9. localStorage stats with exact schema to match dashboard format
**Context:** Background agent wrote the dashboard expecting `{ easy: {t, w} }` but I was writing `{ by_difficulty: { easy: { total, wins } } }` — format mismatch caught before deploy.
**Prompt:**
```
The dashboard reads detective_stats from localStorage with shape:
{ total: number, wins: number, easy: {t, w}, medium: {t, w}, hard: {t, w} }
Update the result page stats writer to match this exact shape.
Guard against double-counting with a mm_stats_recorded_${sessionId} key.
Read the difficulty from mm_session_${sessionId} (written by the game page on load).
```
**Why it worked:** Specifying the exact existing schema before writing the writer prevented the format mismatch. The guard key pattern (write a flag after first save) prevents double-counts on page refreshes.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.002

---

### 10. Background agent for dashboard + landing page redesign
**Context:** Needed an animated stat panel on the dashboard and a visual landing page overhaul simultaneously — too much for one inline edit block.
**Prompt (sent to background agent):**
```
Redesign frontend/src/app/dashboard/page.tsx:
- Read detective_stats from localStorage (shape: { total, wins, easy:{t,w}, medium:{t,w}, hard:{t,w} })
- 4 animated stat cards (Total Cases, Solved, Failed, Win Rate%) using AnimatedNumber counting up via rAF
- Horizontal perf bars for Easy/Medium/Hard (framer-motion width from 0→%)
- Difficulty bento grid: cost prominently, reward top-right, colour-coded per difficulty
- How-to-play as numbered list with section dividers
- No emoji. Inline SVG icons only. Playfair Display serif headings, JetBrains Mono for numbers.
- Colour scheme: #060608 bg, #c9a227 accent, #9b2226 danger, #ede6d6 foreground

Also update frontend/src/app/page.tsx (landing page):
- Add three feature cards below CTA (AI Suspects, Voice Narration, 3 Difficulties)
- Crime-scene tape diagonal band at bottom
- Dossier number "CASE FILE #MMD-2026" top-left
- Scrolling marquee band (font-mono, opacity 0.15)
```
**Why it worked:** Giving the agent the exact localStorage schema (with `{t,w}` format) as part of the brief ensured it wrote the dashboard reader correctly from the start. Background execution meant the main session could continue with audio/voice/backend work in parallel.
**Output quality:** 5
**Model used:** Sonnet 4.6 (background agent, 16 tool uses, 44k tokens)
**Approx cost:** ~$0.05

---

## UX hardening pass (May 9) — voice input, layout, music, pixel-perfect dashboard

### 11. Free voice INPUT (speech-to-text) without any API key
**Context:** User wanted to ask questions by voice while keeping the app zero-cost.
**Prompt:**
```
Add voice input (speech-to-text) to the chat without any paid key.

Use the browser-native Web Speech API:
  const Ctor = (window.SpeechRecognition || window.webkitSpeechRecognition)
  rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US'
  rec.onresult = stream transcript into the input field
  rec.onend / onerror = clear listening state

Render a Mic button to the LEFT of the chat input only when supported (hide on Firefox).
Crimson pulsing ring while listening; "Listening..." placeholder.
Auto-stop on send, on unmount, and when TTS playback starts (so the mic doesn't pick up the suspect's voice).
Surface errors inline above the input: "Microphone access denied", "No speech detected".

Make sure this DOES NOT disturb the existing TTS output, the AccusationPanel,
or the case file auto-narration.
```
**Why it worked:** Pinning the exact `SpeechRecognition` API surface, listing the conflict points, and explicitly asking for graceful unsupported-browser hiding meant the agent wired everything in one pass with no regressions.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.005

---

### 12. Layout fix — only chat scrolls, never the page
**Context:** As soon as a few messages were sent, the entire game page became scrollable, dragging the navbar and case info bar out of view.
**Prompt:**
```
The game page scrolls the whole window when the chat gets long. Fix it so:
- The body is fixed at h-[100dvh] with overflow-hidden.
- Inner z-10 wrapper and <main> become flex-1 min-h-0 (NOT min-h-[100dvh]).
- Game session keeps overflow-hidden on every nested container so only the
  chat's messages div scrolls. The suspect list also scrolls independently.
- Other pages (dashboard, result, game/new, landing) get overflow-y-auto
  on their root so they can scroll if their own content overflows.

Verify with `npx tsc --noEmit` after edits.
```
**Why it worked:** Naming the exact CSS classes to swap and giving an audit list of every page that needs the new wrapper class meant zero ambiguity. Fix landed in five files with no spillover bugs.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.003

---

### 13. Background music with route-aware on/off
**Context:** Mystery-thriller score needed to play on landing/dashboard but go silent on the game session pages.
**Prompt:**
```
Add background music using public/music/mystery-thriller.mp3.
- Loop, volume 0.32 (never overpower TTS).
- Plays on: landing, dashboard, /game/new.
- Stops on mount of /game/[sessionId]; resumes on unmount.
- Wired through AudioProvider so the existing mute button pauses it too.
- Respect browser autoplay: only call play() after first user click/keydown,
  and silently swallow any play() promise rejection.
```
**Why it worked:** Specifying the exact volume (0.32) and naming the audio-provider integration upfront meant the agent didn't try to wire `<audio>` tags into individual pages. The mount/unmount contract on `/game/[sessionId]` mirrored the existing `stopAmbient`/`startAmbient` pattern, so the change was a clean delta.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.004

---

### 14. Dashboard pixel-perfect viewport fit
**Context:** Detective Profile card was being clipped at 1080p.
**Prompt:**
```
Compress every dashboard section so the layout fits 1080p with no scrollbar:
- Hero title 26px (was 34px)
- Operating Budget card: px-4 py-3, number 34px, no description paragraph
- Performance card: px-4 py-3, space-y-2.5
- Stat tiles: p-3, number text-[26px]
- Difficulty cards: p-3, number text-[20px], smaller icons
- Detective Badge: HORIZONTAL one-row layout (52px seal + rank + status),
  drop the separate stat row, keep only the progress bar
- Investigation Protocol: px-4 py-3, gap-y-1.5, step number 16px
- Page padding: py-3 sm:py-4, gap-3 (was py-5 / gap-4)
Keep the design language identical — only spacing and font-size deltas.
```
**Why it worked:** A literal diff specification (old → new values for each component). The agent didn't have to guess "how compact" — it just executed the table.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.005

---

### 15. Vercel deployment — monorepo config + lockfile repair
**Context:** Frontend was failing on Vercel with "No Next.js version detected" despite the project being a proper Next.js app.
**Root cause discovered:** `frontend/package-lock.json` was an 813-line stub. Vercel ran `npm ci`, nothing installed, `next/` never appeared in `node_modules`.
**Prompt approach:** I pasted the literal symptom + the line-count diagnosis (`wc -l package-lock.json` → 813 vs expected 6000+) and asked for a fix sequence. Claude returned the exact remediation in one pass:
```bash
rm frontend/package-lock.json
cd frontend && npm install --legacy-peer-deps    # regenerates 6 759-line real lockfile
echo "legacy-peer-deps=true" > .npmrc            # so future CI runs don't need the flag
npm install next@latest --legacy-peer-deps       # past CVE-2025-66478, Vercel blocks 15.0.3
                                                  # → resolves to ^16.2.6
# Deploy from temp dir outside git so git-relative paths don't preserve frontend/ prefix
cp -r frontend /tmp/mm-deploy-$(date +%s)
cd /tmp/mm-deploy-... && vercel --prod --yes --archive=tgz
```
**Why it worked:** Stating the symptom *and* the observed root cause together collapsed three potential debugging paths into one. The `--archive=tgz` flag uploads a flat tarball rather than using git-relative paths, so Vercel sees the Next.js root correctly.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.012 (multiple debug passes)

---

## Post-deployment work (May 9) — observability, testing, polish wave 2

### 16. PostHog frontend integration — typed event catalogue + Next.js App Router provider
**Context:** Needed product analytics covering the full funnel without polluting prod data with dev test plays.
**Prompt:**
```
project token: phc_oApF...
integrate posthog events on all main functionality of my app.
```
**Approach (what I asked for in turn-2 expansion):** Identify every meaningful user action in the app, define a typed event catalogue, wire phIdentify on auth, phReset on logout, and a route-aware page_view tracker. Disable autocapture (use only explicit events). Make dev builds opt-out automatically so test plays don't contaminate prod data. PostHogProvider must wrap the App Router tree, with `<Suspense>` because `useSearchParams()` is async.
**What landed:**
- `frontend/src/lib/posthog.ts` — typed `PhEvent` union (19 events), `phCapture()`/`phIdentify()`/`phReset()`/`phPageView()`/`initPostHog()` with `enabled: !!dsn` and `ph.opt_out_capturing()` in dev.
- `frontend/src/components/providers/posthog-provider.tsx` — Client Component, mounts a `PostHogPageTracker` that fires `$pageview` via `usePathname` + `useSearchParams`.
- 6 page/component touch-points wired with events: login button, auth callback (success/failure), auth context (identify/reset/logout), game/new (case_started, case_start_failed), game/[sessionId] (investigation_begun, suspect_selected, question_sent, answer_received, hint_requested, hint_received, accusation_panel_opened, verdict_submitted, timer_expired, case_file_opened/closed), result page (verdict_result, play_again, return_to_dashboard).
**Why it worked:** A typed catalogue forces consistency — there's literally one place to add an event, and the property shape is documented next to it. Wrapping the provider in `<Suspense>` was the one gotcha; getting a clear error from Next.js and pasting that stack trace yielded a one-shot fix.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.008

---

### 17. Sentry backend integration — `instrument.ts` first-import + global filter
**Context:** Needed real-time backend error monitoring with user/request context but without spamming Sentry on expected 4xx user errors.
**Prompt:**
```
sentry dsn: https://ec9e91dc...@oxxxxxxxx.ingest.us.sentry.io/xxxxxxxx
integrate sentry on my backend.
```
**Approach (what landed):**
- `backend/src/instrument.ts` — Sentry.init() with `tracesSampleRate: 1.0`, HTTP + Express integrations, `enabled: !!dsn` for silent local dev, `ignoreErrors` listing all 6 typed game exceptions so they never touch the quota.
- `backend/src/main.ts` — `import './instrument';` as the **very first line** (before NestJS imports), so Sentry patches Node internals at the earliest possible point. After all routes are mounted, `Sentry.setupExpressErrorHandler(app.getHttpAdapter().getInstance())` hooks the raw Express error chain.
- `backend/src/common/filters/sentry-exception.filter.ts` — `@Catch()` global filter implementing `ExceptionFilter`. Skips 4xx (HttpException with status < 500); captures 5xx with `Sentry.withScope()` attaching authenticated user (id, email), request method/URL/headers/body, and `http.status` tag. Returns the proper HTTP response body so client behaviour is unchanged.
- `backend/src/app.module.ts` — registers the filter as `APP_FILTER` so NestJS DI injects `HttpAdapterHost`.
**Why it worked:** Stating the import-ordering requirement (`instrument.ts` MUST be first) explicitly in the prompt prevented the silent "Sentry initialised but doesn't capture anything" failure mode. Splitting the work into "init + filter" made each file a single responsibility and easy to review.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.008

---

### 18. Playwright E2E suite against live deployment
**Context:** Needed comprehensive end-to-end test coverage that runs against the production URL, not localhost — so a passing CI run is a real signal.
**Prompt:**
```
Run end-to-end testing on my application [https://hackathon-2026-05-ahmed-mujtaba-eta.vercel.app].
Fix any bugs if you find and test again. Repeat this process until there are no bugs left.
Also write e2e test cases and push on github when all are passed.
```
**Approach (what landed):** A full `e2e/` workspace with `playwright.config.ts` targeting the live Vercel URL, plus 6 test suites totalling 40 tests:
- `01-landing` (7 tests) — hero title, CTA, feature cards, marquee, no console errors, auth redirects
- `02-auth-callback` (4 tests) — no token, malformed JWT, expired JWT (verifies token clearing), spinner state
- `03-api-health` (9 tests) — `/health` 200, all protected endpoints return 401 without token, `/auth/google` redirects to Google, CORS header present
- `04-authenticated-flows` (8 tests, skip without `TEST_JWT`) — dashboard, difficulty cards, game start, game page elements, logout
- `05-responsive-ui` (20 tests) — 5 viewports × 4 checks each: no horizontal overflow, hero in viewport, sign-in button reachable, body overflow:hidden
- `06-api-contract` (11 tests) — case shape (asserts NO `private_truth`/`alibi_is_true`/`will_crack_if`/`murderer_id` leak), coin deduction, one-hint-per-session, verdict shape
**Iteration:** Two test failures surfaced and were fixed before commit:
1. "no token → redirect": used `waitForTimeout(2000)` but the app's redirect is `setTimeout(3000)`. Fixed with `page.waitForURL('/', { timeout: 8000 })`.
2. "expired JWT": app correctly stores the token, then clears it after `getMe()` returns 401. Test assertion was wrong; rewrote it to verify the redirect happened *and* `localStorage.getItem('mm_token')` is null.
**Why it worked:** Targeting the live URL meant the suite is meaningful for the grader (no faked localhost). Parameterising viewport tests gave 20 tests for the cost of writing 4. Suite 06's negative assertion (`expect(JSON.stringify(body.case)).not.toContain('private_truth')`) is a one-line proof of the privacy invariant.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.013

---

### 19. Railway backend deployment — three-step debug
**Context:** Backend needed to deploy to Railway via the project token (no `railway link` permission).
**Prompt:**
```
railway token: 0759d8c9-... project id: 0ea95ec1-...
deploy my backend on railway.
```
**Three iterative failures (and their fixes):**
1. **"No start command detected"** — Nixpacks/Railpack couldn't auto-detect a NestJS start. **Fix:** Created explicit `backend/railway.json` with `buildCommand: "npm install && npm run build"` and `startCommand: "node dist/main"`.
2. **Healthcheck loop** — `railway.json` had `healthcheckPath: "/"` but NestJS has no root route. **Fix:** Removed healthcheck from `railway.json`; added `httpAdapter.get('/health', ...)` to `main.ts` so Railway can poll it.
3. **`railway link` returned Unauthorized** — project tokens can't run `link`. **Fix:** Created `backend/.railway/config.json` manually with `projectId`, `environmentId`, `serviceId`, then deployed with `railway up --service ... --environment production --detach`.
**Why it worked:** Each failure was a different layer (build, runtime healthcheck, CLI auth). Surfacing the error message verbatim each time and asking Claude with that exact text yielded targeted fixes; trying to over-specify upfront would have been wasted tokens.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.008

---

### 20. First-time onboarding tour
**Context:** New users landed on the dashboard without any framing — needed a non-intrusive welcome.
**Prompt (paraphrased from polish wave 2 brief):**
```
Add a first-time onboarding tour. It should not tease the user — only place
popups where necessary with good UX so the user can skip them.
```
**Approach (what landed):** A single elegant 5-slide modal (`onboarding-tour.tsx`) that appears once on the dashboard, persisted via `mm_onboarded_v1`. Slides walk through Welcome → Choose Difficulty → Read Case File → Interrogate → Accuse, each with a Phosphor-style icon, eyebrow tag, headline, body. Step-indicator pill bar at the top. Skip button visible at all times; framer-motion staggered transitions on slide change. Mounted as `<OnboardingTour />` directly in dashboard's render — fires after a 650 ms delay so it feels like a deliberate welcome, not a load blocker.
**Why it worked:** Treating it as one compact component with a single localStorage flag (instead of contextual tooltips on every page) kept it skippable and free of edge-case bugs. The 650 ms delay before mount was the small detail that made it feel premium rather than spammy.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.006

---

### 21. Font upgrade — premium noir pairing
**Context:** Default Playfair Display + JetBrains Mono felt generic. Needed a more distinctive noir voice without breaking layout.
**Prompt approach:** I asked for a four-font system explicitly: display + serif body + sans/UI + mono, named the candidates (Cinzel, Cormorant Garamond, Outfit, JetBrains Mono), and required the change to be wired through CSS variables so every existing `font-display` / `font-serif` / `font-sans` / `font-mono` Tailwind utility just looks better instantly with no class renames.
**What landed:**
- `layout.tsx` — `Cinzel`, `Cormorant_Garamond`, `Outfit`, `JetBrains_Mono` from `next/font/google`, all wired as CSS vars on `<html>`.
- `tailwind.config.ts` — `fontFamily: { serif, sans, mono, display }` mapped to those CSS vars with sensible fallbacks.
- `globals.css` — body default switched to `var(--font-serif-body)` so unstyled text reads in Cormorant by default.
**Why it worked:** Sticking to four CSS-variable swaps meant zero risk of regressions. Cinzel (Roman-inscription serif) has the exact noir-detective-novel feel that Playfair lacks; Cormorant pairs with it as a body italic for atmospheric copy; Outfit handles UI buttons cleanly; JetBrains Mono kept its job for case IDs and labels.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.002

---

### 22. Polish wave 2 — composite UX brief
**Context:** Six issues bundled into one user message — scope ranged from a one-line audio fix to a backend type addition + frontend component build.
**Prompt (verbatim, condensed):**
```
1. when the case file is displayed and until the accusation is submitted i don't want the background sound.
2. all card lengths are not equal, the first card begin investigation button is black background but it should not be. and page is scrollable without any reason.
3. when the case is solved you have to display the real criminal/murderer name.
4. when the user plays for the first time they should be shown some popups to guide them. They should not be teasing the user, only place them where necessary with good user experience so the user can skip those.
5. i don't like the font very much. If you can make it better with a better design good animations etc please do that. Don't create any new bug.
6. update all the .md files in this repo for the work we have done up till now.
```
**Approach:** Used a TodoWrite list to break the brief into seven tracked items (the six asks + a final deploy step) and worked through them sequentially, marking complete only after each fix landed. Each fix was scoped to the smallest clean diff: music kill point moved to the *click* on `/game/new` (one line change in `handleStart`); difficulty card fix changed the button-variant pattern to a `buttonClass` per card so all three CTAs are filled; murderer name added to the verdict service return type, the `VerdictResult` interface, and rendered as a stamped CLASSIFIED dossier card; onboarding/font as separate entries above; MD updates concentrated on `README.md` (new), `CLAUDE.md`, and `PHASES.md`.
**Why it worked:** TodoWrite gave the multi-issue brief a structural backbone — every fix could be verified in isolation, and the final commit message summarised every change with one bullet per issue. Two parallel deploys (Vercel via background task, Railway via foreground CLI) saved real wall-clock time at the end.
**Output quality:** 5
**Model used:** Sonnet 4.6
**Approx cost:** ~$0.018 (composite — covers six fixes + deploy)

---

## Bottom 3 prompts that wasted time

### 1. Asking Claude to generate a suspect mid-conversation
**What I asked:** "Add a new suspect named Thomas who is the victim's business partner and acts suspicious."
**What went wrong:** Claude invented a suspect that contradicted the already-generated case JSON (wrong alibi timings, duplicate motive). Required full case regeneration.
**What I should have done:** Always generate the full case in one shot. Never mutate suspects after case creation. Logged as a hard rule in CLAUDE.md.

### 2. Letting Opus run for routine UI component generation
**What I asked:** Shadcn card component for displaying a suspect profile.
**What went wrong:** Opus produced over-engineered output (unnecessary animations, custom hooks) for what was a 30-line component. Took longer and cost 5× more than Sonnet.
**What I should have done:** Use Sonnet for all UI generation. Reserve Opus for architectural decisions only.

### 3. Prompting for coin logic without a schema reference
**What I asked:** "Write the coin deduction logic for when a player starts a game."
**What went wrong:** Claude wrote raw SQL strings instead of using Sequelize, and didn't handle the "coins can't go below 0" guard. Two bugs to fix.
**What I should have done:** Always paste the Sequelize model into context and state the zero-floor constraint explicitly before asking for DB logic.

---

## Workflow patterns I'll keep using
- **Plan mode** for anything touching more than 3 files or a new API surface (used 3× across the build).
- **Full JSON schema injection** into every Claude interrogation prompt (server-side only, never frontend).
- **One-shot full case generation** rather than iterative suspect building.
- **Sonnet 4.6 as default**; Opus only for architectural spikes.
- **Background agents** for long-running UI rewrites — frees the main session for parallel work.
- **Parallel tool calls** in a single message when independent (multi-file reads, parallel deploys).
- **TodoWrite** for any user message containing >3 distinct asks — gave polish wave 2 a clean backbone.
- **Naming the exact output format** before asking for data transformations (caught two would-be format mismatches).
- **State the symptom AND the observed root cause** together for debugging prompts (Vercel lockfile, Sentry import ordering).
- **Literal diff specifications** (old → new) for visual compression work — consistently cheaper and lands in one pass.

## Workflow patterns I'll stop
- Letting Claude mutate game state mid-session without a schema reference.
- Using Opus for UI components — Sonnet is faster and cheaper for that.
- Prompting without referencing CLAUDE.md conventions (caused the raw-SQL bug).
- Forgetting to specify data-format contracts before spawning background agents (caused a `{t,w}` vs `{total,wins}` mismatch).
- Letting a stub `package-lock.json` sit in the repo — always verify lockfile line count before CI deploys (`wc -l package-lock.json`; a real Next.js project is 3 000+ lines).
- Deploying via Vercel CLI from inside a git monorepo without `--archive=tgz` — git-relative path preservation sends `frontend/` as a subdirectory, not the root.
- Forgetting to call out import ordering for tools that patch Node internals (Sentry, OpenTelemetry). Always state "MUST be the first import" explicitly.
