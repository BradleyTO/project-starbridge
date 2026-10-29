/**
 * The Gardener — the agents: Claimwarden Bettine Crake (who has cutting charges on her tender and a
 * clock of her own), Assayer Lorne Haskett on the claims station (who knows the field), the growth
 * itself (which only grows), and the Halcyon's officers. Deterministic: no randomness after setup.
 *
 * Restraint is the point. The growth is not attacking anyone; it is spreading, slowly, toward the
 * claims. Burning it is easy (the Halcyon's guns or Crake's charges would do it in a minute), and
 * whether burning it is right, harmless, or a disaster depends on what it is, which only Lt. Varga
 * can find out, a stage at a time. The captain's job is to not act, and to keep Crake from acting,
 * until there is enough known to choose: a lure that leads it away, a line it cannot cross, the dark
 * it cannot live in, or proof that it was never alive at all. Judged on what was known when each
 * decision was made (ISA-COM-001 §1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, revealFact, setCounter, setFlag } from '../../engine/state';
import { recordRefusal } from '../../engine/roe';
import type { Drawn } from './setup';
import { alive, gardener } from './setup';
import {
  ABOARD, ALIVE_W, BACK_OFF, CASE, COLD, CONTAINED, COUNSEL, CRAKE_WORD, CUT_LINK, DIM, GAP_W, HEAT_W, HOLD, LEAVE, LIGHT_W, LURE, METAL_W, PERMIT_BURN, PROBE, PROTECT,
  SAMPLE, SPORE_W, STATION_WORD, STONE_W, STUDY, TEAM, TELL, burnOrder,
} from './words';

const END_FLAGS = ['endLed', 'endBoundary', 'endDormant', 'endBurned', 'endOverrun', 'endHull', 'endLeft', 'endFired'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const mins = (n: number) => Math.max(0, n);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const stoodDown = (s: WorldState) => !!s.flags.crakeStoodDown;
export const provenStone = (s: WorldState) => knows(s, 'alive') && gardener(s).nature === 'stone';
const provenAlive = (s: WorldState) => knows(s, 'alive') && alive(gardener(s));
const lureKind = (s: WorldState): Drawn | null => (['heat', 'metal', 'light'] as const).find((k) => !!s.flags[`lure_${k}`]) ?? null;
const leading = (s: WorldState) => c(s, 'leadAt') > 0;

export function vars(s: WorldState): Record<string, string | number> {
  const v = gardener(s);
  return {
    turn: s.turn,
    burn: stoodDown(s) ? 0 : mins(c(s, 'burnDue') - s.turn),
    claims: mins(v.claimsAt - s.turn),
    nature: v.nature,
    drawn: v.drawn,
    link: v.link,
    temper: v.temper,
    knowsAlive: knows(s, 'alive') ? 1 : 0,
    knowsDrawn: knows(s, 'drawn') ? 1 : 0,
    knowsHabit: knows(s, 'habit') ? 1 : 0,
    knowsField: knows(s, 'field') ? 1 : 0,
    studying: c(s, 'studyAt') > 0 ? 1 : 0,
    stoodDown: stoodDown(s) ? 1 : 0,
    lure: lureKind(s) ?? '',
    leading: leading(s) ? 1 : 0,
    cold: s.flags.cold ? 1 : 0,
    away: s.flags.away ? 1 : 0,
    promised: s.flags.promised ? 1 : 0,
  };
}

// ------------------------------------------------------------------ endings ---

/** The growth burns: by the Halcyon's guns or by Crake's charges. */
function burnIt(s: WorldState, by: 'halcyon' | 'miners', r: Report[]): WorldState {
  if (settled(s)) return s;
  const v = gardener(s);
  if (provenStone(s)) s = setFlag(s, 'provenFirst');
  // Only a burn the bridge ordered or allowed is the captain's blind decision.
  if (!knows(s, 'alive') && (by === 'halcyon' || s.flags.permittedBurn)) s = setFlag(s, 'burnedBlind');
  if (provenAlive(s)) s = setFlag(s, 'burnedKnowingAlive');
  s = setFlag(s, `burnedBy_${by}`);
  r.push(by === 'halcyon' ? say('tactical', 'raskBurns') : comms('crake', 'crakeFires'));
  r.push(say('sensors', v.nature === 'stone' ? 'burnStone' : v.nature === 'sporing' ? 'burnSpores' : 'burnOrganism'));
  return setFlag(s, 'endBurned');
}

