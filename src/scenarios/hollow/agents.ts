/**
 * Hollow Crown — agents: Severin Mallory in the Ostrin Relay, the woman speaking as Tamsin Rook
 * among his hostages, Acting Governor Stannard at Government House and her Civic Guard team in the
 * relay's lower ring, and the Halcyon's officers. Deterministic: no randomness after setup.
 *
 * Reading people is the point. Mallory's strain (a counter, never shown as a number) rises with
 * threats, lies, humiliation, silence and the Guard's staging, and falls when he is heard. Only the
 * remedy that fits his real condition brings him low enough to lay it down, and only Dr. Osei can
 * hear which condition it is. He will not walk out to a rope: he needs an honest offer of the ISA's
 * protection and a hearing. One hostage is not who she claims, and what she really is decides what
 * happens the moment he surrenders. Restraint is the second test: the Halcyon can go in, and it
 * usually costs lives. Judged on what was known when each decision was made (ISA-COM-001 §1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, patchShip, revealFact, setCounter, setFlag } from '../../engine/state';
import { MAX_TURNS } from '../../engine/rules';
import { BREAK_AT, SURRENDER_AT, hollow } from './setup';
import {
  AGENT_WORD, ASSESS, BEAM, CASE, CHARGE_WORD, CONFIRM, COUNSEL, DECLINE, EXPOSE, GRIEF, HAIL, HANDOVER_NO, HANDOVER_YES, HEARING, HOLD,
  HUMILIATE, JAM, LISTEN, MALLORY_WORD, MEDICINE, PROOF, PROTECT_HER, REST, RESTORE, RIGGED, ROOK_WORD, ROSTER, SCAN_CORE, SEND_IT,
  STANNARD_WORD, STORM, SUPPLY, SURRENDER, TELL, THREAT, TRACE, WHO_ARE_YOU,
} from './words';

const END_FLAGS = ['endSurrender', 'endAsylum', 'endRescue', 'endByForce', 'endSuicide', 'endStrike', 'endHarmed', 'endPyre', 'endHanded', 'endStormed', 'endAbandoned'] as const;
type EndFlag = (typeof END_FLAGS)[number];
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const ROLE_PREFIX = /^(helm|tactical|ops|science|comms|xo|medical|engineering|sensors): /;

export const stress = (s: WorldState) => c(s, 'stress');
export const hostagesIn = (s: WorldState) => c(s, 'hostagesIn');
export const surrendering = (s: WorldState) => !!s.flags.surrendering;
/** The false hostage can no longer do harm. */
export function neutralised(s: WorldState): boolean {
  const v = hollow(s);
  if (v.impostor === 'agent') return !!(s.flags.agentJammed || s.flags.agentRecalled || s.flags.rookSecured);
  if (v.impostor === 'accomplice') return !!(s.flags.triggerJammed || s.flags.rookSecured);
  return true;
}
const liveCharge = (s: WorldState) => hollow(s).impostor === 'accomplice' && !neutralised(s);
const band = (s: WorldState) => (stress(s) >= 75 ? 'edge' : stress(s) >= 45 ? 'strained' : 'calmer');

export function vars(s: WorldState): Record<string, string | number> {
  const v = hollow(s);
  return {
    turn: s.turn,
    hostages: v.hostages,
    hostagesIn: hostagesIn(s),
    strikeIn: Math.max(0, c(s, 'strikeAt') - s.turn),
    band: band(s),
    condition: v.condition,
    impostor: v.impostor,
    successor: v.successor,
    knownImpostor: knows(s, 'impostor') ? 1 : 0,
    goaded: v.impostor === 'accomplice' ? 1 : 0,
    dead: v.strikeDead,
    held: c(s, 'held'),
  };
}

// ------------------------------------------------------------------ strain ---

function strain(s: WorldState, d: number): WorldState {
  return setCounter(s, 'stress', Math.min(BREAK_AT, Math.max(0, stress(s) + d)));
}
/** Calming has a floor: without the remedy that fits his condition he never comes all the way down. */
function calm(s: WorldState, d: number): WorldState {
  const floor = s.flags.remedied ? 10 : 40;
  const now = stress(s);
  if (now <= floor) return s;
  return setCounter(s, 'stress', Math.max(floor, now - d));
}
function remedy(s: WorldState, d: number): WorldState {
  s = setFlag(s, 'remedied');
  return calm(s, d);
}
function hold(s: WorldState, n: number): WorldState {
  const at = Math.min(MAX_TURNS - 2, c(s, 'strikeAt') + n);
  s = setCounter(s, 'held', c(s, 'held') + (at - c(s, 'strikeAt')));
  return setCounter(s, 'strikeAt', at);
}

// ------------------------------------------------------------------ endings ---

