/**
 * Gravity's Edge — agents: the Vagrant's tide, the Halcyon's frame, the Lodestar probe, Director
 * Aalto at Lisle Observatory, and the Halcyon's officers. Deterministic: no randomness after setup.
 *
 * The captain's appetite for risk is the point. Every minute in the tide adds data and strain. How
 * much strain the frame can really take is hidden, and the gauges, confused by the star's field, may
 * read high or low. What does not lie is the ship herself: the frame groans, cracks and shrieks at
 * fixed fractions of her true limit, and Chief Okafor, once she has heard it, can say what the frame
 * will really take. The star glitches without warning that the science can give; a false stutter
 * looks the same as a real one, except to the Chief if she is listening to the frame. Nobody is to
 * blame and nobody needs rescuing. Judged on what was known at the time (ISA-COM-001 §1.4, cmd-4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, patchShip, revealFact, setCounter, setFlag } from '../../engine/state';
import { BOOK, FULL, PROBE_MIN, USEFUL, gaugeOf, grav, tolerance } from './setup';
import {
  AALTO_WORD, CLEAR, CONFIRM, COUNSEL, DATA, DEEPER, DISH, END_ON, FEEL, GAUGE, GLITCH, HAIL, LISTEN, NO_PROMISE, PROMISE_FULL, PUSH_BACK,
  REINFORCE, RELAY, RELEASE, SHALLOWER, TELL, WITHDRAW, CASE,
} from './words';

const END_FLAGS = ['endFull', 'endProbe', 'endEarly', 'endCold', 'endCrippled', 'endLosses', 'endDataLost'] as const;
type EndFlag = (typeof END_FLAGS)[number];
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const ROLE_PREFIX = /^(helm|tactical|ops|science|comms|xo|medical|engineering|sensors): /;

export const depth = (s: WorldState) => c(s, 'depth');
export const stress = (s: WorldState) => c(s, 'stress');
export const gauge = (s: WorldState) => gaugeOf(grav(s).gauges, stress(s));
export const boosted = (s: WorldState) => s.ships.halcyon.systems.sensors.power >= 125;
export const relayActive = (s: WorldState) => !!s.flags.relayActive;
export const probeOut = (s: WorldState) => !!s.flags.probeReleased && !s.flags.probeLost;
/** Data held by the Halcyon (zero if the array burned, except what was already sent on). */
export const shipData = (s: WorldState) => (s.flags.arrayBurned ? c(s, 'relayed') : c(s, 'data'));
export const totalData = (s: WorldState) => shipData(s) + c(s, 'probeData');
const pct = (n: number) => Math.min(100, Math.round((n / FULL) * 100));

/** What a minute of recording is worth: 1 at the edges of the pass, 6 at its peak. */
export const worth = (s: WorldState, t = s.turn) => (tide10(s, t) - 8) / 2;
/** The tide in tenths: 10 at the edges of the pass, 20 at its peak. */
export function tide10(s: WorldState, t = s.turn): number {
  const v = grav(s);
  return 10 + Math.max(0, Math.round(10 * (1 - Math.abs(t - v.peakAt) / 7)));
}
const SBASE: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 5 };
const DBASE: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 10 };
const GLITCH_HIT: Record<number, number> = { 0: 0, 1: 4, 2: 12, 3: 30 };
const DEPTH_WORD = ['clear of the well', 'the outer band', 'the middle band', 'the deep band'];

function stressMod(s: WorldState): number {
  return (s.flags.endOn ? 0.6 : 1) * (s.flags.reinforced ? 0.7 : 1);
}
function dataMod(s: WorldState): number {
  if (s.flags.arrayBurned) return 0;
  return (boosted(s) ? 1.3 : 1) * (s.flags.endOn ? 0.75 : 1) * (s.flags.reinforced ? 0.85 : 1);
}

export function vars(s: WorldState): Record<string, string | number> {
  const v = grav(s);
  return {
    turn: s.turn,
    depth: depth(s),
    depthWord: DEPTH_WORD[depth(s)] ?? DEPTH_WORD[0],
    gauge: gauge(s),
    data: pct(shipData(s)),
    probeData: pct(c(s, 'probeData')),
    total: pct(totalData(s)),
    peakIn: Math.max(0, v.peakAt - s.turn),
    endIn: Math.max(0, v.passEnd - s.turn),
    hull: v.hull,
    gauges: v.gauges,
    dead: c(s, 'crewDead'),
    exposed: v.exposed,
    relayed: relayActive(s) ? 1 : 0,
    probeOut: probeOut(s) ? 1 : 0,
    released: s.flags.probeReleased ? 1 : 0,
    feel: knows(s, 'feel') ? 1 : 0,
    dish: Math.max(0, c(s, 'dishAt') - s.turn),
  };
}

