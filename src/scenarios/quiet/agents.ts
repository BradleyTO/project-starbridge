/**
 * Independent agents and world events for The Quiet Signal. Runs once per simulated minute
 * after the captain's orders resolve.
 *
 * - Lt. Szabo's decode: advances only once she has been put on it, faster with Lt. Varga's
 *   pulsar timing and more power or a rigged dish on the comms array.
 * - The senders: ask two questions, each with a deadline (their patience). A wrong answer or a
 *   weapons lock is a strike; two strikes and they read the listeners as a threat. A missed
 *   deadline earns one repeat; a second silence is final. After the second answer they send
 *   their message, and what they want (greeting, farewell or warning) decides what comes next.
 * - Signals Director Brenn (Cantor): transmits her own answers on her own schedule unless
 *   she has agreed to hold or to work jointly, or the Halcyon is physically in her beam's path.
 * - The pulsar glitch (warning intent only): everything within GLITCH_KM of the senders is caught.
 */
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, narrate, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { PendingEvent, WorldState } from '../../engine/types';
import { destroyShip } from '../../engine/combat';
import { range } from '../../engine/rules';
import { knows, patchShip, patchSystem, revealFact, schedule, setCounter, setFlag, setMemory } from '../../engine/state';
import { ANSWERS, FULL_AT, GLITCH_KM, PARTIAL_AT, quiet } from './setup';
import type { Grammar } from './setup';

export const sendersHere = (s: WorldState) => !s.ships.kestrel.destroyed && !s.flags.sendersGone;
export const ledgerPresent = (s: WorldState) => !s.ships.cruiser.destroyed && !s.flags.cruiserGone;
export const sm = (s: WorldState) => s.characters.senders.memory;
export const bm = (s: WorldState) => s.characters.brenn.memory;
/** Which question is open: 0 or 1; 2 = both answered (the message phase). */
export const question = (s: WorldState) => sm(s).q ?? 0;
export const leanGrammar = (s: WorldState): Grammar => (quiet(s).leanRight ? quiet(s).grammar : quiet(s).decoy);
export const otherGrammar = (s: WorldState): Grammar => (quiet(s).leanRight ? quiet(s).decoy : quiet(s).grammar);
export const answerFor = (g: Grammar, q: number) => ANSWERS[g][Math.min(1, q)];
export const GRAMMAR_NAME: Record<Grammar, string> = { primes: 'prime numbers', geometry: 'shapes', chemistry: 'the periodic table' };
/** Halcyon, the Cantor: inside the glitch radius? */
export const inGlitch = (s: WorldState, id: 'halcyon' | 'cruiser') => range(s, id, 'kestrel') < GLITCH_KM;

export function simulate(s: WorldState, rng: Rng): Applied {
  const reports: Report[] = [];
  const run = (fn: (s: WorldState, rng: Rng, r: Report[]) => WorldState) => {
    if (s.outcome || s.ships.halcyon.destroyed) return;
    s = fn(s, rng, reports);
  };
  run(szaboWork);
  run(sendersAgent);
  run(brennAgent);
  run(resolveEvents);
  return { state: s, reports };
}

// ------------------------------------------------------------ the decode ---

/** Put Lt. Szabo on the decode (idempotent). */
export function taskSzabo(s: WorldState): WorldState {
  return s.flags.szaboOnIt ? s : setFlag(s, 'szaboOnIt');
}

export function decodeRate(s: WorldState): number {
  const h = s.ships.halcyon;
  let rate = 1;
  if (knows(s, 'pulsar_timing')) rate += 1;
  if (s.flags.dishRigged || (h.systems.comms.power >= 125 && h.systems.comms.health >= 60)) rate += 1;
  if (h.systems.comms.health < 40) rate = Math.max(0, rate - 1);
  return rate;
}

/** Add decode progress and announce the thresholds as they are crossed. */
export function advanceDecode(s: WorldState, n: number, r: Report[]): WorldState {
  const before = s.counters.decode ?? 0;
  const after = before + n;
  s = setCounter(s, 'decode', after);
  if (after >= PARTIAL_AT && !knows(s, 'partial_decode') && !knows(s, 'grammar_known')) {
    s = revealFact(s, 'partial_decode');
    const q = Math.min(1, question(s));
    r.push(say('comms', 'szaboPartial', { lean: GRAMMAR_NAME[leanGrammar(s)], a: answerFor(leanGrammar(s), q), other: GRAMMAR_NAME[otherGrammar(s)], b: answerFor(otherGrammar(s), q), q }));
  }
  if (after >= FULL_AT && !knows(s, 'grammar_known')) s = confirmGrammar(s, 'decode', r);
  return s;
}

