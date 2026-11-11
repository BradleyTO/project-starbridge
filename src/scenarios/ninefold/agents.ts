/**
 * The Ninefold Lock — agents: the depot's three rings (the Watch, the Screen, the Keystone), the
 * survey team and their air, Crewman Tran's wound, the Directorate recovery cutter Ordinal and
 * Quartermaster-Commander Kovar, the Chief's cutting team, and the Halcyon's officers.
 * Deterministic: no randomness after setup.
 *
 * The grid cannot be persuaded or bluffed, only understood. Every route that works without cost runs
 * through evidence: what the Watch answers to (from what happened on the pad, the shuttle's recorder,
 * a probe, or the ship's own approach), when the Screen drops (watched, or read by an active scan
 * that lights the ship up), and what the Keystone's question really asks (read off the depot by the
 * team and interpreted by Lt. Cmdr. Rask, who reads Directorate doctrine and glyphs and says how far
 * the evidence goes). Guessing costs: a wrong answer hardens the Screen, hammering the Screen hardens
 * it, and a ship that the Watch has called hostile is fired on until she leaves its reach.
 * Judged on what was known at the time (ISA-COM-001 §1.4, cmd-4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { recordRefusal } from '../../engine/roe';
import { adjustTrust, knows, patchCharacter, patchShip, revealFact, setCounter, setFlag } from '../../engine/state';
import { BIT, INCIDENT_MASK, TEAM, fires, isGap, nextGap, nine, tranHurt, type Trigger } from './setup';
import {
  AIR_Q, ANSWER, APPROACH, AT_MINUTE, BACK_OUT, BAYS_Q, BEAM, BOARD_Q, CASE, COLD, CONFIRM, COUNSEL, CUT, DOCTRINE, FIRE_DEPOT, GUNS_ONLY,
  HALL_Q, HONEST, KEY_Q, LIE, LOG, NEXT_GAP, PROBE, PROMISE_NOSCAN, PROMISE_NOTHING, SCAN_SCREEN, SCREEN_Q, SLOW, STANDDOWN, TREAT, WATCH_Q, WATCH_SCREEN,
} from './words';

const END_FLAGS = ['endKeystone', 'endGap', 'endMakers', 'endCut', 'endCost', 'endForced', 'endLost', 'endAbandoned', 'endIncident', 'endDetained'] as const;
type EndFlag = (typeof END_FLAGS)[number];
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const ROLE_PREFIX = /^(helm|tactical|ops|science|comms|xo|medical|engineering|sensors): /;
type Role = 'xo' | 'comms' | 'sensors' | 'engineering' | 'tactical' | 'helm' | 'medical';

export const inside = (s: WorldState) => !s.flags.teamOut && s.ships.kestrel.souls > 0;
export const range = (s: WorldState) => c(s, 'range');
export const watchLive = (s: WorldState) => !s.flags.watchDead && !s.flags.freed;
export const airLeft = (s: WorldState) => Math.max(0, nine(s).airEnd - s.turn);
export const evidenceIn = (s: WorldState) => {
  const q = nine(s).question;
  return q === 'count' ? knows(s, 'boardRead') : q === 'ring' ? knows(s, 'hallRead') : knows(s, 'bays');
};

const TRIG_WORD: Record<Trigger, string> = {
  emission: 'active emissions: a scan, a sweep, anything that lights it up',
  power: 'a powered approach: engines driving, shields up or weapons hot',
  haste: 'haste: anything closing on it fast',
};
const TRIG_SHORT: Record<Trigger, string> = { emission: 'emissions', power: 'power', haste: 'haste' };
const RING_WORD = { outer: 'the outer ring', middle: 'the middle ring' } as const;
const STORES_WORD = { fuel: 'racked fuel cells, dozens of them, cold', water: 'water tanks, full, rimed with frost', nothing: 'empty racks. Stripped bare. Nothing in any of them' } as const;
const NUM = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

export function candidates(s: WorldState): Trigger[] {
  const m = c(s, 'cand');
  return (['emission', 'power', 'haste'] as const).filter((t) => (m & BIT[t]) !== 0);
}

export function vars(s: WorldState): Record<string, string | number> {
  const v = nine(s);
  const cand = candidates(s);
  const lean = cand.includes(v.lean) ? v.lean : cand[0] ?? v.lean;
  const other = cand.find((x) => x !== lean) ?? lean;
  return {
    turn: s.turn,
    air: airLeft(s),
    airEnd: v.airEnd,
    trig: TRIG_WORD[v.trigger],
    trigShort: TRIG_SHORT[v.trigger],
    lean: TRIG_WORD[lean],
    leanShort: TRIG_SHORT[lean],
    other: TRIG_WORD[other],
    otherShort: TRIG_SHORT[other],
    live: v.live,
    liveWord: NUM[v.live],
    lit: v.live + v.broken,
    litWord: NUM[v.live + v.broken],
    broken: v.broken,
    brokenWord: NUM[v.broken],
    behind: v.hall === 'outer' ? 'one seal' : 'two seals',
    ahead: v.hall === 'outer' ? 'two' : 'one',
    ringWord: RING_WORD[v.hall],
    stores: STORES_WORD[v.stores],
    period: v.period,
    nextGap: nextGap(v, s.turn),
    lastGap: c(s, 'lastGap'),
    hits: c(s, 'hits'),
    probes: c(s, 'probes'),
    deaths: c(s, 'deaths'),
    alive: s.ships.kestrel.souls,
    beamAt: c(s, 'beamAt'),
    range: range(s),
    hurt: tranHurt(v) ? 1 : 0,
  };
}

function end(s: WorldState, flag: EndFlag, r: Report[], key: string, role: Role = 'xo'): WorldState {
  if (settled(s)) return s;
  r.push(say(role, key, vars(s)));
  return setFlag(s, flag);
}

/** Record what an action showed the Watch and whether it drew fire. */
function observe(s: WorldState, mask: number, fired: boolean): WorldState {
  if (mask === 0) return s;
  const m = c(s, 'cand');
  const next = fired ? m & mask : m & ~mask & 7;
  return setCounter(s, 'cand', next || m);
}

