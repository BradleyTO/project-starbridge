/**
 * The training-simulation catalogue: pure data, no scenario code, so the engine (bridge launch),
 * the interpreter (simulation names) and the universe (Mission Archive) can all read it without
 * importing scenario modules. Add one entry per simulation; register its module in registry.ts.
 *
 * See docs/SCENARIO_GUIDE.md for how to author a scenario and docs/SCENARIO_ROADMAP.md for the plan.
 */
export interface SimulationInfo {
  /** 1-based catalogue number ("Training Simulation 002"). */
  number: number;
  /** Mission Archive id (stable: stored in simulation history). */
  trainingId: string;
  /** ScenarioModule id (stable: stored in saves). */
  scenarioId: string;
  /** Short name ("The Kestrel Incident"). */
  name: string;
  /** Full title shown in the archive and on the bridge. */
  title: string;
  blurb: string;
  /** Lower-case words or phrases that name this simulation when the captain asks for it ("begin the … simulation"). */
  words: string[];
  /** Distinctive names that start it even without the word "simulation" ("begin the Kestrel Incident"). Never ordinary orders. */
  direct: string[];
}

const pad = (n: number) => String(n).padStart(3, '0');
const entry = (number: number, trainingId: string, scenarioId: string, name: string, blurb: string, words: string[], direct: string[]): SimulationInfo => ({
  number,
  trainingId,
  scenarioId,
  name,
  title: `Training Simulation ${pad(number)}: ${name}`,
  blurb,
  words,
  direct,
});

export const SIMULATIONS: readonly SimulationInfo[] = [
  entry(1, 'TRN-kestrel', 'kestrel-incident', 'The Kestrel Incident', 'A crippled freighter, a Directorate cruiser and a hidden passenger. Seeded: every run can differ.', ['kestrel incident', 'kestrel', 'incident'], ['kestrel incident', 'kestrel']),
  entry(
    2,
    'TRN-tallis',
    'tallis-quarantine',
    'Quarantine at Tallis Gate',
    'A pilgrim liner with sickness aboard, a colony that has closed its gate, and a picket ordered to fire. What is the illness, and who is telling the truth? Seeded: every run can differ.',
    ['quarantine at tallis gate', 'tallis gate', 'tallis', 'quarantine', 'mercy of ilun', 'ilun', 'pilgrim', 'liner'],
    ['quarantine at tallis gate', 'tallis gate', 'tallis'],
  ),
  entry(
    3,
    'TRN-quiet',
    'quiet-signal',
    'The Quiet Signal',
    'Someone is signalling by silence in the beam of the Teyma pulsar, and they only understand answers. A Directorate signals ship is listening too. What are they asking, and what do they want? Seeded: every run can differ.',
    ['the quiet signal', 'quiet signal', 'quiet', 'teyma pulsar', 'teyma', 'pulsar'],
    ['the quiet signal', 'quiet signal'],
  ),
  entry(
    4,
    'TRN-reactor',
    'reactor-night',
    'Reactor Night',
    'Ship’s night, no enemy, and the Halcyon’s own core is running away. The only crew member who can reach the reactor spine is frightened of the pod she is sitting in. What has failed, and who do you send? Seeded: every run can differ.',
    ['reactor night', 'reactor', 'cascade', 'work pod'],
    ['reactor night'],
  ),
  entry(
    5,
    'TRN-saltglass',
    'saltglass-accord',
    'The Saltglass Accord',
    'Two clans, one small moon of salt ice, and the ISA asked to hold the table. Each delegate claims all of Saltglass; neither will say why it matters, and one of them is running out of time. Seeded: every run can differ.',
    ['the saltglass accord', 'saltglass accord', 'saltglass', 'clans', 'mediation'],
    ['the saltglass accord', 'saltglass accord', 'saltglass'],
  ),
  entry(
    6,
    'TRN-ion',
    'ion-season',
    'Ion Season',
    'The ion season is closing the Corrie Drift, and two slow ore haulers need to be through it before it does. Three bands of storm, two channels in each, and nobody aboard can see which one is calm. Seeded: every run can differ.',
    ['ion season', 'ion storm', 'ion', 'storm', 'convoy', 'corrie drift'],
    ['ion season'],
  ),
  entry(
    7,
    'TRN-ledger',
    'ghost-ledger',
    'Ghost Ledger',
    'A reception aboard the Halcyon, four guests about to sail, and someone has copied the navigation keys. Every guest stepped out tonight, and every guest has something to hide. Which secret is the theft? Seeded: every run can differ.',
    ['ghost ledger', 'ledger', 'navigation keys', 'vell crossing', 'reception'],
    ['ghost ledger'],
  ),
  entry(
    8,
    'TRN-lantern',
    'lantern-drift',
    'The Lantern Drift',
    'A three-century-old generation ship adrift among dead hulls, nine hundred colonists asleep in failing cryo banks, a damaged custodian that will not let them be woken without cause, and a salvage tug that wants the hull. Not every bank can be saved in time. Who is woken first? Seeded: every run can differ.',
    ['the lantern drift', 'lantern drift', 'lantern', 'generation ship', 'eventide', 'sleeper ship'],
    ['the lantern drift', 'lantern drift'],
  ),
  entry(
    9,
    'TRN-picket',
    'long-picket',
    'The Long Picket',
    'A colony’s reactor is failing, the Halcyon has the parts in her hold, and a lone Directorate picket frigate sits across the only safe road through disputed space. Her commander was a cadet with Cmdr. Marrow, a long time ago. His orders are to stop you, not to fight you. Get through without a shot, without conceding the claim, and without a lie the Code forbids. Seeded: every run can differ.',
    ['the long picket', 'long picket', 'picket', 'sable narrows', 'wrenmoor', 'blockade'],
    ['the long picket', 'long picket'],
  ),
];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, first: 1, two: 2, second: 2, three: 3, third: 3, four: 4, fourth: 4, five: 5, fifth: 5, six: 6, sixth: 6, seven: 7, seventh: 7, eight: 8, eighth: 8, nine: 9, ninth: 9, ten: 10, tenth: 10,
};

