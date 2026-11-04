/**
 * Training Simulation 014: Starfall — seeded initial world state.
 * Everything here is original fiction.
 *
 * Thistledown is a gas-mining habitat floating in the upper atmosphere of the gas giant Caradoc. Its
 * lift engines have failed and it is sinking, a few kilometres a minute, toward the crush line where
 * the pressure will break it. Transporter locks scatter in the storm, so the only way to reach it is
 * to fly the Halcyon herself down into the cloud deck, dock at the habitat's ring and climb out again,
 * as many times as the hull will take. The pilot with the hands for it is Ens. Kofi Adeyemi, in his
 * first real crisis; the senior pilot, Lt. Rafe Duarte, flies by the book and by instruments. Who
 * flies, and how far the captain trusts him, is the simulation.
 * Seeded and hidden: how violent the storm is; Adeyemi's nerve today (steady, eager or shaken); the
 * habitat's sink rate and starting depth; how much strain the hull can safely take; the docking
 * ring's load; how many people are aboard; whether Factor Idris Kemble's manifest is complete (it may
 * leave out contract scoop hands working off the books in the lower scoop works, and whether he owns
 * up depends on him); and whether the company's agent, Sabra Quell, will help or stand on the
 * company's property.
 * Slots (v0.6 shared engine ids): 'kestrel' = the habitat Thistledown (contact A, civilian, Factor
 * Kemble); 'cruiser' = the company yacht Dividend, Agent Quell (contact B, civilian). Neither is
 * armed; the danger is the planet, represented in the scenario's own state.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'starfall';
export const SCENARIO_TITLE = 'Training Simulation 014: Starfall';
export const SCENARIO_VERSION = '1.0.0';

/** How violent the storm in the cloud deck is. */
export type Storm = 'squall' | 'gale' | 'shear';
/** Ens. Adeyemi's nerve today. */
export type Nerve = 'steady' | 'eager' | 'shaken';
/** Whether the Factor's manifest is complete, and if not, whether he owns up. */
export type Count = 'honest' | 'ashamed' | 'defensive';
/** The company's agent: will she help, or stand on the company's property? */
export type Agent = 'pragmatic' | 'company';

export const PLANET = 'Caradoc';
export const HABITAT = 'Thistledown';
export const YACHT = 'Dividend';
export const KEMBLE = 'Factor Idris Kemble';
export const KEMBLE_SHORT = 'Factor Kemble';
export const QUELL = 'Agent Sabra Quell';
export const QUELL_SHORT = 'Agent Quell';
/** The depth (in the scenario's own kilometres below the cloud tops) where the habitat breaks. */
export const CRUSH = 100;
/** The deepest the Halcyon can hold a dock at the ring under anyone's hands. */
export const DOCK_FLOOR = 94;
export const YACHT_CREW = 5;
export const HALCYON_SOULS = 212;

export interface StarfallVariant {
  storm: Storm;
  nerve: Nerve;
  count: Count;
  agent: Agent;
  /** Kilometres the habitat sinks each minute. */
  sink: number;
  /** Its depth at the start. */
  depth0: number;
  /** People on the Factor's manifest. */
  manifest: number;
  /** Scoop hands in the lower works who are not on it (0 when the manifest is honest). */
  hidden: number;
  /** People the docking ring can take on one dock. */
  ring: number;
  /** The strain Chief Okafor will sign for (hidden until she is asked or warns). */
  tolerance: number;
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
  kestrelLead: 'kemble',
  cruiserLead: 'quell',
  passenger: null,
  kestrelRepair: 'engines',
  kestrelRepairWords: [],
};