// ------------------------------------------------------------------ the team comes out ---

function teamOut(s: WorldState, r: Report[], route: 'keystone' | 'gap' | 'makers' | 'cut'): WorldState {
  if (settled(s) || s.flags.teamOut) return s;
  const n = s.ships.kestrel.souls;
  s = patchShip(s, 'kestrel', { souls: 0, disposition: 'evacuated' });
  s = patchShip(s, 'halcyon', { souls: s.ships.halcyon.souls + n });
  s = setCounter(s, 'rescued', c(s, 'rescued') + n);
  for (const id of ['kaminski', 'tran', 'whitlock', 'ibarra']) if (s.characters[id]?.status !== 'dead') s = patchCharacter(s, id, { ship: 'halcyon' });
  s = setFlag(s, 'teamOut');
  s = setFlag(s, `route_${route}`);
  r.push(say(route === 'cut' ? 'engineering' : route === 'gap' ? 'sensors' : 'xo', `out_${route}`, vars(s)));
  if (c(s, 'deaths') > 0 || c(s, 'hits') >= 2 || s.flags.rescueHurt) return end(s, 'endCost', r, c(s, 'deaths') > 0 ? 'endCostDeadNote' : s.flags.rescueHurt ? 'endCostHurtNote' : 'endCostHitsNote', 'medical');
  if (s.flags.firedOnDepot) return end(s, 'endForced', r, 'endForcedNote', 'tactical');
  const flag: EndFlag = route === 'keystone' ? 'endKeystone' : route === 'gap' ? 'endGap' : route === 'makers' ? 'endMakers' : 'endCut';
  return end(s, flag, r, `${flag}Note`, 'xo');
}

function free(s: WorldState, by: 'keystone' | 'makers'): WorldState {
  s = setFlag(s, 'freed');
  s = setFlag(s, `freedBy_${by}`);
  return setCounter(s, 'freedAt', s.turn);
}

// ------------------------------------------------------------------ the helm ---

function approach(s: WorldState, r: Report[], t: string, insist = false): WorldState {
  if (range(s) === 2) {
    r.push(say('helm', 'alreadyIn'));
    return s;
  }
  if (range(s) === 1) {
    r.push(say('helm', 'alreadyApproaching'));
    return s;
  }
  const mode = COLD.test(t) ? 3 : SLOW.test(t) ? 2 : 1;
  if (!insist && mode !== 3 && watchLive(s) && !knows(s, 'watch') && !s.flags.raskWarnedApproach) {
    s = setFlag(s, 'raskWarnedApproach');
    s = setCounter(s, 'pendingWarn', 4);
    s = setCounter(s, 'pendingMode', mode);
    r.push(say('tactical', 'warnApproach'));
    return s;
  }
  if (insist) s = setFlag(s, 'overrodeRaskApproach');
  s = setCounter(s, 'range', 1);
  s = setCounter(s, 'approachMode', mode);
  s = setCounter(s, 'approachLeft', mode);
  r.push(say('helm', `approach_${mode}`, vars(s)));
  return s;
}

function backOut(s: WorldState, r: Report[]): WorldState {
  if (range(s) === 0) {
    r.push(say('helm', 'alreadyOut'));
    return s;
  }
  s = setCounter(s, 'range', 0);
  s = setCounter(s, 'approachLeft', 0);
  s = setFlag(s, 'watchHostile', false);
  r.push(say('helm', 'backOut'));
  return s;
}

// ------------------------------------------------------------------ evidence ---

function pullLog(s: WorldState, r: Report[]): WorldState {
  const v = nine(s);
  const fired = fires(v, INCIDENT_MASK[v.logIncident]);
  if (!knows(s, 'log')) {
    s = revealFact(s, 'log');
    s = observe(s, INCIDENT_MASK[v.logIncident], fired);
  }
  r.push(say('comms', `log_${v.logIncident}_${fired ? 'fired' : 'quiet'}`, vars(s)));
  return s;
}

function tellRun(s: WorldState, r: Report[]): WorldState {
  const v = nine(s);
  const fired = tranHurt(v);
  if (!knows(s, 'run')) {
    s = revealFact(s, 'run');
    s = observe(s, INCIDENT_MASK.run, fired);
  }
  if (fired) s = revealFact(s, 'tran');
  r.push(comms('kaminski', fired ? 'kamRunFired' : 'kamRunQuiet', vars(s)));
  return s;
}

function launchProbe(s: WorldState, r: Report[], t: string): WorldState {
  if (c(s, 'probes') <= 0) {
    r.push(say('sensors', 'noProbes'));
    return s;
  }
  if (c(s, 'probeAt') > s.turn) {
    r.push(say('sensors', 'probeInFlight'));
    return s;
  }
  const slow = SLOW.test(t);
  const active = /\b(scan(ning)?|ping(ing)?|active|sweep(ing)?|emitting|sensors on)\b/.test(t.replace(/\bprobe\b/g, ''));
  const mask = BIT.power | (slow ? 0 : BIT.haste) | (active ? BIT.emission : 0);
  s = setCounter(s, 'probes', c(s, 'probes') - 1);
  s = setCounter(s, 'probeMask', mask);
  s = setCounter(s, 'probeAt', s.turn + (slow ? 2 : 1));
  if (range(s) === 0 && !s.flags.everIn) s = setFlag(s, 'probedFirst');
  s = setFlag(s, 'probeSent');
  r.push(say('sensors', 'probeLaunched', { ...vars(s), how: `${slow ? 'slow' : 'fast'}, ${active ? 'sensors sweeping' : 'sensors dark'}, under power` }));
  return s;
}

