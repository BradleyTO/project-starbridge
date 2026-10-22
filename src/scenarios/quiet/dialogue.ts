/**
 * Offline, deterministic DialogueProvider for The Quiet Signal.
 *
 * The senders do not speak: they understand an answer (a number in their grammar, or the name
 * of the shape or element it stands for), their own question sent back to them, and, once
 * their message has arrived, the shape of a reply. Lt. Szabo does the encoding, and says so
 * when the captain's words cannot be put into their code.
 *
 * Signals Director Brenn (Cantor) is persuaded according to her seeded temperament:
 * a scholar works with the ISA and holds when asked; a rival shares only for a share (the
 * Halcyon needs something to trade) and holds only for a reason; a hardliner takes whatever
 * she is given and answers first, and believes a warning only with the decode behind it.
 */
import type { DialogueProvider, SpeakAction } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, say as crew } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { Party } from '../../engine/schema';
import type { CommsPromise, WorldState } from '../../engine/types';
import { closeChannel, promise, recordLine } from '../../engine/comms';
import { addTension, adjustTrust, knows, revealFact, setFlag, setMemory } from '../../engine/state';
import { advanceDecode, answer, bm, echo, ledgerLeaves, ledgerPresent, question, sendersHere, sm, strike, taskSzabo } from './agents';
import { FULL_AT, PARTIAL_AT, quiet } from './setup';

