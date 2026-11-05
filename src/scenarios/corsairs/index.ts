/** Training Simulation 015: Corsairs of the Veyl Shoals. */
import { corsairsEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { revealFact } from '../../engine/state';
import { DRAYCOTT_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, SKERRIT_SHORT, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { broken, settled, simulate, struck, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { corsairsDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro1')] }),
  (s) => ({ state: revealFact(s, 'ambush'), reports: [say('tactical', 'intro2', vars(s))] }),
  (s) => ({ state: s, reports: [say('sensors', 'intro3', vars(s))] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') {
    const k = s.ships.kestrel;
    if (k.destroyed) return [`Corsair raider · ${DRAYCOTT_SHORT}`, 'Destroyed'];
    if (struck(s)) return [`Corsair raider · ${DRAYCOTT_SHORT}`, 'Colours struck'];
    if (s.flags.calledOff) return [`Corsair raider · ${DRAYCOTT_SHORT}`, 'Withdrawing into the dust'];
    if (broken(s)) return [`Corsair raider · ${DRAYCOTT_SHORT}`, 'Holding off'];
    return [`Corsair raider · ${DRAYCOTT_SHORT}`, `${s.counters.escorts === 1 ? 'One escort' : 'Two escorts'} in the rocks`];
  }
  if (id === 'cruiser') return [`Syndicate gunship · ${SKERRIT_SHORT}`, s.flags.gavelHere ? 'Standing off the shoal' : 'Not in sight'];
  return [];
}

export const corsairsScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: corsairsDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: corsairsEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Captain Ione Draycott a low, dry, quick woman's voice from Ireland or
  // Scotland, a spacer who has talked her way out of worse; Collector Amos Skerrit a slow, soft,
  // unhurried man's voice from South Africa or the American South, a man who is never in a hurry
  // because the debt will wait. Neither sounds like the Halcyon's crew or like each other.
  voices: () => ({
    draycott: { gender: 'female', locales: ['en-IE', 'en-GB'], pitch: 0.86, rate: 1.08, candidates: ['Moira', 'Microsoft Emily', 'Fiona'], label: 'Captain Ione Draycott' },
    skerrit: { gender: 'male', locales: ['en-ZA', 'en-US'], pitch: 0.8, rate: 0.82, candidates: ['Microsoft Luke', 'Fred', 'Microsoft Guy'], label: 'Collector Amos Skerrit' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return [s.flags.protectionAccepted ? 'She stays in ISA custody.' : 'What does she owe you?', 'Close the channel.'];
      return [broken(s) ? 'Strike your colours.' : 'Who are you working for?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