export function halcyonBurn(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'orderedBurn');
  if (!c(s, 'studyAt') && !s.flags.studiedFirst) s = setFlag(s, 'burnBeforeStudy');
  if (provenStone(s)) return burnIt(s, 'halcyon', r);
  if (!c(s, 'burnWarned')) {
    r.push(say('tactical', provenAlive(s) ? 'raskWarnAlive' : 'raskWarnUnknown'));
    return setCounter(s, 'burnWarned', 1);
  }
  return burnIt(s, 'halcyon', r);
}

function minersBurn(s: WorldState, r: Report[], permitted: boolean): WorldState {
  if (permitted) {
    s = setFlag(s, 'permittedBurn');
    if (!c(s, 'studyAt') && !s.flags.studiedFirst) s = setFlag(s, 'burnBeforeStudy');
  }
  return burnIt(s, 'miners', r);
}

export function leave(s: WorldState, r: Report[]): WorldState {
  r.push(say('helm', 'leavingField'));
  return setFlag(s, 'endLeft');
}

// ------------------------------------------------------------------ the science ---

export function study(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (!s.flags.orderedBurn && !s.flags.permittedBurn) s = setFlag(s, 'studiedFirst');
  if (c(s, 'studyAt') > 0) {
    r.push(say('sensors', knows(s, 'habit') || provenStone(s) ? 'studyDone' : 'studyWorking', vars(s)));
    return s;
  }
  s = setFlag(s, 'studied');
  s = setCounter(s, 'studyAt', Math.max(1, s.turn));
  s = setCounter(s, 'aliveAt', s.turn + gardener(s).pace);
  r.push(say('sensors', 'studyStart'));
  return s;
}

/** A sample shortens every stage still to come by a minute. */
function speedUp(s: WorldState): WorldState {
  for (const k of ['aliveAt', 'drawnAt', 'habitAt']) {
    const at = c(s, k);
    if (at > s.turn + 1) s = setCounter(s, k, at - 1);
  }
  return s;
}

function sampled(s: WorldState, r: Report[], how: 'probe' | 'team' | 'aboard', key: string, role: 'sensors' | 'medical'): WorldState {
  if (s.flags.sampled) {
    r.push(say('sensors', 'sampleAgain'));
    return s;
  }
  s = setFlag(s, 'sampled');
  s = setFlag(s, `sample_${how}`);
  if (!c(s, 'studyAt')) s = study(s, r);
  r.push(say(role, key));
  return speedUp(s);
}

function refuse(s: WorldState, role: 'medical', key: string, order: string, reasons: string[], flag: string, r: Report[]): WorldState {
  r.push(say(role, key));
  s = recordRefusal(s, role, order.slice(0, 80), reasons);
  return setFlag(s, flag);
}

export function sample(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (ABOARD.test(t) && !PROBE.test(t.replace(/\bbring\b.*$/, ''))) {
    if (!CONTAINED.test(t)) return refuse(s, 'medical', 'refuseAboard', t, ['ISA-COM-001 §8.1: nothing of unknown risk is brought aboard until the medical and science officers have assessed it and isolation is in place', 'a sealed sample can come aboard into isolation, or a probe can carry it at arm’s length'], 'orderedAboard', r);
    return sampled(s, r, 'aboard', 'sampleIsolated', 'medical');
  }
  if (TEAM.test(t) && !PROBE.test(t)) {
    if (!CONTAINED.test(t)) return refuse(s, 'medical', 'refuseTeam', t, ['ISA-COM-001 §4.2: crew are not sent into avoidable danger, and a known hazard is contained before a team is sent', 'a probe can take the sample, or a team can go across in full barrier protection'], 'orderedUnprotected', r);
    return sampled(s, r, 'team', 'teamSuited', 'medical');
  }
  return sampled(s, r, 'probe', 'probeSample', 'sensors');
}

// ------------------------------------------------------------------ the Halcyon ---