type Role = 'xo' | 'comms' | 'sensors' | 'engineering' | 'tactical' | 'helm' | 'medical';
function end(s: WorldState, flag: EndFlag, r: Report[], key: string, role: Role = 'xo'): WorldState {
  if (settled(s)) return s;
  r.push(say(role, key, vars(s)));
  return setFlag(s, flag);
}

// ------------------------------------------------------------------ the helm ---

function setDepth(s: WorldState, d: number): WorldState {
  s = setCounter(s, 'depth', d);
  if (d >= 3 && !s.flags.wentDeep) {
    s = setFlag(s, 'wentDeep');
    if (relayActive(s) || s.flags.relayOrdered) s = setFlag(s, 'hedgedFirst');
    if (s.flags.sectionsCleared) s = setFlag(s, 'clearedFirst');
  }
  return s;
}

/** Would Chief Okafor warn against going deeper now? Her read, once she has it, tracks the truth. */
function warnDeeper(s: WorldState): boolean {
  const v = grav(s);
  const ratio = stress(s) / tolerance(v.hull);
  if (s.flags.soundShriek) return true;
  if (knows(s, 'feel')) return ratio >= 0.7;
  return gauge(s) >= 85 || !!s.flags.soundCrack;
}

function deeper(s: WorldState, r: Report[], insist = false): WorldState {
  if (s.flags.withdrawing || s.flags.clear) {
    r.push(say('helm', 'deeperWithdrawing'));
    return s;
  }
  const d = depth(s);
  if (d >= 3) {
    r.push(say('helm', 'deepest', vars(s)));
    return s;
  }
  if (!insist && warnDeeper(s)) {
    s = setCounter(s, 'pendingWarn', 1);
    r.push(say('engineering', knows(s, 'feel') ? 'warnDeeperFeel' : gauge(s) >= 85 ? 'warnDeeperBook' : 'warnDeeperSound', vars(s)));
    return s;
  }
  if (insist) s = setFlag(s, 'overrodeChief');
  s = setDepth(s, d + 1);
  r.push(say('helm', `depth_${d + 1}`, vars(s)));
  return s;
}

function shallower(s: WorldState, r: Report[]): WorldState {
  const d = depth(s);
  if (d <= 1) {
    r.push(say('helm', 'shallowest', vars(s)));
    return s;
  }
  s = heedCheck(s);
  s = setDepth(s, d - 1);
  r.push(say('helm', `climb_${d - 1}`, vars(s)));
  return s;
}

function withdraw(s: WorldState, r: Report[]): WorldState {
  if (s.flags.withdrawing) {
    r.push(say('helm', 'alreadyWithdrawing', vars(s)));
    return s;
  }
  s = heedCheck(s);
  s = setFlag(s, 'withdrawing');
  s = setCounter(s, 'withdrawTurn', s.turn);
  if (s.flags.soundCrack || s.flags.soundShriek || (knows(s, 'feel') && stress(s) / tolerance(grav(s).hull) >= 0.6)) s = setFlag(s, 'withdrewOnWarning');
  if (s.turn < grav(s).peakAt) s = setFlag(s, 'leftBeforePeak');
  r.push(say('helm', 'withdrawStart', vars(s)));
  return s;
}

/** Pulling back within a minute of a warning cue (a stutter or the frame going quiet). */
function heedCheck(s: WorldState): WorldState {
  if (c(s, 'cueAt') > 0 && s.turn - c(s, 'cueAt') <= 1) {
    s = setFlag(s, 'heededCue');
    if (s.flags.lastCueTell) s = setFlag(s, 'heededTell');
  }
  return s;
}

function endOn(s: WorldState, r: Report[]): WorldState {
  if (s.flags.endOn) {
    r.push(say('helm', 'endOnAlready'));
    return s;
  }
  s = setFlag(s, 'endOn');
  r.push(say('helm', 'endOn'));
  r.push(say('sensors', 'endOnData'));
  return s;
}

