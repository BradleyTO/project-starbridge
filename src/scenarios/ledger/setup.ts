/**
 * Training Simulation 007: Ghost Ledger — seeded initial world state.
 * Everything here is original fiction.
 *
 * A theft aboard. The ISV Halcyon has hosted a small reception at the Vell Crossing waypoint for
 * four guests before they go their separate ways. During it, someone copied the Halcyon's
 * navigation keys from the chart-room console. All four guests stepped out of the reception at
 * some point; each has something they would rather not explain. One of them is the thief, working
 * for the Tessarine Directorate courier alongside. The case is solved by evidence: the copy time,
 * the badge logs, the device trace and each guest's own story, checked against the ship's systems.
 * Slots (v0.6 shared engine ids): 'kestrel' = the Marrick Lark, a civilian packet ship,
 * Capt. Hesketh Moll (contact A); 'cruiser' = the Amber Script, a Directorate diplomatic courier,
 * Courier-Captain Sabine Thorne (contact B). Both are unarmed and docked alongside.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'ghost-ledger';
export const SCENARIO_TITLE = 'Training Simulation 007: Ghost Ledger';
export const SCENARIO_VERSION = '1.0.0';

export type Guest = 'krenn' | 'vesk' | 'sallow' | 'fosse';
export type DeviceClass = 'directorate' | 'civilian' | 'isa';
export type Exfil = 'carry' | 'burst';

export const GUESTS: readonly Guest[] = ['krenn', 'vesk', 'sallow', 'fosse'];
export const GUEST_NAME: Record<Guest, string> = { krenn: 'Attaché Ysolde Krenn', vesk: 'Dorran Vesk', sallow: 'Imogen Sallow', fosse: 'Cmdr. Leander Fosse' };
export const GUEST_SHORT: Record<Guest, string> = { krenn: 'Attaché Krenn', vesk: 'Mr Vesk', sallow: 'Ms Sallow', fosse: 'Commander Fosse' };
export const GUEST_ROLE: Record<Guest, string> = { krenn: 'Tessarine Directorate attaché', vesk: 'Freight broker', sallow: 'Journalist', fosse: 'ISA officer, returning to duty' };
export const PRONOUN: Record<Guest, { sub: string; obj: string; pos: string }> = {
  krenn: { sub: 'she', obj: 'her', pos: 'her' },
  vesk: { sub: 'he', obj: 'him', pos: 'his' },
  sallow: { sub: 'she', obj: 'her', pos: 'her' },
  fosse: { sub: 'he', obj: 'him', pos: 'his' },
};
/** The class of data slate each guest carries (Varga's port trace tells the classes apart). */
export const DEVICE: Record<Guest, DeviceClass> = { krenn: 'directorate', vesk: 'civilian', sallow: 'civilian', fosse: 'isa' };
export const DEVICE_TEXT: Record<DeviceClass, string> = { directorate: 'a Directorate-issue slate', civilian: 'a civilian slate', isa: 'an ISA-issue slate' };
/** What each guest was really doing outside the reception, and which officer can check it. */
export const SECRET: Record<Guest, string> = {
  krenn: 'sending a private message home from the observation lounge console',
  vesk: 'moving a few cases of untaxed Orrin brandy down the aft cargo lift to the Marrick Lark',
  sallow: 'photographing the restricted sensor gallery',
  fosse: 'reading his own board-of-inquiry file on the deck-four records terminal',
};
export const CHECKER: Record<Guest, 'comms' | 'engineering' | 'sensors' | 'tactical'> = { krenn: 'comms', vesk: 'engineering', sallow: 'sensors', fosse: 'tactical' };
export const CHECK_SOURCE: Record<Guest, string> = { krenn: 'the observation lounge comms log', vesk: 'the aft cargo lift log', sallow: 'the sensor gallery hatch log', fosse: 'the deck-four records terminal log' };

export const PACKET = 'Marrick Lark';
export const COURIER = 'Amber Script';
export const MOLL = 'Capt. Hesketh Moll';
export const THORNE = 'Courier-Captain Sabine Thorne';
export const WAYPOINT = 'the Vell Crossing waypoint';

