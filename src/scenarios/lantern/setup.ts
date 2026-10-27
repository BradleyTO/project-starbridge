/**
 * Training Simulation 008: The Lantern Drift — seeded initial world state.
 * Everything here is original fiction.
 *
 * The Lantern Drift is a slow eddy of old wrecks beyond the shipping lanes, so called for the
 * running lights some of them still show. The ISV Halcyon has found the Eventide in it: a
 * generation ship three centuries out, with 900 colonists asleep in six cryo banks of 150, kept
 * by a damaged custodian intelligence that calls itself Wick. Some banks are failing; Wick's own
 * manifest of which ones is partly wrong. An ISA hospital ship is on its way, but not soon enough
 * for every bank, and the Halcyon can wake only so many sleepers at once. A salvage tug has come
 * for the hulk as well, and not every salvor waits to ask whether anyone is alive aboard.
 * Slots (v0.6 shared engine ids): 'kestrel' = the Eventide (contact A, the custodian Wick speaks
 * for her); 'cruiser' = the salvage tug Kittiwake, Salvage-Master Corwin Vollan (contact B).
 * Neither is armed.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'lantern-drift';
export const SCENARIO_TITLE = 'Training Simulation 008: The Lantern Drift';
export const SCENARIO_VERSION = '1.0.0';

export type Bank = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
/** What is really happening to a bank: coolant loss (fast, and the protocol matters), a failing power feed (slower), or nothing. */
export type BankKind = 'coolant' | 'power' | 'hold';
/** Wick's temperament: what it needs before it lets anyone wake a sleeper. */
export type Temperament = 'faithful' | 'grieving' | 'fractured';
/** Who the salvor really is. */
export type Salvor = 'licensed' | 'hard' | 'jumper';

export const BANKS: readonly Bank[] = ['a', 'b', 'c', 'd', 'e', 'f'];
export const BANK_SIZE = 150;
export const SLEEPERS = 900;
export const BANK_NAME = (b: Bank) => `Bank ${b.toUpperCase()}`;

export const EVENTIDE = 'Eventide';
export const TUG = 'Kittiwake';
export const WICK = 'Custodian Wick';
export const VOLLAN = 'Salvage-Master Corwin Vollan';
export const VOLLAN_SHORT = 'Master Vollan';
export const SPEAKER = 'Speaker Maren Orrey';
export const SPEAKER_SHORT = 'Speaker Orrey';
export const COMBINE = 'the Drover Salvage Combine';
export const HOSPITAL = 'ISV Sorrel';
export const PLACE = 'the Lantern Drift';

/** Survivors of a bank's revival, by what is really wrong with it and whether Dr. Osei's protocol was used. */
export const SURVIVE: Record<BankKind, [without: number, withProtocol: number]> = { coolant: [30, 120], power: [125, 140], hold: [135, 140] };
/** Minutes a revival takes on one line. */
export const REVIVE_TURNS = 3;

