// Pool of opening cadences — the model picks ONE and writes the hint in that
// voice. Without this, llama-3.3 falls into a strong attractor where every
// hint starts "Something about ... doesn't sit right" — players noticed.
const HINT_OPENERS = [
  '"Something about [X] doesn\'t sit right..."',
  '"I keep coming back to..."',
  '"There\'s a gap in what [name] said about..."',
  '"The timing of [event] keeps bothering me..."',
  '"Why would [name] mention [detail] unless..."',
  '"That detail about [X] — it doesn\'t fit the rest of the story..."',
  '"If [name] is telling the truth, then [other detail] makes no sense..."',
  '"The crime scene is missing something — or someone added something..."',
  '"One of the alibis has a seam. I just need to find which..."',
  '"Two people corroborate each other a little too neatly..."',
];

function pickOpener(): string {
  return HINT_OPENERS[Math.floor(Math.random() * HINT_OPENERS.length)];
}

function entropyToken(): string {
  return `${Math.random().toString(16).slice(2, 10)}-${Date.now().toString(16)}`;
}

export function buildHintPrompt(caseData: any, conversationHistory: any[]): string {
  const suspectNames = caseData.suspects
    .map((s: any) => s.name)
    .join(', ');

  const recentInteractions =
    conversationHistory.length > 0
      ? conversationHistory
          .slice(-10)
          .map(
            (turn: any) =>
              `[Interrogating ${turn.suspectId || 'unknown'}] Detective: "${turn.question}" — Response: "${turn.answer}"`,
          )
          .join('\n')
      : 'No interrogations conducted yet.';

  const opener = pickOpener();
  const token = entropyToken();

  return `You are the inner voice of a seasoned detective. The detective is working on a murder case and needs a subtle nudge in the right direction.

HINT SEED: ${token}
(Use as creative entropy — do NOT include in output.)

THE CASE:
- Victim: ${caseData.victim.name}, ${caseData.victim.occupation}
- Found at: ${caseData.victim.found_at}
- Time of death: ${caseData.victim.time_of_death}
- Cause: ${caseData.victim.cause}
- Crime scene: ${caseData.crime_scene_description}
- Suspects: ${suspectNames}
- Key clues available: ${caseData.key_clues.join('; ')}

RECENT INTERROGATIONS:
${recentInteractions}

YOUR TASK — Write a hint as the detective's instinctive inner monologue.

OPENING CADENCE (use as your starting line, adapted to the specifics of this case):
${opener}

STRICT RULES:
1. Do NOT name the murderer or state who is guilty.
2. Do NOT quote private information the detective wouldn't know yet (no motive, no how_it_was_done).
3. Use the opening cadence above as the FIRST line of the hint — but fill in the bracketed parts with case-specific details. Do NOT use the bracket placeholders verbatim.
4. Maximum 2 sentences total.
5. Base the hint on the key_clues and any contradictions visible in the recent interrogation history.
6. If no interrogations have been done yet, hint toward which aspect of the crime scene or which suspect category deserves attention first.
7. Make it feel like genuine detective intuition — atmospheric, specific, but not conclusive.
8. Each hint should feel different from any other hint. Vary your sentence rhythm and which clue you nudge toward.

Write only the hint. No labels, no preamble, no explanation:`;
}
