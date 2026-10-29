/**
 * Training Simulation 010: The Gardener — seeded initial world state.
 * Everything here is original fiction.
 *
 * The Cobble Field is an asteroid mining field worked by a small claims cooperative. Something is
 * growing across one of its rocks, spreading a little every minute toward the cooperative's claims:
 * a pale, branching growth the miners have started calling "the Gardener". It might be a living
 * organism, it might be a mineral crystallisation that only looks alive, and if it is alive it might
 * be the kind that scatters spores when it is burned. It is drawn toward something (heat, metal or
 * light). Nobody can talk to it; the question is what it is, and whether it has to die.
 * Claimwarden Bettine Crake has cutting charges on her tender and wants it burned now; Assayer
 * Lorne Haskett runs the claims station and knows the field. What the growth is, what draws it, what
 * links its rock to the claims, Crake's temper, and every clock are seeded and hidden.
 * Slots (v0.6 shared engine ids): 'kestrel' = Spindle, the cooperative's claims station (contact A,
 * civilian, Haskett); 'cruiser' = the mining tender Hobnail, Claimwarden Crake (contact B). Neither
 * is armed, and neither is the problem: the growth is represented in the scenario's own state.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'gardener';
export const SCENARIO_TITLE = 'Training Simulation 010: The Gardener';
export const SCENARIO_VERSION = '1.0.0';

/** What the growth really is. */
export type Nature = 'organism' | 'stone' | 'sporing';
/** What it grows toward. */
export type Drawn = 'heat' | 'metal' | 'light';
/** What links the growth's rock to the claims (the only road it has across open space). */
export type Link = 'rail' | 'tethers' | 'none';
/** What kind of claimwarden Crake is today. */
export type Temper = 'hothead' | 'pragmatic' | 'frightened';

export const FIELD = 'the Cobble Field';
export const STATION = 'Spindle';
export const TENDER = 'Hobnail';
export const GROWTH = 'the Gardener';
export const CRAKE = 'Claimwarden Bettine Crake';
export const CRAKE_SHORT = 'Claimwarden Crake';
export const HASKETT = 'Assayer Lorne Haskett';
export const HASKETT_SHORT = 'Assayer Haskett';

export interface GardenerVariant {
  nature: Nature;
  drawn: Drawn;
  link: Link;
  temper: Temper;
  /** Turns each stage of Lt. Varga's study takes. */
  pace: number;
  /** The turn Crake fires her charges unless she has agreed to wait. */
  burnAt: number;
  /** The turn the growth reaches the claims. */
  claimsAt: number;
  /** The turn a heat-drawn growth reaches the Halcyon if she stays close and runs hot. */
  halcyonAt: number;
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
  kestrelLead: 'haskett',
  cruiserLead: 'crake',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const STATION_ALIASES = ['spindle', 'spindle station', 'the station', 'station', 'claims station', 'the claims station', 'the claims', 'claims', 'haskett', 'assayer haskett', 'lorne haskett', 'the assayer', 'assayer'];
export const TENDER_ALIASES = ['hobnail', 'the hobnail', 'tender', 'the tender', 'mining tender', 'the mining tender', 'cutter', 'the cutter', 'crake', 'claimwarden crake', 'bettine crake', 'claimwarden', 'the claimwarden', 'the miners', 'miners'];

const pickOf = <T extends string>(x: unknown, xs: readonly T[], d: T): T => (xs.includes(x as T) ? (x as T) : d);

/** The scenario's seeded choices (stored in variant.extra). */
export function gardener(s: WorldState): GardenerVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    nature: pickOf(e.nature, ['organism', 'stone', 'sporing'] as const, 'organism'),
    drawn: pickOf(e.drawn, ['heat', 'metal', 'light'] as const, 'metal'),
    link: pickOf(e.link, ['rail', 'tethers', 'none'] as const, 'rail'),
    temper: pickOf(e.temper, ['hothead', 'pragmatic', 'frightened'] as const, 'pragmatic'),
    pace: Number(e.pace ?? 2),
    burnAt: Number(e.burnAt ?? 10),
    claimsAt: Number(e.claimsAt ?? 20),
    halcyonAt: Number(e.halcyonAt ?? 12),
  };
}

export const alive = (v: GardenerVariant) => v.nature !== 'stone';

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
  const nature = rng.pick(['organism', 'stone', 'sporing'] as const);
  const drawn = rng.pick(['heat', 'metal', 'light'] as const);
  const link = rng.pick(['rail', 'tethers', 'none'] as const);
  const temper = rng.pick(['hothead', 'pragmatic', 'frightened'] as const);
  const pace = rng.int(2, 3);
  const burnAt = rng.int(8, 12);
  const claimsAt = rng.int(18, 24);
  const halcyonAt = rng.int(10, 15);

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
      classification: 'Civilian mining station',
      faction: 'independent',
      position: { x: 26000, y: 3000 },
      heading: 0,
      perf: { maxSpeed: 0, accel: 0, turnRate: 0 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), engines: sysOf(0, 0), jumpDrive: sysOf(0, 0), shields: sysOf(0, 0), transporter: sysOf(0, 0), tractor: sysOf(60, 60) }),
      shields: { raised: false, strength: 0 },
      souls: 140,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: TENDER,
      aliases: TENDER_ALIASES,
      classification: 'Mining tender',
      faction: 'independent',
      position: { x: 9000, y: 2000 },
      heading: 0,
      perf: { maxSpeed: 90, accel: 6, turnRate: 8 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), shields: sysOf(0, 0), jumpDrive: sysOf(0, 0) }),
      shields: { raised: false, strength: 0 },
      souls: 18,
      containment: 100,
      detected: true,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['keep the miners and the science apart long enough']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the guns cold unless they are needed']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['learn what the growth is before anyone burns it']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['hold station off the rock']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the miners talking']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['keep the hull clean']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['keep anything unknown off the ship']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    crake: char('crake', CRAKE, `Claimwarden of the Cobble Field cooperative, aboard the tender ${TENDER}`, 'cruiser', { motivation: 'Keep her claims and her people safe.', goals: ['burn the growth before it reaches the claims'], trust: 45, memory: {} }),
    haskett: char('haskett', HASKETT, `Assayer of the claims station ${STATION}`, 'kestrel', { motivation: 'Keep the station running, and know the field.', goals: ['keep the claims crews safe'], trust: 60, memory: {} }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      { ...f('growth', `A pale, branching growth is spreading across a rock in ${FIELD}, toward the cooperative's claims.`), known: true, discoveredTurn: 0 },
      f('alive', `Lt. Varga's first finding: whether the growth is alive at all.`),
      f('drawn', `Lt. Varga's second finding: what the growth is growing toward.`),
      f('habit', `Lt. Varga's third finding: what burning it would do, and whether it can cross open space.`),
      f('field', `${HASKETT_SHORT}'s account of what links the growth's rock to the claims.`),
    ].map((x) => [x.id, x]),
  );

  const extra: Record<string, string | number> = { nature, drawn, link, temper, pace, burnAt, claimsAt, halcyonAt };

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
    counters: { torpedoes: 6, kestrelCrewStart: 140, kestrelDead: 0, rescued: 0, burnDue: burnAt, studyAt: 0, aliveAt: 0, drawnAt: 0, habitAt: 0, lureAt: 0, leadAt: 0, cutAt: 0, dimAt: 0, burnWarned: 0, spread: 0 },
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
