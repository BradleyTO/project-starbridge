/**
 * Training Simulation 005: The Saltglass Accord — seeded initial world state.
 * Everything here is original fiction.
 *
 * Pure mediation. The Halcyon holds orbit over Saltglass, an ice moon of the gas giant Hesk, and
 * hosts talks in her wardroom between two independent clans who both claim the whole moon. Their
 * stated demands (sole title, the other clan off the ice) cannot both be met. What each clan
 * actually needs is something narrower, and neither will say it first at the table.
 * Slots (v0.6 shared engine ids): 'kestrel' = Clan Rhune's ice hauler Long Thaw, whose delegate
 * Speaker Edda Rhune sits at the Halcyon's table (contact A); 'cruiser' = Clan Tarvo's transport
 * Cold Hearth, whose delegate Holder Caius Tarvo sits across from her (contact B). Both ships are
 * unarmed civilian craft holding orbit beside the Halcyon. There is no spy, no saboteur, no
 * hidden passenger and no weapon in this story.
 */
import type { Character, ContactSlots, Fact, Ship, ShipId, ShipSystem, SystemId, WorldState } from '../../engine/types';
import { SYSTEM_IDS } from '../../engine/types';
import { createRng, normaliseSeed } from '../../engine/rng';
import { deriveStatus } from '../../engine/rules';

export const SCENARIO_ID = 'saltglass-accord';
export const SCENARIO_TITLE = 'Training Simulation 005: The Saltglass Accord';
export const SCENARIO_VERSION = '1.0.0';

export type Clan = 'rhune' | 'tarvo';
export type Interest = 'water' | 'burial' | 'succession';
export type ElderHealth = 'failing' | 'frail' | 'stable';

export const CLANS: readonly Clan[] = ['rhune', 'tarvo'];
/** Party (channel) and ship slot for each clan's delegation. */
export const PARTY: Record<Clan, 'kestrel' | 'cruiser'> = { rhune: 'kestrel', tarvo: 'cruiser' };
export const DELEGATE: Record<Clan, string> = { rhune: 'edda', tarvo: 'caius' };
export const other = (c: Clan): Clan => (c === 'rhune' ? 'tarvo' : 'rhune');
export const clanOfParty = (p: string): Clan => (p === 'cruiser' ? 'tarvo' : 'rhune');

export const CLAN_NAME: Record<Clan, string> = { rhune: 'Clan Rhune', tarvo: 'Clan Tarvo' };
export const DELEGATE_NAME: Record<Clan, string> = { rhune: 'Speaker Edda Rhune', tarvo: 'Holder Caius Tarvo' };
export const DELEGATE_SHORT: Record<Clan, string> = { rhune: 'Speaker Rhune', tarvo: 'Holder Tarvo' };
export const SHIP_NAME: Record<Clan, string> = { rhune: 'Long Thaw', tarvo: 'Cold Hearth' };
export const ELDER_NAME: Record<Clan, string> = { rhune: 'Elder Maud Rhune', tarvo: 'Elder Oskar Tarvo' };
export const ELDER_PRONOUN: Record<Clan, { sub: string; obj: string; pos: string }> = {
  rhune: { sub: 'she', obj: 'her', pos: 'her' },
  tarvo: { sub: 'he', obj: 'him', pos: 'his' },
};

export interface SaltglassVariant {
  /** What each clan actually needs (hidden; neither says it first at the table). */
  interest: Record<Clan, Interest>;
  /** Which delegate is the hardliner (slower to trust, shorter patience, and with a clock of their own). */
  hard: Clan;
  /** The dying elder's clan (the clan whose need is the succession), or null. */
  elderClan: Clan | null;
  /** The elder's health, and the minute the elder dies without care (99: not within the talks). */
  elder: ElderHealth;
  elderTurn: number;
  /** The minute the hardliner's clan sends its hauler down to plant a claim on the ice, unless a standstill holds. */
  landTurn: number;
  /** Starting patience for the hardliner and the moderate. */
  patienceHard: number;
  patienceSoft: number;
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
  kestrelLead: 'edda',
  cruiserLead: 'caius',
  passenger: null,
  kestrelRepair: 'reactor',
  kestrelRepairWords: [],
};

export const RHUNE_ALIASES = ['long thaw', 'the long thaw', 'rhune', 'the rhune', 'rune', 'roon', 'clan rhune', 'rhune delegation', 'the rhune delegation', 'rhunes', 'the rhunes', 'speaker', 'speaker rhune', 'edda', 'edda rhune', 'speaker edda rhune'];
export const TARVO_ALIASES = ['cold hearth', 'the cold hearth', 'tarvo', 'the tarvo', 'tarvos', 'the tarvos', 'clan tarvo', 'tarvo delegation', 'the tarvo delegation', 'holder', 'holder tarvo', 'caius', 'caius tarvo', 'holder caius tarvo'];

