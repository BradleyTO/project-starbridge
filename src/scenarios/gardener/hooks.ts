/** Scenario-specific meaning of scans, one-shot comm actions, improvised orders, queries and officers' bridge talk for The Gardener. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { gardenerDialogue } from './dialogue';
import { gardener } from './setup';
import { act, ask, settled, vars } from './agents';

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanTender')] };
    case 'kestrel':
      return { state: s, reports: [say('sensors', 'scanKestrelDetail')] };
    case 'compartment':
      return { state: act(s, 'study the growth', r), reports: r };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'cargoAboard')] };
    case 'area':
      return { state: s, reports: [say('sensors', 'areaSweep')] };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const text = a.intent === 'warn' ? 'hold your charges' : '';
  return gardenerDialogue.respond(s, { type: 'speak', to: a.target === 'kestrel' ? 'kestrel' : 'cruiser', text, intents: [], topic: undefined, relayed: false } as never, rng);
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
  const v = gardener(s);
  if (!(s.counters.studyAt ?? 0) && !knows(s, 'alive')) out.push('Varga, study the growth');
  if (!s.flags.spokeCrake) out.push('hail the tender');
  if (!s.flags.crakeStoodDown && !s.flags.crakeHeld) out.push('tell the Claimwarden to hold her charges');
  if (!s.flags.sampled && !knows(s, 'habit')) out.push('send a probe for a sample');
  if (!knows(s, 'field')) out.push('hail the station and ask how it reaches the claims');
  if (knows(s, 'drawn') && v.nature !== 'stone' && !s.flags.lureLaid) out.push(`Chief, lay a ${v.drawn} lure`);
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusGardener', vars(s))] };
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
