/**
 * Training Simulation 003: The Quiet Signal — seeded initial world state.
 * Everything here is original fiction.
 *
 * Slots (v0.6 shared engine ids): 'kestrel' = the senders' small craft sitting in the Teyma
 * pulsar's beam (contact A), 'cruiser' = the Tessarine Directorate signals ship Cantor
 * (contact B, unarmed in practice: her guns stay cold). There is no hidden passenger.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { headingOf, sub } from '../../engine/kinematics';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'quiet-signal';
export const SCENARIO_TITLE = 'Training Simulation 003: The Quiet Signal';
export const SCENARIO_VERSION = '1.0.0';

/** Ships closer than this to the senders' craft (and the pulsar behind it) are caught by a glitch. */
export const GLITCH_KM = 60000;
/** Decode progress Lt. Szabo needs for two candidate readings, and for a confirmed grammar. */
export const PARTIAL_AT = 3;
export const FULL_AT = 7;

export type Grammar = 'primes' | 'geometry' | 'chemistry';
export type Intent = 'greeting' | 'farewell' | 'warning';
export type Director = 'scholar' | 'rival' | 'hardliner';

export interface QuietVariant {
  /** The code's real grammar (hidden). */
  grammar: Grammar;
  /** The other reading the raw pattern also fits, until the decode is complete. */
  decoy: Grammar;
  /** Szabo's early lean (on the partial decode) points to the real grammar. */
  leanRight: boolean;
  /** What the senders actually want (hidden until the full decode reads their message). */
  intent: Intent;
  /** Minutes the senders wait for an answer to each question. */
  patience: number;
  /** Signals Director Brenn's temperament. */
  director: Director;
  /** Brenn's own decode assumes the right grammar. */
  directorRight: boolean;
  /** Turn Brenn transmits her own answer if nothing stops her. */
  directorTurn: number;
  /** Minutes between the senders' warning and the pulsar's glitch (warning intent only). */
  glitchDelay: number;
}

/** The answers to the senders' two questions, under each grammar (index = question). */
export const ANSWERS: Record<Grammar, [number, number]> = {
  primes: [13, 31],
  geometry: [6, 12],
  chemistry: [4, 6],
};

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
  kestrelLead: 'senders',
  cruiserLead: 'brenn',
  passenger: null,
  kestrelRepair: 'comms',
  kestrelRepairWords: ['their transmitter', 'their emitter'],
};

export const SENDER_ALIASES = ['teyma', 'signal', 'the signal', 'quiet signal', 'pattern', 'the pattern', 'pulsar', 'the pulsar', 'senders', 'the senders', 'signal source', 'source', 'courier', 'the courier', 'alien craft', 'alien vessel', 'alien ship', 'aliens', 'small craft', 'the craft'];
export const LEDGER_ALIASES = ['cantor', 'the cantor', 'signals ship', 'listening ship', 'listening post', 'directorate ship', 'tessarine ship', 'director brenn', 'signals director', 'halia brenn', 'brenn', 'the director', 'director'];

/** The scenario's seeded choices (stored in variant.extra). */
export function quiet(s: WorldState): QuietVariant {
  const e = s.variant.extra ?? {};
  return {
    grammar: (e.grammar as Grammar) ?? 'primes',
    decoy: (e.decoy as Grammar) ?? 'geometry',
    leanRight: e.leanRight === undefined ? true : !!e.leanRight,
    intent: (e.intent as Intent) ?? 'greeting',
    patience: Number(e.patience ?? 6),
    director: (e.director as Director) ?? 'scholar',
    directorRight: !!e.directorRight,
    directorTurn: Number(e.directorTurn ?? 13),
    glitchDelay: Number(e.glitchDelay ?? 6),
  };
}

