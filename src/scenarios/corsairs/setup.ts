/**
 * Training Simulation 015: Corsairs of the Veyl Shoals — seeded initial world state.
 * Everything here is original fiction.
 *
 * The Halcyon, carrying a consignment of drive lattices, answers a distress call from an ore skiff,
 * the Bryony, at an old survey beacon deep in the Veyl Shoals, an asteroid shoal full of metallic
 * dust that scatters sensors beyond close range and spoofs torpedo seekers. There is no skiff. The
 * call is a recording, and the corsair Hagfish, under Captain Ione Draycott, comes off the rocks with
 * one or two escorts (the Gudgeon and the Snipe). Draycott owes the Grist Syndicate more than she can
 * pay, and she needs the lattices, not a fight to the death. The Syndicate's collector, Amos Skerrit,
 * is on his way in the gunship Gavel to see that she pays.
 * Seeded and hidden: the corsairs' pattern (a pincer, a herd toward a dead-end pocket, or a bleed of
 * small attacks from cover), the shoal's terrain (whether the narrow channel called the Needle is open
 * or choked with rubble, and whether the great rock called the Anvil is iron, which masks a dark ship,
 * or ice, which does not), Draycott's nerve (desperate, proud or wavering), the number of escorts,
 * whether Lt. Cmdr. Rask's first read is sure or torn between two patterns, the minute of her
 * ultimatum and the minute the collector arrives.
 * Slots (v0.6 shared engine ids): 'kestrel' = the corsair Hagfish, Captain Draycott (contact A);
 * 'cruiser' = the Syndicate gunship Gavel, Collector Skerrit (contact B, unseen until he arrives).
 * The escorts are counted in the scenario's own state.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'corsairs';
export const SCENARIO_TITLE = 'Training Simulation 015: Corsairs of the Veyl Shoals';
export const SCENARIO_VERSION = '1.0.0';

/** How the corsairs mean to take the Halcyon. */
export type Pattern = 'pincer' | 'herd' | 'bleed';
/** Captain Draycott's nerve today. */
export type Nerve = 'desperate' | 'proud' | 'wavering';
/** Whether Rask's first read is certain, or torn between two patterns. */
export type Read = 'sure' | 'torn';

export const SHOALS = 'the Veyl Shoals';
export const SHOALS_CAP = 'The Veyl Shoals';
export const SKIFF = 'Bryony';
export const CORSAIR = 'Hagfish';
export const ESCORT_A = 'Gudgeon';
export const ESCORT_B = 'Snipe';
export const GAVEL = 'Gavel';
export const SYNDICATE = 'the Grist Syndicate';
export const DRAYCOTT = 'Captain Ione Draycott';
export const DRAYCOTT_SHORT = 'Captain Draycott';
export const SKERRIT = 'Collector Amos Skerrit';
export const SKERRIT_SHORT = 'Collector Skerrit';
export const NEEDLE = 'the Needle';
export const ANVIL = 'the Anvil';
export const SUMP = 'the Sump';
export const HALCYON_SOULS = 212;
export const ESCORT_CREW = 9;
export const GAVEL_CREW = 30;

export interface CorsairVariant {
  pattern: Pattern;
  /** The pattern Rask's torn read also allows (same as pattern when the read is sure). */
  decoy: Pattern;
  needle: 'open' | 'choked';
  anvil: 'iron' | 'ice';
  nerve: Nerve;
  read: Read;
  escorts: 1 | 2;
  /** The minute Draycott's ultimatum runs out and the corsairs open fire. */
  ultimatum: number;
  /** The minute the collector's gunship arrives, if nothing brings him sooner. */
  collector: number;
  /** What Draycott owes the Syndicate, in thousands of marks. */
  debt: number;
  /** People aboard the Hagfish. */
  crew: number;
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
  kestrelLead: 'draycott',
  cruiserLead: 'skerrit',
  passenger: null,
  kestrelRepair: 'engines',
  kestrelRepairWords: [],
};

