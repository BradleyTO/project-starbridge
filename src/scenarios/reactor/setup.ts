/**
 * Training Simulation 004: Reactor Night — seeded initial world state.
 * Everything here is original fiction.
 *
 * There is no enemy. The Halcyon's own reactor is running away, and the crisis is aboard.
 * Slots (v0.6 shared engine ids): 'kestrel' = the Halcyon's one-person work pod Tern, standing
 * off the hull with Crewman Ines Paley aboard (contact A: the only craft that can reach the
 * reactor spine from outside); 'cruiser' = the ISA fleet repair tender ISV Larkspur, far away and
 * on the way, too late to help with anything but advice (contact B). There is no hidden passenger.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'reactor-night';
export const SCENARIO_TITLE = 'Training Simulation 004: Reactor Night';
export const SCENARIO_VERSION = '1.0.0';

/** Core heat at which containment fails and the reactor breaches. */
export const BREACH_AT = 100;
/** Core heat at which the compartments around the core (deck six) take a lethal dose. */
export const DECK_AT = 92;
/** Diagnosis progress Chief Okafor needs to rule one fault out, and to be certain. */
export const DIAG_PARTIAL = 2;
export const DIAG_AT = 4;
/** Radiation dose at which Crewman Paley, outside on the spine, would die. */
export const DOSE_FATAL = 100;
/** The pod stands off the hull within this many metres while it is anywhere near the spine. */
export const POD_STANDOFF = 1200;

export type Fault = 'valve' | 'pump' | 'sensor';
export type Nerve = 'steady' | 'shaken' | 'panicked';
export type Stance = 'mentor' | 'byTheBook' | 'salvage';

export interface ReactorVariant {
  /** What has actually failed (hidden until Okafor's diagnosis). */
  fault: Fault;
  /** The fault Okafor can rule out first (never the real one). */
  ruledOut: Fault;
  /** Core heat at the start, and the cascade's own climb per minute. */
  heat0: number;
  rate: number;
  /** Crewman Paley's state tonight (hidden until someone asks her, or Dr. Osei looks). */
  nerve: Nerve;
  /** The stuck valve is deep in the spine: a longer trip, and a heavier dose. */
  valveDeep: boolean;
  /** The core's ejection clamps: free, or jammed (two minutes to cut before an ejection). */
  clamps: 'free' | 'jammed';
  /** Commander Basant's stance aboard the Larkspur. */
  stance: Stance;
  /** Crew at their posts on deck six, around the core. */
  deckSix: number;
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
  kestrelLead: 'paley',
  cruiserLead: 'basant',
  passenger: null,
  // "Stabilise the reactor", "repair our reactor": the shared reducer would send a team to contact A;
  // agents.ts turns that into Okafor's damage-control team on the Halcyon's own core.
  kestrelRepair: 'reactor',
  kestrelRepairWords: ['the core', 'the reactor', 'our reactor', 'our core', 'the cascade'],
};

export const POD_ALIASES = ['pod', 'the pod', 'work pod', 'the work pod', 'tern', 'the tern', 'paley', 'crewman paley', 'ines', 'ines paley', 'crewman'];
export const TENDER_ALIASES = ['larkspur', 'the larkspur', 'isv larkspur', 'tender', 'the tender', 'repair tender', 'basant', 'commander basant', 'aurelio basant', 'fleet engineering'];