type Role = 'xo' | 'comms' | 'sensors' | 'engineering' | 'tactical' | 'helm' | 'medical';
function end(s: WorldState, flag: EndFlag, r: Report[], key: string, role: Role = 'xo'): WorldState {
  if (settled(s)) return s;
  r.push(say(role, key, vars(s)));
  return setFlag(s, flag);
}
function lose(s: WorldState, n: number): WorldState {
  const k = s.ships.kestrel;
  const dead = Math.min(n, hostagesIn(s));
  s = setCounter(s, 'hostagesIn', hostagesIn(s) - dead);
  s = setCounter(s, 'hostagesDead', c(s, 'hostagesDead') + dead);
  return patchShip(s, 'kestrel', { souls: Math.max(0, k.souls - dead) });
}
function malloryGone(s: WorldState): WorldState {
  s = setFlag(s, 'malloryDead');
  return patchShip(s, 'kestrel', { souls: Math.max(0, s.ships.kestrel.souls - 1) });
}

function pyre(s: WorldState, r: Report[], why: 'surrender' | 'beam' | 'storm'): WorldState {
  s = setFlag(s, 'pyre');
  r.push(say('sensors', `castellTriggers_${why}`, vars(s)));
  if (why !== 'beam') s = lose(s, hostagesIn(s));
  s = malloryGone(s);
  return end(s, 'endPyre', r, 'endPyreNote', 'sensors');
}

// ------------------------------------------------------------------ Osei: his condition ---

function assess(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'condition')) {
    r.push(say('medical', `assessed_${hollow(s).condition}`, vars(s)));
    return s;
  }
  if (c(s, 'assessAt') > 0) {
    r.push(say('medical', 'assessWorking'));
    return s;
  }
  s = setFlag(s, 'assessOrdered');
  if (!s.flags.spokeMallory) {
    s = setFlag(s, 'assessWaiting');
    r.push(say('medical', 'assessNeedVoice'));
    return s;
  }
  s = setCounter(s, 'assessAt', s.turn + 2);
  r.push(say('medical', 'assessStart'));
  return s;
}

function finishAssess(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'condition')) return s;
  if (s.flags.assessWaiting && s.flags.spokeMallory && c(s, 'assessAt') === 0) {
    s = setFlag(s, 'assessWaiting', false);
    s = setCounter(s, 'assessAt', s.turn + 2);
    r.push(say('medical', 'assessStart'));
    return s;
  }
  if (c(s, 'assessAt') === 0 || s.turn < c(s, 'assessAt')) return s;
  s = setCounter(s, 'assessAt', 0);
  s = revealFact(s, 'condition');
  if (!s.flags.pressedBeforeAssess) s = setFlag(s, 'assessedFirst');
  r.push(say('medical', `assessed_${hollow(s).condition}`, vars(s)));
  return s;
}

// ------------------------------------------------------------------ Szabo: who is who ---

function roster(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'impostor')) {
    r.push(say('comms', 'rosterKnown', vars(s)));
    return s;
  }
  if (c(s, 'rosterAt') > 0) {
    r.push(say('comms', 'rosterWorking'));
    return s;
  }
  s = setCounter(s, 'rosterAt', s.turn + 1);
  r.push(say('comms', 'rosterStart'));
  return s;
}

function finishRoster(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'impostor') || c(s, 'rosterAt') === 0 || s.turn < c(s, 'rosterAt')) return s;
  s = setCounter(s, 'rosterAt', 0);
  s = revealFact(s, 'impostor');
  r.push(say('comms', 'rosterResult', vars(s)));
  return s;
}

function trace(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'agent') || s.flags.traced) {
    r.push(say('comms', knows(s, 'agent') ? 'traceAgent' : 'traceNothing', vars(s)));
    return s;
  }
  if (c(s, 'traceAt') > 0) {
    r.push(say('comms', 'traceWorking'));
    return s;
  }
  s = setCounter(s, 'traceAt', s.turn + 1);
  r.push(say('comms', 'traceStart'));
  return s;
}

function finishTrace(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'traceAt') === 0 || s.turn < c(s, 'traceAt')) return s;
  s = setCounter(s, 'traceAt', 0);
  s = setFlag(s, 'traced');
  if (hollow(s).impostor === 'agent') {
    s = revealFact(s, 'agent');
    r.push(say('comms', 'traceAgent', vars(s)));
  } else r.push(say('comms', 'traceNothing', vars(s)));
  return s;
}

function scanCore(s: WorldState, r: Report[]): WorldState {
  if (hollow(s).impostor === 'accomplice') {
    s = revealFact(s, 'charge');
    r.push(say('sensors', 'scanCharge', vars(s)));
  } else {
    s = revealFact(s, 'nocharge');
    r.push(say('sensors', 'scanNoCharge', vars(s)));
  }
  return s;
}

function jam(s: WorldState, r: Report[]): WorldState {
  const v = hollow(s);
  if (s.flags.triggerJammed || s.flags.agentJammed) {
    r.push(say('comms', 'jamAlready'));
    return s;
  }
  if (v.impostor === 'accomplice' && knows(s, 'charge')) {
    s = setFlag(s, 'triggerJammed');
    r.push(say('comms', 'jamTrigger', vars(s)));
    return s;
  }
  if (v.impostor === 'agent' && knows(s, 'agent')) {
    s = setFlag(s, 'agentJammed');
    r.push(say('comms', 'jamAgent', vars(s)));
    return s;
  }
  s = setFlag(s, 'jamBlind');
  r.push(say('comms', 'jamBlind'));
  return s;
}

