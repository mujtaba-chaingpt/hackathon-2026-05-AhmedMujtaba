# Judges' Scorecard — AI Murder Mystery Detective
## Engineer: Ahmed Mujtaba

---

| # | Criterion | Weight | Self-score | Key evidence |
| - | --------- | ------ | ---------- | ------------ |
| 1 | Idea & utility | 8% | 9/10 | Genre-proven concept (Clue / Her Story) executed as a real-time AI game with voice on both sides — TTS narration and free browser-native voice input. Coin economy creates genuine tension. |
| 2 | Functionality — does it work end-to-end? | 15% | 9/10 | Full loop working: Google login → coin deduction → AI case generation → CaseFileBook auto-narration → split-pane interrogation (text + voice) → hint → timer auto-submit → cinematic verdict reveal → coin award. Stats tracked + read by dashboard. Pixel-perfect dashboard fits a 1080p viewport. |
| 3 | Code quality | 10% | 8/10 | Typed throughout (no `any` abuse — only one casted-`any` for the non-standard SpeechRecognition global). Named error classes. Services separated from controllers. `tts.ts`, `audio.ts`, `audio-context.tsx`, `interrogation-chat.tsx` follow single-responsibility. Layout invariant documented in `CLAUDE.md` so it cannot regress. |
| 4 | Architecture & code complexity | 6% | 9/10 | Module-per-feature NestJS. Private truth never touches the wire. Transactional coin writes. Client-side timer + server-side expiry validation. Dual audio pipeline (Web Audio for SFX/thunder + Web Speech for TTS/STT + HTMLAudioElement for music). Body-as-viewport layout: `<body>` is `h-[100dvh] overflow-hidden`, only inner containers scroll. |
| 5 | Database quality | 5% | 8/10 | Sequelize migrations (never edited by hand). Transactions for coin deductions. `GameSession.status` state machine (`active → won/lost/expired`). |
| 6 | UI/UX & front-end | 10% | 9/10 | Cinematic noir canvas (60 leaves, lightning/thunder sync, fog). Framer-motion throughout with spring physics. Gender-aware TTS voices. CaseFileBook redesigned as classified document (polaroid + CONFIDENTIAL stamp + metadata grid). Interrogation empty state with sonar-ringed avatar + suggested opening lines. Dashboard with Detective Badge + rank progress bar. Pixel-perfect viewport fit. Refined muted noir palette across the suspect list. |
| 7 | Optimization & performance | 5% | 8/10 | Long noise buffers (18–25 s) eliminate loop artefacts. `memo()` on `NoirBackground`. TTS voice caches with `onvoiceschanged` invalidation. Canvas only animates `transform`/`opacity`. Music auto-pauses inside `/game/[sessionId]` so it doesn't compete with TTS or eat frame budget. |
| 8 | Observability, admin & hardening | 8% | 8/10 | NestJS `Logger` throughout. Typed exceptions (`InsufficientCoinsError`, `HintAlreadyUsedError`, `SessionExpiredError`). `CoinService.deduct()` guards zero-floor. Double-stat guard key in localStorage. Browser-autoplay safety: music & ambient gated on first user interaction; `play()` rejections silently swallowed. Voice input shows inline error states (`'Microphone access denied'`, `'No speech detected'`). |
| 9 | **Effective use of Claude Code** — BIGGEST | **25%** | 9/10 | Plan mode used for architecture spike (Prompt #5). Background agent ran dashboard + landing page in parallel while main session handled audio/TTS/backend (Prompt #10, 265 s for ~$0.05). **14 logged prompts** with schema injection, why-it-worked notes, quality scores, and cost estimates. Custom skills (`design-taste-frontend`, `high-end-visual-design`) applied to UI. `PROMPT_LOG.md` documents both wins and three explicit anti-patterns. |
| 10 | Submission & demo | 8% | 9/10 | Full MD set current and self-consistent: `CLAUDE.md`, `PHASES.md`, `VOICE_FEATURES.md`, `SPEC.md`, `PROMPT_LOG.md`, `COST_LOG.md`, `SCORECARD.md`, `DEMO_SCRIPT.md`, `REFLECTION.md`, `STANDUP.md`. Demo script has timing, hook, three live actions, architecture in three sentences, cost, and a backup plan. |

**Estimated weighted total: ~8.8/10 → ~88/100**

---

## Judge notes (blank for judges to fill in)

```
Project: AI Murder Mystery Detective      Engineer: Ahmed Mujtaba

1.  Idea & utility (8%):                     /10
2.  Functionality (15%):                     /10
3.  Code quality (10%):                      /10
4.  Architecture & code complexity (6%):     /10
5.  Database quality (5%):                   /10
6.  UI/UX & front-end (10%):                 /10
7.  Optimization & performance (5%):         /10
8.  Observability & hardening (8%):          /10
9.  Effective use of Claude Code (25%):      /10   ← BIGGEST
10. Submission & demo (8%):                  /10

Weighted total:                              /100
- Discipline penalty (if any):              -25 (missing CLAUDE.md or prompt log)
Final score:                                 /100

One thing this project did exceptionally well:

One thing the engineer should keep doing:
```

---

## Scoring anchors (reference)

### Criterion 9 — Effective use of Claude Code (25%)
| Score | Description |
| ----- | ----------- |
| 9–10 | Prompt log shows deliberate experimentation; at least one non-trivial agentic workflow; clear evidence of plan mode, sub-agents, or custom skill usage; cost is tracked and optimised. |
| 7–8 | Good prompts with context injection; some iteration visible in the log; cost tracked. |
| 5–6 | Claude used but mostly for boilerplate generation; minimal evidence of strategic prompting. |
| 1–4 | Minimal or no prompt log; Claude used as a basic autocomplete only. |

### Criterion 2 — Functionality (15%)
| Score | Description |
| ----- | ----------- |
| 9–10 | Full E2E flow works live: auth → case start → interrogation → hint → accusation → reveal. Coin economy correct. |
| 7–8 | Core loop works; minor edge cases missing (e.g. timer auto-submit not implemented). |
| 5–6 | Some features missing or broken; demo required workarounds. |
| 1–4 | Does not run end-to-end. |

---

## Evidence checklist for Criterion 9

- [x] `CLAUDE.md` present and accurate (architecture, conventions, never-do rules, layout invariant)
- [x] `PROMPT_LOG.md` — **14 logged prompts** with context, why-it-worked notes, quality scores, and cost estimates
- [x] Plan mode used: architecture spike before any code (Prompt #5)
- [x] Background agent used: dashboard + landing redesign in parallel (Prompt #10)
- [x] Custom skills used: `design-taste-frontend` + `high-end-visual-design` for noir UI polish
- [x] Schema injection: all AI prompts inject server-side case JSON; `gender` field added to case schema
- [x] Cost tracked in `COST_LOG.md` with per-feature breakdown (~110 calls, ~$0.25 direct + day-row totals ~$22–34)
- [x] Failures documented: 3 anti-patterns logged in "Bottom 3 prompts" + format-mismatch lesson + Opus-on-UI lesson
- [x] Voice I/O: free, browser-native, zero ongoing cost (TTS + STT)
- [x] Layout invariant documented and enforced (no `min-h-[100dvh]` on page roots)