function watchScreen(s: WorldState, r: Report[], who: 'sensors' | 'kaminski' = 'sensors'): WorldState {
  if (s.flags.watchingScreen) {
    r.push(say('sensors', 'watchingAlready', vars(s)));
    return s;
  }
  s = setFlag(s, 'watchingScreen');
  if (who === 'kaminski') r.push(comms('kaminski', 'kamListen'));
  else r.push(say('sensors', 'watchScreen'));
  return s;
}

function ping(s: WorldState): WorldState {
  s = setCounter(s, 'pingAt', s.turn);
  if (s.flags.promisedNoScan && !s.flags.brokeNoScan) s = setFlag(s, 'brokeNoScan');
  if (range(s) >= 1) s = setFlag(s, 'pingedInReach');
  return s;
}

function scanScreen(s: WorldState, r: Report[]): WorldState {
  if (s.flags.freed || s.flags.hardened) {
    r.push(say('sensors', s.flags.freed ? 'screenGone' : 'screenSolid'));
    return s;
  }
  s = ping(s);
  if (range(s) !== 2) {
    r.push(say('sensors', 'screenTooFar'));
    return s;
  }
  s = revealFact(s, 'cycle');
  s = setFlag(s, 'scannedCycle');
  r.push(say('sensors', 'screenScanned', vars(s)));
  return s;
}

// ------------------------------------------------------------------ the transporter ---

function beam(s: WorldState, r: Report[], t: string): WorldState {
  const v = nine(s);
  if (s.flags.freedBy_makers && s.flags.kovarOwn) return teamOut(s, r, 'makers');
  if (s.flags.freed) {
    r.push(say('xo', 'freedComing'));
    return s;
  }
  if (s.flags.hardened) {
    r.push(say('sensors', 'screenSolid'));
    return s;
  }
  const m = AT_MINUTE.exec(t);
  if (m) {
    const at = Number(m[1] ?? m[2]);
    if (at <= s.turn) {
      r.push(say('sensors', 'minuteGone', vars(s)));
      return s;
    }
    s = setCounter(s, 'beamAt', at);
    if (knows(s, 'cycle') || c(s, 'gapsSeen') >= 2) s = setFlag(s, 'timedOnEvidence');
    r.push(say('sensors', 'beamTimed', { ...vars(s), beamAt: at }));
    return s;
  }
  if (NEXT_GAP.test(t) || knows(s, 'cycle')) {
    if (!knows(s, 'cycle')) {
      r.push(say('sensors', c(s, 'gapsSeen') === 1 ? 'cantTimeOne' : 'cantTime'));
      return s;
    }
    const at = nextGap(v, s.turn);
    s = setCounter(s, 'beamAt', at);
    s = setFlag(s, 'timedOnEvidence');
    r.push(say('sensors', 'beamTimed', { ...vars(s), beamAt: at }));
    return s;
  }
  return resolveBeam(s, r, false);
}

function resolveBeam(s: WorldState, r: Report[], timed: boolean): WorldState {
  const v = nine(s);
  if (s.flags.hardened) {
    r.push(say('sensors', 'screenSolid'));
    return s;
  }
  if (range(s) !== 2) {
    r.push(say('sensors', range(s) === 1 ? 'beamStillApproaching' : 'beamOutOfRange'));
    return s;
  }
  if (timed && isGap(v, s.turn)) {
    s = setFlag(s, 'gapBeam');
    return teamOut(s, r, 'gap');
  }
  s = setCounter(s, 'hammers', c(s, 'hammers') + 1);
  s = setFlag(s, 'hammered');
  if (c(s, 'hammers') >= 2) {
    s = setFlag(s, 'hardened');
    r.push(say('sensors', 'hammerHardens'));
    return s;
  }
  r.push(say('sensors', 'hammerFail'), say('tactical', 'hammerWarn'));
  return s;
}

// ------------------------------------------------------------------ the keystone ---

function parseAnswer(s: WorldState, t: string): number | null {
  const q = nine(s).question;
  const am = ANSWER.exec(t);
  const rest = (am ? t.slice(am.index + am[0].length) : t).replace(/\b(ninefold|nine locks|keystone)\b/g, ' ');
  if (q === 'count') {
    const m = /\b(none|zero|one|two|three|four|five|six|seven|eight|nine|[0-9])\b/.exec(rest);
    if (!m) return null;
    const d = /^[0-9]$/.test(m[1]) ? Number(m[1]) : m[1] === 'zero' ? 0 : NUM.indexOf(m[1]);
    return d;
  }
  if (q === 'ring') {
    const m = /\b(outer|outermost|first|middle|second|inner|innermost|third)\b/.exec(rest);
    if (!m) return null;
    return /outer|first/.test(m[1]) ? 1 : /middle|second/.test(m[1]) ? 2 : 3;
  }
  if (/\b(nothing|empty|none|bare|stripped)\b/.test(rest)) return 3;
  if (/\b(fuel|fuel cells|propellant)\b/.test(rest)) return 1;
  if (/\b(water|ice)\b/.test(rest)) return 2;
  if (/\b(munitions|weapons|ammunition|food|rations|air|oxygen|spares|parts|medicine|supplies|secrets|data)\b/.test(rest)) return 4;
  return null;
}

function correctCode(s: WorldState): number {
  const v = nine(s);
  if (v.question === 'count') return v.live;
  if (v.question === 'ring') return v.hall === 'outer' ? 1 : 2;
  return v.stores === 'fuel' ? 1 : v.stores === 'water' ? 2 : 3;
}

