/**
 * Training Simulation 009: The Long Picket — seeded initial world state.
 * Everything here is original fiction.
 *
 * The Sable Narrows is a disputed passage, the only safe road to the ISA colony at Wrenmoor. The
 * colony's reactor is failing and the ISV Halcyon carries the replacement assemblies in her own hold.
 * A single Tessarine Directorate picket frigate, the Iron Psalm, has drawn a line across the Narrows
 * and demands that the Halcyon heave to for "inspection". Her commander, Lucan Roake, was a cadet
 * with Cmdr. Marrow at the Calder Academy. His orders are to delay, not to fight; what exactly they
 * say, what he already knows, and what kind of man he has become are seeded and hidden.
 * Slots (v0.6 shared engine ids): 'kestrel' = Wrenmoor (contact A, a civilian colony far beyond the
 * picket, on comms only; Reeve Odile Marchbank speaks for it); 'cruiser' = the picket frigate Iron Psalm,
 * Commander Lucan Roake (contact B). The Halcyon carries the cargo herself: there is no vulnerable
 * ship between two others.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'long-picket';
export const SCENARIO_TITLE = 'Training Simulation 009: The Long Picket';
export const SCENARIO_VERSION = '1.0.0';

/** What Roake's orders really say: hold the Halcyon until relieved, inspect her on a pretext, or see whether she stops at all. */
export type Orders = 'delay' | 'pretext' | 'probe';
/** What kind of officer Roake has become. */
export type Temperament = 'proud' | 'careful' | 'weary';
/** What the picket already knows: the Halcyon's cargo, where her nearest friends are, or nothing. */
export type Intel = 'cargo' | 'escort' | 'nothing';
/** Marrow and Roake at the Calder Academy. */
export type History = 'friends' | 'rivals' | 'owed';
/** Whether Wrenmoor's Reeve tells the deadline straight or overstates it. */
export type Reeve = 'steady' | 'desperate';

export const PICKET = 'Iron Psalm';
export const COLONY = 'Wrenmoor';
export const PLACE = 'the Sable Narrows';
export const ROAKE = 'Commander Lucan Roake';
export const ROAKE_SHORT = 'Commander Roake';
export const DAHL = 'Commander Ysara Dahl';
export const DAHL_SHORT = 'Commander Dahl';
export const REEVE = 'Reeve Odile Marchbank';
export const REEVE_SHORT = 'Reeve Marchbank';
export const ACADEMY = 'the Calder Academy';

export interface PicketVariant {
  orders: Orders;
  temperament: Temperament;
  intel: Intel;
  history: History;
  reeve: Reeve;
  /** The last turn the Halcyon can clear the picket and still reach Wrenmoor before its reactor is shut down. */
  deadline: number;
  /** The turn Roake's relief arrives. */
  reliefAt: number;
  /** The turn the picket's long-range sweep of the Halcyon's wake completes. */
  sweepAt: number;
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
  kestrelLead: 'marchbank',
  cruiserLead: 'roake',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const COLONY_ALIASES = ['wrenmoor', 'the colony', 'colony', 'wrenmoor colony', 'the reeve', 'reeve', 'marchbank', 'reeve marchbank', 'odile marchbank'];
export const PICKET_ALIASES = ['iron psalm', 'the iron psalm', 'psalm', 'picket', 'the picket', 'picket ship', 'the picket ship', 'frigate', 'the frigate', 'blockade', 'the blockade', 'roake', 'commander roake', 'lucan roake', 'lucan', 'dahl', 'commander dahl', 'directorate ship', 'the directorate ship'];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function picket(s: WorldState): PicketVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    orders: pickOf(e.orders, ['delay', 'pretext', 'probe'] as const, 'delay'),
    temperament: pickOf(e.temperament, ['proud', 'careful', 'weary'] as const, 'careful'),
    intel: pickOf(e.intel, ['cargo', 'escort', 'nothing'] as const, 'nothing'),
    history: pickOf(e.history, ['friends', 'rivals', 'owed'] as const, 'friends'),
    reeve: pickOf(e.reeve, ['steady', 'desperate'] as const, 'steady'),
    deadline: Number(e.deadline ?? 19),
    reliefAt: Number(e.reliefAt ?? 14),
    sweepAt: Number(e.sweepAt ?? 7),
  };
}

