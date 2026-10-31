/** Training Simulation 012: Ember Tide. */
import { emberEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { revealFact } from '../../engine/state';
import { FERRIER_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, STROME_SHORT, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { settled, simulate, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { emberDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro1')] }),
  (s) => ({ state: revealFact(s, 'window'), reports: [say('sensors', 'intro2', vars(s))] }),
  (s) => ({ state: s, reports: [say('helm', 'intro3', vars(s))] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  const c = (k: string) => s.counters[k] ?? 0;
  if (id === 'kestrel') return [`Mining outpost · ${STROME_SHORT}`, s.flags.endFlare ? (c('underground') ? `${c('underground')} below ground` : 'Near face empty') : `${c('general') + c('bank')} on the surface`];
  if (id === 'cruiser') return [`Ore lifter · ${FERRIER_SHORT}`, s.flags.lifterLost ? 'Lost in the flare' : c('ferrierMode') === 2 ? 'Docked' : c('ferrierMode') === 1 ? 'Carrying people' : 'Flying ore'];
  return [];
}

export const emberScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: emberDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: emberEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Overseer Dagny Strome a low, weathered, steady woman's voice with an
  // Irish or South African accent, slower than the bridge; Lifter-Master Joss Ferrier a quick,
  // bright, rather high man's voice from North America, faster still when he is frightened.
  // Neither sounds like the Halcyon's crew or like each other.
  voices: () => ({
    strome: { gender: 'female', locales: ['en-IE', 'en-ZA'], pitch: 0.8, rate: 0.88, candidates: ['Moira', 'Microsoft Emily', 'Tessa'], label: 'Overseer Dagny Strome' },
    ferrier: { gender: 'male', locales: ['en-US', 'en-CA'], pitch: 1.15, rate: 1.15, candidates: ['Microsoft Guy', 'Alex', 'Tom'], label: 'Lifter-Master Joss Ferrier' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['Carry people, not ore. The flare is coming.', 'Close the channel.'];
      return ['How long until the furnace is banked?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