// ------------------------------------------------------------------ the pod, the transporter, force ---

function supply(s: WorldState, t: string, r: Report[]): WorldState {
  const v = hollow(s);
  const medicine = MEDICINE.test(t);
  if (c(s, 'windowAt') > 0 || s.flags.windowOpen) {
    r.push(say('xo', 'podAlready'));
    return s;
  }
  if (c(s, 'pods') >= 2) {
    r.push(say('xo', 'podNoMore'));
    return s;
  }
  if (medicine && !knows(s, 'condition')) {
    r.push(say('medical', 'oseiNoBlind'));
    return s;
  }
  if (!s.flags.spokeMallory) {
    r.push(say('xo', 'podNoTalk'));
    return s;
  }
  if (stress(s) >= 70) {
    s = strain(s, 3);
    r.push(comms('mallory', 'mallorySupplyRefused'));
    return s;
  }
  s = setCounter(s, 'pods', c(s, 'pods') + 1);
  s = setCounter(s, 'windowAt', s.turn + 1);
  s = setFlag(s, 'podSent');
  s = setFlag(s, 'podMedicine', medicine);
  r.push(say(medical(medicine), medicine ? 'podAwayMedicine' : 'podAway'));
  r.push(comms('mallory', 'malloryPodAccepted'));
  if (medicine && v.condition === 'withdrawal') s = setFlag(s, 'medicineSent');
  return s;
}
const medical = (m: boolean): Role => (m ? 'medical' : 'xo');

function windowTick(s: WorldState, r: Report[]): WorldState {
  if (s.flags.windowOpen && s.turn > c(s, 'windowOpenedAt')) {
    s = setFlag(s, 'windowOpen', false);
    r.push(say('engineering', 'windowClosed'));
  }
  if (c(s, 'windowAt') > 0 && s.turn >= c(s, 'windowAt')) {
    s = setCounter(s, 'windowAt', 0);
    s = setFlag(s, 'windowOpen');
    s = setCounter(s, 'windowOpenedAt', s.turn);
    if (s.flags.medicineSent && !s.flags.medicineTaken) {
      s = setFlag(s, 'medicineTaken');
      s = remedy(s, 25);
      r.push(comms('mallory', 'malloryMedicine'));
    } else s = calm(s, 5);
    r.push(say('engineering', 'windowOpen'));
  }
  return s;
}

function beam(s: WorldState, t: string, r: Report[]): WorldState {
  const who = /\b(mallory|him|the governor|severin)\b/.test(t) && !/\b(hostages?|staff|everyone|them)\b/.test(t) ? 'mallory' : /\b(rook|tamsin|her|the woman|marsh|dace|castell)\b/.test(t) && !/\b(hostages|staff|everyone|them)\b/.test(t) ? 'rook' : 'hostages';
  if (!s.flags.windowOpen) {
    s = setFlag(s, 'triedBeamShielded');
    r.push(say('engineering', 'beamShielded'));
    return s;
  }
  const h = s.ships.halcyon;
  const k = s.ships.kestrel;
  if (who === 'rook') {
    if (s.flags.rookSecured) {
      r.push(say('tactical', 'rookAlreadyAboard'));
      return s;
    }
    s = setFlag(s, 'rookSecured');
    s = setCounter(s, 'hostagesIn', hostagesIn(s) - 1);
    s = setCounter(s, 'rescued', c(s, 'rescued') + 1);
    s = patchShip(s, 'kestrel', { souls: k.souls - 1 });
    s = patchShip(s, 'halcyon', { souls: h.souls + 1 });
    r.push(say('tactical', `beamRook_${hollow(s).impostor}`, vars(s)));
    if (hollow(s).impostor === 'witness') s = setFlag(s, 'witnessSafe');
    s = strain(s, 12);
    r.push(comms('mallory', 'malloryLostOne'));
    return s;
  }
  if (who === 'mallory') {
    s = setFlag(s, 'forced');
    s = setFlag(s, 'beamedMallory');
    if (liveCharge(s)) return pyre(s, r, 'storm');
    s = patchShip(s, 'kestrel', { souls: k.souls - 1 });
    s = patchShip(s, 'halcyon', { souls: h.souls + 1 });
    s = setFlag(s, 'malloryAboard');
    r.push(say('tactical', 'beamMallory', vars(s)));
    return end(s, 'endByForce', r, 'endByForceBeamNote', 'tactical');
  }
  // Every hostage at once.
  if (liveCharge(s) && !(knows(s, 'charge') && knows(s, 'impostor'))) {
    s = setFlag(s, 'beamedAll');
    const n = hostagesIn(s);
    s = setCounter(s, 'rescued', c(s, 'rescued') + n);
    s = setCounter(s, 'hostagesIn', 0);
    s = patchShip(s, 'kestrel', { souls: k.souls - n });
    s = patchShip(s, 'halcyon', { souls: h.souls + n });
    return pyre(s, r, 'beam');
  }
  if (hollow(s).impostor === 'accomplice') s = setFlag(s, 'rookSecured');
  if (hollow(s).impostor === 'witness') s = setFlag(s, 'witnessSafe');
  const n = hostagesIn(s);
  s = setFlag(s, 'beamedAll');
  s = setCounter(s, 'rescued', c(s, 'rescued') + n);
  s = setCounter(s, 'hostagesIn', 0);
  s = patchShip(s, 'kestrel', { souls: k.souls - n });
  s = patchShip(s, 'halcyon', { souls: h.souls + n });
  r.push(say('tactical', 'beamAll', { ...vars(s), n }));
  return end(s, 'endRescue', r, 'endRescueNote', 'xo');
}

