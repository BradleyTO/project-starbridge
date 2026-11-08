/**
 * Training Simulation 018: The Weather Engine — seeded initial world state.
 * Everything here is original fiction.
 *
 * The colony of Meridian's weather control station, the Weather Engine, has locked itself down,
 * and a superstorm the colonists call the Greywall is building over the plain. Founder Elias
 * Quarrie, who died last year, sealed the master controls with a personal cipher drawn from his
 * own life: a favourite poem, his letters, or his survey journal. The lock allows only a few wrong
 * answers before it seals for good. Steward Anwen Tull runs the colony and is sure the key is the
 * motto over the station door. Marit Quarrie, his estranged daughter, knows more and will not help
 * without a reason of her own. Technician Bastian Lowe and his apprentice are shut inside the
 * station. Lt. Szabo (Comms) is the one who can rebuild the cipher.
 *
 * Seeded and hidden: which part of his life the key is built from; the daughter's grievance (and so
 * what moves her); whether the Engine's control trunk can be reached for an override; whether a
 * poem key resolves to the first or second of two candidate lines; how many wrong answers the lock
 * allows; landfall; the colony's size and how fast it can get under cover; when the Steward asks
 * for the Engine to be burned out.
 *
 * Slots (v0.6 shared engine ids): 'kestrel' = the Weather Engine station, Technician Lowe
 * (contact A); 'cruiser' = Meridian Hall, Steward Tull (contact B); 'passenger' = Marit Quarrie,
 * reached through the colony net (agents.ts), not by transporter.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'weather-engine';
export const SCENARIO_TITLE = 'Training Simulation 018: The Weather Engine';
export const SCENARIO_VERSION = '1.0.0';

/** Which part of the founder's life the cipher is built from. */
export type KeySource = 'poem' | 'letters' | 'journal';
/** What the daughter holds against the colony (and so what moves her). */
export type Grievance = 'blame' | 'legacy' | 'fear';
/** Whether Chief Okafor can reach the Engine's control trunk for an override. */
export type EngineBuild = 'open' | 'sealed';

export const COLONY = 'Meridian';
export const ENGINE = 'the Weather Engine';
export const ENGINE_CAP = 'The Weather Engine';
export const HALL = 'Meridian Hall';
export const STORM = 'the Greywall';
export const STORM_CAP = 'The Greywall';
export const FOUNDER = 'Elias Quarrie';
export const FOUNDER_SHORT = 'Quarrie';
export const MARIT = 'Marit Quarrie';
export const MARIT_SHORT = 'Marit';
export const TULL = 'Steward Anwen Tull';
export const TULL_SHORT = 'Steward Tull';
export const LOWE = 'Technician Bastian Lowe';
export const LOWE_SHORT = 'Technician Lowe';
export const MOTTO = 'Rain Is a Promise Kept';
export const POEM = 'A Litany for Small Weather';
export const CELLARS = 'the storm cellars';
export const HALCYON_SOULS = 212;
/** Turns the Engine needs to break the storm up before landfall. */
export const LEAD = 4;

export interface WeatherVariant {
  key: KeySource;
  grievance: Grievance;
  engine: EngineBuild;
  /** For a poem key: whether the first of Szabo's two candidate lines is the right one. */
  firstLine: boolean;
  /** Wrong answers the lock allows before it seals for good. */
  tries: number;
  landfall: number;
  population: number;
  /** People the colony gets under cover per minute once it is told to. */
  shelterRate: number;
  /** Turn the Steward asks for the Engine to be burned out. */
  burnAskAt: number;
  /** Turn the Steward presses the motto as the key. */
  mottoAt: number;
  /** Minutes Szabo needs to work the cipher from the right source. */
  workTurns: number;
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
  kestrelLead: 'lowe',
  cruiserLead: 'tull',
  passenger: 'marit',
  kestrelRepair: 'lifeSupport',
  kestrelRepairWords: [],
};

