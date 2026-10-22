/** Scenario-specific meaning of scans, one-shot comm actions, improvised tactics, queries and Szabo's bridge talk for The Quiet Signal. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { km, range } from '../../engine/rules';
import { knows, patchShip, revealFact, setFlag } from '../../engine/state';
import { GLITCH_KM, quiet } from './setup';
import { GRAMMAR_NAME, answer, answerFor, bm, echo, inGlitch, leanGrammar, ledgerPresent, otherGrammar, question, sendersHere, sm, taskSzabo } from './agents';
import { brennRespond, parseAnswer, sendersRespond } from './dialogue';

/** Detail scan range for the senders' craft (life signs). */
export const DETAIL_KM = 30000;

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'halcyon':
      return query(s, 'systems');
    case 'compartment':
    case 'kestrel': {
      if (!sendersHere(s)) return { state: s, reports: [say('sensors', 'sendersGoneScan')] };
      const fresh = !knows(s, 'pulsar_timing');
      s = revealFact(s, 'pulsar_timing');
      const d = range(s, 'halcyon', 'kestrel');
      const close = d <= DETAIL_KM;
      if (close) {
        s = revealFact(s, 'courier_crewed');
        s = patchShip(s, 'kestrel', { scanLevel: 2, disposition: 'neutral' });
      } else s = patchShip(s, 'kestrel', { scanLevel: Math.max(1, s.ships.kestrel.scanLevel) });
      r.push(say('sensors', 'scanSenders', { fresh: fresh ? 1 : 0, close: close ? 1 : 0, km: km(d), need: km(DETAIL_KM), tasked: s.flags.szaboOnIt ? 1 : 0 }));
      return { state: s, reports: r };
    }
    case 'cruiser': {
      if (!ledgerPresent(s)) return { state: s, reports: [say('sensors', 'noContact', { target: 'cruiser' })] };
      s = revealFact(s, 'ledger_identity');
      s = patchShip(s, 'cruiser', (c) => ({ scanLevel: 2, disposition: c.disposition === 'unknown' ? 'neutral' : c.disposition }));
      r.push(say('sensors', 'scanLedger', { km: km(range(s, 'halcyon', 'cruiser')), hull: s.ships.cruiser.hull }));
      return { state: s, reports: r };
    }
    case 'area':
      return { state: s, reports: [say('sensors', 'areaSweepQuiet', { senders: sendersHere(s) ? km(range(s, 'halcyon', 'kestrel')) : 'gone', ledger: ledgerPresent(s) ? km(range(s, 'halcyon', 'cruiser')) : 'gone' })] };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;
const SPEAK_FROM: Record<Comm['intent'], string> = {
  open: 'greet',
  ask: 'ask',
  humanitarian: 'humanitarian',
  legal: 'legal',
  reassure: 'declarePeaceful',
  warn: 'warn',
  bluff: 'bluff',
  trade: 'trade',
  appeal: 'appeal',
  offerAsylum: 'offerAsylum',
};

/** A one-shot message (no open channel): handled by the same dialogue logic as a spoken line. */
function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const line = { type: 'speak' as const, to: a.target === 'cruiser' ? ('cruiser' as const) : ('kestrel' as const), text: '', intents: [SPEAK_FROM[a.intent]] as never, topic: undefined, relayed: false };
  return a.target === 'cruiser' ? brennRespond(s, line, rng) : sendersRespond(s, line, rng);
}

// ------------------------------------------------------------ improvise ---

const DISH = /\b(dish|dishes|array|antenna|receiver|deflector|aerial|listening|amplif\w*|gain)\b/;

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  switch (a.method) {
    case 'sensorGhost':
      r.push(say('sensors', 'impSensorGhostQuiet'));
      break;
    case 'plasmaVent':
      r.push(say('tactical', 'impPlasmaVentQuiet'));
      break;
    case 'tractorShield':
    case 'shieldExtend':
      r.push(say('tactical', 'impShieldQuiet'));
      break;
    case 'ejectCore':
      r.push(say('engineering', 'impEjectCoreQuiet'));
      break;
    case 'other': {
      const d = a.description.toLowerCase();
      if (DISH.test(d)) {
        if (s.flags.dishRigged) r.push(say('engineering', 'dishAlready'));
        else {
          s = setFlag(s, 'dishRigged');
          r.push(say('engineering', 'dishRigged', { tasked: s.flags.szaboOnIt ? 1 : 0 }));
        }
      } else r.push(say('engineering', 'impOther', { description: a.description.slice(0, 80) }));
      break;
    }
  }
  return { state: s, reports: r };
}

// ------------------------------------------------------- Szabo on the bridge ---

