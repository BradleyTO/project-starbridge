/** Training Simulation 020: Gravity's Edge. */
import { gravityEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { SCENARIO_ID, SCENARIO_TITLE, ROLE_HOLDERS, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { depth, gauge, settled, simulate } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { gravityDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro1')] }),
  (s) => ({ state: s, reports: [say('sensors', 'intro2')] }),
  (s) => ({ state: s, reports: [say('engineering', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

const BAND = ['clear of the tide', 'outer band', 'middle band', 'deep band'];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') return ['Instrument probe', s.flags.probeLost ? 'Signal lost' : s.flags.probeReleased ? 'Released, falling' : 'On her tether'];
  if (id === 'cruiser') return ['Observatory · Director Aalto', s.flags.relayActive ? 'Dish receiving our data' : s.flags.relayOrdered ? 'Dish turning' : 'Standing by'];
  if (id === 'halcyon') return [BAND[depth(s)] ?? BAND[0], `Gauges ${gauge(s)}% of rated`];
  return [];
}

export const gravityScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: gravityDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: gravityEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Director Benedikt Aalto, the only comms character, an eager, quick,
  // slightly high older man's voice, Scandinavian-English where the device has one, otherwise Irish
  // or Indian English; he must not sound like any Halcyon officer. The probe has no voice.
  voices: () => ({
    aalto: { gender: 'male', locales: ['en-IE', 'en-IN', 'en-GB'], pitch: 1.1, rate: 1.14, candidates: ['Rishi', 'Microsoft Sean', 'Oliver', 'Aaron'], label: 'Director Aalto' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) return ['Turn your dish and take our data.', 'The ship and crew come first; no promises.', 'Close the channel.'];
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