// ------------------------------------------------------------------ the Chief ---

function reinforce(s: WorldState, r: Report[]): WorldState {
  if (s.flags.reinforced) {
    r.push(say('engineering', 'reinforceAlready'));
    return s;
  }
  s = setFlag(s, 'reinforced');
  if (!s.flags.wentDeep) s = setFlag(s, 'reinforcedFirst');
  r.push(say('engineering', 'reinforce'));
  return s;
}

function feel(s: WorldState, r: Report[]): WorldState {
  const v = grav(s);
  s = setFlag(s, 'listening');
  if (knows(s, 'feel')) {
    r.push(say('engineering', `feel_${v.hull}`, vars(s)), say('engineering', `gaugeTrust_${v.gauges}`));
    return s;
  }
  if (!s.flags.soundGroan) {
    s = setFlag(s, 'feelAskedEarly');
    r.push(say('engineering', 'feelTooEarly'));
    return s;
  }
  s = revealFact(s, 'feel');
  if (!s.flags.pastBook) s = setFlag(s, 'feelBeforeBook');
  r.push(say('engineering', `feel_${v.hull}`, vars(s)), say('engineering', `gaugeTrust_${v.gauges}`));
  return s;
}

function listen(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'listening');
  r.push(say('engineering', 'listening'));
  return s;
}

function gaugeReport(s: WorldState, r: Report[]): WorldState {
  r.push(say('engineering', 'gaugeReport', vars(s)));
  return s;
}

// ------------------------------------------------------------------ the probe and the dish ---

function release(s: WorldState, r: Report[]): WorldState {
  if (s.flags.probeReleased) {
    r.push(say('sensors', s.flags.probeLost ? 'probeGone' : 'probeAlready', vars(s)));
    return s;
  }
  s = setFlag(s, 'probeReleased');
  s = setCounter(s, 'probeAt', s.turn);
  r.push(say('sensors', 'probeReleased', vars(s)));
  if (!relayActive(s) && !s.flags.relayOrdered) r.push(say('comms', 'probeNoRelay'));
  return s;
}

function relay(s: WorldState, r: Report[], via: 'szabo' | 'aalto' = 'szabo'): WorldState {
  if (relayActive(s)) {
    r.push(say('comms', 'relayAlready'));
    return s;
  }
  if (s.flags.relayOrdered) {
    r.push(say('comms', 'relayTurning', vars(s)));
    return s;
  }
  s = setFlag(s, 'relayOrdered');
  s = setCounter(s, 'dishAt', s.turn + grav(s).dishTurns);
  if (via === 'aalto') r.push(comms('aalto', 'aaltoDish', vars(s)));
  else r.push(say('comms', 'relayStart', vars(s)));
  return s;
}

function clearSections(s: WorldState, r: Report[]): WorldState {
  if (s.flags.sectionsCleared) {
    r.push(say('tactical', 'clearAlready'));
    return s;
  }
  s = setFlag(s, 'sectionsCleared');
  r.push(say('tactical', 'clearSections'));
  return s;
}

// ------------------------------------------------------------------ the director ---

