import type { BaseAction, DemandKind, DialogueIntent, Party, PromiseKind, RestrictSubject, Trigger } from './schema';

/**
 * Authoritative world-state types for Project Starbridge (schema version 4).
 *
 * Only deterministic engine code produces a new WorldState. Interpreters
 * (offline parser today, AI in Milestone 3) may only emit ProposedActions
 * (see schema.ts), which the validator checks before the reducer applies them.
 */

export type AlertLevel = 'green' | 'yellow' | 'red';
export type ShipId = 'halcyon' | 'kestrel' | 'cruiser';
export const SHIP_IDS: ShipId[] = ['halcyon', 'kestrel', 'cruiser'];

export type SystemId = 'reactor' | 'engines' | 'shields' | 'weapons' | 'sensors' | 'tractor' | 'transporter' | 'jumpDrive' | 'comms' | 'lifeSupport';
export const SYSTEM_IDS: SystemId[] = ['reactor', 'engines', 'shields', 'weapons', 'sensors', 'tractor', 'transporter', 'jumpDrive', 'comms', 'lifeSupport'];

export type SystemStatus = 'online' | 'damaged' | 'offline' | 'destroyed';

export interface ShipSystem {
  /** Integrity, 0–100. 0 = destroyed. */
  health: number;
  /** Power allocation as % of nominal, 0–150. */
  power: number;
  status: SystemStatus;
}

export type Disposition = 'unknown' | 'neutral' | 'distressed' | 'hostile' | 'friendly' | 'evacuated' | 'destroyed';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ship {
  id: ShipId;
  name: string;
  classification: string;
  faction: FactionId;
  position: Vec2;
  hull: number; // 0–100
  destroyed: boolean;
  systems: Record<SystemId, ShipSystem>;
  shields: { raised: boolean; strength: number };
  weapons: { state: 'safe' | 'armed' | 'locked'; target: ShipId | null };
  tractor: { target: ShipId | null };
  jump: { charge: number }; // 0–100; 100 = ready
  /** Living souls aboard (crew + rescued). */
  souls: number;
  /** Reactor containment (meaningful for the Kestrel), 0–100. */
  containment: number;
  /** Whether the player's sensors currently show this ship. */
  detected: boolean;
  /** Player sensor knowledge depth: 0 none, 1 basic, 2 detailed. */
  scanLevel: number;
  /** How the player's ship classifies this contact. */
  disposition: Disposition;
  /** Kinematics (km, km/s, degrees; heading 0 = +y "north", clockwise). */
  velocity: Vec2;
  heading: number;
  /** Nominal performance at 100% engine efficiency. */
  perf: { maxSpeed: number; accel: number; turnRate: number };
  /** Active guidance behaviour (helm order for the Halcyon, agent decision for NPCs). */
  nav: NavGoal | null;
  /** v0.6: lower-case words the captain may use for this ship ("the liner", "Thornwake", "the warden"). */
  aliases?: string[];
}

export type ManeuverIntent =
  | 'approach'
  | 'standoff'
  | 'interpose'
  | 'intercept'
  | 'follow'
  | 'escort'
  | 'block'
  | 'retreat'
  | 'flee'
  | 'orbit'
  | 'holdStation'
  | 'allStop'
  | 'face'
  | 'evasive';

/** A navigation reference: another ship or a scenario landmark. */
export type NavRef = ShipId | 'border';

export interface NavGoal {
  intent: ManeuverIntent;
  target: NavRef | null;
  /** Second reference (interpose: the other end of the segment). */
  second: NavRef | null;
  rangeKm: number | null;
  /** Fraction of maximum speed to use (0–1). */
  speedFactor: number;
  /** Relative offset to hold (holdStation), km. */
  offset: Vec2 | null;
  /** Tracked order this goal executes (Halcyon helm orders). */
  orderId: number | null;
  /** Has the goal been reached at least once (station-keeping continues)? */
  reached: boolean;
  startedTurn: number;
}

