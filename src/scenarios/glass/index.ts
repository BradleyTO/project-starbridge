/** Training Simulation 016: The Glass Nebula. */
import { glassEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { revealFact } from '../../engine/state';
import { BUOY, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, VALE_SHORT, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { settled, simulate, vars } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { glassDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: revealFact(s, 'messages'), reports: [say('comms', 'intro1')] }),
  (s) => ({ state: s, reports: [say('sensors', 'intro2', vars(s))] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4', vars(s)), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') {
    const k = s.ships.kestrel;
    if (k.destroyed) return [`Survey shuttle · ${VALE_SHORT}`, 'Destroyed'];
    if (s.counters.rescued > 0) return [`Survey shuttle · ${VALE_SHORT}`, 'Crew recovered'];
    if (s.flags.crewFailed || s.characters.vale?.status === 'dead') return [`Survey shuttle · ${VALE_SHORT}`, 'No living returns'];
    return [`Survey shuttle · ${VALE_SHORT}`, s.flags.channelClear ? 'Channel holding' : 'Signal garbled'];
  }
  if (id === 'cruiser') return [`ISA survey buoy · ${BUOY}`, 'Telemetry only'];
  return [];
}

export const glassScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: glassDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: glassEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Surveyor Nessa Vale a thin, strained, slightly fast woman's voice from
  // Australia or New Zealand, a surveyor used to talking through static; buoy Prism has no human
  // speaker (label only). Vale must not sound like the Halcyon's crew.
  voices: () => ({
    vale: { gender: 'female', locales: ['en-AU', 'en-NZ'], pitch: 1.08, rate: 1.1, candidates: ['Karen', 'Tessa', 'Microsoft Catherine'], label: 'Surveyor Nessa Vale' },
    prism: { gender: 'neutral', locales: ['en-GB'], pitch: 0.7, rate: 0.85, candidates: ['Microsoft George', 'Daniel'], label: 'Buoy Prism' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['Relay our probes.', 'Close the channel.'];
      return ['We are coming. Hold on.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
