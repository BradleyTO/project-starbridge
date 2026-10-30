/**
 * Coldwater — the agents: Petty Officer Mara Tennant and the watch that has stopped work, the plant
 * supervisor Lt. Garrick Penhale and his leading hand Petty Officer Sian Corley (one of whom
 * falsified the maintenance log), Director Annick Toller on the station below, Inspector-Commander
 * Noor Hadley on her courier, and the Halcyon's officers. Deterministic: no randomness after setup.
 *
 * Leadership is the point. The machinery is not the mystery: the plant can be restarted in minutes
 * by a full watch. What is broken is trust, and the strikers are partly right. The captain can order
 * them back (a lawful order), force them back, restart without them, or find out the truth, tell it
 * straight, hear the people involved before blaming anyone, and give the watch a reason to trust the
 * bridge. Chief Okafor is caught between her people and the chain of command, and her plant's own
 * sensor record is the one thing nobody can argue with. Judged on what was known when each decision
 * was made (ISA-COM-001 §1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, revealFact, setCounter, setFlag } from '../../engine/state';
import { recordRefusal } from '../../engine/roe';
import { MAX_TURNS } from '../../engine/rules';
import type { Falsifier } from './setup';
import { coldwater, innocentOf } from './setup';
import {
  ACK, CALL_REVIEW, CASE, CAUSE, CLOSE_MATTER, CORLEY_WORD, COUNSEL, DENY, EVAC, FORCE, GO_DOWN, GO_UP, INQUIRY, INSPECTOR_WORD, INSPECT_PLANT, LOG_HISTORY, LOYAL_WATCH,
  ORDER_BACK, OWN_WATCH, PENHALE_WORD, PROMISE_POWER, PULL_RECORD, QUESTION_OFFICER, RELIEVE, REPLACE_VALVE, RESTART, SEND_MARROW, STATION_WORD, STRAND_W, STRIKER_WORD,
  TELL, TERM_AMNESTY, TERM_INSPECT, THREAT, TRUTH,
} from './words';

const END_FLAGS = ['endOnline', 'endSecond', 'endWhitewash', 'endCold', 'endLeft', 'endFired', 'endStalemate'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const mins = (n: number) => Math.max(0, n);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;

/** What the bridge can prove about the log: the plant's own record, or (for a deleted report) the log's edit history. */
export const evidence = (s: WorldState) => knows(s, 'record') || (coldwater(s).method === 'deleted' && knows(s, 'history'));
/** Whether the plant is known to be safe to work in. */
export const plantSafe = (s: WorldState) => knows(s, 'sister') && (coldwater(s).sister === 'sound' || !!s.flags.valveReplaced);
const present = (s: WorldState) => !!(s.flags.inEngineering || s.flags.marrowBelow || s.flags.okaforBelow);
const back = (s: WorldState) => !!s.flags.strikersBack;
const plantBusy = (s: WorldState) => c(s, 'sisterAt') > 0 || c(s, 'replaceAt') > 0 || c(s, 'restartAt') > 0;

export function vars(s: WorldState): Record<string, string | number> {
  const v = coldwater(s);
  return {
    turn: s.turn,
    battery: s.flags.evacuated ? 0 : mins(v.stationAt - s.turn),
    falsifier: v.falsifier,
    innocent: innocentOf(v.falsifier),
    method: v.method,
    sister: v.sister,
    temper: v.temper,
    lean: v.lean,
    chiefSigned: v.chiefSigned ? 1 : 0,
    evidence: evidence(s) ? 1 : 0,
    knowsRecord: knows(s, 'record') ? 1 : 0,
    knowsHistory: knows(s, 'history') ? 1 : 0,
    knowsSister: knows(s, 'sister') ? 1 : 0,
    knowsCause: knows(s, 'cause') ? 1 : 0,
    safe: plantSafe(s) ? 1 : 0,
    back: back(s) ? 1 : 0,
    forced: s.flags.forced ? 1 : 0,
    locked: s.flags.lockedOut ? 1 : 0,
    evacuated: s.flags.evacuated ? 1 : 0,
    evacuating: c(s, 'evacAt') > 0 ? 1 : 0,
    review: s.flags.reviewOpened ? 1 : 0,
    replaced: s.flags.valveReplaced ? 1 : 0,
    present: present(s) ? 1 : 0,
    busy: plantBusy(s) ? 1 : 0,
    online: s.flags.reactorOnline ? 1 : 0,
  };
}

// ------------------------------------------------------------------ the plant ---