export type Department = 'helm' | 'tactical' | 'ops' | 'science' | 'comms' | 'xo';
export type OrderStatus = 'acknowledged' | 'underway' | 'completed' | 'failed' | 'impossible' | 'superseded' | 'standing' | 'cancelled';
export interface TrackedOrder {
  id: number;
  dept: Department;
  label: string;
  status: OrderStatus;
  issuedTurn: number;
  updatedTurn: number;
  /** Estimated seconds to completion when last reported. */
  etaSeconds: number | null;
  /** Still holding position/formation after completion. */
  maintaining: boolean;
  detail: string;
  /** "No matter what": not completed by arrival and not displaced by automatic fallbacks. */
  persistent?: boolean;
}

/** A conditional or sequenced order: its actions run (validated at that moment) when the trigger is met. */
export interface StandingOrder {
  id: number;
  /** TrackedOrder shown in the orders strip. */
  orderId: number;
  trigger: Trigger;
  actions: BaseAction[];
  issuedTurn: number;
  status: 'armed' | 'fired' | 'cancelled';
  /** For orderDone triggers: the tracked order being waited on. */
  waitsOn: number | null;
}

/** A standing prohibition ("do not power up weapons", "not until then"). */
export interface Restriction {
  id: number;
  orderId: number;
  subject: RestrictSubject;
  until: Trigger | null;
  issuedTurn: number;
}

/** v0.5 two-way communications: one persistent session per mission. */
export type ChannelState = 'open' | 'hold' | 'muted';
export interface CommsChannel {
  party: Party;
  state: ChannelState;
  /** Private (tight-beam) channel: other vessels cannot overhear it. */
  private: boolean;
  openedAt: number;
  /** Who opened it: the Halcyon (a hail) or the other vessel (incoming). */
  incoming: boolean;
}
export interface CommsLine {
  time: number;
  turn: number;
  from: 'captain' | Party;
  intents: DialogueIntent[];
  text: string;
}
/** Something the captain committed to on the record. Checked by the engine every turn. */
export interface CommsPromise {
  id: number;
  party: Party;
  kind: PromiseKind;
  madeTurn: number;
  status: 'active' | 'kept' | 'broken' | 'released';
  /** Turn by which it must be fulfilled (withdraw) or after which it lapses (null = open-ended). */
  untilTurn: number | null;
  /** Snapshot for checks (e.g. the Kestrel's hull when protection was promised). */
  ref: number;
}
/** Something the other party committed to (e.g. "you have ten minutes"). */
export interface NpcCommitment {
  party: Party;
  kind: 'grace' | 'holdFire' | 'releasedLock' | 'ready';
  untilTurn: number | null;
  madeTurn: number;
}
export interface SurveySystem {
  id: string;
  name: string;
  star: string;
  distanceLy: number;
  /** What science has detected so far. */
  signal: 'none' | 'possible' | 'confirmed';
  /** One-line science note (only what has been detected). */
  note: string;
  contacted: boolean;
  investigated: boolean;
}
export interface SurveyState {
  systems: SurveySystem[];
  /** Systems the captain has ordered a course to (Active Duty investigation). */
  course: string | null;
  /** v0.5: canonical survey (Active Duty) rather than the generic training-bridge one. */
  live?: boolean;
}

export interface CommsState {
  channels: CommsChannel[];
  /** The party currently on the open channel (null: nobody). */
  active: Party | null;
  history: CommsLine[];
  topic: string | null;
  /** The captain's declared intentions, in order ("peaceful", "rescue", "stay"…). */
  declared: string[];
  promises: CommsPromise[];
  commitments: NpcCommitment[];
  /** What the other party last asked of the captain (so "Agreed" / "No" has something to answer). */
  pending: { party: Party; kind: DemandKind; turn: number } | null;
  /** Threats and demands the captain made (counts by party). */
  threats: Partial<Record<Party, number>>;
  requests: Partial<Record<Party, number>>;
  /** How often each (party:intent) was used, so replies vary and repetition stops paying. */
  repeats: Record<string, number>;
  /** Suggested replies offered by the other party when they did not follow. */
  suggestions: string[];
  nextId: number;
}

