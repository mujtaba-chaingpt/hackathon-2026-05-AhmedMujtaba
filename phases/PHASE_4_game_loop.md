# Phase 4 — Core Game Loop

**Status:** DONE
**Goal:** Wire the four backend endpoints that drive the game: start a case, interrogate a suspect, request a hint, submit a verdict. All game-rule invariants live here.

---

## Plan

1. **Case** — accept a difficulty, deduct coins, ask Gemini for a full case JSON, persist it server-side, return only the sanitised public view.
2. **Interrogate** — load the active session, find the suspect inside the stored case JSON, fetch the last 10 turns for context, ask Gemini for a response, persist the turn.
3. **Hint** — guard against double-spending (one hint per session), call Gemini with the full case + conversation history, mark the session as `hintUsed`.
4. **Verdict** — compare the accused suspect ID to the stored `murderer_id`, generate a noir reveal, award coins on win, mark the session ended. Handle the timer-expiry case (blank `accusedSuspectId`) as an automatic loss.
5. Every coin-touching path must use a Sequelize transaction so a partial failure can't leave the user mid-debited.
6. Sanitisation must strip every private field — `murderer_id`, `motive`, `how_it_was_done`, `how_it_was_concealed`, `key_clues`, `red_herrings`, and per-suspect `private_truth`, `alibi_is_true`, `secrets`, `will_crack_if`.

---

## Done

### Case module
- [backend/src/case/dto/start-case.dto.ts](../backend/src/case/dto/start-case.dto.ts) — `@IsEnum(['easy', 'medium', 'hard'])`.
- [backend/src/case/case.service.ts](../backend/src/case/case.service.ts):
  - `COIN_COSTS = { easy: 50, medium: 100, hard: 200 }`
  - `TIMERS_MS = { easy: 15min, medium: 25min, hard: 45min }`
  - `startCase()` — pre-checks balance, generates case **outside** the transaction (long-running call), then inside a transaction: deducts coins + writes `GameSession` row.
  - `getSession()` — verifies ownership; if `now > expiresAt` and status is still `'active'`, marks `'expired'` and throws `SessionExpiredError`.
  - `sanitizeCase()` — private helper, the only place client-facing case shapes are produced.
- [backend/src/case/case.controller.ts](../backend/src/case/case.controller.ts) — `POST /case/start`, `GET /case/:sessionId`. Both protected by `JwtAuthGuard`.
- [backend/src/case/case.module.ts](../backend/src/case/case.module.ts)

### Interrogate module
- [backend/src/interrogate/dto/interrogate.dto.ts](../backend/src/interrogate/dto/interrogate.dto.ts) — `sessionId: UUID`, `suspectId: string`, `question: string` (max 500 chars).
- [backend/src/interrogate/interrogate.service.ts](../backend/src/interrogate/interrogate.service.ts) — load session → verify active + not expired → find suspect in `caseData.suspects` → load last 10 turns for that suspect → call Gemini → persist `InterrogationTurn`.
- [backend/src/interrogate/interrogate.controller.ts](../backend/src/interrogate/interrogate.controller.ts) — `POST /interrogate`.
- [backend/src/interrogate/interrogate.module.ts](../backend/src/interrogate/interrogate.module.ts)

### Hint module
- [backend/src/hint/dto/hint.dto.ts](../backend/src/hint/dto/hint.dto.ts)
- [backend/src/hint/hint.service.ts](../backend/src/hint/hint.service.ts) — guard `if (session.hintUsed) throw HintAlreadyUsedError`; loads **all** turns for richer context; flips `hintUsed = true` after success.
- [backend/src/hint/hint.controller.ts](../backend/src/hint/hint.controller.ts) — `POST /hint`.
- [backend/src/hint/hint.module.ts](../backend/src/hint/hint.module.ts)

### Verdict module
- [backend/src/verdict/dto/verdict.dto.ts](../backend/src/verdict/dto/verdict.dto.ts) — accepts blank `accusedSuspectId` (timer expiry signal).
- [backend/src/verdict/verdict.service.ts](../backend/src/verdict/verdict.service.ts) — handles timer expiry as automatic loss; awards `coinCost` (net win = `+coinCost` since cost was deducted at start); generates noir reveal; transactional update of `status` + `endedAt` + `accusedSuspectId`.
- [backend/src/verdict/verdict.controller.ts](../backend/src/verdict/verdict.controller.ts) — `POST /verdict`.
- [backend/src/verdict/verdict.module.ts](../backend/src/verdict/verdict.module.ts)

### Wiring
- [backend/src/app.module.ts](../backend/src/app.module.ts) — imports `ConfigModule.forRoot({ isGlobal: true })`, `DatabaseModule`, `AiModule`, `CoinModule`, `AuthModule`, `CaseModule`, `InterrogateModule`, `HintModule`, `VerdictModule`.

---

## Pending

- Add a "list my recent cases" endpoint for the dashboard (Phase 7 polish).
- Optional: streaming interrogation responses via SSE (out of scope for hackathon).

---

## Acceptance criteria

- [x] `POST /case/start` deducts coins **before** persisting the session; if Gemini fails, the deduction is rolled back.
- [x] Sanitised case response contains zero private fields (verified in `sanitizeCase`).
- [x] `POST /interrogate` rejects suspect IDs not present in the stored case (`SuspectNotFoundError`).
- [x] `POST /hint` is idempotent at the API contract — second call always 400s with `HintAlreadyUsedError`.
- [x] `POST /verdict` with empty `accusedSuspectId` registers a loss without throwing `SuspectNotFoundError`.
- [x] All four endpoints require a valid JWT (covered by `JwtAuthGuard`).
- [ ] End-to-end test from a real frontend (Phase 6).
