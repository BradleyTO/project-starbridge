/**
 * The Long Picket — the agents: the picket commander Lucan Roake (who has orders to delay, not to
 * fight, and his own pride, caution or weariness), his relief, Wrenmoor's Reeve on the far side of
 * the line, and the Halcyon's officers, each of whom can see one part of the problem.
 * Deterministic: no randomness after setup.
 *
 * Bluffing is the point. The Code allows a ruse about the ship's own strength, company or intentions
 * against a hostile party (ISA-COM-001 §6.2), and forbids one that feigns distress or a humanitarian
 * purpose, falsifies the ship's records or deceives the ISA itself (§6.3, §6.4). Which bluff Roake
 * will believe, and from whom, depends on what he knows and on who he is, and Cmdr. Marrow is the
 * one person aboard who knows him. Timing is the second problem: his long-range sweep will soon show
 * the Halcyon's wake is empty, his relief is due on its own clock, and Wrenmoor has a real deadline
 * that its Reeve may not be telling straight.
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, patchCharacter, patchShip, revealFact, setCounter, setFlag } from '../../engine/state';
import { recordRefusal } from '../../engine/roe';
import { claimedDeadline, picket } from './setup';
import {
  CASE, COUNSEL, COURTESY, DEAL_HOLD, DEAL_TOKEN, DISTRESS, ESCORT, EVIDENCE, FALSE_MERCY, FLEET_COMMAND, FORGE, HANDOVER, INSPECT_ALL, INTERCEPT, LIVES, MANIFEST,
  NOT_MERCY, PICKET_WORD, COLONY_WORD, PRIVATE, READ, RESOLVE, RUN, SCAN_CARGO, SEND, STAGE, TELEMETRY, TELL, TO_MARROW, TRUTH, TURN_BACK,
} from './words';

const END_FLAGS = ['endPassed', 'endRan', 'endIncident', 'endImpounded', 'endDark', 'endTurned'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
export type Route = 'bluff' | 'deal' | 'marrow' | 'inspected' | 'falseFlag';
export const ROUTES: readonly Route[] = ['bluff', 'deal', 'marrow', 'inspected', 'falseFlag'];
export const routeOf = (s: WorldState): Route | null => ROUTES.find((x) => !!s.flags[`pass_${x}`]) ?? null;
export const susp = (s: WorldState) => s.counters.suspicion ?? 0;
export const relieved = (s: WorldState) => !!s.flags.relieved;
const inspecting = (s: WorldState) => (s.counters.inspectEnd ?? 0) > 0;
const holding = (s: WorldState) => (s.counters.holdUntil ?? 0) > 0;
const onRecord = (s: WorldState) => inspecting(s) || holding(s);
const mins = (n: number) => Math.max(0, n);
/** A ruse the Code forbids outright: a false humanitarian purpose, or false distress. */
export const forbidden = (t: string) => (FALSE_MERCY.test(t) && !NOT_MERCY.test(t)) || DISTRESS.test(t);
const NO_ESCORT = /\b(no|without|not any|nobody|no one)\b[^.]*\b(escorts?|ships?|company|squadron|cruisers?|friends)\b|\b(we are|we'?re|we travel|travelling|traveling|we came|we come) alone\b/;
const who = (s: WorldState) => (relieved(s) ? 'dahl' : 'roake');

export function vars(s: WorldState): Record<string, string | number> {
  const v = picket(s);
  return {
    turn: s.turn,
    left: mins(v.deadline - s.turn),
    claimed: mins(claimedDeadline(v) - s.turn),
    relief: mins(v.reliefAt - s.turn),
    sweep: mins(v.sweepAt - s.turn),
    inspect: mins((s.counters.inspectEnd ?? 0) - s.turn),
    hold: mins((s.counters.holdUntil ?? 0) - s.turn),
    orders: v.orders,
    temperament: v.temperament,
    intel: v.intel,
    history: v.history,
    reeve: v.reeve,
    suspicion: susp(s),
    swept: s.turn >= v.sweepAt ? 1 : 0,
    knowsWindow: knows(s, 'window') ? 1 : 0,
    knowsOrders: knows(s, 'orders') ? 1 : 0,
    knowsRead: knows(s, 'read') ? 1 : 0,
    knowsSweep: knows(s, 'sweep') ? 1 : 0,
    claimHeard: knows(s, 'claim') ? 1 : 0,
    relieved: relieved(s) ? 1 : 0,
    inspecting: inspecting(s) ? 1 : 0,
    holding: holding(s) ? 1 : 0,
    courtesy: s.flags.courtesy ? 1 : 0,
    tight: v.reliefAt >= v.deadline ? 1 : 0,
  };
}

// ------------------------------------------------------------------ endings ---

function pass(s: WorldState, route: Route, r: Report[], key: string, by: 'roake' | 'dahl' = who(s)): WorldState {
  if (settled(s)) return s;
  r.push(comms(by, key, vars(s)));
  r.push(say('helm', route === 'falseFlag' ? 'helmThroughFalse' : 'helmThrough'));
  s = setFlag(s, `pass_${route}`);
  return setFlag(s, 'endPassed');
}

function doRun(s: WorldState, r: Report[]): WorldState {
  const v = picket(s);
  if (onRecord(s)) s = setFlag(s, 'dealBroken');
  s = setFlag(s, 'ran');
  if (v.temperament === 'proud' || s.flags.dugIn) {
    r.push(say('helm', 'runProud'));
    r.push(comms(who(s), 'roakeCollision'));
    s = setFlag(s, 'collision');
    return setFlag(s, 'endIncident');
  }
  r.push(say('helm', 'runThrough'));
  r.push(comms(who(s), 'roakeFiles'));
  return setFlag(s, 'endRan');
}

export function run(s: WorldState, r: Report[]): WorldState {
  if (!(s.counters.runWarned ?? 0)) {
    r.push(say('xo', 'marrowRunWarn', vars(s)));
    return setCounter(s, 'runWarned', 1);
  }
  return doRun(s, r);
}

export function turnBack(s: WorldState, r: Report[]): WorldState {
  r.push(say('helm', 'turningBack'));
  return setFlag(s, 'endTurned');
}

function impoundDemand(s: WorldState, r: Report[]): WorldState {
  if (s.flags.impoundOffer) {
    r.push(comms(who(s), 'roakeImpounds'));
    return setFlag(s, 'endImpounded');
  }
  s = setFlag(s, 'impoundOffer');
  r.push(comms(who(s), 'roakeImpoundDemand'));
  r.push(say('xo', 'marrowImpoundWarn', { she: who(s) === 'dahl' ? 1 : 0 }));
  return s;
}

export function handover(s: WorldState, r: Report[]): WorldState {
  if (s.flags.impoundOffer || (s.counters.handWarned ?? 0)) {
    r.push(comms(who(s), 'roakeImpounds'));
    return setFlag(s, 'endImpounded');
  }
  r.push(say('engineering', 'handWarn'));
  return setCounter(s, 'handWarned', 1);
}

// ------------------------------------------------------------------ information ---

export function marrowRead(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.roakeHeard) {
    r.push(say('xo', 'marrowNeedHear'));
    return s;
  }
  if (!knows(s, 'read') && !s.flags.bluffed) s = setFlag(s, 'readFirst');
  s = revealFact(s, 'read');
  r.push(say('xo', relieved(s) ? 'marrowReadDahl' : 'marrowRead', vars(s)));
  return s;
}