export function lure(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) return s;
  const kind: Drawn | null = HEAT_W.test(t) ? 'heat' : METAL_W.test(t) ? 'metal' : LIGHT_W.test(t) ? 'light' : null;
  if (c(s, 'lureAt') > 0 || leading(s)) {
    r.push(say('engineering', 'lureBusy', vars(s)));
    return s;
  }
  if (!kind) {
    r.push(say('engineering', knows(s, 'drawn') ? 'lureWhatKnown' : 'lureWhat', vars(s)));
    return s;
  }
  for (const k of ['heat', 'metal', 'light']) s = setFlag(s, `lure_${k}`, false);
  s = setFlag(s, `lure_${kind}`);
  s = setFlag(s, 'lureLaid');
  if (knows(s, 'drawn') && kind === gardener(s).drawn) s = setFlag(s, 'lureOnEvidence');
  else if (!knows(s, 'drawn')) s = setFlag(s, 'lureGuess');
  s = setCounter(s, 'lureAt', s.turn + 2);
  r.push(say('engineering', knows(s, 'drawn') ? 'lureBuilding' : 'lureBuildingGuess', { kind }));
  return s;
}

export function runCold(s: WorldState, r: Report[]): WorldState {
  if (s.flags.cold) {
    r.push(say('engineering', 'coldAlready'));
    return s;
  }
  s = setFlag(s, 'cold');
  r.push(say('engineering', 'runCold'));
  return s;
}

export function backOff(s: WorldState, r: Report[]): WorldState {
  if (s.flags.away) {
    r.push(say('helm', 'awayAlready'));
    return s;
  }
  s = setFlag(s, 'away');
  r.push(say('helm', 'backingOff'));
  return s;
}

// ------------------------------------------------------------------ Crake ---

function extend(s: WorldState, by: number): WorldState {
  return setCounter(s, 'burnDue', Math.max(c(s, 'burnDue'), s.turn) + by);
}

function standDown(s: WorldState, r: Report[], key: string): WorldState {
  s = setFlag(s, 'crakeStoodDown');
  r.push(comms('crake', key, vars(s)));
  return s;
}

