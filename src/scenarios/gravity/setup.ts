/**
 * Training Simulation 020: Gravity's Edge — seeded initial world state.
 * Everything here is original fiction.
 *
 * A neutron star, the Vagrant, is passing through the Corriden system: a once-in-a-millennium chance
 * to record how space bends that close to so much mass, data that would make future jump routes far
 * safer. The Halcyon is the only ship that can collect it. The deeper she sits in the star's tide,
 * the better the data and the worse the strain on her frame. Nobody needs rescuing. The captain has
 * to judge how much risk the data is worth, with strain gauges that may be wrong.
 *
 * Seeded and hidden: how much the frame can really take (strong, sound or tired); whether the strain
 * gauges, confused by the star's field, read high, true or low; when the star glitches (a starquake
 * that slams the tide) and whether a false stutter comes first; when the tide peaks; how long the
 * observatory's dish takes to turn; how long the probe survives once released.
 *
 * Slots (v0.6 shared engine ids): 'kestrel' = the Lodestar, the Halcyon's tethered instrument probe
 * (contact A, nobody aboard); 'cruiser' = Lisle Observatory on the moon Fennick, Director Benedikt
 * Aalto (contact B). No passenger.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'gravitys-edge';
export const SCENARIO_TITLE = "Training Simulation 020: Gravity's Edge";
export const SCENARIO_VERSION = '1.0.0';

/** How much the frame can really take. */
export type Hull = 'strong' | 'sound' | 'tired';
/** How the strain gauges read against the truth. */
export type Gauges = 'high' | 'true' | 'low';
/** When the star glitches. */
export type Glitches = 'early' | 'late' | 'double';

export const STAR = 'the Vagrant';
export const STAR_CAP = 'The Vagrant';
export const SYSTEM = 'Corriden';
export const OBSERVATORY = 'Lisle Observatory';
export const MOON = 'Fennick';
export const AALTO = 'Director Benedikt Aalto';
export const AALTO_SHORT = 'Director Aalto';
export const PROBE = 'the Lodestar';
export const PROBE_CAP = 'The Lodestar';
export const HALCYON_SOULS = 212;
/** The frame's rated limit, the number the gauges are scaled to. */
export const BOOK = 100;
/** A full dataset. */
export const FULL = 320;
/** Enough to advance the science. */
export const USEFUL = 150;
/** What the released probe must send for its own ending. */
export const PROBE_MIN = 160;

export interface GravityVariant {
  hull: Hull;
  gauges: Gauges;
  glitches: Glitches;
  /** Turn of the tide's peak (periastron). */
  peakAt: number;
  /** Turn the pass ends. */
  passEnd: number;
  /** Turn of the first (or only) glitch. */
  glitchA: number;
  /** Turn of the second glitch (double only; otherwise 0). */
  glitchB: number;
  /** Turn of a false stutter (0 for none). */
  falseAt: number;
  /** Turns the observatory's dish takes to turn to the probe. */
  dishTurns: number;
  /** Turns the probe survives once released. */
  probeLife: number;
  /** Crew in the outer sections if the frame fails deep. */
  exposed: number;
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
  kestrelLead: 'lodestar',
  cruiserLead: 'aalto',
  passenger: null,
  kestrelRepair: 'sensors',
  kestrelRepairWords: ['probe tether', 'tether'],
};

export const PROBE_ALIASES = ['lodestar', 'the lodestar', 'probe', 'the probe', 'instrument probe', 'our probe', 'tethered probe'];
export const OBSERVATORY_ALIASES = [
  'lisle', 'lisle observatory', 'the observatory', 'observatory', 'fennick', 'the moon', 'aalto', 'director aalto', 'benedikt aalto', 'the director', 'director',
];

