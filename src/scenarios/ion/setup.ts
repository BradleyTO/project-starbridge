/**
 * Training Simulation 006: Ion Season — seeded initial world state.
 * Everything here is original fiction.
 *
 * An escort through weather. The ion season is closing the Corrie Drift, and two slow ore haulers
 * must cross it to Hesper Deep before the station is cut off for a month. The storm lies in three
 * bands (the Fringe, the Combs, the Maw); each has a high and a low channel, one calm and one that
 * piles ion charge onto every hull that crosses it. Sensors are nearly blind. Every minute spent at
 * a band's edge charges the haulers a little more.
 * Slots (v0.6 shared engine ids): 'kestrel' = the Saffron Mule, Capt. Odran Brack (contact A);
 * 'cruiser' = Gannet's Luck, Capt. Rosalind Teague (contact B). Both are unarmed civilian haulers
 * flying close on the Halcyon. There is no enemy, no spy and no weapon in this story.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'ion-season';
export const SCENARIO_TITLE = 'Training Simulation 006: Ion Season';
export const SCENARIO_VERSION = '1.0.0';

export type Hauler = 'mule' | 'gannet';
export type Channel = 'high' | 'low';
export type Season = 'settled' | 'restless' | 'spate';
export type Unfit = 'none' | 'mule' | 'gannet';

export const HAULERS: readonly Hauler[] = ['mule', 'gannet'];
export const SLOT: Record<Hauler, 'kestrel' | 'cruiser'> = { mule: 'kestrel', gannet: 'cruiser' };
export const CAPTAIN: Record<Hauler, string> = { mule: 'brack', gannet: 'teague' };
export const otherHauler = (h: Hauler): Hauler => (h === 'mule' ? 'gannet' : 'mule');
export const haulerOfParty = (p: string): Hauler => (p === 'cruiser' ? 'gannet' : 'mule');
export const otherCh = (c: Channel): Channel => (c === 'high' ? 'low' : 'high');

export const SHIP_NAME: Record<Hauler, string> = { mule: 'Saffron Mule', gannet: "Gannet's Luck" };
export const CAPTAIN_NAME: Record<Hauler, string> = { mule: 'Capt. Odran Brack', gannet: 'Capt. Rosalind Teague' };
export const CAPTAIN_SHORT: Record<Hauler, string> = { mule: 'Captain Brack', gannet: 'Captain Teague' };
export const MATE_NAME: Record<Hauler, string> = { mule: 'Mate Iver Quill', gannet: 'Mate Pim Hollow' };
export const PRONOUN: Record<Hauler, { sub: string; obj: string; pos: string }> = {
  mule: { sub: 'he', obj: 'him', pos: 'his' },
  gannet: { sub: 'she', obj: 'her', pos: 'her' },
};
export const BAND_NAME = ['the Fringe', 'the Combs', 'the Maw'] as const;
export const BAND_SHORT = ['Fringe', 'Combs', 'Maw'] as const;
export const STATION = 'Hesper Deep';

export interface IonVariant {
  /** The calm channel in each band (the other one is rough). */
  calm: [Channel, Channel, Channel];
  /** Whether Varga's storm model has live buoy data for each band (firm: always right). */
  firm: [boolean, boolean, boolean];
  /** Where the model is soft, whether it is wrong. */
  wrong: [boolean, boolean, boolean];
  /** Adeyemi says what he feels (confident), or repeats the model unless asked for his own read (diffident). */
  confident: boolean;
  /** The band Adeyemi cannot read until he has felt it for a minute. */
  blind: number;
  /** If pressed for a guess on his blind band before he has felt it, whether he guesses right. */
  guessRight: boolean;
  season: Season;
  /** Spate only: minutes at the Maw's edge before its lull; the lull lasts two minutes. */
  lullAt: number;
  unfit: Unfit;
  /** Teague's patience: minutes she will hold at one band's edge before she runs her own line. */
  patience: number;
  /** The channel Teague would take in each band. */
  teagueLean: [Channel, Channel, Channel];
  chargeMule: number;
  chargeGannet: number;
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
  kestrelLead: 'brack',
  cruiserLead: 'teague',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const MULE_ALIASES = ['saffron mule', 'the saffron mule', 'saffron', 'the saffron', 'mule', 'the mule', 'brack', 'captain brack', 'odran', 'odran brack', 'capt brack'];
