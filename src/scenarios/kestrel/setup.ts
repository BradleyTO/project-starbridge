/**
 * Training Simulation 001: The Kestrel Incident — seeded initial world state.
 * Everything here is original fiction.
 */
import type { Character, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { headingOf, headingVec, sub } from '../../engine/kinematics';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'kestrel-incident';
export const SCENARIO_TITLE = 'Training Simulation 001: The Kestrel Incident';

/** Bridge roles → character ids, with relief officers if the primary is lost. */
export const ROLE_HOLDERS = {
  xo: ['marrow', 'relief_xo'],
  tactical: ['rask', 'relief_tactical'],
  sensors: ['varga', 'relief_sensors'],
  helm: ['adeyemi', 'relief_helm'],
  comms: ['szabo', 'relief_comms'],
  engineering: ['okafor', 'relief_engineering'],
  medical: ['osei', 'relief_medical'],
} as const;

export const PASSENGER_PROFILES = {
  defector: { name: 'Dr. Lysa Venn', desc: 'a Directorate weapons scientist defecting with knowledge of their warship programme', leverageFact: 'cruiser_weakness' },
  prisoner: { name: 'Teo Maras', desc: 'a dissident journalist who escaped illegal detention in a Directorate labour colony', leverageFact: 'detention_evidence' },
  sibling: { name: 'Ivet Vane', desc: "Prefect Vane's own younger sibling, fleeing an arranged political marriage", leverageFact: 'prefect_sibling' },
} as const;

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
  return {
    id,
    destroyed: false,
    shields: { raised: false, strength: 100 },
    weapons: { state: 'safe', target: null },
    tractor: { target: null },
    jump: { charge: 0 },
    detected: false,
    scanLevel: 0,
    velocity: { x: 0, y: 0 },
    heading: 0,
    nav: null,
    ...p,
  };
}

function char(id: string, name: string, role: string, shipId: ShipId, extra: Partial<Character> = {}): Character {
  return { id, name, role, ship: shipId, status: 'active', goals: [], motivation: '', knowledge: [], resources: [], trust: 50, memory: {}, ...extra };
}