const COMMS_OFFICER = /\b(szabo|mirela|comms?|communications?|lieutenant|kerr)\b/;
const TOPIC = /\b(code|signal|pattern|pulses?|senders?|question|answer|message|think|assessment|progress|status|how close|lean|sure|confident|trust|options?|guess|ready|decod\w*|crack\w*|work|reading|readings|grammar|meaning|mean)\b/;
const ECHO = /\b(echo|mirror|repeat (it|their|the|that)|send (it|their \w+|the \w+|that) back|play (it|their \w+|the \w+) back|back to them)\b/;

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('sensors', 'bridgeSurveyBusy')] };
  const who = (action.officer ?? '').toLowerCase();
  const t = (action.text ?? '').toLowerCase();
  if (!COMMS_OFFICER.test(who)) return { state: s, reports: [] };
  const r: Report[] = [];
  if (!sendersHere(s)) return { state: s, reports: [say('comms', 'szaboNoSenders')] };
  if (s.flags.misread || s.flags.silent) return { state: s, reports: [say('comms', 'szaboNoAnswer')] };
  const n = /\b(send|transmit|answer|reply|tell|give|pulse|try)\b/.test(t) ? parseAnswer(t) : null;
  if (n !== null && question(s) < 2) {
    s = taskSzabo(s);
    r.push(say('comms', 'szaboSends', { n, sure: knows(s, 'grammar_known') ? 2 : knows(s, 'partial_decode') ? 1 : 0 }));
    s = answer(s, n, 'halcyon', r);
    return { state: s, reports: r };
  }
  if (ECHO.test(t)) {
    s = taskSzabo(s);
    s = echo(s, r);
    return { state: s, reports: r };
  }
  if (!TOPIC.test(t)) return { state: s, reports: [] };
  const was = !!s.flags.szaboOnIt;
  s = taskSzabo(s);
  return { state: s, reports: [assessment(s, was)] };
}

/** Szabo's honest read of where the decode stands. */
export function assessment(s: WorldState, wasTasked = true): Report {
  const v = quiet(s);
  const q = question(s);
  if (q >= 2) return say('comms', knows(s, 'senders_intent') ? `szaboMessage_${v.intent}` : 'szaboMessageComing', { joint: bm(s).joint ? 1 : 0 });
  const left = Math.max(0, (sm(s).deadline ?? 0) - s.turn);
  if (knows(s, 'grammar_known')) return say('comms', 'szaboAssessFull', { grammar: GRAMMAR_NAME[v.grammar], answer: answerFor(v.grammar, q), q, left });
  if (knows(s, 'partial_decode')) return say('comms', 'szaboAssessPartial', { lean: GRAMMAR_NAME[leanGrammar(s)], a: answerFor(leanGrammar(s), q), other: GRAMMAR_NAME[otherGrammar(s)], b: answerFor(otherGrammar(s), q), q, left });
  return say('comms', wasTasked ? 'szaboAssessNone' : 'szaboStarts', { left });
}

// ---------------------------------------------------------------- query ---

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome) return out;
  const q = question(s);
  if (sendersHere(s) && !s.flags.szaboOnIt) out.push('Szabo, work on the code');
  if (sendersHere(s) && !knows(s, 'pulsar_timing')) out.push('scan the pulsar');
  if (sendersHere(s) && s.flags.szaboOnIt && !s.flags.dishRigged && !knows(s, 'grammar_known')) out.push('use the main dish as a receiver');
  if (ledgerPresent(s) && !bm(s).hailed) out.push('hail the Directorate ship');
  if (q < 2 && knows(s, 'grammar_known')) out.push(`Szabo, send them ${answerFor(quiet(s).grammar, q)}`);
  else if (q < 2 && s.flags.szaboOnIt && !sm(s).echoed && (sm(s).deadline ?? 0) - s.turn <= 2) out.push('Szabo, echo their question back to them');
  if (q < 2 && s.flags.szaboOnIt && !knows(s, 'grammar_known')) out.push('Szabo, how close are you?');
  if (knows(s, 'senders_intent') && quiet(s).intent === 'warning') {
    if (ledgerPresent(s)) out.push('warn the Cantor about the glitch');
    if (inGlitch(s, 'halcyon')) out.push(`open the range to ${km(GLITCH_KM + 20000)} from the pulsar`);
  }
  return out.slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  const h = s.ships.halcyon;
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status': {
      const q = question(s);
      return {
        state: s,
        reports: [
          say('xo', 'statusReportQuiet', {
            hull: h.hull,
            shields: h.shields.raised ? `up (${h.shields.strength}%)` : `down (${h.shields.strength}%)`,
            weapons: h.weapons.state,
            jump: h.jump.charge,
            senders: sendersHere(s) ? km(range(s, 'halcyon', 'kestrel')) : 'gone',
            ledger: ledgerPresent(s) ? km(range(s, 'halcyon', 'cruiser')) : 'gone',
            exchange: s.flags.misread || s.flags.silent ? 'ended' : q >= 2 ? 'message phase' : `question ${q + 1} of 2, ${Math.max(0, (sm(s).deadline ?? 0) - s.turn)} min left`,
            decode: knows(s, 'grammar_known') ? 'complete' : knows(s, 'partial_decode') ? 'partial (two readings)' : s.flags.szaboOnIt ? 'in progress' : 'not started',
          }),
        ],
      };
    }
    case 'systems':
      return { state: s, reports: [say('engineering', 'systemsReport')] };
    case 'contacts':
      return { state: s, reports: [say('sensors', 'contactsReport')] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
