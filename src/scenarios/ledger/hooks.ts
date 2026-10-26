/** Scenario-specific meaning of scans, one-shot comm actions, improvised orders, queries and officers' bridge talk for Ghost Ledger. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { knows } from '../../engine/state';
import { ledgerDialogue } from './dialogue';
import { GUESTS, GUEST_SHORT, ledger } from './setup';
import { act, ask, caseVars, cleared, departAt, gm, lieBroken, placedKnown, proven, settled } from './agents';

// ------------------------------------------------------------------ scan ---

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  switch (target) {
    case 'kestrel':
      return { state: s, reports: [say('sensors', 'scanPacket')] };
    case 'cruiser':
      return { state: s, reports: [say('sensors', 'scanCourier')] };
    case 'compartment':
    case 'halcyon': {
      const r: Report[] = [];
      return { state: act(s, 'trace the copy port device', r), reports: r };
    }
    case 'area':
      return { state: s, reports: [say('sensors', 'areaLedger')] };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const text = a.intent === 'warn' || a.intent === 'bluff' ? 'we know about the keys' : '';
  return ledgerDialogue.respond(s, { type: 'speak', to: a.target === 'cruiser' ? 'cruiser' : 'kestrel', text, intents: [], topic: undefined, relayed: false } as never, rng);
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
  if (!knows(s, 'copyTime')) out.push('Varga, when were the keys copied?');
  if (!knows(s, 'doors')) out.push('Rask, pull the door logs');
  if (!knows(s, 'device')) out.push('Varga, what device took the copy?');
  if (!s.flags.watching && !s.flags.blackout) out.push('Szabo, watch all outbound traffic');
  if (!s.flags.rekeyed && !(s.counters.rekeyAt ?? 0)) out.push('Chief, rekey the navigation keys');
  if (proven(s)) {
    out.unshift(`detain ${GUEST_SHORT[ledger(s).culprit]}`);
    if (!s.flags.counterFed) out.push('feed them false keys');
  }
  if (placedKnown(s)) {
    for (const g of GUESTS) {
      if (cleared(s, g)) continue;
      if (!gm(s, g).admitted) out.push(`ask ${GUEST_SHORT[g]} why ${g === 'vesk' || g === 'fosse' ? 'he' : 'she'} left the reception`);
      else if (!gm(s, g).checked) out.push(`check ${GUEST_SHORT[g]}’s story`);
    }
  }
  if (!s.flags.delayed && departAt(s) - s.turn <= 5) out.push('delay the departure');
  out.push('Rask, what do we have?');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return { state: s, reports: [say('xo', 'statusLedger', { ...caseVars(s), departs: Math.max(0, departAt(s) - s.turn), rekeyed: s.flags.rekeyed ? 1 : 0, watching: s.flags.watching ? 1 : 0, blackout: s.flags.blackout ? 1 : 0, broken: lieBroken(s) ? 1 : 0 })] };
    case 'systems':
      return { state: s, reports: [say('engineering', s.flags.rekeyed ? 'keysNew' : 'keysOld')] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'areaLedger')] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') || 'nothing more from the bridge' })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
