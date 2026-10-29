/** Training Simulation 010: The Gardener. */
import { gardenerEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { revealFact } from '../../engine/state';
import { CRAKE_SHORT, HASKETT_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { settled, simulate, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { gardenerDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro1')] }),
  (s) => ({ state: revealFact(s, 'growth'), reports: [say('sensors', 'intro2')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') return [`Claims station · ${HASKETT_SHORT}`, s.flags.endOverrun ? 'Claims overrun' : '140 aboard'];
  if (id === 'cruiser') return [`Mining tender · ${CRAKE_SHORT}`, s.flags.crakeStoodDown ? 'Charges stood down' : s.flags.endBurned ? 'Charges spent' : 'Charges set'];
  return [];
}

export const gardenerScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: gardenerDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: gardenerEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Claimwarden Bettine Crake a brisk, hard-edged, tired woman's voice
  // from Australia, quick when frightened; Assayer Lorne Haskett a slow, low, dry man's voice with a
  // Scottish accent. Neither sounds like the Halcyon's crew or like each other.
  voices: () => ({
    crake: { gender: 'female', locales: ['en-AU', 'en-NZ'], pitch: 1.05, rate: 1.12, candidates: ['Microsoft Natasha', 'Karen', 'Catherine'], label: 'Claimwarden Bettine Crake' },
    haskett: { gender: 'male', locales: ['en-GB', 'en-ZA'], pitch: 0.8, rate: 0.85, candidates: ['Gordon', 'Microsoft Ryan', 'Fred'], label: 'Assayer Lorne Haskett' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['Hold your charges. Give us time to find out what it is.', 'Close the channel.'];
      return ['How does it reach your claims?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
