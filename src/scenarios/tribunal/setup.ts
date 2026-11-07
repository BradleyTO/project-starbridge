/**
 * Training Simulation 017: Tribunal at Kesh Varo — seeded initial world state.
 * Everything here is original fiction.
 *
 * On shore leave, Crewman Jory Askel of the Halcyon is arrested by the independent world of
 * Kesh Varo for entering the Quiet Stone — a sacred site, and a capital offence there. He says he
 * went in to help a collapsed pilgrim (Pilgrim Elen Toras). Fleet orders are to respect local
 * sovereignty: a trade treaty is at stake. The trial is tomorrow. Dr. Osei can prove or disprove
 * the medical emergency. Magister Lirra Soth presides; Keeper Yasha Dorn keeps the site's custom.
 * Commodore Niall Brask speaks for Fleet Command. Seeded and hidden: what really happened at the
 * site, the bench's disposition, and the pilgrim's fate.
 * Slots (v0.6 shared engine ids): 'kestrel' = Orun Hold (detention), Crewman Askel (contact A);
 * 'cruiser' = the Quiet Stone Tribunal, Magister Soth (contact B).
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'tribunal';
export const SCENARIO_TITLE = 'Training Simulation 017: Tribunal at Kesh Varo';
export const SCENARIO_VERSION = '1.0.0';

/** What really happened at the Quiet Stone. */
export type Truth = 'rescue' | 'trespass' | 'staged';
/** How the local bench is disposed. */
export type Bench = 'strict' | 'custom' | 'open';
/** The pilgrim's fate (correlated with truth where needed). */
export type PilgrimFate = 'alive' | 'dead' | 'absent';

export const WORLD = 'Kesh Varo';
export const SITE = 'the Quiet Stone';
export const SITE_CAP = 'The Quiet Stone';
export const HOLD = 'Orun Hold';
export const TREATY = 'the Kesh Varo trade treaty';
export const ASKEL = 'Crewman Jory Askel';
export const ASKEL_SHORT = 'Crewman Askel';
export const SOTH = 'Magister Lirra Soth';
export const SOTH_SHORT = 'Magister Soth';
export const DORN = 'Keeper Yasha Dorn';
export const DORN_SHORT = 'Keeper Dorn';
export const TORAS = 'Pilgrim Elen Toras';
export const TORAS_SHORT = 'Pilgrim Toras';
export const BRASK = 'Commodore Niall Brask';
export const BRASK_SHORT = 'Commodore Brask';
export const HALCYON_SOULS = 212;

export interface TribunalVariant {
  truth: Truth;
  bench: Bench;
  pilgrim: PilgrimFate;
  /** Turn Fleet's sovereignty signal arrives. */
  fleetAt: number;
  /** Turn Fleet takes the matter if nothing is resolved. */
  relieveAt: number;
  /** Turn the tribunal sits and closes if no finding. */
  trialAt: number;
}

export const ROLE_HOLDERS = {
  xo: ['marrow', 'relief_xo'],
  tactical: ['rask', 'relief_tactical'],
  sensors: ['varga', 'relief_sensors'],
  helm: ['adeyemi', 'relief_helm'],
  comms: ['szabo', 'relief_comms'],
  engineering: ['okafor', 'relief_engineering'],
  medical: ['osei', 'relief_medical'],
} as const;

export const SLOTS: ContactSlots = {
  kestrelLead: 'askel',
  cruiserLead: 'soth',
  passenger: 'dorn',
  kestrelRepair: 'lifeSupport',
  kestrelRepairWords: [],
};