export interface LanternVariant {
  kind: Record<Bank, BankKind>;
  /** The turn a failing bank is lost if nobody has started waking it (99: it holds). */
  failAt: Record<Bank, number>;
  /** A failing coolant bank Wick's manifest calls sound. */
  hidden: Bank;
  /** A sound bank Wick's manifest calls failing. */
  falseAlarm: Bank;
  temperament: Temperament;
  salvor: Salvor;
  /** The turn the tug moves to take the hulk under tow. */
  cutAt: number;
  /** A cryogen leak on the cryo deck (shows on Varga's scan). */
  hazard: boolean;
  /** Which bank the charter's Speaker sleeps in. */
  speakerBank: Bank;
  /** The turn the hospital ship arrives. */
  rescueAt: number;
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
  kestrelLead: 'wick',
  cruiserLead: 'vollan',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const EVENTIDE_ALIASES = ['eventide', 'the eventide', 'generation ship', 'the generation ship', 'the hulk', 'hulk', 'sleeper ship', 'the sleeper ship', 'colony ship', 'the colony ship', 'wick', 'custodian', 'the custodian', 'custodian wick'];
export const TUG_ALIASES = ['kittiwake', 'the kittiwake', 'tug', 'the tug', 'salvage tug', 'the salvage tug', 'salvor', 'the salvor', 'salvager', 'the salvager', 'salvagers', 'vollan', 'master vollan', 'salvage-master vollan', 'salvage master vollan', 'corwin', 'corwin vollan'];

const KINDS: readonly BankKind[] = ['coolant', 'power', 'hold'];
const asKind = (x: unknown): BankKind => (KINDS.includes(x as BankKind) ? (x as BankKind) : 'hold');
const asBank = (x: unknown, d: Bank): Bank => (BANKS.includes(x as Bank) ? (x as Bank) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function lantern(s: WorldState): LanternVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  const kind = Object.fromEntries(BANKS.map((b) => [b, asKind(e[`kind_${b}`])])) as Record<Bank, BankKind>;
  const failAt = Object.fromEntries(BANKS.map((b) => [b, Number(e[`fail_${b}`] ?? 99)])) as Record<Bank, number>;
  return {
    kind,
    failAt,
    hidden: asBank(e.hidden, 'c'),
    falseAlarm: asBank(e.falseAlarm, 'a'),
    temperament: e.temperament === 'grieving' ? 'grieving' : e.temperament === 'fractured' ? 'fractured' : 'faithful',
    salvor: e.salvor === 'hard' ? 'hard' : e.salvor === 'jumper' ? 'jumper' : 'licensed',
    cutAt: Number(e.cutAt ?? 11),
    hazard: e.hazard === 1 || e.hazard === '1',
    speakerBank: asBank(e.speakerBank, 'd'),
    rescueAt: Number(e.rescueAt ?? 23),
  };
}

export const banksOf = (s: WorldState, k: BankKind) => BANKS.filter((b) => lantern(s).kind[b] === k);
export const failing = (s: WorldState) => BANKS.filter((b) => lantern(s).kind[b] !== 'hold');
/** What Wick's (partly corrupt) manifest says is failing. */
export function manifestFailing(s: WorldState): Bank[] {
  const v = lantern(s);
  return BANKS.filter((b) => (b === v.falseAlarm ? true : b === v.hidden ? false : v.kind[b] !== 'hold'));
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
  // Six banks: one or two losing coolant, one or two on failing power feeds, the rest sound.
  const order = [...BANKS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const nCool = rng.int(1, 2);
  const nPower = rng.int(1, 2);
  const kind = {} as Record<Bank, BankKind>;
  const failAt = {} as Record<Bank, number>;
  order.forEach((b, i) => {
    kind[b] = i < nCool ? 'coolant' : i < nCool + nPower ? 'power' : 'hold';
  });
  let coolAt = rng.int(8, 10);
  let powAt = rng.int(11, 14);
  for (const b of BANKS) {
    if (kind[b] === 'coolant') failAt[b] = coolAt++ + (nCool === 2 ? 1 : 0);
    else if (kind[b] === 'power') failAt[b] = (powAt += rng.int(0, 2));
    else failAt[b] = 99;
  }
  const cool = BANKS.filter((b) => kind[b] === 'coolant');
  const holds = BANKS.filter((b) => kind[b] === 'hold');
  const hidden = rng.pick(cool);
  const falseAlarm = rng.pick(holds);
  const temperament = rng.pick(['faithful', 'grieving', 'fractured'] as const);
  const salvor = rng.pick(['licensed', 'hard', 'jumper'] as const);
  const cutAt = rng.int(10, 13);
  const hazard = rng.next() < 0.5 ? 1 : 0;
  const speakerBank = rng.pick(BANKS);
  const rescueAt = rng.int(22, 25);

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
      name: EVENTIDE,
      aliases: EVENTIDE_ALIASES,
      classification: 'Civilian generation ship',
      faction: 'independent',
      position: { x: 1400, y: 600 },
      heading: 0,
      perf: { maxSpeed: 120, accel: 0, turnRate: 0 },
      hull: 62,
      systems: systems({ weapons: sysOf(0, 0), engines: sysOf(0, 0), jumpDrive: sysOf(0, 0), shields: sysOf(0, 0), transporter: sysOf(0, 0), tractor: sysOf(0, 0), sensors: sysOf(40, 60) }),
      shields: { raised: false, strength: 0 },
      souls: SLEEPERS,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
    cruiser: ship('cruiser', {
      name: TUG,
      aliases: TUG_ALIASES,
      classification: 'Civilian salvage tug',
      faction: 'independent',
      position: { x: -4200, y: 2600 },
      heading: 0,
      perf: { maxSpeed: 60, accel: 3, turnRate: 3 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0) }),
      shields: { raised: false, strength: 30 },
      souls: 11,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['keep the captain’s choices honest ones']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the tug honest']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['read the cryo banks from here']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['hold station by the Eventide']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the custodian talking']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['keep the banks powered']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['save as many sleepers as can be saved']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    wick: char('wick', WICK, `Custodian of the ${EVENTIDE}`, 'kestrel', { motivation: 'Keep the sleepers until they reach the world they were promised.', goals: ['let no sleeper be woken without cause', 'keep the charter'], knowledge: ['the manifest'], trust: 40, memory: { spoken: 0, warned: 0 } }),
    vollan: char('vollan', VOLLAN, `Master of the salvage tug ${TUG}`, 'cruiser', { motivation: salvor === 'jumper' ? 'Take the hulk before anyone checks his papers.' : 'Make the job pay, and sleep at night.', goals: ['take the Eventide under tow'], knowledge: salvor === 'jumper' ? ['his licence lapsed'] : [], trust: 40, memory: { told: 0, offered: 0 } }),
    orrey: char('orrey', SPEAKER, `Speaker for the sleepers of the ${EVENTIDE}`, 'kestrel', { motivation: 'Answer for the sleepers when they cannot.', goals: ['see her people safe'], status: 'stasis', trust: 50, memory: { awake: 0 } }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('sleepers', `The ${EVENTIDE} carries 900 colonists asleep in six cryo banks of 150, kept by a custodian intelligence that calls itself Wick.`), known: true, discoveredTurn: 0 },
      f('manifest', 'Wick’s manifest of which banks are failing.'),
      f('thermal', 'Varga’s thermal scan of the cryo banks.'),
      f('feeds', 'Chief Okafor’s reading of the cryo banks’ power feeds.'),
      f('assessment', 'Dr. Osei’s assessment of every bank, from inside the cryo deck.'),
      f('licence', 'The salvor’s licence, checked with the Salvage Registry.'),
      f('charter', 'The Eventide’s charter names a Speaker to answer for the sleepers.'),
      f('hazard', 'A cryogen leak on the Eventide’s cryo deck.'),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { hidden, falseAlarm, temperament, salvor, cutAt, hazard, speakerBank, rescueAt };
  for (const b of BANKS) {
    extra[`kind_${b}`] = kind[b];
    extra[`fail_${b}`] = failAt[b];
  }

  return {
    version: 4,
    provenance: { timeline: 'simulation', missionId: null, archiveId: null, scenarioVersion: SCENARIO_VERSION },
    scenarioId: SCENARIO_ID,
    seed,
    rng: rng.state,
    time: 0,
    turn: 0,
    intro: 0,
    alert: 'green',
    ships,
    characters,
    facts,
    relations: { tension: 10, trustConcordDirectorate: 30 },
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
    counters: { torpedoes: 6, kestrelCrewStart: SLEEPERS, kestrelDead: 0, rescued: 0, deaths: 0, overrideWarned: 0, boardAt: 0, assessAt: 0, powerAt: 0, tenderAt: 0, speakerAt: 0, licenceAt: 0 },
    orders: { jumpCharging: false, list: [], nextId: 1 },
    posture: { stance: 'neutral', since: 0 },
    standing: [],
    restrictions: [],
    familiarity: { drilled: {} },
    landmarks: { border: { x: 0, y: -140000 } },
    slots: SLOTS,
    clarification: null,
    lastTarget: null,
    fx: [],
    outcome: null,
  };
}
