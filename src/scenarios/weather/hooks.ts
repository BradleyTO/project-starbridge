/** Scans, one-shot comms, improvised orders, queries and bridge talk for The Weather Engine. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { weatherDialogue } from './dialogue';
import { act, ask, lockRead, maritRespond, running, settled, vars } from './agents';

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  switch (target) {
    case 'kestrel':
      return { state: s, reports: [say('sensors', s.ships.kestrel.souls > 0 ? 'scanStation' : 'scanStationEmpty', vars(s))] };
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanHall', vars(s))] };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'statusShip', vars(s))] };
    case 'compartment':
    case 'area':
      return { state: s, reports: [say('sensors', knows(s, 'forecast') ? 'scanAreaForecast' : 'scanArea', vars(s))] };
  }
}

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  if (a.target === 'passenger') {
    // Marit Quarrie is reached over the colony net, in person (no channel session).
    const r: Report[] = [say('comms', 'relayMarit')];
    return { state: maritRespond(s, '', r), reports: r };
  }
  const to = a.target === 'cruiser' ? 'cruiser' : 'kestrel';
  return weatherDialogue.respond(s, { type: 'speak', to, text: '', intents: [], topic: undefined, relayed: false } as never, rng);
}

/** Improvised ideas: the captain's own words go to the scenario; the stock tricks get an honest answer. */
function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  if (a.method === 'other') return { state: act(s, a.description, r), reports: r };
  const key = a.method === 'sensorGhost' ? 'impGhost' : a.method === 'shieldExtend' || a.method === 'tractorShield' ? 'impShield' : 'impNotHere';
  return { state: s, reports: [say(key === 'impNotHere' ? 'xo' : 'engineering', key)] };
}

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('xo', 'bridgeNotNow')] };
  const r: Report[] = [];
  return { state: ask(s, action.text ?? '', r), reports: r };
}

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome || settled(s)) return out;
  if (!lockRead(s) && !(s.counters.lockAt ?? 0)) out.push('Szabo, read the lock');
  if (!knows(s, 'forecast') && !(s.counters.forecastAt ?? 0)) out.push('Varga, forecast the storm');
  if (lockRead(s) && !s.flags.candidate && !(s.counters.workAt ?? 0)) out.push('Szabo, work the cipher');
  if (s.flags.candidate && !running(s) && !s.flags.lockedOut) out.push('enter the key');
  if (!s.flags.shelterOrdered) out.push('order the colony to shelter');
  if (!s.flags.maritHailed) out.push('hail Marit');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusWeather', vars(s))] };
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
