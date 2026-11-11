/**
 * Training Simulation 021: The Ninefold Lock — seeded initial world state.
 * Everything here is original fiction.
 *
 * The Halcyon's survey team set down at an abandoned Tessarine Directorate supply depot on the airless
 * moon Istra (inside ISA space since the boundary was redrawn; the Directorate kept the right to
 * recover its property and never came back). When Lt. Kaminski touched the panel by the inner door,
 * the depot's defence logic woke: a Directorate "ninefold" of nine locks in three rings. The Watch
 * (outer ring) fires on anything within its reach that behaves the way it was set to treat as
 * hostile. The Screen (middle ring) blocks the transporter, except for a moment at the top of each
 * capacitor cycle. The Keystone (inner ring) asks a question; answered right, the whole grid stands
 * down. Four people are in the entry hall with the air in their suits. It cannot be persuaded or
 * bluffed, only understood.
 *
 * Seeded and hidden: what the Watch treats as hostile (active emissions, a powered approach, or
 * haste) and which of the shuttle's two recorded incidents its log holds; Lt. Cmdr. Rask's doctrinal
 * lean; how many of the nine locks still hold and how many lamps are lit but broken; the keystone's
 * question (how many locks hold, which ring the team stands in, or what the depot keeps) and its
 * answer; the screen's cycle; the team's air; whether Crewman Tran was hurt; the Directorate recovery
 * cutter's commander's temperament and arrival.
 *
 * Slots (v0.6 shared engine ids): 'kestrel' = the Istra depot, with the survey team in its entry hall
 * (contact A, Lt. Odette Kaminski answers); 'cruiser' = the Directorate recovery cutter Ordinal,
 * Quartermaster-Commander Ottilie Kovar (contact B). No passenger.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'ninefold-lock';
export const SCENARIO_TITLE = 'Training Simulation 021: The Ninefold Lock';
export const SCENARIO_VERSION = '1.0.0';

/** What the Watch treats as hostile. */
export type Trigger = 'emission' | 'power' | 'haste';
/** Which incident the Pipit's flight recorder holds: a powered hop across the pad, or a search sweep from the pad. */
export type LogIncident = 'hop' | 'ping';
/** The keystone's question. */
export type Question = 'count' | 'ring' | 'keeps';
export type Stores = 'fuel' | 'water' | 'nothing';
export type HallRing = 'outer' | 'middle';
/** Quartermaster-Commander Kovar's temperament. */
export type Temper = 'fair' | 'wary' | 'hard';

export const MOON = 'Istra';
export const DEPOT = 'the Istra depot';
export const DEPOT_CAP = 'The Istra depot';
export const SHUTTLE = 'Pipit';
export const KAMINSKI = 'Lt. Odette Kaminski';
export const KAMINSKI_SHORT = 'Lieutenant Kaminski';
export const TRAN = 'Crewman Bao Tran';
export const WHITLOCK = 'Specialist Greer Whitlock';
export const IBARRA = 'Ens. Mateo Ibarra';
export const CUTTER = 'Ordinal';
export const KOVAR = 'Quartermaster-Commander Ottilie Kovar';
export const KOVAR_SHORT = 'Commander Kovar';
export const HALCYON_SOULS = 212;
export const TEAM = 4;

/** Attribute bits: what an action shows the Watch. */
export const BIT: Record<Trigger, number> = { emission: 1, power: 2, haste: 4 };
/** The incidents on record: Tran's run across the pad, the Pipit's hop, the Pipit's sweep. */
export const INCIDENT_MASK = { run: BIT.emission | BIT.haste, hop: BIT.power | BIT.haste, ping: BIT.power | BIT.emission } as const;

export interface NinefoldVariant {
  trigger: Trigger;
  logIncident: LogIncident;
  /** Rask's doctrinal lean between the two triggers Tran's run leaves open. */
  lean: Trigger;
  question: Question;
  outerLive: number;
  middleLive: number;
  /** Locks that still hold, of nine. */
  live: number;
  /** Lamps lit over locks that have lost their teeth. */
  broken: number;
  stores: Stores;
  hall: HallRing;
  /** Turns between screen gaps, and the first gap. */
  period: number;
  phase: number;
  /** Turn the team's air runs out. */
  airEnd: number;
  /** Turn the keystone first asks. */
  qAt: number;
  temper: Temper;
  /** Turn the Ordinal arrives on station. */
  arrive: number;
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
  kestrelLead: 'kaminski',
  cruiserLead: 'kovar',
  passenger: null,
  kestrelRepair: 'comms',
  kestrelRepairWords: ['team relay', 'suit relay'],
};

