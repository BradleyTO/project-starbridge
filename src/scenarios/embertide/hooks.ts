/** Scenario-specific meaning of scans, one-shot comm actions, improvised orders, queries and officers' bridge talk for Ember Tide. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { emberDialogue } from './dialogue';
import { ember } from './setup';
import { act, ask, forecasting, inShadow, settled, vars } from './agents';

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanCruiserDetail')] };
    case 'kestrel':
    case 'compartment':
      return { state: act(s, 'scan the galleries', r), reports: r };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'statusReport', { hull: s.ships.halcyon.hull, shields: s.ships.halcyon.shields.raised ? 'up' : 'down', weapons: s.ships.halcyon.weapons.state })] };
    case 'area':
      return { state: act(s, 'forecast the flare', r), reports: r };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  return emberDialogue.respond(s, { type: 'speak', to: a.target === 'cruiser' ? 'cruiser' : 'kestrel', text: '', intents: [], topic: undefined, relayed: false } as never, rng);
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
  const v = ember(s);
  if (!forecasting(s)) out.push('Varga, forecast the flare');
  if (!s.flags.evacOn && !s.flags.shelterOrdered) out.push('begin the evacuation');
  if (!s.flags.warnedLifter && (s.counters.ferrierMode ?? 0) !== 2) out.push('tell the Lifter-Master to carry people, not ore');
  if (!knows(s, 'galleries') && v.galleries !== 'flooded') out.push('Varga, survey the galleries');
  if (!s.flags.lifted && !s.counters.liftOrderedAt) out.push('when will the flare come?');
  if (!inShadow(s) && !s.counters.shadowAt) out.push("take us into the moon's shadow");
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusEmber', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'statusReport', { hull: s.ships.halcyon.hull, shields: s.ships.halcyon.shields.raised ? 'up' : 'down', weapons: s.ships.halcyon.weapons.state })] };
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