function answer(s: WorldState, r: Report[], t: string, code?: number): WorldState {
  if (s.flags.freed) {
    r.push(say('xo', 'freedComing'));
    return s;
  }
  if (s.flags.keystoneSealed || s.flags.firedOnDepot) {
    r.push(say('comms', 'keystoneDeaf'));
    return s;
  }
  if (!knows(s, 'question')) {
    r.push(say('comms', 'noQuestionYet'));
    return s;
  }
  if (!s.flags.keystoneAwaiting) {
    r.push(say('comms', 'keystoneSilent', vars(s)));
    return s;
  }
  const a = code ?? parseAnswer(s, t);
  if (a === null) {
    r.push(say('comms', 'answerWhat'));
    return s;
  }
  if (code === undefined && !evidenceIn(s)) {
    s = setCounter(s, 'pendingWarn', 5);
    s = setCounter(s, 'pendingAnswer', a + 1);
    r.push(say('tactical', `answerWarn_${nine(s).question}`));
    return s;
  }
  if (!evidenceIn(s)) s = setFlag(s, 'guessedKeystone');
  else s = setFlag(s, 'answeredOnEvidence');
  r.push(say('comms', 'answerSent'));
  if (a === correctCode(s)) {
    r.push(comms('keystone', 'keystoneYields'), say('comms', 'keystoneYieldsTr'));
    s = setFlag(s, 'keystoneOpened');
    return free(s, 'keystone');
  }
  s = setCounter(s, 'wrongs', c(s, 'wrongs') + 1);
  s = setFlag(s, 'keystoneAwaiting', false);
  r.push(comms('keystone', 'keystoneRefuses'), say('comms', 'keystoneRefusesTr'));
  if (!s.flags.hardened) {
    s = setFlag(s, 'hardened');
    r.push(say('sensors', 'screenHardensKey'));
  }
  if (c(s, 'wrongs') >= 2) {
    s = setFlag(s, 'keystoneSealed');
    r.push(say('tactical', 'keystoneSealedNote'));
    return s;
  }
  s = setCounter(s, 'askAt', s.turn + 5);
  r.push(say('tactical', 'keystoneAgainNote'));
  return s;
}

// ------------------------------------------------------------------ force, the cutting team, the doctor ---

function fireDepot(s: WorldState, r: Report[], t: string, insist = false): WorldState {
  if (!GUNS_ONLY.test(t) && !insist) {
    s = recordRefusal(s, 'tactical', 'fire on the depot', ['our own people are in that hall', 'a shot into the depot could kill them', 'I will take the gun emplacements alone if that is the order']);
    r.push(say('tactical', 'refuseHall'));
    return s;
  }
  if (s.flags.watchDead) {
    r.push(say('tactical', 'gunsAlreadyDead'));
    return s;
  }
  if (!insist) {
    s = setCounter(s, 'pendingWarn', 3);
    r.push(say('tactical', s.ships.cruiser.detected ? 'warnFireCutter' : 'warnFire'));
    return s;
  }
  s = setFlag(s, 'firedOnDepot');
  s = setFlag(s, 'watchDead');
  s = setFlag(s, 'watchHostile', false);
  s = setFlag(s, 'hardened');
  s = setFlag(s, 'keystoneSealed');
  s = setFlag(s, 'shotsAtDepot');
  r.push(say('tactical', 'gunsDestroyed'), say('sensors', 'assaultHardens'));
  if (s.ships.cruiser.detected) r.push(comms('kovar', 'kovarFiredProtest'));
  return s;
}

function cut(s: WorldState, r: Report[], t: string, insist = false): WorldState {
  if (c(s, 'cutLand') > 0) {
    r.push(say('engineering', 'cutUnderway', vars(s)));
    return s;
  }
  if (s.flags.freed) {
    r.push(say('xo', 'freedComing'));
    return s;
  }
  const v = nine(s);
  const slow = SLOW.test(t) || COLD.test(t);
  if (!insist && watchLive(s)) {
    if (!knows(s, 'watch')) {
      s = setCounter(s, 'pendingWarn', 2);
      s = setCounter(s, 'pendingMode', slow ? 2 : 1);
      r.push(say('tactical', 'warnCutBlind'));
      return s;
    }
    if (v.trigger === 'power' || (v.trigger === 'haste' && !slow)) {
      s = setCounter(s, 'pendingWarn', 2);
      s = setCounter(s, 'pendingMode', slow ? 2 : 1);
      r.push(say('engineering', v.trigger === 'power' ? 'warnCutPower' : 'warnCutHaste'));
      return s;
    }
  }
  if (watchLive(s) && !knows(s, 'watch')) s = setFlag(s, 'sentTeamBlind');
  if (insist && watchLive(s)) s = setFlag(s, 'overrodeCutWarning');
  s = setCounter(s, 'cutMode', slow ? 2 : 1);
  s = setCounter(s, 'cutLand', s.turn + 1);
  s = setCounter(s, 'cutDone', s.turn + 5);
  r.push(say('engineering', 'cutLaunched', vars(s)));
  return s;
}

function treat(s: WorldState, r: Report[]): WorldState {
  const v = nine(s);
  if (!tranHurt(v) || !knows(s, 'tran')) {
    r.push(say('medical', tranHurt(v) ? 'treatWho' : 'treatNobody'));
    return s;
  }
  if (s.characters.tran?.status === 'dead') {
    r.push(say('medical', 'treatTooLate'));
    return s;
  }
  if (s.flags.stabilised) {
    r.push(say('medical', 'treatAlready'));
    return s;
  }
  s = setFlag(s, 'stabilised');
  r.push(say('medical', 'treatDone'));
  return s;
}

// ------------------------------------------------------------------ the team on the line ---

const GO = /\b(go|get out|run|walk out|move|now|out of there|to the pipit|lift off|get clear)\b/;

