/** Training Simulation 008: The Lantern Drift. */
import { lanternEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { revealFact } from '../../engine/state';
import { ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, TUG, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { simulate, settled, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { lanternDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro1')] }),
  (s) => {
    const t = revealFact(s, 'manifest');
    return { state: t, reports: [say('sensors', 'intro2', vars(t))] };
  },
  (s) => ({ state: s, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') return ['Civilian generation ship · Custodian Wick', s.flags.endTowed ? 'Under tow' : s.flags.lockdown ? 'Cryo deck sealed' : 'Adrift · 900 asleep'];
  if (id === 'cruiser') return [`Civilian salvage tug · Salvage-Master Corwin Vollan`, s.flags.stoodOff ? 'Standing off' : s.flags.endTowed ? `${TUG} towing` : 'Tow clamps out'];
  return [];
}

export const lanternScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: lanternDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: lanternEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Custodian Wick is a slow, low, even voice with no warmth or accent to
  // speak of (it is not a person and should not sound like one of the crew); Salvage-Master Corwin
  // Vollan a brisk, gravelly man's voice with an Irish lilt; Speaker Maren Orrey a tired, soft,
  // plain-spoken woman's voice from the southern hemisphere. None sounds like the Halcyon's crew or like each other.
  voices: () => ({
    wick: { gender: 'neutral', locales: ['en-GB', 'en-US'], pitch: 0.6, rate: 0.78, candidates: ['Microsoft George', 'Fred', 'Ralph'], label: 'Custodian Wick' },
    vollan: { gender: 'male', locales: ['en-IE', 'en-GB'], pitch: 0.85, rate: 1.12, candidates: ['Microsoft Connor', 'Moira', 'Daniel'], label: 'Salvage-Master Corwin Vollan' },
    orrey: { gender: 'female', locales: ['en-ZA', 'en-NZ', 'en-AU'], pitch: 0.95, rate: 0.88, candidates: ['Microsoft Leah', 'Tessa', 'Karen'], label: 'Speaker Maren Orrey' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['There are living people aboard her.', 'Close the channel.'];
      return s.flags.speakerAwake ? ['Your people are in danger. Will you decide for them?', 'Close the channel.'] : ['May we come aboard?', 'Who speaks for the sleepers?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