export function aaltoRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const first = !s.flags.spokeAalto;
  s = setFlag(s, 'spokeAalto');
  if (settled(s)) {
    r.push(comms('aalto', 'aaltoAfter', vars(s)));
    return s;
  }
  if (!t) {
    r.push(comms('aalto', first ? 'aaltoGreets' : 'aaltoStatus', vars(s)));
    return s;
  }
  if (PROMISE_FULL.test(t) && !NO_PROMISE.test(t)) {
    s = setFlag(s, 'promisedFull');
    r.push(comms('aalto', 'aaltoPromised'));
    return s;
  }
  if (NO_PROMISE.test(t) || PUSH_BACK.test(t)) {
    s = setFlag(s, 'honestLimits');
    r.push(comms('aalto', 'aaltoLimits'));
    return s;
  }
  if (DISH.test(t)) return relay(s, r, 'aalto');
  if (GLITCH.test(t) || /\b(history|before|approach|on its way)\b/.test(t)) {
    s = revealFact(s, 'history');
    r.push(comms('aalto', 'aaltoHistory'));
    return s;
  }
  if (/\b(deeper|closer|how deep|enough|worth)\b/.test(t)) {
    r.push(comms('aalto', 'aaltoDeeper', vars(s)));
    return s;
  }
  r.push(comms('aalto', 'aaltoStatus', vars(s)));
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
  if (CONFIRM.test(t)) {
    const p = c(s, 'pendingWarn');
    s = setCounter(s, 'pendingWarn', 0);
    if (p === 1) return deeper(s, r, true);
    r.push(say('xo', 'confirmWhat'));
    return s;
  }
  if (s.counters.pendingWarn) s = setCounter(s, 'pendingWarn', 0);
  if (TELL.test(t) && AALTO_WORD.test(t)) {
    r.push(say('comms', 'relayAalto'));
    return aaltoRespond(s, t, r);
  }
  if (RELAY.test(t) || (role === 'comms' && /\b(data|telemetry|observatory|relay|lisle|dish)\b/.test(t))) return relay(s, r);
  if (RELEASE.test(t)) return release(s, r);
  if (WITHDRAW.test(t)) return withdraw(s, r);
  if (CLEAR.test(t)) return clearSections(s, r);
  if (END_ON.test(t)) return endOn(s, r);
  if (REINFORCE.test(t) || (role === 'engineering' && /\b(brace|field|power)\b/.test(t))) return reinforce(s, r);
  if (LISTEN.test(t) || (role === 'engineering' && /\blisten\b/.test(t))) return listen(s, r);
  if (SHALLOWER.test(t) || (role === 'helm' && /\b(back|out|up)\b/.test(t))) return shallower(s, r);
  if (DEEPER.test(t) || (role === 'helm' && /\b(deeper|closer|in|down)\b/.test(t))) return deeper(s, r);
  if (role === 'engineering' && /\b(frame|hull)\b/.test(t)) return gaugeReport(s, r);
  if (HAIL.test(t) && AALTO_WORD.test(t)) return aaltoRespond(s, '', r);
  r.push(say('xo', 'gravityUnclear', { description: t.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase().replace(ROLE_PREFIX, '');
  const v = grav(s);
  const line = (role: Role, key: string) => {
    r.push(say(role, key, vars(s)));
    return s;
  };
  if (FEEL.test(t)) return feel(s, r);
  if (GLITCH.test(t)) return line('sensors', knows(s, 'history') ? 'glitchNoForecastKnown' : 'glitchNoForecast');
  if (/\b(probe|lodestar)\b/.test(t)) return line('sensors', s.flags.probeLost ? 'probeGone' : s.flags.probeReleased ? 'probeStatus' : 'probeTethered');
  if (/\b(sections?|crew|casualt\w*|injur\w*)\b/.test(t)) return line('tactical', s.flags.sectionsCleared ? 'clearAlready' : 'sectionsStatus');
  if (GAUGE.test(t) || /\b(hull|limit|safe|how deep|deep)\b/.test(t)) return gaugeReport(s, r);
  if (DATA.test(t)) return line('sensors', 'dataReport');
  if (/\b(observatory|aalto|director|lisle|dish)\b/.test(t)) return line('comms', relayActive(s) ? 'relayAlready' : s.flags.relayOrdered ? 'relayTurning' : 'aaltoRead');
  if (COUNSEL.test(t))
    return line('xo', !s.flags.soundGroan ? 'counselEarly' : !knows(s, 'feel') ? 'counselFeel' : !relayActive(s) && !s.flags.relayOrdered ? 'counselRelay' : s.flags.soundShriek ? 'counselOut' : 'counselJudge');
  if (CASE.test(t)) return line('xo', 'statusGravity');
  void v;
  return line('xo', 'statusGravity');
}

// ------------------------------------------------------------------ clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(climb);
  step(dish);
  step(tideTick);
  step(glitchTick);
  step(probeTick);
  step(sounds);
  step(failure);
  step(cueTick);
  step(aaltoClock);
  step(passEnd);
  step(clearCheck);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel', 'cruiser'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  if (s.flags.clear) return s;
  if (s.flags.jumped) {
    const d = depth(s);
    if (d >= 2) {
      s = setFlag(s, 'jumpedDeep');
      s = setCounter(s, 'stress', stress(s) + 25 * (d - 1));
      r.push(say('engineering', 'jumpShear'));
      s = failure(s, r);
      if (settled(s)) return s;
    }
    s = setCounter(s, 'depth', 0);
    return setFlag(s, 'clear');
  }
  if (s.flags.leftReach || Math.abs(s.ships.halcyon.position.x) > 40000 || Math.abs(s.ships.halcyon.position.y) > 40000) {
    if (!s.flags.withdrawing) {
      s = setFlag(s, 'withdrawing');
      s = setCounter(s, 'withdrawTurn', s.turn);
      if (s.turn < grav(s).peakAt) s = setFlag(s, 'leftBeforePeak');
      r.push(say('helm', 'withdrawStart', vars(s)));
    }
  }
  return s;
}

function climb(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.withdrawing || s.flags.clear) return s;
  if (s.turn <= c(s, 'withdrawTurn')) return s;
  const d = Math.max(0, depth(s) - 1);
  s = setCounter(s, 'depth', d);
  if (d === 0) {
    r.push(say('helm', 'clearOfWell', vars(s)));
    return setFlag(s, 'clear');
  }
  r.push(say('helm', `climbing_${d}`, vars(s)));
  return s;
}

