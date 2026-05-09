/**
 * tts.ts — Web Speech API wrapper for Murder Mystery Detective.
 * Zero cost, zero API keys. Uses the browser's built-in SpeechSynthesis engine.
 *
 * Entry points:
 *   speak(text, options?)  — speak text, returns a Promise<void> that resolves on end
 *   stop()                 — cancel any current speech immediately
 *   isSpeaking()           — true if speech is ongoing
 *   getCharacterVoice(name, role)  — deterministic pitch/rate for a character
 */

export interface TTSOptions {
  pitch?: number;   // 0.5–2.0  (default 1.0)
  rate?: number;    // 0.5–2.0  (default 0.95)
  volume?: number;  // 0.0–1.0  (default 1.0)
  voice?: SpeechSynthesisVoice | null;
}

/** Is the Web Speech API available in this browser? */
export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Voice caches — busted when browser voices change */
let _cachedVoice:       SpeechSynthesisVoice | null | undefined = undefined;
let _cachedFemaleVoice: SpeechSynthesisVoice | null | undefined = undefined;
let _cachedMaleVoice:   SpeechSynthesisVoice | null | undefined = undefined;

/** Female voice names across OS/browser combinations */
const FEMALE_VOICE_NAMES = [
  'Google UK English Female',
  'Microsoft Zira - English (United States)',
  'Microsoft Hazel - English (United Kingdom)',
  'Microsoft Susan - English (United Kingdom)',
  'Samantha',   // macOS
  'Karen',      // macOS Australian
  'Moira',      // macOS Irish
  'Tessa',      // macOS South African
  'Victoria',   // macOS
  'Fiona',      // macOS Scottish
  'Nicky',      // macOS
  'Allison',    // macOS
  'Ava',        // macOS Enhanced
  'Susan',      // macOS
];

/** Male voice names across OS/browser combinations */
const MALE_VOICE_NAMES = [
  'Google UK English Male',
  'Microsoft George - English (United Kingdom)',
  'Microsoft David - English (United States)',
  'Microsoft Mark - English (United States)',
  'Daniel (Enhanced)',
  'Daniel',
  'Alex',       // macOS
  'Fred',       // macOS
  'Bruce',      // macOS
  'Tom',        // macOS
  'Junior',     // macOS
  'Arthur',     // macOS Enhanced
];

/** Best available female English voice, or null if none found. */
export function getBestFemaleVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  if (_cachedFemaleVoice !== undefined) return _cachedFemaleVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  for (const name of FEMALE_VOICE_NAMES) {
    const v = voices.find((v) => v.name === name);
    if (v) { _cachedFemaleVoice = v; return v; }
  }
  // Search for any voice with "female" or "woman" in the name
  const any = voices.find((v) =>
    /female|woman/i.test(v.name) && /^en/i.test(v.lang));
  if (any) { _cachedFemaleVoice = any; return any; }
  _cachedFemaleVoice = null;
  return null;
}

/** Best available male English voice. Falls back to the neutral best voice. */
export function getBestMaleVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  if (_cachedMaleVoice !== undefined) return _cachedMaleVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  for (const name of MALE_VOICE_NAMES) {
    const v = voices.find((v) => v.name === name);
    if (v) { _cachedMaleVoice = v; return v; }
  }
  _cachedMaleVoice = null;
  return null;
}

/**
 * Pick the best available neutral English voice.
 * Used for narration; male/female character voices use getBestMaleVoice/getBestFemaleVoice.
 */