function storm(s: WorldState, t: string, r: Report[], insist = false): WorldState {
  const anyway = insist || /\b(anyway|regardless|now|that'?s an order|i insist|do it)\b/.test(t);
  if (!s.flags.stormWarned || !anyway) {
    s = setFlag(s, 'stormWarned');
    s = setCounter(s, 'pendingWarn', 1);
    r.push(say('tactical', stress(s) >= 40 || liveCharge(s) ? 'stormWarn' : 'stormWarnCalm', vars(s)));
    return s;
  }
  s = setFlag(s, 'forced');
  s = setFlag(s, 'stormOrdered');
  s = setFlag(s, 'forceWhileTalking');
  if (liveCharge(s)) return pyre(s, r, 'storm');
  if (stress(s) >= 40) {
    s = lose(s, Math.max(1, hollow(s).strikeDead - 1));
    r.push(say('tactical', 'stormBloody', vars(s)));
    return end(s, 'endStormed', r, 'endStormedNote', 'tactical');
  }
  s = setFlag(s, 'oneWounded');
  r.push(say('tactical', 'stormTaken', vars(s)));
  return end(s, 'endByForce', r, 'endByForceNote', 'tactical');
}

function declineForce(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'declinedForce');
  r.push(say('xo', 'forceDeclined'));
  return s;
}

// ------------------------------------------------------------------ Mallory ---

const NEGATED_RESTORE = /\b(can'?t|cannot|won'?t|will not|not able to|no one can|nobody can|not in (my|our) power to|isn'?t (mine|ours) to)\b.{0,30}\b(restore|reinstate|give (you|it) back|put you back|make you governor)\b/;

function beginSurrender(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'surrendering');
  s = setCounter(s, 'surrenderAt', s.turn + 1);
  r.push(comms('mallory', 'mallorySurrenders', vars(s)));
  r.push(say('xo', 'surrenderUnderway'));
  return s;
}

