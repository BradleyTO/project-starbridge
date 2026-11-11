/** Training Simulation 021: The Ninefold Lock. */
import { ninefoldEvaluation } from './evaluation';
import type { ScenarioModule } from '../../engine/scenario';
import type { ShipId, WorldState } from '../../engine/types';
import { narrate, say, sys } from '../../engine/report';
import { openChannel } from '../../engine/comms';
import { SCENARIO_ID, SCENARIO_TITLE, ROLE_HOLDERS, createScenario } from './setup';
import { hooks, suggestOptions } from './hooks';
import { airLeft, range, settled, simulate } from './agents';
import { computeObjectives, detectOutcome } from './outcome';
import { templates } from './templates';
import { ninefoldDialogue } from './dialogue';

const intro: ScenarioModule['intro'] = [
  (s) => ({ state: s, reports: [narrate('intro0')] }),
  (s) => ({ state: s, reports: [say('comms', 'intro1')] }),
  (s) => ({ state: s, reports: [say('sensors', 'intro2')] }),
  (s) => ({ state: s, reports: [say('tactical', 'intro3')] }),
  (s) => ({ state: s, reports: [say('xo', 'intro4'), sys('introHint')] }),
];

const REACH = ['outside its reach', 'closing on its reach', 'inside its reach'];

function contactDetails(s: WorldState, id: ShipId): string[] {
  if (id === 'kestrel') {
    const lock = s.flags.freed ? 'Lock stood down' : s.flags.hardened ? 'Screen hardened' : 'Ninefold lock set';
    return [s.flags.teamOut ? 'Hall empty' : `Survey team · about ${airLeft(s)} min air`, lock];
  }
  if (id === 'cruiser') return ['Recovery cutter · Cdr. Kovar', s.flags.kovarTransmitted ? 'Stood the lock down' : s.flags.deal ? 'Agreed to stand it down' : 'On station'];
  if (id === 'halcyon') return [REACH[range(s)] ?? REACH[0], s.flags.watchHostile ? 'Under the Watch’s guns' : 'Not fired on'];
  return [];
}

export const ninefoldScenario: ScenarioModule = {
  id: SCENARIO_ID,
  title: SCENARIO_TITLE,
  create: createScenario,
  intro,
  hooks: { ...hooks, dialogue: ninefoldDialogue },
  simulate,
  objectives: computeObjectives,
  evaluation: ninefoldEvaluation,
  detectOutcome,
  templates,
  roleHolders: ROLE_HOLDERS,
  // Voice hints (guide §6a): Lt. Odette Kaminski, a calm, low, steady woman's voice, Canadian or
  // Scottish English where the device has one; Quartermaster-Commander Ottilie Kovar, a clipped, dry,
  // older woman's voice, South African or Indian English, slower and lower than Kaminski; the
  // Keystone, a slow, flat, low mechanical voice, deliberately unlike any person. None may sound like a
  // Halcyon officer.
  voices: () => ({
    kaminski: { gender: 'female', locales: ['en-CA', 'en-GB'], pitch: 0.95, rate: 1.0, candidates: ['Fiona', 'Microsoft Clara', 'Moira', 'Serena'], label: 'Lt. Kaminski' },
    kovar: { gender: 'female', locales: ['en-ZA', 'en-IN'], pitch: 0.85, rate: 0.95, candidates: ['Tessa', 'Microsoft Leah', 'Veena', 'Microsoft Neerja'], label: 'Cdr. Kovar' },
    keystone: { gender: 'neutral', locales: ['en-GB'], pitch: 0.6, rate: 0.8, candidates: ['Microsoft George', 'Daniel'], label: 'The Keystone' },
  }),
  suggestions: (s) => {
    const ch = openChannel(s);
    if (ch && !s.outcome && !settled(s)) {
      if (ch.party === 'cruiser') return ['Will you stand the lock down?', 'Our people take nothing out but themselves.', 'Close the channel.'];
      return ['What happened on the pad?', 'What does the board by the door show?', 'Close the channel.'];
    }
    return suggestOptions(s);
  },
  contactDetails,
};

export { SCENARIO_TITLE };