/** What Crake makes of the captain's words. */
export function crakeRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = gardener(s);
  if (settled(s)) {
    r.push(comms('crake', 'crakeAfter'));
    return s;
  }
  s = setFlag(s, 'spokeCrake');
  // A line the growth cannot cross.
  if (CUT_LINK.test(t) || (GAP_W.test(t) && !SPORE_W.test(t))) {
    if (!knows(s, 'habit') || !alive(v)) {
      r.push(comms('crake', 'crakeWhyCut'));
      return s;
    }
    if (v.link === 'none') {
      r.push(comms('crake', 'crakeNoLink'));
      return s;
    }
    if (c(s, 'cutAt') > 0) {
      r.push(comms('crake', 'crakeCutting'));
      return s;
    }
    s = setFlag(s, 'evidenceShared');
    s = setCounter(s, 'cutAt', s.turn + 2);
    return standDown(s, r, v.link === 'rail' ? 'crakeCutsRail' : 'crakeCutsTethers');
  }
  if (SPORE_W.test(t) && !/\b(no|not|won'?t|doesn'?t|isn'?t)\b[^.]*\bspore/.test(t)) {
    if (knows(s, 'habit') && v.nature === 'sporing') {
      s = setFlag(s, 'evidenceShared');
      return standDown(s, r, 'crakeSpores');
    }
    if (knows(s, 'habit') || provenStone(s)) s = setFlag(s, 'overstated');
    else s = setFlag(s, 'claimedBlind');
    r.push(comms('crake', 'crakeProof'));
    return s;
  }
  if (STONE_W.test(t) && !ALIVE_W.test(t.replace(/\b(not|isn'?t|is not) alive\b/g, ''))) {
    if (provenStone(s)) {
      s = setFlag(s, 'evidenceShared');
      r.push(comms('crake', 'crakeStoneCut'));
      return minersBurn(s, r, false);
    }
    s = setFlag(s, provenAlive(s) ? 'overstated' : 'claimedBlind');
    r.push(comms('crake', 'crakeStoneDoubt'));
    return s;
  }
  if (ALIVE_W.test(t) && !PERMIT_BURN.test(t)) {
    if (provenAlive(s)) {
      s = setFlag(s, 'evidenceShared');
      if (v.temper === 'pragmatic' || (v.temper === 'frightened' && s.flags.promised)) return standDown(s, r, 'crakeAliveStands');
      if (s.flags.aliveTold) {
        r.push(comms('crake', 'crakeAliveAgain', vars(s)));
        return s;
      }
      s = setFlag(s, 'aliveTold');
      s = extend(s, 4);
      r.push(comms('crake', 'crakeAliveGrudging', vars(s)));
      return s;
    }
    if (provenStone(s)) s = setFlag(s, 'overstated');
    else s = setFlag(s, 'claimedBlind');
    r.push(comms('crake', 'crakeProof'));
    return s;
  }
  if (PERMIT_BURN.test(t) || /^\s*(burn it|fire|go on|do it)\b/.test(t)) {
    r.push(comms('crake', 'crakeGladly'));
    return minersBurn(s, r, true);
  }
  if (PROTECT.test(t) && !HOLD.test(t.replace(PROTECT, ''))) return holdOn(s, t, r);
  if (HOLD.test(t)) return holdOn(s, t, r);
  if (/\b(why|what|how|who)\b/.test(t)) {
    r.push(comms('crake', 'crakeExplains', vars(s)));
    return s;
  }
  r.push(comms('crake', 'crakeWaiting', vars(s)));
  return s;
}

function holdOn(s: WorldState, t: string, r: Report[]): WorldState {
  const v = gardener(s);
  if (stoodDown(s)) {
    r.push(comms('crake', 'crakeStillStanding', vars(s)));
    return s;
  }
  // Two sentences of one line ("Hold your charges. Give us time.") are one request, not two.
  if (c(s, 'holdLine') === s.log.length + 1) return s;
  s = setCounter(s, 'holdLine', s.log.length + 1);
  s = setFlag(s, 'crakeHeld');
  const n = c(s, 'holds');
  s = setCounter(s, 'holds', n + 1);
  const promise = PROTECT.test(t);
  if (v.temper === 'frightened' && promise) {
    s = setFlag(s, 'promised');
    s = setCounter(s, 'burnDue', v.claimsAt + 1);
    r.push(comms('crake', 'crakeTrusts', vars(s)));
    return s;
  }
  if (n === 0) {
    s = extend(s, v.temper === 'hothead' ? 3 : v.temper === 'pragmatic' ? 6 : 4);
    r.push(comms('crake', v.temper === 'hothead' ? 'crakeHoldHot' : v.temper === 'pragmatic' ? 'crakeHoldPragmatic' : 'crakeHoldFrightened', vars(s)));
    return s;
  }
  if (n === 1 && v.temper === 'pragmatic' && c(s, 'studyAt') > 0) {
    s = extend(s, 3);
    r.push(comms('crake', 'crakeOneMore', vars(s)));
    return s;
  }
  r.push(comms('crake', v.temper === 'frightened' ? 'crakeNeedPromise' : 'crakeNoMore', vars(s)));
  return s;
}

// ------------------------------------------------------------------ Haskett ---

export function haskettRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = gardener(s);
  if (settled(s)) {
    r.push(comms('haskett', 'haskettAfter'));
    return s;
  }
  s = setFlag(s, 'spokeHaskett');
  if (DIM.test(t)) return dim(s, r);
  if (/\b(rail|tethers?|link|links|linked|connect\w*|joins?|between|cross|path|road|how (does|did|could) it|reach (the|your) claims|get to)\b/.test(t)) {
    s = revealFact(s, 'field');
    s = setFlag(s, 'askedField');
    r.push(comms('haskett', v.link === 'rail' ? 'haskettRail' : v.link === 'tethers' ? 'haskettTethers' : 'haskettNone'));
    return s;
  }
  if (CUT_LINK.test(t)) {
    r.push(comms('haskett', 'haskettCrakesCall'));
    return s;
  }
  r.push(comms('haskett', 'haskettStatus', vars(s)));
  return s;
}

export function dim(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'dimAt') > 0 || s.flags.dimTried) {
    r.push(comms('haskett', 'haskettDimmedAlready'));
    return s;
  }
  s = setFlag(s, 'dimmed');
  if (knows(s, 'drawn') && gardener(s).drawn === 'light') s = setFlag(s, 'dimOnEvidence');
  s = setCounter(s, 'dimAt', s.turn + 3);
  r.push(comms('haskett', 'haskettDims'));
  return s;
}