/** Which timeline a WorldState belongs to. The engine never decides this; sessions stamp it. */
export type Timeline = 'simulation' | 'canonical';
export interface Provenance {
  timeline: Timeline;
  /** Canonical mission record or archive entry this run belongs to. */
  missionId: string | null;
  archiveId: string | null;
  scenarioVersion: string;
}

export type Stance = 'neutral' | 'nonHostile' | 'assertive';

/** 'concord' is the internal id of the player's faction, shown as the Agency (v0.5.1); kept so saves load unchanged. */
export type FactionId = 'concord' | 'directorate' | 'independent';

export type CharacterStatus = 'active' | 'injured' | 'dead' | 'stasis';

export interface Character {
  id: string;
  name: string;
  role: string;
  /** Ship the character is currently aboard. */
  ship: ShipId;
  status: CharacterStatus;
  goals: string[];
  motivation: string;
  /** Facts this character knows (ids into WorldState.facts). */
  knowledge: string[];
  resources: string[];
  /** Attitude toward the player, -100..100. */
  trust: number;
  /** Free-form agent memory (numbers only, to keep state serialisable and diffable). */
  memory: Record<string, number>;
}

export interface Fact {
  id: string;
  text: string;
  /** Known to the player? */
  known: boolean;
  discoveredTurn: number | null;
}

export type ObjectiveStatus = 'active' | 'complete' | 'failed' | 'missed';
export interface Objective {
  id: string;
  text: string;
  status: ObjectiveStatus;
}

export type LogChannel = 'narrative' | 'comms' | 'system' | 'captain' | 'crew';
export interface LogEntry {
  id: number;
  time: number;
  turn: number;
  channel: LogChannel;
  speaker: string;
  text: string;
  /** v0.6.1: who is speaking, for the voice cast (a crew character id, 'computer', 'narrator', 'npc:<scenario>:<id>' or 'label:<text>'). */
  voice?: string;
}

export interface PendingEvent {
  id: string;
  kind: string;
  dueTurn: number;
  data: Record<string, string | number | boolean>;
}

export interface Outcome {
  id: string;
  title: string;
  summary: string;
  success: boolean;
}

/** Seeded scenario variation (hidden truth). */
export interface ScenarioVariant {
  passenger: 'defector' | 'prisoner' | 'sibling';
  temperament: 'hardliner' | 'pragmatic' | 'cautious';
  reactorTurns: number;
  complication: 'none' | 'ionStorm' | 'coolantLeak' | 'trappedCrew';
  reinforcementTurn: number;
  /**
   * v0.6: scenario-specific seeded choices for scenarios other than the Kestrel Incident
   * (whose fields above are kept for save compatibility; other scenarios fill them with neutral values).
   */
  extra?: Record<string, string | number | boolean>;
}

/** Short-lived visual effects from the last resolved turn (for the viewscreen). */
export interface VisualFx {
  kind: 'beam' | 'torpedo' | 'explosion' | 'plasma' | 'transport';
  from: ShipId;
  to: ShipId;
}


