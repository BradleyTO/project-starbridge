import type { WorldState } from '../../engine/types';

export const SCENARIO_ID = 'kestrel-incident';
export const SCENARIO_TITLE = 'Training Simulation 001: The Kestrel Incident';

/** Opening state of the Kestrel Incident (all original fiction). */
export function createInitialState(): WorldState {
  return {
    version: 1,
    scenarioId: SCENARIO_ID,
    mode: 'scripted-demo',
    time: 0,
    turn: 0,
    beat: 0,
    alert: 'green',
    ship: {
      name: 'CSV Halcyon',
      registry: 'CES-7140',
      hull: 100,
      shields: 100,
      shieldsRaised: false,
      reactor: 92,
      impulse: 100,
      jumpDrive: 'standby',
      weapons: 'safe',
      sensors: 100,
      tractor: 'idle',
    },
    contacts: [
      {
        id: 'kestrel',
        name: 'Kestrel',
        classification: 'Civilian freighter',
        faction: 'Independent (Arden Logistics)',
        range: 38000,
        bearing: -8,
        disposition: 'distressed',
        visible: false,
        scanned: false,
        details: [],
      },
      {
        id: 'cruiser',
        name: 'Unidentified warship',
        classification: 'Heavy cruiser',
        faction: 'Unknown',
        range: 210000,
        bearing: 41,
        disposition: 'unknown',
        visible: false,
        scanned: false,
        details: [],
      },
    ],
    objectives: [],
    log: [],
    nextLogId: 1,
    flags: {},
    counters: { kestrelReactor: 9 },
    outcome: null,
  };
}
