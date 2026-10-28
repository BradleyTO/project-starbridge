/** Scenario-specific meaning of scans, one-shot comm actions, improvised orders, queries and officers' bridge talk for The Long Picket. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { picketDialogue } from './dialogue';
import { picket } from './setup';
import { act, ask, scanPicket, settled, vars } from './agents';

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'cruiser':
      return { state: scanPicket(s, r), reports: r };
    case 'kestrel':
      return { state: s, reports: [say('sensors', 'scanKestrelDetail')] };
    case 'compartment':
    case 'halcyon':
      return { state: act(s, 'scan our cargo', r), reports: r };
    case 'area':
      return { state: s, reports: [say('sensors', 'areaSweep')] };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const text = a.intent === 'warn' ? 'we are going through' : '';
  return picketDialogue.respond(s, { type: 'speak', to: a.target === 'kestrel' ? 'kestrel' : 'cruiser', text, intents: [], topic: undefined, relayed: false } as never, rng);
}

// ------------------------------------------------------------ improvise ---

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  if (a.method !== 'other') return { state: s, reports: [say('xo', 'impNotHere')] };
  return { state: act(s, a.description, r), reports: r };
}

// ------------------------------------------------------- officers on the bridge ---

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('xo', 'bridgeNotNow')] };
  const r: Report[] = [];
  return { state: ask(s, action.text ?? '', r), reports: r };
}

// ---------------------------------------------------------------- query ---

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome || settled(s)) return out;
  const v = picket(s);
  if (!s.flags.spokeRoake) out.push('hail the picket');
  if (!knows(s, 'read') && s.flags.roakeHeard) out.push('Marrow, what do you make of him?');
  if (!knows(s, 'orders') && !(s.counters.interceptAt ?? 0)) out.push('Szabo, listen to the picket’s traffic');
  if (!knows(s, 'window')) out.push('Chief, read Wrenmoor’s reactor telemetry');
  if (!knows(s, 'sweep')) out.push('Varga, scan the picket');
  if (knows(s, 'orders') && v.orders === 'pretext' && !s.flags.evidenceSent) out.push('send him our scan of the cargo');
  if (knows(s, 'read') && !s.flags.marrowSpoke && v.history !== 'rivals') out.push('Marrow, talk to him privately');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusPicket', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'cargoAboard')] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'areaSweep')] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') || 'nothing more from the bridge' })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