const ECHO = /\b(echo|mirror|repeat (it|their|the|that)|send (it|their \w+|the \w+|that) back|play (it|their \w+|the \w+) back|return their (signal|pattern|question)|back to them)\b/;
const DECODE = /\b(decod\w*|crack\w*|analy[sz]\w*|work (on|out|it)|figure|translat\w*|what (does|do|is) (it|they|this|that) (say|mean|want|asking)|interpret\w*|break (it|the code))\b/;
const FAREWELL = /\b(goodbye|good-?bye|farewell|safe (journey|travels?|voyage)|travel (well|safely)|go in peace|thank(s| you)|we hear you|heard|acknowledg\w*|understood|message received|received|bye|so long|until we meet)\b/;
const FRIENDLY = /\b(hello|greetings?|welcome|peace(ful)?|friends?|we are|we come|glad|pleased|meet|hi|hail)\b/;
const GLITCH = /\b(glitch\w*|danger\w*|hazard\w*|get (clear|away|out)|leave|clear (of|out)|move away|pull back|evacuat\w*|jump (away|out|clear)|warning|starquake|pulsar)\b/;
const JOINT = /\b(together|cooperat\w*|joint\w*|share|sharing|pool|combine|compare|collaborat\w*|our (decode|data|work|findings|reading)|send (you|over)|work with)\b/;
const DATA = /\b(decode|data|proof|evidence|findings|transcript|recording|our work|show you|send (you|it))\b/;
const HOLD = /\b(hold|wait|don'?t (answer|transmit|send|reply|respond)|stop transmitting|hold off|stand ?by|give (us|me) (time|a minute|a moment|two minutes)|not yet|refrain)\b/;
const WRONG = /\b(wrong|mistaken|incorrect|bad decode|wrong grammar|misread\w*|you'?ll (get it|be) wrong|error)\b/;
const WHO = /\b(who are you|what do you want|why are you here|what are you doing|your (intentions|mission|orders)|identify)\b/;

// ------------------------------------------------------------- answers ---

const UNITS: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50 };
/** The objects an answer can name (the grammar's own words). */
const NAMED: Record<string, number> = { hexagon: 6, hexagonal: 6, dodecahedron: 12, dodecagon: 12, beryllium: 4, carbon: 6, triangle: 3, square: 4, cube: 6, pentagon: 5, hydrogen: 1, helium: 2, lithium: 3, boron: 5, nitrogen: 7, oxygen: 8, icosahedron: 20, octahedron: 8, tetrahedron: 4 };
const FILLER = /\b(transmit|send|sending|them|the|answer|answers|is|it'?s|its|reply|respond|with|number|numbers|to|senders?|back|pulse|pulses|our|say|tell|a|an|groups?|of|please|lieutenant|szabo|now|go|ahead|and|that|this|signal|value|figure|code|try|guess|i think|we think|element|shape|atomic|protons?|sides|corners|faces)\b|[.,!?;:'"]/g;

/** A bare answer ("13", "thirteen", "thirty-one", "send them a hexagon"), or null for anything else. */
export function parseAnswer(text: string): number | null {
  const t = text.toLowerCase().replace(/-/g, ' ').replace(FILLER, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (/^\d{1,3}$/.test(t)) return Number(t);
  if (t in NAMED) return NAMED[t];
  if (t in UNITS) return UNITS[t];
  if (t in TENS) return TENS[t];
  const m = /^(twenty|thirty|forty|fifty) (one|two|three|four|five|six|seven|eight|nine)$/.exec(t);
  if (m) return TENS[m[1]] + UNITS[m[2]];
  return null;
}

// ------------------------------------------------------------- helpers ---

function line(s: WorldState, party: 'kestrel' | 'cruiser', key: string, vars: Record<string, string | number> = {}): { state: WorldState; report: Report } {
  return { state: recordLine(s, { from: party, intents: [], text: key }), report: comms(party === 'cruiser' ? 'brenn' : 'senders', key, vars) };
}

const progress = (s: WorldState) => (knows(s, 'grammar_known') ? 2 : knows(s, 'partial_decode') ? 1 : 0);

// ------------------------------------------------------------- senders ---

export function sendersRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const I = new Set<string>(a.intents);
  const t = (a.text ?? '').toLowerCase();
  const v = quiet(s);
  const done = (): Applied => ({ state: s, reports: r });
  if (!sendersHere(s)) return { state: closeChannel(s, 'kestrel'), reports: [crew('comms', 'szaboNoSenders')] };
  if (s.flags.misread || s.flags.silent) {
    r.push(crew('comms', 'szaboNoAnswer'));
    return done();
  }
  if (!sm(s).hailed) {
    s = setMemory(s, 'senders', 'hailed', 1);
    s = taskSzabo(s);
  }
  const q = question(s);
  if (q < 2) {
    if (ECHO.test(t)) {
      s = taskSzabo(s);
      s = echo(s, r);
      return done();
    }
    const n = parseAnswer(t);
    if (n !== null) {
      r.push(crew('comms', 'szaboSends', { n, sure: progress(s) }));
      s = answer(s, n, 'halcyon', r);
      return done();
    }
    if (DECODE.test(t) || !t) {
      s = taskSzabo(s);
      r.push(crew('comms', 'szaboWorking', { p: progress(s), need: Math.max(0, (progress(s) ? FULL_AT : PARTIAL_AT) - (s.counters.decode ?? 0)) }));
      return done();
    }
    if (I.has('warn') || I.has('bluff') || I.has('demand') || I.has('challenge')) r.push(crew('comms', 'szaboWontThreaten'));
    else r.push(crew('comms', 'szaboNeedsNumber', { p: progress(s) }));
    return done();
  }
  // The message phase.
  if (!knows(s, 'senders_intent')) {
    r.push(crew('comms', 'szaboMessageComing'));
    return done();
  }
  if (v.intent === 'warning') {
    r.push(crew('comms', 'szaboWarningNoReply'));
    return done();
  }
  if (sm(s).replied) {
    r.push(crew('comms', 'szaboAlreadyReplied'));
    return done();
  }
  const hostile = I.has('warn') || I.has('bluff') || I.has('demand') || I.has('challenge') || I.has('refuse');
  if (hostile) {
    r.push(crew('comms', 'szaboEncodesThreat'));
    s = strike(s, 'threat', r);
    return done();
  }
  const bye = I.has('end') || FAREWELL.test(t);
  const hello = I.has('greet') || I.has('declarePeaceful') || I.has('offerCooperation') || I.has('agree') || I.has('humanitarian') || I.has('requestAssist') || FRIENDLY.test(t);
  if (v.intent === 'farewell' && bye) {
    s = setMemory(s, 'senders', 'replied', 1);
    s = setFlag(s, 'farewell');
    r.push(crew('comms', 'szaboEncodesFarewell'));
    r.push(comms('senders', 'sendersFarewell'));
    return done();
  }
  if (v.intent === 'greeting' && hello && !(I.has('end') && !FRIENDLY.test(t))) {
    s = setMemory(s, 'senders', 'replied', 1);
    s = setFlag(s, 'contact');
    r.push(crew('comms', 'szaboEncodesGreeting', { joint: bm(s).joint ? 1 : 0 }));
    r.push(comms('senders', 'sendersContact', { joint: bm(s).joint ? 1 : 0 }));
    return done();
  }
  // The wrong shape of reply: once is a misstep, twice and they leave.
  const pressed = (sm(s).pressed ?? 0) + 1;
  s = setMemory(s, 'senders', 'pressed', pressed);
  if (pressed >= 2) {
    s = setFlag(s, 'silent');
    r.push(comms('senders', 'sendersSilent'));
    return done();
  }
  r.push(crew('comms', `szaboWrongShape_${v.intent}`));
  return done();
}

// --------------------------------------------------------------- Brenn ---

function brennBelievesWarning(s: WorldState, withData: boolean): boolean {
  const v = quiet(s);
  if (bm(s).joint || bm(s).given || withData) return true;
  if (v.director === 'scholar') return true;
  if (v.director === 'rival') return !s.flags.lockedOnCruiser && !s.flags.shotsFired;
  return false;
}

export function brennRespond(s: WorldState, a: SpeakAction, _rng: Rng): Applied {
  const r: Report[] = [];
  const I = new Set<string>(a.intents);
  const t = (a.text ?? '').toLowerCase();
  const v = quiet(s);
  const add = (key: string, vars: Record<string, string | number> = {}) => {
    const l = line(s, 'cruiser', key, vars);
    s = l.state;
    r.push(l.report);
  };
  const done = (): Applied => ({ state: s, reports: r });
  if (!ledgerPresent(s)) return { state: closeChannel(s, 'cruiser'), reports: [] };
  if (I.has('end')) {
    add('brennEnd');
    return { state: closeChannel(s, 'cruiser'), reports: r };
  }
  const talks = (bm(s).talks ?? 0) + 1;
  s = setMemory(s, 'brenn', 'talks', talks);
  if (!bm(s).hailed) {
    s = setMemory(s, 'brenn', 'hailed', 1);
    s = revealFact(s, 'ledger_identity');
    add('brennFirst', { director: v.director });
    return done();
  }
  if (talks >= 3) s = revealFact(s, 'director_temperament');
  if (a.promise) s = promise(s, 'cruiser', a.promise).state;
  const warningKnown = knows(s, 'senders_intent') && v.intent === 'warning';
  const withData = DATA.test(t) || JOINT.test(t);

  const num = parseAnswer(t);
  if (num !== null) {
    // A bare answer is for the senders: Szabo sends it on their band, not to the Ledger.
    if (question(s) < 2 && sendersHere(s) && !s.flags.misread && !s.flags.silent) {
      r.push(crew('comms', 'szaboWrongChannel', { n: num }));
      s = answer(s, num, 'halcyon', r);
      return done();
    }
    add('brennNotRelay');
    return done();
  }
  if (warningKnown && (GLITCH.test(t) || I.has('warn'))) {
    s = setFlag(s, 'warnedLedger');
    s = setMemory(s, 'brenn', 'warned', 1);
    if (brennBelievesWarning(s, withData)) {
      if (withData) s = setMemory(s, 'brenn', 'given', 1);
      add('brennHeedsWarning', { director: v.director });
      s = ledgerLeaves(s, r);
    } else add('brennDoubtsWarning');
    return done();
  }
  if (GLITCH.test(t) && /\b(glitch|danger|hazard|warning)\b/.test(t)) {
    add('brennWarnWhat');
    return done();
  }
  if (I.has('warn') || I.has('bluff') || I.has('demand') || I.has('challenge')) {
    s = adjustTrust(s, 'brenn', -10);
    s = addTension(s, 5);
    if (v.director !== 'scholar' && !bm(s).joint && !bm(s).holding) s = setMemory(s, 'brenn', 'nextAt', Math.min(bm(s).nextAt ?? 99, s.turn + 1));
    add('brennThreatened', { director: v.director });
    return done();
  }
  if (JOINT.test(t) || I.has('offerCooperation') || I.has('trade')) {
    s = setFlag(s, 'jointOffered');
    if (bm(s).joint) {
      add('brennAlreadyJoint');
      return done();
    }
    const haveSomething = knows(s, 'partial_decode') || knows(s, 'grammar_known');
    if (v.director === 'hardliner') {
      if (!haveSomething) {
        add('brennJointRefuse');
        return done();
      }
      s = setMemory(s, 'brenn', 'took', 1);
      s = setMemory(s, 'brenn', 'given', 1);
      s = setMemory(s, 'brenn', 'nextAt', s.turn + 1);
      s = setFlag(s, 'ledgerTookData');
      add('brennTakesData');
      if (bm(s).warned && warningKnown) s = ledgerLeaves(s, r);
      return done();
    }
    if (v.director === 'rival' && !haveSomething) {
      add('brennJointNothing');
      return done();
    }
    s = setMemory(s, 'brenn', 'joint', 1);
    s = setMemory(s, 'brenn', 'given', 1);
    s = setFlag(s, 'jointDecode');
    s = adjustTrust(s, 'brenn', 20);
    add(`brennJoint_${v.director}`, { q: question(s) });
    if (!knows(s, 'grammar_known')) s = advanceDecode(s, 2, r);
    if (warningKnown) s = ledgerLeaves(s, r);
    return done();
  }
  if (HOLD.test(t) || WRONG.test(t) || a.demand === 'standBy' || a.demand === 'holdFire') {
    if (bm(s).holding) {
      add('brennAlreadyHolding');
      return done();
    }
    const reason = WRONG.test(t) && knows(s, 'director_wrong');
    if (v.director === 'scholar' || (v.director === 'rival' && reason)) {
      s = setMemory(s, 'brenn', 'holding', 1);
      s = setFlag(s, 'ledgerHolding');
      add(reason ? 'brennHoldsWrong' : 'brennHolds', { director: v.director });
      return done();
    }
    if (v.director === 'rival' && !bm(s).delayed) {
      s = setMemory(s, 'brenn', 'delayed', 1);
      s = setMemory(s, 'brenn', 'nextAt', Math.max(bm(s).nextAt ?? 0, s.turn) + 2);
      add('brennDelays', { wrong: WRONG.test(t) ? 1 : 0 });
      return done();
    }
    add('brennRefusesHold', { wrong: WRONG.test(t) ? 1 : 0, director: v.director });
    return done();
  }
  if (WHO.test(t) || I.has('ask')) {
    s = revealFact(s, 'director_temperament');
    add(`brennExplains_${v.director}`);
    return done();
  }
  if (DECODE.test(t)) {
    add('brennDecodeTalk', { director: v.director });
    return done();
  }
  if (I.has('greet') || I.has('declarePeaceful')) {
    add('brennCourteous');
    return done();
  }
  add('brennUnclear');
  return done();
}

// ------------------------------------------------------------- provider ---

const lead = (party: Party) => (party === 'cruiser' ? 'cruiser' : 'kestrel');

export const quietDialogue: DialogueProvider = {
  id: 'quiet-offline',
  speakerName(s, party) {
    if (lead(party) === 'cruiser') return knows(s, 'ledger_identity') ? 'Signals Director Brenn' : 'the Directorate signals ship';
    return 'the senders';
  },
  vesselName(s, party) {
    return lead(party) === 'cruiser' ? s.ships.cruiser.name : s.ships.kestrel.name;
  },
  greet(s, party, rng) {
    const p = lead(party);
    if (p === 'cruiser') {
      if (!bm(s).hailed) return brennRespond(s, { type: 'speak', to: 'cruiser', text: '', intents: ['greet'], relayed: false } as SpeakAction, rng);
      const l = line(s, 'cruiser', 'brennGreetAgain', { holding: bm(s).holding || bm(s).joint ? 1 : 0 });
      return { state: l.state, reports: [l.report] };
    }
    if (!sendersHere(s)) return { state: s, reports: [crew('comms', 'szaboNoSenders')] };
    const first = !sm(s).hailed;
    s = setMemory(s, 'senders', 'hailed', 1);
    s = taskSzabo(s);
    return { state: s, reports: [crew('comms', first ? 'szaboOpensBand' : 'szaboBandAgain', { p: progress(s), q: question(s) })] };
  },
  respond(s, a, rng) {
    return lead(a.to) === 'cruiser' ? brennRespond(s, a, rng) : sendersRespond(s, a, rng);
  },
  onPromiseBroken(s: WorldState, p: CommsPromise): Applied {
    if (lead(p.party) !== 'cruiser' || !ledgerPresent(s)) return { state: s, reports: [] };
    s = adjustTrust(s, 'brenn', -15);
    const l = line(s, 'cruiser', 'brennWordBroken', { kind: p.kind });
    return { state: l.state, reports: [l.report] };
  },
};