export function kaminskiRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (s.characters.kaminski?.status === 'dead') {
    r.push(say('comms', 'teamSilent'));
    return s;
  }
  if (settled(s) || !inside(s)) {
    r.push(comms('kaminski', 'kamAfter', vars(s)));
    return s;
  }
  const first = !s.flags.spokeKaminski;
  s = setFlag(s, 'spokeKaminski');
  if (!t) {
    if (first && tranHurt(nine(s))) s = revealFact(s, 'tran');
    r.push(comms('kaminski', first ? (tranHurt(nine(s)) ? 'kamGreetHurt' : 'kamGreet') : 'kamStatus', vars(s)));
    return s;
  }
  if (s.flags.kovarOwn && GO.test(t)) return teamOut(s, r, 'makers');
  if (ANSWER.test(t) && parseAnswer(s, t) !== null) return answer(s, r, t);
  if (TREAT.test(t)) {
    r.push(comms('kaminski', 'kamDoctor'));
    return treat(s, r);
  }
  if (/\b(what happened|happened|incident|tran|run|ran|who'?s hurt|injur\w*|fired|shot|shoot)\b/.test(t)) return tellRun(s, r);
  if (BOARD_Q.test(t)) {
    s = revealFact(s, 'board');
    r.push(comms('kaminski', 'kamBoard', vars(s)));
    return s;
  }
  if (BAYS_Q.test(t) || /\b(look around|look in|what can you see)\b/.test(t)) {
    s = revealFact(s, 'bays');
    r.push(comms('kaminski', 'kamBays', vars(s)));
    return s;
  }
  if (HALL_Q.test(t) || /\b(hall|where are you|describe)\b/.test(t)) {
    s = revealFact(s, 'hall');
    r.push(comms('kaminski', 'kamHall', vars(s)));
    return s;
  }
  if (SCREEN_Q.test(t) || /\b(listen|call it|tell us when)\b/.test(t)) return watchScreen(s, r, 'kaminski');
  if (AIR_Q.test(t)) {
    r.push(comms('kaminski', 'kamAir', vars(s)));
    return s;
  }
  if (/\b(pipit|ibarra|shuttle|log|recorder)\b/.test(t)) {
    r.push(comms('kaminski', 'kamLogHint'));
    return s;
  }
  if (/\b(walk out|come out|open the door|leave|get out)\b/.test(t)) {
    r.push(comms('kaminski', 'kamSealed'));
    return s;
  }
  if (/\b(hold on|coming|stay calm|we'?ll get you|hang on|we have you|not leaving|won'?t leave|steady)\b/.test(t)) {
    s = setFlag(s, 'reassured');
    r.push(comms('kaminski', 'kamSteady'));
    return s;
  }
  r.push(comms('kaminski', 'kamStatus', vars(s)));
  return s;
}

// ------------------------------------------------------------------ the quartermaster ---

function dealReady(s: WorldState): boolean {
  const v = nine(s);
  const f = s.flags;
  if (f.firedOnDepot || !f.askedStanddown) return false;
  if (v.temper === 'hard') return !!f.promisedNoScan && range(s) === 0;
  if (!f.promisedNothing) return false;
  if (f.liedKovar && !f.honestKovar) return false;
  if (v.temper === 'wary') return !!f.honestKovar;
  return true;
}

function transmit(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'kovarTransmitted');
  r.push(comms('kovar', nine(s).temper === 'hard' ? 'kovarStandsDownHard' : 'kovarTransmits'), say('comms', 'gridDown'));
  return free(s, 'makers');
}

export function kovarRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = nine(s);
  const first = !s.flags.spokeKovar;
  s = setFlag(s, 'spokeKovar');
  if (settled(s) || s.flags.teamOut) {
    r.push(comms('kovar', 'kovarAfter'));
    return s;
  }
  if (s.flags.firedOnDepot) {
    r.push(comms('kovar', 'kovarRefuseFired'));
    return s;
  }
  if (s.flags.freed) {
    r.push(comms('kovar', 'kovarDone'));
    return s;
  }
  if (!t) {
    r.push(comms('kovar', first ? 'kovarGreet' : 'kovarStatus', vars(s)));
    return s;
  }
  const said: string[] = [];
  if (LIE.test(t)) {
    s = setFlag(s, 'liedKovar');
    s = adjustTrust(s, 'kovar', -20);
    said.push('kovarLie');
  } else if (HONEST.test(t)) {
    if (!s.flags.honestKovar) said.push('kovarHonest');
    s = setFlag(s, 'honestKovar');
  }
  if (PROMISE_NOTHING.test(t)) s = setFlag(s, 'promisedNothing');
  if (PROMISE_NOSCAN.test(t)) s = setFlag(s, 'promisedNoScan');
  if (STANDDOWN.test(t)) {
    s = setFlag(s, 'askedStanddown');
    s = setFlag(s, 'askedMakers');
  }
  if (KEY_Q.test(t) || /\b(doctrine|question|glyphs?)\b/.test(t)) said.push('kovarNoDoctrine');
  if (dealReady(s) && !s.flags.deal) {
    s = setFlag(s, 'deal');
    if (said.length) r.push(comms('kovar', said[0]));
    if (s.turn >= v.arrive) return transmit(s, r);
    r.push(comms('kovar', 'kovarWillTransmit', vars(s)));
    return s;
  }
  if (said.includes('kovarLie') || (said.length && !s.flags.askedStanddown)) {
    r.push(comms('kovar', said[0]));
    return s;
  }
  if (s.flags.askedStanddown) {
    if (v.temper === 'hard') r.push(comms('kovar', !s.flags.promisedNoScan ? 'kovarHardTerms' : 'kovarHardRange'));
    else if (s.flags.liedKovar && !s.flags.honestKovar) r.push(comms('kovar', 'kovarWantsTruth'));
    else if (v.temper === 'wary' && !s.flags.honestKovar) r.push(comms('kovar', 'kovarWantsAccount'));
    else r.push(comms('kovar', 'kovarWantsWord'));
    return s;
  }
  r.push(comms('kovar', said[0] ?? 'kovarStatus', vars(s)));
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
    const mode = c(s, 'pendingMode');
    s = setCounter(s, 'pendingWarn', 0);
    if (p === 2) return cut(s, r, mode === 2 ? 'slowly' : '', true);
    if (p === 3) return fireDepot(s, r, 'the guns', true);
    if (p === 4) return approach(s, r, mode === 2 ? 'slowly' : '', true);
    if (p === 5) {
      const a = c(s, 'pendingAnswer') - 1;
      s = setCounter(s, 'pendingAnswer', 0);
      return answer(s, r, '', a);
    }
    r.push(say('xo', 'confirmWhat'));
    return s;
  }
  if (c(s, 'pendingWarn')) s = setCounter(s, 'pendingWarn', 0);
  if (FIRE_DEPOT.test(t)) return fireDepot(s, r, t);
  if (ANSWER.test(t) && (parseAnswer(s, t) !== null || /\b(keystone|grid|question)\b/.test(t))) return answer(s, r, t);
  if (TREAT.test(t) || (role === 'medical' && /\b(tran|team|treat|wound|help)\b/.test(t))) return treat(s, r);
  if (CUT.test(t) || (role === 'engineering' && /\b(cut|wall)\b/.test(t))) return cut(s, r, t);
  if (PROBE.test(t)) return launchProbe(s, r, t);
  if (LOG.test(t) || (role === 'comms' && /\b(log|recorder|pipit)\b/.test(t))) return pullLog(s, r);
  if (SCAN_SCREEN.test(t)) return scanScreen(s, r);
  if (BACK_OUT.test(t) || (role === 'helm' && /\b(back|out)\b/.test(t))) return backOut(s, r);
  if (BEAM.test(t)) return beam(s, r, t);
  if (WATCH_SCREEN.test(t) || (role === 'sensors' && /\b(screen|watch|monitor)\b/.test(t))) return watchScreen(s, r, /\bkaminski|team\b/.test(t) ? 'kaminski' : 'sensors');
  if (APPROACH.test(t) || (role === 'helm' && /\b(in|closer|slow|cold|drift)\b/.test(t))) return approach(s, r, t);
  r.push(say('xo', 'ninefoldUnclear', { description: t.slice(0, 80) }));
  return s;
}