function dish(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.relayOrdered || relayActive(s) || s.turn < c(s, 'dishAt')) return s;
  s = setFlag(s, 'relayActive');
  s = setCounter(s, 'relayed', c(s, 'data'));
  r.push(say('comms', 'relayLive', vars(s)));
  return s;
}

function tideTick(s: WorldState, _r: Report[]): WorldState {
  if (s.flags.clear) return s;
  const d = depth(s);
  const tide = tide10(s) / 10;
  s = setCounter(s, 'stress', stress(s) + Math.round(SBASE[d] * tide * stressMod(s)));
  s = setCounter(s, 'data', c(s, 'data') + Math.round(DBASE[d] * worth(s) * dataMod(s)));
  if (relayActive(s) && !s.flags.arrayBurned) s = setCounter(s, 'relayed', c(s, 'data'));
  const g = gauge(s);
  if (g > c(s, 'maxGauge')) s = setCounter(s, 'maxGauge', g);
  return s;
}

function glitchTick(s: WorldState, r: Report[]): WorldState {
  const v = grav(s);
  if (s.turn !== v.glitchA && s.turn !== v.glitchB) return s;
  if (s.flags.clear) {
    r.push(say('sensors', 'glitchAfar'));
    return s;
  }
  const d = depth(s);
  s = setCounter(s, 'stress', stress(s) + Math.round(GLITCH_HIT[d] * stressMod(s)));
  s = setCounter(s, 'glitches', c(s, 'glitches') + 1);
  if (d >= 3) s = setFlag(s, 'deepAtGlitch');
  if (d >= 3 && c(s, 'cueAt') === s.turn - 1) s = setFlag(s, 'deepThroughCue');
  r.push(say('sensors', `glitch_${d}`, vars(s)));
  if (boosted(s) && d >= 2 && !s.flags.arrayBurned) {
    s = setFlag(s, 'arrayBurned');
    if (relayActive(s)) s = setFlag(s, 'burnedRelayed');
    r.push(say('sensors', relayActive(s) ? 'arrayBurnedRelayed' : 'arrayBurned', vars(s)));
  }
  return s;
}

function probeTick(s: WorldState, r: Report[]): WorldState {
  if (!probeOut(s)) return s;
  const v = grav(s);
  if (s.turn >= c(s, 'probeAt') + v.probeLife) {
    s = setFlag(s, 'probeLost');
    r.push(say('sensors', 'probeLost', vars(s)));
    return s;
  }
  const heard = relayActive(s) || !s.flags.clear;
  if (heard) s = setCounter(s, 'probeData', c(s, 'probeData') + Math.round(12 * worth(s)));
  else s = setFlag(s, 'probeUnheard');
  return s;
}

