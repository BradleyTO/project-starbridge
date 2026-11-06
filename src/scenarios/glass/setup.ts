/**
 * Training Simulation 016: The Glass Nebula — seeded initial world state.
 * Everything here is original fiction.
 *
 * The Halcyon answers a survey call from the shuttle Citrine, lost inside the Glass Nebula: a
 * region that bends sensor returns and stretches time signals until the stamps on a message lie.
 * The shuttle's last two messages contradict. One says "stay away"; the other, stamped later,
 * asks for help. Which is real depends on the nebula's physics, and Lt. Varga's model is the only
 * map. Surveyor Nessa Vale may answer in garbled fragments once a channel holds; the Prism buoy
 * is an automated survey relay with no one aboard. Seeded and hidden: which message is the echo,
 * what the nebula actually does (shear, mirror or lag), the shuttle crew's state, and how long
 * Varga's model takes.
 * Slots (v0.6 shared engine ids): 'kestrel' = survey shuttle Citrine, Surveyor Vale (contact A);
 * 'cruiser' = ISA survey buoy Prism (contact B, automated).
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'glass-nebula';
export const SCENARIO_TITLE = 'Training Simulation 016: The Glass Nebula';
export const SCENARIO_VERSION = '1.0.0';

/** Which of the two messages is the ghost or echo. */
export type Echo = 'help-false' | 'stay-false';
/** How the nebula lies to sensors and clocks. */
export type Physics = 'shear' | 'mirror' | 'lag';
/** The shuttle crew's true state. */
export type CrewState = 'alive' | 'failing' | 'gone';

export const NEBULA = 'the Glass Nebula';
export const NEBULA_CAP = 'The Glass Nebula';
export const SHUTTLE = 'Citrine';
export const BUOY = 'Prism';
export const FOLD = 'the Fold';
export const LOOKING = 'the Looking Glass';
export const RIM = 'the Rim';
export const VALE = 'Surveyor Nessa Vale';
export const VALE_SHORT = 'Surveyor Vale';
export const HALCYON_SOULS = 212;
export const SHUTTLE_CREW = 4;

export interface GlassVariant {
  echo: Echo;
  physics: Physics;
  crew: CrewState;
  /** Turns each stage of Lt. Varga's model takes. */
  pace: number;
  /** The turn life support fails on a failing crew if nobody reaches them. */
  failAt: number;
  /** Souls aboard the shuttle when the exercise starts (0 if already gone). */
  souls: number;
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
  kestrelLead: 'vale',
  cruiserLead: 'prism',
  passenger: null,
  kestrelRepair: 'lifeSupport',
  kestrelRepairWords: ['life support', 'air', 'scrubbers', 'scrubber'],
};

export const SHUTTLE_ALIASES = [
  'citrine', 'the citrine', 'shuttle', 'the shuttle', 'survey shuttle', 'the survey shuttle',
  'vale', 'nessa vale', 'surveyor vale', 'surveyor', 'the surveyor', 'nessa',
];
export const BUOY_ALIASES = [
  'prism', 'the prism', 'buoy', 'the buoy', 'survey buoy', 'the survey buoy', 'relay', 'the relay', 'beacon', 'the beacon',
];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function glass(s: WorldState): GlassVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    echo: pickOf(e.echo, ['help-false', 'stay-false'] as const, 'stay-false'),
    physics: pickOf(e.physics, ['shear', 'mirror', 'lag'] as const, 'shear'),
    crew: pickOf(e.crew, ['alive', 'failing', 'gone'] as const, 'alive'),
    pace: Number(e.pace ?? 2),
    failAt: Number(e.failAt ?? 18),
    souls: Number(e.souls ?? SHUTTLE_CREW),
  };
}

/** True locus of the shuttle, once Varga's model is in. */
export function trueLocus(v: GlassVariant): 'rim' | 'glass' | 'fold' {
  // help-false: stay-away is the real later message → shuttle is at the Rim (or already gone).
  // stay-false: help is real → shuttle is deep, past the Looking Glass or in the Fold.
  if (v.echo === 'help-false') return 'rim';
  if (v.physics === 'shear') return 'fold';
  return 'glass';
}

/** False locus the "help" signal appears to come from when it is an echo. */
export function falseLocus(v: GlassVariant): 'rim' | 'glass' | 'fold' {
  if (v.echo === 'help-false') return v.physics === 'shear' ? 'fold' : 'glass';
  return 'rim';
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
  const echo = rng.pick(['help-false', 'stay-false'] as const);
  const physics = rng.pick(['shear', 'mirror', 'lag'] as const);
  const crew = rng.pick(['alive', 'failing', 'gone'] as const);
  const pace = rng.int(2, 3);
  const failAt = rng.int(14, 22);
  const souls = crew === 'gone' ? 0 : SHUTTLE_CREW;

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
      name: SHUTTLE,
      aliases: SHUTTLE_ALIASES,
      classification: 'Survey shuttle',
      faction: 'concord',
      position: { x: 22000, y: 4000 },
      heading: 270,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: crew === 'gone' ? 40 : 70,
      systems: systems({
        lifeSupport: sysOf(crew === 'failing' ? 35 : crew === 'gone' ? 0 : 55, 40),
        jumpDrive: sysOf(0, 0),
        transporter: sysOf(0, 0),
        sensors: sysOf(20, 30),
      }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: BUOY,
      aliases: BUOY_ALIASES,
      classification: 'ISA survey buoy',
      faction: 'concord',
      position: { x: 8000, y: -2000 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ transporter: sysOf(0, 0), weapons: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: 0,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'friendly',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['get the shuttle crew out without stranding the Halcyon']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep weapons cold in a place that does not fight back']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['build a model of the nebula before anyone commits the ship']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['fly the Fold only when science says it is a path']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['sort the real signal from the echo']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['rig a probe relay if the ship cannot go deep']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['be ready for whoever comes across']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Fly it by the book.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    vale: char('vale', VALE, `Surveyor, shuttle ${SHUTTLE}`, 'kestrel', {
      motivation: 'Get her crew home, or keep the next ship from dying the way hers might.',
      goals: ['be found if she can still be found'],
      trust: 55,
      status: crew === 'gone' ? 'dead' : 'active',
      memory: {},
    }),
    prism: char('prism', `Buoy ${BUOY}`, `Automated survey buoy ${BUOY}`, 'cruiser', {
      motivation: 'Relay what it is told.',
      goals: [],
      trust: 50,
      memory: {},
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('messages', `Two contradictory messages from the ${SHUTTLE}: one says stay away; the other asks for help.`),
      f('order', `Lt. Varga's finding: which of the two messages is later by the nebula's physics, not by its stamp.`),
      f('locus', `Lt. Varga's model of where the ${SHUTTLE} actually is.`),
      f('model', `Lt. Varga's working model of ${NEBULA}: what it does to sensors, clocks and paths.`),
      f('crew', `What state the ${SHUTTLE}'s crew are in.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { echo, physics, crew, pace, failAt, souls };

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
    relations: { tension: 10, trustConcordDirectorate: 40 },
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
      torpedoes: 6, kestrelCrewStart: souls, kestrelDead: 0, rescued: 0,
      pos: 0, moveTo: 0, moveAt: 0, modelAt: 0, orderAt: 0, locusAt: 0, crewAt: 0,
      probeAt: 0, relayAt: 0, arriveAt: 0, strandAt: 0, shearAt: 0,
      delay: 0, garbled: 0,
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
