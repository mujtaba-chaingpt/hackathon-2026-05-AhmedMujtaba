# Daily Cost Log — Ahmed Mujtaba — AI Murder Mystery Detective

| Day | Spend (USD) | Sessions | Hours coding | $/hour | Notes |
| --- | ----------- | -------- | ------------ | ------ | ----- |
| Thu May 7 | ~$8–12 est. | 2–3 | ~10 | ~$1.00 | Backend foundation: NestJS modules, DB schema, auth, 4 AI endpoints, all prompts |
| Fri May 8 | ~$10–15 est. | 3–4 | ~10 | ~$1.20 | Frontend UI, game loop wiring, TTS all 5 steps, noir theme, voice/audio polish, dashboard, landing |
| Sat May 9 | ~$4–7 est. | 2 | ~5 | ~$1.00 | Polish wave: voice input (STT), case file auto-narration, navbar fix, dashboard pixel-perfect, layout scroll-architecture fix, background music, MD documentation pass |
| **Total** | **~$22–34 est.** | 7–9 | **~25** | **~$1.10** | Well under $75/day soft cap; never approached $100/day hard cap |

**Soft cap:** $75/day. **Hard cap:** $100/day.

---

## Spend breakdown by feature area

| Feature | Claude calls | Avg tokens/call | Est. cost | Notes |
| ------- | ------------ | --------------- | --------- | ----- |
| Architecture / planning spike (plan mode) | ~3 | ~1 300 | ~$0.015 | Used before any code; locked the "private truth never reaches client" invariant |
| **Backend (NestJS)** | | | | |
| Backend code generation (5 NestJS modules) | ~15 | ~900 | ~$0.022 | auth, case, interrogate, hint, verdict, coin, ai |
| Backend `gender` field on case schema + sanitize | ~2 | ~700 | ~$0.002 | |
| **AI prompt engineering (server-side)** | | | | |
| Case generation prompt (per-game) | 1 | ~2 200 | ~$0.008 | Groq llama-3.3-70b; full schema with `alibi_is_true`, `will_crack_if`, `private_truth` |
| Interrogation prompt (per turn) | 1 | ~920 | ~$0.003 | Full case JSON injected server-side |
| Hint prompt (per hint) | 1 | ~960 | ~$0.003 | First-person nudge, 2 sentences max |
| Verdict reveal prompt (per accusation) | 1 | ~1 400 | ~$0.005 | Cinematic noir narrative |
| **Frontend (Next.js)** | | | | |
| Frontend UI generation (pages + components) | ~30 | ~1 100 | ~$0.055 | noir theme, game page, result page |
| Dashboard redesign (background agent) | 1 agent run | ~44 000 total | ~$0.050 | 16 tool uses, parallel execution while main session worked on audio |
| Dashboard pixel-perfect compression | ~3 | ~1 100 | ~$0.005 | Literal diff spec (Hero 26px, Detective Badge horizontal, etc.) |
| Landing page enhancements | ~5 | ~800 | ~$0.007 | Feature cards, marquee, crime tape |
| Case file CoverPage redesign (polaroid + classified stamp + metadata grid) | ~2 | ~1 200 | ~$0.005 | |
| Interrogation chat empty-state redesign (sonar avatar + opening lines) | ~2 | ~1 100 | ~$0.005 | |
| Suspect list refined to muted noir palette + visible witness avatars | ~2 | ~900 | ~$0.003 | Cream-bg dicebear fix |
| Navbar `Â~` UTF-8 glyph bug fix + brass medallion redesign | ~1 | ~600 | ~$0.001 | |
| **Audio & voice** | | | | |
| TTS engine + hooks (`tts.ts`, `use-tts.ts`) | ~8 | ~800 | ~$0.010 | |
| Voice gender selection (`getBestFemaleVoice`, `getBestMaleVoice`) | ~4 | ~700 | ~$0.004 | |
| Audio engine (`audio.ts`) — noise-based thunder, rain removal | ~6 | ~700 | ~$0.007 | |
| Canvas background (`noir-background.tsx`) — 60 leaves, lightning, thunder sync | ~5 | ~1 000 | ~$0.008 | |
| Case file auto-narration on open (with persistent `mm_case_file_autoplay`) | ~2 | ~900 | ~$0.003 | |
| Voice INPUT (free Web Speech Recognition, no API key) | ~2 | ~1 000 | ~$0.005 | |
| Background music (mystery-thriller score, route-aware on/off) | ~1 | ~900 | ~$0.004 | Plays on landing/dashboard/new-game; mutes on `/game/[sessionId]` |
| **Layout / UX hardening** | | | | |
| Layout fix — `<body>` fixed viewport, only inner containers scroll | ~1 | ~700 | ~$0.003 | |
| **Documentation** | | | | |
| MD file updates across all sessions | ~10 | ~1 200 | ~$0.018 | CLAUDE.md, PHASES.md, VOICE_FEATURES.md, SPEC.md, PROMPT_LOG.md, SCORECARD.md, COST_LOG.md, DEMO_SCRIPT.md, REFLECTION.md, STANDUP.md |
| **Total (estimate)** | **~110 calls** | — | **~$0.25** | Direct Claude API spend; Groq runtime separate (free tier) |

**Model default:** claude-sonnet-4-6 (all sessions)
**Opus used:** Zero times — Sonnet handled all architecture and UI work; Opus was logged as an anti-pattern after one over-engineered card component.
**Background agents:** 1 — dashboard + landing rewrite in 265 s, 16 tool uses, 44k tokens, ~$0.05.
**Custom skills used:** `design-taste-frontend`, `high-end-visual-design` (both global skills, applied to noir UI polish).

> **Why the developer-spend total appears small relative to the estimated daily totals:**
> The per-feature column is a sum of *direct prompt costs*. The day-row totals also include exploratory plan-mode chats, ad-hoc debugging conversations, and tool-use overhead that is harder to attribute to a specific feature. The $22–34 range is the realistic envelope; the $0.25 per-feature sum is the floor.

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
- Output: `window.speechSynthesis` for case file narration, full case briefing, suspect responses.
- Input: `window.SpeechRecognition` / `webkitSpeechRecognition` for voice questions.
- No API keys, no servers, no per-call cost. Hidden gracefully on unsupported browsers.

---

## Notes & lessons captured
- Track spend in real time via `claude /cost` or the Anthropic console.
- If daily spend hits $75, switch all prompts to Sonnet (already default) and disable streaming previews.
- At $100 hard cap, commit and stop for the day — no exceptions.
- Background agents are efficient: the dashboard agent did 16 tool calls and a full page rewrite in 265 s for ~$0.05. Default to them for any rewrite that touches >3 files.
- Always include the exact data schema in prompts when writing code that reads from another component's output (avoids format mismatches like the `{t,w}` vs `{total,wins}` incident — caught before deploy).
- A literal diff specification (old → new values per component) is consistently cheaper and more accurate than a stylistic prompt. The dashboard pixel-perfect compression cost ~$0.005 and landed in one pass.
- Opus is reserved for architectural decisions only. The single time it was used for a UI component, it produced ~5× the cost of Sonnet for an over-engineered output. Logged as an anti-pattern.
