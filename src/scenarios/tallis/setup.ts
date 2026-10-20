/**
 * Training Simulation 002: Quarantine at Tallis Gate — seeded initial world state.
 * Everything here is original fiction.
 *
 * Slots (v0.6 shared engine ids): 'kestrel' = the pilgrim liner Mercy of Ilun (contact A),
 * 'cruiser' = the colony picket Thornwake (contact B). There is no hidden passenger.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { headingOf, sub } from '../../engine/kinematics';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'tallis-quarantine';
export const SCENARIO_TITLE = 'Training Simulation 002: Quarantine at Tallis Gate';
export const SCENARIO_VERSION = '1.0.0';

/** The quarantine line: Warden-Commander Marr fires on a ship that comes closer than this to her picket. */
export const LINE_KM = 40000;
/** The liner is "docked" (inside the colony's orbital gate) at this range from the picket. */
export const DOCK_KM = 4000;

export type Cause = 'fever' | 'toxin' | 'panic';
export type Warden = 'strict' | 'fearful' | 'humane';

export interface TallisVariant {
  cause: Cause;
  warden: Warden;
  /** Marr's brother is among the pilgrims (hidden). */
  kin: boolean;
  /** Turn Captain Sabeth runs the line if nobody gives her a reason to wait. */
  runTurn: number;
  /** Pilgrims sick at the start. */
  sickStart: number;
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
  kestrelLead: 'sabeth',
  cruiserLead: 'marr',
  passenger: null,
  kestrelRepair: 'lifeSupport',
  kestrelRepairWords: ['water recycler', 'recycler', 'water reclaimer', 'purifier', 'water supply', 'water system', 'their water'],
};

export const LINER_ALIASES = ['mercy of ilun', 'the mercy', 'mercy', 'ilun', 'liner', 'pilgrim ship', 'pilgrim liner', 'pilgrims', 'captain sabeth', 'sabeth', 'juno sabeth'];
export const PICKET_ALIASES = ['thornwake', 'picket ship', 'picket', 'cutter', 'warden-commander', 'warden commander', 'warden', 'warden marr', 'commander marr', 'marr', 'isolde marr', 'colony ship', 'the colony'];