/** Words that do not name a simulation ("begin the training simulation"). */
const GENERIC = /\b(the|a|an|new|another|training|simulation|sim|simulator|program(?:me)?|exercise|drill|default|number|no|please|scenario|mission)\b/g;

/**
 * Which simulation a spoken name refers to. A number ("002", "number two", "the second one"),
 * a title word ("Tallis", "the Kestrel"), or nothing at all (the first simulation, as before
 * there were several). Returns null for a name that matches nothing.
 */
export function simulationByName(spoken: string | undefined): SimulationInfo | null {
  const t = (spoken ?? '').toLowerCase().replace(/[#"'’.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
  const rest = t.replace(GENERIC, ' ').replace(/\s+/g, ' ').trim();
  if (!rest) return SIMULATIONS[0];
  const num = /^(?:0*(\d{1,3})|(one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth))(?: one)?$/.exec(rest);
  if (num) return SIMULATIONS.find((x) => x.number === (num[1] ? Number(num[1]) : NUMBER_WORDS[num[2]])) ?? null;
  // Longest matching phrase wins ("kestrel incident" before "incident").
  let best: { s: SimulationInfo; len: number } | null = null;
  for (const s of SIMULATIONS)
    for (const w of s.words) if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(rest) && (!best || w.length > best.len)) best = { s, len: w.length };
  return best?.s ?? null;
}

export const simulationById = (trainingId: string): SimulationInfo | undefined => SIMULATIONS.find((x) => x.trainingId === trainingId);
export const simulationForScenario = (scenarioId: string): SimulationInfo | undefined => SIMULATIONS.find((x) => x.scenarioId === scenarioId);

/** Every distinctive simulation name, for the interpreter ("begin Tallis Gate" without the word "simulation"). */
export const SIMULATION_NAME_PATTERN = SIMULATIONS.flatMap((s) => s.direct)
  .sort((a, b) => b.length - a.length)
  .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