export function malloryRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = hollow(s);
  if (settled(s)) {
    r.push(comms('mallory', 'malloryAfter'));
    return s;
  }
  s = setCounter(s, 'lastContact', s.turn);
  const first = !s.flags.spokeMallory;
  s = setFlag(s, 'spokeMallory');
  if (surrendering(s)) {
    r.push(comms('mallory', 'malloryComingOut'));
    return s;
  }
  if (first) {
    r.push(comms('mallory', 'malloryGreets', vars(s)));
    if (!t) return s;
  }
  if (!t) {
    r.push(comms('mallory', `malloryStatus_${band(s)}`, vars(s)));
    return s;
  }
  // Lines that push him up are answered first, and alone.
  if (EXPOSE.test(t)) {
    s = setFlag(s, 'exposedToMallory');
    s = strain(s, 20);
    r.push(comms('mallory', `malloryExposed_${v.impostor}`, vars(s)));
    if (v.impostor === 'agent' && stress(s) >= 85) return harm(s, r, 'exposed');
    return s;
  }
  if (HUMILIATE.test(t)) {
    s = setFlag(s, 'humiliated');
    s = strain(s, 20);
    r.push(comms('mallory', 'malloryHumiliated'));
    return s;
  }
  if (THREAT.test(t) && !NEGATED_THREAT.test(t)) {
    s = setFlag(s, 'threatened');
    s = strain(s, 15);
    r.push(comms('mallory', 'malloryThreatened'));
    return s;
  }
  if (RESTORE.test(t)) {
    if (NEGATED_RESTORE.test(t)) {
      s = setFlag(s, 'honestNoRestore');
      s = calm(s, 3);
      r.push(comms('mallory', 'malloryHonestNo'));
    } else {
      s = setFlag(s, 'falsePromise');
      s = strain(s, 12);
      r.push(comms('mallory', 'malloryLie'));
      return s;
    }
  }
  let said = r.length;
  if (SUPPLY.test(t) || (MEDICINE.test(t) && /\b(send|offer|give|bring|get you|we have|dr\.? osei|the doctor)\b/.test(t))) s = supply(s, t, r);
  if (knows(s, 'condition') && !s.flags.remedied) {
    if (v.condition === 'exhausted' && REST.test(t)) {
      s = remedy(s, 20);
      r.push(comms('mallory', 'malloryRests'));
    } else if (v.condition === 'grief' && GRIEF.test(t)) {
      s = remedy(s, 22);
      r.push(comms('mallory', 'malloryGrieves'));
    }
  } else if (!knows(s, 'condition') && GRIEF.test(t) && v.condition !== 'grief') {
    r.push(comms('mallory', 'mallorySonWrong'));
  }
  if (HEARING.test(t)) {
    if (!s.flags.offeredHearing) {
      s = setFlag(s, 'offeredHearing');
      s = calm(s, 10);
      r.push(comms('mallory', 'malloryHearing'));
    } else r.push(comms('mallory', 'malloryHearingAgain'));
  }
  if (SURRENDER.test(t)) {
    s = setFlag(s, 'askedSurrender');
    if (!knows(s, 'condition')) s = setFlag(s, 'pressedBeforeAssess');
    if (stress(s) <= SURRENDER_AT && s.flags.offeredHearing) return beginSurrender(s, r);
    if (!s.flags.offeredHearing) {
      s = strain(s, 3);
      r.push(comms('mallory', 'malloryWhyWould'));
    } else {
      s = strain(s, 4);
      r.push(comms('mallory', 'malloryNotYet'));
    }
    return s;
  }
  if (r.length > said) return s;
  said = r.length;
  if (RIGGED.test(t)) {
    s = calm(s, 3);
    r.push(comms('mallory', v.impostor === 'witness' ? 'malloryRiggedTrue' : 'malloryRigged'));
    return s;
  }
  if (LISTEN.test(t) || GRIEF.test(t) || REST.test(t)) {
    const n = c(s, 'listened');
    s = setCounter(s, 'listened', n + 1);
    s = calm(s, n < 2 ? 8 : 2);
    r.push(comms('mallory', n < 2 ? `malloryTalks_${n}` : 'malloryTalksMore', vars(s)));
    return s;
  }
  r.push(comms('mallory', `malloryStatus_${band(s)}`, vars(s)));
  return s;
}
const NEGATED_THREAT = /\b(no one|nobody|not going to|won'?t|will not|no)\b.{0,20}\b(storm|force|come in|go in|shoot|deadline)\b/;

function harm(s: WorldState, r: Report[], why: 'break' | 'exposed'): WorldState {
  s = lose(s, 1);
  s = setFlag(s, 'hostageKilled');
  r.push(comms('mallory', why === 'exposed' ? 'malloryShootsHer' : 'malloryBreaks'));
  return end(s, 'endHarmed', r, 'endHarmedNote', 'xo');
}

// ------------------------------------------------------------------ Stannard ---

export function stannardRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = hollow(s);
  if (settled(s)) {
    r.push(comms('stannard', 'stannardAfter'));
    return s;
  }
  const first = !s.flags.spokeStannard;
  s = setFlag(s, 'spokeStannard');
  if (first) {
    r.push(comms('stannard', `stannardGreets_${v.successor}`, vars(s)));
    if (!t) return s;
  }
  if (!t) {
    r.push(comms('stannard', 'stannardStatus', vars(s)));
    return s;
  }
  if (DECLINE.test(t)) {
    s = setFlag(s, 'declinedForce');
    r.push(comms('stannard', 'stannardForceDeclined'));
    return s;
  }
  if (HANDOVER_NO.test(t)) {
    if (s.flags.promisedHandover) s = setFlag(s, 'revokedHandover');
    s = setFlag(s, 'promisedHandover', false);
    s = setFlag(s, 'refusedHandover');
    if (v.successor === 'political' && !s.flags.heldPolitical) {
      s = setFlag(s, 'heldPolitical');
      s = hold(s, 6);
      r.push(comms('stannard', 'stannardHoldsPolitical', vars(s)));
    } else r.push(comms('stannard', `stannardRefused_${v.successor}`, vars(s)));
    return s;
  }
  if (HANDOVER_YES.test(t)) {
    s = setFlag(s, 'promisedHandover');
    r.push(comms('stannard', 'stannardHandoverYes'));
    return s;
  }
  if (AGENT_WORD.test(t)) {
    if (knows(s, 'agent') && !s.flags.agentRecalled) {
      s = setFlag(s, 'agentRecalled');
      s = setFlag(s, 'confrontedAgent');
      s = hold(s, v.successor === 'hard' ? 6 : 4);
      r.push(comms('stannard', 'stannardAgent', vars(s)));
    } else r.push(comms('stannard', s.flags.agentRecalled ? 'stannardAgentDone' : 'stannardWhatAgent'));
    return s;
  }
  if (CHARGE_WORD.test(t)) {
    if (knows(s, 'charge')) {
      if (!s.flags.heldCharge) {
        s = setFlag(s, 'heldCharge');
        s = hold(s, 6);
        r.push(comms('stannard', 'stannardCharge', vars(s)));
      } else r.push(comms('stannard', 'stannardStatus', vars(s)));
    } else if (knows(s, 'nocharge')) {
      s = setFlag(s, 'falseClaim');
      r.push(comms('stannard', 'stannardNoCharge'));
    } else r.push(comms('stannard', 'stannardChargeUnproven'));
    return s;
  }
  if (PROOF.test(t)) {
    if (knows(s, 'evidence')) {
      s = setFlag(s, 'evidenceShown');
      if (v.successor === 'hard') {
        s = setFlag(s, 'evidenceToHard');
        s = setCounter(s, 'strikeAt', Math.max(s.turn + 2, c(s, 'strikeAt') - 3));
        r.push(comms('stannard', 'stannardEvidenceHard', vars(s)));
      } else if (!s.flags.heldEvidence) {
        s = setFlag(s, 'heldEvidence');
        s = hold(s, v.successor === 'cautious' ? 6 : 4);
        r.push(comms('stannard', `stannardEvidence_${v.successor}`, vars(s)));
      } else r.push(comms('stannard', 'stannardStatus', vars(s)));
    } else r.push(comms('stannard', 'stannardNoProof'));
    return s;
  }
  if (ROSTER.test(t) || /\b(roster|staff list|duty list)\b/.test(t)) {
    if (v.impostor === 'agent') {
      r.push(comms('stannard', 'stannardRosterStall'));
      return s;
    }
    if (!knows(s, 'impostor')) {
      s = revealFact(s, 'impostor');
      r.push(comms('stannard', 'stannardRoster'));
      r.push(say('comms', 'rosterResult', vars(s)));
    } else r.push(say('comms', 'rosterKnown', vars(s)));
    return s;
  }
  if (HOLD.test(t)) {
    s = setCounter(s, 'holdAsks', c(s, 'holdAsks') + 1);
    if (v.successor === 'cautious') {
      const n = c(s, 'holdAsks');
      if (n <= 2) {
        s = hold(s, n === 1 ? 4 : 3);
        r.push(comms('stannard', 'stannardHoldsCautious', vars(s)));
      } else r.push(comms('stannard', 'stannardNoMore', vars(s)));
    } else if (v.successor === 'political') r.push(comms('stannard', 'stannardWhatDoIGet'));
    else r.push(comms('stannard', 'stannardHardNo', vars(s)));
    return s;
  }
  if (LIVES.test(t)) {
    r.push(comms('stannard', `stannardLives_${v.successor}`, vars(s)));
    return s;
  }
  r.push(comms('stannard', 'stannardStatus', vars(s)));
  return s;
}
const LIVES = /\b(lives?|hostages?|people|killed|die|massacre|blood)\b/;

