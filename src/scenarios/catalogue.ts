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
  entry(
    10,
    'TRN-gardener',
    'gardener',
    'The Gardener',
    'Something pale and branching is growing across a rock in a small mining field, a little further every hour, toward the claims. The miners have their cutting charges set and want it burned. Nobody knows yet whether it is even alive. Seeded: every run can differ.',
    ['the gardener', 'gardener', 'cobble field', 'the cobble field', 'spindle', 'mining field'],
    ['the gardener', 'gardener'],
  ),
  entry(
    11,
    'TRN-coldwater',
    'coldwater',
    'Coldwater',
    'A coolant valve in the Halcyon\'s plant has killed a young engineer, and the station below is running on batteries. Half of engineering has stopped work: they believe his report on that valve was buried. They may be right. Seeded: every run can differ.',
    ['coldwater', 'cold water', 'coldwater station', 'the strike', 'strike'],
    ['coldwater', 'cold water'],
  ),
  entry(
    12,
    'TRN-ember-tide',
    'ember-tide',
    'Ember Tide',
    'A variable star is about to flare, and the flare will scour the near face of the moon where a mining outpost of four hundred people keeps its furnace alight. The Halcyon can lift them all. The question is when: nobody knows the minute yet, and the furnace crew want every minute they can get. Seeded: every run can differ.',
    ['ember tide', 'the ember tide', 'ketters rest', 'ketter', 'flare', 'solar flare'],
    ['ember tide', 'the ember tide'],
  ),
  entry(
    13,
    'TRN-seventh-bell',
    'seventh-bell',
    'The Seventh Bell',
    'Six hours ago, by a navigation beacon on the Directorate border, an ISA patrol cutter fired on a Directorate courier. Two of the courier\'s crew are dead. The Halcyon has been sent to hold the inquiry, and everybody already knows what they want it to find. Seeded: every run can differ.',
    ['the seventh bell', 'seventh bell', 'harrow lane', 'the harrow lane', 'tamber', 'the inquiry'],
    ['the seventh bell', 'seventh bell'],
  ),
  entry(
    14,
    'TRN-starfall',
    'starfall',
    'Starfall',
    'A gas-mining habitat has lost its lift engines and is sinking into the storms of a gas giant, toward the depth that will crush it. The only way to its people is to fly the Halcyon down into the clouds, again and again, and the pilot with the hands for it is the youngest officer on the bridge. Seeded: every run can differ.',
    ['starfall', 'star fall', 'thistledown', 'caradoc', 'the gas giant', 'gas giant', 'sinking habitat'],
    ['starfall', 'star fall'],
  ),
  entry(
    15,
    'TRN-corsairs',
    'corsairs',
    'Corsairs of the Veyl Shoals',
    'A distress call has drawn the Halcyon deep into the Veyl Shoals, a reef of asteroids and metallic dust, and there is no ship in distress: only corsairs, waiting in the rocks for her cargo. They outnumber her, they know the ground, and they have a plan. Seeded: every run can differ.',
    ['corsairs of the veyl shoals', 'corsairs', 'veyl shoals', 'the veyl shoals', 'veyl', 'hagfish', 'the corsairs', 'pirates'],
    ['corsairs of the veyl shoals', 'corsairs', 'veyl shoals'],
  ),
  entry(
    16,
    'TRN-glass',
    'glass-nebula',
    'The Glass Nebula',
    'A survey shuttle is lost inside a nebula that bends sensor returns and stretches time. Its last two messages contradict: one says stay away; the other, stamped later, asks for help. The environment lies, and the science officer\'s model is the only map. Seeded: every run can differ.',
    ['the glass nebula', 'glass nebula', 'glass', 'nebula', 'citrine', 'the citrine'],
    ['the glass nebula', 'glass nebula'],
  ),
  entry(
    17,
    'TRN-tribunal',
    'tribunal',
    'Tribunal at Kesh Varo',
    'On shore leave, a Halcyon crewman is arrested by the independent world of Kesh Varo for entering a sacred site — a capital offence there. He says he went in to help a collapsed pilgrim. Fleet orders are to respect local sovereignty: a trade treaty is at stake. The trial is tomorrow. Seeded: every run can differ.',
    ['tribunal at kesh varo', 'tribunal', 'kesh varo', 'kesh', 'varo', 'quiet stone', 'askel'],
    ['tribunal at kesh varo', 'tribunal', 'kesh varo'],
  ),
  entry(
    18,
    'TRN-weather',
    'weather-engine',
    'The Weather Engine',
    'A colony\'s weather control station has locked itself down as a superstorm builds. Its dead founder sealed the controls with a personal cipher hidden in his own life, the colony is sure of the wrong answer, and his estranged daughter knows more than she will say. Seeded: every run can differ.',
    ['the weather engine', 'weather engine', 'weather', 'meridian', 'greywall', 'quarrie'],
    ['the weather engine', 'weather engine'],
  ),
  entry(
    19,
    'TRN-hollow',
    'hollow-crown',
    'Hollow Crown',
    'A deposed governor holds a relay station\'s staff hostage and will talk only to the Halcyon. His successor wants him dead and has a strike team waiting, and one of the hostages is not who she claims to be. Seeded: every run can differ.',
    ['hollow crown', 'the hollow crown', 'hollow', 'crown', 'ostrin', 'ostrin relay', 'aubrel', 'mallory'],
    ['hollow crown', 'the hollow crown'],
  ),
  entry(
    20,
    'TRN-gravity',
    'gravitys-edge',
    "Gravity's Edge",
    'A neutron star is passing through the Corriden system, and the Halcyon is the only ship that can record it. The deeper she goes, the better the data and the greater the strain on her frame, and the gauges may be wrong. Seeded: every run can differ.',
    ["gravity's edge", 'gravitys edge', 'gravity edge', 'the gravity edge', 'gravity', 'vagrant', 'corriden', 'neutron star', 'lisle'],
    ["gravity's edge", 'gravitys edge'],
  ),
];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, first: 1, two: 2, second: 2, three: 3, third: 3, four: 4, fourth: 4, five: 5, fifth: 5, six: 6, sixth: 6, seven: 7, seventh: 7, eight: 8, eighth: 8, nine: 9, ninth: 9, ten: 10, tenth: 10, eleven: 11, eleventh: 11, twelve: 12, twelfth: 12, thirteen: 13, thirteenth: 13, fourteen: 14, fourteenth: 14, fifteen: 15, fifteenth: 15, sixteen: 16, sixteenth: 16, seventeen: 17, seventeenth: 17, eighteen: 18, eighteenth: 18, nineteen: 19, nineteenth: 19, twenty: 20, twentieth: 20,
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
  const num = /^(?:0*(\d{1,3})|(twentieth|twenty|nineteenth|nineteen|eighteenth|eighteen|seventeenth|seventeen|thirteenth|fourteenth|fifteenth|sixteenth|eleventh|thirteen|fourteen|seventh|twelfth|fifteen|sixteen|second|fourth|eighth|eleven|twelve|three|seven|eight|first|third|fifth|sixth|ninth|tenth|four|five|nine|one|two|six|ten))(?: one)?$/.exec(rest);
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