export function intercept(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'orders')) {
    r.push(say('comms', 'interceptAgain', vars(s)));
    return s;
  }
  if ((s.counters.interceptAt ?? 0) > 0) {
    r.push(say('comms', 'interceptWorking'));
    return s;
  }
  r.push(say('comms', 'interceptStart'));
  return setFlag(setCounter(s, 'interceptAt', s.turn + 2), 'intercepted');
}

export function scanPicket(s: WorldState, r: Report[]): WorldState {
  s = revealFact(s, 'sweep');
  r.push(say('sensors', 'scanPicket', vars(s)));
  return s;
}

export function telemetry(s: WorldState, r: Report[]): WorldState {
  s = setFlag(revealFact(s, 'window'), 'telemetryRead');
  r.push(say('engineering', 'telemetry', vars(s)));
  return s;
}

function refuse(s: WorldState, role: 'comms' | 'xo', key: string, order: string, reasons: string[], r: Report[]): WorldState {
  r.push(say(role, key));
  s = recordRefusal(s, role, order.slice(0, 80), reasons);
  return setFlag(s, 'orderedRuse');
}

export function stage(s: WorldState, t: string, r: Report[]): WorldState {
  if (FLEET_COMMAND.test(t) && !/\bnot (to )?(fleet command|command)\b/.test(t)) {
    return refuse(s, 'comms', 'refuseDeceiveCommand', t, ['ISA-COM-001 §6.3 does not allow a ruse that deceives ISA Fleet Command or the ship’s records'], r);
  }
  if (s.flags.staged) {
    r.push(say('comms', 'stagedAgain'));
    return s;
  }
  r.push(say('comms', 'staged'));
  return setFlag(s, 'staged');
}