/** Start (or continue) the work on the plant with whoever is on it: inspect, replace if cracked, restart. */
function planPlant(s: WorldState, full: boolean, skipInspection = false): WorldState {
  const v = coldwater(s);
  s = setFlag(s, full ? 'fullWatch' : 'halfWatch');
  if (!knows(s, 'sister') && !skipInspection) {
    if (!c(s, 'sisterAt')) s = setCounter(s, 'sisterAt', s.turn + (full ? 1 : 2));
    return s;
  }
  if (knows(s, 'sister') && v.sister === 'cracked' && !s.flags.valveReplaced) {
    if (!c(s, 'replaceAt')) s = setCounter(s, 'replaceAt', s.turn + (full ? 2 : 4));
    return s;
  }
  if (!c(s, 'restartAt')) s = setCounter(s, 'restartAt', s.turn + (full ? 2 : 3));
  return s;
}

export function inspect(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'sister')) {
    r.push(say('engineering', coldwater(s).sister === 'cracked' ? (s.flags.valveReplaced ? 'sisterReplacedAlready' : 'sisterKnownCracked') : 'sisterKnownSound'));
    return s;
  }
  if (c(s, 'sisterAt') > 0) {
    r.push(say('engineering', 'inspecting'));
    return s;
  }
  s = setFlag(s, 'inspectionOrdered');
  if (!s.flags.restartOrdered) s = setFlag(s, 'inspectedFirst');
  s = setCounter(s, 'sisterAt', s.turn + (back(s) ? 1 : 2));
  r.push(say('engineering', s.flags.lockedOut ? 'inspectLocked' : 'inspectStart'));
  if (s.flags.lockedOut) s = setCounter(s, 'sisterAt', 0);
  return s;
}

function replaceValve(s: WorldState, r: Report[]): WorldState {
  const v = coldwater(s);
  if (!knows(s, 'sister')) return inspect(s, r);
  if (v.sister === 'sound' || s.flags.valveReplaced) {
    r.push(say('engineering', 'sisterKnownSound'));
    return s;
  }
  if (c(s, 'replaceAt') > 0) {
    r.push(say('engineering', 'replacing'));
    return s;
  }
  if (s.flags.lockedOut && !back(s)) {
    r.push(say('engineering', 'inspectLocked'));
    return s;
  }
  s = setCounter(s, 'replaceAt', s.turn + (back(s) ? 2 : 4));
  r.push(say('engineering', back(s) ? 'replaceFull' : 'replaceHalf'));
  return s;
}

/** The bridge orders the reactor restarted. */
export function restart(s: WorldState, t: string, r: Report[]): WorldState {
  const v = coldwater(s);
  s = setFlag(s, 'restartOrdered');
  if (c(s, 'restartAt') > 0) {
    r.push(say('engineering', 'restarting'));
    return s;
  }
  if (back(s)) {
    if (!plantSafe(s)) {
      if (s.flags.route_terms) {
        // The watch came back on the bridge's word that the plant would be inspected first.
        s = setFlag(s, 'termsBroken');
        s = setFlag(s, 'promiseBroken');
        s = setFlag(s, 'strikersBack', false);
        s = setFlag(s, 'fullWatch', false);
        s = setFlag(s, 'route_terms', false);
        for (const k of ['sisterAt', 'replaceAt', 'restartAt']) s = setCounter(s, k, 0);
        r.push(comms('tennant', 'tennantWalksOut'));
        return s;
      }
      r.push(say('engineering', 'watchInspectsFirst'));
      return planPlant(s, true);
    }
    return planPlant(s, true);
  }
  if (s.flags.lockedOut && !s.flags.forced) {
    r.push(say('engineering', 'restartLocked'));
    return s;
  }
  // Restarting with only the loyal half of the watch, over the strikers' heads.
  if (!s.flags.forced && v.lean === 'people' && !s.flags.chiefPressed) {
    s = setFlag(s, 'chiefPressed');
    r.push(say('engineering', 'okaforTorn'));
    return s;
  }
  if (!knows(s, 'sister')) {
    if (!c(s, 'restartWarned')) {
      s = setCounter(s, 'restartWarned', 1);
      r.push(say('engineering', 'okaforWantsInspection'));
      s = recordRefusal(s, 'engineering', t.slice(0, 80), ['ISA-COM-001 §4.2: crew are not sent into avoidable danger, and a known hazard is contained before a team is sent', 'the sister valve on that line can be inspected first']);
      return s;
    }
    if (c(s, 'sisterAt') > 0) {
      r.push(say('engineering', 'inspecting'));
      return s;
    }
    s = setFlag(s, 'restartUninspected');
    s = setFlag(s, 'restartedWithout');
    s = setCounter(s, 'restartAt', s.turn + 3);
    s = setFlag(s, 'halfWatch');
    r.push(say('engineering', 'restartBlind'));
    return s;
  }
  s = setFlag(s, 'restartedWithout');
  r.push(say('engineering', v.sister === 'cracked' && !s.flags.valveReplaced ? 'restartHalfReplace' : 'restartHalf'));
  return planPlant(s, false);
}

