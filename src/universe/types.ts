/**
 * Active Duty (formerly Living Universe) / Simulation data model (store schema v1).
 *
 * Two timelines share one simulation engine but never share mutable state:
 *
 *   CANONICAL  — CanonicalState: the persistent galaxy (events, factions,
 *                career, crew experience, mission records). Written ONLY through
 *                the commit gate (gate.ts) by a canonical context.
 *   SIMULATION — SimulationSession: an isolated deep copy of a mission's
 *                starting conditions. Replay, reset and discard freely.
 *
 * Familiarity (learned terminology, preferences, simulator drills) is a third,
 * separate store that both modes may update; it never records events as history.
 *
 * Every record carries an id and provenance so it can later move to accounts,
 * cloud saves, server-side credit enforcement, AI-authored missions, DLC packs
 * or shared galaxy events without reshaping it.
 */
import type { Outcome, WorldState } from '../engine/types';

export const UNIVERSE_SCHEMA_VERSION = 1;

/** Where a record came from (future: 'server', 'ai', 'dlc:<pack>', 'shared:<shard>'). */
export interface Provenance {
  source: 'engine' | 'catalogue' | 'player' | 'migration';
  appVersion: string;
  /** Content pack / catalogue revision that defined the mission or event. */
  contentVersion: string;
}

/** 'concord' is the internal id of the player's faction, shown as the Agency (v0.5.1); kept so saves load unchanged. */
export type FactionId = 'concord' | 'directorate' | 'independent';

/** Canonical galaxy time in minutes since the captain's first canonical day began. */
export type CanonMinutes = number;

// ------------------------------------------------------------------ missions --

export type OfferClass = 'voluntary' | 'distress' | 'directive';

/** How a mission is played: on the bridge (a ScenarioModule) or resolved by an event model. */
export type MissionKind = { kind: 'bridge'; scenarioId: string } | { kind: 'event'; model: string };

/** An assignment on the Active Duty board. Viewing it is always free. */
export interface MissionOffer {
  id: string;
  classification: OfferClass;
  /** Who is asking: a civilian vessel, Fleet Command, a colony administrator… */
  authority: 'civilian' | 'fleet-command' | 'local-government';
  title: string;
  /** Name the mission goes by once begun (archive, banner, career). */
  missionTitle: string;
  briefing: string;
  mission: MissionKind;
  /** Seed for the mission's simulation (bridge seed or event-model seed). */
  seed: number;
  issuedAt: CanonMinutes;
  /** After this the offer lapses (directives: deadline to comply). */
  expiresAt: CanonMinutes | null;
  /** Linked world event (status tracks the emergency/assignment, not the player). */
  eventId: string;
  status: 'open' | 'accepted' | 'declined' | 'ignored' | 'refused' | 'questioned' | 'lapsed';
  /** Free-text-free record of what the captain did (for the event log). */
  responses: { at: CanonMinutes; response: string; detail?: string }[];
  /**
   * How the situation unfolds over canonical time with or without the Halcyon:
   * seeded parameters fixed at issue time, plus which stages have already happened.
   */
  model?: { params: ModelParams; applied: string[] };
  provenance: Provenance;
}

export type ModelParams = Record<string, number | string | boolean>;

/** Initial conditions captured when a canonical mission starts: enough to replay it exactly. */
export interface MissionSnapshot {
  id: string;
  missionId: string;
  scenarioId: string;
  scenarioVersion: string;
  seed: number;
  capturedAt: CanonMinutes;
  /** Full initial WorldState (bridge missions); deep-frozen in memory. */
  initial: WorldState | null;
  /** Event-model initial parameters (event missions). */
  eventParams: ModelParams | null;
}

export interface CanonicalMissionRecord {
  id: string;
  offerId: string;
  title: string;
  classification: OfferClass;
  mission: MissionKind;
  startedAt: CanonMinutes;
  /** Real-world time the credit was spent (for the ledger / support). */
  startedAtIso: string;
  status: 'active' | 'completed';
  snapshot: MissionSnapshot;
  /** Last committed progress of a bridge mission still in play (resume costs nothing). */
  progress: WorldState | null;
  outcome: (Outcome & { turn: number; endedAt: CanonMinutes }) | null;
  /** Concise decisions the captain made (shown in the archive). */
  decisions: string[];
  eventId: string;
  provenance: Provenance;
}

