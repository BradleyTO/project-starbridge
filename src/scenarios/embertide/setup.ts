/**
 * Training Simulation 012: Ember Tide — seeded initial world state.
 * Everything here is original fiction.
 *
 * Ketter's Rest is a mining outpost on the near face of the moon Ketter, in orbit round the
 * variable star Myrr. Myrr flares: every few years a great flare (the miners call it the Ember
 * Tide) sweeps the near face hard enough to kill anyone on the surface or in open space. One is
 * coming. Lt. Varga's first estimate gives a wide window; the exact minute is unknown. The outpost
 * has a few hundred people and no ships of its own but one ore lifter, the Mattock; the Halcyon has
 * her shuttles. A banking crew is keeping the outpost's ore furnace alight while they bank it (a
 * furnace left to go cold cracks, and the colony with it). The question is when: how long the
 * furnace crew can stay, when the last lift goes, and when the Halcyon herself goes into the moon's
 * shadow. What the star does before it flares, how precise Varga's forecast can become, how deep the
 * old galleries really are, the Overseer's temper and the Lifter-Master's, the number of shuttles,
 * and every clock are seeded and hidden.
 * Slots (v0.6 shared engine ids): 'kestrel' = Ketter's Rest (contact A, civilian, Overseer Strome);
 * 'cruiser' = the ore lifter Mattock, Lifter-Master Ferrier (contact B, civilian). Neither is armed;
 * the danger is the star, represented in the scenario's own state.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'ember-tide';
export const SCENARIO_TITLE = 'Training Simulation 012: Ember Tide';
export const SCENARIO_VERSION = '1.0.0';

/** What Myrr does before it flares. */
export type Star = 'steady' | 'restless' | 'telling';
/** How precise Lt. Varga's model of this star can be from orbit. */
export type Model = 'firm' | 'noisy';
/** How much rock really lies over the old lower galleries. */
export type Galleries = 'deep' | 'shallow' | 'flooded';
/** What kind of overseer Strome is today. */
export type Temper = 'steady' | 'stubborn' | 'anxious';
/** What it takes to get the Lifter-Master to stop flying ore. */
export type Will = 'willing' | 'hard';

export const STAR = 'Myrr';
export const MOON = 'Ketter';
export const OUTPOST = "Ketter's Rest";
export const LIFTER = 'Mattock';
export const TIDE = 'the Ember Tide';
export const STROME = 'Overseer Dagny Strome';
export const STROME_SHORT = 'Overseer Strome';
export const FERRIER = 'Lifter-Master Joss Ferrier';
export const FERRIER_SHORT = 'Lifter-Master Ferrier';
/** Minutes from ordering a lift until it is clear of the near face. */
export const LIFT = 2;
/** Minutes for the Halcyon to reach the moon's shadow. */
export const SHADOW_MINS = 2;
/** The Halcyon's engineering team sent to the furnace. */
export const TEAM_SIZE = 6;
export const LIFTER_CREW = 7;

export interface EmberVariant {
  star: Star;
  model: Model;
  galleries: Galleries;
  temper: Temper;
  will: Will;
  /** The Halcyon's shuttles free for the lift. */
  shuttles: number;
  /** The turn the flare reaches the near face (hidden). */
  flareAt: number;
  /** Varga's first estimate: the window opens this many minutes before the flare… */
  early: number;
  /** …and closes this many after it. */
  late: number;
  /** When banking finishes, relative to two minutes before the flare (≤ 0: it can be banked in time). */
  bankOff: number;
  population: number;
  bankCrew: number;
  /** A restless star's false dawn comes this many minutes before the flare. */
  falseGap: number;
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
  kestrelLead: 'strome',
  cruiserLead: 'ferrier',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const OUTPOST_ALIASES = ["ketter's rest", 'ketters rest', 'ketter', 'the outpost', 'outpost', 'the colony', 'colony', 'the mine', 'strome', 'overseer strome', 'dagny strome', 'the overseer', 'overseer'];
export const LIFTER_ALIASES = ['mattock', 'the mattock', 'lifter', 'the lifter', 'ore lifter', 'the ore lifter', 'ferrier', 'lifter-master ferrier', 'joss ferrier', 'the lifter-master', 'lifter-master'];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function ember(s: WorldState): EmberVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    star: pickOf(e.star, ['steady', 'restless', 'telling'] as const, 'steady'),
    model: pickOf(e.model, ['firm', 'noisy'] as const, 'firm'),
    galleries: pickOf(e.galleries, ['deep', 'shallow', 'flooded'] as const, 'deep'),
    temper: pickOf(e.temper, ['steady', 'stubborn', 'anxious'] as const, 'steady'),
    will: pickOf(e.will, ['willing', 'hard'] as const, 'willing'),
    shuttles: Number(e.shuttles ?? 2),
    flareAt: Number(e.flareAt ?? 20),
    early: Number(e.early ?? 6),
    late: Number(e.late ?? 4),
    bankOff: Number(e.bankOff ?? 0),
    population: Number(e.population ?? 400),
    bankCrew: Number(e.bankCrew ?? 30),
    falseGap: Number(e.falseGap ?? 7),
  };
}