// ------------------------------------------------------------------ the bridge's work ---

function pullRecord(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'record')) {
    r.push(say('engineering', 'recordAgain', vars(s)));
    return s;
  }
  if (c(s, 'recordAt') > 0) {
    r.push(say('engineering', 'recordWorking'));
    return s;
  }
  s = setFlag(s, 'pulledRecord');
  s = setCounter(s, 'recordAt', s.turn + 2);
  r.push(say('engineering', 'recordStart'));
  return s;
}

function logHistory(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'history')) {
    r.push(say('comms', 'historyAgain', vars(s)));
    return s;
  }
  s = revealFact(s, 'history');
  s = setFlag(s, 'checkedHistory');
  r.push(say('comms', coldwater(s).method === 'deleted' ? 'historyDeleted' : 'historyClean', vars(s)));
  return s;
}

function cause(s: WorldState, r: Report[]): WorldState {
  s = revealFact(s, 'cause');
  r.push(say('medical', coldwater(s).temper === 'grieving' ? 'causeGrief' : 'cause'));
  return s;
}

function evacuate(s: WorldState, r: Report[]): WorldState {
  if (s.flags.evacuated || c(s, 'evacAt') > 0) {
    r.push(say('helm', s.flags.evacuated ? 'evacDone' : 'evacUnderway'));
    return s;
  }
  s = setFlag(s, 'evacOrdered');
  s = setCounter(s, 'evacAt', s.turn + 4);
  r.push(say('helm', 'evacStart'));
  r.push(comms('toller', 'tollerEvacAgrees'));
  return s;
}

function force(s: WorldState, t: string, r: Report[]): WorldState {
  if (s.flags.forced) {
    r.push(say('tactical', 'forcedAlready'));
    return s;
  }
  if (back(s)) {
    r.push(say('tactical', 'forceNoNeed'));
    return s;
  }
  if (!c(s, 'forceWarned')) {
    s = setCounter(s, 'forceWarned', 1);
    r.push(say('tactical', s.flags.lockedOut ? 'forceWarnLocked' : 'forceWarn'));
    return recordRefusal(s, 'tactical', t.slice(0, 80), ['they are refusing to work, not threatening anyone', 'anyone held aboard is treated humanely, told why and held no longer than necessary (ISA-COM-001 §7.4)']);
  }
  s = setFlag(s, 'forced');
  if (s.flags.lockedOut) s = setFlag(s, 'forcedEntry');
  r.push(say('tactical', s.flags.lockedOut ? 'forceEntry' : 'forceDone'));
  r.push(say('engineering', 'afterForce'));
  return s;
}

function whoNamed(t: string): Falsifier | null {
  const p = PENHALE_WORD.test(t);
  const k = CORLEY_WORD.test(t);
  if (p && !k) return 'penhale';
  if (k && !p) return 'corley';
  return null;
}

function hear(s: WorldState, t: string, r: Report[]): WorldState {
  const who = whoNamed(t);
  if (!who) {
    r.push(say('xo', 'whichOfThem'));
    return s;
  }
  const v = coldwater(s);
  s = setFlag(s, `heard_${who}`);
  if (!evidence(s)) {
    r.push(comms(who, who === v.falsifier ? `${who}Denies_${v.method}` : `${who}Stands`));
    return s;
  }
  s = setFlag(s, `confronted_${who}`);
  r.push(comms(who, who === v.falsifier ? `${who}Confesses_${v.method}` : `${who}Innocent`));
  return s;
}

function relieve(s: WorldState, t: string, r: Report[]): WorldState {
  if (/\b(okafor|the chief)\b/.test(t) && !PENHALE_WORD.test(t) && !CORLEY_WORD.test(t)) {
    s = setFlag(s, 'triedRelieveChief');
    r.push(say('xo', 'notTheChief'));
    return s;
  }
  const who = whoNamed(t);
  if (!who) {
    r.push(say('xo', 'whichOfThem'));
    return s;
  }
  if (s.flags[`relieved_${who}`]) {
    r.push(say('xo', 'relievedAlready'));
    return s;
  }
  const v = coldwater(s);
  s = setFlag(s, `relieved_${who}`);
  if (!s.flags[`heard_${who}`]) s = setFlag(s, 'relievedUnheard');
  if (!evidence(s)) s = setFlag(s, 'relievedOnRumour');
  if (who !== v.falsifier) s = setFlag(s, 'relievedWrong');
  r.push(say('xo', who === 'penhale' ? 'relievedPenhale' : 'relievedCorley'));
  return s;
}

