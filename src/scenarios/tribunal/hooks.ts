/** Scans, one-shot comms, improvised orders, queries and bridge talk for Tribunal at Kesh Varo. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { tribunalDialogue } from './dialogue';
import { act, ask, medicalReady, settled, vars } from './agents';

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  switch (target) {
    case 'kestrel':
      return { state: s, reports: [say('sensors', 'scanHold')] };
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanTribunal')] };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'statusShip', vars(s))] };
    case 'compartment':
    case 'area':
      return { state: s, reports: [say('sensors', 'scanArea', vars(s))] };
  }
}

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const to = a.target === 'passenger' ? 'passenger' : a.target === 'cruiser' ? 'cruiser' : 'kestrel';
  return tribunalDialogue.respond(s, { type: 'speak', to, text: '', intents: [], topic: undefined, relayed: false } as never, rng);
}

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
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
  if (!s.flags.heardAskel) out.push('hail Askel');
  if (!medicalReady(s) && !(s.counters.examAt ?? 0)) out.push('Osei, prepare a medical brief');
  if (!s.flags.spokeSoth) out.push('hail the tribunal');
  if (medicalReady(s)) out.push('present the medical brief to the magister');
  if (!knows(s, 'custom')) out.push('ask Keeper Dorn about custom');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusTribunal', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'statusShip', vars(s))] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'scanArea', vars(s))] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') || 'nothing more from the bridge' })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
