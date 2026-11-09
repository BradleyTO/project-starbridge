/** Scans, one-shot comms, improvised orders, queries and bridge talk for Hollow Crown. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows, revealFact } from '../../engine/state';
import { hollowDialogue } from './dialogue';
import { act, ask, neutralised, rookRespond, settled, surrendering, vars } from './agents';
import { hollow } from './setup';

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  switch (target) {
    case 'kestrel': {
      // A boosted sweep reaches the core: the charge, or its absence.
      if (s.ships.halcyon.systems.sensors.power >= 125) {
        const accomplice = hollow(s).impostor === 'accomplice';
        s = revealFact(s, accomplice ? 'charge' : 'nocharge');
        return { state: s, reports: [say('sensors', 'scanRelay', vars(s)), say('sensors', accomplice ? 'scanCharge' : 'scanNoCharge', vars(s))] };
      }
      return { state: s, reports: [say('sensors', 'scanRelay', vars(s))] };
    }
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanHouse', vars(s))] };
    case 'halcyon':
      return { state: s, reports: [say('engineering', 'statusShip', vars(s))] };
    case 'compartment':
    case 'area':
      return { state: s, reports: [say('sensors', 'scanArea', vars(s))] };
  }
}

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  if (a.target === 'passenger') {
    const r: Report[] = [say('comms', 'relayRook')];
    return { state: rookRespond(s, '', r), reports: r };
  }
  const to = a.target === 'cruiser' ? 'cruiser' : 'kestrel';
  return hollowDialogue.respond(s, { type: 'speak', to, text: '', intents: [], topic: undefined, relayed: false } as never, rng);
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
  if (s.outcome || settled(s) || surrendering(s)) return out;
  if (!s.flags.spokeMallory) out.push('hail the relay');
  if (!knows(s, 'condition') && !(s.counters.assessAt ?? 0)) out.push('Doctor, assess the governor');
  if (!knows(s, 'impostor') && !(s.counters.rosterAt ?? 0)) out.push('Szabo, check the duty roster');
  if (knows(s, 'impostor') && !neutralised(s) && !knows(s, 'charge') && !knows(s, 'agent')) out.push('scan the relay core');
  if (!s.flags.spokeStannard) out.push('hail Government House');
  out.push('status');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusHollow', vars(s))] };
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