/** The scenario's seeded choices (stored in variant.extra). */
export function tallis(s: WorldState): TallisVariant {
  const e = s.variant.extra ?? {};
  return {
    cause: (e.cause as Cause) ?? 'fever',
    warden: (e.warden as Warden) ?? 'strict',
    kin: !!e.kin,
    runTurn: Number(e.runTurn ?? 8),
    sickStart: Number(e.sickStart ?? 20),
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

const CAUSE_TEXT: Record<Cause, string> = {
  fever: 'The sickness is Ilun fever, a contagious haemorrhagic virus spread by breath and touch. An antiviral can be synthesised from a blood sample in about four minutes.',
  toxin: "The sickness is not a disease: it is cadmium-salt poisoning from the liner's contaminated water recycler. It is not contagious; repairing the recycler stops it.",
  panic: "The sickness is not a disease: it is an allergic reaction to the resin incense burnt in the pilgrims' rites. Frightening but not dangerous, and not contagious.",
};
const CLUE_TEXT: Record<Cause, string> = {
  fever: 'Eight pilgrims boarded at Corvel Station while it was under a fever advisory; the first cases were among them.',
  toxin: "The Mercy of Ilun's water recycler was patched at Corvel Station by an unlicensed yard; the first cases were the galley crew.",
  panic: 'The first cases came during the incense rites on the observation deck; nobody who skipped the rites is sick.',
};

export function createScenario(seedInput: number | string = 1): WorldState {
  const seed = normaliseSeed(seedInput);
  const rng = createRng(seed);
  const cause = rng.pick(['fever', 'toxin', 'panic'] as const);
  const warden = rng.pick(['strict', 'fearful', 'humane'] as const);
  const kin = rng.chance(0.4);
  const runTurn = rng.int(7, 11);
  const souls = rng.int(120, 168);
  const sickStart = cause === 'fever' ? rng.int(16, 26) : cause === 'toxin' ? rng.int(24, 36) : rng.int(30, 44);
  const linerPos = { x: -rng.int(9, 15) * 1000, y: rng.int(28, 34) * 1000 };
  const picketPos = { x: rng.int(-4, 4) * 1000, y: 90000 };

  const ships: Record<ShipId, Ship> = {
    halcyon: ship('halcyon', {
      name: 'ISV Halcyon',
      classification: 'Survey cruiser',
      faction: 'concord',
      position: { x: 0, y: 0 },
      heading: Math.round(headingOf(linerPos)),
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
      name: 'Mercy of Ilun',
      aliases: LINER_ALIASES,
      classification: 'Pilgrim liner',
      faction: 'independent',
      position: linerPos,
      heading: Math.round(headingOf(sub(picketPos, linerPos))),
      perf: { maxSpeed: 140, accel: 4, turnRate: 3 },
      hull: 60,
      systems: systems({ weapons: sys(0, 0), shields: sys(0, 0), jumpDrive: sys(0, 0), tractor: sys(0, 0), lifeSupport: sys(cause === 'toxin' ? 45 : 90) }),
      souls,
      containment: 100,
      detected: true,
      disposition: 'distressed',
    }),
    cruiser: ship('cruiser', {
      name: 'Thornwake',
      aliases: PICKET_ALIASES,
      classification: 'Colony picket cutter',
      faction: 'independent',
      position: picketPos,
      heading: Math.round(headingOf(sub(linerPos, picketPos))),
      perf: { maxSpeed: 260, accel: 8, turnRate: 4 },
      hull: 80,
      systems: systems(),
      shields: { raised: true, strength: 80 },
      weapons: { state: 'armed', target: null },
      souls: 46,
      containment: 100,
      disposition: 'unknown',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home without starting a war.', ['protect the crew', 'avoid escalation']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the ship safe', 'deter aggression']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['identify the sickness']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself in his first real crisis.', ['execute manoeuvres precisely']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep channels open']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['protect ship systems']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['treat the sick', 'keep the Halcyon clean']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    sabeth: char('sabeth', 'Capt. Juno Sabeth', 'Master of the Mercy of Ilun', 'kestrel', {
      motivation: 'Get her sick pilgrims to a hospital before any more of them die.',
      goals: ['reach a hospital', 'keep her passengers alive'],
      knowledge: ['first_cases'],
      resources: ['pilgrim liner', 'passenger manifest'],
      trust: 25,
      memory: { hailed: 0, runAt: runTurn, running: 0, eased: 0, told: 0 },
    }),
    marr: char('marr', 'Warden-Commander Isolde Marr', 'Commander, colony picket Thornwake', 'cruiser', {
      motivation: {
        strict: 'Hold the quarantine line exactly as the colony council ordered. Orders are what stop the next outbreak.',
        fearful: 'Never again watch an epidemic burn through Tallis Gate, whatever it costs.',
        humane: 'Protect the colony without becoming the person who fired on a ship full of pilgrims.',
      }[warden],
      goals: ['protect Tallis Gate from contagion', 'enforce the quarantine line'],
      knowledge: ['colony_history', 'colony_stock', ...(kin ? ['marr_kin'] : [])],
      resources: ['picket cutter', 'colony antiviral stockpile'],
      trust: 10,
      memory: { hailed: 0, talks: 0, lifted: 0, warned: 0, holdFire: 0, firing: 0, persuaded: 0, sentDoses: 0 },
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('liner_status', `Mercy of Ilun: ${souls} pilgrims and crew aboard, ${sickStart} of them sick and getting worse. Her medical bay is overwhelmed.`),
      f('picket_identity', "The Thornwake is Tallis Gate's colony picket under Warden-Commander Isolde Marr. Her orders are to fire on any ship that crosses the quarantine line."),
      f('symptoms', 'Symptoms aboard the liner: high fever, tremors and collapse. Long-range readings cannot tell a virus from a poison.'),
      f('cause_known', CAUSE_TEXT[cause]),
      f('first_cases', CLUE_TEXT[cause]),
      f('colony_history', 'Eleven years ago an imported fever killed forty people at Tallis Gate. The colony council has closed the gate to sick ships ever since.'),
      f('colony_stock', 'Tallis Gate still keeps an antiviral stockpile from the old outbreak. It works against Ilun-family fevers.'),
      f('marr_kin', "Warden-Commander Marr's brother, Teodric Marr, is among the pilgrims aboard the Mercy of Ilun."),
      f('warden_temperament', `Warden-Commander Marr reads as ${warden === 'strict' ? 'a by-the-book officer who will want proof, not sympathy' : warden === 'fearful' ? 'frightened: she lived through the last outbreak and will not risk another' : 'torn: she does not want to fire, but she will if she must'}.`),
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
    relations: { tension: 15, trustConcordDirectorate: 30 },
    // The Kestrel Incident's variant fields are kept (neutral values) so the shared engine and saves stay uniform.
    variant: { passenger: 'defector', temperament: 'cautious', reactorTurns: 99, complication: 'none', reinforcementTurn: 99, extra: { cause, warden, kin, runTurn, sickStart } },
    objectives: [],
    log: [],
    nextLogId: 1,
    pending: [],
    flags: {},
    counters: { torpedoes: 6, kestrelCrewStart: souls, sick: sickStart, kestrelDead: 0, rescued: 0, trapped: 0, cargo: 0 },
    orders: { jumpCharging: false, list: [], nextId: 1 },
    posture: { stance: 'neutral', since: 0 },
    standing: [],
    restrictions: [],
    familiarity: { drilled: {} },
    landmarks: { border: { x: 0, y: -120000 }, colony: { x: picketPos.x, y: picketPos.y + 2000 } },
    slots: SLOTS,
    clarification: null,
    lastTarget: null,
    fx: [],
    outcome: null,
  };
}
