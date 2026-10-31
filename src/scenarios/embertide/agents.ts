/**
 * Ember Tide — the agents: Overseer Dagny Strome (who wants her furnace banked and her people
 * alive, and has a temper of her own), Lifter-Master Joss Ferrier on the ore lifter Mattock (who
 * wants one more ore run), the star Myrr (which flares at a seeded minute and may lie about it
 * first), and the Halcyon's officers. Deterministic: no randomness after setup.
 *
 * Timing is the point. The flare will come; only the minute is unknown, and Lt. Varga can narrow
 * the window a reading at a time. Everything turns on when: when the lifts start, how long the
 * banking crew can stay at the furnace, when the last lift goes, when the Halcyon herself goes into
 * the moon's shadow (too early and her shuttles' trips double; too late and she is caught). Leave
 * the furnace too soon and the colony loses it for nothing; too late and people die. Judged on
 * what the forecast showed when each decision was made (ISA-COM-001 §1.4), not on the minute the
 * star chose.
 */
import type { Report } from '../../engine/report';
import { comms, narrate, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, revealFact, setCounter, setFlag } from '../../engine/state';
import { LIFT, LIFTER_CREW, SHADOW_MINS, TEAM_SIZE, bankable, ember, falseAt, tellAt } from './setup';
import {
  BACK_OVER, BANK_W, BOOST, CASE, COUNSEL, EVAC, FALSE_DAWN, FERRIER_WORD, FORECAST, KEEP_WORKING, LEAVE, LIFTER_IN, LIFTER_PEOPLE, PLENTY, PROBE_STAR, PULL, SCAN_MINE,
  SHADOW, SHELTER, STROME_WORD, TEAM, TELL,
} from './words';

const END_FLAGS = ['endFlare', 'endLeft', 'endFired'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const mins = (n: number) => Math.max(0, n);
/** Words that give the Lifter-Master or the Overseer a reason: lives, and what the forecast shows. */
const REASON = /\b(lives?|die|dying|kill\w*|deaths?|souls|families|forecast|window|minutes?|flare|tide|science officer|varga|no sooner|no later|between)\b/;
const SHARE = /\b(forecast|window|minutes?|varga|science officer|no sooner|no later|between|readings?|the flare (will|could|comes|is due))\b/;
const QUESTION = /\?\s*$|^\s*(what|which|how|who|where|when|why|is|are|do|does|did|can|could|would|should|any|will)\b/;

export const forecasting = (s: WorldState) => !!s.flags.forecasting;
export const inShadow = (s: WorldState) => !!s.flags.inShadow;
const interval = (s: WorldState) => (s.flags.boosted ? 2 : 3);
const banked = (s: WorldState) => !!s.flags.banked;
const lifted = (s: WorldState) => !!s.flags.lifted;
const liftOrdered = (s: WorldState) => c(s, 'liftOrderedAt') > 0;
const shelterOrdered = (s: WorldState) => c(s, 'shelterAt') > 0;
/** 0 flying ore in the open, 1 carrying people, 2 docked in the shadow. */
const ferrierMode = (s: WorldState) => c(s, 'ferrierMode');

export function vars(s: WorldState): Record<string, string | number> {
  const v = ember(s);
  return {
    turn: s.turn,
    from: mins(c(s, 'lo') - s.turn),
    to: mins(c(s, 'hi') - s.turn),
    general: c(s, 'general'),
    bank: c(s, 'bank'),
    team: c(s, 'team'),
    aboard: c(s, 'aboard'),
    bankMins: mins(c(s, 'bankDone') - s.turn),
    shuttles: v.shuttles,
    pop: v.population,
    crew: v.bankCrew,
    readings: c(s, 'readings'),
    galleries: v.galleries,
    star: v.star,
    model: v.model,
    temper: v.temper,
    will: v.will,
    forecasting: forecasting(s) ? 1 : 0,
    banked: banked(s) ? 1 : 0,
    inShadow: inShadow(s) ? 1 : 0,
    ferrier: ferrierMode(s),
    underground: c(s, 'underground'),
    deadCiv: c(s, 'deadCiv'),
    deadCrew: c(s, 'deadCrew'),
  };
}

/** Is anyone still where the flare can reach them? */
export function anyoneExposed(s: WorldState): boolean {
  return c(s, 'general') > 0 || (c(s, 'bank') > 0 && !lifted(s)) || (c(s, 'team') > 0 && !lifted(s)) || ferrierMode(s) !== 2;
}

// ------------------------------------------------------------------ the science ---

export function startForecast(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (forecasting(s)) {
    r.push(say('sensors', c(s, 'readings') ? 'forecastWorking' : 'forecastFirstSoon', vars(s)));
    return s;
  }
  s = setFlag(s, 'forecasting');
  s = setCounter(s, 'forecastAt', Math.max(1, s.turn));
  s = setCounter(s, 'nextReading', s.turn + interval(s));
  r.push(say('sensors', 'forecastStart', { ...vars(s), every: interval(s) }));
  return s;
}

function boost(s: WorldState, r: Report[]): WorldState {
  if (s.flags.boosted) {
    r.push(say('engineering', 'boostAlready'));
    return s;
  }
  s = setFlag(s, 'boosted');
  if (forecasting(s) && c(s, 'nextReading') > s.turn + 2) s = setCounter(s, 'nextReading', s.turn + 2);
  r.push(say('engineering', 'boostSensors'));
  return s;
}

function probe(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'probeAt') > 0 || s.flags.probeIn) {
    r.push(say('sensors', 'probeAlready'));
    return s;
  }
  if (!forecasting(s)) s = startForecast(s, r);
  s = setCounter(s, 'probeAt', s.turn + 3);
  r.push(say('sensors', 'probeLaunched'));
  return setFlag(s, 'probeLaunched');
}

