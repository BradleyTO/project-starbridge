/** Scenario-specific meaning of scans, one-shot comm actions, improvised orders, queries and officers' bridge talk for Corsairs of the Veyl Shoals. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { corsairsDialogue } from './dialogue';
import { act, ask, broken, settled, struck, vars } from './agents';
import { FEIGN } from './words';

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'cruiser':
      return { state: s, reports: [say('sensors', s.flags.gavelHere ? 'scanCruiserDetail' : 'noGavelYet')] };
    case 'kestrel':
    case 'compartment':
      return { state: s, reports: [say('sensors', 'scanKestrelDetail', vars(s))] };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'statusShip', vars(s))] };
    case 'area':
      return { state: ask(s, 'sensors: what is the ground?', r), reports: r };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  return corsairsDialogue.respond(s, { type: 'speak', to: a.target === 'cruiser' ? 'cruiser' : 'kestrel', text: '', intents: [], topic: undefined, relayed: false } as never, rng);
}

// ------------------------------------------------------------ improvise ---

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  // "A false distress signal" reads as a sensor trick to the shared parser; here it is a ruse Szabo refuses.
  if (a.method === 'sensorGhost' && FEIGN.test(a.description.toLowerCase())) return { state: act(s, `comms: ${a.description}`, r), reports: r };
  if (a.method === 'sensorGhost') return { state: act(s, 'engineering: make a sensor ghost', r), reports: r };
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
  if (!knows(s, 'pattern')) out.push('Rask, what are they doing?');
  if (!knows(s, 'terrain')) out.push("Szabo, pull the charts from the beacon");
  if (knows(s, 'pattern') && knows(s, 'terrain') && !broken(s) && !struck(s)) out.push('Number One, what do you recommend?');
  if (!knows(s, 'debt')) out.push('Szabo, listen to their traffic');
  if (broken(s) && !struck(s)) out.push('hail the corsairs');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusCorsairs', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'statusShip', vars(s))] };
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
