/**
 * Tribunal at Kesh Varo — agents: Crewman Jory Askel in Orun Hold, Magister Lirra Soth of the
 * Quiet Stone Tribunal, Keeper Yasha Dorn, Pilgrim Elen Toras (when she can speak), Fleet Command
 * (Commodore Niall Brask) by signal, and the Halcyon's officers. Deterministic: no randomness
 * after setup.
 *
 * Ethics under orders is the point. Fleet says respect local sovereignty; Askel faces a capital
 * charge; Dr. Osei can prove or disprove the medical emergency. Force extraction while peaceful
 * alternatives remain is refused under the Code. Judged on what was known when each decision was
 * made (ISA-COM-001 §1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, revealFact, setCounter, setFlag } from '../../engine/state';
import { recordRefusal } from '../../engine/roe';
import { MAX_TURNS } from '../../engine/rules';
import { tribunal } from './setup';
import {
  ACCOUNT, ASKEL_WORD, CASE, COUNSEL, CUSTOM, DORN_WORD, EXAMINE, EXTRACT, FIND_PILGRIM, FLEET_WORD,
  HANDOVER, IS_QUESTION, NEGOTIATE, PRESENT, PRINCIPLED, REFUSE, RELINQUISH, SOTH_WORD, TELL, TORAS_WORD,
} from './words';

const END_FLAGS = ['endAcquitted', 'endCommuted', 'endExchange', 'endExtracted', 'endSentenced', 'endRelieved', 'endHanded', 'endPrincipled', 'endFired'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]) || !!s.flags.jumped;
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const ROLE_PREFIX = /^(helm|tactical|ops|science|comms|xo|medical|engineering|sensors): /;

export const medicalReady = (s: WorldState) => knows(s, 'medical');
export const heardAskel = (s: WorldState) => !!s.flags.heardAskel;
export const peacefulOpen = (s: WorldState) => !settled(s) && !s.flags.endSentenced && !medicalReady(s);

export function vars(s: WorldState): Record<string, string | number> {
  const v = tribunal(s);
  return {
    turn: s.turn,
    truth: v.truth,
    bench: v.bench,
    pilgrim: v.pilgrim,
    trialIn: Math.max(0, v.trialAt - s.turn),
    relieveIn: Math.max(0, v.relieveAt - s.turn),
    fleetIn: Math.max(0, v.fleetAt - s.turn),
    signal: s.flags.fleetSignal ? 1 : 0,
    medical: medicalReady(s) ? 1 : 0,
    heard: heardAskel(s) ? 1 : 0,
    pilgrimKnown: knows(s, 'pilgrim') ? 1 : 0,
    customKnown: knows(s, 'custom') ? 1 : 0,
    examining: c(s, 'examAt') > 0 ? 1 : 0,
    briefSupports: s.flags.briefSupports ? 1 : 0,
    briefRejects: s.flags.briefRejects ? 1 : 0,
  };
}

// ------------------------------------------------------------------ endings ---

function end(s: WorldState, flag: (typeof END_FLAGS)[number], r: Report[], key: string, role: 'xo' | 'comms' | 'medical' | 'tactical' = 'xo'): WorldState {
  if (settled(s)) return s;
  r.push(say(role, key, vars(s)));
  return setFlag(s, flag);
}

// ------------------------------------------------------------------ medical ---

function startExam(s: WorldState, r: Report[]): WorldState {
  if (medicalReady(s)) {
    r.push(say('medical', s.flags.briefSupports ? 'medicalSupports' : 'medicalRejects', vars(s)));
    return s;
  }
  if (c(s, 'examAt') > 0) {
    r.push(say('medical', 'medicalWorking'));
    return s;
  }
  if (!s.flags.heardAskel && !s.flags.examUnheard) {
    s = setFlag(s, 'examUnheard');
    r.push(say('medical', 'oseiWantsAccount'));
  }
  s = setFlag(s, 'examOrdered');
  if (!s.flags.extractedAttempt) s = setFlag(s, 'peacefulTried');
  s = setCounter(s, 'examAt', s.turn + 2);
  r.push(say('medical', 'medicalStart', vars(s)));
  return s;
}

function finishExam(s: WorldState, r: Report[]): WorldState {
  if (medicalReady(s) || c(s, 'examAt') === 0 || s.turn < c(s, 'examAt')) return s;
  const v = tribunal(s);
  s = setCounter(s, 'examAt', 0);
  s = revealFact(s, 'medical');
  // Rescue + living/dead pilgrim supports; staged never supports; trespass rarely does.
  const supports = v.truth === 'rescue' || (v.truth === 'trespass' && v.pilgrim === 'alive' && s.flags.pilgrimHeard);
  if (supports) {
    s = setFlag(s, 'briefSupports');
    r.push(say('medical', 'medicalSupports', vars(s)));
  } else {
    s = setFlag(s, 'briefRejects');
    r.push(say('medical', 'medicalRejects', vars(s)));
  }
  return s;
}

// ------------------------------------------------------------------ pilgrim ---

function findPilgrim(s: WorldState, r: Report[]): WorldState {
  const v = tribunal(s);
  if (knows(s, 'pilgrim') && s.flags.pilgrimHeard) {
    r.push(comms('toras', v.truth === 'rescue' ? 'torasConfirms' : 'torasWeak', vars(s)));
    return s;
  }
  if (v.pilgrim === 'absent') {
    s = revealFact(s, 'pilgrim');
    s = setFlag(s, 'pilgrimAbsent');
    r.push(say('comms', 'pilgrimAbsent', vars(s)));
    return s;
  }
  if (v.pilgrim === 'dead') {
    s = revealFact(s, 'pilgrim');
    s = setFlag(s, 'pilgrimDead');
    r.push(say('medical', 'pilgrimDead', vars(s)));
    return s;
  }
  // alive
  s = revealFact(s, 'pilgrim');
  s = setFlag(s, 'pilgrimHeard');
  s = setFlag(s, 'peacefulTried');
  r.push(comms('toras', v.truth === 'rescue' ? 'torasConfirms' : 'torasWeak', vars(s)));
  return s;
}

// ------------------------------------------------------------------ custom ---

function askCustom(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'custom')) {
    r.push(comms('dorn', 'dornCustomAgain', vars(s)));
    return s;
  }
  s = revealFact(s, 'custom');
  s = setFlag(s, 'heardCustom');
  s = setFlag(s, 'peacefulTried');
  r.push(comms('dorn', `dornCustom_${tribunal(s).bench}`, vars(s)));
  return s;
}

// ------------------------------------------------------------------ Askel ---

export function askelRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = tribunal(s);
  if (settled(s)) {
    r.push(comms('askel', 'askelAfter'));
    return s;
  }
  if (ACCOUNT.test(t) || /\b(what happened|why did you|your (side|account|story)|in your own words)\b/.test(t)) {
    if (!s.flags.heardAskel) {
      s = setFlag(s, 'heardAskel');
      s = revealFact(s, 'account');
      s = setFlag(s, 'peacefulTried');
    }
    r.push(comms('askel', `askelAccount_${v.truth}`, vars(s)));
    return s;
  }
  if (HANDOVER.test(t)) return doHandover(s, r);
  r.push(comms('askel', s.flags.heardAskel ? 'askelStatus' : 'askelWaits'));
  return s;
}

// ------------------------------------------------------------------ Soth ---

function canAcquit(s: WorldState): boolean {
  const v = tribunal(s);
  if (!medicalReady(s)) return false;
  if (s.flags.briefSupports) return v.bench !== 'strict' || !!s.flags.pilgrimHeard || v.truth === 'rescue';
  return false;
}

function canCommute(s: WorldState): boolean {
  const v = tribunal(s);
  if (v.bench === 'strict' && !knows(s, 'custom')) return false;
  if (v.bench === 'custom') return !!s.flags.heardCustom || medicalReady(s) || !!s.flags.negotiated;
  if (v.bench === 'open') return !!s.flags.heardCustom || !!s.flags.negotiated || (medicalReady(s) && !s.flags.briefRejects);
  return !!s.flags.heardCustom && !!s.flags.negotiated;
}

function canExchange(s: WorldState): boolean {
  return !!s.flags.negotiated && (medicalReady(s) || !!s.flags.heardCustom || heardAskel(s));
}

export function sothRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = tribunal(s);
  if (settled(s)) {
    r.push(comms('soth', 'sothAfter'));
    return s;
  }
  s = setFlag(s, 'spokeSoth');
  s = setFlag(s, 'peacefulTried');

  if (PRESENT.test(t) || /\b(acquit|on the evidence|medical brief|not guilty)\b/.test(t)) {
    if (!medicalReady(s)) {
      r.push(comms('soth', 'sothWantsBrief'));
      return s;
    }
    if (canAcquit(s)) {
      s = setFlag(s, 'acquittedOnEvidence');
      r.push(comms('soth', 'sothAcquits'));
      return end(s, 'endAcquitted', r, 'endAcquittedNote', 'comms');
    }
    s = setFlag(s, 'briefRejectedByBench');
    r.push(comms('soth', s.flags.briefRejects ? 'sothRejectsBrief' : 'sothUnconvinced'));
    return s;
  }

  if (NEGOTIATE.test(t) || /\b(commute|commutation|lesser|exchange|both laws|honou?r)\b/.test(t)) {
    s = setFlag(s, 'negotiated');
    if (/\b(exchange|both laws|honou?r|diplomatic|limited (penalty|sentence|service))\b/.test(t) && canExchange(s)) {
      s = setFlag(s, 'exchangeDone');
      r.push(comms('soth', 'sothExchange'));
      return end(s, 'endExchange', r, 'endExchangeNote', 'comms');
    }
    if (/\b(commute|commutation|lesser|custom)\b/.test(t) && canCommute(s)) {
      s = setFlag(s, 'commuted');
      r.push(comms('soth', 'sothCommutes'));
      return end(s, 'endCommuted', r, 'endCommutedNote', 'comms');
    }
    if (!knows(s, 'custom') && v.bench !== 'open') {
      r.push(comms('soth', 'sothAskKeeper'));
      return s;
    }
    r.push(comms('soth', 'sothNotYet'));
    return s;
  }

  if (HANDOVER.test(t)) return doHandover(s, r);

  if (ACCOUNT.test(t) || /\b(your law|capital|quiet stone|what (is|does) (the )?(charge|law))\b/.test(t)) {
    r.push(comms('soth', `sothLaw_${v.bench}`, vars(s)));
    return s;
  }

  r.push(comms('soth', s.flags.spokeSoth ? 'sothStatus' : 'sothGreets', vars(s)));
  return s;
}

export function dornRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('dorn', 'dornAfter'));
    return s;
  }
  if (CUSTOM.test(t) || ACCOUNT.test(t) || /\b(custom|commute|sentence|quiet stone)\b/.test(t)) return askCustom(s, r);
  r.push(comms('dorn', 'dornWaits'));
  return s;
}

// ------------------------------------------------------------------ Fleet ---

function fleetReply(s: WorldState, t: string, r: Report[]): WorldState {
  if (!s.flags.fleetSignal) {
    r.push(say('comms', 'fleetNothingYet', vars(s)));
    return s;
  }
  if (RELINQUISH.test(t) || /\b(you (take|have) the matter|relinquish|cede|relieve me)\b/.test(t)) {
    s = setFlag(s, 'cededToFleet');
    r.push(say('comms', 'fleetTakes'));
    return end(s, 'endRelieved', r, 'endRelievedNote', 'comms');
  }
  if (REFUSE.test(t) && /\b(extract|force|armed|sovereignty)\b/.test(t)) {
    s = setFlag(s, 'refusedExtractOrder');
    r.push(say('comms', 'fleetRefuseNoted'));
    return s;
  }
  if (HANDOVER.test(t)) return doHandover(s, r);
  if (EXTRACT.test(t)) return tryExtract(s, t, r);
  r.push(say('comms', 'fleetAcknowledged'));
  return s;
}

function doHandover(s: WorldState, r: Report[]): WorldState {
  // Capital risk: handing Askel over without contest when the brief is absent or rejects, or when
  // truth is not a proven rescue, engages §7.1 (asylum-1) as a grave-harm handover.
  s = setFlag(s, 'handedOver');
  if (!s.flags.briefSupports) s = setFlag(s, 'graveHandover');
  r.push(say('xo', 'handoverDone'));
  return end(s, 'endHanded', r, 'endHandedNote', 'xo');
}

function tryExtract(s: WorldState, t: string, r: Report[]): WorldState {
  s = setFlag(s, 'extractedAttempt');
  // First order while peaceful alternatives remain: refuse under the Code. A second push forces it.
  if (c(s, 'extractWarned') < 1 && !s.flags.forcedExtract) {
    s = setCounter(s, 'extractWarned', 1);
    r.push(say('tactical', 'extractRefuse'));
    return recordRefusal(s, 'tactical', t.slice(0, 80), [
      'peaceful alternatives remain: the tribunal has not yet sat on the evidence',
      'an armed extraction would break the Kesh Varo trade treaty and breach the Code',
    ]);
  }
  s = setFlag(s, 'forcedExtract');
  s = setCounter(s, 'rescued', 1);
  r.push(say('tactical', 'extractDone'));
  return end(s, 'endExtracted', r, 'endExtractedNote', 'xo');
}

function doPrincipled(s: WorldState, r: Report[]): WorldState {
  // Refuse force and refuse unlawful handover; Askel still condemned; treaty intact.
  s = setFlag(s, 'principledStand');
  r.push(say('xo', 'principledNote'));
  return end(s, 'endPrincipled', r, 'endPrincipledNote', 'xo');
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

  if (PRINCIPLED.test(t)) {
    s = setFlag(s, 'refusedExtractOrder');
    s = setFlag(s, 'refusedHandover');
    return doPrincipled(s, r);
  }
  if (EXTRACT.test(t) || (role === 'tactical' && /\b(extract|armed|storm|raid|break .+ out)\b/.test(t))) {
    // "will not extract" is a refusal, not an extraction order.
    if (REFUSE.test(t) || /\b(will not|won'?t|do not|don'?t)\b.*\bextract\b/.test(t)) {
      s = setFlag(s, 'refusedExtractOrder');
      if (REFUSE.test(t) && /\b(hand|surrender|turn .+ over)\b/.test(t) || /\b(will not|won'?t|do not|don'?t)\b.*\b(hand|surrender)\b/.test(t) || /\bstand on the code|uphold the code|principled\b/.test(t)) {
        s = setFlag(s, 'refusedHandover');
        return doPrincipled(s, r);
      }
      r.push(say('xo', 'principledNote'));
      return s;
    }
    return tryExtract(s, t, r);
  }

  // Principled stand before handover / custom, so "will not hand him over" is not a handover.
  if (/\b(stand on the code|uphold the code|principled)\b/.test(t) || (REFUSE.test(t) && /\b(extract|force|armed|hand|surrender)\b/.test(t))) {
    s = setFlag(s, 'refusedExtractOrder');
    s = setFlag(s, 'refusedHandover');
    return doPrincipled(s, r);
  }
  if (/\b(will not|won'?t|do not|don'?t)\b.*\b(hand|surrender|turn)\b/.test(t) && /\b(extract|force|hand|surrender|code)\b/.test(t)) {
    s = setFlag(s, 'refusedExtractOrder');
    s = setFlag(s, 'refusedHandover');
    return doPrincipled(s, r);
  }

  if (RELINQUISH.test(t)) return fleetReply(s, t, r);
  if (HANDOVER.test(t) && !(REFUSE.test(t) || /\b(will not|won'?t|do not|don'?t)\b/.test(t))) return doHandover(s, r);

  if (EXAMINE.test(t) || role === 'medical') return startExam(s, r);
  if (FIND_PILGRIM.test(t) || (TORAS_WORD.test(t) && /\b(find|hail|speak|talk|call|testify|witness)\b/.test(t))) return findPilgrim(s, r);

  // Present / negotiate with the bench before "custom/commutation" falls through to Dorn alone.
  if (PRESENT.test(t) || NEGOTIATE.test(t) || /\b(acquit|commute|commutation|exchange|both laws)\b/.test(t)) {
    r.push(say('comms', 'relaySoth'));
    return sothRespond(s, t, r);
  }

  if (CUSTOM.test(t) || (DORN_WORD.test(t) && /\b(ask|hail|speak|consult|custom|commute)\b/.test(t))) return askCustom(s, r);

  if (FLEET_WORD.test(t) && (TELL.test(t) || REFUSE.test(t) || RELINQUISH.test(t))) return fleetReply(s, t, r);

  if (TELL.test(t) && SOTH_WORD.test(t)) {
    r.push(say('comms', 'relaySoth'));
    return sothRespond(s, t, r);
  }
  if (TELL.test(t) && ASKEL_WORD.test(t)) {
    r.push(say('comms', 'relayAskel'));
    return askelRespond(s, t, r);
  }
  if (TELL.test(t) && DORN_WORD.test(t)) {
    r.push(say('comms', 'relayDorn'));
    return dornRespond(s, t, r);
  }
  if (TELL.test(t) && TORAS_WORD.test(t)) return findPilgrim(s, r);

  r.push(say('xo', 'tribunalUnclear', { description: t.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t0 = raw.toLowerCase();
  const t = t0.replace(ROLE_PREFIX, '');
  const v = tribunal(s);
  const line = (role: 'xo' | 'comms' | 'medical' | 'tactical', key: string) => {
    r.push(say(role, key, vars(s)));
    return s;
  };
  if (/\b(medical|osei|brief|emergency|collapse)\b/.test(t)) return line('medical', medicalReady(s) ? (s.flags.briefSupports ? 'medicalSupports' : 'medicalRejects') : c(s, 'examAt') > 0 ? 'medicalWorking' : 'medicalAvailable');
  if (/\b(pilgrim|toras|elen)\b/.test(t)) return line('comms', knows(s, 'pilgrim') ? (v.pilgrim === 'alive' ? 'pilgrimAliveStatus' : v.pilgrim === 'dead' ? 'pilgrimDead' : 'pilgrimAbsent') : 'pilgrimUnknown');
  if (/\b(fleet|brask|commodore|treaty|sovereignty)\b/.test(t)) return line('comms', s.flags.fleetSignal ? 'fleetStatus' : 'fleetNothingYet');
  if (/\b(custom|commute|dorn|keeper)\b/.test(t)) return line('comms', knows(s, 'custom') ? 'customKnown' : 'customUnknown');
  if (/\b(askel|crewman|jory)\b/.test(t)) return line('xo', s.flags.heardAskel ? 'readAskel' : 'askelUnheard');
  if (/\b(soth|magister|tribunal|trial)\b/.test(t)) return line('xo', `readSoth_${v.bench}`);
  if (COUNSEL.test(t)) return line('xo', !medicalReady(s) ? 'marrowCounselOsei' : 'marrowCounsel');
  if (CASE.test(t) || IS_QUESTION.test(t)) return line('xo', 'statusTribunal');
  return line('xo', 'statusTribunal');
}

// ------------------------------------------------------------------ clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(finishExam);
  step(fleetClock);
  step(trialClock);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel', 'cruiser'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  if (s.flags.shotsFired || s.flags.lockedOnCruiser) {
    // Locking or firing on the tribunal / hold is treated as a force path.
    s = setFlag(s, 'extractedAttempt');
    if (c(s, 'extractWarned') < 1) {
      s = setCounter(s, 'extractWarned', 1);
      r.push(say('tactical', 'extractRefuse'));
      return recordRefusal(s, 'tactical', 'weapons on the tribunal', [
        'peaceful alternatives remain',
        'firing on a local tribunal would break the treaty and the Code',
      ]);
    }
    s = setFlag(s, 'forcedExtract');
    return end(s, 'endExtracted', r, 'endExtractedNote', 'xo');
  }
  if (s.flags.jumped || Math.abs(s.ships.halcyon.position.x) > 40000 || Math.abs(s.ships.halcyon.position.y) > 40000) {
    // Leaving without resolving: if Askel still held, sentence proceeds (failure); if principled flags set, principled.
    if (s.flags.refusedExtractOrder && s.flags.refusedHandover) return doPrincipled(s, r);
    r.push(say('xo', 'leftTribunal'));
    return end(s, 'endSentenced', r, 'endSentencedLeft', 'xo');
  }
  return s;
}

function fleetClock(s: WorldState, r: Report[]): WorldState {
  const v = tribunal(s);
  if (s.turn >= v.fleetAt && !s.flags.fleetSignal) {
    s = setFlag(s, 'fleetSignal');
    s = revealFact(s, 'fleet');
    r.push(say('comms', 'fleetSovereignty', vars(s)));
  }
  if (s.turn >= v.relieveAt && !settled(s)) {
    r.push(say('comms', 'fleetRelieves'));
    return end(s, 'endRelieved', r, 'endRelievedNote', 'comms');
  }
  return s;
}

function trialClock(s: WorldState, r: Report[]): WorldState {
  const v = tribunal(s);
  if (s.turn === v.trialAt - 3 && !s.flags.trialWarned) {
    s = setFlag(s, 'trialWarned');
    r.push(say('comms', 'trialNear', vars(s)));
  }
  if (s.turn >= v.trialAt && !settled(s)) {
    // Auto-resolve: strong medical → acquit; custom path → commute if available; else sentence.
    if (canAcquit(s)) {
      s = setFlag(s, 'acquittedOnEvidence');
      r.push(comms('soth', 'sothAcquits'));
      return end(s, 'endAcquitted', r, 'endAcquittedNote', 'comms');
    }
    if (canCommute(s)) {
      s = setFlag(s, 'commuted');
      r.push(comms('soth', 'sothCommutes'));
      return end(s, 'endCommuted', r, 'endCommutedNote', 'comms');
    }
    if (s.flags.refusedExtractOrder && (s.flags.refusedHandover || s.flags.peacefulTried)) {
      return doPrincipled(s, r);
    }
    r.push(comms('soth', 'sothSentences'));
    return end(s, 'endSentenced', r, 'endSentencedNote', 'comms');
  }
  if (s.turn >= MAX_TURNS - 1 && !settled(s)) {
    r.push(comms('soth', 'sothSentences'));
    return end(s, 'endSentenced', r, 'endSentencedNote', 'comms');
  }
  return s;
}

export { CASE, COUNSEL };
