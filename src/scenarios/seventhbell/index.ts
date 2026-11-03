/** Training Simulation 013: The Seventh Bell. */
import { seventhBellEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, STAVELY_SHORT, VORY_SHORT, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { settled, simulate, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { seventhBellDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro1')] }),
  (s) => ({ state: s, reports: [say('medical', 'intro2')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro3', vars(s))] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') return [`ISA patrol cutter · ${STAVELY_SHORT}`, s.flags.heardStavely ? 'Heard' : s.flags.stavelySilent ? 'Silent' : 'Awaiting the inquiry'];
  if (id === 'cruiser') return [`Directorate courier · ${VORY_SHORT}`, s.flags.voryWalked ? 'Channel closed' : 'Disabled · 7 aboard · 2 dead'];
  return [];
}

export const seventhBellScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: seventhBellDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: seventhBellEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Lt. Cmdr. Jonah Stavely a steady, weathered Australian man, a little
  // slow when he is choosing his words; Examiner Ilsabet Vory a low, exact, very deliberate woman
  // with a Scots edge. Neither sounds like the Halcyon's officers or like each other.
  voices: () => ({
    stavely: { gender: 'male', locales: ['en-AU', 'en-NZ'], pitch: 0.86, rate: 0.94, candidates: ['Microsoft William', 'Lee', 'Gordon'], label: 'Lt. Cmdr. Jonah Stavely' },
    vory: { gender: 'female', locales: ['en-GB', 'en-IE'], pitch: 0.78, rate: 0.84, candidates: ['Fiona', 'Microsoft Maisie', 'Martha'], label: 'Examiner Ilsabet Vory' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['I am sorry for your dead. Tell me what happened.', 'Close the channel.'];
      return ['Tell me what happened, in your own words.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
