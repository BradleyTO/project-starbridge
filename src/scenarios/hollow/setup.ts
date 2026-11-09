/**
 * Training Simulation 019: Hollow Crown — seeded initial world state.
 * Everything here is original fiction.
 *
 * Severin Mallory, the deposed governor of the colony of Aubrel, has taken the duty staff of the
 * Ostrin Relay hostage and demands to be restored. His successor, Acting Governor Rhea Stannard,
 * wants him dead, and her Civic Guard has a strike team in the relay's lower ring. One of the
 * hostages, the woman speaking as relay technician Tamsin Rook, is not who she claims to be.
 * Dr. Osei is the one who can read the governor's condition over comms.
 *
 * Seeded and hidden: the governor's condition (and so what reaches him); who the false hostage
 * really is (the successor's agent, the governor's own accomplice holding a live charge, or a
 * frightened witness with proof); the successor's temperament (and so what will make her hold the
 * Guard); the strike team's timing; how many hostages; how strained he is at the start.
 *
 * Slots (v0.6 shared engine ids): 'kestrel' = the Ostrin Relay, Severin Mallory (contact A);
 * 'cruiser' = Government House, Acting Governor Stannard (contact B); 'passenger' = the woman
 * speaking as Tamsin Rook, reached on the relay's line with the governor's leave (agents.ts).
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'hollow-crown';
export const SCENARIO_TITLE = 'Training Simulation 019: Hollow Crown';
export const SCENARIO_VERSION = '1.0.0';

/** What Dr. Osei hears in the governor's voice (and so what reaches him). */
export type Condition = 'exhausted' | 'grief' | 'withdrawal';
/** Who the woman speaking as Tamsin Rook really is. */
export type Impostor = 'agent' | 'accomplice' | 'witness';
/** The successor's temperament (and so what makes her hold the Guard). */
export type Successor = 'hard' | 'political' | 'cautious';

export const COLONY = 'Aubrel';
export const RELAY = 'the Ostrin Relay';
export const RELAY_CAP = 'The Ostrin Relay';
export const HOUSE = 'Government House';
export const MALLORY = 'Severin Mallory';
export const MALLORY_SHORT = 'Mallory';
export const STANNARD = 'Acting Governor Rhea Stannard';
export const STANNARD_SHORT = 'Acting Governor Stannard';
export const GUARD = 'the Civic Guard';
export const GUARD_CAP = 'The Civic Guard';
export const ROOK = 'Tamsin Rook';
export const ROOK_SHORT = 'Rook';
export const SON = 'Aris';
export const DACE = 'Corporal Liane Dace';
export const CASTELL = 'Mira Castell';
export const MARSH = 'Auditor Selene Marsh';
export const HALCYON_SOULS = 212;
/** Strain at or below which the governor will lay it down, once he has a reason to. */
export const SURRENDER_AT = 30;
/** Strain at which he breaks. */
export const BREAK_AT = 100;

export interface HollowVariant {
  condition: Condition;
  impostor: Impostor;
  successor: Successor;
  /** Turn the Guard goes through the bulkhead (before any hold). */
  strikeAt: number;
  /** Strain at the start (0–100). */
  stress0: number;
  /** Hostages, including the woman speaking as Rook. */
  hostages: number;
  /** Hostages killed if the Guard goes in. */
  strikeDead: number;
  /** Turn the false hostage makes her own move. */
  moveAt: number;
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
  kestrelLead: 'mallory',
  cruiserLead: 'stannard',
  passenger: 'rook',
  kestrelRepair: 'lifeSupport',
  kestrelRepairWords: [],
};