// ------------------------------------------------------------------ the woman speaking as Rook ---

export function rookRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = hollow(s);
  if (settled(s)) {
    r.push(comms('rook', 'rookAfter'));
    return s;
  }
  if (s.flags.rookSecured) {
    r.push(say('tactical', 'rookAboardNow'));
    return s;
  }
  if (!s.flags.spokeMallory) {
    r.push(say('comms', 'rookNeedsMallory'));
    return s;
  }
  if (stress(s) >= 70) {
    s = setCounter(s, 'lastContact', s.turn);
    r.push(comms('mallory', 'malloryNoTalk'));
    return s;
  }
  const first = !s.flags.spokeRook;
  s = setFlag(s, 'spokeRook');
  if (PROTECT_HER.test(t)) s = setFlag(s, 'offeredRookProtection');
  const confronted = knows(s, 'impostor') && (WHO_ARE_YOU.test(t) || (PROTECT_HER.test(t) && !!s.flags.rookAskedProtection));
  if (confronted) {
    s = setFlag(s, 'confrontedRook');
    if (v.impostor === 'witness') {
      if (s.flags.offeredRookProtection) {
        s = revealFact(s, 'witness');
        s = revealFact(s, 'evidence');
        r.push(comms('rook', 'rookWitnessTruth'));
        r.push(say('comms', 'evidenceReceived'));
        return s;
      }
      s = setFlag(s, 'rookAskedProtection');
      r.push(comms('rook', 'rookWitnessAfraid'));
      return s;
    }
    if (v.impostor === 'agent') {
      s = setFlag(s, 'agentLied');
      r.push(comms('rook', 'rookAgentLie'));
      return s;
    }
    s = setFlag(s, 'accompliceLied');
    r.push(comms('rook', 'rookAccompliceLie'));
    return s;
  }
  if (SEND_IT.test(t) && s.flags.confrontedRook) {
    r.push(comms('rook', v.impostor === 'witness' ? (knows(s, 'evidence') ? 'rookSent' : 'rookWitnessAfraid') : v.impostor === 'agent' ? 'rookAgentStall' : 'rookWhatProof'));
    return s;
  }
  if (WHO_ARE_YOU.test(t)) {
    r.push(comms('rook', 'rookCover'));
    return s;
  }
  r.push(comms('rook', first ? 'rookGreets' : 'rookStatus', vars(s)));
  return s;
}

