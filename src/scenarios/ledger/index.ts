/** Training Simulation 007: Ghost Ledger. */
import { ledgerEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { simulate } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { ledgerDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro1')] }),
  (s) => ({ state: s, reports: [say('sensors', 'intro2')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') return ['Civilian packet ship · Capt. Hesketh Moll', s.flags.departed ? 'Sailed' : 'Docked alongside'];
  if (id === 'cruiser') return ['Directorate diplomatic courier · Courier-Captain Sabine Thorne', s.flags.departed ? 'Sailed' : 'Docked alongside'];
  return [];
}

export const ledgerScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: ledgerDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: ledgerEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Attaché Krenn is a cool, low, precise woman's voice; Dorran Vesk a warm,
  // quick man's voice with a Scottish burr; Imogen Sallow a bright, fast woman's voice; Commander
  // Fosse a stiff, clipped man's voice; Capt. Moll a gruff, slow Northern voice; Courier-Captain
  // Thorne a measured, silky woman's voice. None sounds like the Halcyon's crew or like each other.
  voices: () => ({
    krenn: { gender: 'female', locales: ['en-GB'], pitch: 0.82, rate: 0.9, candidates: ['Microsoft Sonia', 'Serena', 'Kate'], label: 'Attaché Ysolde Krenn' },
    vesk: { gender: 'male', locales: ['en-GB', 'en-IE'], pitch: 1.05, rate: 1.1, candidates: ['Microsoft Ryan', 'Oliver', 'Daniel'], label: 'Dorran Vesk' },
    sallow: { gender: 'female', locales: ['en-AU', 'en-NZ'], pitch: 1.15, rate: 1.12, candidates: ['Microsoft Natasha', 'Karen', 'Catherine'], label: 'Imogen Sallow' },
    fosse: { gender: 'male', locales: ['en-US', 'en-CA'], pitch: 0.9, rate: 0.95, candidates: ['Microsoft Guy', 'Alex', 'Fred'], label: 'Cmdr. Leander Fosse' },
    moll: { gender: 'male', locales: ['en-GB'], pitch: 0.7, rate: 0.85, candidates: ['Microsoft Thomas', 'Arthur', 'Daniel'], label: 'Capt. Hesketh Moll' },
    thorne: { gender: 'female', locales: ['en-IN', 'en-GB'], pitch: 0.95, rate: 0.92, candidates: ['Microsoft Neerja', 'Veena', 'Martha'], label: 'Courier-Captain Sabine Thorne' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome) return ch.party === 'cruiser' ? ['We know what your agent took.', 'Close the channel.'] : ['What came across from Mr Vesk tonight?', 'Close the channel.'];
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