export const DEPOT_ALIASES = [
  'depot', 'the depot', 'istra depot', 'the istra depot', 'istra', 'the hall', 'entry hall', 'the team', 'survey team', 'our team', 'away team', 'kaminski', 'lieutenant kaminski', 'odette kaminski', 'the survey team',
];
export const CUTTER_ALIASES = ['ordinal', 'the ordinal', 'recovery cutter', 'the cutter', 'directorate cutter', 'kovar', 'commander kovar', 'quartermaster', 'quartermaster-commander', 'ottilie kovar', 'the quartermaster'];

const TRIGGERS = ['emission', 'power', 'haste'] as const;
const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function nine(s: WorldState): NinefoldVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    trigger: pickOf(e.trigger, TRIGGERS, 'emission'),
    logIncident: pickOf(e.logIncident, ['hop', 'ping'] as const, 'hop'),
    lean: pickOf(e.lean, TRIGGERS, 'emission'),
    question: pickOf(e.question, ['count', 'ring', 'keeps'] as const, 'count'),
    outerLive: Number(e.outerLive ?? 1),
    middleLive: Number(e.middleLive ?? 1),
    live: Number(e.live ?? 3),
    broken: Number(e.broken ?? 2),
    stores: pickOf(e.stores, ['fuel', 'water', 'nothing'] as const, 'fuel'),
    hall: pickOf(e.hall, ['outer', 'middle'] as const, 'outer'),
    period: Number(e.period ?? 4),
    phase: Number(e.phase ?? 4),
    airEnd: Number(e.airEnd ?? 19),
    qAt: Number(e.qAt ?? 4),
    temper: pickOf(e.temper, ['fair', 'wary', 'hard'] as const, 'fair'),
    arrive: Number(e.arrive ?? 8),
  };
}