export function getBestVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  if (_cachedVoice !== undefined) return _cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const preferred = [
    'Google UK English Male',
    'Microsoft George - English (United Kingdom)',
    'Daniel (Enhanced)',
    'Daniel',
    'Google US English',
    'Google UK English Female',
    'Microsoft David - English (United States)',
    'Alex',
    'Samantha',
  ];
  for (const name of preferred) {
    const v = voices.find((v) => v.name === name);
    if (v) { _cachedVoice = v; return v; }
  }
  const localEn = voices.find((v) => v.localService && /^en/i.test(v.lang));
  if (localEn) { _cachedVoice = localEn; return localEn; }
  const anyEn = voices.find((v) => /^en/i.test(v.lang));
  if (anyEn) { _cachedVoice = anyEn; return anyEn; }
  _cachedVoice = voices[0] ?? null;
  return _cachedVoice;
}

/** Bust all voice caches when the browser's voice list changes (Firefox async load) */
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    _cachedVoice       = undefined;
    _cachedFemaleVoice = undefined;
    _cachedMaleVoice   = undefined;
  };
}

/** Simple djb2 hash — deterministic per string */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

/**
 * Returns a deterministic pitch/rate pair for a character so each character
 * sounds slightly distinct without needing multiple voice files.
 *
 * Suspects: lower, slower (evasive, guarded)
 * Witnesses: slightly higher, more natural pace (cooperative)
 */
/**
 * Returns voice options for a character, selecting an appropriate male or female voice
 * (using the browser's voice list) plus deterministic pitch/rate variation from name hash.
 *
 * @param gender  'male' | 'female' | undefined — uses pitch fallback if gender-specific
 *                voice is not available on the user's system.
 */
export function getCharacterVoice(
  name: string,
  role: 'suspect' | 'witness',
  gender?: 'male' | 'female',
): TTSOptions {
  const h = hash(name);
  const isFemale = gender === 'female';

  if (isFemale) {
    const femVoice = getBestFemaleVoice();
    return {
      pitch:  femVoice ? (1.05 + (h % 20) / 100) : (1.15 + (h % 25) / 100),
      rate:   0.90 + (h % 15) / 100,   // 0.90–1.05
      volume: 1.0,
      voice:  femVoice ?? getBestVoice(),
    };
  }

  // Male character
  const malVoice = getBestMaleVoice();
  if (role === 'witness') {
    return {
      pitch:  malVoice ? (1.00 + (h % 12) / 100) : (1.05 + (h % 20) / 100),
      rate:   0.92 + (h % 18) / 100,   // 0.92–1.10
      volume: 1.0,
      voice:  malVoice ?? getBestVoice(),
    };
  }

  // Male suspect — lower, more guarded
  return {
    pitch:  malVoice ? (0.85 + (h % 15) / 100) : (0.80 + (h % 25) / 100),
    rate:   0.85 + (h % 15) / 100,     // 0.85–1.00
    volume: 1.0,
    voice:  malVoice ?? getBestVoice(),
  };
}

/** Narrator voice (case file pages) */
export const NARRATOR_VOICE: TTSOptions = {
  pitch:  0.95,
  rate:   1.10,   // brisk and clear — faster at user request
  volume: 1.0,
};

/** Dramatic pace for the full case narrative */
export const STORY_VOICE: TTSOptions = {
  pitch:  0.90,
  rate:   1.00,   // natural pace for the briefing story
  volume: 1.0,
};

// ── Core speak / stop ──────────────────────────────────────────────────

let _currentUtterance: SpeechSynthesisUtterance | null = null;
let _resolveCurrentSpeak: (() => void) | null = null;
let _rejectCurrentSpeak: ((reason?: unknown) => void) | null = null;

/**
 * Speak `text` aloud. Cancels any current speech first.
 * Returns a Promise that resolves when the utterance ends, or rejects on error.
 */