function sounds(s: WorldState, r: Report[]): WorldState {
  if (s.flags.clear) return s;
  const tol = tolerance(grav(s).hull);
  const x = stress(s);
  if (!s.flags.soundGroan && x >= tol * 0.5) {
    s = setFlag(s, 'soundGroan');
    r.push(say('engineering', 'soundGroan'));
  }
  if (!s.flags.soundCrack && x >= tol * 0.72) {
    s = setFlag(s, 'soundCrack');
    s = setCounter(s, 'crackAt', s.turn);
    r.push(say('engineering', 'soundCrack'));
  }
  if (!s.flags.soundShriek && x >= tol * 0.88) {
    s = setFlag(s, 'soundShriek');
    s = setCounter(s, 'shriekAt', s.turn);
    r.push(say('engineering', 'soundShriek'));
  }
  if (s.flags.soundShriek && !s.flags.withdrawing && s.turn - c(s, 'shriekAt') >= 2) s = setFlag(s, 'ignoredShriek');
  if (!s.flags.pastBook && gauge(s) >= 100) {
    s = setFlag(s, 'pastBook');
    s = setCounter(s, 'pastBookAt', s.turn);
    r.push(say('engineering', 'pastBook', vars(s)));
  }
  // Staying on past the rated limit for a further minute without asking the Chief is going on the gauges alone.
  if (s.flags.pastBook && !s.flags.pastBookBlind && !knows(s, 'feel') && !s.flags.withdrawing && s.turn > c(s, 'pastBookAt')) s = setFlag(s, 'pastBookBlind');
  return s;
}

export function failure(s: WorldState, r: Report[]): WorldState {
  if (s.flags.clear && !s.flags.jumpedDeep) return s;
  const v = grav(s);
  if (stress(s) < tolerance(v.hull)) return s;
  if (depth(s) >= 3 && !s.flags.sectionsCleared) {
    s = setCounter(s, 'crewDead', v.exposed);
    s = patchShip(s, 'halcyon', { souls: s.ships.halcyon.souls - v.exposed, hull: 35 });
    return end(s, 'endLosses', r, 'endLossesNote', 'engineering');
  }
  s = patchShip(s, 'halcyon', { hull: 45 });
  return end(s, 'endCrippled', r, depth(s) >= 3 ? 'endCrippledClearedNote' : 'endCrippledNote', 'engineering');
}

function cueTick(s: WorldState, r: Report[]): WorldState {
  if (s.flags.clear) return s;
  const v = grav(s);
  const next = s.turn + 1;
  const real = next === v.glitchA || next === v.glitchB;
  const falseCue = s.turn === v.falseAt && !real;
  if (!real && !falseCue) return s;
  s = setCounter(s, 'cueAt', s.turn);
  s = setFlag(s, 'lastCueTell', false);
  r.push(say('sensors', knows(s, 'history') ? 'stutterKnown' : 'stutter'));
  if (s.flags.listening) {
    if (real) {
      s = revealFact(s, 'tell');
      s = setFlag(s, 'lastCueTell');
      r.push(say('engineering', 'tellQuiet'));
    } else {
      r.push(say('engineering', 'tellNothing'));
    }
  }
  return s;
}

function aaltoClock(s: WorldState, r: Report[]): WorldState {
  const v = grav(s);
  if (!s.flags.aaltoPushed && s.turn >= v.peakAt - 3 && depth(s) < 3 && !s.flags.withdrawing && !s.flags.clear) {
    s = setFlag(s, 'aaltoPushed');
    r.push(comms('aalto', 'aaltoPush', vars(s)));
  }
  return s;
}

function passEnd(s: WorldState, r: Report[]): WorldState {
  if (s.flags.clear || s.turn < grav(s).passEnd) return s;
  r.push(say('sensors', 'passOver', vars(s)));
  s = setCounter(s, 'depth', 0);
  return setFlag(s, 'clear');
}

function clearCheck(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.clear) return s;
  // A released probe still diving is heard out (relay or not) before the run is judged.
  if (probeOut(s) && relayActive(s)) return s;
  return finish(s, r);
}

function finish(s: WorldState, r: Report[]): WorldState {
  const total = totalData(s);
  const probe = c(s, 'probeData');
  if (s.flags.probeReleased && probe >= PROBE_MIN && total >= USEFUL) return end(s, 'endProbe', r, 'endProbeNote', 'sensors');
  if (total >= FULL) return end(s, 'endFull', r, 'endFullNote', 'sensors');
  if (total >= USEFUL) return end(s, 'endEarly', r, 'endEarlyNote', 'sensors');
  if (s.flags.arrayBurned && !s.flags.burnedRelayed) return end(s, 'endDataLost', r, 'endDataLostNote', 'sensors');
  return end(s, 'endCold', r, 'endColdNote', 'sensors');
}

export { BOOK };