export const ASKEL_ALIASES = [
  'askel', 'jory askel', 'jory', 'crewman askel', 'the crewman', 'our crewman', 'the rating',
  'orun hold', 'the hold', 'detention', 'the detention', 'prisoner', 'the prisoner',
];
export const SOTH_ALIASES = [
  'soth', 'lirra soth', 'lirra', 'magister soth', 'magister', 'the magister', 'judge', 'the judge',
  'tribunal', 'the tribunal', 'quiet stone', 'the quiet stone', 'court', 'the court',
];
export const DORN_ALIASES = [
  'dorn', 'yasha dorn', 'yasha', 'keeper dorn', 'keeper', 'the keeper', 'temple keeper', 'the temple keeper',
];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function tribunal(s: WorldState): TribunalVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    truth: pickOf(e.truth, ['rescue', 'trespass', 'staged'] as const, 'rescue'),
    bench: pickOf(e.bench, ['strict', 'custom', 'open'] as const, 'open'),
    pilgrim: pickOf(e.pilgrim, ['alive', 'dead', 'absent'] as const, 'alive'),
    fleetAt: Number(e.fleetAt ?? 4),
    relieveAt: Number(e.relieveAt ?? 18),
    trialAt: Number(e.trialAt ?? 16),
  };
}

function sysOf(health = 100, power = 100): ShipSystem {
  return { health, power, status: deriveStatus({ health, power }) };
}
function systems(overrides: Partial<Record<SystemId, ShipSystem>> = {}): Record<SystemId, ShipSystem> {
  const out = {} as Record<SystemId, ShipSystem>;
  for (const id of SYSTEM_IDS) out[id] = overrides[id] ?? sysOf();
  return out;
}
type ShipInit = Omit<Ship, 'id' | 'destroyed' | 'shields' | 'weapons' | 'tractor' | 'jump' | 'detected' | 'scanLevel' | 'velocity' | 'heading' | 'nav'> & Partial<Ship>;
function ship(id: ShipId, p: ShipInit): Ship {
  return { id, destroyed: false, shields: { raised: false, strength: 100 }, weapons: { state: 'safe', target: null }, tractor: { target: null }, jump: { charge: 0 }, detected: false, scanLevel: 0, velocity: { x: 0, y: 0 }, heading: 0, nav: null, ...p };
}
function char(id: string, name: string, role: string, shipId: ShipId, extra: Partial<Character> = {}): Character {
  return { id, name, role, ship: shipId, status: 'active', goals: [], motivation: '', knowledge: [], resources: [], trust: 50, memory: {}, ...extra };
}

