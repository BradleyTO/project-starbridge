/** Scenario-specific meaning of scans, one-shot comm actions, improvised orders, queries and officers' bridge talk for Starfall. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { starfallDialogue } from './dialogue';
import { act, ask, flying, settled, towing, vars } from './agents';

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanCruiserDetail')] };
    case 'kestrel':
    case 'compartment':
      return { state: act(s, 'count the life signs', r), reports: r };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'statusStrain', vars(s))] };
    case 'area':
      return { state: act(s, 'read the storm', r), reports: r };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  return starfallDialogue.respond(s, { type: 'speak', to: a.target === 'cruiser' ? 'cruiser' : 'kestrel', text: '', intents: [], topic: undefined, relayed: false } as never, rng);
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
  const c = (k: string) => s.counters[k] ?? 0;
  if (!c('rescueAt') && !flying(s) && !towing(s)) {
    out.push('Adeyemi, the helm is yours. Take us down');
    out.push('Lt. Duarte, take the helm');
  }
  if (!knows(s, 'tolerance')) out.push('Chief, how much can the hull take?');
  if (!s.flags.countKnown && !s.flags.scoopUp) out.push('Varga, count the life signs aboard the habitat');
  if (c('trips') > 0 && !s.flags.lineOffered) out.push('Adeyemi, how would you fly it?');
  if (s.flags.lineOffered && !s.flags.lineApproved) out.push('fly your line');
  if (s.flags.paused && c('upper') > 0) out.push('one more descent');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusStarfall', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'statusStrain', vars(s))] };
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
