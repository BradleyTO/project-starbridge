/** Training Simulation 011: Coldwater. */
import { coldwaterEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { revealFact } from '../../engine/state';
import { HADLEY_SHORT, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, TOLLER_SHORT, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { settled, simulate, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { coldwaterDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: revealFact(s, 'death'), reports: [say('engineering', 'intro1')] }),
  (s) => ({ state: s, reports: [say('medical', 'intro2')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro3', vars(s))] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') return [`ISA research station · ${TOLLER_SHORT}`, s.flags.evacuated ? 'Evacuated' : s.flags.reactorOnline ? 'Power restored' : s.flags.endCold ? 'Dark' : '38 aboard · on batteries'];
  if (id === 'cruiser') return [`ISA courier · ${HADLEY_SHORT}`, s.flags.reviewOpened ? 'Review opened' : 'Hours out'];
  return [];
}

export const coldwaterScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: coldwaterDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: coldwaterEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Petty Officer Mara Tennant a low, rough, tired woman's voice from the
  // north of England, slow when grieving; Lt. Garrick Penhale a clipped, careful, middle-aged man;
  // Petty Officer Sian Corley a quick, light Welsh voice; Director Annick Toller a warm, measured
  // Canadian woman; Inspector-Commander Noor Hadley a precise, unhurried South African woman. None
  // sounds like the Halcyon's officers or like each other.
  voices: () => ({
    tennant: { gender: 'female', locales: ['en-GB'], pitch: 0.85, rate: 0.9, candidates: ['Microsoft Libby', 'Kate', 'Serena'], label: 'Petty Officer Mara Tennant' },
    penhale: { gender: 'male', locales: ['en-GB', 'en-US'], pitch: 0.95, rate: 1.05, candidates: ['Microsoft George', 'Daniel', 'Oliver'], label: 'Lt. Garrick Penhale' },
    corley: { gender: 'female', locales: ['en-GB', 'en-IE'], pitch: 1.2, rate: 1.15, candidates: ['Microsoft Emily', 'Moira', 'Fiona'], label: 'Petty Officer Sian Corley' },
    toller: { gender: 'female', locales: ['en-CA', 'en-US'], pitch: 0.9, rate: 0.95, candidates: ['Microsoft Jenny', 'Victoria', 'Ava'], label: 'Director Annick Toller' },
    hadley: { gender: 'female', locales: ['en-ZA', 'en-IN', 'en-GB'], pitch: 0.92, rate: 0.85, candidates: ['Microsoft Leah', 'Tessa', 'Veena'], label: 'Inspector-Commander Noor Hadley' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['We need an independent review of a death aboard. The log may have been falsified.', 'Close the channel.'];
      return ['How long do your batteries have?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