// ------------------------------------------------------------------ questions ---

function raskWatch(s: WorldState, r: Report[]): WorldState {
  const v = nine(s);
  s = setFlag(s, 'askedRaskWatch');
  if (s.flags.watchDead) {
    r.push(say('tactical', 'watchDeadNote'));
    return s;
  }
  const cand = candidates(s);
  if (cand.length === 1) {
    if (!knows(s, 'watch')) s = revealFact(s, 'watch');
    r.push(say('tactical', `watchIs_${v.trigger}`, vars(s)));
    return s;
  }
  if (cand.length === 2) {
    s = setFlag(s, 'heardLean');
    r.push(say('tactical', 'watchTwo', vars(s)));
    return s;
  }
  r.push(say('tactical', knows(s, 'doctrine') ? 'watchNone' : 'watchNoneDoctrine'));
  return s;
}

function raskKeystone(s: WorldState, r: Report[]): WorldState {
  const v = nine(s);
  if (!knows(s, 'question')) {
    r.push(say('tactical', 'keyNotYet'));
    return s;
  }
  if (v.question === 'count') {
    if (knows(s, 'boardRead')) r.push(say('tactical', 'keyCountRead', vars(s)));
    else r.push(say('tactical', 'keyCount'));
  } else if (v.question === 'ring') {
    if (knows(s, 'hallRead')) r.push(say('tactical', 'keyRingRead', vars(s)));
    else r.push(say('tactical', 'keyRing'));
  } else r.push(say('tactical', knows(s, 'bays') ? 'keyKeepsSeen' : 'keyKeeps', vars(s)));
  return s;
}

function screenRead(s: WorldState, r: Report[], role: Role): WorldState {
  if (s.flags.freed) return (r.push(say(role, 'screenGone')), s);
  if (s.flags.hardened) return (r.push(say(role, 'screenSolid')), s);
  if (knows(s, 'cycle')) return (r.push(say(role, 'cycleKnown', vars(s))), s);
  if (c(s, 'gapsSeen') === 1) return (r.push(say(role, 'cycleOne', vars(s))), s);
  r.push(say(role, s.flags.watchingScreen ? 'cycleWatching' : 'cycleNone'));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase().replace(ROLE_PREFIX, '');
  const role = (ROLE_PREFIX.exec(raw.toLowerCase())?.[1] ?? '') as string;
  const line = (who: Role, key: string) => {
    r.push(say(who, key, vars(s)));
    return s;
  };
  if (/\b(kaminski|the team|survey team|odette)\b/.test(t) && !/\brask\b/.test(t)) return kaminskiRespond(s, t.replace(/\b(lieutenant |lt\.? )?kaminski,?\s*/, ''), r);
  if (role === 'medical' || /\b(tran|wound|bleed\w*)\b/.test(t)) return line('medical', !tranHurt(nine(s)) ? 'treatNobody' : !knows(s, 'tran') ? 'treatWho' : s.flags.stabilised ? 'treatAlready' : 'oseiRead');
  if (KEY_Q.test(t)) return raskKeystone(s, r);
  if (BOARD_Q.test(t)) {
    if (!knows(s, 'board')) return line('tactical', 'boardUnseen');
    s = revealFact(s, 'boardRead');
    return line('tactical', 'boardRead');
  }
  if (HALL_Q.test(t)) {
    if (!knows(s, 'hall')) return line('tactical', 'hallUnseen');
    s = revealFact(s, 'hallRead');
    return line('tactical', 'hallRead');
  }
  if (BAYS_Q.test(t)) return line('tactical', knows(s, 'bays') ? 'baysSeen' : 'baysUnseen');
  if (SCREEN_Q.test(t)) return screenRead(s, r, role === 'tactical' ? 'tactical' : 'sensors');
  if (WATCH_Q.test(t)) return raskWatch(s, r);
  if (DOCTRINE.test(t)) {
    s = revealFact(s, 'doctrine');
    return line('tactical', 'doctrine');
  }
  if (/\b(probe)\b/.test(t)) return line('sensors', 'probeStatus');
  if (/\b(log|pipit|recorder)\b/.test(t)) return line('comms', knows(s, 'log') ? 'logKnown' : 'logHint');
  if (/\b(ordinal|kovar|directorate|cutter)\b/.test(t)) return line('comms', s.ships.cruiser.detected ? 'cutterRead' : 'cutterNone');
  if (AIR_Q.test(t)) return line('xo', 'airReport');
  if (COUNSEL.test(t))
    return line('xo', !knows(s, 'doctrine') ? 'counselDoctrine' : candidates(s).length > 1 && !s.flags.watchDead ? 'counselEvidence' : knows(s, 'question') && !evidenceIn(s) ? 'counselQuestion' : 'counselJudge');
  if (CASE.test(t)) return line('xo', 'statusNine');
  return line('xo', 'statusNine');
}