// -------------------------------------------------------------------- events --

export type EventStatus = 'pending' | 'active' | 'resolved' | 'expired';
export type EventClass =
  | 'assignment' // voluntary offer
  | 'distress' // civilian emergency
  | 'directive' // mandatory Fleet directive
  | 'mission' // a mission the captain carried out
  | 'consequence' // something that happened as a result (with or without the player)
  | 'bulletin' // news reaching the Halcyon (evidence of other events)
  | 'disciplinary'
  | 'exploration'; // v0.5: survey discoveries, investigations and first contact
export type Authority = 'civilian' | 'fleet-command' | 'captain' | 'local-government' | 'observed';

export interface WorldEvent {
  id: string;
  missionId: string | null;
  at: CanonMinutes;
  updatedAt: CanonMinutes;
  title: string;
  summary: string;
  ships: string[];
  characters: string[];
  factions: FactionId[];
  classification: EventClass;
  authority: Authority;
  /** What the captain decided, in order. */
  decisions: string[];
  /** What was observed to happen as a result. */
  consequences: string[];
  /** Earlier events this one follows from. */
  links: string[];
  status: EventStatus;
  provenance: Provenance;
}

// -------------------------------------------------------------- crew & career --

/** Canonical experience: ONLY real (canonical) missions write here. */
export interface CrewExperience {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'injured' | 'dead';
  trust: number;
  loyalty: number;
  missions: string[];
  experiences: { missionId: string; eventId: string | null; text: string }[];
  disciplinary: string[];
}

export interface CareerEntry {
  id: string;
  at: CanonMinutes;
  missionId: string | null;
  eventId: string | null;
  text: string;
}

export interface DisciplinaryCase {
  id: string;
  eventId: string;
  directiveOfferId: string;
  openedAt: CanonMinutes;
  trigger: 'refused' | 'disobeyed';
  reason: string;
  /** Rule the review applied, and the evidence it considered. */
  rule: string;
  evidence: string[];
  finding: 'pending' | 'no-action' | 'reprimand';
  resolvedAt: CanonMinutes | null;
}

export interface CanonicalState {
  schema: 'starbridge.canon';
  version: typeof UNIVERSE_SCHEMA_VERSION;
  /** Future: account id. Locally a random profile id. */
  profileId: string;
  /** Optimistic-concurrency revision; every commit increments it. */
  revision: number;
  seed: number;
  clock: CanonMinutes;
  nextSeq: number;
  captain: { name: string; career: CareerEntry[] };
  /** Halcyon condition carried between canonical missions (repairs over canonical time). */
  ship: { hull: number; updatedAt: CanonMinutes };
  factions: Record<FactionId, { standing: number }>;
  /** Directorate–Agency border tension (0–100), shaped by canonical outcomes. */
  tension: number;
  offers: MissionOffer[];
  missions: Record<string, CanonicalMissionRecord>;
  events: WorldEvent[];
  crew: Record<string, CrewExperience>;
  discipline: DisciplinaryCase[];
  /** News that reaches the Halcyon: delivered into the next canonical mission's log as evidence. */
  news: { eventId: string; text: string; deliveredTo: string | null }[];
  /** v0.5: the captain's commission to active duty (absent on pre-v0.5 careers, which count as commissioned). */
  commission?: { at: CanonMinutes; atIso: string; ship: string; by: string };
  /** v0.5: the long-range survey, where the Halcyon is, and what has reached the bridge (created lazily, seeded). */
  exploration?: Exploration;
  provenance: Provenance;
}

// --------------------------------------------------------------- exploration --

/** How a civilization feels about outsiders. Hidden from the captain until contact. Not every one wants the Agency. */
export type { Disposition, ContactOutcome, Approach } from '../engine/firstContact';
import type { ContactOutcome, Disposition } from '../engine/firstContact';