/** Szabo is sure of the grammar (by decode, by elimination or by an accepted answer). */
export function confirmGrammar(s: WorldState, how: 'decode' | 'accepted' | 'eliminated', r: Report[]): WorldState {
  if (knows(s, 'grammar_known')) return s;
  const v = quiet(s);
  s = revealFact(s, 'partial_decode');
  s = revealFact(s, 'grammar_known');
  s = setCounter(s, 'decode', Math.max(s.counters.decode ?? 0, FULL_AT));
  const q = question(s);
  r.push(say('comms', 'szaboFull', { how, grammar: GRAMMAR_NAME[v.grammar], answer: q < 2 ? answerFor(v.grammar, q) : 0, q, lean: leanGrammar(s) === v.grammar ? 1 : 0 }));
  if (!v.directorRight && ledgerPresent(s) && !bm(s).joint) {
    s = revealFact(s, 'director_wrong');
    r.push(say('comms', 'szaboLedgerWrong', { grammar: GRAMMAR_NAME[v.decoy] }));
  }
  return s;
}

function szaboWork(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (!s.flags.szaboOnIt || knows(s, 'grammar_known') || !sendersHere(s)) return s;
  return advanceDecode(s, decodeRate(s), r);
}

// ------------------------------------------------------------- the senders ---

/** A strike against the listeners (a wrong answer, a weapons lock). Two and the senders read a threat. */
export function strike(s: WorldState, why: 'wrong' | 'lock' | 'ledgerWrong' | 'threat', r: Report[]): WorldState {
  const n = (sm(s).strikes ?? 0) + 1;
  s = setMemory(s, 'senders', 'strikes', n);
  if (n >= 2) {
    s = setFlag(s, 'misread');
    r.push(comms('senders', 'sendersThreatened', { why }));
    return s;
  }
  s = setMemory(s, 'senders', 'deadline', Math.max(sm(s).deadline ?? 0, s.turn + 3));
  r.push(comms('senders', 'sendersStrike', { why }));
  r.push(say('comms', 'szaboStrike', { why }));
  return s;
}

/**
 * An answer reaches the senders. `by` = who sent it. Returns the new state; the senders' reaction
 * and Szabo's reading go into `r`.
 */
export function answer(s: WorldState, n: number, by: 'halcyon' | 'ledger', r: Report[]): WorldState {
  const v = quiet(s);
  const q = question(s);
  if (q >= 2 || !sendersHere(s)) return s;
  if (by === 'halcyon') {
    s = setFlag(s, knows(s, 'grammar_known') ? 'answeredConfirmed' : knows(s, 'partial_decode') ? 'answeredOnLean' : 'answeredBlind');
    if (!knows(s, 'grammar_known') && knows(s, 'partial_decode') && n === answerFor(leanGrammar(s), q)) s = setFlag(s, 'followedLean');
  }
  const right = answerFor(v.grammar, q);
  if (n !== right) {
    if (by === 'halcyon') s = setFlag(s, 'wrongAnswer');
    s = strike(s, by === 'ledger' ? 'ledgerWrong' : 'wrong', r);
    // A wrong answer is still evidence: if it was the other reading, Szabo can rule it out.
    if (!s.flags.misread && knows(s, 'partial_decode') && n === answerFor(v.decoy, q)) s = confirmGrammar(s, 'eliminated', r);
    return s;
  }
  s = setMemory(s, 'senders', 'q', q + 1);
  s = setMemory(s, 'senders', `q${q + 1}By`, by === 'halcyon' ? 1 : 2);
  if (by === 'halcyon' && s.flags.followedLean && !knows(s, 'grammar_known')) s = setFlag(s, 'leanPaidOff');
  if (q === 0) {
    s = setMemory(s, 'senders', 'deadline', s.turn + v.patience);
    s = setMemory(s, 'senders', 'lapses', 0);
    s = setMemory(s, 'senders', 'echoed', 0);
    r.push(comms('senders', 'sendersAccept', { by: by === 'halcyon' ? 1 : 2 }));
    s = confirmGrammar(s, 'accepted', r);
    if (knows(s, 'grammar_known')) r.push(say('comms', 'szaboSecond', { answer: answerFor(v.grammar, 1), by: by === 'halcyon' ? 1 : 2 }));
    return s;
  }
  // Second answer: the message follows.
  r.push(comms('senders', 'sendersAcceptFinal', { by: by === 'halcyon' ? 1 : 2 }));
  if (by === 'ledger' && !bm(s).joint) {
    s = setFlag(s, 'directorateFirst');
    return s;
  }
  s = schedule(s, 'message', 1);
  return s;
}

