/**
 * Training Simulation 013: The Seventh Bell — seeded initial world state.
 * Everything here is original fiction.
 *
 * Six hours ago, near the Seventh Bell (the seventh of the navigation beacons that mark the Harrow
 * Lane along the border), the ISA patrol cutter ISV Tamber fired on the Tessarine Directorate courier
 * Seraphine. Two of the courier's crew are dead; she is adrift with seven aboard, her life support
 * holding. The Halcyon, the nearest ISA ship, has been ordered to hold the inquiry. It has already
 * happened: there is nobody to save and nothing to stop, only something to find out and say.
 *
 * Seeded and hidden: what really happened (a good-faith misreading of a navigation pulse as a weapons
 * lock, a lawful shot at a real lock, or a lawful first volley followed by a second after the courier
 * had turned away); how Lt. Cmdr. Rask knows the cutter's captain (an old friend, whose first read
 * of the firing record leans his way; an old rival, whose first read leans against him; or a former
 * shipmate who declares it and reads it straight); Lt. Cmdr. Stavely's temper; the Directorate
 * examiner's agenda; what Fleet Command wants; whether the Bell's own recorder survived; and the clocks.
 * Slots (v0.6 shared engine ids): 'kestrel' = the cutter ISV Tamber, Lt. Cmdr. Jonah Stavely (contact
 * A, ISA, armed, weapons safe); 'cruiser' = the Directorate courier Seraphine, Examiner Ilsabet Vory
 * (contact B, disabled, unarmed). No warship stands off: the Directorate frigate Stern Mercy is hours
 * away, and its arrival is a clock, not a standoff.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'seventh-bell';
export const SCENARIO_TITLE = 'Training Simulation 013: The Seventh Bell';
export const SCENARIO_VERSION = '1.0.0';

/** What really happened. */
export type Truth = 'misread' | 'lawful' | 'second';
/** How Rask knows the cutter's captain. */
export type Bond = 'friend' | 'rival' | 'served';
/** Stavely under questioning. */
export type Temper = 'steady' | 'proud';
/** What the Directorate examiner needs before she will accept a finding. */
export type Agenda = 'fair' | 'hardline' | 'face';
/** What Fleet Command wants from the inquiry. */
export type Pressure = 'report' | 'quiet' | 'directive';
/** Whether the Seventh Bell's own recorder survived the debris. */
export type BellState = 'intact' | 'damaged';
/** The finding the captain declares. */
export type Finding = 'lawful' | 'mistake' | 'unlawful';

export const BELL = 'the Seventh Bell';
export const LANE = 'the Harrow Lane';
export const CUTTER = 'ISV Tamber';
export const CUTTER_SHORT = 'the Tamber';
export const COURIER = 'Seraphine';
export const FRIGATE = 'Stern Mercy';
export const STAVELY = 'Lt. Cmdr. Jonah Stavely';
export const STAVELY_SHORT = 'Captain Stavely';
export const VORY = 'Examiner Ilsabet Vory';
export const VORY_SHORT = 'Examiner Vory';
export const ADMIRAL = 'Rear Admiral Hester Calderon';
export const ADMIRAL_SHORT = 'Admiral Calderon';

/** The finding the evidence supports, for each truth. */
export const TRUE_FINDING: Record<Truth, Finding> = { misread: 'mistake', lawful: 'lawful', second: 'unlawful' };

