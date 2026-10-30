/**
 * Training Simulation 011: Coldwater — seeded initial world state.
 * Everything here is original fiction.
 *
 * The Halcyon holds orbit over Coldwater, an ice moon, feeding power by beam to Coldwater Station on
 * the surface while the station's own plant is rebuilt. Two hours ago a coolant valve in the
 * Halcyon's plant failed and killed Engineer's Mate Callum Strand. The reactor scrammed; the beam is
 * down and the station is on batteries. The machinery can be restarted. The problem is people:
 * engineering's B watch, with Petty Officer Mara Tennant speaking for them, has stopped work and will
 * not go back into the plant. They say Strand reported that valve a week ago and the report was
 * buried, and they are right: the maintenance log was falsified. Who did it, how, whether the
 * Chief's countersignature is on it, whether the sister valve has the same flaw, what Tennant needs,
 * where Chief Okafor's loyalties fall, and every clock are seeded and hidden.
 * Slots (v0.6 shared engine ids): 'kestrel' = Coldwater Station, Director Annick Toller (contact A,
 * ISA civilian research station, 38 aboard); 'cruiser' = the ISA courier ISV Plumb Line, carrying
 * Inspector-Commander Noor Hadley of the ISA Safety Inspectorate, hours away (contact B). Nobody is
 * armed and nobody is an enemy: the strikers, the supervisor and the leading hand are the
 * Halcyon's own crew, represented in this scenario's own state.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'coldwater';
export const SCENARIO_TITLE = 'Training Simulation 011: Coldwater';
export const SCENARIO_VERSION = '1.0.0';

/** Who falsified the maintenance log. */
export type Falsifier = 'penhale' | 'corley';
/** How: a valve inspection signed off that never happened (before), or Strand's fault report deleted (after). */
export type Method = 'signoff' | 'deleted';
/** The sister valve on the same line: sound, or cracked the same way. */
export type Sister = 'sound' | 'cracked';
/** What Petty Officer Tennant needs before her watch goes back in. */
export type Temper = 'grieving' | 'principled' | 'hothead';
/** Which way Chief Okafor leans when her people and the chain of command pull apart. */
export type Lean = 'people' | 'chain';

export const MOON = 'Coldwater';
export const STATION = 'Coldwater Station';
export const COURIER = 'ISV Plumb Line';
export const TOLLER = 'Director Annick Toller';
export const TOLLER_SHORT = 'Director Toller';
export const HADLEY = 'Inspector-Commander Noor Hadley';
export const HADLEY_SHORT = 'Inspector Hadley';
export const TENNANT = 'Petty Officer Mara Tennant';
export const TENNANT_SHORT = 'Petty Officer Tennant';
export const PENHALE = 'Lt. Garrick Penhale';
export const CORLEY = 'Petty Officer Sian Corley';
export const STRAND = "Engineer's Mate Callum Strand";
export const STRAND_SHORT = 'Strand';

export interface ColdwaterVariant {
  falsifier: Falsifier;
  method: Method;
  sister: Sister;
  temper: Temper;
  lean: Lean;
  /** Whether Chief Okafor countersigned the falsified entry, in good faith. */
  chiefSigned: boolean;
  /** The turn the station's batteries run out. */
  stationAt: number;
  /** The turn a hothead watch seals the engine room unless someone has talked to them. */
  lockAt: number;
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
  kestrelLead: 'toller',
  cruiserLead: 'hadley',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const STATION_ALIASES = ['coldwater station', 'the station', 'station', 'director toller', 'toller', 'annick toller', 'the director', 'director', 'the surface', 'the base'];
export const COURIER_ALIASES = ['plumb line', 'the plumb line', 'isv plumb line', 'courier', 'the courier', 'inspector', 'the inspector', 'inspector hadley', 'hadley', 'noor hadley', 'inspector-commander hadley', 'the inspectorate', 'inspectorate', 'safety inspectorate'];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function coldwater(s: WorldState): ColdwaterVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    falsifier: pickOf(e.falsifier, ['penhale', 'corley'] as const, 'penhale'),
    method: pickOf(e.method, ['signoff', 'deleted'] as const, 'signoff'),
    sister: pickOf(e.sister, ['sound', 'cracked'] as const, 'sound'),
    temper: pickOf(e.temper, ['grieving', 'principled', 'hothead'] as const, 'principled'),
    lean: pickOf(e.lean, ['people', 'chain'] as const, 'chain'),
    chiefSigned: Number(e.chiefSigned ?? 0) === 1,
    stationAt: Number(e.stationAt ?? 22),
    lockAt: Number(e.lockAt ?? 7),
  };
}