/** The captain sends the senders' own question back to them: once per question it buys time. */
export function echo(s: WorldState, r: Report[]): WorldState {
  const q = question(s);
  if (q >= 2) {
    r.push(say('comms', 'szaboEchoLate'));
    return s;
  }
  if (sm(s).echoed) {
    r.push(say('comms', 'szaboEchoAgain'));
    return s;
  }
  s = setMemory(s, 'senders', 'echoed', 1);
  s = setMemory(s, 'senders', 'deadline', (sm(s).deadline ?? s.turn) + 3);
  s = setFlag(s, 'echoed');
  r.push(comms('senders', 'sendersEcho'));
  r.push(say('comms', 'szaboEchoWorked', { deadline: Math.max(1, (sm(s).deadline ?? 0) - s.turn) }));
  return s;
}

function sendersAgent(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (!sendersHere(s) || s.flags.misread || s.flags.silent) return s;
  const h = s.ships.halcyon;
  if (h.weapons.state === 'locked' && h.weapons.target === 'kestrel' && !s.flags.lockedOnSenders) {
    s = setFlag(s, 'lockedOnSenders');
    s = strike(s, 'lock', r);
    if (s.flags.misread) return s;
  }
  const q = question(s);
  if (q < 2) {
    const left = (sm(s).deadline ?? 0) - s.turn;
    if (left === 2) r.push(say('comms', 'szaboImpatient', { q }));
    if (left < 0) {
      if (!sm(s).lapses) {
        s = setMemory(s, 'senders', 'lapses', 1);
        s = setMemory(s, 'senders', 'deadline', s.turn + 3);
        r.push(comms('senders', 'sendersRepeat', { q }));
        r.push(say('comms', 'szaboLastChance'));
      } else {
        s = setFlag(s, 'silent');
        r.push(comms('senders', 'sendersSilent'));
      }
    }
    return s;
  }
  // Message phase (greeting / farewell): waiting for a reply.
  const by = sm(s).replyBy ?? 0;
  if (by && !sm(s).replied && s.turn > by && quiet(s).intent !== 'warning') {
    s = setFlag(s, 'silent');
    r.push(comms('senders', 'sendersSilent'));
  }
  return s;
}

// ------------------------------------------------------------------ Brenn ---

/** Is the Halcyon physically between the Cantor and the senders (her beam blocked)? */
export const beamBlocked = (s: WorldState) => !!s.flags.interposing && range(s, 'halcyon', 'kestrel') < range(s, 'cruiser', 'kestrel');

function brennAgent(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (!ledgerPresent(s) || !sendersHere(s) || s.flags.misread || s.flags.silent) return s;
  const m = bm(s);
  const q = question(s);
  if (q >= 2 || m.joint || m.holding) return s;
  if (s.turn < (m.nextAt ?? 99)) return s;
  const v = quiet(s);
  if (beamBlocked(s)) {
    s = setFlag(s, 'beamBlocked');
    s = setMemory(s, 'brenn', 'nextAt', s.turn + 2);
    s = setMemory(s, 'brenn', 'blocked', (m.blocked ?? 0) + 1);
    r.push(say('sensors', 'ledgerBlocked'));
    r.push(comms('brenn', 'brennBlocked', { n: m.blocked ?? 0 }));
    return s;
  }
  const right = v.directorRight || !!m.took;
  const n = right ? answerFor(v.grammar, q) : answerFor(v.decoy, q);
  s = setMemory(s, 'brenn', 'transmitted', (m.transmitted ?? 0) + 1);
  r.push(say('sensors', 'ledgerTransmits', { n, q }));
  s = answer(s, n, 'ledger', r);
  if (right) {
    s = setMemory(s, 'brenn', 'nextAt', s.turn + 2);
    return s;
  }
  // Wrong: how she takes it depends on who she is.
  const tries = (bm(s).wrongTries ?? 0) + 1;
  s = setMemory(s, 'brenn', 'wrongTries', tries);
  if (v.director === 'scholar' || (v.director === 'rival' && tries >= 2)) {
    s = setMemory(s, 'brenn', 'holding', 1);
    r.push(comms('brenn', 'brennStopsAfterWrong'));
  } else s = setMemory(s, 'brenn', 'nextAt', s.turn + (v.director === 'rival' ? 3 : 2));
  return s;
}

