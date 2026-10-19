/**
 * Authoritative world-state types for Project Starbridge (schema version 2).
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
}

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
}

/** Short-lived visual effects from the last resolved turn (for the viewscreen). */
export interface VisualFx {
  kind: 'beam' | 'torpedo' | 'explosion' | 'plasma' | 'transport';
  from: ShipId;
  to: ShipId;
}

export interface HelmOrder {
  mode: 'approach' | 'range' | 'away' | 'interpose';
  target: ShipId | null;
  rangeKm: number | null;
}

export interface WorldState {
  version: 2;
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
    helm: HelmOrder | null;
    jumpCharging: boolean;
  };
  /** Pending clarifying question from the interpreter, if any. */
  clarification: { question: string; options: string[]; clause: string } | null;
  /** Last target the captain referred to (pronoun resolution). */
  lastTarget: ShipId | null;
  fx: VisualFx[];
  outcome: Outcome | null;
}