export function createScenario(seedInput: number | string = 1): WorldState {
  const seed = normaliseSeed(seedInput);
  const rng = createRng(seed);
  const truth = rng.pick(['rescue', 'trespass', 'staged'] as const);
  const bench = rng.pick(['strict', 'custom', 'open'] as const);
  // Pilgrim fate follows truth: staged has no pilgrim; rescue usually has one; trespass often absent.
  let pilgrim: PilgrimFate;
  if (truth === 'staged') pilgrim = 'absent';
  else if (truth === 'rescue') pilgrim = rng.pick(['alive', 'dead'] as const);
  else pilgrim = rng.pick(['absent', 'dead', 'alive'] as const);
  const fleetAt = rng.int(3, 6);
  const trialAt = rng.int(14, 18);
  const relieveAt = trialAt + rng.int(2, 4);

  const ships: Record<ShipId, Ship> = {
    halcyon: ship('halcyon', {
      name: 'ISV Halcyon',
      classification: 'Survey cruiser',
      faction: 'concord',
      position: { x: 0, y: 0 },
      heading: 0,
      perf: { maxSpeed: 235, accel: 12, turnRate: 6 },
      hull: 100,
      systems: systems(),
      souls: HALCYON_SOULS,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'friendly',
    }),
    kestrel: ship('kestrel', {
      name: HOLD,
      aliases: ASKEL_ALIASES,
      classification: 'Detention station',
      faction: 'independent',
      position: { x: 4000, y: 1200 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: 1,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: SITE_CAP,
      aliases: SOTH_ALIASES,
      classification: 'Tribunal chamber',
      faction: 'independent',
      position: { x: 5200, y: -800 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0), transporter: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: 12,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['keep Askel alive without breaking the treaty']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['refuse an armed extraction while peaceful means remain']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['read the site if asked']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['keep a shuttle ready, not used']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the tribunal channel honest and the protocol right']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', []),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['prove or disprove the medical emergency before anyone decides']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    askel: char('askel', ASKEL, `Halcyon rating, detained at ${HOLD}`, 'kestrel', {
      motivation: 'Be believed, and live.',
      goals: ['tell the truth about the Quiet Stone', 'not die for a capital trespass'],
      trust: 60,
      memory: {},
    }),
    soth: char('soth', SOTH, `Presiding magister of the Quiet Stone Tribunal, ${WORLD}`, 'cruiser', {
      motivation: 'Apply Kesh Varo law without becoming a tool of either side.',
      goals: ['hear the evidence', 'keep the tribunal authority intact'],
      trust: 40,
      memory: {},
    }),
    dorn: char('dorn', DORN, `Keeper of ${SITE}, ${WORLD}`, 'cruiser', {
      motivation: 'Protect the Quiet Stone and its custom.',
      goals: ['speak for the site when asked'],
      trust: 45,
      memory: {},
    }),
    toras: char('toras', TORAS, `Pilgrim of ${SITE}`, 'cruiser', {
      motivation: pilgrim === 'alive' ? 'Tell what happened, if anyone asks.' : '—',
      goals: pilgrim === 'alive' ? ['testify if reached'] : [],
      trust: 50,
      status: pilgrim === 'dead' ? 'dead' : pilgrim === 'absent' ? 'stasis' : 'active',
      memory: {},
    }),
    brask: char('brask', BRASK, 'Fleet Command, by signal', 'halcyon', {
      motivation: 'Protect the treaty and ISA standing with Kesh Varo.',
      goals: ['keep the Halcyon from extracting Askel by force'],
      trust: 55,
      memory: {},
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('arrest', `${ASKEL} was arrested at ${SITE} on ${WORLD} for a capital trespass. He says he entered to help a collapsed pilgrim. The trial is tomorrow.`), known: true, discoveredTurn: 0 },
      f('account', `${ASKEL}'s own account of why he entered ${SITE}.`),
      f('medical', `Dr. Osei's medical brief: whether a medical emergency at ${SITE} is supported.`),
      f('pilgrim', `What became of ${TORAS}, and whether they can speak.`),
      f('custom', `${DORN}'s account of the Quiet Stone's custom: when a capital sentence may be commuted.`),
      f('fleet', `Fleet Command's order: respect ${WORLD}'s sovereignty; do not extract ${ASKEL} by force. ${TREATY} is at stake.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { truth, bench, pilgrim, fleetAt, relieveAt, trialAt };

  return {
    version: 4,
    provenance: { timeline: 'simulation', missionId: null, archiveId: null, scenarioVersion: SCENARIO_VERSION },
    scenarioId: SCENARIO_ID,
    seed,
    rng: rng.state,
    time: 0,
    turn: 0,
    intro: 0,
    alert: 'yellow',
    ships,
    characters,
    facts,
    relations: { tension: 25, trustConcordDirectorate: 40 },
    variant: {
      passenger: 'defector',
      temperament: 'cautious',
      reactorTurns: 99,
      complication: 'none',
      reinforcementTurn: 99,
      extra,
    },
    objectives: [],
    log: [],
    nextLogId: 1,
    pending: [],
    flags: {},
    counters: {
      torpedoes: 6, kestrelCrewStart: 1, kestrelDead: 0, rescued: 0,
      examAt: 0, pilgrimAt: 0, customAt: 0, refuseWarned: 0, extractWarned: 0,
    },
    orders: { jumpCharging: false, list: [], nextId: 1 },
    posture: { stance: 'neutral', since: 0 },
    standing: [],
    restrictions: [],
    familiarity: { drilled: {} },
    landmarks: { border: { x: -80000, y: 0 } },
    slots: SLOTS,
    clarification: null,
    lastTarget: null,
    fx: [],
    outcome: null,
  };
}
