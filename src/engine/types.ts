/**
 * Core world-state types for Project Starbridge.
 *
 * The WorldState is the single authoritative record of the simulation.
 * Only deterministic engine/scenario code may produce a new WorldState.
 * AI output (Milestone 3+) will be limited to *proposals* and narrative text
 * that the engine validates before applying.
 */

export type AlertLevel = 'green' | 'yellow' | 'red';
export type ObjectiveStatus = 'active' | 'complete' | 'failed';
export type Disposition = 'unknown' | 'neutral' | 'distressed' | 'hostile' | 'friendly';
export type LogChannel = 'narrative' | 'comms' | 'system' | 'captain' | 'crew';

export interface ShipSystems {
  name: string;
  registry: string;
  hull: number; // 0-100
  shields: number; // 0-100 (capacity)
  shieldsRaised: boolean;
  reactor: number; // 0-100 output
  impulse: number; // 0-100 availability
  jumpDrive: 'standby' | 'charging' | 'ready' | 'offline';
  weapons: 'safe' | 'armed' | 'locked';
  sensors: number; // 0-100
  tractor: 'idle' | 'engaged';
}

export interface Contact {
  id: string;
  name: string;
  classification: string;
  faction: string;
  /** Range from the player ship, km */
  range: number;
  /** Relative bearing, degrees (0 = dead ahead, positive = starboard) */
  bearing: number;
  disposition: Disposition;
  visible: boolean;
  scanned: boolean;
  /** Facts revealed to the player (hidden facts live in scenario code until discovered) */
  details: string[];
}

export interface Objective {
  id: string;
  text: string;
  status: ObjectiveStatus;
}

export interface LogEntry {
  id: number;
  /** Mission clock, seconds */
  time: number;
  channel: LogChannel;
  speaker: string;
  text: string;
}

export interface Outcome {
  id: string;
  title: string;
  summary: string;
}

export interface WorldState {
  version: 1;
  scenarioId: string;
  mode: 'scripted-demo';
  time: number;
  turn: number;
  /** Index of the next opening beat to play */
  beat: number;
  alert: AlertLevel;
  ship: ShipSystems;
  contacts: Contact[];
  objectives: Objective[];
  log: LogEntry[];
  nextLogId: number;
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  outcome: Outcome | null;
}
