/** Scenario-specific meaning of scans, one-shot comm actions, improvised orders, queries and officers' bridge talk for The Lantern Drift. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { lanternDialogue } from './dialogue';
import { lantern } from './setup';
import { act, ask, believedFailing, consent, settled, st, triageOrder, vars, ASLEEP } from './agents';

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'kestrel':
    case 'compartment':
      return { state: act(s, 'thermal scan of the cryo banks', r), reports: r };
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanTug', vars(s))] };
    case 'halcyon':
      return { state: s, reports: [say('sensors', 'scanHalcyon')] };
    case 'area':
      return { state: s, reports: [say('sensors', 'areaLantern')] };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const text = a.intent === 'warn' ? 'stand off, there are living people aboard' : '';
  return lanternDialogue.respond(s, { type: 'speak', to: a.target === 'cruiser' ? 'cruiser' : 'kestrel', text, intents: [], topic: undefined, relayed: false } as never, rng);
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
  const v = lantern(s);
  if (!knows(s, 'thermal')) out.push('Varga, scan the cryo banks');
  if (!s.flags.leave) out.push('ask the custodian for leave to board');
  else if (!s.flags.assessed && !(s.counters.assessAt ?? 0)) out.push('Dr. Osei, assess the sleepers');
  if (!consent(s)) out.push(v.temperament === 'grieving' ? 'tell the custodian not all of them will live' : 'tell the custodian what we have found');
  if (s.flags.assessed && consent(s) && triageOrder(s).some((b) => st(s, b) === ASLEEP)) out.unshift('Doctor, wake them in your triage order');
  else if (!s.flags.assessed && consent(s) && believedFailing(s).length) out.push('wake the failing banks');
  if (consent(s) && !s.flags.powerHeld && !(s.counters.powerAt ?? 0)) out.push('Chief, run a power line to the banks');
  if (!s.flags.licenceChecked && !s.flags.stoodOff) out.push('Szabo, check the salvor’s licence');
  if (!s.flags.stoodOff) out.push('tell the tug there are living people aboard');
  if (!s.flags.speakerKnown) out.push('who speaks for the sleepers?');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusLantern', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'systemsLantern', vars(s))] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'areaLantern')] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') || 'nothing more from the bridge' })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