function closeMatter(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'closedOnLog');
  if (evidence(s)) s = setFlag(s, 'closedKnowing');
  r.push(say('xo', 'closingMatter'));
  return setFlag(s, 'endWhitewash');
}

// ------------------------------------------------------------------ the watch ---

type Route = 'truth' | 'inquiry' | 'terms' | 'watch' | 'scapegoat';

function returnToWork(s: WorldState, route: Route, r: Report[]): WorldState {
  s = setFlag(s, 'strikersBack');
  s = setFlag(s, `route_${route}`);
  s = setFlag(s, 'halfWatch', false);
  s = setCounter(s, 'tennantSaidAt', s.turn + 1);
  r.push(comms('tennant', `tennantReturns_${route}`, vars(s)));
  if (route === 'watch') {
    r.push(say('engineering', 'captainsWatch'));
    return setCounter(s, 'restartAt', s.turn + 2);
  }
  // Whatever brought them back, the watch looks at that sister valve before anyone lights the plant.
  return planPlant(s, true);
}

/** What Petty Officer Tennant makes of the captain's words (directly, over the intercom, or through Marrow). */
export function tennantRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = coldwater(s);
  if (settled(s)) {
    r.push(comms('tennant', 'tennantAfter'));
    return s;
  }
  if (s.flags.forced) {
    r.push(comms('tennant', 'tennantConfined'));
    return s;
  }
  if (back(s)) {
    if (c(s, 'tennantSaidAt') === s.turn + 1) return s;
    r.push(comms('tennant', 'tennantWorking', vars(s)));
    return s;
  }
  s = setFlag(s, 'spokeTennant');
  if (s.flags.lockedOut && !present(s)) {
    r.push(comms('tennant', 'tennantSealed'));
    return s;
  }
  if (c(s, 'silentUntil') > s.turn) {
    r.push(comms('tennant', 'tennantSilent'));
    return s;
  }
  if (THREAT.test(t)) {
    s = setFlag(s, 'threatened');
    if (v.temper === 'hothead' && !s.flags.lockedOut) {
      s = setFlag(s, 'lockedOut');
      r.push(comms('tennant', 'tennantSeals'));
      return s;
    }
    if (v.temper === 'grieving') {
      s = setCounter(s, 'silentUntil', s.turn + 3);
      r.push(comms('tennant', 'tennantBreaks'));
      return s;
    }
    r.push(comms('tennant', 'tennantChargeUs'));
    return s;
  }
  s = setFlag(s, 'engaged');
  if (DENY.test(t)) {
    s = setFlag(s, 'denied');
    if (evidence(s)) s = setFlag(s, 'deniedKnowing');
    r.push(comms('tennant', 'tennantDenied'));
    return s;
  }
  const lines: string[] = [];
  // Naming someone.
  const named = whoNamed(t);
  const blames = !!named && /\b(falsif\w*|faked|forged|doctored|altered|edited|deleted|erased|did (it|this)|responsible|to blame|lied|buried|signed (it|off)|covered)\b/.test(t);
  if (blames && named) {
    if (!evidence(s)) {
      s = setFlag(s, 'overstated');
      lines.push('tennantShowUs');
    } else if (named === v.falsifier) {
      s = setFlag(s, 'namedRight');
      s = setFlag(s, 'toldTruth');
    } else {
      s = setFlag(s, 'namedWrong');
    }
  } else if (TRUTH.test(t)) {
    if (evidence(s)) s = setFlag(s, 'toldTruth');
    else if (/\b(falsif\w*|faked|forged|doctored|altered|edited|deleted|erased|removed|you were right)\b/.test(t)) {
      s = setFlag(s, 'overstated');
      lines.push('tennantShowUs');
    }
  }
  if (evidence(s) && v.chiefSigned && /\b(chief|okafor|countersign\w*|her (name|signature))\b/.test(t)) s = setFlag(s, 'toldChief');
  if (ACK.test(t) || STRAND_W.test(t)) {
    s = setFlag(s, 'acknowledged');
    if (present(s)) s = setFlag(s, 'ackInPerson');
  }
  if (INQUIRY.test(t)) s = setFlag(s, 'offeredReview');
  if (TERM_INSPECT.test(t)) s = setFlag(s, 'termInspect');
  if (TERM_AMNESTY.test(t)) s = setFlag(s, 'termAmnesty');
  if (ORDER_BACK.test(t) && !lines.length) s = setFlag(s, 'orderedBack');

  // Does the watch go back?
  const griefMet = v.temper !== 'grieving' || !!s.flags.ackInPerson;
  const hardened = !!s.flags.denied && !s.flags.toldTruth;
  const hotMet = v.temper !== 'hothead' || !s.flags.threatened || !!s.flags.toldTruth;
  const chiefMet = !v.chiefSigned || !!s.flags.toldChief;
  if (OWN_WATCH.test(t)) {
    if (!s.flags.inEngineering) lines.push('tennantFromBridge');
    else if (!plantSafe(s)) {
      s = setFlag(s, 'ownWatchUninspected');
      r.push(say('engineering', 'okaforNotYet'));
      s = recordRefusal(s, 'engineering', 'stand the restart watch in an uninspected plant', ['ISA-COM-001 §4.2: a known hazard is contained before a team is sent', 'the sister valve has not been inspected']);
      return s;
    } else if (!hardened && (v.temper !== 'principled' || s.flags.toldTruth || s.flags.reviewOpened)) return returnToWork(s, 'watch', r);
  }
  if (!hardened && griefMet && s.flags.toldTruth && s.flags[`relieved_${v.falsifier}`] && chiefMet) return returnToWork(s, 'truth', r);
  if (s.flags.namedWrong && s.flags[`relieved_${innocentOf(v.falsifier)}`] && griefMet) return returnToWork(s, 'scapegoat', r);
  if (!hardened && griefMet && hotMet && s.flags.reviewOpened && s.flags.offeredReview) return returnToWork(s, 'inquiry', r);
  if (!hardened && griefMet && hotMet && v.temper !== 'principled' && s.flags.termInspect && s.flags.termAmnesty) return returnToWork(s, 'terms', r);

  // Not yet: say what is missing, in her own way.
  if (!lines.length) {
    if (hardened) lines.push('tennantHardened');
    else if (s.flags.namedWrong) lines.push('tennantNamedWrong');
    else if (!griefMet) lines.push(s.flags.acknowledged ? 'tennantNotFromThere' : 'tennantGrief');
    else if (s.flags.toldTruth && !chiefMet) lines.push('tennantChief');
    else if (s.flags.toldTruth && !s.flags[`relieved_${v.falsifier}`]) lines.push('tennantStillOnDuty');
    else if (s.flags.offeredReview && !s.flags.reviewOpened) lines.push('tennantCallIt');
    else if (s.flags.termInspect && v.temper === 'principled') lines.push('tennantWantsAnswer');
    else if (s.flags.termInspect && !s.flags.termAmnesty) lines.push('tennantWhatAfter');
    else if (s.flags.termAmnesty && !s.flags.termInspect) lines.push('tennantNotTheValve');
    else if (ORDER_BACK.test(t)) lines.push(v.temper === 'hothead' ? 'tennantRefusesHot' : 'tennantRefuses');
    else if (s.flags.acknowledged && v.temper === 'grieving') lines.push('tennantThanks');
    else lines.push(v.temper === 'hothead' ? 'tennantHot' : v.temper === 'grieving' ? 'tennantGriefListening' : 'tennantPrincipled');
  }
  // One line of the captain's split into several clauses earns one "not yet" from her, not three.
  if (c(s, 'tennantSaidAt') === s.turn + 1 && !s.flags.overstated) return s;
  s = setCounter(s, 'tennantSaidAt', s.turn + 1);
  for (const k of lines.slice(0, 1)) r.push(comms('tennant', k, vars(s)));
  return s;
}