// ----------------------------------------------------------------- events ---

function resolveEvents(s: WorldState, rng: Rng, r: Report[]): WorldState {
  const due = s.pending.filter((e) => e.dueTurn <= s.turn);
  if (!due.length) return s;
  s = { ...s, pending: s.pending.filter((e) => e.dueTurn > s.turn) };
  for (const e of due) s = handleEvent(s, e, rng, r);
  return s;
}

function handleEvent(s: WorldState, e: PendingEvent, _rng: Rng, r: Report[]): WorldState {
  const v = quiet(s);
  switch (e.kind) {
    case 'message': {
      if (!sendersHere(s) || s.flags.misread) return s;
      s = setMemory(s, 'senders', 'messageAt', s.turn);
      s = revealFact(s, 'senders_intent');
      r.push(comms('senders', 'sendersMessage'));
      r.push(say('comms', `szaboMessage_${v.intent}`, { joint: bm(s).joint ? 1 : 0 }));
      if (v.intent === 'warning') {
        s = setMemory(s, 'senders', 'glitchAt', s.turn + v.glitchDelay);
        s = schedule(s, 'sendersLeave', v.glitchDelay - 1);
        s = schedule(s, 'glitch', v.glitchDelay);
        r.push(say('sensors', 'vargaGlitchConfirms', { mins: v.glitchDelay, ledger: ledgerPresent(s) && inGlitch(s, 'cruiser') ? 1 : 0, us: inGlitch(s, 'halcyon') ? 1 : 0 }));
        // Working jointly, the Ledger reads the same warning and leaves on her own.
        if (ledgerPresent(s) && bm(s).joint) s = ledgerLeaves(s, r);
      } else s = setMemory(s, 'senders', 'replyBy', s.turn + 4);
      return s;
    }
    case 'sendersLeave':
      if (!sendersHere(s)) return s;
      s = setFlag(s, 'sendersGone');
      s = patchShip(s, 'kestrel', { detected: false });
      r.push(say('sensors', 'sendersDepart'));
      return s;
    case 'glitch': {
      s = setFlag(s, 'glitched');
      r.push(narrate('glitchHits'));
      if (inGlitch(s, 'halcyon')) {
        s = setFlag(s, 'glitchHit');
        const h = s.ships.halcyon;
        s = patchShip(s, 'halcyon', { hull: Math.max(5, h.hull - 45) });
        s = patchSystem(s, 'halcyon', 'sensors', { health: Math.max(0, h.systems.sensors.health - 60) });
        s = patchSystem(s, 'halcyon', 'comms', { health: Math.max(0, h.systems.comms.health - 60) });
        s = patchSystem(s, 'halcyon', 'jumpDrive', { health: Math.max(0, h.systems.jumpDrive.health - 50) });
        r.push(say('engineering', 'glitchHitUs'));
      }
      if (ledgerPresent(s) && inGlitch(s, 'cruiser')) {
        s = setFlag(s, 'ledgerCaught');
        s = patchShip(s, 'cruiser', { hull: 15, detected: true });
        r.push(say('sensors', 'glitchHitLedger'));
      }
      return s;
    }
  }
  return s;
}

/** The Cantor takes the warning and jumps clear. */
export function ledgerLeaves(s: WorldState, r: Report[]): WorldState {
  if (!ledgerPresent(s)) return s;
  s = setFlag(s, 'cruiserGone');
  s = setFlag(s, 'ledgerWarnedClear');
  s = patchShip(s, 'cruiser', { detected: false, nav: null });
  r.push(say('sensors', 'ledgerJumpsClear'));
  return s;
}

export { destroyShip };