/** The scenario's seeded choices (stored in variant.extra). */
export function saltglass(s: WorldState): SaltglassVariant {
  const e = s.variant.extra ?? {};
  const ec = e.elderClan === 'rhune' || e.elderClan === 'tarvo' ? (e.elderClan as Clan) : null;
  return {
    interest: { rhune: (e.interestRhune as Interest) ?? 'water', tarvo: (e.interestTarvo as Interest) ?? 'burial' },
    hard: e.hard === 'rhune' ? 'rhune' : 'tarvo',
    elderClan: ec,
    elder: (e.elder as ElderHealth) ?? 'stable',
    elderTurn: Number(e.elderTurn ?? 99),
    landTurn: Number(e.landTurn ?? 14),
    patienceHard: Number(e.patienceHard ?? 4),
    patienceSoft: Number(e.patienceSoft ?? 6),
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

/** What each need is, in the words of the clan that has it. */
export function interestText(c: Clan, i: Interest): string {
  const clan = CLAN_NAME[c];
  const p = ELDER_PRONOUN[c];
  switch (i) {
    case 'water':
      return `${clan} needs water, not the moon. The ice on their home habitat is nearly cut out; within a few years they will have nothing to drink unless they can keep cutting at the Brine Springs on Saltglass's southern flats. They need the right to cut there, and a fair share of the harvest.`;
    case 'burial':
      return `${clan}'s dead lie in the Barrow Ice on Saltglass's northern ridge: four generations of them. Cutting there would be desecration. They need that ridge left untouched for ever, and the right to go on burying their dead in it.`;
    case 'succession':
      return `${clan} names a new head only at the Founders' Seat on Saltglass, while the old head still lives to pass the name on. ${ELDER_NAME[c]} is dying aboard the ${SHIP_NAME[c]}. If no naming is held at the Seat before ${p.sub} dies, the clan has no lawful head. They need the right to hold the naming at the Seat, soon, and the other clan to recognise it.`;
  }
}

export const INTEREST_SHORT: Record<Interest, string> = { water: 'water rights at the Brine Springs', burial: 'their dead in the Barrow Ice', succession: "a naming at the Founders' Seat before their elder dies" };

export function createScenario(seedInput: number | string = 1): WorldState {
  const seed = normaliseSeed(seedInput);
  const rng = createRng(seed);
  const pairs: [Interest, Interest][] = [
    ['water', 'burial'],
    ['burial', 'water'],
    ['water', 'succession'],
    ['succession', 'water'],
    ['burial', 'succession'],
    ['succession', 'burial'],
  ];
  const [interestRhune, interestTarvo] = rng.pick(pairs);
  const hard = rng.pick(['rhune', 'tarvo'] as const);
  const elderClan: Clan | null = interestRhune === 'succession' ? 'rhune' : interestTarvo === 'succession' ? 'tarvo' : null;
  const elder: ElderHealth = elderClan ? rng.pick(['failing', 'frail', 'frail', 'stable'] as const) : 'stable';
  const elderTurn = elder === 'failing' ? rng.int(16, 20) : elder === 'frail' ? rng.int(23, 27) : 99;
  const landTurn = rng.int(10, 16);
  const patienceHard = rng.int(3, 4);
  const patienceSoft = rng.int(5, 6);
  const rhunePos = { x: rng.int(3, 6) * 1000, y: rng.int(1, 3) * 1000 };
  const tarvoPos = { x: -rng.int(3, 6) * 1000, y: rng.int(1, 3) * 1000 };

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
      name: SHIP_NAME.rhune,
      aliases: RHUNE_ALIASES,
      classification: 'Clan ice hauler',
      faction: 'independent',
      position: rhunePos,
      heading: 90,
      perf: { maxSpeed: 90, accel: 3, turnRate: 3 },
      hull: 100,
      systems: systems({ weapons: sys(0, 0), jumpDrive: sys(0, 0) }),
      shields: { raised: false, strength: 30 },
      souls: elderClan === 'rhune' ? 19 : 18,
      containment: 100,
      detected: false,
      scanLevel: 1,
      disposition: 'neutral',
    }),
    cruiser: ship('cruiser', {
      name: SHIP_NAME.tarvo,
      aliases: TARVO_ALIASES,
      classification: 'Clan transport',
      faction: 'independent',
      position: tarvoPos,
      heading: 270,
      perf: { maxSpeed: 90, accel: 3, turnRate: 3 },
      hull: 100,
      systems: systems({ weapons: sys(0, 0), jumpDrive: sys(0, 0) }),
      shields: { raised: false, strength: 30 },
      souls: elderClan === 'tarvo' ? 24 : 23,
      containment: 100,
      detected: false,
      scanLevel: 1,
      disposition: 'neutral',
    }),
  };

  const officer = (id: string, name: string, role: string, motivation: string, goals: string[]) => char(id, name, role, 'halcyon', { motivation, goals, trust: 70, resources: [role] });
  const delegate = (c: Clan): Character => {
    const isHard = c === hard;
    const need = c === 'rhune' ? interestRhune : interestTarvo;
    return char(DELEGATE[c], DELEGATE_NAME[c], `Delegate of ${CLAN_NAME[c]}, aboard the Halcyon`, PARTY[c], {
      motivation: isHard ? `Win Saltglass outright for ${CLAN_NAME[c]}, and never be seen to bend.` : `Bring home what ${CLAN_NAME[c]} cannot live without, without a war.`,
      goals: [`secure ${INTEREST_SHORT[need]}`, isHard ? 'concede nothing at the table' : 'keep the talks going', 'never be the first to say what the clan really needs'],
      knowledge: [`interest_${c}`],
      resources: [`the ${SHIP_NAME[c]}`, `the ${CLAN_NAME[c]} claim`],
      trust: isHard ? 30 : 45,
      memory: { hard: isHard ? 1 : 0, patience: isHard ? patienceHard : patienceSoft, confided: 0, leave: 0, tabled: 0, standstill: 0, walking: 0, asked: 0, acked: 0, hinted: 0, pressed: 0, marrow: 0 },
    });
  };
  const characters: Record<string, Character> = {
    marrow: officer('marrow', 'Cmdr. Ilse Marrow', 'First Officer', 'Bring everyone home.', ['hear what the delegates will not say at the table']),
    rask: officer('rask', 'Lt. Cmdr. Teodor Rask', 'Tactical', 'Never let the ship be caught unprepared.', ['keep the ship safe']),
    varga: officer('varga', 'Lt. Oona Varga', 'Sensors & Science', 'Find out what is really going on.', ['map the moon']),
    adeyemi: officer('adeyemi', 'Ens. Kofi Adeyemi', 'Helm', 'Prove himself.', ['hold orbit']),
    szabo: officer('szabo', 'Lt. Mirela Szabo', 'Communications', 'Words before weapons.', ['read the room']),
    okafor: officer('okafor', 'Chief Dana Okafor', 'Engineering', 'Keep the Halcyon in one piece.', ['keep the ship running']),
    osei: officer('osei', 'Dr. Ama Osei', 'Medical', 'Every life counts the same.', ['keep everyone aboard well']),
    relief_xo: officer('relief_xo', 'Lt. Cmdr. Bram Holt', 'First Officer (acting)', 'Hold the line.', []),
    relief_tactical: officer('relief_tactical', 'Ens. Sera Pell', 'Tactical (relief)', 'Do the job.', []),
    relief_sensors: officer('relief_sensors', 'Ens. Juno Hale', 'Sensors (relief)', 'Do the job.', []),
    relief_helm: officer('relief_helm', 'Lt. Rafe Duarte', 'Helm (relief)', 'Do the job.', []),
    relief_comms: officer('relief_comms', 'Ens. Nadia Kerr', 'Communications (relief)', 'Do the job.', []),
    relief_engineering: officer('relief_engineering', 'Petty Officer Lin Cho', 'Engineering (relief)', 'Do the job.', []),
    relief_medical: officer('relief_medical', 'Nurse Tomas Ruiz', 'Medical (relief)', 'Do the job.', []),
    edda: delegate('rhune'),
    caius: delegate('tarvo'),
  };
  if (elderClan) {
    characters.elder = char('elder', ELDER_NAME[elderClan], `Head of ${CLAN_NAME[elderClan]}, gravely ill`, PARTY[elderClan], {
      motivation: 'Pass the name on before the end.',
      goals: ['see an heir named at the Founders\u2019 Seat'],
      knowledge: ['elder_ill'],
      resources: [],
      trust: 50,
      memory: { treated: 0 },
    });
  }

  const f = (id: string, text: string): Fact => ({ id, text, known: false, discoveredTurn: null });
  const facts: Record<string, Fact> = Object.fromEntries(
    [
      f('interest_rhune', interestText('rhune', interestRhune)),
      f('interest_tarvo', interestText('tarvo', interestTarvo)),
      f('hardliner', `${DELEGATE_NAME[hard]} is the hardliner at the table: slow to trust, quick to take offence, and under pressure from home to come back with the whole moon.`),
      f('survey', "Lieutenant Varga's survey of Saltglass: the Brine Springs lie on the southern flats, the Barrow Ice on the northern ridge, the Founders' Seat on a rock outcrop between them. Nothing that matters to one clan sits on top of anything that matters to the other."),
      f('elder_ill', elderClan ? `${ELDER_NAME[elderClan]} is aboard the ${SHIP_NAME[elderClan]}, gravely ill: ${elder === 'failing' ? 'failing fast' : elder === 'frail' ? 'frail and weakening' : 'weak, but stable for now'}.` : 'Nobody aboard either clan ship is ill.'),
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
    variant: { passenger: 'defector', temperament: 'cautious', reactorTurns: 99, complication: 'none', reinforcementTurn: 99, extra: { interestRhune, interestTarvo, hard, elderClan: elderClan ?? 'none', elder, elderTurn, landTurn, patienceHard, patienceSoft } },
    objectives: [],
    log: [],
    nextLogId: 1,
    pending: [],
    flags: {},
    counters: { torpedoes: 6, kestrelCrewStart: elderClan === 'rhune' ? 19 : 18, kestrelDead: 0, rescued: 0, landing: 0, marrowJob: 0, marrowLeft: 0, iceTrip: 0, ownTalks: 0, elderBonus: 0 },
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
