export function buildVerdictRevealPrompt(
  caseData: any,
  accusedName: string,
  correct: boolean,
): string {
  const murderer = caseData.suspects.find(
    (s: any) => s.id === caseData.murderer_id,
  );
  const murdererName = murderer ? murderer.name : 'the true killer';

  if (correct) {
    return `You are writing the closing scene of a noir detective story. The detective has correctly identified the murderer.

CASE FACTS:
- Victim: ${caseData.victim.name} (${caseData.victim.occupation})
- Found at: ${caseData.victim.found_at}, ${caseData.victim.time_of_death}
- Cause of death: ${caseData.victim.cause}
- The murderer: ${murdererName}
- True motive: ${caseData.motive}
- How it was done: ${caseData.how_it_was_done}
- How it was concealed: ${caseData.how_it_was_concealed}
- The detective accused: ${accusedName} (CORRECT)

Write a closing scene with this exact structure:
1. One paragraph: The detective's moment of realisation — how the final piece clicked into place. Written in second person ("You knew it the moment...").
2. Two paragraphs: The true sequence of events — a cinematic reconstruction of exactly how the murder unfolded, from motive to deed to concealment.
3. One paragraph: Who was lying and why — briefly note which suspects were hiding things and what their secrets were (draw from the case facts).
4. One atmospheric closing line: A single noir sentence that captures the weight of the truth being revealed. Make it memorable.

Tone: Serious, cinematic, noir. Think Raymond Chandler meets True Detective. No humor. No lightness. This is justice.

Write only the scene. No labels, no section headers, no preamble:`;
  } else {
    return `You are writing the closing scene of a noir detective story. The detective has accused the wrong person.

CASE FACTS:
- Victim: ${caseData.victim.name} (${caseData.victim.occupation})
- Found at: ${caseData.victim.found_at}, ${caseData.victim.time_of_death}
- Cause of death: ${caseData.victim.cause}
- The true murderer: ${murdererName}
- True motive: ${caseData.motive}
- How it was done: ${caseData.how_it_was_done}
- How it was concealed: ${caseData.how_it_was_concealed}
- The detective accused: ${accusedName} (WRONG)

Write a closing scene with this exact structure:
1. One paragraph: The detective's bitter realisation — the moment they see the mistake they made. Written in second person ("You pointed the finger... and you were wrong."). Acknowledge the wrongly accused person and what they were actually hiding.
2. Two paragraphs: The true sequence of events that the detective missed — a cinematic reconstruction of how the real murderer pulled it off and walked free.
3. One paragraph: What the detective should have seen — the specific clues or contradictions that pointed to the truth, and why the red herrings led them astray.
4. One atmospheric closing line: A single noir sentence about justice failing and the cost of that failure.

Tone: Serious, cinematic, noir, with an undercurrent of failure and consequence. No consolation. The real killer is free.

Write only the scene. No labels, no section headers, no preamble:`;
  }
}