export const STATION_ALIASES = [
  'weather engine', 'the weather engine', 'the station', 'weather station', 'control station', 'engine station',
  'lowe', 'bastian lowe', 'bastian', 'technician lowe', 'the technician', 'technicians', 'the technicians',
];
export const HALL_ALIASES = [
  'meridian hall', 'the hall', 'meridian', 'the colony', 'colony', 'tull', 'anwen tull', 'anwen', 'steward tull',
  'the steward', 'steward',
];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function weather(s: WorldState): WeatherVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    key: pickOf(e.key, ['poem', 'letters', 'journal'] as const, 'letters'),
    grievance: pickOf(e.grievance, ['blame', 'legacy', 'fear'] as const, 'blame'),
    engine: pickOf(e.engine, ['open', 'sealed'] as const, 'open'),
    firstLine: Number(e.firstLine ?? 1) === 1,
    tries: Number(e.tries ?? 3),
    landfall: Number(e.landfall ?? 18),
    population: Number(e.population ?? 1600),
    shelterRate: Number(e.shelterRate ?? 160),
    burnAskAt: Number(e.burnAskAt ?? 8),
    mottoAt: Number(e.mottoAt ?? 2),
    workTurns: Number(e.workTurns ?? 3),
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
  const key = rng.pick(['poem', 'letters', 'journal'] as const);
  const grievance = rng.pick(['blame', 'legacy', 'fear'] as const);
  const engine = rng.pick(['open', 'open', 'sealed'] as const);
  const firstLine = rng.pick([1, 0] as const);
  const tries = rng.pick([2, 3] as const);
  const landfall = rng.int(15, 21);
  const population = rng.int(140, 190) * 10;
  const shelterRate = rng.int(13, 19) * 10;
  const burnAskAt = rng.int(6, 9);
  const mottoAt = rng.int(2, 3);
  const workTurns = rng.int(3, 4);

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
      name: ENGINE_CAP,
      aliases: STATION_ALIASES,
      classification: 'Civilian weather station',
      faction: 'independent',
      position: { x: 3000, y: 800 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0), engines: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: 2,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'neutral',
    }),
    cruiser: ship('cruiser', {
      name: HALL,
      aliases: HALL_ALIASES,
      classification: 'Civilian colony hall',
      faction: 'independent',
      position: { x: 4200, y: -1500 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0), engines: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: population,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['keep the colony safe whether or not the lock opens']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['no weapons near a station with people inside']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['track the storm and give its landfall when asked']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['fly the shuttles if they are sent']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['read the lock before anyone guesses at it', 'rebuild the founder\'s key from the right part of his life']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['override the Engine only if the failsafe is mapped']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', []),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    lowe: char('lowe', LOWE, `Engine technician, shut inside ${ENGINE}`, 'kestrel', {
      motivation: 'Get the Engine turning before the storm, and get his apprentice home.',
      goals: ['read the lock plate for anyone who asks', 'not guess at a key that could seal it for good'],
      trust: 60,
      memory: {},
    }),
    tull: char('tull', TULL, `Elected steward of ${COLONY}`, 'cruiser', {
      motivation: 'Keep the colony alive and keep it from panicking.',
      goals: ['open the Engine with the motto everyone knows', 'not move the whole colony for a cloud', 'keep the council\'s part in the founder\'s last years quiet'],
      knowledge: ['letters', 'favourite'],
      trust: 50,
      memory: {},
    }),
    marit: char('marit', MARIT, `The founder's daughter, at her farm on the edge of the plain`, 'cruiser', {
      motivation:
        grievance === 'blame'
          ? 'Hear the colony admit what it did to her father.'
          : grievance === 'legacy'
            ? 'Keep her father\'s Engine, and his name, from being torn out once the colony is done with it.'
            : 'Keep the Engine that failed her mother from ever running wild again.',
      goals: ['keep the journal', 'not be used'],
      knowledge: ['journal', 'piece'],
      trust: 30,
      memory: {},
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('lockdown', `${ENGINE_CAP} locked itself down a year after ${FOUNDER} died. Its master controls answer only to his personal cipher, and ${STORM} is building over the plain.`), known: true, discoveredTurn: 0 },
      { ...f('passenger_identity', `${MARIT}, the founder's daughter, can be reached on the colony net at her farm.`), known: true, discoveredTurn: 0 },
      f('lock', `Lt. Szabo's reading of the lock: what kind of answer it wants, how many wrong answers it allows, and where its failsafe runs.`),
      f('forecast', `Lt. Varga's forecast: when ${STORM} makes landfall on ${COLONY}.`),
      f('src_poem', `${FOUNDER}'s poems from the colony archive.`),
      f('src_letters', `${FOUNDER}'s letters, held by ${TULL_SHORT} in the council archive.`),
      f('src_journal', `${FOUNDER}'s survey journal, kept by ${MARIT}.`),
      f('favourite', `Which poem ${FOUNDER} loved best.`),
      f('piece', `The part of the key only ${MARIT} knows.`),
      f('unsent', `An unsent letter from ${FOUNDER} to his daughter, among the council's letters.`),
      f('trunk', `Chief Okafor's survey of the Engine's control trunk: whether an override can reach it.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { key, grievance, engine, firstLine, tries, landfall, population, shelterRate, burnAskAt, mottoAt, workTurns };

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
      torpedoes: 6, kestrelCrewStart: 2, kestrelDead: 0, rescued: 0,
      lockAt: 0, workAt: 0, overrideAt: 0, maritAt: 0, forecastAt: 0, runAt: 0,
      wrong: 0, sheltered: 0, shelterAt: 0, burnWarned: 0, pendingWarn: 0, workQueued: 0,
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