// ------------------------------------------------------------------ the station and the inspector ---

export function tollerRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('toller', 'tollerAfter'));
    return s;
  }
  s = setFlag(s, 'spokeToller');
  if (EVAC.test(t) || /\b(bring you|lift you|come up|take you) (up|aboard|off)\b/.test(t)) return evacuate(s, r);
  if (PROMISE_POWER.test(t)) {
    s = setFlag(s, 'promisedToller');
    r.push(comms('toller', 'tollerTakesWord', vars(s)));
    return s;
  }
  if (/\b(strike|refus\w*|crew|death|died|accident|what('?s| is) (wrong|happening)|why)\b/.test(t)) {
    s = setFlag(s, 'toldToller');
    r.push(comms('toller', 'tollerUnderstands', vars(s)));
    return s;
  }
  r.push(comms('toller', 'tollerStatus', vars(s)));
  return s;
}

const DISCLOSE = /\b(falsif\w*|faked|forged|doctored|altered|edited|deleted|erased|buried|cover[- ]?up|covered up|suspect|may have been|might have been|rumou?r|full record|everything|whole record|uncut|the (plant'?s )?(record|telemetry)|his report|he reported|signed off|never inspected)\b/;

export function hadleyRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('hadley', 'hadleyAfter'));
    return s;
  }
  s = setFlag(s, 'spokeHadley');
  if (CLOSE_MATTER.test(t) || /\b(log|record) (it|this|his death) as an accident\b/.test(t)) return closeMatter(s, r);
  if (/\b(between us|internal(ly)?|off the record|quietly|in house|in-house|keep (it|this) (quiet|internal|aboard))\b/.test(t)) {
    s = setFlag(s, 'askedQuiet');
    r.push(comms('hadley', 'hadleyNoQuiet'));
    return s;
  }
  if (DENY.test(t)) {
    s = setFlag(s, 'toldHadleyClean');
    if (evidence(s)) s = setFlag(s, 'deniedKnowing');
    r.push(comms('hadley', 'hadleyNotesClean'));
    return s;
  }
  const asks = CALL_REVIEW.test(t) || INQUIRY.test(t) || !!s.flags.hadleyAsked;
  if (asks && DISCLOSE.test(t)) {
    if (s.flags.reviewOpened) {
      r.push(comms('hadley', 'hadleyOpenAlready'));
      return s;
    }
    s = setFlag(s, 'reviewOpened');
    s = setFlag(s, 'disclosed');
    r.push(comms('hadley', 'hadleyOpens', vars(s)));
    return s;
  }
  if (asks) {
    s = setFlag(s, 'hadleyAsked');
    r.push(comms('hadley', 'hadleyAsksLog'));
    return s;
  }
  r.push(comms('hadley', 'hadleyStatus', vars(s)));
  return s;
}

