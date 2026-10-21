/**
 * v0.7.1: where the Halcyon is, as far as the rules are concerned. Everything context-dependent
 * (interpreter vocabulary, comms parties, contacts, dialogue, objectives) derives from this, so a
 * scenario's ships, names and characters exist only while that scenario is running.
 *
 *   station     — the idle bridge (training status or Active Duty, between missions)
 *   simulation  — a training simulation is running (scenarioId says which)
 *   mission     — a canonical Active Duty mission is running
 */
import type { WorldState } from './types';

export type SettingKind = 'station' | 'simulation' | 'mission';
export interface Setting {
  kind: SettingKind;
  scenarioId: string;
  /** Active Duty is live (the canonical universe is running). */
  duty: boolean;
}

export const STATION_ID = 'bridge';

export function settingOf(s: WorldState): Setting {
  if (s.scenarioId === STATION_ID) return { kind: 'station', scenarioId: STATION_ID, duty: !!s.duty?.live };
  return { kind: s.provenance?.timeline === 'canonical' ? 'mission' : 'simulation', scenarioId: s.scenarioId, duty: s.provenance?.timeline === 'canonical' };
}