export function forge(s: WorldState, t: string, r: Report[]): WorldState {
  s = setFlag(s, 'forgeOrdered');
  return refuse(s, 'comms', 'refuseForge', t, ['ISA-COM-001 §6.4 requires the ship’s records to be kept true, and a ruse may not feign a humanitarian purpose (§6.3)'], r);
}

export function sendManifest(s: WorldState, r: Report[]): WorldState {
  if (s.flags.manifestSent) {
    r.push(say('comms', 'manifestAgain'));
    return s;
  }
  s = setFlag(s, 'manifestSent');
  r.push(say('comms', 'manifestSent'));
  if (relieved(s)) {
    r.push(comms('dahl', 'dahlEvidence'));
    return s;
  }
  r.push(comms('roake', picket(s).orders === 'pretext' ? 'roakeManifestPretext' : 'roakeManifestNoted'));
  return s;
}

export function sendEvidence(s: WorldState, r: Report[], send: boolean): WorldState {
  if (!s.flags.cargoScanned) {
    s = setFlag(s, 'cargoScanned');
    r.push(say('sensors', 'cargoScanned'));
  }
  if (!send) return s;
  s = setFlag(s, 'evidenceSent');
  r.push(say('comms', 'evidenceSent'));
  if (relieved(s)) {
    r.push(comms('dahl', 'dahlEvidence'));
    return s;
  }
  if (picket(s).orders === 'pretext' && susp(s) < 2 && !settled(s)) return pass(s, 'inspected', r, 'roakeEvidenceClears');
  r.push(comms('roake', 'roakeEvidenceNoted'));
  return s;
}

// ------------------------------------------------------------------ Marrow ---

export function marrowPrivate(s: WorldState, r: Report[]): WorldState {
  const v = picket(s);
  s = setFlag(s, 'marrowSpoke');
  if (relieved(s)) {
    r.push(say('xo', 'marrowNoDahl'));
    return s;
  }
  if (susp(s) >= 2) {
    r.push(say('xo', 'marrowTooLate'));
    return s;
  }
  if (v.history === 'owed') {
    r.push(say('xo', 'marrowPrivateOwed'));
    return pass(s, 'marrow', r, 'roakeOwed');
  }
  if (v.history === 'friends' && (v.temperament === 'weary' || s.flags.toldTruth)) {
    r.push(say('xo', 'marrowPrivateFriendsWin'));
    return pass(s, 'marrow', r, 'roakeFriend');
  }
  if (v.history === 'friends') {
    s = revealFact(s, 'orders');
    r.push(say('xo', 'marrowPrivateFriends', vars(s)));
    return s;
  }
  s = revealFact(s, 'read');
  r.push(say('xo', 'marrowPrivateRivals'));
  return s;
}

