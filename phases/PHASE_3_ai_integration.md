# Phase 3 — AI Integration (Groq)

**Status:** DONE
**Goal:** Wrap the AI SDK behind one service so the rest of the app never touches it directly. Centralise four prompt templates that encode the game's rules.

> **Note (May 7 evening pivot):** This phase was originally scoped against Gemini.
> The implementation pivoted to **Groq's `llama-3.3-70b-versatile`** for free-tier
> reliability and lower latency. Everything below that mentions Gemini, the
> `GEMINI_API_KEY` env var, or `gemini-1.5-flash` should be read as the historical
> plan; the live code in `backend/src/ai/ai.service.ts` uses the Groq SDK and
> reads `GROQ_API_KEY`. The four prompt templates and the schema contract did not
> change as part of the pivot.

---

## Plan

1. Create an `AiService` that owns the `GoogleGenerativeAI` client and exposes four typed methods: `generateCase`, `generateInterrogationResponse`, `generateHint`, `generateVerdictReveal`.
2. Use `gemini-1.5-flash` (free tier).
3. Build four prompt builders, each in its own file, so prompts can be iterated without touching the service.
4. Make the case-generation response parser strip markdown code fences (Gemini sometimes wraps JSON in ```json ... ```).
5. Encode difficulty rules inside the case-generation prompt — the model is instructed to scale suspect count and red-herring count by difficulty.
6. Inject private case context into interrogation/hint/verdict prompts server-side so it never reaches the client.
7. Make `AiModule` global so services can import `AiService` without re-importing the module.

---

## Done

### Service + module
- [backend/src/ai/ai.service.ts](../backend/src/ai/ai.service.ts) — singleton `GoogleGenerativeAI` instance built from `GEMINI_API_KEY`; calls `getGenerativeModel({ model: 'gemini-1.5-flash' })`.
  - `generateCase(difficulty)` — strips markdown code fences before `JSON.parse`.
  - `generateInterrogationResponse(suspect, history, question)` — returns plain text.
  - `generateHint(caseData, history)` — returns plain text.
  - `generateVerdictReveal(caseData, accusedName, correct)` — returns plain text noir narrative.
- [backend/src/ai/ai.module.ts](../backend/src/ai/ai.module.ts) — `@Global()`, exports `AiService`.

### Prompt templates
- [backend/src/ai/prompts/case-generation.prompt.ts](../backend/src/ai/prompts/case-generation.prompt.ts) — defines the full JSON schema (victim, suspects with `private_truth`/`alibi_is_true`/`will_crack_if`, `key_clues`, `red_herrings`, `murderer_id`, `motive`, `how_it_was_done`, `how_it_was_concealed`); difficulty rules:
  - **easy** — 3 suspects, obvious mistakes, 0 red herrings
  - **medium** — 4 suspects, 1 red herring, cross-referenced alibis
  - **hard** — 6 suspects, 2+ red herrings, murderer's perfect alibi disproved by cross-checking two suspects
- [backend/src/ai/prompts/interrogation.prompt.ts](../backend/src/ai/prompts/interrogation.prompt.ts) — injects the suspect's full private profile + last 10 turns of conversation; instructs the model to stay in character, never confess outright, become visibly nervous when the player hits `will_crack_if`, keep answers under 4 sentences.
- [backend/src/ai/prompts/hint.prompt.ts](../backend/src/ai/prompts/hint.prompt.ts) — frames Gemini as the detective's inner voice; rules: never name the murderer, first-person ("Something about X doesn't sit right..."), max 2 sentences.
- [backend/src/ai/prompts/verdict-reveal.prompt.ts](../backend/src/ai/prompts/verdict-reveal.prompt.ts) — noir closing scene structure: realisation paragraph → true sequence (2 paragraphs) → who lied and why → atmospheric closing line; tone: serious cinematic noir.

---

## Pending

- Tune prompts after a few real plays (Phase 7).
- Add a one-time retry on schema validation failure (currently throws if Gemini returns malformed JSON). Low priority — Gemini 1.5 follows JSON instructions reliably.

---

## Acceptance criteria

- [x] `AiService` is the only file that imports `@google/generative-ai`.
- [x] All four prompts are pure functions in their own files — no inline templates in the service.
- [x] `generateCase` returns a parsed object, never a string.
- [x] Private case fields (`private_truth`, `murderer_id`, etc.) are injected into prompts but **never returned** to the controller layer (sanitisation is enforced in `CaseService`, see Phase 4).
- [ ] Prompts smoke-tested against the real Gemini API. (Pending Phase 6 with a real `GEMINI_API_KEY`.)
- [ ] Hint generation always returns first-person phrasing. (Verify in Phase 6; if it drifts, add a one-shot retry per the open question in `CLAUDE.md`.)
