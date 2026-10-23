/** Training Simulation 004: Reactor Night. */
import { reactorEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { knows, patchShip } from '../../engine/state';
import { commsOf, openChannel } from '../../engine/comms';
import { km, range } from '../../engine/rules';
import { ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario, reactor } from './setup';
import { hooks, suggestOptions } from './hooks';
import { STAGE, paleyAlive, paleyInPod, pm, settled, simulate } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { reactorDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('engineering', 'intro1')] }),
  (s) => ({ state: patchShip(s, 'kestrel', { detected: true }), reports: [say('sensors', 'intro2')] }),
  (s: WorldState) => ({ state: { ...patchShip(s, 'cruiser', { detected: true }), alert: 'yellow' as const }, reports: [say('comms', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

const STAGE_TEXT: Record<number, string> = { [STAGE.standoff]: 'Standing off the hull', [STAGE.outbound]: 'Outbound on the spine', [STAGE.working]: 'On the spine', [STAGE.inbound]: 'Coming back in', [STAGE.adrift]: 'Adrift on the spine' };

function contactDetails(s: WorldState, id: ShipId): string[] {
  const sh = s.ships[id];
  if (sh.destroyed) return ['Debris field'];
  const out: string[] = [];
  if (id === 'kestrel') {
    const m = pm(s);
    if (!paleyAlive(s)) out.push('No life signs');
    else if (!paleyInPod(s)) out.push('Empty · Paley aboard the Halcyon');
    else out.push(`Crewman Paley${m.frozen ? ' · not moving' : ''}${m.remote ? ' · helm flying' : ''}`);
    out.push(`${STAGE_TEXT[m.stage ?? 0] ?? 'Standing off the hull'} · ${km(range(s, 'halcyon', 'kestrel'))}`);
    if ((m.dose ?? 0) > 0) out.push(`Dose ${Math.round(m.dose ?? 0)} of 100`);
  }
  if (id === 'cruiser') {
    out.push('Fleet repair tender · advice only');
    out.push(`About three hours out · ${km(range(s, 'halcyon', 'cruiser'))}`);
    if (knows(s, 'basant_stance')) out.push({ mentor: 'Basant: trust your Chief', byTheBook: 'Basant: eject, per the manual', salvage: 'Fleet Engineering: keep the core' }[reactor(s).stance]);
  }
  return out;
}

export const reactorScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: reactorDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: reactorEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // v0.6.1 voice hints: Paley is a young, quick, breathy voice heard through a pod's tinny comms;
  // Commander Basant is a slow, deep, older voice with a Mediterranean accent, unlike the Halcyon's crew.
  voices: () => ({
    paley: { gender: 'female', locales: ['en-AU', 'en-NZ', 'en-GB'], pitch: 1.18, rate: 1.08, candidates: ['Karen', 'Catherine', 'Microsoft Natasha'], label: 'Crewman Paley (pod)' },
    basant: { gender: 'male', locales: ['it-IT', 'es-ES', 'en-GB'], pitch: 0.78, rate: 0.88, candidates: ['Luca', 'Jorge', 'Microsoft Diego'] },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome) {
      const own = commsOf(s).suggestions;
      if (own.length) return own.slice(0, 4);
      if (ch.party === 'cruiser') return settled(s) ? ['Thank you, Commander.', 'Close the channel.'] : ['Do you have a bypass procedure?', 'What would you do?', 'How long until you get here?', 'Close the channel.'];
      if (!paleyInPod(s)) return ['Close the channel.'];
      return pm(s).frozen
        ? ['Breathe. I’m right here with you.', 'Paley, come back in.', 'Close the channel.']
        : pm(s).stage
          ? ['You’re doing well. Take your time.', 'Paley, come back in.', 'Close the channel.']
          : ['How are you doing, Paley?', 'Paley, go to the valve.', 'Paley, go to the manifold.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