// ------------------------------------------------------------------ the picket ---

function called(s: WorldState, r: Report[], key: string, by: 'roake' | 'dahl' = who(s)): WorldState {
  s = setCounter(s, 'suspicion', susp(s) + 1);
  s = setFlag(s, 'bluffCalled');
  r.push(comms(by, key));
  return s;
}

function escortBluff(s: WorldState, by: 'captain' | 'marrow', r: Report[]): WorldState {
  const v = picket(s);
  if (!knows(s, 'read') && !s.flags.bluffed) s = setFlag(s, 'bluffBlind');
  s = setFlag(s, 'bluffed');
  if (susp(s) >= 2) {
    r.push(comms('roake', 'roakeNoMoreStories'));
    return s;
  }
  if (by === 'marrow' && v.history === 'rivals') return called(s, r, 'roakeCallsMarrow');
  if (v.intel === 'escort' || s.turn >= v.sweepAt) return called(s, r, v.intel === 'escort' ? 'roakeCallsEscortKnown' : 'roakeCallsEscortSweep');
  const credible = by === 'marrow' || v.temperament !== 'careful' || !!s.flags.staged;
  if (!credible) {
    s = setFlag(s, 'bluffShrugged');
    r.push(comms('roake', 'roakeShrugsEscort'));
    return s;
  }
  return pass(s, 'bluff', r, by === 'marrow' ? 'roakeBelievesMarrow' : 'roakeBelievesEscort');
}

function resolveBluff(s: WorldState, by: 'captain' | 'marrow', r: Report[]): WorldState {
  const v = picket(s);
  if (!knows(s, 'read') && !s.flags.bluffed) s = setFlag(s, 'bluffBlind');
  s = setFlag(s, 'bluffed');
  if (susp(s) >= 2) {
    r.push(comms('roake', 'roakeNoMoreStories'));
    return s;
  }
  if (by === 'marrow' && v.history === 'rivals') return called(s, r, 'roakeCallsMarrow');
  if ((v.orders === 'probe' && v.temperament !== 'proud') || (v.orders === 'delay' && v.temperament === 'weary')) return pass(s, 'bluff', r, 'roakeBelievesResolve');
  if (v.temperament === 'proud') {
    s = setFlag(s, 'dugIn');
    r.push(comms('roake', 'roakeDigsIn'));
    return s;
  }
  r.push(comms('roake', 'roakeOrdersStand'));
  return s;
}

function busy(s: WorldState, r: Report[]): WorldState {
  r.push(comms(who(s), inspecting(s) ? 'roakeInspecting' : 'roakeHolding', vars(s)));
  return s;
}

function holdDeal(s: WorldState, r: Report[]): WorldState {
  const v = picket(s);
  if (susp(s) >= 2) return impoundDemand(s, r);
  if (onRecord(s)) return busy(s, r);
  if (v.orders === 'pretext') {
    r.push(comms('roake', 'roakeHoldPretext'));
    return s;
  }
  s = setFlag(s, 'dealHold');
  s = setFlag(s, 'onRecord');
  s = setCounter(s, 'holdUntil', v.orders === 'delay' ? v.reliefAt : s.turn + 3);
  r.push(comms('roake', v.orders === 'delay' ? 'roakeHoldAccepted' : 'roakeHoldProbe', vars(s)));
  return s;
}

function tokenDeal(s: WorldState, r: Report[]): WorldState {
  const v = picket(s);
  if (susp(s) >= 2) return impoundDemand(s, r);
  if (onRecord(s)) return busy(s, r);
  s = setFlag(s, 'dealToken');
  s = setFlag(s, 'onRecord');
  const slow = v.orders === 'delay' && v.temperament !== 'weary';
  s = setCounter(s, 'inspectEnd', slow ? Math.max(s.turn + 1, v.reliefAt) : s.turn + 1);
  r.push(comms('roake', slow ? 'roakeTokenSlow' : 'roakeTokenAccepted', vars(s)));
  return s;
}