// ------------------------------------------------------------------ orders and questions ---

const ROLE_PREFIX = /^(helm|tactical|ops|science|comms|xo): /;

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  let t = raw.toLowerCase().trim();
  const role = ROLE_PREFIX.exec(t)?.[1] ?? null;
  t = t.replace(ROLE_PREFIX, '');
  if (settled(s)) {
    r.push(say('xo', 'afterEnd'));
    return s;
  }
  if (GO_UP.test(t)) {
    s = setFlag(s, 'inEngineering', false);
    r.push(say('xo', 'backOnBridge'));
    return s;
  }
  if (CLOSE_MATTER.test(t)) return closeMatter(s, r);
  if (TELL.test(t) && INSPECTOR_WORD.test(t)) {
    r.push(say('comms', 'relayed'));
    return hadleyRespond(s, t, r);
  }
  if (CALL_REVIEW.test(t) && !STRIKER_WORD.test(t)) {
    r.push(say('comms', 'relayedInspector'));
    return hadleyRespond(s, t, r);
  }
  if (TELL.test(t) && STATION_WORD.test(t) && !STRIKER_WORD.test(t)) {
    r.push(say('comms', 'relayed'));
    return tollerRespond(s, t, r);
  }
  if (EVAC.test(t)) return evacuate(s, r);
  if (FORCE.test(t) && !RELIEVE.test(t)) return force(s, t, r);
  if (RELIEVE.test(t)) return relieve(s, t, r);
  if (QUESTION_OFFICER.test(t) && !TELL.test(t.replace(/\bask\b/, ''))) return hear(s, t, r);
  if (PULL_RECORD.test(t)) return pullRecord(s, r);
  if (LOG_HISTORY.test(t)) return logHistory(s, r);
  if (CAUSE.test(t)) return cause(s, r);
  if (REPLACE_VALVE.test(t)) return replaceValve(s, r);
  if (INSPECT_PLANT.test(t) && !STRIKER_WORD.test(t) && !TERM_INSPECT.test(t)) return inspect(s, r);
  if (GO_DOWN.test(t) && role !== 'xo' && role !== 'ops') {
    if (s.flags.inEngineering) {
      r.push(say('xo', 'alreadyBelow'));
      return s;
    }
    s = setFlag(s, 'inEngineering');
    s = setFlag(s, 'wentDown');
    r.push(say('xo', s.flags.lockedOut ? 'downToHatch' : 'downToEngineering'));
    r.push(comms('tennant', s.flags.lockedOut ? 'tennantAtHatch' : s.flags.forced ? 'tennantConfined' : back(s) ? 'tennantWorking' : 'tennantMeets', vars(s)));
    return s;
  }
  if ((role === 'xo' && /\b(go|head|talk|speak|sit|reason|mediate)\b/.test(t) && (STRIKER_WORD.test(t) || /\b(them|engineering|below|down)\b/.test(t))) || SEND_MARROW.test(t)) {
    s = setFlag(s, 'marrowBelow');
    r.push(say('xo', 'marrowGoes'));
    return s;
  }
  if (role === 'ops' && /\b(talk|speak|go|reason|tell)\b/.test(t) && (STRIKER_WORD.test(t) || /\b(them|your people|engineering|below|down)\b/.test(t))) {
    const v = coldwater(s);
    if (v.chiefSigned && !evidence(s)) {
      r.push(say('engineering', 'okaforNotTrusted'));
      return s;
    }
    s = setFlag(s, 'okaforBelow');
    r.push(say('engineering', v.lean === 'people' ? 'okaforGoesGladly' : 'okaforGoes'));
    return s;
  }
  if (RESTART.test(t) && !STRIKER_WORD.test(t.replace(LOYAL_WATCH, '')) && (role === 'ops' || !s.flags.inEngineering || /\b(chief|okafor|a watch|loyal)\b/.test(t))) return restart(s, t, r);
  if (TELL.test(t) && STRIKER_WORD.test(t)) {
    if (!present(s)) r.push(say('comms', 'intercom'));
    return tennantRespond(s, t, r);
  }
  if (s.flags.inEngineering || STRIKER_WORD.test(t) || (present(s) && (STRAND_W.test(t) || ACK.test(t)))) return tennantRespond(s, t, r);
  if (THREAT.test(t) || ORDER_BACK.test(t) || ACK.test(t) || DENY.test(t) || TRUTH.test(t) || TERM_INSPECT.test(t) || OWN_WATCH.test(t)) {
    r.push(say('xo', 'notHeard'));
    return s;
  }
  r.push(say('xo', 'coldwaterUnclear', { description: raw.replace(ROLE_PREFIX, '').slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  const line = (role: 'xo' | 'comms' | 'engineering' | 'medical' | 'tactical', key: string) => {
    r.push(say(role, key, vars(s)));
    return s;
  };
  if (CAUSE.test(t) || /\b(killed|died|death)\b/.test(t)) return cause(s, r);
  if (/\b(rumou?r|chief knew|did you know|your signature|countersign\w*)\b/.test(t)) return line('engineering', evidence(s) ? (coldwater(s).chiefSigned ? 'chiefSignedTold' : 'chiefClean') : 'chiefRumour');
  if (/\b(sister|valve|safe|plant)\b/.test(t)) return line('engineering', knows(s, 'sister') ? (plantSafe(s) ? 'plantSafeNow' : 'sisterKnownCracked') : 'plantUnknown');
  if (/\b(log|record|report|falsif\w*|cover[- ]?up|who did|true)\b/.test(t)) return line('xo', evidence(s) ? 'evidenceKnown' : c(s, 'recordAt') > 0 ? 'evidenceComing' : 'evidenceNone');
  if (/\b(tennant|strikers?|watch|what do they want|they want)\b/.test(t)) return line('xo', back(s) ? 'watchBack' : coldwater(s).temper === 'grieving' ? 'readGrief' : coldwater(s).temper === 'hothead' ? 'readHot' : 'readPrincipled');
  if (/\b(station|toller|batter(y|ies)|how long)\b/.test(t)) return line('comms', s.flags.evacuated ? 'stationEvacuated' : 'stationStatus');
  if (/\b(hadley|inspector|review|inquiry)\b/.test(t)) return line('comms', s.flags.reviewOpened ? 'reviewStatus' : 'inspectorStatus');
  if (COUNSEL.test(t)) return line('xo', 'marrowCounsel');
  if (CASE.test(t)) return line('xo', 'statusColdwater');
  return line('xo', 'statusColdwater');
}

// ------------------------------------------------------------------ the clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(arrivals);
  step(investigation);
  step(plantWork);
  step(watchClock);
  step(stationClock);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel', 'cruiser'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  if (s.flags.shotsFired) {
    r.push(say('xo', 'shotsFired'));
    return setFlag(s, 'endFired');
  }
  if (s.flags.jumped || Math.abs(s.ships.halcyon.position.x) > 30000 || Math.abs(s.ships.halcyon.position.y) > 34000) {
    r.push(say('xo', 'leftOrbit'));
    return setFlag(s, 'endLeft');
  }
  return s;
}

