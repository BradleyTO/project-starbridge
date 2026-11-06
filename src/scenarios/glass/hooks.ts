/** Scans, one-shot comms, improvised orders, queries and bridge talk for The Glass Nebula. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { glassDialogue } from './dialogue';
import { act, ask, modelReady, settled, vars } from './agents';

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  switch (target) {
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanBuoy')] };
    case 'kestrel':
    case 'compartment':
      return { state: s, reports: [say('sensors', modelReady(s) ? 'scanShuttleKnown' : 'scanShuttleLied', vars(s))] };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'statusShip', vars(s))] };
    case 'area':
      return { state: ask(s, 'sensors: what is the nebula doing?', []), reports: [say('sensors', modelReady(s) ? 'areaKnown' : 'areaLied', vars(s))] };
  }
}

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  return glassDialogue.respond(s, { type: 'speak', to: a.target === 'cruiser' ? 'cruiser' : 'kestrel', text: '', intents: [], topic: undefined, relayed: false } as never, rng);
}

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  if (a.method === 'sensorGhost') return { state: s, reports: [say('xo', 'impNotHere')] };
  if (a.method !== 'other') return { state: s, reports: [say('xo', 'impNotHere')] };
  return { state: act(s, a.description, r), reports: r };
}

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('xo', 'bridgeNotNow')] };
  const r: Report[] = [];
  return { state: ask(s, action.text ?? '', r), reports: r };
}

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome || settled(s)) return out;
  if (!modelReady(s) && !knows(s, 'order')) out.push('Varga, model the nebula');
  if (modelReady(s) && !s.flags.endHome) out.push('Number One, what do you recommend?');
  if (!s.flags.hailedVale) out.push('hail the shuttle');
  if (knows(s, 'locus')) out.push('recover the shuttle crew');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusGlass', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'statusShip', vars(s))] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'areaLied', vars(s))] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') || 'nothing more from the bridge' })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