/** One reading: the window halves toward the minute, down to what the model can resolve. */
function reading(s: WorldState, r: Report[]): WorldState {
  const v = ember(s);
  const floor = s.flags.probeIn || v.model === 'firm' ? 1 : 3;
  const F = v.flareAt;
  const lo = Math.max(c(s, 'lo'), F - Math.max(floor, Math.ceil((F - c(s, 'lo')) / 2)));
  const hi = Math.min(c(s, 'hi'), F + Math.max(floor, Math.ceil((c(s, 'hi') - F) / 2)));
  s = setCounter(s, 'lo', lo);
  s = setCounter(s, 'hi', hi);
  s = setCounter(s, 'readings', c(s, 'readings') + 1);
  r.push(say('sensors', 'vargaReading', vars(s)));
  if (F - lo <= floor && hi - F <= floor && !s.flags[`floor_${floor}`]) {
    s = setFlag(s, `floor_${floor}`);
    r.push(say('sensors', floor === 1 ? 'vargaFloorFirm' : 'vargaFloorNoisy'));
  }
  return s;
}

function scanMine(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'galleries')) {
    r.push(say('sensors', `vargaGalleries_${ember(s).galleries}`));
    return s;
  }
  if (c(s, 'galleriesAt') > 0) {
    r.push(say('sensors', 'scanMineBusy'));
    return s;
  }
  s = setCounter(s, 'galleriesAt', s.turn + 2);
  // Varga has one pair of hands: the survey holds up the next reading.
  if (forecasting(s)) s = setCounter(s, 'nextReading', c(s, 'nextReading') + 2);
  r.push(say('sensors', forecasting(s) ? 'scanMineStartForecast' : 'scanMineStart'));
  return s;
}

// ------------------------------------------------------------------ the lifts ---

export function evac(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (shelterOrdered(s)) {
    r.push(say('xo', 'evacSheltering'));
    return s;
  }
  if (s.flags.evacOn) {
    r.push(say('xo', 'evacAlready', vars(s)));
    return s;
  }
  s = setFlag(s, 'evacOn');
  s = setCounter(s, 'evacAt', Math.max(1, s.turn));
  r.push(say('xo', 'evacStart', vars(s)));
  r.push(comms('strome', 'stromeEvacAgree', vars(s)));
  return s;
}

