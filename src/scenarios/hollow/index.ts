/** Training Simulation 019: Hollow Crown. */
import { hollowEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { knows } from '../../engine/state';
import { MALLORY_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, STANNARD_SHORT, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { hostagesIn, settled, simulate, surrendering } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { hollowDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro1')] }),
  (s) => ({ state: s, reports: [say('sensors', 'intro2')] }),
  (s) => ({ state: s, reports: [say('medical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') {
    const who = s.ships.kestrel.souls > 0 ? `${MALLORY_SHORT} · ${hostagesIn(s)} hostages` : 'empty';
    return [`Relay · ${who}`, surrendering(s) ? 'Coming out' : knows(s, 'condition') ? 'Condition assessed' : 'Condition unknown'];
  }
  if (id === 'cruiser') return [`Government · ${STANNARD_SHORT}`, 'Civic Guard team in the lower ring'];
  return [];
}

export const hollowScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: hollowDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: hollowEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Severin Mallory a tired, cultivated older man's voice, British or
  // Irish, low and slow, the voice of a man used to being listened to; Acting Governor Stannard a
  // crisp, quick, higher North American or Australian woman's voice; the woman speaking as Tamsin
  // Rook a soft, young-sounding South African or New Zealand voice, careful with her words. None
  // sounds like the Halcyon's officers or like each other.
  voices: () => ({
    mallory: { gender: 'male', locales: ['en-GB', 'en-IE'], pitch: 0.82, rate: 0.9, candidates: ['Daniel', 'Arthur', 'Microsoft George'], label: 'Severin Mallory' },
    stannard: { gender: 'female', locales: ['en-US', 'en-AU'], pitch: 1.08, rate: 1.12, candidates: ['Samantha', 'Microsoft Zira', 'Karen'], label: 'Acting Governor Stannard' },
    rook: { gender: 'female', locales: ['en-ZA', 'en-NZ'], pitch: 1.18, rate: 0.96, candidates: ['Tessa', 'Microsoft Leah', 'Catherine'], label: 'Tamsin Rook' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['Hold your team; there are lives in there.', 'He will stay in ISA custody.', 'Close the channel.'];
      return ['Tell me what happened.', 'The ISA can offer you protection and a fair hearing.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