/** The scenario's seeded choices (stored in variant.extra). */
export function reactor(s: WorldState): ReactorVariant {
  const e = s.variant.extra ?? {};
  return {
    fault: (e.fault as Fault) ?? 'valve',
    ruledOut: (e.ruledOut as Fault) ?? 'sensor',
    heat0: Number(e.heat0 ?? 32),
    rate: Number(e.rate ?? 4),
    nerve: (e.nerve as Nerve) ?? 'shaken',
    valveDeep: !!e.valveDeep,
    clamps: e.clamps === 'jammed' ? 'jammed' : 'free',
    stance: (e.stance as Stance) ?? 'mentor',
    deckSix: Number(e.deckSix ?? 6),
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

export const FAULT_TEXT: Record<Fault, string> = {
  valve: 'The primary coolant valve on the reactor spine has stuck half-shut. The regulator is right; it simply cannot get enough coolant through. Opening that valve, by hand or around it, stops the cascade.',
  pump: 'The main coolant pump is failing. Its impeller is cavitating, so the loop is moving half the coolant it should. The standby pump, cross-connected, stops the cascade; so does any second loop around the core.',
  sensor: 'The core temperature sensor is reading low, so the automatic regulator keeps feeding the reaction. Taking the regulator off automatic and running it by hand stops the cascade. Nothing outside the hull is wrong.',
};
export const FAULT_NAME: Record<Fault, string> = { valve: 'the spine valve', pump: 'the main coolant pump', sensor: 'the core temperature sensor' };
const NERVE_TEXT: Record<Nerve, string> = {
  steady: 'Crewman Paley is frightened of the pod, and knows it, and is managing it. She will go if she is asked properly.',
  shaken: 'Crewman Paley is badly frightened of being sealed in the pod. Sent without a word she is likely to freeze outside; steadied first, she will hold.',
  panicked: 'Crewman Paley is in no state to fly the pod tonight. Ordered out, she will freeze outside the hull whatever is said to her.',
};
const STANCE_TEXT: Record<Stance, string> = {
  mentor: 'an old reactor hand who will talk your Chief through anything, and trusts the people on the spot',
  byTheBook: 'a by-the-manual engineer: at this stage of a cascade the manual says eject, and he says so',
  salvage: 'carrying a request from Fleet Engineering that the Halcyon’s core be kept if it possibly can be, and inclined to press it',
};

export function createScenario(seedInput: number | string = 1): WorldState {
  const seed = normaliseSeed(seedInput);
  const rng = createRng(seed);
  const fault = rng.pick(['valve', 'pump', 'sensor'] as const);
  const ruledOut = rng.pick((['valve', 'pump', 'sensor'] as const).filter((f) => f !== fault));
  const heat0 = rng.int(38, 46);
  const rate = rng.pick([3, 4, 4, 5] as const);
  const nerve = rng.pick(['steady', 'shaken', 'shaken', 'panicked'] as const);
  const valveDeep = rng.chance(0.4);
  const clamps = rng.chance(0.35) ? ('jammed' as const) : ('free' as const);
  const stance = rng.pick(['mentor', 'byTheBook', 'salvage'] as const);
  const deckSix = rng.int(4, 9);
  const podPos = { x: rng.int(5, 9) * 100, y: -rng.int(4, 8) * 100 };
  const tenderPos = { x: -rng.int(40, 80) * 1000, y: rng.int(200, 240) * 1000 };

  const ships: Record<ShipId, Ship> = {
    halcyon: ship('halcyon', {
      name: 'ISV Halcyon',
      classification: 'Survey cruiser',
      faction: 'concord',
      position: { x: 0, y: 0 },
      heading: 0,
      perf: { maxSpeed: 235, accel: 12, turnRate: 6 },
      hull: 100,
      systems: systems({ reactor: sys(100 - heat0, 100) }),
      souls: 212,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'friendly',
    }),
    kestrel: ship('kestrel', {
      name: 'Tern',
      aliases: POD_ALIASES,
      classification: 'Work pod',
      faction: 'concord',
      position: podPos,
      heading: 0,
      // The pod never manoeuvres on its own (its runs are staged in agents.ts); the limit is what a tractor can tow it at.
      perf: { maxSpeed: 240, accel: 1, turnRate: 30 },
      hull: 100,
      systems: systems({ weapons: sys(0, 0), shields: sys(0, 0), tractor: sys(0, 0), jumpDrive: sys(0, 0), transporter: sys(0, 0) }),
      shields: { raised: false, strength: 0 },
      souls: 1,
      containment: 100,
      detected: false,
      scanLevel: 2,
      disposition: 'friendly',
    }),
    cruiser: ship('cruiser', {
      name: 'ISV Larkspur',
      aliases: TENDER_ALIASES,
      classification: 'Fleet repair tender',
      faction: 'concord',
      position: tenderPos,
      heading: 180,
      perf: { maxSpeed: 120, accel: 4, turnRate: 3 },
      hull: 100,
      systems: systems({ weapons: sys(0, 0) }),
      shields: { raised: false, strength: 60 },
      weapons: { state: 'safe', target: null },
      souls: 64,
      containment: 100,
      // An ISA ship on its own transponder and already on long-range comms: identified, though not yet scanned.
      scanLevel: 1,
      disposition: 'friendly',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['protect the crew', 'keep the ship together']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the ship safe']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['read the core']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself in his first real crisis.', ['execute manoeuvres precisely']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep channels open']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['find the fault', 'save the core if she can, the crew first']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['keep the crew well', 'keep Paley’s dose down']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    paley: char('paley', 'Crewman Ines Paley', 'Work-pod operator, Engineering', 'kestrel', {
      motivation: 'Do the job without anyone seeing how frightened she is of that pod.',
      goals: ['keep her nerve', 'not let the Chief down', 'come back inside'],
      knowledge: ['paley_state'],
      resources: ['the work pod Tern', 'the only pod rating on watch'],
      trust: 55,
      memory: { hailed: 0, steadied: 0, asked: 0, task: 0, stage: 0, left: 0, frozen: 0, remote: 0, dose: 0, ordered: 0, done: 0 },
    }),
    basant: char('basant', 'Cmdr. Aurelio Basant', 'Commanding officer, fleet repair tender ISV Larkspur', 'cruiser', {
      motivation: {
        mentor: 'Talk a crew he cannot reach through the worst night of their careers.',
        byTheBook: 'Get the Halcyon to follow the manual: at stage four, eject.',
        salvage: 'Bring Fleet Engineering a rare core intact, if the Halcyon can manage it.',
      }[stance],
      goals: ['reach the Halcyon', 'advise her Chief'],
      knowledge: ['basant_stance', 'bypass_procedure'],
      resources: ['a repair tender, hours away', 'the fleet engineering manuals'],
      trust: 60,
      memory: { hailed: 0, talks: 0, gave: 0, pressed: 0 },
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('flow_scan', "Lieutenant Varga's internal scan of the coolant loop: the flow is wrong in a way that narrows what can have failed. Chief Okafor has the readings."),
      f('fault_ruled_out', `Chief Okafor has ruled one cause out: it is not ${FAULT_NAME[ruledOut]}.`),
      f('fault_known', FAULT_TEXT[fault]),
      f('paley_state', NERVE_TEXT[nerve]),
      f('basant_stance', `Commander Basant of the Larkspur is ${STANCE_TEXT[stance]}.`),
      f('bypass_procedure', "The Larkspur's procedure for a cold bypass through the shield coolant loop: done to the book, the pod's work at the spine manifold takes two minutes, not three."),
      f('clamps_jammed', 'The core ejection clamps are jammed. An ejection needs two minutes of cutting first.'),
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
    variant: { passenger: 'defector', temperament: 'cautious', reactorTurns: 99, complication: 'none', reinforcementTurn: 99, extra: { fault, ruledOut, heat0, rate, nerve, valveDeep, clamps, stance, deckSix } },
    objectives: [],
    log: [],
    nextLogId: 1,
    pending: [],
    flags: {},
    counters: { torpedoes: 6, kestrelCrewStart: 1, kestrelDead: 0, rescued: 0, trapped: 0, cargo: 0, heat: heat0, diag: 0, job: 0, jobLeft: 0, deckLost: 0 },
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
