# Demo Script — AI Murder Mystery Detective
## Engineer: Ahmed Mujtaba | Slot: 5 min demo + 2–3 min Q&A

---

| Time | What you cover |
| ---- | -------------- |
| 0:00–0:30 | **Hook:** "Every murder mystery game gives you a script. This one generates a unique case — new victim, new suspects, new murderer — every single time, and you solve it by talking to the suspects out loud, like a real detective." |
| 0:30–2:30 | **Live demo** (3 user actions, end-to-end, no slides) |
| 2:30–3:15 | **Architecture** (1-paragraph version) |
| 3:15–4:15 | **Claude Code use** (1 worked, 1 didn't, 1 I'll keep) |
| 4:15–5:00 | **Cost** (total spend, $/feature, what surprised me) |

---

## The 3 user actions (live, on real data)

**Action 1 — Sign in, see the war room**
- Open the app. Atmospheric noir canvas: 60 falling leaves, lightning flashes synced to a thunder crack 0.8–3.5 s later, mystery-thriller score looping in the background.
- Sign in with Google. New users get **1 000 starter coins**. (For the demo I'm logged in already with ~600 coins and a `JUNIOR DETECTIVE` rank.)
- The dashboard fits the entire viewport: animated stat tiles (Total / Solved / Failed / Win Rate), Operating Budget brass card, closure-rate bars per difficulty, Case Catalogue, Investigation Protocol, and a Detective Profile badge with a live "Path to next rank" progress bar.
- "Click anywhere — that interaction unlocks the audio engine. Music starts now and will go silent the moment a case begins."

**Action 2 — Open a case file (the cinematic moment)**
- Click **Begin New Investigation**. Pick **Medium** (100 coins deducted up front).
- A full-screen "Generating Murder File" overlay plays — pulsing gold dots, scanning line, classified stamp, difficulty badge.
- Once the case lands, the **CaseFileBook** opens. It looks like a real file: a polaroid victim photo on cream cardstock, a `CONFIDENTIAL` stamp rotated -14°, file number, sealed-status chip, classification level.
- **Auto-narration starts immediately.** A neutral narrator voice reads the cover, then the victim profile, crime scene, suspects, witnesses, and a dramatic full-case briefing. The user can hit `Stop` for one case, or toggle the persistent `Auto` button to turn auto-narration off for all future cases.
- Click `Begin Investigation` → the **35-minute countdown starts client-side** and the music fades out so the suspect voices are clear.

**Action 3 — Interrogate by voice, name the killer**
- Land on the split pane. Left: muted noir suspect list with cream-paper avatars (suspects = rust stripe, witnesses = brass stripe). Right: interrogation chamber with a sonar-ringed avatar and four pre-written opening lines as clickable chips.
- Click a suspect. Click the **microphone button** and speak: *"Where were you the night of the murder?"* — the browser's free Web Speech Recognition transcribes it live into the input. Hit Send.
- The suspect responds in **a gender-matched browser voice** (deterministic pitch/rate from a hash of their name) — male suspects get lower & guarded, female witnesses get a touch higher & cooperative. The sound bars pulse while they speak.
- Cross-question a second suspect, expose a contradiction, then **buy the single allowed hint**. The hint is first-person and never names the murderer.
- Click `Make Accusation`. A cross-reference / analysis screen plays while the verdict resolves. Land on the **result page** with a full noir reveal: the true sequence of events, who lied and why, the key clue. **300 coins awarded** for a correct guess. Stats persist to localStorage and the dashboard reflects them on the next visit.

---

## Architecture (memorise — 3 sentences max)
Next.js 15 App Router frontend on Vercel talking to a separate NestJS 10 backend on Railway, with Neon Postgres for all state. The backend owns Google OAuth, JWT auth, and four Groq-backed modules — case generation, interrogation, hint, and verdict reveal — using `llama-3.3-70b-versatile`, so private suspect truths (`alibi_is_true`, `will_crack_if`, `private_truth`) never leave the server. The frontend has no API routes and makes no AI calls; both voice TTS and voice input run entirely on-device via the browser's free Web Speech APIs (zero ongoing cost).

---

## Claude Code (1 worked / 1 didn't / 1 I'll keep)
- **Worked:** Injecting the full case JSON server-side into every suspect prompt and pinning the schema before any code. Claude stayed perfectly in character across 20+ questions because it always had the full context, and the dashboard / result page agreed on the localStorage shape from day one.
- **Didn't:** Asking Claude to add a single suspect mid-game. It contradicted the existing case (wrong alibi timing, duplicate motive). Lesson: generate the full mystery in one shot or not at all — now a hard rule in `CLAUDE.md`.
- **I'll keep:** Plan mode before any multi-file change, a literal diff specification when compressing the dashboard ("Hero title 26 px, Operating Budget py-3, Detective Badge HORIZONTAL one-row"), and a background agent for parallel UI rewrites while the main session keeps moving.

---

## Cost
- **Total developer spend across May 7–9:** ~$22–32 (well under the $75/day soft cap, never approached the $100 hard cap).
- **Approx Claude Code cost per full game played by a user:** $0.00 — all in-game AI runs on Groq's free tier; voice runs in the browser.
- **Approx Groq cost per game (if paid tier):** ~$0.04 (negligible).
- **What surprised me:** A single background agent rewrote the entire dashboard + landing page in 265 seconds for ~$0.05. That's now my default for any rewrite that touches more than three files.

---

## Standout features the audience won't have seen elsewhere
- **Auto-narrated case files** with a persistent localStorage opt-out (`mm_case_file_autoplay`).
- **Voice input** in the chat (free, browser-native) — gracefully hidden on Firefox.
- **Canvas-synced thunder**: lightning flashes on the canvas trigger `playThunderClap()` after a randomised 0.8–3.5 s delay (simulates distance).
- **Route-aware background music**: plays on landing / dashboard / new-game pages, auto-pauses inside an active interrogation so suspect voices stay crystal clear.
- **Detective rank progression**: Cadet → Junior Detective → Detective → Inspector → Chief Inspector, with a live progress bar to the next rank.
- **Pixel-perfect dashboard fit**: every component compressed so it lands on a 1080p viewport with no scrollbar.
- **Layout invariant**: `<body>` is fixed at `h-[100dvh] overflow-hidden` so only inner containers scroll — chat scrolls in place, the page never moves.

---

## Common failures to avoid
- **Demo first, slides later.** The hook is the cinematic case-file moment, not architecture.
- Don't demo broken paths. If the crime-scene image is slow, the placeholder is fine — never wait for it.
- Architecture is **3 sentences**, not a code tour. Cut yourself off.
- **Practice the 5 minutes once on May 11 morning** with a timer, on the same browser the demo will use (Chrome — Firefox lacks SpeechRecognition).
- Run the app once before the demo so the AudioContext is unlocked and music starts on the first click instead of the second.

---

## Backup plan if anything fails live
- If Google OAuth is blocked on the demo network: there's a pre-seeded test session URL (`localStorage` already populated). Mention it briefly, move on.
- If Groq is rate-limited: the prerecorded 30-second screen capture in `frontend/public/demo-fallback.mp4` covers the case-generation moment.
- If the microphone is denied: typing the question still works — call out the mic button as "free, browser-native, no key" and keep moving.