/** The last lift: the banking crew (and any of the Halcyon's engineers with them) off the furnace. */
function launchLift(s: WorldState, r: Report[], by: 'captain' | 'strome'): WorldState {
  const v = ember(s);
  const t = Math.max(1, s.turn);
  s = setCounter(s, 'liftOrderedAt', t);
  s = setCounter(s, 'liftAt', t + LIFT);
  s = setFlag(s, `liftBy_${by}`);
  const lo = c(s, 'lo');
  if (t + LIFT > lo) s = setFlag(s, 'gamble');
  if (s.flags.tellSeen) s = setFlag(s, 'liftOnTell');
  if (!banked(s)) {
    s = setFlag(s, 'furnaceLost');
    // The forecast could not promise the furnace its time, and the crew stayed until close to the
    // last safe minute and came off while it was still safe.
    if (by === 'captain' && t + LIFT <= lo && t + LIFT + 2 >= lo && c(s, 'bankDone') + LIFT > lo) s = setFlag(s, 'noGamble');
    if (by === 'captain' && falseAt(v) && s.turn >= falseAt(v) && s.turn <= falseAt(v) + 1 && !s.flags.falseDawnCalled) s = setFlag(s, 'pulledAtFalseDawn');
    r.push(comms('strome', by === 'strome' ? 'stromePullsOwn' : 'stromePulls', vars(s)));
  } else r.push(comms('strome', 'stromeLiftBanked', vars(s)));
  r.push(say('xo', 'liftAway', vars(s)));
  return s;
}

function pull(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (liftOrdered(s)) {
    r.push(say('xo', 'liftAlready', vars(s)));
    return s;
  }
  if (c(s, 'bank') === 0 && c(s, 'team') === 0) {
    r.push(say('xo', 'nobodyAtFurnace'));
    return s;
  }
  if (SHARE.test(t)) s = shareForecast(s, r, false);
  const v = ember(s);
  if (!banked(s) && v.temper === 'stubborn' && !s.flags.forecastShared && !s.flags.tellSeen) {
    r.push(comms('strome', 'stromeStubborn', vars(s)));
    return setFlag(s, 'stromeBalked');
  }
  return launchLift(s, r, 'captain');
}

function sendTeam(s: WorldState, r: Report[]): WorldState {
  if (s.flags.teamSent) {
    r.push(say('engineering', 'teamAlready', vars(s)));
    return s;
  }
  if (banked(s) || liftOrdered(s) || c(s, 'bank') === 0) {
    r.push(say('engineering', 'teamNoNeed'));
    return s;
  }
  s = setFlag(s, 'teamSent');
  s = setCounter(s, 'team', TEAM_SIZE);
  s = setCounter(s, 'teamAt', Math.max(1, s.turn));
  s = setCounter(s, 'bankDone', Math.max(s.turn + 1, c(s, 'bankDone') - 3));
  r.push(say('engineering', 'teamDown', vars(s)));
  return s;
}

function shelter(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  const v = ember(s);
  if (shelterOrdered(s)) {
    r.push(say('xo', 'shelterAlready'));
    return s;
  }
  if (v.galleries === 'flooded') {
    r.push(comms('strome', 'stromeFlooded'));
    return setFlag(s, 'shelterRefused');
  }
  s = setFlag(s, 'shelterOrdered');
  if (knows(s, 'galleries')) s = setFlag(s, v.galleries === 'deep' ? 'shelterVerified' : 'shelterKnownShallow');
  s = setCounter(s, 'shelterAt', s.turn + 2);
  s = setFlag(s, 'evacOn', false);
  r.push(comms('strome', 'stromeShelter', vars(s)));
  if (!knows(s, 'galleries')) r.push(say('medical', 'oseiUnverified'));
  return s;
}

// ------------------------------------------------------------------ the ship ---

function shadow(s: WorldState, r: Report[], by: 'captain' | 'xo' = 'captain'): WorldState {
  if (inShadow(s) || c(s, 'shadowAt') > 0) {
    if (by === 'captain') r.push(say('helm', 'shadowAlready'));
    return s;
  }
  s = setCounter(s, 'shadowAt', s.turn + SHADOW_MINS);
  s = setCounter(s, 'shadowOrderedAt', Math.max(1, s.turn));
  if (by === 'captain') {
    s = setFlag(s, 'shadowByCaptain');
    if (s.turn + SHADOW_MINS <= c(s, 'lo')) s = setFlag(s, 'shadowInTime');
  }
  r.push(say(by === 'xo' ? 'xo' : 'helm', by === 'xo' ? 'xoAutoShadow' : 'shadowMoving'));
  if (c(s, 'general') > 0 && s.flags.evacOn) r.push(say('xo', 'shadowSlowsLifts'));
  return s;
}

function backOver(s: WorldState, r: Report[]): WorldState {
  if (!inShadow(s) && !c(s, 'shadowAt')) {
    r.push(say('helm', 'notInShadow'));
    return s;
  }
  s = setFlag(s, 'inShadow', false);
  s = setCounter(s, 'shadowAt', 0);
  s = setFlag(s, 'shadowInTime', false);
  r.push(say('helm', 'backOver'));
  return s;
}