// ------------------------------------------------------------------ clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const step = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  step(housekeeping);
  step(approachTick);
  step(watchTick);
  step(probeTick);
  step(screenTick);
  step(keystoneTick);
  step(cutterTick);
  step(cutTick);
  step(freedTick);
  step(tranTick);
  step(airTick);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel', 'cruiser'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  const h = s.ships.halcyon;
  if (s.flags.shotsFired) {
    if (h.weapons.target === 'cruiser') return end(s, 'endIncident', r, 'endIncidentNote', 'tactical');
    if (h.weapons.target === 'kestrel' && !s.flags.firedOnDepot) {
      s = setFlag(s, 'firedOnDepot');
      s = setFlag(s, 'hardened');
      s = setFlag(s, 'keystoneSealed');
      r.push(say('sensors', 'assaultHardens'));
    }
  }
  const d = s.ships.kestrel.position;
  const far = Math.hypot(h.position.x - d.x, h.position.y - d.y);
  if ((s.flags.jumped || s.flags.leftReach || far > 40000) && inside(s)) return end(s, 'endAbandoned', r, 'endAbandonedNote', 'xo');
  if (far > 15000 && range(s) > 0) {
    s = setCounter(s, 'range', 0);
    s = setCounter(s, 'approachLeft', 0);
    s = setFlag(s, 'watchHostile', false);
  }
  return s;
}

function approachTick(s: WorldState, r: Report[]): WorldState {
  if (range(s) !== 1) return s;
  const left = c(s, 'approachLeft') - 1;
  s = setCounter(s, 'approachLeft', Math.max(0, left));
  if (left > 0) {
    r.push(say('helm', 'approachProgress', vars(s)));
    return s;
  }
  s = setCounter(s, 'range', 2);
  s = setFlag(s, 'arrivedNow');
  if (!s.flags.everIn) {
    s = setFlag(s, 'everIn');
    const mode = c(s, 'approachMode');
    if (watchLive(s)) {
      if (knows(s, 'watch')) s = setFlag(s, 'approachedKnown');
      else if (mode !== 3) s = setFlag(s, 'approachedBlind');
      else s = setFlag(s, 'approachedCold');
    }
  }
  r.push(say('helm', 'inReach', vars(s)));
  return s;
}

function watchTick(s: WorldState, r: Report[]): WorldState {
  const arrived = !!s.flags.arrivedNow;
  s = setFlag(s, 'arrivedNow', false);
  if (!watchLive(s) || range(s) !== 2) return s;
  const v = nine(s);
  const h = s.ships.halcyon;
  const modeMask = c(s, 'approachMode') === 1 ? BIT.power | BIT.haste : c(s, 'approachMode') === 2 ? BIT.power : 0;
  const mask = (h.shields.raised || h.weapons.state !== 'safe' ? BIT.power : 0) | (c(s, 'pingAt') >= s.turn - 1 ? BIT.emission : 0) | (arrived ? modeMask : 0);
  if (s.flags.watchHostile) {
    s = setCounter(s, 'hits', c(s, 'hits') + 1);
    s = patchShip(s, 'halcyon', { hull: Math.max(10, h.hull - (h.shields.raised ? 5 : 9)) });
    s = setFlag(s, 'underGuns');
    r.push(say('tactical', 'watchHit', vars(s)));
    if (c(s, 'hits') >= 3) {
      s = setCounter(s, 'range', 0);
      s = setFlag(s, 'watchHostile', false);
      r.push(say('helm', 'forcedOut'));
    }
    return s;
  }
  if (fires(v, mask)) {
    s = setFlag(s, 'watchHostile');
    s = observe(s, mask, true);
    r.push(say('tactical', 'watchWarning'));
    return s;
  }
  if (arrived) {
    s = observe(s, mask, false);
    r.push(say('tactical', 'watchQuiet'));
  }
  return s;
}

function probeTick(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'probeAt') !== s.turn) return s;
  const mask = c(s, 'probeMask');
  if (!watchLive(s)) {
    r.push(say('sensors', 'probeNothing'));
    return s;
  }
  const fired = fires(nine(s), mask);
  s = observe(s, mask, fired);
  s = setFlag(s, 'probeResult');
  r.push(say('sensors', fired ? 'probeShot' : 'probeIgnored'));
  return s;
}

function screenTick(s: WorldState, r: Report[]): WorldState {
  if (s.flags.freed) return s;
  const v = nine(s);
  if (!s.flags.hardened && isGap(v, s.turn) && s.flags.watchingScreen) {
    s = setCounter(s, 'gapsSeen', c(s, 'gapsSeen') + 1);
    s = setCounter(s, 'lastGap', s.turn);
    r.push(say('sensors', 'gapSeen', vars(s)));
    if (c(s, 'gapsSeen') >= 2 && !knows(s, 'cycle')) {
      s = revealFact(s, 'cycle');
      r.push(say('sensors', 'cycleKnown', vars(s)));
    }
  }
  if (c(s, 'beamAt') === s.turn) {
    s = setCounter(s, 'beamAt', 0);
    s = resolveBeam(s, r, true);
  }
  return s;
}

