/** Training Simulation 014: Starfall. */
import { starfallEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { revealFact } from '../../engine/state';
import { KEMBLE_SHORT, QUELL_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { onHabitat, settled, simulate, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { starfallDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro1')] }),
  (s) => ({ state: revealFact(s, 'sink'), reports: [say('sensors', 'intro2', vars(s))] }),
  (s) => ({ state: s, reports: [say('helm', 'intro3', vars(s))] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  const c = (k: string) => s.counters[k] ?? 0;
  if (id === 'kestrel') {
    if (s.flags.endTow) return [`Mining habitat · ${KEMBLE_SHORT}`, 'Towed clear of the storm'];
    if (s.flags.endLost) return [`Mining habitat · ${KEMBLE_SHORT}`, 'Below the crush line'];
    return [`Mining habitat · ${KEMBLE_SHORT}`, `${c('upper')} waiting at the ring · ${c('depth')} km down`];
  }
  if (id === 'cruiser') return [`Company yacht · ${QUELL_SHORT}`, 'Holding above the cloud tops'];
  return [];
}

export const starfallScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: starfallDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: starfallEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Factor Idris Kemble a low, slow, careful man's voice from Wales or
  // northern England, a man used to weighing words; Agent Sabra Quell a crisp, quick woman's voice
  // from Australia or New Zealand, pitched a little high, all business. Neither sounds like the
  // Halcyon's crew or like each other.
  voices: () => ({
    kemble: { gender: 'male', locales: ['en-GB', 'en-IE'], pitch: 0.78, rate: 0.84, candidates: ['Microsoft Ryan', 'Daniel', 'Arthur'], label: 'Factor Idris Kemble' },
    quell: { gender: 'female', locales: ['en-AU', 'en-NZ'], pitch: 1.12, rate: 1.14, candidates: ['Karen', 'Microsoft Natasha', 'Catherine'], label: 'Agent Sabra Quell' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['Do you have the payroll for the scoop works?', 'Close the channel.'];
      return [onHabitat(s) ? 'Is everyone aboard on your manifest?' : 'Thank you, Factor.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