/** Strain at which the frame really yields. */
export function tolerance(h: Hull): number {
  return h === 'strong' ? 150 : h === 'sound' ? 118 : 82;
}
/** What the gauges show for a given strain (percent of the rated limit). */
export function gaugeOf(g: Gauges, stress: number): number {
  const f = g === 'high' ? 1.3 : g === 'low' ? 0.75 : 1;
  return Math.round((stress / BOOK) * 100 * f);
}

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function grav(s: WorldState): GravityVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    hull: pickOf(e.hull, ['strong', 'sound', 'tired'] as const, 'sound'),
    gauges: pickOf(e.gauges, ['high', 'true', 'low'] as const, 'true'),
    glitches: pickOf(e.glitches, ['early', 'late', 'double'] as const, 'late'),
    peakAt: Number(e.peakAt ?? 12),
    passEnd: Number(e.passEnd ?? 22),
    glitchA: Number(e.glitchA ?? 15),
    glitchB: Number(e.glitchB ?? 0),
    falseAt: Number(e.falseAt ?? 0),
    dishTurns: Number(e.dishTurns ?? 2),
    probeLife: Number(e.probeLife ?? 5),
    exposed: Number(e.exposed ?? 6),
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
  const hull = rng.pick(['strong', 'sound', 'tired'] as const);
  const gauges = rng.pick(['high', 'true', 'low'] as const);
  const glitches = rng.pick(['early', 'late', 'double'] as const);
  const peakAt = rng.int(10, 13);
  const passEnd = rng.int(21, 23);
  const early = rng.int(7, 9);
  const late = rng.int(14, 17);
  const glitchA = glitches === 'late' ? late : early;
  const glitchB = glitches === 'double' ? late : 0;
  const falseRoll = rng.int(0, 2);
  const falseAt = falseRoll === 0 ? 0 : falseRoll === 1 ? Math.max(3, glitchA - 3) : Math.min(passEnd - 2, glitchA + 3);
  const dishTurns = rng.int(1, 3);
  const probeLife = rng.int(4, 7);
  const exposed = rng.int(4, 9);

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
      name: 'Lodestar',
      aliases: PROBE_ALIASES,
      classification: 'Tethered instrument probe',
      faction: 'concord',
      position: { x: 900, y: 200 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0), engines: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: 0,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: OBSERVATORY,
      aliases: OBSERVATORY_ALIASES,
      classification: 'Civilian research observatory',
      faction: 'independent',
      position: { x: 26000, y: -9000 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0), engines: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      weapons: { state: 'safe', target: null },
      souls: 46,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['bring the data home and the crew with it']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the outer sections clear if it comes to that']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['record every second of the pass']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['hold the ship steady in the tide']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the line to the observatory clear']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['know what the frame can really take', 'not trust a gauge over her own ears']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['keep sickbay ready']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    lodestar: char('lodestar', PROBE_CAP, 'Tethered instrument probe', 'kestrel', { motivation: '', goals: [], trust: 50, memory: {} }),
    aalto: char('aalto', AALTO, `Director of ${OBSERVATORY}`, 'cruiser', {
      motivation: 'See the whole pass recorded. He has waited his whole career for this star.',
      goals: ['have the Halcyon record the whole pass', 'have the data reach his observatory'],
      knowledge: ['history'],
      trust: 55,
      memory: {},
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('pass', `${STAR_CAP}, a neutron star, is passing through the ${SYSTEM} system. The Halcyon is the only ship that can record the pass. The deeper she goes into the star's tide, the better the data and the greater the strain on her frame.`), known: true, discoveredTurn: 0 },
      f('feel', `Chief Okafor's own read of the frame: how much it can really take, whatever the gauges say.`),
      f('history', `${STAR_CAP} glitched on its way in: sudden starquakes that slam the tide. Nobody can say when the next will come.`),
      f('tell', 'Before a real glitch the frame goes quiet for a moment. Chief Okafor can hear it if she is listening.'),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { hull, gauges, glitches, peakAt, passEnd, glitchA, glitchB, falseAt, dishTurns, probeLife, exposed };

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
      torpedoes: 6, kestrelCrewStart: 0, kestrelDead: 0, rescued: 0,
      depth: 2, stress: 0, data: 0, relayed: 0, probeData: 0, probeAt: 0, dishAt: 0, crewDead: 0, pendingWarn: 0, maxGauge: 0,
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
