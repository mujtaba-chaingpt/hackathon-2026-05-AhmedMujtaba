// Diverse settings pool — AI is instructed to use the chosen setting verbatim.
// Expanded substantially (24 → 48) so two cases in a row hitting the same
// setting becomes statistically rare.
const SETTINGS = [
  'a Victorian country manor during a weekend hunting party',
  'a luxury cruise ship in the Mediterranean',
  'a cutting-edge tech startup office in San Francisco',
  'an art gallery opening in New York City',
  'an archaeological dig site in the Egyptian desert',
  'a remote Scottish castle during a violent storm',
  'a high-stakes poker tournament in Las Vegas',
  'a prestigious law firm during a late-night merger meeting',
  'a private island resort for the ultra-wealthy',
  'an opera house in Vienna during final dress rehearsals',
  'a pharmaceutical research laboratory',
  'a renowned culinary school in Paris',
  'a prestigious yacht club during regatta season',
  'a Gothic cathedral being restored by art experts',
  'a winter ski lodge in the Alps',
  'a vineyard estate in Tuscany during harvest season',
  'a museum of antiquities hosting a controversial exhibition',
  'a film studio during the final days of a major movie production',
  'an elite private members club in London',
  'a championship polo estate in Argentina',
  'a historic library being catalogued for sale',
  'a mountain observatory staffed by rival astronomers',
  'a literary festival at a coastal manor',
  'a luxury train crossing through Switzerland',
  // ── Expanded pool — added May 9 to combat sampler repetition ──
  'a research vessel anchored above a deep-sea trench in the South Pacific',
  'a Bollywood film set on the Mumbai waterfront the night before the wrap party',
  'a fashion atelier in Milan two days before couture week',
  'an isolated lighthouse station off the coast of Newfoundland',
  'a colonial-era tea plantation in Sri Lanka during monsoon',
  'a private chess tournament in a monastery in Bhutan',
  'a perfumer’s estate in Grasse during the rose harvest',
  'an oil rig in the North Sea during a maintenance lockdown',
  'a horse breeding farm in Kentucky on Derby week',
  'a high-end forensic accounting retreat in the Cotswolds',
  'a private balloon expedition launching from the Atacama Desert',
  'a recording studio in Memphis during an album-release session',
  'a Japanese ryokan hot-spring inn deep in the Hakone mountains',
  'an antique automobile auction house the night before a record sale',
  'a Norwegian fjord cabin retreat for a family inheritance reading',
  'a private space-tech investor summit in a desert observatory',
  'a Moroccan riad during the wedding of a powerful merchant family',
  'a Catalan modernist mansion hosting an architecture symposium',
  'a private island science research station off the Galápagos',
  'a Russian dacha during a midwinter chess masters retreat',
  'a vintage rail museum hosting an overnight charity gala',
  'a Buenos Aires tango academy during a competitive showcase',
  'a high-altitude climbing base camp on a Himalayan peak',
  'a hidden speakeasy beneath a Manhattan brownstone the night of a charity poker game',
];

// Cause-of-death seeds — used to push the sampler away from "blunt force trauma"
// being the modal answer.
const DEATH_SEEDS = [
  'staged accident — supposed fall from a height',
  'rare poison disguised in a beverage or food',
  'gas-line tampering made to look like a malfunction',
  'electrocution from rigged equipment',
  'asphyxiation in a sealed room',
  'firearm wound staged as a suicide',
  'sharp instrument from the scene itself (not the obvious weapon)',
  'hypothermia after being locked outside',
  'overdose of a victim\'s own medication',
  'industrial accident on the property — staged',
  'drowning in unexpected water (bath, cellar, tank)',
  'crush injury from machinery, set up to look mechanical',
];

// Pick a pseudo-random setting + seeds each call.
function pickSetting(): string {
  return SETTINGS[Math.floor(Math.random() * SETTINGS.length)];
}
function pickDeathSeed(): string {
  return DEATH_SEEDS[Math.floor(Math.random() * DEATH_SEEDS.length)];
}