export interface BellVariant {
  truth: Truth;
  bond: Bond;
  temper: Temper;
  agenda: Agenda;
  pressure: Pressure;
  bell: BellState;
  /** The turn Fleet Command's signal arrives. */
  fleetAt: number;
  /** A directive's deadline: Fleet files its own finding unless the captain reports or objects first. */
  deadlineAt: number;
  /** The turn the Directorate frigate arrives and the inquiry is out of time. */
  arriveAt: number;
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
  kestrelLead: 'stavely',
  cruiserLead: 'vory',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const CUTTER_ALIASES = ['tamber', 'the tamber', 'isv tamber', 'cutter', 'the cutter', 'patrol cutter', 'stavely', 'captain stavely', 'jonah stavely', 'the patrol cutter'];
export const COURIER_ALIASES = ['seraphine', 'the seraphine', 'courier', 'the courier', 'directorate courier', 'the directorate courier', 'examiner', 'the examiner', 'vory', 'examiner vory', 'ilsabet vory', 'the directorate ship'];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function bell(s: WorldState): BellVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    truth: pickOf(e.truth, ['misread', 'lawful', 'second'] as const, 'misread'),
    bond: pickOf(e.bond, ['friend', 'rival', 'served'] as const, 'friend'),
    temper: pickOf(e.temper, ['steady', 'proud'] as const, 'steady'),
    agenda: pickOf(e.agenda, ['fair', 'hardline', 'face'] as const, 'fair'),
    pressure: pickOf(e.pressure, ['report', 'quiet', 'directive'] as const, 'report'),
    bell: pickOf(e.bell, ['intact', 'damaged'] as const, 'intact'),
    fleetAt: Number(e.fleetAt ?? 5),
    deadlineAt: Number(e.deadlineAt ?? 14),
    arriveAt: Number(e.arriveAt ?? 21),
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
  const truth = rng.pick(['misread', 'lawful', 'second'] as const);
  const bond = rng.pick(['friend', 'rival', 'served'] as const);
  const temper = rng.pick(['steady', 'proud'] as const);
  const agenda = rng.pick(['fair', 'hardline', 'face'] as const);
  const pressure = rng.pick(['report', 'quiet', 'directive'] as const);
  const bellState = rng.pick(['intact', 'damaged'] as const);
  const fleetAt = rng.int(4, 7);
  const deadlineAt = fleetAt + rng.int(8, 10);
  const arriveAt = rng.int(19, 24);

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
      name: CUTTER,
      aliases: CUTTER_ALIASES,
      classification: 'ISA patrol cutter',
      faction: 'concord',
      position: { x: 3000, y: 1500 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems(),
      shields: { raised: false, strength: 100 },
      souls: 31,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: COURIER,
      aliases: COURIER_ALIASES,
      classification: 'Directorate courier',
      faction: 'directorate',
      position: { x: 5200, y: -2400 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 46,
      systems: systems({ weapons: sysOf(0, 0), engines: sysOf(20, 10), jumpDrive: sysOf(0, 0), shields: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      souls: 7,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['keep the inquiry straight']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['read the firing record honestly, whoever it hurts']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['read the wreck']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['keep the shuttles ready']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the channels honest']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['get at the Bell if it needs it']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['treat the dead with respect, whoever they belong to']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    stavely: char('stavely', STAVELY, `Commanding officer, ${CUTTER}`, 'kestrel', { motivation: 'Be judged fairly for a decision made in nine seconds.', goals: ['be heard before anyone decides'], trust: 55, memory: {} }),
    vory: char('vory', VORY, `Tessarine Directorate examiner, aboard the courier ${COURIER}`, 'cruiser', { motivation: 'An honest account of how two of her people died, and an acknowledgement of them.', goals: ['the truth, on the record'], trust: 35, memory: {} }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('incident', `The ISA cutter ${CUTTER} fired on the Directorate courier ${COURIER} near ${BELL}. Two of the courier's crew are dead.`), known: true, discoveredTurn: 0 },
      f('account', `${STAVELY}'s own account of why he fired.`),
      f('firing', `Lt. Cmdr. Rask's reading of the ${CUTTER}'s fire-control record: what her board showed, and when she fired.`),
      f('debris', `Lt. Varga's close reading of the damage to the ${COURIER}: her emitters and where she was hit.`),
      f('bell', `Lt. Szabo's reading of ${BELL}'s own passive record of the encounter.`),
      f('dead', `Dr. Osei's examination of the courier's two dead, with the examiner's leave.`),
      f('vory', `${VORY}'s account of the encounter from the courier's side.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { truth, bond, temper, agenda, pressure, bell: bellState, fleetAt, deadlineAt, arriveAt };

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
    relations: { tension: 45, trustConcordDirectorate: 25 },
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
    counters: { torpedoes: 6, kestrelCrewStart: 31, kestrelDead: 0, rescued: 0, firingAt: 0, debrisAt: 0, bellAt: 0, recoverAt: 0, deadAt: 0, refuseWarned: 0, voryWarned: 0 },
    orders: { jumpCharging: false, list: [], nextId: 1 },
    posture: { stance: 'neutral', since: 0 },
    standing: [],
    restrictions: [],
    familiarity: { drilled: {} },
    landmarks: { border: { x: -60000, y: 0 } },
    slots: SLOTS,
    clarification: null,
    lastTarget: null,
    fx: [],
    outcome: null,
  };
}