function sys(health = 100, power = 100): ShipSystem {
  return { health, power, status: deriveStatus({ health, power }) };
}
function systems(overrides: Partial<Record<SystemId, ShipSystem>> = {}): Record<SystemId, ShipSystem> {
  const out = {} as Record<SystemId, ShipSystem>;
  for (const id of SYSTEM_IDS) out[id] = overrides[id] ?? sys();
  return out;
}
type ShipInit = Omit<Ship, 'id' | 'destroyed' | 'shields' | 'weapons' | 'tractor' | 'jump' | 'detected' | 'scanLevel' | 'velocity' | 'heading' | 'nav'> & Partial<Ship>;
function ship(id: ShipId, p: ShipInit): Ship {
  return { id, destroyed: false, shields: { raised: false, strength: 100 }, weapons: { state: 'safe', target: null }, tractor: { target: null }, jump: { charge: 0 }, detected: false, scanLevel: 0, velocity: { x: 0, y: 0 }, heading: 0, nav: null, ...p };
}
function char(id: string, name: string, role: string, shipId: ShipId, extra: Partial<Character> = {}): Character {
  return { id, name, role, ship: shipId, status: 'active', goals: [], motivation: '', knowledge: [], resources: [], trust: 50, memory: {}, ...extra };
}

export const GRAMMAR_TEXT: Record<Grammar, string> = {
  primes: 'The code counts in prime numbers: each pulse group is a prime, and a question is a sequence that stops short.',
  geometry: 'The code describes shapes by their corners and faces: each pulse group is a regular figure, and a question is a figure left unfinished.',
  chemistry: 'The code is the periodic table: each pulse group is an element counted by its protons, and a question is an element left unnamed.',
};
const INTENT_TEXT: Record<Intent, string> = {
  greeting: 'The senders want to meet: their message is a greeting, and they are waiting for one in return.',
  farewell: 'The senders are leaving: their message is a farewell to whoever has been listening, and they want it acknowledged, not answered with questions.',
  warning: 'The senders are warning the listeners: the pulsar is about to glitch, and anything close to it will be caught. They are leaving, and they want us to leave too.',
};
const DIRECTOR_TEXT: Record<Director, string> = {
  scholar: 'a scholar first: she cares more about getting the reading right than about who gets it',
  rival: 'ambitious: she wants the Directorate to be first, but she can be offered a share of the credit',
  hardliner: 'under orders to claim the contact for the Directorate, and not inclined to wait for the ISA',
};