export function speak(text: string, options: TTSOptions = {}): Promise<void> {
  if (!ttsSupported()) return Promise.resolve();
  if (!text.trim()) return Promise.resolve();

  // Cancel current speech
  stop();

  return new Promise<void>((resolve, reject) => {
    _resolveCurrentSpeak = resolve;
    _rejectCurrentSpeak = reject;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch  = options.pitch  ?? 1.0;
    utterance.rate   = options.rate   ?? 0.92;
    utterance.volume = 1.0; // always max — no ambient to compete with

    // Use provided voice or auto-select best
    const voice = options.voice !== undefined ? options.voice : getBestVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      _currentUtterance = null;
      const res = _resolveCurrentSpeak;
      _resolveCurrentSpeak = null;
      _rejectCurrentSpeak = null;
      res?.();
    };

    utterance.onerror = (event) => {
      _currentUtterance = null;
      const rej = _rejectCurrentSpeak;
      _resolveCurrentSpeak = null;
      _rejectCurrentSpeak = null;
      // 'interrupted' is not a real error — user clicked stop
      if (event.error === 'interrupted' || event.error === 'canceled') {
        resolve(); // treat cancel as normal completion
      } else {
        rej?.(new Error(event.error));
      }
    };

    _currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

/** Cancel any ongoing speech immediately. */
export function stop(): void {
  if (!ttsSupported()) return;
  window.speechSynthesis.cancel();
  _currentUtterance = null;
  const res = _resolveCurrentSpeak;
  _resolveCurrentSpeak = null;
  _rejectCurrentSpeak = null;
  res?.(); // resolve cleanly rather than reject
}

/** Is the engine currently speaking? */
export function isSpeaking(): boolean {
  if (!ttsSupported()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Speak a sequence of text chunks one after another.
 * Returns a Promise that resolves when all chunks are done (or stop() is called).
 * Calls `onChunkDone(index)` after each chunk finishes.
 */
export async function speakSequence(
  chunks: string[],
  options: TTSOptions = {},
  onChunkDone?: (index: number) => void,
): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    if (!isSpeaking() && i > 0) return; // was stopped externally
    try {
      await speak(chunks[i], options);
      onChunkDone?.(i);
    } catch {
      return;
    }
  }
}

/**
 * Build a dramatic briefing narrative from the public case data.
 * Used as the "story" played after all case file pages are read.
 */
export function buildCaseNarrative(caseData: {
  setting?: string;
  victim: {
    name: string;
    age?: number;
    occupation: string;
    background?: string;
    last_known_movements?: string;
    found_at: string;
    time_of_death: string;
    cause: string;
  };
  crime_scene_description: string;
  suspects: Array<{ name: string; why_suspect?: string; role?: string }>;
  witnesses?: Array<{ name: string; why_relevant?: string }>;
}): string {
  const { victim, suspects, witnesses = [] } = caseData;
  const suspectCount = suspects.length;
  const witnessCount = witnesses.length;

  const parts: string[] = [
    caseData.setting
      ? `Listen carefully, Detective. Here is your briefing for the case at ${caseData.setting}.`
      : `Listen carefully, Detective. Here is your full briefing.`,

    `Our victim is ${victim.name}${victim.age ? `, aged ${victim.age}` : ''}, a ${victim.occupation}.`,

    victim.background ?? '',

    victim.last_known_movements
      ? `Their last known movements: ${victim.last_known_movements}.`
      : '',

    `The body was discovered at ${victim.found_at}. Time of death: ${victim.time_of_death}. Cause of death: ${victim.cause}.`,

    `Crime scene report: ${caseData.crime_scene_description}`,

    `We have identified ${suspectCount} person${suspectCount !== 1 ? 's' : ''} of interest.`,

    ...suspects.map(
      (s, i) =>
        `Number ${i + 1}: ${s.name}. ${s.why_suspect ?? ''}`.trim(),
    ),

    witnessCount > 0
      ? `There ${witnessCount === 1 ? 'is' : 'are'} also ${witnessCount} alibi witness${witnessCount !== 1 ? 'es' : ''} you should interview. ${witnesses.map((w) => `${w.name}: ${w.why_relevant ?? ''}`.trim()).join('. ')}.`
      : '',

    `That is everything we know so far. The case is yours, Detective. Find the killer before time runs out.`,
  ];

  return parts.filter(Boolean).join('  ');
}
