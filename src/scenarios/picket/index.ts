/** Training Simulation 009: The Long Picket. */
import { picketEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { revealFact } from '../../engine/state';
import { DAHL_SHORT, REEVE, ROLE_HOLDERS, ROAKE_SHORT, SCENARIO_ID, SCENARIO_TITLE, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { relieved, simulate, settled, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { picketDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro1')] }),
  (s) => ({ state: revealFact(s, 'cargo'), reports: [say('xo', 'intro2')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') return [`ISA colony · ${REEVE}`, s.flags.endDark ? 'Reactor shut down' : 'Reactor failing · 4,100 aboard'];
  if (id === 'cruiser') return [`Directorate picket frigate · ${relieved(s) ? DAHL_SHORT : ROAKE_SHORT}`, s.flags.endPassed || s.flags.endRan ? 'Line passed' : (s.counters.inspectEnd ?? 0) > 0 ? 'Inspecting' : 'Holding the line'];
  return [];
}

export const picketScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: picketDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: picketEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Commander Lucan Roake a clipped, deep, measured man's voice with a
  // northern English edge, never hurried; Commander Ysara Dahl, his relief, a cool, precise,
  // mid-pitched woman's voice with a Scandinavian accent; Reeve Odile Marchbank a warm, quick,
  // frightened woman's voice from Canada or the American north. None sounds like the Halcyon's crew or like each other.
  voices: () => ({
    dahl: { gender: 'female', locales: ['sv-SE', 'nb-NO', 'en-GB'], pitch: 1.0, rate: 0.95, candidates: ['Microsoft Sofie', 'Alva', 'Nora'], label: 'Commander Ysara Dahl' },
    marchbank: { gender: 'female', locales: ['en-CA', 'en-US'], pitch: 1.12, rate: 1.15, candidates: ['Microsoft Clara', 'Samantha', 'Allison'], label: 'Reeve Odile Marchbank' },
    roake: { gender: 'male', locales: ['en-GB'], pitch: 0.72, rate: 0.9, candidates: ['Microsoft Ryan', 'Oliver', 'Arthur'], label: 'Commander Lucan Roake' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return relieved(s) ? ['You may inspect us, as a courtesy and without conceding your claim.', 'Close the channel.'] : ['We are carrying reactor assemblies for Wrenmoor.', 'You may inspect one crate, for your log.', 'Close the channel.'];
      return ['How long do you really have?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
