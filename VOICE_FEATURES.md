# Voice Features Plan — Murder Mystery Detective

## Technology Decision

**Web Speech API** — built into every modern browser (Chrome, Edge, Firefox, Safari).  
Zero cost. Zero API keys. Zero dependencies.

| Feature | API | Cost |
|---------|-----|------|
| Text-to-Speech (case file, suspect responses) | `window.speechSynthesis` | Free |
| Speech-to-Text (detective voice questions) | `window.SpeechRecognition` / `webkitSpeechRecognition` | Free |

No Groq API calls are made for voice. All audio is generated/recognised on the user's device by the browser. Voice input is hidden gracefully on browsers that lack the recognition API (e.g. Firefox).

---

## Three Voice Requirements

### Req 1 — Case File Page Narration
- A **speaker icon** button sits at the top of every page in the CaseFileBook.
- Click it → the browser reads the page's text aloud.
- When the page finishes reading, it **auto-advances** to the next page and continues reading.
- A visual **"Reading…"** pulse indicator shows when narration is active.
- Clicking again (or the stop button) cancels narration.

### Req 2 — Victim & Witness Introduction Story
- Triggered automatically when the last page of the CaseFileBook is reached (or after
  sequential auto-read finishes all pages).
- A `buildCaseNarrative(caseData)` function creates a flowing detective-brief script:
  ```
  "Our victim is [name], a [age]-year-old [occupation]. [background].
   Their last known movements: [last_known_movements].
   The body was discovered at [found_at], time of death [time_of_death], cause: [cause].
   The scene: [crime_scene_description].
   We have [N] persons of interest. [for each suspect: name, why they are a suspect].
   There are also [N] witnesses who may corroborate or contradict what we know."
  ```
- Uses a slightly **slower, more dramatic pace** than page narration.
- User can skip it at any time.

### Req 3 — Interrogation Response Voice
- A **speaker toggle button** in the `InterrogationChat` header (per character).
- When enabled: every new response from that character is **automatically read aloud**.
- Each character gets a **distinct synthetic voice signature** (pitch + rate variation
  derived from a hash of their name) — no extra APIs needed.
  - Witnesses: slightly higher pitch (more nervous/helpful tone)
  - Suspects: lower pitch, slower pace (evasive, guarded)
- The detective's typed questions are never read aloud.
- Visual indicator on the message bubble while it is being spoken.

### Req 4 — Detective Voice Questions (Speech-to-Text) — DONE May 8
- A **microphone button** sits to the LEFT of the chat input field.
- Click → browser starts listening (free Web Speech Recognition).
- Live partial transcripts stream into the input as the user speaks.
- Click again, hit Send, or unmount → stops.
- Visual: crimson pulsing ring + "Listening..." placeholder while active.
- Auto-stops when TTS playback starts (so the mic doesn't pick up the suspect's voice).
- Errors surface inline above the input: `'Microphone access denied'`, `'No speech detected'`, etc.
- Hidden entirely on browsers without `SpeechRecognition` (Firefox).
- No API key, no server cost, no external service.

### Req 6 — Background Music on Pre-Game Pages — DONE May 8
- Looping mystery/thriller score (`frontend/public/music/mystery-thriller.mp3`) plays on landing, dashboard, and the new-game selector.
- Volume hardcoded at `0.32` so the score never overpowers TTS or SFX.
- Auto-stops the moment the user enters `/game/[sessionId]` (suspect voices stay crystal clear).
- Auto-resumes when the user returns to dashboard / result.
- The header mute button toggles music alongside the rest of the audio system.
- Lazily creates the `<audio>` element, gated on first user click/keypress per browser autoplay rules.

### Req 5 — Auto-narrate Case File on Open — DONE May 8
- When `CaseFileBook` mounts, after a 900 ms delay (so Firefox has time to populate the voices list),
  `handleReadAll()` auto-fires and narrates the whole file Cover → Witnesses → Begin.
- Persistent preference: `mm_case_file_autoplay` localStorage key (`'1'` default, `'0'` to opt out).
- An **`Auto` toggle** in the file's top bar flips the persistent preference (gold when on, dim when off).
- The existing **`Stop` button** still mutes the current playback without changing the persistent preference.
- TTS is cancelled cleanly on unmount.

---

## Implementation Plan

### Step 1 — TTS Engine (`frontend/src/lib/tts.ts`)
```
tts.ts
  speak(text, options: { pitch, rate, volume })  → SpeechSynthesisUtterance
  stop()
  isSpeaking() → boolean
  getVoice(lang?) → best available voice
  getCharacterVoice(name, role) → { pitch, rate }  — deterministic from name hash
```
- Single-utterance queue: calling `speak()` cancels any current speech first.
- Returns a Promise that resolves when the utterance ends.
- Gracefully no-ops if `window.speechSynthesis` is not available.

### Step 2 — React Hook (`frontend/src/hooks/use-tts.ts`)
```
useTTS()
  speaking: boolean
  currentText: string | null
  speak(text, opts?) → Promise<void>
  stop()
  toggle(text, opts?)
```
- Exposes reactive `speaking` state for UI indicators.
- Used by both CaseFileBook and InterrogationChat.

### Step 3 — Case File Book updates (`case-file-book.tsx`)
- Import `useTTS` hook.
- Add a speaker icon button in the top bar of the book.
- On click: read current page's extracted text, then auto-advance and read next page.
- On last page: read the full case narrative (`buildCaseNarrative`).
- Show a pulsing gold microphone icon / "Reading…" label while active.
- Stop button cancels at any time.