export function leave(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (!anyoneExposed(s)) {
    r.push(say('helm', 'leavingClear'));
    s = setFlag(s, 'away');
    return resolveFlare(s, r);
  }
  r.push(say('helm', 'leavingMoon'));
  return setFlag(s, 'endLeft');
}

// ------------------------------------------------------------------ the people ---

function shareForecast(s: WorldState, r: Report[], speak = true): WorldState {
  s = setFlag(s, 'forecastShared');
  if (speak) r.push(comms('strome', ember(s).temper === 'stubborn' ? 'stromeForecastStubborn' : 'stromeForecast', vars(s)));
  return s;
}

const falseDawnLive = (s: WorldState) => {
  const f = falseAt(ember(s));
  return f > 0 && s.turn >= f && s.turn <= f + 1;
};

/**
 * One spoken line can reach an NPC as several clauses ("It's not the flare. It's a false dawn.").
 * Within one order the NPC does not repeat a reply it has already given: the same key is said once.
 */
const REPLY_KEYS = [
  'stromeReassured', 'stromeForecast', 'stromeForecastStubborn', 'stromeStatus', 'stromePulls', 'stromeStubborn', 'stromeShelter', 'stromeFlooded', 'stromeEvacAgree',
  'stromeGalleries', 'stromeGalleriesFlooded', 'stromeBanking', 'stromeBankedAlready', 'stromeAfter', 'stromeLiftBanked',
  'ferrierWhy', 'ferrierCarries', 'ferrierComesIn', 'ferrierCarrying', 'ferrierOneMore', 'ferrierDocked', 'ferrierStatus', 'ferrierAfter',
];
/** Replies that say the same thing: after one, the other is not said again in the same order. */
const SAME_REPLY: Record<string, string> = { stromeHolds: 'stromeReassured' };
function once(who: 'strome' | 'ferrier', fn: (s: WorldState, t: string, r: Report[]) => WorldState) {
  return (s: WorldState, t: string, r: Report[]): WorldState => {
    const mine: Report[] = [];
    s = fn(s, t, mine);
    const mark = s.log.length + 1;
    const fresh = c(s, `${who}Mark`) !== mark;
    let heard = fresh ? 0 : c(s, `${who}Heard`);
    for (const x of mine) {
      const k = SAME_REPLY[x.key] ?? x.key;
      const i = REPLY_KEYS.indexOf(k);
      const bit = i < 0 ? 0 : 2 ** i;
      if (!bit) {
        r.push(x);
        continue;
      }
      if (Math.floor(heard / bit) % 2 === 1) continue;
      heard += bit;
      r.push(x);
    }
    s = setCounter(s, `${who}Mark`, mark);
    return setCounter(s, `${who}Heard`, heard);
  };
}

export const stromeRespond = once('strome', stromeReply);
export const ferrierRespond = once('ferrier', ferrierReply);

function stromeReply(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('strome', 'stromeAfter'));
    return s;
  }
  s = setFlag(s, 'spokeStrome');
  const v = ember(s);
  if (PULL.test(t) || (BANK_W.test(t) && /\b(up|off|out|now|aboard)\b/.test(t) && !KEEP_WORKING.test(t))) return pull(s, t, r);
  if (SHELTER.test(t) && !SHADOW.test(t) && !QUESTION.test(t)) return shelter(s, r);
  if (EVAC.test(t)) return evac(s, r);
  if (QUESTION.test(t) && /\b(mine|galleries|gallery|deep|shelter|rock|underground)\b/.test(t)) {
    r.push(comms('strome', v.galleries === 'flooded' ? 'stromeGalleriesFlooded' : 'stromeGalleries'));
    return s;
  }
  if (QUESTION.test(t) && /\b(furnace|bank\w*|how long)\b/.test(t)) {
    r.push(comms('strome', banked(s) ? 'stromeBankedAlready' : 'stromeBanking', vars(s)));
    return revealFact(s, 'banking');
  }
  const shares = SHARE.test(t);
  const dawn = falseDawnLive(s) && FALSE_DAWN.test(t);
  const plenty = PLENTY.test(t);
  if (shares) s = shareForecast(s, r, !dawn);
  if (dawn) {
    s = setFlag(s, 'reassured');
    if (!s.flags.falseDawnCalled) s = setFlag(s, 'falseAssurance');
    r.push(comms('strome', 'stromeReassured'));
    return s;
  }
  if (plenty) {
    // "Plenty of time" is a promise about the flare: it is honest only if the forecast backs it.
    if (c(s, 'bankDone') + LIFT > c(s, 'lo') || !forecasting(s)) s = setFlag(s, 'falseAssurance');
    s = setFlag(s, 'reassured');
    r.push(comms('strome', 'stromeHolds', vars(s)));
    return s;
  }
  if (KEEP_WORKING.test(t)) {
    s = setFlag(s, 'reassured');
    r.push(comms('strome', 'stromeHolds', vars(s)));
    return s;
  }
  if (shares) return s;
  r.push(comms('strome', 'stromeStatus', vars(s)));
  return s;
}