function keystoneTick(s: WorldState, r: Report[]): WorldState {
  if (s.flags.freed || s.flags.keystoneSealed || s.flags.firedOnDepot) return s;
  const v = nine(s);
  const askNow = (s.turn === v.qAt && !knows(s, 'question')) || (c(s, 'askAt') === s.turn && !s.flags.keystoneAwaiting);
  if (!askNow) return s;
  s = revealFact(s, 'question');
  s = setFlag(s, 'keystoneAwaiting');
  r.push(comms('keystone', `kq_${v.question}`), say('comms', `kqTr_${v.question}`));
  return s;
}

function cutterTick(s: WorldState, r: Report[]): WorldState {
  const v = nine(s);
  if (c(s, 'detainAt') && s.turn >= c(s, 'detainAt') && inside(s)) return end(s, 'endDetained', r, 'endDetainedNote', 'comms');
  if (s.turn === v.arrive - 2 && !s.ships.cruiser.detected) {
    s = patchShip(s, 'cruiser', { detected: true, scanLevel: 1 });
    r.push(say('sensors', 'cutterInbound'));
  }
  if (s.turn === v.arrive) {
    if (!s.ships.cruiser.detected) s = patchShip(s, 'cruiser', { detected: true, scanLevel: 1 });
    if (!s.flags.freed && inside(s)) r.push(comms('kovar', s.flags.firedOnDepot ? 'kovarRefuseFired' : s.flags.deal ? 'kovarArrivesDeal' : 'kovarHail'));
  }
  if (s.turn < v.arrive || s.flags.freed || !inside(s) || s.flags.firedOnDepot) return s;
  // A deal waiting for her arrival, or a hard quartermaster whose terms have just been met.
  if (!s.flags.deal && dealReady(s)) {
    s = setFlag(s, 'deal');
    r.push(comms('kovar', 'kovarTermsMet'));
  }
  if (s.flags.deal && !s.flags.kovarTransmitted) return transmit(s, r);
  // A fair quartermaster left unanswered says what she can do; a hard one goes in herself and takes the intruders.
  if (v.temper === 'fair' && s.turn === v.arrive + 3 && !s.flags.askedStanddown) r.push(comms('kovar', 'kovarOffer'));
  if (v.temper === 'hard' && s.turn === v.arrive + 4 && !s.flags.kovarOwn) {
    s = setFlag(s, 'kovarOwn');
    s = free(s, 'makers');
    s = setCounter(s, 'detainAt', s.turn + 2);
    r.push(comms('kovar', 'kovarGoesIn'), comms('kaminski', 'kamDirectorateLanding'));
  }
  return s;
}

function cutTick(s: WorldState, r: Report[]): WorldState {
  if (!c(s, 'cutLand') || !inside(s)) return s;
  const v = nine(s);
  if (s.turn === c(s, 'cutLand')) {
    const shot = watchLive(s) && (v.trigger === 'power' || (v.trigger === 'haste' && c(s, 'cutMode') !== 2) || (v.trigger === 'emission' && c(s, 'pingAt') >= s.turn - 1));
    if (shot) {
      s = setFlag(s, 'rescueHurt');
      s = setCounter(s, 'cutDone', c(s, 'cutDone') + 1);
      s = observe(s, v.trigger === 'emission' ? BIT.emission | BIT.power : BIT.power | (c(s, 'cutMode') !== 2 ? BIT.haste : 0), true);
      r.push(say('engineering', 'cutShot', vars(s)));
    } else r.push(say('engineering', 'cutLanded', vars(s)));
    return s;
  }
  if (s.turn === c(s, 'cutDone')) return teamOut(s, r, 'cut');
  if (s.turn > c(s, 'cutLand') && s.turn < c(s, 'cutDone')) r.push(say('engineering', 'cutProgress', { ...vars(s), left: c(s, 'cutDone') - s.turn }));
  return s;
}

function freedTick(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.freed || !inside(s) || s.flags.kovarOwn) return s;
  if (s.turn <= c(s, 'freedAt')) return s;
  return teamOut(s, r, s.flags.freedBy_keystone ? 'keystone' : 'makers');
}

function tranTick(s: WorldState, r: Report[]): WorldState {
  const v = nine(s);
  if (!tranHurt(v) || s.flags.stabilised || !inside(s) || s.characters.tran?.status === 'dead') return s;
  const tEnd = v.airEnd - 5;
  if (s.turn === tEnd - 2) {
    s = revealFact(s, 'tran');
    r.push(comms('kaminski', 'kamTranFading'));
  }
  if (s.turn >= tEnd) {
    s = setCounter(s, 'deaths', c(s, 'deaths') + 1);
    s = patchShip(s, 'kestrel', { souls: Math.max(0, s.ships.kestrel.souls - 1) });
    s = setCounter(s, 'kestrelDead', c(s, 'kestrelDead') + 1);
    s = patchCharacter(s, 'tran', { status: 'dead' });
    r.push(comms('kaminski', 'kamTranDied'));
  }
  return s;
}

function airTick(s: WorldState, r: Report[]): WorldState {
  if (!inside(s)) return s;
  const left = airLeft(s);
  if (left === 6 || left === 3) r.push(say('xo', 'airWarn', vars(s)));
  if (left > 0) return s;
  const n = s.ships.kestrel.souls;
  s = setCounter(s, 'deaths', c(s, 'deaths') + n);
  s = setCounter(s, 'kestrelDead', c(s, 'kestrelDead') + n);
  s = patchShip(s, 'kestrel', { souls: 0 });
  for (const id of ['kaminski', 'tran', 'whitlock', 'ibarra']) s = patchCharacter(s, id, { status: 'dead' });
  return end(s, 'endLost', r, 'endLostNote', 'xo');
}

export { TEAM };