export const innocentOf = (f: Falsifier): Falsifier => (f === 'penhale' ? 'corley' : 'penhale');
export const nameOf = (id: Falsifier) => (id === 'penhale' ? PENHALE : CORLEY);

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
  const falsifier = rng.pick(['penhale', 'corley'] as const);
  const method = rng.pick(['signoff', 'deleted'] as const);
  const sister = rng.pick(['sound', 'cracked'] as const);
  const temper = rng.pick(['grieving', 'principled', 'hothead'] as const);
  const lean = rng.pick(['people', 'chain'] as const);
  const chiefSigned = rng.pick([0, 1] as const);
  const stationAt = rng.int(20, 26);
  const lockAt = rng.int(6, 9);

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
      name: STATION,
      aliases: STATION_ALIASES,
      classification: 'ISA research station',
      faction: 'concord',
      position: { x: 0, y: 4000 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), engines: sysOf(0, 0), jumpDrive: sysOf(0, 0), shields: sysOf(0, 0), transporter: sysOf(0, 0), tractor: sysOf(0, 0), reactor: sysOf(40, 30) }),
      shields: { raised: false, strength: 0 },
      souls: 38,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: COURIER,
      aliases: COURIER_ALIASES,
      classification: 'ISA courier',
      faction: 'concord',
      position: { x: -140000, y: 20000 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      souls: 9,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'friendly',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['keep the ship together']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep order without making it worse']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['keep the sensors honest']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['keep the shuttles ready']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the station and the inspector informed']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['stand by her people and her ship']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['look after the living and the dead']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    toller: char('toller', TOLLER, `Director of ${STATION}`, 'kestrel', { motivation: 'Keep thirty-eight people warm through the night.', goals: ['get the power beam back'], trust: 60, memory: {} }),
    hadley: char('hadley', HADLEY, `ISA Safety Inspectorate, aboard the courier ${COURIER}`, 'cruiser', { motivation: 'Find out what happened, and write down only what is true.', goals: ['an honest record'], trust: 55, memory: {} }),
    tennant: char('tennant', TENNANT, "Engineering, B watch; speaking for the watch that has stopped work", 'halcyon', { motivation: 'Nobody else dies in that plant, and nobody buries what happened to Callum.', goals: ['the truth about the valve'], trust: 35, memory: {} }),
    penhale: char('penhale', PENHALE, 'Coolant plant supervisor', 'halcyon', { motivation: 'Keep his watch running.', goals: ['keep his name clear'], trust: 50, memory: {} }),
    corley: char('corley', CORLEY, 'Coolant plant leading hand', 'halcyon', { motivation: 'Keep her head down.', goals: ['keep her rating'], trust: 50, memory: {} }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('death', `${STRAND} died when a coolant valve failed in the Halcyon's plant. The reactor scrammed, and half of engineering has stopped work.`), known: true, discoveredTurn: 0 },
      f('cause', `Dr. Osei's account of how ${STRAND} died.`),
      f('history', `Lt. Szabo's reading of the maintenance log's edit history.`),
      f('record', `Chief Okafor's reading of the plant's own sensor record: what was really done to that valve, and by whom.`),
      f('sister', `Chief Okafor's inspection of the sister valve on the same line.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { falsifier, method, sister, temper, lean, chiefSigned, stationAt, lockAt };

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
    relations: { tension: 20, trustConcordDirectorate: 30 },
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
    counters: { torpedoes: 6, kestrelCrewStart: 38, kestrelDead: 0, rescued: 0, recordAt: 0, sisterAt: 0, replaceAt: 0, restartAt: 0, evacAt: 0, forceWarned: 0, restartWarned: 0 },
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