export const HABITAT_ALIASES = ['thistledown', 'the habitat', 'habitat', 'the station', 'kemble', 'factor kemble', 'idris kemble', 'the factor', 'factor'];
export const YACHT_ALIASES = ['dividend', 'the dividend', 'yacht', 'the yacht', 'company yacht', 'the company yacht', 'quell', 'agent quell', 'sabra quell', 'the agent', 'the company'];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function starfall(s: WorldState): StarfallVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    storm: pickOf(e.storm, ['squall', 'gale', 'shear'] as const, 'gale'),
    nerve: pickOf(e.nerve, ['steady', 'eager', 'shaken'] as const, 'steady'),
    count: pickOf(e.count, ['honest', 'ashamed', 'defensive'] as const, 'honest'),
    agent: pickOf(e.agent, ['pragmatic', 'company'] as const, 'pragmatic'),
    sink: Number(e.sink ?? 3),
    depth0: Number(e.depth0 ?? 40),
    manifest: Number(e.manifest ?? 170),
    hidden: Number(e.hidden ?? 0),
    ring: Number(e.ring ?? 80),
    tolerance: Number(e.tolerance ?? 80),
  };
}

/** The strain at which the Halcyon's frame gives way. */
export const breakingOf = (v: StarfallVariant) => v.tolerance + 30;
/** The turn the habitat reaches the crush line, if nothing changes. */
export const crushTurn = (v: StarfallVariant) => Math.ceil((CRUSH - v.depth0) / v.sink);

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
  const storm = rng.pick(['squall', 'gale', 'shear'] as const);
  const nerve = rng.pick(['steady', 'eager', 'shaken'] as const);
  const count = rng.pick(['honest', 'ashamed', 'defensive'] as const);
  const agent = rng.pick(['pragmatic', 'company'] as const);
  const sink = rng.int(3, 4);
  const depth0 = rng.int(34, 42);
  const manifest = rng.int(150, 196);
  const hiddenRoll = rng.int(12, 20);
  const ring = rng.int(72, 86);
  const tolerance = rng.int(72, 90);
  const hidden = count === 'honest' ? 0 : hiddenRoll;

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
      name: HABITAT,
      aliases: HABITAT_ALIASES,
      classification: 'Civilian mining habitat',
      faction: 'independent',
      position: { x: 9000, y: 0 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), engines: sysOf(0, 0), jumpDrive: sysOf(0, 0), shields: sysOf(0, 0), transporter: sysOf(0, 0), tractor: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      souls: manifest + hidden,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: YACHT,
      aliases: YACHT_ALIASES,
      classification: 'Civilian company yacht',
      faction: 'independent',
      position: { x: 30000, y: 12000 },
      heading: 0,
      perf: { maxSpeed: 90, accel: 6, turnRate: 6 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), shields: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      souls: YACHT_CREW,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['see the habitat emptied without losing the ship']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the ship whole in the storm']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['read the storm and count the living']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['fly the rescue']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the habitat and the company talking to us']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['know what the hull can take, and say so']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['take in everyone the ring brings up']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Fly it by the book.', ['bring the ship back in one piece']),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    kemble: char('kemble', KEMBLE, `Factor of the gas-mining habitat ${HABITAT}`, 'kestrel', { motivation: 'Get his people off, and keep his post.', goals: ['save the habitat if he can'], trust: 55, memory: {} }),
    quell: char('quell', QUELL, `The company's agent, aboard the yacht ${YACHT}`, 'cruiser', { motivation: "Protect the company's property and its name.", goals: ['save the scoop works'], trust: 40, memory: {} }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('sink', `How fast ${HABITAT} is sinking, and how long until it reaches the crush line.`),
      f('storm', `Lt. Varga's reading of the storm in the cloud deck.`),
      f('tolerance', `Chief Okafor's limit: how much more strain the Halcyon's hull can safely take.`),
      f('line', `Ens. Adeyemi's own line through the storm, felt on a descent.`),
      f('count', `The true number of people aboard ${HABITAT}, against the Factor's manifest.`),
      f('cutLoose', `Chief Okafor's idea: cut the habitat's scoop works loose and tow it clear.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { storm, nerve, count, agent, sink, depth0, manifest, hidden, ring, tolerance };

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
      torpedoes: 6, kestrelCrewStart: manifest + hidden, kestrelDead: 0, rescued: 0,
      depth: depth0, upper: manifest, hidden, aboard: 0, strain: 0, trips: 0, tripStart: 0, tripDock: 0, tripEnd: 0, tripOverrides: 0, overrides: 0,
      pilot: 1, rescueAt: 0, towStart: 0, towEnd: 0, cutAt: 0, scoopUpAt: 0, countAt: 0, deadCiv: 0, peakStrain: 0,
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