function ferrierReply(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('ferrier', 'ferrierAfter'));
    return s;
  }
  s = setFlag(s, 'spokeFerrier');
  const v = ember(s);
  const reason = REASON.test(t);
  if (ferrierMode(s) === 2) {
    r.push(comms('ferrier', 'ferrierDocked'));
    return s;
  }
  // Asked to carry people (or, having asked "why now?", given the reason): he carries if he is
  // willing or has been told why. Asking him without a reason is not yet a warning.
  const answered = !!s.flags.ferrierAsked && reason && !LIFTER_IN.test(t);
  if ((LIFTER_PEOPLE.test(t) || answered) && ferrierMode(s) === 0) {
    if (v.will === 'willing' || reason) {
      s = setFlag(s, 'warnedLifter');
      s = setCounter(s, 'ferrierMode', c(s, 'general') > 0 ? 1 : 2);
      s = setCounter(s, 'ferrierAt', 0);
      r.push(comms('ferrier', c(s, 'general') > 0 ? 'ferrierCarries' : 'ferrierComesIn'));
      return s;
    }
    s = setFlag(s, 'ferrierAsked');
    r.push(comms('ferrier', 'ferrierWhy'));
    return s;
  }
  if (LIFTER_IN.test(t) || reason || /\b(flare|tide|warn)\b/.test(t)) {
    if (reason || /\b(flare|tide|warn)\b/.test(t) || v.will === 'willing' || ferrierMode(s) === 1) s = setFlag(s, 'warnedLifter');
    if (ferrierMode(s) === 1) {
      r.push(comms('ferrier', 'ferrierCarrying'));
      return s;
    }
    if (v.will === 'willing' || reason) {
      s = setCounter(s, 'ferrierMode', 2);
      s = setCounter(s, 'ferrierAt', 0);
      r.push(comms('ferrier', 'ferrierComesIn'));
      return s;
    }
    if (!c(s, 'ferrierAt')) s = setCounter(s, 'ferrierAt', s.turn + 3);
    r.push(comms('ferrier', 'ferrierOneMore'));
    return s;
  }
  r.push(comms('ferrier', ferrierMode(s) === 1 ? 'ferrierCarrying' : 'ferrierStatus'));
  return s;
}

// ------------------------------------------------------------------ orders ---