// ------------------------------------------------------------------ orders ---

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const t0 = raw.toLowerCase().trim();
  const role = (ROLE_PREFIX.exec(t0)?.[1] ?? '') as string;
  const t = t0.replace(ROLE_PREFIX, '');
  if (settled(s)) {
    r.push(say('xo', 'afterEnd'));
    return s;
  }
  if (/^\s*(rook|tamsin)\b/.test(t)) return rookRespond(s, t.replace(/^\s*(rook|tamsin)[,:]?\s*/, ''), r);
  if (DECLINE.test(t)) return declineForce(s, r);
  if (CONFIRM.test(t)) {
    const p = c(s, 'pendingWarn');
    s = setCounter(s, 'pendingWarn', 0);
    if (p === 1) return storm(s, 'storm it anyway', r, true);
    r.push(say('xo', 'confirmWhat'));
    return s;
  }
  if (STORM.test(t) || (role === 'tactical' && /\b(security|team|storm|breach|board)\b/.test(t))) return storm(s, t, r);
  if (BEAM.test(t)) return beam(s, t, r);
  if (JAM.test(t)) return jam(s, r);
  if (SCAN_CORE.test(t) || (role === 'sensors' && /\b(core|charge)\b/.test(t))) return scanCore(s, r);
  if (TRACE.test(t) || (role === 'comms' && /\b(signals?|transmissions?|bursts?|band|trace)\b/.test(t))) return trace(s, r);
  if (ROSTER.test(t) || (role === 'comms' && /\b(roster|names?|staff)\b/.test(t))) return roster(s, r);
  if (ASSESS.test(t) || (role === 'medical' && /\b(him|mallory|governor|condition|voice|state)\b/.test(t) && !MEDICINE.test(t))) return assess(s, r);
  if (SUPPLY.test(t) || (role === 'medical' && MEDICINE.test(t))) return supply(s, t, r);
  if (HAIL.test(t) && ROOK_WORD.test(t) && !TELL.test(t.replace(HAIL, ''))) {
    r.push(say('comms', 'relayRook'));
    return rookRespond(s, '', r);
  }
  if (TELL.test(t) && STANNARD_WORD.test(t)) {
    r.push(say('comms', 'relayStannard'));
    return stannardRespond(s, t, r);
  }
  if (TELL.test(t) && ROOK_WORD.test(t) && !MALLORY_WORD.test(t)) {
    r.push(say('comms', 'relayRook'));
    return rookRespond(s, t, r);
  }
  if (TELL.test(t) && MALLORY_WORD.test(t)) {
    r.push(say('comms', 'relayMallory'));
    return malloryRespond(s, t, r);
  }
  r.push(say('xo', 'hollowUnclear', { description: t.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase().replace(ROLE_PREFIX, '');
  const v = hollow(s);
  // Speech to the woman speaking as Rook (the parser marks it "rook, …").
  if (/^rook, /.test(t)) return rookRespond(s, t.slice(6), r);
  const line = (role: Role, key: string) => {
    r.push(say(role, key, vars(s)));
    return s;
  };
  if (/\b(condition|state of mind|wrong with him|his health|his voice|how is he|is he (stable|all right|ok))\b/.test(t)) return line('medical', knows(s, 'condition') ? `assessed_${v.condition}` : c(s, 'assessAt') > 0 ? 'assessWorking' : 'assessNotYet');
  if (/\b(charge|core|bomb|wired|explosives?)\b/.test(t)) return line('sensors', knows(s, 'charge') ? 'scanCharge' : knows(s, 'nocharge') ? 'scanNoCharge' : 'chargeUnknown');
  if (/\b(rook|tamsin|hostages?|impostor|imposter|who is she|roster)\b/.test(t)) return line('comms', knows(s, 'witness') ? 'readRookWitness' : knows(s, 'agent') ? 'traceAgent' : knows(s, 'impostor') ? 'readRookFalse' : 'readRookUnknown');
  if (/\b(guard|strike|team|lower ring|how long|time)\b/.test(t)) return line('sensors', 'guardStatus');
  if (/\b(stannard|successor|acting governor|government house)\b/.test(t)) return line('xo', s.flags.spokeStannard ? `readStannard_${v.successor}` : 'readStannardUnknown');
  if (/\b(son|aris)\b/.test(t)) return line('medical', knows(s, 'condition') && v.condition === 'grief' ? 'assessed_grief' : 'sonUnknown');
  if (COUNSEL.test(t))
    return line('xo', !knows(s, 'condition') ? 'counselAssess' : !knows(s, 'impostor') ? 'counselRoster' : !neutralised(s) && (knows(s, 'agent') || knows(s, 'charge')) ? 'counselNeutralise' : !s.flags.offeredHearing ? 'counselHearing' : 'counselHold');
  if (/\b(mallory|governor|severin)\b/.test(t)) return line('xo', `readMallory_${band(s)}`);
  if (CASE.test(t)) return line('xo', 'statusHollow');
  return line('xo', 'statusHollow');
}

// ------------------------------------------------------------------ clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(finishSurrender);
  step(finishAssess);
  step(finishRoster);
  step(finishTrace);
  step(windowTick);
  step(impostorMove);
  step(stannardClock);
  step(strainClock);
  step(breakCheck);
  step(strikeClock);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel', 'cruiser'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  if (s.flags.jumped || Math.abs(s.ships.halcyon.position.x) > 40000 || Math.abs(s.ships.halcyon.position.y) > 40000) {
    s = setFlag(s, 'leftAubrel');
    return end(s, 'endAbandoned', r, 'endAbandonedNote', 'xo');
  }
  return s;
}