function inspection(s: WorldState, t: string, r: Report[], by: 'roake' | 'dahl'): WorldState {
  const v = picket(s);
  if (susp(s) >= 2) return impoundDemand(s, r);
  if (onRecord(s)) return busy(s, r);
  if (COURTESY.test(t)) s = setFlag(s, 'courtesy');
  s = setFlag(s, 'inspectionAllowed');
  s = setFlag(s, 'onRecord');
  const dur = by === 'dahl' ? 3 : v.orders === 'pretext' ? (s.flags.manifestSent ? 1 : 3) : v.orders === 'probe' ? 2 : Math.max(3, v.reliefAt - s.turn);
  s = setCounter(s, 'inspectEnd', s.turn + dur);
  r.push(comms(by, by === 'dahl' ? 'dahlInspectStart' : 'roakeInspectStart', vars(s)));
  if (by === 'roake' && v.orders === 'delay' && !s.flags.inspectDragWarned) {
    s = setFlag(s, 'inspectDragWarned');
    r.push(say('xo', 'marrowDrag'));
  }
  return s;
}

function falseClaim(s: WorldState, r: Report[]): WorldState {
  const v = picket(s);
  s = setFlag(s, 'falseFlag');
  if (relieved(s) || v.intel === 'cargo' || susp(s) >= 2) {
    s = setCounter(s, 'suspicion', susp(s) + 2);
    s = setFlag(s, 'falseFlagCalled');
    r.push(comms(who(s), 'roakeCallsMercy'));
    return s;
  }
  return pass(s, 'falseFlag', r, 'roakeMercyPass');
}

function livesClaim(s: WorldState, r: Report[]): WorldState {
  const v = picket(s);
  const knew = knows(s, 'window') || (knows(s, 'claim') && v.reeve === 'steady');
  s = setFlag(s, knew ? 'overstated' : 'repeatedClaim');
  if (v.temperament === 'careful' && !relieved(s)) {
    s = setCounter(s, 'suspicion', susp(s) + 1);
    r.push(comms('roake', 'roakeDoubtsLives'));
    return s;
  }
  r.push(comms(who(s), 'roakeUnmovedLives'));
  return s;
}

const AGREE = /^\s*(agreed|very well|fine|yes|ok(ay)?|we agree|so be it|do it|go ahead)\b/;
const ESCORTISH = (t: string) => ESCORT.test(t) && !NO_ESCORT.test(t);

export function roakeRespond(s: WorldState, t: string, r: Report[], by: 'captain' | 'marrow' = 'captain'): WorldState {
  if (settled(s)) {
    r.push(comms(who(s), 'roakeAfter'));
    return s;
  }
  s = setFlag(s, 'spokeRoake');
  if (relieved(s)) return dahlRespond(s, t, r);
  if (forbidden(t)) return falseClaim(s, r);
  if (HANDOVER.test(t)) return handover(s, r);
  if (s.flags.impoundOffer && (AGREE.test(t) || INSPECT_ALL.test(t))) return impoundDemand(s, r);
  if (LIVES.test(t)) return livesClaim(s, r);
  if (DEAL_HOLD.test(t)) return holdDeal(s, r);
  if (DEAL_TOKEN.test(t)) return tokenDeal(s, r);
  if (INSPECT_ALL.test(t)) return inspection(s, t, r, 'roake');
  if (ESCORTISH(t)) return escortBluff(s, by, r);
  if (RESOLVE.test(t)) return resolveBluff(s, by, r);
  if (MANIFEST.test(t)) return sendManifest(s, r);
  if (EVIDENCE.test(t)) return sendEvidence(s, r, true);
  if (TRUTH.test(t)) {
    s = setFlag(s, 'toldTruth');
    r.push(comms('roake', picket(s).temperament === 'weary' ? 'roakeTruthWeary' : 'roakeTruth'));
    return s;
  }
  if (/\b(orders|why|what do you want|authority|right|on what grounds|by what)\b/.test(t)) {
    r.push(comms('roake', 'roakeOfficial'));
    return s;
  }
  r.push(comms('roake', 'roakeWaiting'));
  return s;
}

function dahlRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (forbidden(t)) return falseClaim(s, r);
  if (HANDOVER.test(t)) return handover(s, r);
  if (s.flags.impoundOffer && (AGREE.test(t) || INSPECT_ALL.test(t))) return impoundDemand(s, r);
  if (LIVES.test(t)) return livesClaim(s, r);
  if (INSPECT_ALL.test(t)) return inspection(s, t, r, 'dahl');
  if (ESCORTISH(t) || RESOLVE.test(t)) {
    // By the book: a story does not move her, and it does not make her want the cargo either.
    s = setFlag(setFlag(s, 'bluffed'), 'bluffCalled');
    r.push(comms('dahl', 'dahlNo'));
    return s;
  }
  if (DEAL_TOKEN.test(t)) {
    r.push(comms('dahl', 'dahlToken'));
    return s;
  }
  if (DEAL_HOLD.test(t)) {
    r.push(comms('dahl', 'dahlHold'));
    return s;
  }
  if (MANIFEST.test(t) || EVIDENCE.test(t)) {
    r.push(comms('dahl', 'dahlEvidence'));
    return s;
  }
  if (TRUTH.test(t)) {
    s = setFlag(s, 'toldTruth');
    r.push(comms('dahl', 'dahlTruth'));
    return s;
  }
  r.push(comms('dahl', 'dahlWaiting'));
  return s;
}

const IS_Q = /\?\s*$/;

export function marchbankRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = picket(s);
  if (settled(s)) {
    r.push(comms('marchbank', 'reeveAfter'));
    return s;
  }
  s = setFlag(s, 'spokeReeve');
  if (/\b(statement|vouch|declare|formal|on the record|write to)\b/.test(t)) {
    s = setFlag(s, 'reeveStatement');
    s = setFlag(s, 'toldTruth');
    r.push(comms('marchbank', 'reeveStatement'));
    return s;
  }
  if (/\b(how long|time|deadline|really|truth|honest|exactly|minutes)\b/.test(t) || IS_Q.test(t)) {
    s = revealFact(s, 'claim');
    const admits = v.reeve === 'desperate' && knows(s, 'window');
    if (admits) s = setFlag(s, 'reeveAdmitted');
    r.push(comms('marchbank', admits ? 'reeveAdmits' : 'reeveTime', vars(s)));
    return s;
  }
  r.push(comms('marchbank', 'reeveWaiting', vars(s)));
  return s;
}

// ------------------------------------------------------------------ orders and questions ---