/** The officer an order was addressed to, passed on by the interpreter as a prefix ("sensors: …"). */
const PREFIX = /^(xo|tactical|sensors|helm|comms|engineering|medical): /;

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase().replace(PREFIX, '');
  if (settled(s)) {
    r.push(say('xo', 'afterEnd'));
    return s;
  }
  if (LEAVE.test(t)) return leave(s, r);
  if (FERRIER_WORD.test(t) && (TELL.test(t) || LIFTER_PEOPLE.test(t) || LIFTER_IN.test(t))) {
    r.push(say('comms', 'relayed'));
    return ferrierRespond(s, t, r);
  }
  if (PULL.test(t)) {
    r.push(say('comms', 'relayed'));
    return pull(s, t, r);
  }
  if (TEAM.test(t)) return sendTeam(s, r);
  if (SHADOW.test(t)) return shadow(s, r);
  if (BACK_OVER.test(t)) return backOver(s, r);
  if (SHELTER.test(t)) {
    r.push(say('comms', 'relayed'));
    return shelter(s, r);
  }
  if (TELL.test(t) && STROME_WORD.test(t)) {
    r.push(say('comms', 'relayed'));
    return stromeRespond(s, t, r);
  }
  if (PROBE_STAR.test(t)) return probe(s, r);
  if (BOOST.test(t)) return boost(s, r);
  if (SCAN_MINE.test(t)) return scanMine(s, r);
  if (EVAC.test(t)) return evac(s, r);
  if (FORECAST.test(t)) return startForecast(s, r);
  if (BANK_W.test(t) && KEEP_WORKING.test(t)) {
    r.push(say('comms', 'relayed'));
    return stromeRespond(s, t, r);
  }
  r.push(say('xo', 'emberUnclear', { description: raw.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase().replace(PREFIX, '');
  const v = ember(s);
  if (/\b(mine|galleries|gallery|deep|shelter|underground|rock)\b/.test(t)) {
    r.push(say('sensors', knows(s, 'galleries') ? `vargaGalleries_${v.galleries}` : 'vargaGalleriesUnknown'));
    return s;
  }
  if (/\b(furnace|bank\w*|smelter)\b/.test(t)) {
    r.push(say('engineering', banked(s) ? 'okaforBanked' : liftOrdered(s) ? 'okaforLiftGone' : 'okaforBanking', vars(s)));
    return revealFact(s, 'banking');
  }
  if (/\b(ferrier|lifter|mattock)\b/.test(t)) {
    r.push(say('comms', ferrierMode(s) === 2 ? 'commsLifterIn' : ferrierMode(s) === 1 ? 'commsLifterCarrying' : 'commsLifterOut'));
    return s;
  }
  if (/\b(shadow|helm|far side)\b/.test(t)) {
    r.push(say('helm', inShadow(s) ? 'helmInShadow' : c(s, 'shadowAt') ? 'helmGoing' : 'helmShadowInfo'));
    return s;
  }
  if (/\b(how many|people|evacuat\w*|lifts?|shuttles?|aboard)\b/.test(t)) {
    r.push(say('xo', 'xoEvacStatus', vars(s)));
    return s;
  }
  if (/\b(flare|star|myrr|tide|forecast|window|when|how long|how much time|time left)\b/.test(t) || CASE.test(t)) {
    r.push(say('sensors', forecasting(s) && c(s, 'readings') ? 'vargaWindow' : forecasting(s) ? 'forecastFirstSoon' : 'vargaWindowFirst', vars(s)));
    return s;
  }
  if (COUNSEL.test(t)) {
    const key = !s.flags.evacOn && !shelterOrdered(s) ? 'xoCounselLift' : !forecasting(s) ? 'xoCounselForecast' : !liftOrdered(s) && !banked(s) ? 'xoCounselFurnace' : 'xoCounselShadow';
    r.push(say('xo', key, vars(s)));
    return s;
  }
  r.push(say('xo', 'xoCase', vars(s)));
  return s;
}

// ------------------------------------------------------------------ the flare ---

function resolveFlare(s: WorldState, r: Report[]): WorldState {
  const away = !!s.flags.away;
  let deadCiv = 0;
  let deadCrew = 0;
  const general = c(s, 'general');
  const bank = lifted(s) ? 0 : c(s, 'bank');
  const team = lifted(s) ? 0 : c(s, 'team');
  const inFlight = liftOrdered(s) && !lifted(s);
  if (!away) {
    r.push(narrate('flareArrives'));
    deadCiv += general + bank;
    deadCrew += team + (inFlight ? 3 : 0);
    if (general + bank > 0) r.push(say('sensors', inFlight && general === 0 ? 'flareCaughtLift' : 'flareCaughtSurface', { n: general + bank }));
    if (team > 0 && !inFlight) r.push(say('engineering', 'flareCaughtTeam'));
    if (ferrierMode(s) !== 2) {
      s = setFlag(s, 'lifterLost');
      r.push(say('comms', 'flareCaughtLifter'));
    }
    if (!inShadow(s)) {
      s = setFlag(s, 'halcyonCaught');
      s = { ...s, ships: { ...s.ships, halcyon: { ...s.ships.halcyon, hull: Math.min(s.ships.halcyon.hull, 30) } } };
      r.push(say('engineering', 'flareCaughtHalcyon'));
    } else r.push(say('helm', 'flareShadowHolds'));
    if (c(s, 'underground') > 0) {
      if (ember(s).galleries === 'shallow') {
        s = setFlag(s, 'shelterHit');
        r.push(say('medical', 'flareShallow', vars(s)));
      } else r.push(comms('strome', 'flareDeepHolds'));
    }
  }
  s = setCounter(s, 'deadCiv', deadCiv);
  s = setCounter(s, 'deadCrew', deadCrew);
  s = setCounter(s, 'kestrelDead', deadCiv);
  s = setCounter(s, 'general', 0);
  s = setCounter(s, 'bank', 0);
  s = setCounter(s, 'team', 0);
  const k = s.ships.kestrel;
  s = { ...s, ships: { ...s.ships, kestrel: { ...k, souls: c(s, 'underground') } } };
  return setFlag(s, 'endFlare');
}

// ------------------------------------------------------------------ the clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(contacts);
  step(starClock);
  step(work);
  step(flare);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  if (s.flags.shotsFired) {
    r.push(say('xo', 'shotsAtOutpost'));
    return setFlag(s, 'endFired');
  }
  if (s.flags.jumped || s.ships.halcyon.position.x < -30000) return leave(s, r);
  return s;
}

function contacts(s: WorldState, r: Report[]): WorldState {
  if (s.turn >= 1 && !s.flags.stromeCalled) {
    s = setFlag(s, 'stromeCalled');
    s = revealFact(s, 'banking');
    r.push(comms('strome', 'stromeCall', vars(s)));
  }
  if (s.turn >= 2 && !s.flags.ferrierCalled) {
    s = setFlag(s, 'ferrierCalled');
    r.push(comms('ferrier', ferrierMode(s) === 0 ? 'ferrierCall' : 'ferrierCallBusy'));
  }
  if (s.turn >= 4 && !s.flags.evacOn && !shelterOrdered(s) && !s.flags.stromeChased) {
    s = setFlag(s, 'stromeChased');
    r.push(comms('strome', 'stromeChases'));
  }
  return s;
}

function starClock(s: WorldState, r: Report[]): WorldState {
  const v = ember(s);
  // A restless star's false dawn.
  const fa = falseAt(v);
  if (fa && s.turn === fa) {
    s = setFlag(s, 'falseDawn');
    if (forecasting(s) && c(s, 'readings') > 0) {
      s = setFlag(s, 'falseDawnCalled');
      r.push(say('sensors', 'vargaFalseDawn', vars(s)));
    } else r.push(say('sensors', forecasting(s) ? 'falseDawnTooSoon' : 'falseDawnUnread'));
    if (!banked(s) && !liftOrdered(s) && !shelterOrdered(s) && c(s, 'bank') > 0) r.push(comms('strome', v.temper === 'anxious' ? 'stromePanics' : 'stromeAsksDawn'));
    if (ferrierMode(s) === 0) {
      s = setCounter(s, 'ferrierMode', 2);
      r.push(comms('ferrier', 'ferrierSpooked'));
    }
  }
  if (fa && s.turn === fa + 1 && v.temper === 'anxious' && !s.flags.reassured && !banked(s) && !liftOrdered(s) && !shelterOrdered(s) && c(s, 'bank') > 0) {
    s = launchLift(s, r, 'strome');
    s = setFlag(s, 'stromePanicked');
  }
  // A telling star's precursor, seen only by someone reading its spectrum.
  const ta = tellAt(v);
  if (ta && s.turn === ta && forecasting(s)) {
    s = setFlag(s, 'tellSeen');
    s = revealFact(s, 'tell');
    s = setCounter(s, 'lo', v.flareAt);
    s = setCounter(s, 'hi', v.flareAt);
    r.push(say('sensors', 'vargaTell', vars(s)));
    if (!inShadow(s) && !c(s, 'shadowAt')) s = shadow(s, r, 'xo');
  }
  // The probe reaches the star's edge.
  const pa = c(s, 'probeAt');
  if (pa > 0 && s.turn >= pa) {
    s = setCounter(s, 'probeAt', 0);
    s = setFlag(s, 'probeIn');
    r.push(say('sensors', 'probeArrived'));
    if (!s.flags.tellSeen) s = reading(s, r);
  }
  // Scheduled readings.
  const nr = c(s, 'nextReading');
  if (forecasting(s) && nr > 0 && s.turn >= nr && !s.flags.tellSeen) {
    s = reading(s, r);
    s = setCounter(s, 'nextReading', s.turn + interval(s));
  }
  // The gallery survey.
  const ga = c(s, 'galleriesAt');
  if (ga > 0 && s.turn >= ga) {
    s = setCounter(s, 'galleriesAt', 0);
    s = revealFact(s, 'galleries');
    r.push(say('sensors', `vargaGalleries_${v.galleries}`));
  }
  return s;
}

function syncSouls(s: WorldState): WorldState {
  const k = s.ships.kestrel;
  const h = s.ships.halcyon;
  const souls = c(s, 'general') + c(s, 'bank') + c(s, 'underground');
  return { ...s, ships: { ...s.ships, kestrel: { ...k, souls }, halcyon: { ...h, souls: 212 + c(s, 'aboard') - (c(s, 'team') && !lifted(s) ? c(s, 'team') : 0) } } };
}

function work(s: WorldState, r: Report[]): WorldState {
  const v = ember(s);
  // The banking crew at the furnace.
  if (!banked(s) && !liftOrdered(s) && !s.flags.furnaceLost && c(s, 'bank') > 0 && s.turn >= c(s, 'bankDone')) {
    s = setFlag(s, 'banked');
    r.push(comms('strome', 'stromeBanked'));
    // Her own goal met, the Overseer puts her crew on the pad at once, unless they are going below.
    if (!shelterOrdered(s)) s = launchLift(s, r, 'strome');
  }
  // The general lift.
  if (s.flags.evacOn && c(s, 'general') > 0 && !shelterOrdered(s)) {
    const shuttles = Math.round(v.shuttles * 15 * (inShadow(s) ? 0.5 : 1));
    const moved = Math.min(c(s, 'general'), shuttles + (ferrierMode(s) === 1 ? 40 : 0));
    s = setCounter(s, 'general', c(s, 'general') - moved);
    s = setCounter(s, 'aboard', c(s, 'aboard') + moved);
    if (c(s, 'general') === 0) {
      s = setFlag(s, 'generalDone');
      r.push(say('comms', 'generalDone', vars(s)));
      if (ferrierMode(s) === 1) {
        s = setCounter(s, 'ferrierMode', 2);
        r.push(comms('ferrier', 'ferrierDocks'));
      }
    }
  }
  // The last lift reaches the ship.
  const la = c(s, 'liftAt');
  if (la > 0 && s.turn >= la && !lifted(s)) {
    s = setFlag(s, 'lifted');
    s = setCounter(s, 'aboard', c(s, 'aboard') + c(s, 'bank'));
    s = setCounter(s, 'bank', 0);
    r.push(say('xo', c(s, 'team') ? 'liftAboardTeam' : 'liftAboard', vars(s)));
    s = setCounter(s, 'team', 0);
  }
  // The shadow.
  const sa = c(s, 'shadowAt');
  if (sa > 0 && s.turn >= sa && !inShadow(s)) {
    s = setFlag(s, 'inShadow');
    r.push(say('helm', 'inShadow'));
  }
  // Below ground.
  const sh = c(s, 'shelterAt');
  if (sh > 0 && s.turn >= sh && !s.flags.sheltered) {
    s = setFlag(s, 'sheltered');
    s = setCounter(s, 'underground', c(s, 'underground') + c(s, 'general'));
    s = setCounter(s, 'general', 0);
    r.push(comms('strome', 'stromeBelow', vars(s)));
  }
  // The banking crew go below at the last minute, banked or not.
  if (s.flags.sheltered && !liftOrdered(s) && c(s, 'bank') > 0 && s.turn >= v.flareAt - 1) {
    if (!banked(s)) s = setFlag(s, 'furnaceLost');
    s = setCounter(s, 'underground', c(s, 'underground') + c(s, 'bank') + c(s, 'team'));
    s = setCounter(s, 'bank', 0);
    s = setCounter(s, 'team', 0);
    s = setFlag(s, 'bankBelow');
    r.push(comms('strome', banked(s) ? 'stromeCrewBelowBanked' : 'stromeCrewBelow'));
  }
  // The lifter.
  const fa = c(s, 'ferrierAt');
  if (fa > 0 && s.turn >= fa && ferrierMode(s) === 0) {
    s = setCounter(s, 'ferrierMode', 2);
    s = setCounter(s, 'ferrierAt', 0);
    r.push(comms('ferrier', 'ferrierInNow'));
  }
  // The helm's warning.
  if (!inShadow(s) && !c(s, 'shadowAt') && c(s, 'lo') - s.turn <= SHADOW_MINS + 1 && !s.flags.helmWarned) {
    s = setFlag(s, 'helmWarned');
    r.push(say('helm', 'helmWarns', vars(s)));
  }
  return syncSouls(s);
}

function flare(s: WorldState, r: Report[]): WorldState {
  if (s.turn < ember(s).flareAt) return s;
  return resolveFlare(s, r);
}

export const lifterCrew = LIFTER_CREW;
export { bankable };
