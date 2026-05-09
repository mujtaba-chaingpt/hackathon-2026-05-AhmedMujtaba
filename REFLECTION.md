# Reflection — Ahmed Mujtaba
## Project: AI Murder Mystery Detective

*Written EOD Sat May 9, before the demo on Mon May 11.*

---

## Before the hackathon, my honest take on Claude Code was:
A faster IDE autocomplete that needed constant supervision — useful for boilerplate, dangerous for anything architectural, and a tax on my attention because I had to re-read everything it produced anyway.

## Now, my take is:
A genuinely capable engineering partner when I do my job — pinning the schema, the constraints, and the failure modes before I prompt. The quality of the output tracks the quality of the brief almost linearly; sloppy briefs get sloppy code, surgical briefs get surgical code.

---

## The 3 patterns I'll bring to my real work
1. **Plan mode before any change touching more than three files.** Every time I skipped it I lost 30 minutes inside an hour. The architecture spike (Prompt #5) locked the "private truth never reaches the client" invariant on day one and the implementation fell out from there with no rework.
2. **Literal diff specifications instead of vague intent.** The dashboard pixel-perfect compression (Prompt #14) was a table of `old → new` values per component. The agent didn't have to interpret "make it tighter" — it just executed. Same lesson with Prompt #9 (localStorage shape) and Prompt #11 (SpeechRecognition surface).
3. **Background agents for parallel UI rewrites.** Spawning the dashboard + landing redesign in 265 seconds for ~$0.05 while the main session kept moving on audio + backend was a net force-multiplier. The trick is feeding the agent the exact data contracts upfront so its output drops in cleanly.

## The 2 patterns I will NOT bring (and why)
1. **Letting Claude mutate game state mid-session.** Asking it to "add a suspect" to an already-generated case produced contradictions in alibis, motives, and timings (logged as anti-pattern #1). Some artefacts have to be generated atomically. Never re-derive a partial.
2. **Reaching for Opus on routine work.** Opus over-engineered a 30-line suspect card with unnecessary hooks and animations and cost ~5× what Sonnet did for the same task (anti-pattern #2). I now reserve Opus for architecture-shaped questions only; Sonnet is the default for everything else.

---

## What I'd want to change in our team's workflow
We over-trust the first AI output and under-trust the second. People accept a working-looking diff and move on; they then push back on a follow-up that touches the same area because it "looked fine before." We should write `CLAUDE.md`-style invariants into every repo (zero-floor coin balance, server-only private fields, schema contracts between components) so the model has hard rails it cannot cross. And we should normalise spawning a background agent for any rewrite that's going to take more than 15 minutes — the per-call cost is genuinely tiny once you measure it, and the parallelism is free.

---

## My answer to: "would I want to keep using this on real tickets?"
[x] Yes, default to it
[ ] Yes, for some kinds of work
[ ] No, prefer manual

**Why:**
On this build I shipped a backend (5 NestJS modules, OAuth, transactional coins, 4 Groq-backed AI endpoints, Sequelize migrations), a frontend (8 routes, animated noir canvas, dashboard, case file book, voice I/O, dynamic music) and the full design system in roughly 20 hours over three days, for ~$22–32 in Claude spend. The same scope by hand would have been a week minimum. The pattern that made it work was consistent: **brief Claude like a smart colleague who hasn't seen the conversation, then verify the diff** — never delegate the understanding, only the typing. Every time I reverted to that pattern I shipped fast; every time I drifted I paid for it.

---

## Appendix — things I noticed during the build
- **Format mismatches between sub-tasks are the #1 silent bug.** A background agent wrote the dashboard expecting `{ easy: {t,w} }`, while my result-page writer used `{ easy: { total, wins } }`. Caught before deploy because I read the agent's diff carefully. Fix: pin the schema in both prompts, not one.
- **The cheapest way to make AI output consistent is to make the data shape inevitable.** Once the case JSON had a `gender` field and `alibi_is_true: boolean`, the interrogation prompt didn't need extra hints — Claude couldn't drift because the structure constrained it.
- **The browser's free APIs are still under-used.** Web Speech (TTS + STT) and Web Audio (procedural SFX, canvas-synced thunder) gave me a cinematic-feeling product with zero recurring cost and zero API keys. Worth defaulting to before reaching for paid services.
- **`<body>` should be `h-[100dvh] overflow-hidden`, not `min-h-[100dvh]`, on any app where inner containers do their own scrolling.** This was a one-line fix that eliminated an entire class of "the chat dragged the navbar away" bugs.
- **A literal diff specification beats a stylistic prompt every time.** "Hero title 26 px, Operating Budget py-3, Detective Badge HORIZONTAL one-row" landed pixel-perfect on the first try; "make the dashboard more compact" would not have.