function finishSurrender(s: WorldState, r: Report[]): WorldState {
  if (!surrendering(s) || s.turn < c(s, 'surrenderAt')) return s;
  const v = hollow(s);
  if (v.impostor === 'agent' && !neutralised(s)) {
    s = setFlag(s, 'strikeDuringSurrender');
    r.push(say('sensors', 'agentSignals', vars(s)));
    s = lose(s, Math.max(1, v.strikeDead - 1));
    s = malloryGone(s);
    return end(s, 'endStrike', r, 'endStrikeNote', 'sensors');
  }
  if (v.impostor === 'accomplice' && !neutralised(s)) return pyre(s, r, 'surrender');
  const n = hostagesIn(s);
  s = setCounter(s, 'hostagesIn', 0);
  s = setCounter(s, 'rescued', c(s, 'rescued') + n);
  s = patchShip(s, 'kestrel', { souls: 0 });
  s = patchShip(s, 'halcyon', { souls: s.ships.halcyon.souls + 1 });
  s = setFlag(s, 'malloryAboard');
  r.push(say('xo', 'surrenderDone', vars(s)));
  if (s.flags.promisedHandover) return end(s, 'endHanded', r, 'endHandedNote', 'xo');
  if (v.impostor === 'witness' && knows(s, 'evidence')) return end(s, 'endAsylum', r, 'endAsylumNote', 'xo');
  return end(s, 'endSurrender', r, 'endSurrenderNote', 'xo');
}

function impostorMove(s: WorldState, r: Report[]): WorldState {
  const v = hollow(s);
  if (s.flags.impostorMoved || s.turn < v.moveAt || surrendering(s)) return s;
  s = setFlag(s, 'impostorMoved');
  if (neutralised(s)) return s;
  if (v.impostor === 'agent') {
    s = setCounter(s, 'strikeAt', Math.max(s.turn + 2, c(s, 'strikeAt') - 2));
    r.push(say('sensors', 'burstSeen', vars(s)));
    return s;
  }
  if (v.impostor === 'accomplice') {
    s = strain(s, 8);
    r.push(say('medical', knows(s, 'condition') ? 'goadNoticed' : 'goadHeard'));
  }
  return s;
}

function stannardClock(s: WorldState, r: Report[]): WorldState {
  const v = hollow(s);
  if (v.successor === 'hard' && !s.flags.forceAsked && s.turn >= c(s, 'strikeAt') - 5 && !surrendering(s)) {
    s = setFlag(s, 'forceAsked');
    r.push(comms('stannard', 'stannardForceAsk', vars(s)));
  }
  return s;
}

function strainClock(s: WorldState, r: Report[]): WorldState {
  if (surrendering(s)) return s;
  const h = s.ships.halcyon;
  if (s.turn - c(s, 'lastContact') >= 3) s = strain(s, 3);
  if (s.alert === 'red') s = strain(s, 4);
  if (h.weapons.state === 'locked' && h.weapons.target === 'kestrel') s = strain(s, 6);
  if (!s.flags.guardStaging && s.turn >= c(s, 'strikeAt') - 3) {
    s = setFlag(s, 'guardStaging');
    s = strain(s, s.flags.remedied ? 3 : 8);
    r.push(say('sensors', 'guardStaging', vars(s)));
  }
  return s;
}

function breakCheck(s: WorldState, r: Report[]): WorldState {
  if (stress(s) < BREAK_AT) return s;
  if (hollow(s).condition === 'grief') {
    s = malloryGone(s);
    s = setFlag(s, 'suicide');
    r.push(say('sensors', 'mallorySuicide'));
    return end(s, 'endSuicide', r, 'endSuicideNote', 'xo');
  }
  return harm(s, r, 'break');
}

function strikeClock(s: WorldState, r: Report[]): WorldState {
  if (surrendering(s)) return s;
  if (s.turn >= c(s, 'strikeAt') || s.turn >= MAX_TURNS - 1) {
    if (liveCharge(s)) return pyre(s, r, 'storm');
    r.push(say('sensors', 'guardGoesIn', vars(s)));
    s = lose(s, hollow(s).strikeDead);
    s = malloryGone(s);
    return end(s, 'endStrike', r, 'endStrikeNote', 'sensors');
  }
  return s;
}

export { CASE, COUNSEL };