export const GANNET_ALIASES = ["gannet's luck", 'gannets luck', "the gannet's luck", 'the gannets luck', 'gannet', 'the gannet', 'teague', 'captain teague', 'rosalind', 'rosalind teague', 'capt teague'];

const ch = (x: unknown, d: Channel): Channel => (x === 'high' || x === 'low' ? x : d);
const triple = <T>(e: Record<string, unknown>, k: string, f: (x: unknown) => T): [T, T, T] => [f(e[`${k}0`]), f(e[`${k}1`]), f(e[`${k}2`])];

/** The scenario's seeded choices (stored in variant.extra). */
export function ion(s: WorldState): IonVariant {
  const e = (s.variant.extra ?? {}) as Record<string, unknown>;
  return {
    calm: triple(e, 'calm', (x) => ch(x, 'high')),
    firm: triple(e, 'firm', (x) => x === 1 || x === '1' || x === true),
    wrong: triple(e, 'wrong', (x) => x === 1 || x === '1' || x === true),
    confident: e.confident === 1 || e.confident === '1',
    blind: Number(e.blind ?? 1),
    guessRight: e.guessRight === 1 || e.guessRight === '1',
    season: e.season === 'restless' || e.season === 'spate' ? e.season : 'settled',
    lullAt: Number(e.lullAt ?? 3),
    unfit: e.unfit === 'mule' || e.unfit === 'gannet' ? e.unfit : 'none',
    patience: Number(e.patience ?? 4),
    teagueLean: triple(e, 'tlean', (x) => ch(x, 'high')),
    chargeMule: Number(e.chargeMule ?? 28),
    chargeGannet: Number(e.chargeGannet ?? 28),
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

export const CREW: Record<Hauler, number> = { mule: 14, gannet: 11 };

/** What is wrong with the unfit captain, in Dr. Osei's words. */
export function unfitText(h: Hauler): string {
  return h === 'mule'
    ? `${CAPTAIN_NAME.mule} has an ion tremor: thirty seasons of storm static in his nerves. His hands shake when the charge climbs, and in the Maw he will not hold a line. He has not told anyone.`
    : `${CAPTAIN_NAME.gannet} has been awake for about forty hours, running her ship short-handed to make the season. Her reactions are slowing, and in the Maw she will not hold a line. She will not say so.`;
}

export function createScenario(seedInput: number | string = 1): WorldState {
  const seed = normaliseSeed(seedInput);
  const rng = createRng(seed);
  const pickCh = (): Channel => rng.pick(['high', 'low'] as const);
  const calm: Channel[] = [pickCh(), pickCh(), pickCh()];
  const firm = [0, 1, 2].map(() => (rng.next() < 0.35 ? 1 : 0));
  const wrong = [0, 1, 2].map((i) => (firm[i] ? 0 : rng.next() < 0.6 ? 1 : 0));
  const confident = rng.next() < 0.5 ? 1 : 0;
  const blind = rng.int(0, 2);
  const guessRight = rng.next() < 0.5 ? 1 : 0;
  const season = rng.pick(['settled', 'settled', 'restless', 'restless', 'spate', 'spate', 'spate'] as const);
  const lullAt = rng.int(2, 4);
  const unfit = rng.pick(['none', 'none', 'mule', 'mule', 'gannet', 'gannet', 'gannet'] as const);
  const patience = rng.int(3, 5);
  const tlean: Channel[] = [pickCh(), pickCh(), pickCh()];
  const chargeMule = rng.int(22, 34);
  const chargeGannet = rng.int(22, 34);
  const mulePos = { x: rng.int(9, 14) * 100, y: rng.int(4, 8) * 100 };
  const gannetPos = { x: -rng.int(9, 14) * 100, y: rng.int(4, 8) * 100 };

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
      name: SHIP_NAME.mule,
      aliases: MULE_ALIASES,
      classification: 'Ore hauler',
      faction: 'independent',
      position: mulePos,
      heading: 0,
      perf: { maxSpeed: 60, accel: 2, turnRate: 2 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0) }),
      shields: { raised: false, strength: 20 },
      souls: CREW.mule,
      containment: 100,
      detected: false,
      scanLevel: 1,
      disposition: 'neutral',
    }),
    cruiser: ship('cruiser', {
      name: SHIP_NAME.gannet,
      aliases: GANNET_ALIASES,
      classification: 'Ore hauler',
      faction: 'independent',
      position: gannetPos,
      heading: 0,
      perf: { maxSpeed: 60, accel: 2, turnRate: 2 },
      hull: 100,
      systems: systems({ weapons: sysOf(0, 0), jumpDrive: sysOf(0, 0) }),
      shields: { raised: false, strength: 20 },
      souls: CREW.gannet,
      containment: 100,
      detected: false,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const captain = (h: Hauler): Character =>
    char(CAPTAIN[h], CAPTAIN_NAME[h], `Master of the ${SHIP_NAME[h]}`, SLOT[h], {
      motivation: h === 'mule' ? 'Make one more season, and never be the old man who could not.' : 'Make Hesper Deep before the season closes, whatever it takes.',
      goals: h === 'mule' ? ['bring the Mule through', 'keep his tremor to himself'] : ['get through fast', 'not sit in the storm waiting'],
      knowledge: unfit === h ? ['unfit'] : [],
      resources: [`the ${SHIP_NAME[h]}`],
      trust: h === 'mule' ? 45 : 40,
      memory: { spoke: 0, asked: 0, admitted: 0, relieved: 0, remote: 0, steadied: 0, warned: 0 },
    });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['keep the convoy together']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the ship safe']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['model the storm']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['find the calm water']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep the convoy net open']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['keep the charge off the hull']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['keep everyone well']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    brack: captain('mule'),
    teague: captain('gannet'),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('unfit', unfit === 'none' ? 'Both hauler captains are fit to fly.' : unfitText(unfit)),
      f('drift', unfit === 'none' ? 'Both haulers held the line.' : `The ${SHIP_NAME[unfit]} wandered off the line crossing the Fringe, twice, and corrected late both times.`),
      f('season', season === 'spate' ? 'This is a spate season: the Maw runs rough in both channels, with short lulls the instruments cannot forecast.' : season === 'restless' ? 'This is a restless season: charge builds faster than usual at every band edge.' : 'This is a settled season: the calm channels hold steady.'),
      f('impatient', `${CAPTAIN_NAME.gannet} will not sit at a band edge for long. Hold her too long and she will run her own line.`),
    ].map((x) => [x.id, x]),
  );

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
      extra: {
        calm0: calm[0], calm1: calm[1], calm2: calm[2],
        firm0: firm[0], firm1: firm[1], firm2: firm[2],
        wrong0: wrong[0], wrong1: wrong[1], wrong2: wrong[2],
        confident, blind, guessRight, season, lullAt, unfit, patience,
        tlean0: tlean[0], tlean1: tlean[1], tlean2: tlean[2],
        chargeMule, chargeGannet,
      },
    },
    objectives: [],
    log: [],
    nextLogId: 1,
    pending: [],
    flags: {},
    counters: {
      torpedoes: 6, kestrelCrewStart: CREW.mule, kestrelDead: 0, rescued: 0,
      band: 0, edge: 0, chargeMule, chargeGannet, chargeH: 0, probes: 2, probeLeft: 0, probeBand: -1, probeCh: 0,
      adriftMule: 0, adriftGannet: 0, clockMule: 0, clockGannet: 0, teagueHold: 0, discharges: 0, blindCrossings: 0, crossTurn: -1,
    },
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
