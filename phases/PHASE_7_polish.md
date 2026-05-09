# Phase 7 — Polish & Demo Prep

**Status:** PENDING
**Goal:** The app works. Now make it feel good. Tighten copy, fix the rough edges, rehearse the 5-minute demo until it's muscle memory.

---

## Plan

### Step 1 — Copy & tone pass
Every string the player sees, in order. Read it aloud. Cut anything that sounds AI-generated or too cheery for a noir game.

- [ ] Landing page tagline — does it earn the click?
- [ ] Dashboard greeting — keep it brief, atmospheric.
- [ ] Difficulty card descriptions — verbs over adjectives.
- [ ] Suspect prompt placeholder ("Ask anything...") — make it character.
- [ ] Hint confirmation — feels like a detective's hesitation.
- [ ] Accusation modal warning — gravity, not melodrama.
- [ ] Result page banner — winning vs losing voice.
- [ ] Error messages — diagnostic but in-tone.

### Step 2 — Animation & micro-interactions
- [ ] Landing: subtle vignette + slow zoom on background.
- [ ] Dashboard: coin count animates up on first load (count-up effect).
- [ ] Suspect cards: hover lifts slightly, gold border appears.
- [ ] Interrogation: typing indicator while Gemini is thinking (3 pulsing dots).
- [ ] Timer: pulse animation under 2 minutes (already done — verify it looks right).
- [ ] Verdict reveal: typewriter cadence — too fast feels cheap, too slow loses attention. Aim ~30ms per character.
- [ ] Page transitions: fade only, no slides.

### Step 3 — Loading & empty states
- [ ] Case generation can take 5–15s on `gemini-1.5-flash`. Show a meaningful loader: "Pulling files from the archive..." with rotating noir-flavoured messages.
- [ ] Interrogation send button → spinner inside the button, not next to it.
- [ ] Hint loading → "Looking for what doesn't fit..."
- [ ] Verdict loading → "The detective leans back, lights a cigarette..."

### Step 4 — Error states
- [ ] Network failure → "The line went dead. Try again." + retry button.
- [ ] Gemini failure → "The witness is silent. Try a different angle." (interrogation) / "No leads from here." (hint).
- [ ] Insufficient coins → modal with "Earn coins by solving cases" link to dashboard.

### Step 5 — Accessibility quick wins
- [ ] All interactive elements have visible focus rings.
- [ ] Buttons have proper `aria-label` where icons are used alone.
- [ ] Modal traps focus and closes on Escape.
- [ ] Colour contrast: gold (#b8960c) on black (#0a0a0a) — verify WCAG AA on body text.

### Step 6 — Prompt tightening
After playing several real cases, look for failure modes:
- [ ] Suspects too willing to confess → strengthen "never confess outright" line in [interrogation prompt](../backend/src/ai/prompts/interrogation.prompt.ts).
- [ ] Cases too easy on Hard → increase red-herring count in [case-generation prompt](../backend/src/ai/prompts/case-generation.prompt.ts).
- [ ] Hints too specific → strengthen "do NOT name the murderer" rule.
- [ ] Reveals too short / too long → tune paragraph count in [verdict-reveal prompt](../backend/src/ai/prompts/verdict-reveal.prompt.ts).

Log every prompt change in [PROMPT_LOG.md](../PROMPT_LOG.md) — what changed, why, before/after.

### Step 7 — Cost ceiling enforcement
- [ ] Add a per-session question cap (e.g. 30 interrogation calls). Document the cap; show a counter in the UI.
- [ ] Cap question length at 500 chars (already done in DTO).
- [ ] Confirm Gemini model name pinned to `gemini-1.5-flash` (cheaper than `pro`).

### Step 8 — Demo rehearsal
Run [DEMO_SCRIPT.md](../DEMO_SCRIPT.md) on May 10 morning. Time it. Two passes minimum.

- [ ] Practice the 30-second hook three times until it lands.
- [ ] Pick the case data ahead of time — don't generate live; pre-seed an interesting case so the demo doesn't depend on Gemini's mood.
- [ ] Backup plan: if Gemini is down during the demo, have a recorded video ready (`screen2gif` a 5-minute walkthrough on May 10 evening).
- [ ] Verify the dev tunnel / deployed URL works on the venue WiFi (or use a hotspot).

### Step 9 — Submission checklist (before May 11)
- [ ] [SPEC.md](../SPEC.md) reflects shipped features.
- [ ] [PROMPT_LOG.md](../PROMPT_LOG.md) has 5+ working prompts and 3 failures with lessons.
- [ ] [COST_LOG.md](../COST_LOG.md) has daily totals.
- [ ] [STANDUP.md](../STANDUP.md) has all three days filled in.
- [ ] [REFLECTION.md](../REFLECTION.md) submitted by EOD May 9.
- [ ] [CLAUDE.md](../CLAUDE.md) is current (so it counts toward "Effective use of Claude Code" — 25% of the rubric).

---

## Done

_(Track progress here as you check each item.)_

---

## Pending

All of the above. Do **not** start this phase before Phase 6 passes — polishing broken code wastes time.

---

## Acceptance criteria

- [ ] You can hand the app to a non-technical friend and they can solve a case without help.
- [ ] No string in the UI sounds AI-generated.
- [ ] Average per-game cost is within the daily soft cap ($75/day, see `COST_LOG.md`).
- [ ] Demo timed at 5:00 ± 0:15 with two clean rehearsals.
- [ ] Backup video recorded.
- [ ] Submission docs all up to date.