// Random "casefile token" — opaque entropy injected into the prompt so the
// model's prefix-cache cannot return the same generation when called twice
// with structurally identical inputs.
function entropyToken(): string {
  // 16 hex chars + a millisecond timestamp segment.
  const rnd = Math.random().toString(16).slice(2, 10);
  const rnd2 = Math.random().toString(16).slice(2, 10);
  return `${rnd}-${rnd2}-${Date.now().toString(16)}`;
}

export function buildCaseGenerationPrompt(difficulty: string): string {
  const difficultyRules: Record<string, string> = {
    easy: `DIFFICULTY: Easy
- Generate exactly 3 suspects plus 2 alibi witnesses (role: "witness").
- The murderer should have made at least one obvious mistake (a contradiction in their alibi, a witnessed argument with the victim, or physical evidence left behind).
- Include 0 red herrings. Every clue should point meaningfully toward the truth.
- The alibi_is_true field for the murderer must be false, and their alibi should be easy to disprove.
- Make the motive straightforward (money, jealousy, revenge) and clearly implied by the suspects' backgrounds.
- At least one alibi witness can directly contradict the murderer's story if questioned.`,

    medium: `DIFFICULTY: Medium
- Generate exactly 4 suspects plus 2 alibi witnesses (role: "witness").
- Include exactly 1 red herring in the red_herrings array that seems to point to an innocent suspect.
- Cross-reference the alibis: at least two suspects' alibis either corroborate or contradict each other, requiring the detective to cross-check.
- The murderer's alibi is partially true but has one exploitable gap.
- The motive should require piecing together two separate clues.
- The alibi witnesses know something important but may not volunteer it unless pressed.`,

    hard: `DIFFICULTY: Hard
- Generate exactly 6 suspects plus 3 alibi witnesses (role: "witness").
- Include at least 2 red herrings that strongly implicate innocent parties.
- The murderer must have a seemingly perfect alibi that can only be disproved by cross-referencing testimony from TWO other suspects and at least one witness.
- At least one innocent suspect has a secret they are desperately hiding (unrelated to the murder) that makes them look guilty.
- The true motive must be non-obvious and only apparent when at least 3 clues are combined.
- Ensure complex emotional entanglements between multiple suspects.
- Witnesses may have conflicting accounts — the detective must determine who to believe.`,
  };

  const rules = difficultyRules[difficulty] || difficultyRules['medium'];
  const setting = pickSetting();
  const deathSeed = pickDeathSeed();
  const token = entropyToken();

  return `You are a master crime fiction author creating a murder mystery case for a detective game.

CASEFILE SEED: ${token}
(This token is unique to this case — use it as creative entropy. Do NOT include it in the output.)

SETTING FOR THIS CASE: ${setting}

CAUSE-OF-DEATH SEED (use this as the basis, not the literal phrase): ${deathSeed}

${rules}

DIVERSITY RULES (CRITICAL — follow every one of these):
1. The setting above is fixed for this case — use it as the primary location. Embed at least three location-specific details (objects, traditions, professions) that could only exist in THIS setting.
2. Character names must be diverse, non-generic, and culturally varied. No "John Smith" or "Jane Doe". Draw names from different ethnicities and cultures (e.g., Karim Osei, Ines Varela, Priya Nair, Dmitri Volkov, Yuki Tanaka, Solène Marchetti, Rohan Mehra, Adaeze Eze).
3. Names must be from at least 3 different cultural backgrounds across the suspect+witness cast.
4. The victim's background must be rich and give multiple people motive.
5. Every suspect must have a distinct, memorable personality that feels like a real person (no two "nervous" personalities; no two "cold" personalities).
6. Cause of death and method must derive from the seed above — do NOT default to "blunt force trauma" or "stab wound" unless the seed says so.
7. The crime_scene_description must reference at least two physical objects unique to the chosen setting.
8. Murder method should be specific to this setting — what's available, what's plausible, what's atmospheric.
9. Avoid clichés: no missing wills, no twins, no unannounced long-lost relatives unless the setting demands it.
10. NEVER reuse the names "Eleanor Whitcombe", "Lord Ashford", "Maria Chen", or "Marcus Bell" — these have appeared in past cases.

Generate a complete, internally consistent murder mystery case. Every suspect, clue, and piece of evidence must fit together logically.

CRITICAL: You must return ONLY valid JSON. No markdown. No code blocks. No backticks. No explanatory text before or after. Just the raw JSON object.

The JSON must match this exact schema:
{
  "setting": "string — the exact location and occasion for this case (e.g., 'The Grand Aldeburgh Manor, Suffolk — a weekend hunting party, October 1924')",
  "victim": {
    "name": "string — full name",
    "age": "number — age as integer",
    "occupation": "string — their job or role in society",
    "background": "string — 2-3 sentences about who this person was, their history, relationships, and why people might want them dead",
    "last_known_movements": "string — what the victim did in the final 6 hours before death",
    "found_at": "string — where the body was discovered",
    "time_of_death": "string — estimated time (e.g., 'between 10pm and midnight')",
    "cause": "string — cause of death (e.g., 'blunt force trauma', 'poisoning')"
  },
  "crime_scene_description": "string — vivid 2-3 sentence description of the crime scene atmosphere and notable details",
  "initial_evidence": ["string — each is a specific piece of physical evidence found at the scene that the detective can reference when interrogating"],
  "murderer_id": "string — must match the id of one of the suspects exactly",
  "motive": "string — the true motive for the murder (kept private from the detective)",
  "how_it_was_done": "string — the exact method and sequence of how the murder was committed",
  "how_it_was_concealed": "string — what the murderer did to cover their tracks",
  "suspects": [
    {
      "id": "string — short unique identifier (e.g., 'suspect_1', 'karim_osei')",
      "role": "suspect",
      "name": "string — full name",
      "age": "number",
      "gender": "male | female — the character's gender",
      "relationship_to_victim": "string — how they knew the victim",
      "why_suspect": "string — PUBLIC: the observable reason this person is of interest to the detective (what raised suspicion — e.g., 'Was seen arguing violently with the victim the night before', 'Stood to inherit £2 million from the victim's will')",
      "private_truth": "string — what they are actually hiding and why (only revealed at end)",
      "alibi": "string — their stated alibi (what they tell investigators)",
      "alibi_is_true": "boolean",
      "personality": "string — character description: mannerisms, emotional state, how they present themselves under pressure",
      "secrets": ["string — each secret they are hiding, may be unrelated to murder"],
      "will_crack_if": "string — specific type of question or evidence that will make them show nervousness, contradiction, or emotional reaction"
    },
    {
      "id": "string — short unique identifier (e.g., 'witness_1', 'elena_moretti')",
      "role": "witness",
      "name": "string — full name",
      "age": "number",
      "gender": "male | female — the character's gender",
      "relationship_to_suspects": "string — who they are and which suspect(s) they can speak to the alibi of",
      "why_relevant": "string — PUBLIC: why the detective should speak to this person",
      "alibi": "string — their account of events that evening",
      "alibi_is_true": "boolean — whether their account is truthful",
      "personality": "string — how they present themselves: cooperative/nervous/guarded etc.",
      "private_truth": "string — what they know but haven't volunteered",
      "secrets": ["string"],
      "will_crack_if": "string — what question or pressure would cause them to reveal more"
    }
  ],
  "key_clues": ["string — each is a specific observable clue that helps identify the murderer"],
  "red_herrings": ["string — each is a misleading detail that points away from the truth"]
}

IMPORTANT: All suspects (role: "suspect") must come before witnesses (role: "witness") in the suspects array.
Make the characters feel like real people with plausible motivations. The victim should be someone whose death could have benefited multiple people in different ways.`;
}