// ------------------------------------------------------------------ orders and questions ---

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  if (settled(s)) {
    r.push(say('xo', 'afterEnd'));
    return s;
  }
  if (LEAVE.test(t)) return leave(s, r);
  if (PERMIT_BURN.test(t) && (CRAKE_WORD.test(t) || /\b(let|allow)\b/.test(t))) {
    r.push(say('comms', 'relayed'));
    return crakeRespond(s, t, r);
  }
  if (TELL.test(t) && STATION_WORD.test(t) && !CRAKE_WORD.test(t.replace(/\bher\b/g, ''))) {
    r.push(say('comms', 'relayed'));
    return haskettRespond(s, t, r);
  }
  if (TELL.test(t) && CRAKE_WORD.test(t)) {
    r.push(say('comms', 'relayed'));
    return crakeRespond(s, t, r);
  }
  if (burnOrder(t)) return halcyonBurn(s, r);
  if (SAMPLE.test(t) || (TEAM.test(t) && /\b(across|over|cross|to the rock|onto the rock)\b/.test(t))) return sample(s, t, r);
  if (LURE.test(t)) return lure(s, t, r);
  if (COLD.test(t)) return runCold(s, r);
  if (BACK_OFF.test(t)) return backOff(s, r);
  if (DIM.test(t)) return dim(s, r);
  if (CUT_LINK.test(t)) {
    r.push(say('comms', 'relayed'));
    return crakeRespond(s, t, r);
  }
  if (STUDY.test(t)) return study(s, r);
  if (HOLD.test(t) && CRAKE_WORD.test(t)) {
    r.push(say('comms', 'relayed'));
    return crakeRespond(s, t, r);
  }
  r.push(say('xo', 'gardenerUnclear', { description: raw.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  const line = (role: 'xo' | 'comms' | 'sensors' | 'engineering', key: string) => {
    r.push(say(role, key, vars(s)));
    return s;
  };
  if (/\bspores?|burn(ing)? it|what (would|will) (happen|burning)|safe to burn\b/.test(t)) return line('sensors', knows(s, 'habit') ? 'vargaHabit' : provenStone(s) ? 'vargaStone' : 'vargaNotYet');
  if (/\b(drawn|draws|attract\w*|toward|towards|wants|feed\w*|lure)\b/.test(t)) return line('sensors', knows(s, 'drawn') ? 'vargaDrawn' : provenStone(s) ? 'vargaStone' : 'vargaNotYet');
  if (/\b(rail|tethers?|link|connect\w*|cross|gap)\b/.test(t)) return line('xo', knows(s, 'field') ? (knows(s, 'habit') ? 'fieldKnownHabit' : 'fieldKnown') : 'fieldUnknown');
  if (/\b(crake|claimwarden|miners?|charges|tender|hobnail)\b/.test(t)) return line('comms', stoodDown(s) ? 'crakeStatusDown' : 'crakeStatus');
  if (/\b(alive|living|what is it|what'?s that|what is the (growth|gardener)|is it)\b/.test(t) || STUDY.test(t)) return line('sensors', knows(s, 'alive') ? (alive(gardener(s)) ? 'vargaAliveAgain' : 'vargaStone') : c(s, 'studyAt') > 0 ? 'studyWorking' : 'vargaAskStudy');
  if (COUNSEL.test(t)) return line('xo', 'marrowCounsel');
  if (CASE.test(t)) return line('xo', 'statusGardener');
  return line('xo', 'statusGardener');
}

// ------------------------------------------------------------------ the clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(crakeClock);
  step(studyClock);
  step(completions);
  step(growthClock);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  if (s.flags.shotsFired) {
    r.push(say('xo', 'shotsInField'));
    return setFlag(s, 'endFired');
  }
  if (s.flags.jumped || s.ships.halcyon.position.x < -30000) {
    r.push(say('xo', 'leftField'));
    return setFlag(s, 'endLeft');
  }
  return s;
}

function crakeClock(s: WorldState, r: Report[]): WorldState {
  if (s.turn >= 1 && !s.flags.crakeHailed) {
    s = setFlag(s, 'crakeHailed');
    r.push(comms('crake', 'crakeHail', vars(s)));
  }
  if (s.turn >= 2 && !s.flags.haskettCalled) {
    s = setFlag(s, 'haskettCalled');
    r.push(comms('haskett', 'haskettCall', vars(s)));
  }
  if (stoodDown(s)) return s;
  // While the growth is visibly following a lure away from her claims, the Claimwarden holds.
  if (leading(s)) return setCounter(s, 'burnDue', Math.max(c(s, 'burnDue'), s.turn + 3));
  const due = c(s, 'burnDue');
  if (s.turn === due - 2 && !s.flags[`chargesWarned_${due}`]) {
    s = setFlag(s, `chargesWarned_${due}`);
    r.push(say('comms', 'chargesSoon'));
  }
  if (s.turn >= due) return minersBurn(s, r, false);
  return s;
}

function studyClock(s: WorldState, r: Report[]): WorldState {
  const v = gardener(s);
  const at = (k: string) => c(s, k) > 0 && s.turn >= c(s, k);
  if (at('aliveAt') && !knows(s, 'alive')) {
    s = revealFact(s, 'alive');
    if (!alive(v)) {
      r.push(say('sensors', 'vargaFoundStone'));
      return s;
    }
    r.push(say('sensors', 'vargaFoundAlive'));
    s = setCounter(s, 'drawnAt', s.turn + v.pace - (s.flags.sampled ? 1 : 0));
  }
  if (at('drawnAt') && !knows(s, 'drawn')) {
    s = revealFact(s, 'drawn');
    r.push(say('sensors', 'vargaFoundDrawn', vars(s)));
    s = setCounter(s, 'habitAt', s.turn + v.pace - (s.flags.sampled ? 1 : 0));
  }
  if (at('habitAt') && !knows(s, 'habit')) {
    s = revealFact(s, 'habit');
    r.push(say('sensors', 'vargaFoundHabit', vars(s)));
  }
  return s;
}

function completions(s: WorldState, r: Report[]): WorldState {
  const v = gardener(s);
  const la = c(s, 'lureAt');
  if (la > 0 && s.turn >= la) {
    s = setCounter(s, 'lureAt', 0);
    if (alive(v) && lureKind(s) === v.drawn) {
      s = setCounter(s, 'leadAt', s.turn + 3);
      r.push(say('sensors', 'lureFollowing'));
    } else {
      s = setFlag(s, 'lureFailed');
      s = setFlag(s, `lure_${lureKind(s)}`, false);
      r.push(say('sensors', alive(v) ? 'lureIgnored' : 'lureStone'));
    }
  }
  const lead = c(s, 'leadAt');
  if (lead > 0 && s.turn >= lead) {
    r.push(say('engineering', 'lureDone'));
    return setFlag(s, 'endLed');
  }
  const cut = c(s, 'cutAt');
  if (cut > 0 && s.turn >= cut) {
    r.push(comms('crake', 'crakeCutDone'));
    return setFlag(s, 'endBoundary');
  }
  const da = c(s, 'dimAt');
  if (da > 0 && s.turn >= da) {
    s = setCounter(s, 'dimAt', 0);
    s = setFlag(s, 'dimTried');
    if (alive(v) && v.drawn === 'light') {
      r.push(say('sensors', 'dormant'));
      return setFlag(s, 'endDormant');
    }
    r.push(say('sensors', 'dimNothing'));
  }
  return s;
}

function growthClock(s: WorldState, r: Report[]): WorldState {
  const v = gardener(s);
  const reaching = alive(v) && v.drawn === 'heat' && !leading(s);
  const exposed = reaching && !s.flags.cold && !s.flags.away;
  if (reaching && s.turn >= v.halcyonAt - 3 && !s.flags.reachWarned && exposed) {
    s = setFlag(s, 'reachWarned');
    s = revealFact(s, 'drawn');
    r.push(say('sensors', 'reachingForUs'));
  }
  if (s.flags.reachWarned && !exposed && !s.flags.reachEased && reaching) {
    s = setFlag(s, 'reachEased');
    r.push(say('sensors', 'reachEased'));
  }
  if (exposed && s.turn >= v.halcyonAt) {
    r.push(say('engineering', 'hullGrown'));
    return setFlag(s, 'endHull');
  }
  if (s.turn === Math.floor(v.claimsAt / 2) && !s.flags.halfway) {
    s = setFlag(s, 'halfway');
    r.push(comms('haskett', 'haskettHalfway', vars(s)));
  }
  if (s.turn >= v.claimsAt - 3 && !s.flags.claimsWarned) {
    s = setFlag(s, 'claimsWarned');
    r.push(comms('haskett', 'haskettClose', vars(s)));
  }
  if (s.turn >= v.claimsAt) {
    if (s.flags.promised) s = setFlag(s, 'promiseBroken');
    r.push(comms('haskett', 'haskettOverrun'));
    return setFlag(s, 'endOverrun');
  }
  return s;
}

export { CASE, COUNSEL, SAMPLE, STUDY };