/** Did a recorded incident (or any action with this mask) draw the Watch's fire? */
export const fires = (v: NinefoldVariant, mask: number) => (mask & BIT[v.trigger]) !== 0;
/** Tran was hit on his run unless the Watch answers only to power. */
export const tranHurt = (v: NinefoldVariant) => fires(v, INCIDENT_MASK.run);
/** Is this turn a gap in the screen? */
export const isGap = (v: NinefoldVariant, t: number) => t >= v.phase && (t - v.phase) % v.period === 0;
/** The first gap after turn t. */
export const nextGap = (v: NinefoldVariant, t: number) => {
  for (let x = t + 1; x < t + 20; x++) if (isGap(v, x)) return x;
  return t + v.period;
};

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
  const trigger = rng.pick(TRIGGERS);
  const logIncident = rng.pick(['hop', 'ping'] as const);
  const leanRight = rng.int(0, 2) > 0;
  const question = rng.pick(['count', 'ring', 'keeps'] as const);
  const outerLive = rng.int(1, 3);
  const middleLive = rng.int(1, 3);
  const live = outerLive + middleLive + 1;
  const broken = Math.min(9 - live, rng.int(1, 3));
  const stores = rng.pick(['fuel', 'water', 'nothing'] as const);
  const hall = rng.pick(['outer', 'middle'] as const);
  const period = rng.int(3, 5);
  const phase = 3 + rng.int(0, period - 1);
  const airEnd = rng.int(17, 22);
  const qAt = rng.int(3, 5);
  const temper = rng.pick(['fair', 'wary', 'hard'] as const);
  const arrive = rng.int(6, 10);
  const other: Trigger = trigger === 'emission' ? 'haste' : 'emission';
  const lean: Trigger = trigger === 'power' ? 'emission' : leanRight ? trigger : other;

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
      name: 'Istra depot',
      aliases: DEPOT_ALIASES,
      classification: 'Abandoned Directorate supply depot',
      faction: 'directorate',
      position: { x: 6000, y: 0 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ jumpDrive: sysOf(0, 0), engines: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: TEAM,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
    cruiser: ship('cruiser', {
      name: CUTTER,
      aliases: CUTTER_ALIASES,
      classification: 'Directorate recovery cutter',
      faction: 'directorate',
      position: { x: 30000, y: -14000 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems(),
      shields: { raised: false, strength: 100 },
      weapons: { state: 'safe', target: null },
      souls: 38,
      containment: 100,
      detected: false,
      scanLevel: 0,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['bring the survey team home']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['understand the grid before anyone walks into it', 'say how far the evidence goes, and no further']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['measure the screen without lighting up the ship']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['take the ship in exactly as ordered']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the team on a tight beam', 'translate whatever the depot says']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['get the team out through the wall if it comes to that']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['keep everyone in that hall breathing']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    kaminski: char('kaminski', KAMINSKI, 'Survey team leader', 'kestrel', {
      motivation: 'Get her people out. She touched the panel, and she knows it.',
      goals: ['keep her team calm and breathing', 'tell the Halcyon exactly what she sees'],
      knowledge: ['run', 'board', 'hall', 'bays', 'tran'],
      trust: 75,
      memory: {},
    }),
    tran: char('tran', TRAN, 'Survey team', 'kestrel', { motivation: '', goals: [], trust: 70, memory: {} }),
    whitlock: char('whitlock', WHITLOCK, 'Survey team', 'kestrel', { motivation: '', goals: [], trust: 70, memory: {} }),
    ibarra: char('ibarra', IBARRA, 'Shuttle pilot', 'kestrel', { motivation: '', goals: [], trust: 70, memory: {} }),
    kovar: char('kovar', KOVAR, `Commanding the recovery cutter ${CUTTER}`, 'cruiser', {
      motivation: 'Recover what belongs to the Directorate and keep its secrets in the depot. She has no wish to start anything.',
      goals: ['keep ISA eyes and hands out of the depot', 'learn what the ISA team saw', 'avoid an incident'],
      knowledge: ['standdown'],
      trust: 45,
      memory: {},
    }),
    keystone: char('keystone', 'The keystone', 'The depot’s inner lock', 'kestrel', { motivation: '', goals: [], trust: 50, memory: {} }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('trapped', `The survey team (four of the Halcyon's crew) is sealed in the entry hall of ${DEPOT} on ${MOON}. The depot's Directorate defence logic woke when they touched it. A screen over the hall blocks the transporter, and guns cover the approach.`), known: true, discoveredTurn: 0 },
      f('doctrine', `Lt. Cmdr. Rask: a Directorate ninefold is nine locks in three rings. The Watch fires on what behaves as it was set to call hostile; the Screen blocks the transporter but drops for a moment at the top of each capacitor cycle, and hardens if it is hammered; the Keystone asks a question, and the right answer stands the whole grid down.`),
      f('run', 'Lt. Kaminski: what happened when Crewman Tran ran back across the pad for spare air cells, with his scanner sweeping the path.'),
      f('log', `The ${SHUTTLE}'s flight recorder: what happened to the shuttle on the pad after the grid woke.`),
      f('watch', 'Lt. Cmdr. Rask, on the evidence: what the Watch treats as hostile.'),
      f('tran', 'Crewman Tran was hit on his run. His suit has sealed over the wound, but he is bleeding inside it.'),
      f('question', "The keystone's question, translated by Lt. Szabo."),
      f('board', "Lt. Kaminski's description of the lock board by the inner door: lamps lit under Directorate glyphs."),
      f('boardRead', 'Lt. Cmdr. Rask reads the board: how many of the nine locks still hold.'),
      f('hall', 'Lt. Kaminski: how many seals lie behind the team, and how many ahead.'),
      f('hallRead', 'Lt. Cmdr. Rask: which ring of the depot the entry hall stands in.'),
      f('bays', 'Lt. Kaminski looks into the store bays off the hall.'),
      f('cycle', "The screen's capacitor cycle: when it drops, and when it will drop next."),
      f('standdown', `${KOVAR} holds the depot's stand-down authority.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { trigger, logIncident, lean, question, outerLive, middleLive, live, broken, stores, hall, period, phase, airEnd, qAt, temper, arrive };

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
    relations: { tension: 15, trustConcordDirectorate: 40 },
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
      torpedoes: 6, kestrelCrewStart: TEAM, kestrelDead: 0, rescued: 0,
      range: 0, approachLeft: 0, approachMode: 0, hits: 0, cand: 7, probes: 3, probeAt: 0, probeMask: 0,
      gapsSeen: 0, lastGap: 0, beamAt: 0, hammers: 0, wrongs: 0, askAt: 0, deaths: 0, pendingWarn: 0, pendingAnswer: 0,
      cutLand: 0, cutDone: 0, cutMode: 0, pingAt: -9, freedAt: 0,
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