const RUSE_REASON = 'ISA-COM-001 §6.3 does not allow a ruse that feigns distress or a humanitarian purpose';
const LIVES_REASON = 'the Chief’s telemetry shows no lives at stake, and ISA-COM-001 §6.1 does not allow deceiving a party about facts on which lives depend';

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  if (settled(s)) {
    r.push(say('xo', 'afterPass'));
    return s;
  }
  if (TURN_BACK.test(t)) return turnBack(s, r);
  if (HANDOVER.test(t)) return handover(s, r);
  if (FORGE.test(t)) return forge(s, t, r);
  if (STAGE.test(t)) return stage(s, t, r);
  if (TO_MARROW.test(t)) {
    if (PRIVATE.test(t)) return marrowPrivate(s, r);
    if (READ.test(t) && !TELL.test(t)) return marrowRead(s, r);
    if (TELL.test(t)) {
      if (forbidden(t)) return refuse(s, 'xo', 'refuseRuseXo', t, [RUSE_REASON], r);
      if (LIVES.test(t) && knows(s, 'window')) return refuse(s, 'xo', 'refuseLivesXo', t, [LIVES_REASON], r);
      if (!s.flags.roakeHeard) {
        r.push(say('xo', 'marrowNeedHear'));
        return s;
      }
      r.push(say('xo', 'marrowDelivers'));
      return roakeRespond(s, t, r, 'marrow');
    }
  }
  if (RUN.test(t)) return run(s, r);
  if (INTERCEPT.test(t)) return intercept(s, r);
  if (TELEMETRY.test(t)) return telemetry(s, r);
  const toPicket = PICKET_WORD.test(t.replace(/\b(him|them)\b/g, ''));
  if (TELL.test(t) && COLONY_WORD.test(t) && !toPicket) return marchbankRespond(s, t, r);
  if (TELL.test(t) && PICKET_WORD.test(t)) {
    if (forbidden(t)) return refuse(s, 'comms', 'refuseRuseComms', t, [RUSE_REASON], r);
    r.push(say('comms', 'relayed'));
    return roakeRespond(s, t, r, 'captain');
  }
  if (SCAN_CARGO.test(t) || (SEND.test(t) && EVIDENCE.test(t))) return sendEvidence(s, r, SEND.test(t));
  if (SEND.test(t) && MANIFEST.test(t)) return sendManifest(s, r);
  if (PRIVATE.test(t)) return marrowPrivate(s, r);
  if (INSPECT_ALL.test(t) || DEAL_TOKEN.test(t) || DEAL_HOLD.test(t)) {
    r.push(say('comms', 'relayed'));
    return roakeRespond(s, t, r, 'captain');
  }
  r.push(say('xo', 'picketUnclear', { description: raw.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  if (READ.test(t)) return marrowRead(s, r);
  if (TELEMETRY.test(t) && /\b(chief|okafor)\b/.test(t)) return telemetry(s, r);
  const line = (role: 'xo' | 'comms' | 'sensors' | 'engineering', key: string) => {
    r.push(say(role, key, vars(s)));
    return s;
  };
  if (/\b(relief|relieved|replacement)\b/.test(t)) return line('comms', knows(s, 'orders') ? 'reliefKnown' : 'reliefUnknown');
  if (/\b(sweep|wake|behind us)\b/.test(t)) return line('sensors', knows(s, 'sweep') ? 'sweepKnown' : 'sweepUnknown');
  if (/\b(how long|how much time|time left|deadline|wrenmoor|colony|reactor)\b/.test(t)) return knows(s, 'window') ? line('engineering', 'timeKnown') : line('xo', knows(s, 'claim') ? 'timeClaimed' : 'timeUnknown');
  if (/\b(orders|what does he want|why is he)\b/.test(t)) return line('comms', knows(s, 'orders') ? 'ordersKnown' : 'ordersUnknown');
  if (COUNSEL.test(t) || /\b(bluff|ruse)\b/.test(t)) return line('xo', 'marrowCounsel');
  return line('xo', CASE.test(t) ? 'statusPicket' : 'statusPicket');
}

// ------------------------------------------------------------------ the clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(picketClock);
  step(completions);
  step(deadline);
  return { state: s, reports };
}

/** How far past the picket's station the Halcyon can go before she has crossed his line. */
const LINE_MARGIN = 1500;

function housekeeping(s: WorldState, r: Report[]): WorldState {
  const k = s.ships.kestrel;
  if (k.nav || k.velocity.x || k.velocity.y) s = patchShip(s, 'kestrel', { nav: null, velocity: { x: 0, y: 0 } });
  const moved = s.counters.rescued ?? 0;
  if (moved > 0) {
    s = patchShip(s, 'kestrel', (x) => ({ souls: x.souls + moved }));
    s = patchShip(s, 'halcyon', (h) => ({ souls: Math.max(0, h.souls - moved) }));
    s = setCounter(s, 'rescued', 0);
  }
  if (s.flags.shotsFired) {
    r.push(comms(who(s), 'roakeFiredOn'));
    s = setFlag(s, 'firedOnPicket');
    return setFlag(s, 'endIncident');
  }
  if (s.ships.halcyon.tractor.target === 'cruiser') {
    s = patchShip(s, 'halcyon', { tractor: { target: null } });
    s = setCounter(s, 'suspicion', susp(s) + 1);
    s = setFlag(s, 'tractoredPicket');
    r.push(say('xo', 'tractorForce'));
  }
  if (s.flags.lockedOnCruiser && !s.flags.lockNoted) {
    s = setFlag(s, 'lockNoted');
    const proud = picket(s).temperament === 'proud' && !relieved(s);
    if (proud) s = setFlag(s, 'dugIn');
    r.push(comms(who(s), proud ? 'roakeLockProud' : 'roakeLockNoted'));
  }
  if (s.flags.jumped || s.ships.halcyon.position.x < -30000) {
    r.push(say('xo', 'leftNarrows'));
    return setFlag(s, 'endTurned');
  }
  if (s.ships.halcyon.position.x > s.ships.cruiser.position.x + LINE_MARGIN) return doRun(s, r);
  return s;
}

function relief(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'relieved');
  s = patchCharacter(s, 'roake', { status: 'stasis' });
  s = patchCharacter(s, 'dahl', { status: 'active' });
  s = setCounter(s, 'suspicion', 0);
  s = setFlag(s, 'impoundOffer', false);
  r.push(say('sensors', 'reliefArrives'));
  r.push(comms('dahl', 'dahlArrives'));
  return s;
}