export interface LedgerVariant {
  culprit: Guest;
  /** An innocent guest whose time out of the room also covers the copy. */
  decoy: Guest;
  /** Minute past 21:00 at which the keys were copied (44–49). */
  copyMin: number;
  /** Badge out and back, minutes past 21:00, per guest. */
  out: Record<Guest, number>;
  back: Record<Guest, number>;
  /** How the thief means to get the keys off the ship. */
  exfil: Exfil;
  burstTurn: number;
  departTurn: number;
  /** Rask's hunch, if asked: the culprit, or the decoy. */
  hunchRight: boolean;
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
  kestrelLead: 'moll',
  cruiserLead: 'thorne',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const PACKET_ALIASES = ['marrick lark', 'the marrick lark', 'lark', 'the lark', 'packet', 'the packet', 'packet ship', 'the packet ship', 'moll', 'captain moll', 'hesketh', 'hesketh moll'];
export const COURIER_ALIASES = ['amber script', 'the amber script', 'courier', 'the courier', 'directorate courier', 'the directorate courier', 'thorne', 'captain thorne', 'courier-captain thorne', 'courier captain thorne', 'sabine', 'sabine thorne'];

export const clock = (m: number) => `${21 + Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const asGuest = (x: unknown, d: Guest): Guest => (GUESTS.includes(x as Guest) ? (x as Guest) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function ledger(s: WorldState): LedgerVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  const per = (k: string, d: number) => Object.fromEntries(GUESTS.map((g) => [g, Number(e[`${k}_${g}`] ?? d)])) as Record<Guest, number>;
  return {
    culprit: asGuest(e.culprit, 'vesk'),
    decoy: asGuest(e.decoy, 'sallow'),
    copyMin: Number(e.copyMin ?? 46),
    out: per('out', 40),
    back: per('back', 50),
    exfil: e.exfil === 'burst' ? 'burst' : 'carry',
    burstTurn: Number(e.burstTurn ?? 10),
    departTurn: Number(e.departTurn ?? 17),
    hunchRight: e.hunchRight === 1 || e.hunchRight === '1',
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
  const culprit = rng.pick(GUESTS);
  const others = GUESTS.filter((g) => g !== culprit);
  const decoy = rng.pick(others);
  const copyMin = rng.int(44, 49);
  const out: Record<string, number> = {};
  const back: Record<string, number> = {};
  for (const g of GUESTS) {
    if (g === culprit || g === decoy) {
      out[g] = copyMin - rng.int(2, 6);
      back[g] = copyMin + rng.int(2, 6);
    } else if (rng.next() < 0.5) {
      out[g] = rng.int(30, 35);
      back[g] = Math.min(copyMin - 1, out[g] + rng.int(4, 8));
    } else {
      out[g] = copyMin + rng.int(1, 3);
      back[g] = out[g] + rng.int(4, 8);
    }
  }
  const exfil = rng.pick(['carry', 'burst'] as const);
  const burstTurn = rng.int(9, 12);
  const departTurn = rng.int(15, 19);
  const hunchRight = rng.next() < 0.5 ? 1 : 0;

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
      name: PACKET,
      aliases: PACKET_ALIASES,
      classification: 'Civilian packet ship',
      faction: 'independent',
      position: { x: 300, y: 120 },
      heading: 0,
      perf: { maxSpeed: 90, accel: 3, turnRate: 3 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0) }),
      shields: { raised: false, strength: 20 },
      souls: 26,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
    cruiser: ship('cruiser', {
      name: COURIER,
      aliases: COURIER_ALIASES,
      classification: 'Directorate diplomatic courier',
      faction: 'directorate',
      position: { x: -300, y: 120 },
      heading: 0,
      perf: { maxSpeed: 180, accel: 8, turnRate: 5 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0) }),
      shields: { raised: false, strength: 40 },
      souls: 9,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const guest = (g: Guest, motivation: string, goals: string[]): Character =>
    char(g, GUEST_NAME[g], GUEST_ROLE[g], 'halcyon', { motivation, goals, knowledge: g === culprit ? ['copied the keys'] : [SECRET[g]], trust: 50, memory: { claimed: 0, admitted: 0, checked: 0, searched: 0, harmed: 0 } });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['keep the guests safe and the evening civil']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['find the thief, and prove it']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['read the console trace']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['hold station at the waypoint']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep an ear on the comms']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['keep the keys safe']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['keep everyone well']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    krenn: guest('krenn', 'Serve the Directorate, and keep her own counsel.', ['go home on the Amber Script', 'keep her private message private']),
    vesk: guest('vesk', 'Turn a profit on every crossing.', ['ship out on the Marrick Lark', 'keep the brandy off the manifest']),
    sallow: guest('sallow', 'Get the story nobody else has.', ['ship out on the Marrick Lark', 'keep her pictures']),
    fosse: guest('fosse', 'Find out what the board of inquiry really said about him.', ['take up his new posting', 'not be seen reading his own file']),
    moll: char('moll', MOLL, `Master of the ${PACKET}`, 'kestrel', { motivation: 'Sail on time with a full manifest.', goals: ['sail on time'], knowledge: culprit === 'vesk' ? [] : ['the brandy'], trust: 50, memory: { asked: 0 } }),
    thorne: char('thorne', THORNE, `Master of the ${COURIER}`, 'cruiser', { motivation: 'Bring the copy home without an incident.', goals: ['sail on time with the copy', 'no incident'], knowledge: ['the thief'], trust: 40, memory: { offered: 0, denied: 0 } }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('theft', 'Someone copied the Halcyon’s navigation keys from the chart-room console during the reception.'), known: true, discoveredTurn: 0 },
      f('copyTime', `The navigation core logged the copy at ${clock(copyMin)}.`),
      f('doors', `All four guests left the reception at some point: ${GUESTS.map((g) => `${GUEST_SHORT[g]} ${clock(out[g])} to ${clock(back[g])}`).join('; ')}.`),
      f('device', `The keys were copied onto ${DEVICE_TEXT[DEVICE[culprit]]}.`),
      ...GUESTS.map((g) => f(`story_${g}`, `${GUEST_SHORT[g]} says ${PRONOUN[g].sub} was ${SECRET[g]}.`)),
      ...GUESTS.map((g) => f(`checked_${g}`, g === culprit ? `${CHECK_SOURCE[g].replace(/^./, (c) => c.toUpperCase())} does not bear out ${GUEST_SHORT[g]}’s story.` : `${CHECK_SOURCE[g].replace(/^./, (c) => c.toUpperCase())} bears out ${GUEST_SHORT[g]}’s story.`)),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { culprit, decoy, copyMin, exfil, burstTurn, departTurn, hunchRight };
  for (const g of GUESTS) {
    extra[`out_${g}`] = out[g];
    extra[`back_${g}`] = back[g];
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
    counters: { torpedoes: 6, kestrelCrewStart: 26, kestrelDead: 0, rescued: 0, current: 0, delay: 0, rekeyAt: 0, feedAt: 0, accusePending: 0, forceWarned: 0 },
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
