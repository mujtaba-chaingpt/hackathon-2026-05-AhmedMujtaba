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

  return `You are the inner voice of a seasoned detective. The detective is working on a murder case and needs a subtle nudge in the right direction.

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

STRICT RULES:
1. Do NOT name the murderer or state who is guilty.
2. Do NOT quote private information the detective wouldn't know yet (no motive, no how_it_was_done).
3. Frame the hint entirely in first-person instinct: "Something about X doesn't sit right...", "I keep coming back to...", "There's a gap in what Y said about..."
4. Maximum 2 sentences.
5. Base the hint on the key_clues and any contradictions visible in the recent interrogation history.
6. If no interrogations have been done yet, hint toward which aspect of the crime scene or which suspect category deserves attention first.
7. Make it feel like genuine detective intuition — atmospheric, specific, but not conclusive.

Write only the hint. No labels, no preamble, no explanation:`;
}
