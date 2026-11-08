/** Training Simulation 018: The Weather Engine. */
import { weatherEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { LOWE_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, TULL_SHORT, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { running, settled, simulate, triesLeft } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { weatherDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro1')] }),
  (s) => ({ state: s, reports: [say('sensors', 'intro2')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') {
    const lock = running(s) ? 'Engine turning' : s.flags.lockedOut ? 'Sealed for good' : s.flags.lockRead ? `Lock read · ${triesLeft(s)} answers left` : 'Locked · unread';
    return [`Station · ${s.ships.kestrel.souls > 0 ? LOWE_SHORT : 'empty'}`, lock];
  }
  if (id === 'cruiser') return [`Colony · ${TULL_SHORT}`, s.flags.allSheltered ? 'All under cover' : s.flags.shelterOrdered ? 'Taking cover' : 'In the open'];
  return [];
}

export const weatherScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: weatherDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: weatherEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Technician Bastian Lowe a warm, slightly gravelly man from the
  // Australian or New Zealand outback, steady and practical; Steward Anwen Tull a brisk, clipped
  // Welsh or English woman's voice, used to running meetings and not to being contradicted; Marit
  // Quarrie a quiet, lower, slower North American woman's voice, guarded. None sounds like the
  // Halcyon's officers or like each other.
  voices: () => ({
    lowe: { gender: 'male', locales: ['en-AU', 'en-NZ'], pitch: 0.9, rate: 0.98, candidates: ['Lee', 'Microsoft James', 'Gordon'], label: 'Technician Bastian Lowe' },
    tull: { gender: 'female', locales: ['en-GB', 'en-IE'], pitch: 1.06, rate: 1.1, candidates: ['Kate', 'Microsoft Libby', 'Serena'], label: 'Steward Anwen Tull' },
    marit: { gender: 'female', locales: ['en-CA', 'en-US'], pitch: 0.88, rate: 0.9, candidates: ['Allison', 'Microsoft Aria', 'Ava'], label: 'Marit Quarrie' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['Tell me the truth about Elias Quarrie.', 'We need his letters.', 'Close the channel.'];
      return ['Read me the lock plate.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