/** The turn banking would finish with no help. */
export const bankAt0 = (v: EmberVariant) => v.flareAt - 2 + v.bankOff;
/** Could the furnace be banked, and its crew lifted clear, with nobody's help? */
export const bankable = (v: EmberVariant) => bankAt0(v) + LIFT <= v.flareAt;
export const falseAt = (v: EmberVariant) => (v.star === 'restless' ? v.flareAt - v.falseGap : 0);
export const tellAt = (v: EmberVariant) => (v.star === 'telling' ? v.flareAt - 4 : 0);

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
  const star = rng.pick(['steady', 'restless', 'telling'] as const);
  const model = rng.pick(['firm', 'noisy'] as const);
  const galleries = rng.pick(['deep', 'shallow', 'flooded'] as const);
  const temper = rng.pick(['steady', 'stubborn', 'anxious'] as const);
  const will = rng.pick(['willing', 'hard'] as const);
  const shuttles = rng.int(2, 3);
  const flareAt = rng.int(17, 24);
  const early = rng.int(5, 8);
  const late = rng.int(3, 6);
  const bankOff = rng.int(-4, 2);
  const population = rng.int(380, 420);
  const bankCrew = rng.int(24, 36);
  const falseGap = rng.int(6, 8);
  const general = population - bankCrew;

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
      souls: 212,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'friendly',
    }),
    kestrel: ship('kestrel', {
      name: OUTPOST,
      aliases: OUTPOST_ALIASES,
      classification: 'Civilian mining outpost',
      faction: 'independent',
      position: { x: 28000, y: 2000 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), engines: sysOf(0, 0), jumpDrive: sysOf(0, 0), shields: sysOf(0, 0), transporter: sysOf(0, 0), tractor: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      souls: population,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: LIFTER,
      aliases: LIFTER_ALIASES,
      classification: 'Civilian ore lifter',
      faction: 'independent',
      position: { x: 14000, y: 6000 },
      heading: 0,
      perf: { maxSpeed: 70, accel: 5, turnRate: 6 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), shields: sysOf(0, 0), jumpDrive: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      souls: LIFTER_CREW,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['get the outpost lifted before the window opens']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the ship out of the flare']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['pin down the hour of the flare']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['have the ship in the shadow in time']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the outpost and the lifter informed']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['keep the shuttles flying']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['nobody caught on the surface']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    strome: char('strome', STROME, `Overseer of the mining outpost ${OUTPOST}`, 'kestrel', { motivation: 'Keep her people alive and the colony solvent.', goals: ['get the furnace banked before the flare'], trust: 55, memory: {} }),
    ferrier: char('ferrier', FERRIER, `Master of the ore lifter ${LIFTER}`, 'cruiser', { motivation: 'Keep the ore moving; it is what pays.', goals: ['fly one more run'], trust: 45, memory: {} }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('window', `Lt. Varga's first estimate of when ${TIDE} will reach the near face of ${MOON}.`),
      f('banking', `${STROME_SHORT}'s account of how long banking the furnace will take.`),
      f('galleries', `Lt. Varga's survey of how much rock really lies over the lower galleries.`),
      f('tell', `The flare's precursor in ${STAR}'s spectrum, which fixes the minute.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { star, model, galleries, temper, will, shuttles, flareAt, early, late, bankOff, population, bankCrew, falseGap };
  const bankDone = flareAt - 2 + bankOff;

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
    relations: { tension: 15, trustConcordDirectorate: 30 },
    // The Kestrel Incident's variant fields are kept (neutral values) so the shared engine and saves stay uniform.
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
      torpedoes: 6, kestrelCrewStart: population, kestrelDead: 0, rescued: 0,
      general, bank: bankCrew, team: 0, aboard: 0, lo: flareAt - early, hi: flareAt + late, readings: 0, nextReading: 0, forecastAt: 0, probeAt: 0,
      bankDone, liftAt: 0, liftOrderedAt: 0, shadowAt: 0, shadowOrderedAt: 0, shelterAt: 0, galleriesAt: 0, evacAt: 0, ferrierMode: 0, ferrierAt: 0, deadCiv: 0, deadCrew: 0,
    },
    orders: { jumpCharging: false, list: [], nextId: 1 },
    posture: { stance: 'neutral', since: 0 },
    standing: [],
    restrictions: [],
    familiarity: { drilled: {} },
    landmarks: { border: { x: -160000, y: 0 } },
    slots: SLOTS,
    clarification: null,
    lastTarget: null,
    fx: [],
    outcome: null,
  };
}
