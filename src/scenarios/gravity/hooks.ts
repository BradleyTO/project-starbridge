/** Scans, one-shot comms, improvised orders, queries and bridge talk for Gravity's Edge. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { act, aaltoRespond, ask, depth, settled, vars } from './agents';

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  switch (target) {
    case 'kestrel':
      return { state: s, reports: [say('sensors', s.flags.probeReleased ? (s.flags.probeLost ? 'probeGone' : 'probeStatus') : 'probeTethered', vars(s))] };
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanObservatory', vars(s))] };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'gaugeReport', vars(s))] };
    case 'compartment':
    case 'area':
      return { state: s, reports: [say('sensors', 'scanArea', vars(s))] };
  }
}

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, _rng: Rng): Applied {
  const r: Report[] = [];
  if (a.target === 'cruiser' || a.target === 'all') return { state: aaltoRespond(s, '', r), reports: r };
  return { state: s, reports: [say('comms', 'probeNoVoice')] };
}

/** Improvised ideas: the captain's own words go to the scenario; the stock tricks get an honest answer. */
function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  if (a.method === 'other') return { state: act(s, a.description, r), reports: r };
  const key = a.method === 'shieldExtend' || a.method === 'tractorShield' ? 'impShield' : a.method === 'ejectCore' ? 'impEject' : 'impNotHere';
  return { state: s, reports: [say(key === 'impNotHere' ? 'xo' : 'engineering', key)] };
}

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('xo', 'bridgeNotNow')] };
  const r: Report[] = [];
  return { state: ask(s, action.text ?? '', r), reports: r };
}

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome || settled(s) || s.flags.clear) return out;
  if (s.flags.withdrawing) return ['status'];
  if (depth(s) < 2) out.push('take us deeper');
  if (!s.flags.relayOrdered) out.push('Szabo, relay our data to the observatory');
  if (s.flags.soundGroan && !knows(s, 'feel')) out.push('Chief, how does she feel?');
  else if (!s.flags.listening) out.push('Chief, listen to the frame');
  if (!s.flags.reinforced) out.push('Chief, reinforce the frame');
  if (s.flags.soundCrack) out.push('take us out');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusGravity', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'gaugeReport', vars(s))] };
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