export const RELAY_ALIASES = [
  'ostrin relay', 'the ostrin relay', 'ostrin', 'the relay', 'relay', 'relay station', 'the station', 'station',
  'mallory', 'severin mallory', 'severin', 'governor mallory', 'the governor', 'former governor', 'deposed governor', 'hostage taker', 'the hostage taker',
];
export const HOUSE_ALIASES = [
  'government house', 'stannard', 'rhea stannard', 'acting governor', 'acting governor stannard', 'governor stannard', 'aubrel', 'the colony', 'colony',
  'the successor', 'successor',
];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function hollow(s: WorldState): HollowVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    condition: pickOf(e.condition, ['exhausted', 'grief', 'withdrawal'] as const, 'exhausted'),
    impostor: pickOf(e.impostor, ['agent', 'accomplice', 'witness'] as const, 'witness'),
    successor: pickOf(e.successor, ['hard', 'political', 'cautious'] as const, 'cautious'),
    strikeAt: Number(e.strikeAt ?? 14),
    stress0: Number(e.stress0 ?? 54),
    hostages: Number(e.hostages ?? 6),
    strikeDead: Number(e.strikeDead ?? 3),
    moveAt: Number(e.moveAt ?? 6),
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
  // Fixed draw order (the same seed always gives the same world).
  const condition = rng.pick(['exhausted', 'grief', 'withdrawal'] as const);
  const impostor = rng.pick(['agent', 'accomplice', 'witness'] as const);
  const successor = rng.pick(['hard', 'political', 'cautious'] as const);
  const strikeAt = rng.int(13, 16);
  const stress0 = rng.int(50, 58);
  const hostages = rng.int(5, 7);
  const strikeDead = rng.int(2, 4);
  const moveAt = rng.int(5, 7);

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
      name: 'Ostrin Relay',
      aliases: RELAY_ALIASES,
      classification: 'Civilian relay station',
      faction: 'independent',
      position: { x: 2400, y: 700 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0), engines: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: hostages + 1,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'neutral',
    }),
    cruiser: ship('cruiser', {
      name: HOUSE,
      aliases: HOUSE_ALIASES,
      classification: 'Civilian colony government',
      faction: 'independent',
      position: { x: 9000, y: -4200 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0), engines: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: 300,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['get every hostage out alive', 'keep the Halcyon out of Aubrel\'s politics']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['have a security team ready, and not use it while talking works']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['watch the relay and the Guard\'s team in the lower ring']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', []),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the line to the relay open', 'check every name on it']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', []),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['hear what is wrong with the man before anyone pushes him']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    mallory: char('mallory', MALLORY, `Deposed governor of ${COLONY}, holding ${RELAY}`, 'kestrel', {
      motivation: 'Be given back what he believes was stolen from him, or at least be heard.',
      goals: ['be restored as governor', 'not walk out to his successor\'s rope', 'not be lied to'],
      knowledge: ['rigged'],
      trust: 30,
      memory: {},
    }),
    stannard: char('stannard', STANNARD, `Acting governor of ${COLONY}`, 'cruiser', {
      motivation:
        successor === 'hard'
          ? 'End Mallory for good, and be seen to.'
          : successor === 'political'
            ? 'Have Mallory gone from Aubrel, one way or another, before the council sits.'
            : 'End this without a massacre on her first month in office.',
      goals: ['get Mallory into her custody', 'keep the Guard\'s timetable unless given a reason'],
      knowledge: impostor === 'agent' ? ['agent'] : [],
      trust: 45,
      memory: {},
    }),
    rook: char('rook', ROOK, 'Speaking as a relay technician, among the hostages', 'kestrel', {
      motivation:
        impostor === 'agent'
          ? 'Give the Guard its reason to go in.'
          : impostor === 'accomplice'
            ? 'See the relay burn before it is handed to Stannard.'
            : 'Get out alive with what she knows, and not be found out by Stannard.',
      goals: ['not be found out'],
      knowledge: [impostor],
      trust: 40,
      memory: {},
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('siege', `${MALLORY}, deposed governor of ${COLONY}, holds ${hostages} of ${RELAY}'s duty staff and demands to be restored. ${GUARD_CAP} has a strike team in the relay's lower ring.`), known: true, discoveredTurn: 0 },
      { ...f('passenger_identity', `${ROOK}, who says she is a relay technician, has spoken for the hostages.`), known: true, discoveredTurn: 0 },
      f('condition', `Dr. Osei's reading of ${MALLORY_SHORT}'s condition, and what is likely to reach him.`),
      f('impostor', `The relay's duty roster does not match: the woman speaking as ${ROOK} is not ${ROOK}.`),
      f('agent', `Burst transmissions on a Civic Guard band from inside the relay: one of the hostages is reporting to ${HOUSE}.`),
      f('charge', `A live charge on the relay's power core, keyed to a wrist unit worn by one of the hostages.`),
      f('nocharge', `No charge on the relay's core: ${MALLORY_SHORT}'s threat to the core is a bluff.`),
      f('witness', `The woman speaking as ${ROOK} is ${MARSH} of the Electoral Office.`),
      f('evidence', `${MARSH}'s ledger: the council vote that removed ${MALLORY_SHORT} was bought.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { condition, impostor, successor, strikeAt, stress0, hostages, strikeDead, moveAt };

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
    relations: { tension: 30, trustConcordDirectorate: 40 },
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
      torpedoes: 6, kestrelCrewStart: hostages + 1, kestrelDead: 0, rescued: 0,
      stress: stress0, hostagesIn: hostages, strikeAt, lastContact: 0, listened: 0, held: 0,
      assessAt: 0, rosterAt: 0, traceAt: 0, windowAt: 0, surrenderAt: 0, pendingWarn: 0, holdAsks: 0,
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
