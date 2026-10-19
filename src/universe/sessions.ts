/**
 * Bridge sessions: one WorldState being played, stamped with its timeline.
 *
 * A SimulationSession always starts from a deep copy of initial conditions, so
 * nothing it does can reach the canonical record it was copied from. Only a
 * CanonicalSession can be committed (see canon.ts / repository.ts).
 */
import type { ScenarioModule } from '../engine/scenario';
import type { WorldState } from '../engine/types';
import { clone, type DeepReadonly } from './freeze';
import type { MissionSnapshot } from './types';

interface SessionBase {
  scenarioId: string;
  state: WorldState;
  /** Archive entry this run belongs to (training mission id or canonical mission id). */
  archiveId: string | null;
}
export interface SimulationSession extends SessionBase {
  readonly timeline: 'simulation';
  conditions: 'training' | 'original' | 'variation';
  runId: string;
}
export interface CanonicalSession extends SessionBase {
  readonly timeline: 'canonical';
  missionId: string;
}
export type BridgeSession = SimulationSession | CanonicalSession;

export function stamp(state: WorldState, timeline: WorldState['provenance']['timeline'], ids: { missionId: string | null; archiveId: string | null }): WorldState {
  return { ...state, provenance: { ...state.provenance, timeline, missionId: ids.missionId, archiveId: ids.archiveId } };
}

/** A fresh training simulation of a built-in scenario. */
export function startTraining(scenario: ScenarioModule, seed: number | string, runId: string, archiveId: string, drilled: Record<string, number> = {}): SimulationSession {
  const state = withFamiliarity(stamp(scenario.create(seed), 'simulation', { missionId: null, archiveId }), drilled);
  return { timeline: 'simulation', scenarioId: scenario.id, state, archiveId, conditions: 'training', runId };
}

/** Replay a canonical mission's ORIGINAL initial conditions as a simulation (deep copy). */
export function replaySnapshot(snapshot: DeepReadonly<MissionSnapshot>, runId: string, drilled: Record<string, number> = {}): SimulationSession {
  if (!snapshot.initial) throw new Error('This mission has no bridge snapshot to replay.');
  const copy = clone(snapshot.initial) as WorldState;
  const state = withFamiliarity(stamp(copy, 'simulation', { missionId: null, archiveId: snapshot.missionId }), drilled);
  return { timeline: 'simulation', scenarioId: snapshot.scenarioId, state, archiveId: snapshot.missionId, conditions: 'original', runId };
}

/** A new randomised variation of an archived mission (same scenario, new seed). */
export function replayVariation(scenario: ScenarioModule, archiveId: string, seed: number, runId: string, drilled: Record<string, number> = {}): SimulationSession {
  const state = withFamiliarity(stamp(scenario.create(seed), 'simulation', { missionId: null, archiveId }), drilled);
  return { timeline: 'simulation', scenarioId: scenario.id, state, archiveId, conditions: 'variation', runId };
}

export function withFamiliarity(state: WorldState, drilled: Record<string, number>): WorldState {
  return { ...state, familiarity: { drilled: { ...drilled } } };
}