/** What the Reeve says the deadline is (a desperate Reeve gives it five minutes short). */
export const claimedDeadline = (v: PicketVariant) => (v.reeve === 'desperate' ? v.deadline - 5 : v.deadline);

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
  const orders = rng.pick(['delay', 'pretext', 'probe'] as const);
  const temperament = rng.pick(['proud', 'careful', 'weary'] as const);
  const intel = rng.pick(['cargo', 'escort', 'nothing'] as const);
  let history = rng.pick(['friends', 'rivals', 'owed'] as const);
  const reeve = rng.pick(['steady', 'desperate'] as const);
  const deadline = rng.int(16, 22);
  const reliefAt = rng.int(8, 24);
  const sweepAt = rng.int(5, 8);
  // A picket that only has to wait for its relief, relieved too late, whose commander is not too
  // tired to call a bluff, leaves one sure honest road: Marrow's history with him. The exercise never
  // removes it (a rival would only laugh at her).
  if (orders === 'delay' && reliefAt >= deadline && history === 'rivals' && temperament !== 'weary') history = rng.pick(['friends', 'owed'] as const);

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
      name: COLONY,
      aliases: COLONY_ALIASES,
      classification: 'Civilian colony',
      faction: 'independent',
      position: { x: 420000, y: 0 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), engines: sysOf(0, 0), jumpDrive: sysOf(0, 0), shields: sysOf(0, 0), transporter: sysOf(0, 0), tractor: sysOf(0, 0), reactor: sysOf(30, 40) }),
      shields: { raised: false, strength: 0 },
      souls: 4100,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: PICKET,
      aliases: PICKET_ALIASES,
      classification: 'Directorate picket frigate',
      faction: 'directorate',
      position: { x: 6000, y: 0 },
      heading: 180,
      perf: { maxSpeed: 200, accel: 10, turnRate: 6 },
      hull: 100,
      systems: systems(),
      shields: { raised: false, strength: 100 },
      souls: 90,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['read the man on the other ship']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the guns cold unless they are needed']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['watch the picket’s sensors']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['hold station short of the line']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['hear what the picket is told']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['keep the assemblies safe in the hold']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', []),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    roake: char('roake', ROAKE, `Commander of the Directorate picket ship ${PICKET}`, 'cruiser', { motivation: 'Carry out his orders without starting a war.', goals: ['keep the Halcyon short of the line', 'never be seen to back down'], knowledge: intel === 'nothing' ? [] : [intel], trust: 40, memory: { suspicion: 0 } }),
    dahl: char('dahl', DAHL, `Relief commander for the picket at ${PLACE}`, 'cruiser', { motivation: 'Run the picket by the book.', goals: ['inspect the Halcyon properly or keep her waiting'], status: 'stasis', trust: 40, memory: {} }),
    marchbank: char('marchbank', REEVE, `Reeve of ${COLONY}`, 'kestrel', { motivation: 'Keep her colony’s lights on.', goals: ['get the reactor assemblies to Wrenmoor in time'], trust: 60, memory: {} }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('cargo', `The Halcyon carries the replacement reactor assemblies for ${COLONY}, whose reactor is failing.`), known: true, discoveredTurn: 0 },
      f('claim', `What ${REEVE_SHORT} says about how long ${COLONY} has.`),
      f('window', `Chief Okafor’s reading of ${COLONY}’s reactor telemetry: the real deadline, and what failure would mean.`),
      f('read', `Cmdr. Marrow’s read of ${ROAKE_SHORT}: what kind of officer he is, what he knows, and how he takes her word.`),
      f('orders', `What ${ROAKE_SHORT}’s orders really say, and when his relief is due.`),
      f('sweep', `Lt. Varga’s reading of the picket’s long-range sweep of the Halcyon’s wake.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { orders, temperament, intel, history, reeve, deadline, reliefAt, sweepAt };

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
    relations: { tension: 25, trustConcordDirectorate: 30 },
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
    counters: { torpedoes: 6, kestrelCrewStart: 4100, kestrelDead: 0, rescued: 0, suspicion: 0, interceptAt: 0, inspectEnd: 0, holdUntil: 0, runWarned: 0, handWarned: 0 },
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