export function createScenario(seedInput: number | string = 1): WorldState {
  const seed = normaliseSeed(seedInput);
  const rng = createRng(seed);
  const grammar = rng.pick(['primes', 'geometry', 'chemistry'] as const);
  const decoy = rng.pick((['primes', 'geometry', 'chemistry'] as const).filter((g) => g !== grammar));
  const leanRight = rng.chance(0.6);
  const intent = rng.pick(['greeting', 'farewell', 'warning'] as const);
  const patience = rng.int(5, 8);
  const director = rng.pick(['scholar', 'rival', 'hardliner'] as const);
  const directorRight = rng.chance(0.5);
  const directorTurn = rng.int(7, 12);
  const glitchDelay = rng.int(5, 7);
  const sendersPos = { x: rng.int(-6, 6) * 1000, y: rng.int(48, 54) * 1000 };
  const ledgerPos = { x: sendersPos.x + rng.int(26, 34) * 1000, y: sendersPos.y + rng.int(14, 22) * 1000 };

  const ships: Record<ShipId, Ship> = {
    halcyon: ship('halcyon', {
      name: 'ISV Halcyon',
      classification: 'Survey cruiser',
      faction: 'concord',
      position: { x: 0, y: 0 },
      heading: Math.round(headingOf(sendersPos)),
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
      name: 'Teyma contact',
      aliases: SENDER_ALIASES,
      classification: 'Unidentified courier',
      faction: 'independent',
      position: sendersPos,
      heading: 0,
      perf: { maxSpeed: 300, accel: 10, turnRate: 6 },
      hull: 40,
      systems: systems({ weapons: sys(0, 0), shields: sys(0, 0), tractor: sys(0, 0) }),
      souls: 4,
      containment: 100,
      detected: false,
      disposition: 'unknown',
    }),
    cruiser: ship('cruiser', {
      name: 'Cantor',
      aliases: LEDGER_ALIASES,
      classification: 'Directorate signals ship',
      faction: 'directorate',
      position: ledgerPos,
      heading: Math.round(headingOf(sub(sendersPos, ledgerPos))),
      perf: { maxSpeed: 220, accel: 8, turnRate: 4 },
      hull: 70,
      systems: systems(),
      shields: { raised: false, strength: 70 },
      weapons: { state: 'safe', target: null },
      souls: 38,
      containment: 100,
      disposition: 'unknown',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home without starting a war.', ['protect the crew', 'avoid escalation']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the ship safe']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['measure the pulsar']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself in his first real crisis.', ['execute manoeuvres precisely']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['crack the code', 'keep channels open']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['protect ship systems']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['keep the crew well']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    senders: char('senders', 'The senders', 'An unknown people', 'kestrel', {
      motivation: {
        greeting: 'Find out whether anyone out here can think, and greet them if they can.',
        farewell: 'Say goodbye to whoever has been listening, and leave in peace.',
        warning: 'Warn anyone listening to get clear of the pulsar before it glitches.',
      }[intent],
      goals: ['be understood', 'not be threatened'],
      knowledge: ['grammar_known', 'senders_intent'],
      resources: ['a small courier', 'the pulsar'],
      trust: 50,
      memory: { q: 0, posedAt: 1, deadline: 1 + patience, lapses: 0, strikes: 0, echoed: 0, messageAt: 0, replied: 0, pressed: 0, answeredBy: 0 },
    }),
    brenn: char('brenn', 'Signals Director Halia Brenn', 'Commander, Directorate signals ship Cantor', 'cruiser', {
      motivation: {
        scholar: 'Read the signal correctly. Who reads it first matters less than reading it right.',
        rival: 'Bring the Directorate its first contact, and her own name with it.',
        hardliner: 'Claim the contact for the Directorate before the ISA can, as ordered.',
      }[director],
      goals: ['decode the signal', 'answer the senders for the Directorate'],
      knowledge: ['director_temperament'],
      resources: ['signals ship', 'a Directorate decoding team'],
      trust: 20,
      memory: { hailed: 0, talks: 0, holding: 0, joint: 0, transmitted: 0, nextAt: directorTurn, warned: 0, given: 0 },
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('pulsar_timing', "The Teyma pulsar's timing gaps are artificial: something in its beam is blanking pulses in groups. Sensors have the exact timing, which sharpens Lieutenant Szabo's decode."),
      f('courier_crewed', 'The signal source is a small courier with four life signs aboard, sitting in the pulsar beam. It carries no weapons.'),
      f('ledger_identity', 'The Cantor is a Tessarine Directorate signals ship under Signals Director Halia Brenn. Her crew is decoding the same signal; her weapons are cold.'),
      f('partial_decode', 'Lieutenant Szabo has a partial decode: the pattern fits two readings, and each gives a different answer.'),
      f('grammar_known', GRAMMAR_TEXT[grammar]),
      f('senders_intent', INTENT_TEXT[intent]),
      f('director_temperament', `Signals Director Brenn reads as ${DIRECTOR_TEXT[director]}.`),
      f('director_wrong', "The Cantor's decode assumes the wrong grammar: if she answers, she will answer wrongly."),
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
    relations: { tension: 5, trustConcordDirectorate: 30 },
    // The Kestrel Incident's variant fields are kept (neutral values) so the shared engine and saves stay uniform.
    variant: { passenger: 'defector', temperament: 'cautious', reactorTurns: 99, complication: 'none', reinforcementTurn: 99, extra: { grammar, decoy, leanRight, intent, patience, director, directorRight, directorTurn, glitchDelay } },
    objectives: [],
    log: [],
    nextLogId: 1,
    pending: [],
    flags: {},
    counters: { torpedoes: 6, kestrelCrewStart: 4, kestrelDead: 0, rescued: 0, trapped: 0, cargo: 0, decode: 0 },
    orders: { jumpCharging: false, list: [], nextId: 1 },
    posture: { stance: 'neutral', since: 0 },
    standing: [],
    restrictions: [],
    familiarity: { drilled: {} },
    landmarks: { border: { x: 0, y: -140000 }, pulsar: { x: sendersPos.x, y: sendersPos.y + 3000 } },
    slots: SLOTS,
    clarification: null,
    lastTarget: null,
    fx: [],
    outcome: null,
  };
}