function picketClock(s: WorldState, r: Report[]): WorldState {
  const v = picket(s);
  if (s.turn >= 1 && !s.flags.roakeHailed) {
    s = setFlag(s, 'roakeHailed');
    s = setFlag(s, 'roakeHeard');
    r.push(comms('roake', 'roakeHail'));
  }
  if (s.turn >= 2 && !s.flags.reeveCalled) {
    s = setFlag(s, 'reeveCalled');
    s = revealFact(s, 'claim');
    r.push(comms('marchbank', v.reeve === 'desperate' ? 'reeveCallDesperate' : 'reeveCallSteady', vars(s)));
  }
  if (s.turn >= v.sweepAt && !s.flags.sweepDone) {
    s = setFlag(s, 'sweepDone');
    r.push(say('sensors', 'sweepDone'));
  }
  if (s.turn === 6 && !s.flags.spokeRoake && !relieved(s)) r.push(comms('roake', 'roakeStillWaiting'));
  const ia = s.counters.interceptAt ?? 0;
  if (ia > 0 && s.turn >= ia && !knows(s, 'orders')) {
    s = revealFact(s, 'orders');
    r.push(say('comms', 'interceptDone', vars(s)));
  }
  if (s.turn >= v.reliefAt && !relieved(s)) {
    if (holding(s) && v.orders === 'delay') return pass(s, 'deal', r, 'roakeKeepsWord', 'roake');
    if (inspecting(s)) return s;
    return relief(s, r);
  }
  return s;
}

function completions(s: WorldState, r: Report[]): WorldState {
  const end = s.counters.inspectEnd ?? 0;
  if (end > 0 && s.turn >= end) {
    if (s.flags.dealToken) return pass(s, 'deal', r, 'roakeTokenDone');
    return pass(s, 'inspected', r, relieved(s) ? 'dahlInspectDone' : 'roakeInspectDone');
  }
  const hold = s.counters.holdUntil ?? 0;
  if (hold > 0 && s.turn >= hold) return pass(s, 'deal', r, 'roakeKeepsWord');
  return s;
}

function deadline(s: WorldState, r: Report[]): WorldState {
  if (s.turn < picket(s).deadline) return s;
  if (holding(s) || inspecting(s)) s = setFlag(s, 'keptWordToTheEnd');
  r.push(say('engineering', 'tooLate'));
  r.push(comms('marchbank', 'reeveDark'));
  return setFlag(s, 'endDark');
}