export function createScenario(seedInput: number | string = 1): WorldState {
  const seed = normaliseSeed(seedInput);
  const rng = createRng(seed);

  const variant = {
    passenger: rng.pick(['defector', 'prisoner', 'sibling'] as const),
    temperament: rng.pick(['hardliner', 'pragmatic', 'cautious'] as const),
    reactorTurns: rng.int(7, 11),
    complication: rng.pick(['none', 'ionStorm', 'coolantLeak', 'trappedCrew'] as const),
    reinforcementTurn: rng.int(13, 16),
  };
  const kestrelCrew = rng.int(18, 27);
  const cruiserAngle = (rng.int(34, 48) * Math.PI) / 180;
  const cruiserDist = rng.int(204, 216) * 1000;
  const pp = PASSENGER_PROFILES[variant.passenger];
  const patience = { hardliner: 3, pragmatic: 5, cautious: 6 }[variant.temperament];

  const cruiserPos = { x: Math.round(Math.sin(cruiserAngle) * cruiserDist), y: Math.round(Math.cos(cruiserAngle) * cruiserDist) };
  const kestrelPos = { x: -5300, y: 37600 };
  const cruiserHeading = headingOf(sub(kestrelPos, cruiserPos));
  const cv = headingVec(cruiserHeading);
  const ships: Record<ShipId, Ship> = {
    halcyon: ship('halcyon', {
      name: 'CSV Halcyon',
      classification: 'Survey cruiser',
      faction: 'concord',
      position: { x: 0, y: 0 },
      heading: Math.round(headingOf(kestrelPos)),
      perf: { maxSpeed: 235, accel: 12, turnRate: 6 },
      hull: 100,
      systems: systems(variant.complication === 'ionStorm' ? { sensors: sys(70) } : {}),
      souls: 212,
      containment: 100,
      detected: true,
      scanLevel: 2,
      disposition: 'friendly',
    }),
    kestrel: ship('kestrel', {
      name: 'Kestrel',
      classification: 'Bulk freighter',
      faction: 'independent',
      position: kestrelPos,
      heading: 115,
      perf: { maxSpeed: 120, accel: 4, turnRate: 3 },
      hull: 45,
      systems: systems({ engines: sys(0, 0), shields: sys(0, 0), weapons: sys(0, 0), reactor: sys(30), jumpDrive: sys(0, 0), comms: sys(60), tractor: sys(0, 0), transporter: sys(0, 0) }),
      souls: kestrelCrew,
      containment: 31,
      disposition: 'distressed',
    }),
    cruiser: ship('cruiser', {
      name: 'Ashen Covenant',
      classification: 'Vigil-class heavy cruiser',
      faction: 'directorate',
      position: cruiserPos,
      heading: cruiserHeading,
      velocity: { x: cv.x * 450, y: cv.y * 450 },
      nav: { intent: 'approach', target: 'kestrel', second: null, rangeKm: 8000, speedFactor: 1, offset: null, orderId: null, reached: false, startedTurn: 0 },
      perf: { maxSpeed: 500, accel: 10, turnRate: 3 },
      hull: 100,
      systems: systems(),
      shields: { raised: true, strength: 100 },
      souls: 640,
      containment: 100,
      disposition: 'unknown',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) =>
    char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });

  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home without starting a war.', ['protect the crew', 'avoid escalation']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the ship safe', 'deter aggression']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['understand the anomaly', 'uncover hidden facts']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself in his first real crisis.', ['execute manoeuvres precisely']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['keep channels open']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['protect ship systems', 'save the Kestrel reactor if possible']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['treat the injured']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    arden: char('arden', 'Capt. Hollis Arden', 'Master of the Kestrel', 'kestrel', {
      motivation: 'Get his crew out alive without betraying the person in his hold.',
      goals: ['save my crew', 'protect the passenger'],
      knowledge: ['compartment_exists', 'passenger_identity'],
      resources: ['compartment shield codes', `cargo of medical isotopes`],
      trust: 20,
      memory: { hailed: 0, revealed: 0, urgent: 0 },
    }),
    vane: char('vane', 'Prefect Sorel Vane', 'Commander, Ashen Covenant', 'cruiser', {
      motivation: {
        hardliner: 'Recover the fugitive at any cost; the Directorate must never look weak.',
        pragmatic: 'Recover the fugitive without starting a war he would be blamed for.',
        cautious: 'Recover the fugitive only if it can be done without bloodshed.',
      }[variant.temperament],
      goals: ['recover the passenger', 'enforce the Tessarine claim to the Reach'],
      knowledge: ['passenger_identity'],
      resources: ['heavy cruiser', 'reinforcements en route'],
      trust: 0,
      memory: { patience, demands: 0, hailed: 0, stance: 0, lockedOn: 0, attacking: 0, bluffUntil: -1, agreement: 0 },
    }),
    passenger: char('passenger', pp.name, 'Hidden passenger', 'kestrel', {
      status: 'stasis',
      motivation: 'Reach Concord space alive.',
      goals: ['escape the Directorate', 'reach Concord space'],
      knowledge: [pp.leverageFact],
      resources: ['intelligence'],
      trust: 0,
      memory: { awake: 0, spoke: 0 },
    }),
  };

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const complicationText = {
    none: 'No additional hazards detected.',
    ionStorm: 'An ion storm is degrading sensors and cutting transporter range to 3,000 km.',
    coolantLeak: "The Kestrel's coolant is leaking; her containment will fail faster after the first few minutes.",
    trappedCrew: 'Four Kestrel crew are trapped behind a jammed blast door; a rescue team must free them before transport.',
  }[variant.complication];

  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('kestrel_status', `Kestrel: ${kestrelCrew} crew aboard, reactor containment failing.`),
      f('compartment_exists', 'The Kestrel has a shielded aft compartment that defeats long-range sensors.'),
      f('passenger_identity', `The compartment holds ${pp.name}, ${pp.desc}, in a medical stasis pod.`),
      f('cruiser_identity', 'The warship is the Ashen Covenant, a Tessarine Directorate Vigil-class heavy cruiser.'),
      f('cruiser_intent', 'The Ashen Covenant is hunting the Kestrel to recover someone aboard.'),
      f('prefect_temperament', `Prefect Vane reads as ${variant.temperament === 'hardliner' ? 'a hardliner who will not back down easily' : variant.temperament === 'pragmatic' ? 'a pragmatist open to a deal' : 'cautious and reluctant to fight'}.`),
      f('complication', complicationText),
      f('reinforcements', 'Directorate reinforcements are inbound to the Reach.'),
      f('cruiser_weakness', "The Ashen Covenant's aft shield emitter is misaligned; torpedoes aimed there bypass most of her shielding."),
      f('detention_evidence', 'The passenger carries proof the Directorate is running illegal labour colonies — a treaty violation.'),
      f('prefect_sibling', 'The passenger is Prefect Vane\'s own sibling; a personal appeal may reach him.'),
    ].map((x) => [x.id, x]),
  );

  return {
    version: 3,
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
    relations: { tension: 20, trustConcordDirectorate: 30 },
    variant,
    objectives: [],
    log: [],
    nextLogId: 1,
    pending: [],
    flags: {},
    counters: { torpedoes: 6, kestrelCrewStart: kestrelCrew, trapped: variant.complication === 'trappedCrew' ? 4 : 0, rescued: 0, kestrelDead: 0, cargo: 1 },
    orders: { jumpCharging: false, list: [], nextId: 1 },
    posture: { stance: 'neutral', since: 0 },
    landmarks: { border: { x: 0, y: -120000 } },
    clarification: null,
    lastTarget: null,
    fx: [],
    outcome: null,
  };
}