export interface WorldState {
  version: 4;
  provenance: Provenance;
  scenarioId: string;
  seed: number;
  /** Current RNG state; advancing it is part of every deterministic transition. */
  rng: number;
  time: number;
  turn: number;
  /** Index of the next scripted opening beat (exposition only). */
  intro: number;
  alert: AlertLevel;
  ships: Record<ShipId, Ship>;
  characters: Record<string, Character>;
  facts: Record<string, Fact>;
  relations: { tension: number; trustConcordDirectorate: number };
  variant: ScenarioVariant;
  objectives: Objective[];
  log: LogEntry[];
  nextLogId: number;
  pending: PendingEvent[];
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  /** Standing orders that persist across turns until complete or replaced. */
  orders: {
    jumpCharging: boolean;
    /** Recent and active orders with lifecycle status (newest last). */
    list: TrackedOrder[];
    nextId: number;
  };
  /** Declared posture/intent ("we don't want to appear hostile"); biases helm and is perceivable by NPCs. */
  posture: { stance: Stance; since: number };
  /** Conditional / sequenced standing orders and prohibitions. */
  standing: StandingOrder[];
  restrictions: Restriction[];
  /**
   * Read-only crew familiarity injected at session start (simulator drills per manoeuvre).
   * It colours crew lines only; it is never a record of real events.
   */
  familiarity: { drilled: Record<string, number> };
  /** Scenario landmarks (e.g. the Agency border), km. */
  landmarks: Record<string, Vec2>;
  /** Pending clarifying question from the interpreter, if any. */
  clarification: { question: string; options: string[]; clause: string } | null;
  /** Last target the captain referred to (pronoun resolution). */
  lastTarget: ShipId | null;
  fx: VisualFx[];
  outcome: Outcome | null;
  /** v0.5 comms session (absent in older saves = no channels). */
  comms?: CommsState;
  /** v0.5 crew autonomy: recent refusals with the reasons the officer gave (for "why?"). */
  refusals?: { officer: string; turn: number; order: string; reasons: string[] }[];
  /** v0.5: the science officer's survey of systems within exploration range (idle bridge). */
  survey?: SurveyState;
  /** v0.5: a bridge command asked the app to do something (open the archive, begin / end a simulation). */
  uiRequest?: { kind: UiRequestKind; id?: string; hours?: number; response?: string; seq: number } | null;
  /** v0.5: the Active Duty bridge (live survey, the call waiting for an answer, first contact under way). */
  duty?: DutyBridge;
  /** v0.6: who and what fills the generic contact slots (absent = the Kestrel Incident's cast; see slotsOf). */
  slots?: ContactSlots;
}

/**
 * v0.6 multi-scenario support. The engine has three ship slots with historical ids: 'halcyon'
 * (the player), 'kestrel' (contact A, usually the vessel in trouble) and 'cruiser' (contact B,
 * usually the other power). A scenario names its own cast for them here; ids stay as they are
 * so saves and the action schema are unchanged.
 */
export interface ContactSlots {
  /** Character who answers hails to contact A / contact B. */
  kestrelLead: string;
  cruiserLead: string;
  /** Character id of the passenger slot (someone the crew can bring aboard and talk to in person), or null. */
  passenger: string | null;
  /** The contact-A system an engineering team can fix ("stabilise their reactor"), and words that name it. */
  kestrelRepair: SystemId;
  kestrelRepairWords: string[];
}

export type UiRequestKind = 'openArchive' | 'beginSim' | 'endSim' | 'acceptCommission' | 'patrol' | 'respond' | 'course' | 'firstContact';

/** A hail, distress call or request that reached the bridge and is waiting for the captain's answer. */
export interface IncomingCall {
  offerId: string;
  channel: 'hail' | 'distress' | 'request';
  classification: 'voluntary' | 'distress' | 'directive';
  from: string;
  title: string;
  briefing: string;
}

/** First contact in progress at an investigated system (the civilization occupies the bridge's contact slot). */
export interface FirstContactState {
  systemId: string;
  system: string;
  people: string;
  leader: string;
  station: string;
  disposition: 'open' | 'cautious' | 'isolationist' | 'guarded';
  stage: 'arrived' | 'talking' | 'concluded';
  asks: number;
  approach: 'peaceful' | 'firm' | 'hostile' | null;
  outcome: string | null;
}

export interface DutyBridge {
  /** On active duty: the survey and traffic are canonical. False on the Simulation Mode / reserve bridge. */
  live: boolean;
  location: string;
  incoming: IncomingCall | null;
  contact: FirstContactState | null;
}
