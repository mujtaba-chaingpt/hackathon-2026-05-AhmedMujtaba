# Build Phases — AI Murder Mystery Detective

Phased delivery plan, mapped to the hackathon timeline (May 7-9 build, May 11 demo).

Each phase has its own document under `phases/` with: **goal → plan → done → pending → acceptance criteria**.

| # | Phase | Status | Doc |
|---|-------|--------|-----|
| 1 | Foundation — monorepo, scaffolds, DB schema | DONE | [phases/PHASE_1_foundation.md](phases/PHASE_1_foundation.md) |
| 2 | Authentication — Google OAuth, JWT, coin economy | DONE | [phases/PHASE_2_authentication.md](phases/PHASE_2_authentication.md) |
| 3 | AI integration — Groq service (`llama-3.3-70b-versatile`) + 4 prompt templates | DONE | [phases/PHASE_3_ai_integration.md](phases/PHASE_3_ai_integration.md) |
| 4 | Core game loop — case, interrogate, hint, verdict services | DONE | [phases/PHASE_4_game_loop.md](phases/PHASE_4_game_loop.md) |
| 5 | Frontend UI — pages, components, noir theme | DONE | [phases/PHASE_5_frontend_ui.md](phases/PHASE_5_frontend_ui.md) |
| 6 | Integration testing & QA | IN PROGRESS | [phases/PHASE_6_qa.md](phases/PHASE_6_qa.md) |
| 7 | Polish, animations, demo prep | IN PROGRESS | [phases/PHASE_7_polish.md](phases/PHASE_7_polish.md) |
| 8 | Deployment — Vercel + Railway + Postgres | PENDING | [phases/PHASE_8_deployment.md](phases/PHASE_8_deployment.md) |

## Polish work completed (Phase 7 highlights — May 8)

| Feature | Status |
|---------|--------|
| Web Speech API TTS — all 5 steps | DONE |
| Gender-aware voice selection (female/male browser voices) | DONE |
| `gender` field in AI prompt schema + passed through `sanitizeCase` | DONE |
| Rain sound removed; thunder synced to canvas lightning flash | DONE |
| 55 leaves scattered all over the screen (was 32, top-only) | DONE |
| Dashboard stats panel — animated counter cards + perf bar chart | DONE |
| Landing page visual overhaul (feature cards, marquee, crime-tape) | DONE |
| Game page: ambient stops on mount, TTS voices loud and clear | DONE |
| Stats tracking in localStorage (game page saves difficulty, result page saves outcome) | DONE |
| Navbar Â~ glyph bug fixed; replaced with Fingerprint medallion + EST. 1947 wordmark | DONE |
| Dashboard redesign: 2-col viewport-fit, stat tiles, Detective Badge card with rank progress | DONE |
| Case file CoverPage redesigned as classified document (polaroid victim photo, CONFIDENTIAL stamp, metadata grid) | DONE |
| Interrogation empty state filled with sonar avatar, suggested opening lines, brass send button | DONE |
| Suspect list refined to muted noir palette; witness avatars now visible (cream-bg dicebear) | DONE |
| Case file auto-narration on open (default ON, persisted via `mm_case_file_autoplay`) | DONE |
| Voice INPUT in chat (free, Web Speech Recognition, no API key) | DONE |
| Layout architecture: body fixed to `h-[100dvh]` so only inner scrollers scroll (chat scrolls in-place; page never scrolls) | DONE |
| Background music (`mystery-thriller.mp3`) plays on landing / dashboard / `/game/new`; auto-stops on `/game/[sessionId]`; mute button pauses/resumes | DONE |
| Dashboard pixel-perfect compression — fits in single viewport at 1080p without scrollbar (compact Hero, tight padding, horizontal Detective Badge, smaller stat tile numerals) | DONE |

## How to use this

- Phases 1-5 are reference docs — they record what already exists in the repo and where to find it.
- Phases 6-8 are the working plan — pick the next task from there.
- Update each doc's **Done** section as you complete tasks. Keep **Pending** tight.
- One phase in flight at a time.

## Timeline mapping

| Date | Phases active |
|------|---------------|
| May 7 (Day 1) | 1, 2, 3, 4 (backend foundation done in one push) |
| May 8 (Day 2) | 5, 6 (frontend wired + first end-to-end pass) |
| May 9 (Day 3) | 6, 7, 8 (QA + polish + deploy) |
| May 10 (rest) | Buffer / break |
| May 11 (demo) | Live presentation |