function arrivals(s: WorldState, r: Report[]): WorldState {
  if (s.turn >= 1 && !s.flags.tollerCalled) {
    s = setFlag(s, 'tollerCalled');
    r.push(comms('toller', 'tollerCall', vars(s)));
  }
  return s;
}

function investigation(s: WorldState, r: Report[]): WorldState {
  const v = coldwater(s);
  const ra = c(s, 'recordAt');
  if (ra > 0 && s.turn >= ra && !knows(s, 'record')) {
    s = setCounter(s, 'recordAt', 0);
    s = revealFact(s, 'record');
    r.push(say('engineering', `record_${v.method}`, vars(s)));
    if (v.chiefSigned) r.push(say('engineering', 'recordChiefSigned', vars(s)));
  }
  return s;
}

function plantWork(s: WorldState, r: Report[]): WorldState {
  const v = coldwater(s);
  const sa = c(s, 'sisterAt');
  if (sa > 0 && s.turn >= sa) {
    s = setCounter(s, 'sisterAt', 0);
    s = revealFact(s, 'sister');
    r.push(say('engineering', v.sister === 'cracked' ? 'sisterCracked' : 'sisterSound'));
    if (back(s) || (s.flags.restartedWithout && !s.flags.restartUninspected)) s = planPlant(s, back(s));
  }
  const ra = c(s, 'replaceAt');
  if (ra > 0 && s.turn >= ra) {
    s = setCounter(s, 'replaceAt', 0);
    s = setFlag(s, 'valveReplaced');
    r.push(say('engineering', 'valveReplaced'));
    if (back(s) || s.flags.restartedWithout) s = planPlant(s, back(s));
  }
  const rs = c(s, 'restartAt');
  if (rs > 0 && s.turn >= rs) {
    s = setCounter(s, 'restartAt', 0);
    if (v.sister === 'cracked' && !s.flags.valveReplaced) {
      r.push(say('engineering', 'secondFailure'));
      return setFlag(s, 'endSecond');
    }
    s = setFlag(s, 'reactorOnline');
    r.push(say('engineering', 'reactorOnline'));
    r.push(comms('toller', s.flags.evacuated ? 'tollerPowerEmpty' : 'tollerPowerBack'));
    return setFlag(s, 'endOnline');
  }
  return s;
}

