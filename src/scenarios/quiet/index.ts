/** Training Simulation 003: The Quiet Signal. */
import { quietEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { knows, patchShip } from '../../engine/state';
import { commsOf, openChannel } from '../../engine/comms';
import { km, range } from '../../engine/rules';
import { GLITCH_KM, ROLE_HOLDERS, SCENARIO_ID, SCENARIO_TITLE, createScenario, quiet } from './setup';
import { hooks, suggestOptions } from './hooks';
import { bm, question, simulate, sm } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { quietDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: patchShip(s, 'kestrel', { detected: true }), reports: [say('sensors', 'intro1')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro2')] }),
  (s: WorldState) => ({ state: { ...patchShip(s, 'cruiser', { detected: true }), alert: 'yellow' as const }, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

function contactDetails(s: WorldState, id: ShipId): string[] {
  const sh = s.ships[id];
  if (sh.destroyed) return ['Debris field'];
  const out: string[] = [];
  if (id === 'kestrel') {
    if (s.flags.sendersGone) return ['Gone'];
    out.push(knows(s, 'courier_crewed') ? 'Unarmed · 4 life signs' : 'Sitting in the pulsar beam');
    const q = question(s);
    if (s.flags.misread || s.flags.silent) out.push('Silent');
    else if (q < 2) out.push(`Question ${q + 1} of 2 · waiting about ${Math.max(0, (sm(s).deadline ?? 0) - s.turn)} min`);
    else out.push(knows(s, 'senders_intent') ? `Message: ${quiet(s).intent}` : 'Message incoming');
    out.push(`Decode: ${knows(s, 'grammar_known') ? 'complete' : knows(s, 'partial_decode') ? 'two readings' : s.flags.szaboOnIt ? 'in progress' : 'not started'}`);
    if (knows(s, 'senders_intent') && quiet(s).intent === 'warning') out.push(`Glitch zone: ${km(GLITCH_KM)} · Halcyon at ${km(range(s, 'halcyon', 'kestrel'))}`);
  }
  if (id === 'cruiser') {
    if (s.flags.cruiserGone) return ['Jumped clear'];
    out.push(bm(s).joint ? 'Joint decode · transmitter held' : bm(s).holding ? 'Transmitter held' : 'Transmitter warm');
    if (knows(s, 'director_wrong')) out.push('Working the wrong grammar');
    if (sh.weapons.state === 'locked' && sh.weapons.target) out.push(`Weapons LOCKED on ${s.ships[sh.weapons.target].name}`);
    else if (sh.weapons.state !== 'safe') out.push('Weapons armed');
    if (sh.scanLevel >= 2) out.push(`Hull ${Math.round(sh.hull)}%`);
  }
  return out;
}

export const quietScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: quietDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: quietEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // v0.6.1 voice hints: the senders' pulses are read out by a flat, slow synthetic voice;
  // Director Brenn is a crisp, low voice with a southern-hemisphere accent, unlike the Halcyon's crew.
  voices: () => ({
    senders: { gender: 'neutral', locales: ['en-IN', 'en-SG', 'en-US'], pitch: 0.62, rate: 0.78, candidates: ['Rishi', 'Microsoft Ravi', 'Fred'], label: 'The senders (pulses)' },
    brenn: { gender: 'female', locales: ['en-ZA', 'en-IE'], pitch: 0.84, rate: 0.97, candidates: ['Tessa', 'Moira', 'Microsoft Hazel'] },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome) {
      const own = commsOf(s).suggestions;
      if (own.length) return own.slice(0, 4);
      if (ch.party === 'cruiser') return ['Will you hold your transmission?', 'We could share our decode.', 'Who are you working for?', 'Close the channel.'];
      return question(s) < 2 ? ['Echo their question back to them.', 'Szabo, how close are you?', 'Close the channel.'] : ['Greetings from the ISV Halcyon.', 'Thank you, and farewell.', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
