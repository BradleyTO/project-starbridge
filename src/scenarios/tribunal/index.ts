/** Training Simulation 017: Tribunal at Kesh Varo. */
import { tribunalEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { ASKEL_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, SOTH_SHORT, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { settled, simulate, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { tribunalDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro1', vars(s))] }),
  (s) => ({ state: s, reports: [say('medical', 'intro2')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') return [`Detention · ${ASKEL_SHORT}`, s.flags.heardAskel ? 'Heard' : 'Awaiting contact'];
  if (id === 'cruiser') return [`Tribunal · ${SOTH_SHORT}`, s.flags.spokeSoth ? 'In session' : 'Standing by'];
  return [];
}

export const tribunalScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: tribunalDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: tribunalEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Crewman Jory Askel a young, tight, slightly fast man's voice from
  // Ireland or Scotland, a rating trying not to sound afraid; Magister Lirra Soth a low, exact,
  // unhurried woman's voice with a West African or Caribbean cadence, used to sitting in judgment.
  // Neither sounds like the Halcyon's officers or like each other.
  voices: () => ({
    askel: { gender: 'male', locales: ['en-IE', 'en-GB'], pitch: 1.05, rate: 1.08, candidates: ['Microsoft Connor', 'Moira', 'Gordon'], label: 'Crewman Jory Askel' },
    soth: { gender: 'female', locales: ['en-GB', 'en-NG'], pitch: 0.82, rate: 0.88, candidates: ['Microsoft Hazel', 'Tessa', 'Martha'], label: 'Magister Lirra Soth' },
    dorn: { gender: 'neutral', locales: ['en-GB'], pitch: 0.9, rate: 0.92, candidates: ['Microsoft George', 'Daniel'], label: 'Keeper Yasha Dorn' },
    toras: { gender: 'female', locales: ['en-AU', 'en-NZ'], pitch: 1.12, rate: 1.0, candidates: ['Karen', 'Tessa'], label: 'Pilgrim Elen Toras' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['We wish to present evidence.', 'Close the channel.'];
      if (ch.party === 'passenger') return ['Tell me about the Quiet Stone\'s custom.', 'Close the channel.'];
      return ['Tell me what happened, in your own words.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