function watchClock(s: WorldState, r: Report[]): WorldState {
  const v = coldwater(s);
  if (v.temper === 'hothead' && s.turn >= v.lockAt && !s.flags.lockedOut && !s.flags.engaged && !back(s) && !s.flags.forced) {
    s = setFlag(s, 'lockedOut');
    s = setFlag(s, 'lockedUnheard');
    for (const k of ['sisterAt', 'replaceAt', 'restartAt']) if (!back(s)) s = setCounter(s, k, 0);
    r.push(say('engineering', 'lockedOutReport'));
  }
  if (v.temper === 'hothead' && s.turn === v.lockAt - 2 && !s.flags.engaged && !s.flags.hotWarned && !back(s)) {
    s = setFlag(s, 'hotWarned');
    r.push(say('engineering', 'hotBrewing'));
  }
  return s;
}

function stationClock(s: WorldState, r: Report[]): WorldState {
  const v = coldwater(s);
  const ea = c(s, 'evacAt');
  if (ea > 0 && s.turn >= ea && !s.flags.evacuated) {
    s = setCounter(s, 'evacAt', 0);
    s = setFlag(s, 'evacuated');
    r.push(say('helm', 'evacDone'));
    r.push(comms('toller', 'tollerAboard'));
  }
  if (!s.flags.evacuated && !s.flags.reactorOnline) {
    if (s.turn === v.stationAt - 6 && !s.flags.stationHalf) {
      s = setFlag(s, 'stationHalf');
      r.push(comms('toller', 'tollerHalf', vars(s)));
    }
    if (s.turn === v.stationAt - 2 && !s.flags.stationLow) {
      s = setFlag(s, 'stationLow');
      r.push(comms('toller', 'tollerLow', vars(s)));
    }
    if (s.turn >= v.stationAt) {
      if (s.flags.promisedToller) s = setFlag(s, 'promiseBroken');
      r.push(comms('toller', 'tollerDark'));
      return setFlag(s, 'endCold');
    }
  }
  if (s.turn >= MAX_TURNS - 1 && !s.flags.reactorOnline) {
    r.push(say('xo', 'stillStanding'));
    return setFlag(s, 'endStalemate');
  }
  return s;
}

export { CASE, COUNSEL };