export const CORSAIR_ALIASES = ['hagfish', 'the hagfish', 'corsair', 'the corsair', 'corsairs', 'the corsairs', 'raider', 'the raider', 'raiders', 'the raiders', 'flagship', 'the flagship', 'draycott', 'captain draycott', 'ione draycott', 'pirates', 'the pirates'];
export const GAVEL_ALIASES = ['gavel', 'the gavel', 'gunship', 'the gunship', 'collector', 'the collector', 'skerrit', 'collector skerrit', 'amos skerrit', 'syndicate', 'the syndicate', 'grist', 'the grist syndicate'];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function corsairs(s: WorldState): CorsairVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  const P = ['pincer', 'herd', 'bleed'] as const;
  return {
    pattern: pickOf(e.pattern, P, 'pincer'),
    decoy: pickOf(e.decoy, P, 'pincer'),
    needle: pickOf(e.needle, ['open', 'choked'] as const, 'open'),
    anvil: pickOf(e.anvil, ['iron', 'ice'] as const, 'iron'),
    nerve: pickOf(e.nerve, ['desperate', 'proud', 'wavering'] as const, 'proud'),
    read: pickOf(e.read, ['sure', 'torn'] as const, 'sure'),
    escorts: Number(e.escorts) === 1 ? 1 : 2,
    ultimatum: Number(e.ultimatum ?? 4),
    collector: Number(e.collector ?? 13),
    debt: Number(e.debt ?? 60),
    crew: Number(e.crew ?? 22),
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
  const pattern = rng.pick(['pincer', 'herd', 'bleed'] as const);
  const needle = rng.pick(['open', 'choked'] as const);
  const anvil = rng.pick(['iron', 'ice'] as const);
  const nerve = rng.pick(['desperate', 'proud', 'wavering'] as const);
  const read = rng.pick(['sure', 'torn'] as const);
  const escorts = rng.pick([1, 2] as const);
  const ultimatum = rng.int(3, 5);
  const collector = rng.int(11, 16);
  const debt = rng.int(40, 90);
  const crew = rng.int(18, 26);
  const others = (['pincer', 'herd', 'bleed'] as const).filter((p) => p !== pattern);
  const decoyRoll = rng.pick(others);
  const decoy = read === 'sure' ? pattern : decoyRoll;

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
      name: CORSAIR,
      aliases: CORSAIR_ALIASES,
      classification: 'Corsair raider',
      faction: 'independent',
      position: { x: 14000, y: 3000 },
      heading: 180,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ jumpDrive: sysOf(0, 0), transporter: sysOf(0, 0) }),
      shields: { raised: true, strength: 60 },
      weapons: { state: 'armed', target: null },
      souls: crew,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'hostile',
    }),
    cruiser: ship('cruiser', {
      name: GAVEL,
      aliases: GAVEL_ALIASES,
      classification: 'Syndicate collector gunship',
      faction: 'independent',
      position: { x: 36000, y: -6000 },
      heading: 180,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ transporter: sysOf(0, 0) }),
      shields: { raised: true, strength: 100 },
      weapons: { state: 'safe', target: null },
      souls: GAVEL_CREW,
      containment: 100,
      detected: false,
      scanLevel: 0,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['get the ship out of the shoal with her cargo and her crew']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ["read the corsairs' pattern and break it"]),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['see through the dust']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['fly the rocks']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['hear what the corsairs say to each other']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['keep the ship quiet when she needs to be']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['be ready for whoever is hurt']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Fly it by the book.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    draycott: char('draycott', DRAYCOTT, `Master of the corsair ${CORSAIR}`, 'kestrel', { motivation: 'Pay what she owes before it is collected from her.', goals: ['take the lattices without a fight she cannot win'], trust: 30, memory: {} }),
    skerrit: char('skerrit', SKERRIT, `Collector for ${SYNDICATE}, aboard the gunship ${GAVEL}`, 'cruiser', { motivation: "Collect the Syndicate's debt, one way or another.", goals: ['see that Draycott pays, in marks or in person'], trust: 20, memory: {} }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('ambush', `The distress call from the ${SKIFF} was bait: the corsairs were waiting in the shoal.`),
      f('recorded', `Lt. Szabo's finding: the ${SKIFF}'s call is a recording on a loop.`),
      f('pattern', `Lt. Cmdr. Rask's read of how the corsairs mean to take the Halcyon.`),
      f('terrain', `The shoal's terrain: whether ${NEEDLE} is open, and what ${ANVIL} is made of.`),
      f('debt', `What Captain Draycott owes, and to whom.`),
      f('collector', `The Syndicate's collector, coming to see the debt paid.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { pattern, decoy, needle, anvil, nerve, read, escorts, ultimatum, collector, debt, crew };

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
    relations: { tension: 30, trustConcordDirectorate: 30 },
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
      torpedoes: 6, kestrelCrewStart: crew, kestrelDead: 0, rescued: 0,
      escorts, pos: 0, moveTo: 0, moveAt: 0, exitAt: 0, held: 0, ghostUntil: 0, chartsAt: 0, probeAt: 0, clearAt: 0, firstRead: 0,
      gavelAt: 0, boardAt: 0, skerritAt: 0, volleys: 0, corsairDead: 0, torpSeen: 6, lastHalcyonFire: 0, pingTurn: 0,
      hagHull: 100, hagShield: 60,
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