### Step 4 — Interrogation Chat updates (`interrogation-chat.tsx`)
- Add a voice toggle icon button in the character header.
- State: `voiceEnabled` (default: off, persists per character in local Map).
- When a new suspect message arrives and `voiceEnabled = true`: call `speak(msg.content, getCharacterVoice(character.name, character.role))`.
- Show a small animated speaker icon next to messages that are currently being read.
- Stop reading when user sends next question.

### Step 5 — `buildCaseNarrative` helper (`case-file-book.tsx` or `tts.ts`)
```typescript
function buildCaseNarrative(caseData: PublicCase): string {
  const lines = [
    `Briefing for the ${caseData.setting ?? 'investigation'}.`,
    `Our victim is ${victim.name}, ${victim.age ? `aged ${victim.age}, ` : ''}a ${victim.occupation}.`,
    victim.background ?? '',
    `Their last known movements: ${victim.last_known_movements ?? 'unknown'}.`,
    `The body was found at ${victim.found_at}, time of death ${victim.time_of_death}.`,
    `Cause of death: ${victim.cause}.`,
    `Crime scene: ${caseData.crime_scene_description}`,
    `We have ${suspects.length} person${suspects.length !== 1 ? 's' : ''} of interest.`,
    ...suspects.map((s, i) => `${i + 1}. ${s.name}. ${s.why_suspect ?? ''}`),
    witnesses.length > 0
      ? `There ${witnesses.length === 1 ? 'is' : 'are'} also ${witnesses.length} alibi witness${witnesses.length !== 1 ? 'es' : ''} who may shed light on the events.`
      : '',
    `Good luck, Detective. The clock is ticking.`,
  ];
  return lines.filter(Boolean).join(' ');
}
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `frontend/src/lib/tts.ts` | **CREATE** — TTS engine |
| `frontend/src/hooks/use-tts.ts` | **CREATE** — React hook |
| `frontend/src/components/game/case-file-book.tsx` | **UPDATE** — add narration button + auto-read |
| `frontend/src/components/game/interrogation-chat.tsx` | **UPDATE** — add voice toggle + auto-play |

No backend changes. No new packages. No API keys.

---

## Known Limitations

- Voice quality depends on the OS/browser. Chrome on Windows/Mac has the best voices.
- Mobile Safari requires a user gesture before `speechSynthesis` works.
- Firefox's voice list loads asynchronously — a small delay before voices are available.
- `speechSynthesis.speak()` is limited to ~32,000 characters in some browsers; the case
  narrative is well under this limit.
- No offline support (some browser voices require internet on first use).

---

## Status

- [x] Step 1 — `tts.ts` engine
- [x] Step 2 — `use-tts.ts` hook
- [x] Step 3 — CaseFileBook narration (per-page speaker + "Read All" + auto-advance + case narrative)
- [x] Step 4 — InterrogationChat voice toggle (per-character, auto-plays responses, speaker-bar indicator)
- [x] Step 5 — `buildCaseNarrative` (inside `tts.ts`)

---

## Extended Voice Improvements (post-Step-5)

### Gender-aware voice selection

`getCharacterVoice(name, role, gender?)` now accepts an optional `gender` parameter:

- **Female characters** — scans the browser's voice list for known female voice names (Google UK English Female, Microsoft Zira, Samantha, Karen, Moira, Tessa, Victoria, Fiona, Nicky, Allison, Ava, Susan). Higher pitch range (1.05–1.25).
- **Male characters** — scans for known male voices (Google UK English Male, Microsoft George/David/Mark, Daniel, Alex, Fred, Bruce, Tom, Junior, Arthur). Lower pitch range (0.85–1.12).
- Falls back to neutral `getBestVoice()` if no gender-specific voice is found on the device.
- All voices use `volume: 1.0` (hardcoded in `speak()`) for maximum clarity over ambient sound.

Backend now includes `"gender": "male | female"` in both suspect and witness schema so the frontend receives this field via the game session API.

### TTS vs ambient separation

`startAmbient()` is now a no-op for sound layers — it only warms up the AudioContext. This ensures TTS voices are always clear and never compete with ambient sound. Thunder still fires (via canvas lightning sync), SFX remain intact.

### Thunder sync

Thunder is no longer scheduled by a timer. `playThunderClap()` is now a standalone export from `audio.ts` called directly by `NoirBackground` canvas when a lightning flash is triggered (0.8–3.5 s delay to simulate distance).

### File changes

| File | Change |
|------|--------|
| `frontend/src/lib/tts.ts` | Added `getBestFemaleVoice()`, `getBestMaleVoice()`, gender param in `getCharacterVoice` |
| `frontend/src/lib/types.ts` | Added `gender?: 'male' \| 'female'` to `Suspect` and `Witness` interfaces |
| `frontend/src/lib/audio.ts` | Removed rain/wind layers; exported `playThunderClap()` as standalone |
| `frontend/src/components/ui/noir-background.tsx` | Import `playThunderClap`; thunder fires after each lightning flash; 55 leaves |
| `frontend/src/components/game/interrogation-chat.tsx` | Passes `character.gender` to `getCharacterVoice` |
| `backend/src/ai/prompts/case-generation.prompt.ts` | Added `"gender"` field to suspect and witness schema |
| `backend/src/case/case.service.ts` | Passes `gender` through `sanitizeCase` mapping |
