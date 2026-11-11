/** Scans, one-shot comms, improvised orders, queries and bridge talk for The Ninefold Lock. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows, setCounter } from '../../engine/state';
import { act, ask, candidates, inside, kaminskiRespond, kovarRespond, range, settled, vars } from './agents';

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  switch (target) {
    case 'kestrel': {
      // An active scan of the depot is an emission, whatever range it is made from.
      s = setCounter(s, 'pingAt', s.turn);
      if (s.flags.promisedNoScan) s = { ...s, flags: { ...s.flags, brokeNoScan: true } };
      if (range(s) >= 1) s = { ...s, flags: { ...s.flags, pingedInReach: true } };
      return { state: s, reports: [say('sensors', range(s) === 2 ? 'scanDepotClose' : 'scanDepotFar', vars(s))] };
    }
    case 'cruiser':
      return { state: s, reports: [say('sensors', s.ships.cruiser.detected ? 'scanCutter' : 'cutterNone')] };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'hullReport', { hull: s.ships.halcyon.hull, hits: s.counters.hits ?? 0 })] };
    case 'compartment':
    case 'area':
      return { state: s, reports: [say('sensors', 'scanArea', vars(s))] };
  }
}

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, _rng: Rng): Applied {
  const r: Report[] = [];
  if (a.target === 'cruiser') return { state: kovarRespond(s, '', r), reports: r };
  if (a.target === 'kestrel') return { state: kaminskiRespond(s, '', r), reports: r };
  if (a.target === 'all') {
    s = kaminskiRespond(s, '', r);
    if (s.ships.cruiser.detected) s = kovarRespond(s, '', r);
    return { state: s, reports: r };
  }
  return { state: s, reports: [say('comms', 'noPassenger')] };
}

/** Improvised ideas: the captain's own words go to the scenario; the stock tricks get an honest answer. */
function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  if (a.method === 'other') return { state: act(s, a.description, r), reports: r };
  const key = a.method === 'shieldExtend' || a.method === 'tractorShield' ? 'impShield' : a.method === 'sensorGhost' ? 'impGhost' : 'impNotHere';
  return { state: s, reports: [say(key === 'impNotHere' ? 'xo' : 'tactical', key)] };
}

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('xo', 'bridgeNotNow')] };
  const r: Report[] = [];
  return { state: ask(s, action.text ?? '', r), reports: r };
}

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome || settled(s) || !inside(s)) return out;
  if (s.flags.kovarOwn) return ['beam them out', 'status'];
  if (!s.flags.spokeKaminski) out.push('hail Lieutenant Kaminski');
  if (!knows(s, 'doctrine')) out.push('Rask, what is this thing?');
  if (!knows(s, 'log')) out.push("Szabo, pull the Pipit's log");
  if (candidates(s).length > 1 && !s.flags.watchDead && !s.flags.freed) out.push('Rask, what sets off the Watch?');
  if (!s.flags.watchingScreen && !s.flags.freed) out.push('Varga, watch the screen');
  if (knows(s, 'cycle') && !s.counters.beamAt && range(s) === 2) out.push('beam them out at the next gap');
  if (knows(s, 'question')) out.push('Rask, what does the keystone want?');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusNine', vars(s))] };
    case 'systems':
      return { state: s, reports: [say('engineering', 'hullReport', { hull: s.ships.halcyon.hull, hits: s.counters.hits ?? 0 })] };
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