export interface Civilization {
  id: string;
  people: string;
  leader: string;
  station: string;
  stationClass: string;
  souls: number;
  disposition: Disposition;
}


export interface ExploredSystem {
  id: string;
  name: string;
  star: string;
  distanceLy: number;
  /** Bearing from the patrol station (degrees), for travel times between systems. */
  bearing: number;
  signal: 'none' | 'possible' | 'confirmed';
  note: string;
  civ: Civilization | null;
  detectedAt: CanonMinutes | null;
  investigated: boolean;
  contacted: boolean;
  outcome: ContactOutcome | null;
}

export interface Exploration {
  /** 'station' (the Tessarine patrol station) or a system id. */
  location: string;
  systems: ExploredSystem[];
  /** The investigation under way (charged once, like any new canonical start). */
  investigation: { systemId: string; startedAt: CanonMinutes; arrivedAt: CanonMinutes | null } | null;
  /** Offers / discoveries / news already delivered to the bridge (ids). */
  delivered: string[];
  lastDeliveryAt: CanonMinutes | null;
  /** What reached the bridge, in order (hails, distress calls, science readings, bulletins). */
  traffic: { at: CanonMinutes; kind: 'hail' | 'distress' | 'request' | 'science' | 'bulletin' | 'arrival'; ref: string }[];
}

// ----------------------------------------------------------------- simulation --

export interface SimRunRecord {
  id: string;
  /** Archive entry this run replayed. */
  archiveId: string;
  startedAtIso: string;
  seed: number;
  /** 'original' = exact canonical initial conditions; 'variation' = new seed. */
  conditions: 'training' | 'original' | 'variation';
  outcome: (Outcome & { turn: number }) | null;
}

export interface SimulationStoreState {
  schema: 'starbridge.sim';
  version: typeof UNIVERSE_SCHEMA_VERSION;
  runs: SimRunRecord[];
  nextSeq: number;
}

// ---------------------------------------------------------------- familiarity --

/** Shared across modes: how the captain talks and what they have drilled. Never history. */
export interface FamiliarityMemory {
  schema: 'starbridge.familiarity';
  version: typeof UNIVERSE_SCHEMA_VERSION;
  /** Captain-taught phrases: lower-case phrase → order text it expands to. */
  aliases: Record<string, string>;
  /** Terms the captain prefers (counts), e.g. "hail" vs "open a channel". */
  terms: Record<string, number>;
  comms: { onScreen: number; offScreen: number };
  training: {
    simRuns: number;
    /** Manoeuvres ordered in simulations, by intent. */
    drilled: Record<string, number>;
    /** Simulated outcomes by id: performance, not history. */
    outcomes: Record<string, number>;
    simulatedCasualties: number;
  };
}

// ------------------------------------------------------- entitlements & credits --

export interface Entitlements {
  schema: 'starbridge.entitlements';
  version: typeof UNIVERSE_SCHEMA_VERSION;
  simulation: boolean;
  /** v0.5: the Active Duty subscription (formerly "Living Universe"; stored as livingUniverse before v0.5). */
  activeDuty: boolean;
  /** Legacy (v0.4) name for activeDuty. Read for migration, mirrored for compatibility, never authoritative. */
  livingUniverse?: boolean;
  /** 'dev-toggle' locally; future: 'store', 'subscription', 'server'. */
  source: 'default' | 'dev-toggle';
}

export type ResetPolicy = { kind: 'local-midnight'; hour: number } | { kind: 'rolling-24h' };

export interface CreditLedger {
  schema: 'starbridge.credits';
  version: typeof UNIVERSE_SCHEMA_VERSION;
  dailyLimit: number;
  policy: ResetPolicy;
  /** Current period id (date key or rolling window start). */
  periodKey: string;
  periodStartIso: string;
  used: number;
  /** Every canonical mission ever charged (idempotency: never charge twice). */
  charged: { missionId: string; atIso: string }[];
}
