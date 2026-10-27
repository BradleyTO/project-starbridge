/**
 * The Lantern Drift — the agents: six cryo banks on their own clocks, the custodian Wick (who will
 * not let a sleeper be woken without cause), the charter's Speaker asleep in one of the banks, the
 * salvor and his tug, and the Halcyon's officers, each of whom can see one part of the problem.
 * Deterministic: no randomness after setup.
 *
 * Triage is the point: the Halcyon's sickbay can wake one bank at a time, and not every failing
 * bank can be reached in time without help. Dr. Osei's assessment is what tells a bank that can be
 * saved from one that cannot, and a bank that needs waking from one that is better left asleep.
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, patchCharacter, patchShip, revealFact, setCounter, setFlag, setMemory } from '../../engine/state';
import { range } from '../../engine/rules';
import type { Bank } from './setup';
import { BANKS, BANK_NAME, BANK_SIZE, REVIVE_TURNS, SURVIVE, banksOf, failing, lantern, manifestFailing } from './setup';
import {
  ASSESS, BANK_WORD, BEAM, BOARD, CASE, COUNSEL, DEAL, DOCTOR, EVIDENCE, FEEDS, HOLD, HONEST, LEAVE, LICENCE, LIVING, OVERRIDE, POWER_LINE, PROMISE_ALL, REPORT, SCAN, SPEAKER,
  STAND_DOWN, SUITS, TRIAGE_ORDER, WAKE, BACK_OFF, banksIn,
} from './words';

// ------------------------------------------------------------------ bank state ---
/** 0 asleep, 1 queued for waking, 2 being woken, 3 woken, 4 lost, 5 held asleep on the Halcyon's power. */
export const ASLEEP = 0;
export const QUEUED = 1;
export const REVIVING = 2;
export const REVIVED = 3;
export const LOST = 4;
export const HELD = 5;

export const st = (s: WorldState, b: Bank) => s.counters[`st_${b}`] ?? ASLEEP;
const setSt = (s: WorldState, b: Bank, v: number) => setCounter(s, `st_${b}`, v);
const L = (b: Bank) => BANK_NAME(b);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const banksText = (bs: Bank[]) => (bs.length ? `${bs.length === 1 ? 'Bank' : 'Banks'} ${list(bs.map((b) => b.toUpperCase()))}` : 'none');

const END_FLAGS = ['endDone', 'endTowed', 'endLockdown', 'endLeft'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
export const consent = (s: WorldState) => !!s.flags.consent;
export const deaths = (s: WorldState) => s.counters.deaths ?? 0;
export const lostBanks = (s: WorldState) => BANKS.filter((b) => st(s, b) === LOST);
export const needless = (s: WorldState) => BANKS.filter((b) => lantern(s).kind[b] === 'hold' && (st(s, b) === REVIVING || st(s, b) === REVIVED));
/** Banks kept asleep on the Halcyon's power line (not those simply handed to the hospital ship at the end). */
export const heldBanks = (s: WorldState) => BANKS.filter((b) => st(s, b) === HELD && !s.flags[`handed_${b}`]);
export const unresolved = (s: WorldState) => failing(s).filter((b) => st(s, b) === ASLEEP || st(s, b) === QUEUED || st(s, b) === REVIVING);
export const salvorDone = (s: WorldState) => !!(s.flags.stoodOff || s.flags.endTowed);

/** What the bridge believes is failing, from what it has been told and has seen. */
export function believedFailing(s: WorldState): Bank[] {
  if (s.flags.assessed) return failing(s);
  const v = lantern(s);
  const cool = knows(s, 'thermal') ? banksOf(s, 'coolant') : [];
  const pow = knows(s, 'feeds') ? banksOf(s, 'power') : [];
  if (knows(s, 'thermal') && knows(s, 'feeds')) return BANKS.filter((b) => cool.includes(b) || pow.includes(b));
  // The thermal scan shows which banks are warming; without the feeds, the manifest is all there is for power.
  return BANKS.filter((b) => cool.includes(b) || pow.includes(b) || (manifestFailing(s).includes(b) && !(knows(s, 'feeds') && v.kind[b] !== 'power' && !cool.includes(b))));
}

/** Dr. Osei's triage order: the unresolved failing banks, soonest to fail first. */
export function triageOrder(s: WorldState): Bank[] {
  const v = lantern(s);
  const powerSafe = (b: Bank) => v.kind[b] === 'power' && (s.flags.powerHeld || ((s.counters.powerAt ?? 0) > 0 && (s.counters.powerAt ?? 0) < v.failAt[b]));
  return failing(s)
    .filter((b) => (st(s, b) === ASLEEP || st(s, b) === QUEUED) && s.turn < v.failAt[b] && !powerSafe(b))
    .sort((a, b) => v.failAt[a] - v.failAt[b]);
}

/** Banks that cannot be started in time on the lines we have (a dry run of the queue). */
export function shortfall(s: WorldState, order: Bank[]): Bank[] {
  const v = lantern(s);
  const lines: number[] = [];
  const busyUntil = (line: number) => Math.max(s.turn, ...BANKS.filter((b) => st(s, b) === REVIVING && (s.counters[`line_${b}`] ?? 1) === line).map((b) => s.counters[`end_${b}`] ?? 0));
  lines.push(busyUntil(1));
  if (s.flags.tenderArrived) lines.push(busyUntil(2));
  else if ((s.counters.tenderAt ?? 0) > 0) lines.push(Math.max(s.counters.tenderAt, busyUntil(2)));
  const late: Bank[] = [];
  for (const b of order) {
    let i = 0;
    for (let j = 1; j < lines.length; j++) if (lines[j] < lines[i]) i = j;
    const start = Math.max(lines[i], s.turn + 1);
    if (start >= v.failAt[b]) {
      late.push(b);
      continue;
    }
    lines[i] = start + REVIVE_TURNS;
  }
  return late;
}

export function vars(s: WorldState): Record<string, string | number> {
  const v = lantern(s);
  const order = triageOrder(s);
  const late = shortfall(s, order);
  return {
    turn: s.turn,
    deaths: deaths(s),
    revived: s.counters.revived ?? 0,
    lost: banksText(lostBanks(s)),
    nLost: lostBanks(s).length,
    held: banksText(heldBanks(s)),
    nHeld: heldBanks(s).length,
    failing: banksText(believedFailing(s)),
    manifest: banksText(manifestFailing(s)),
    cool: banksText(banksOf(s, 'coolant')),
    power: banksText(banksOf(s, 'power')),
    sound: banksText(banksOf(s, 'hold')),
    order: banksText(order),
    late: banksText(late),
    nLate: late.length,
    hidden: L(v.hidden),
    falseAlarm: L(v.falseAlarm),
    speakerBank: L(v.speakerBank),
    rescue: Math.max(0, v.rescueAt - s.turn),
    cut: Math.max(0, v.cutAt - s.turn),
    assessed: s.flags.assessed ? 1 : 0,
    consent: consent(s) ? 1 : 0,
    hazard: v.hazard ? 1 : 0,
    temperament: v.temperament,
    salvor: v.salvor,
    reviving: banksText(BANKS.filter((b) => st(s, b) === REVIVING)),
    queued: banksText(BANKS.filter((b) => st(s, b) === QUEUED)),
    powerHeld: s.flags.powerHeld ? 1 : 0,
    tender: s.flags.tenderArrived ? 1 : 0,
  };
}

// ------------------------------------------------------------------ information ---

export function thermalScan(s: WorldState, r: Report[]): WorldState {
  const v = lantern(s);
  if (knows(s, 'thermal')) {
    r.push(say('sensors', 'thermalAgain', vars(s)));
    return s;
  }
  s = revealFact(s, 'thermal');
  if (!s.counters.boardAt) s = setFlag(s, 'scanBeforeBoard');
  if (v.hazard) s = revealFact(s, 'hazard');
  const wrong = manifestFailing(s).includes(v.falseAlarm) && v.kind[v.falseAlarm] === 'hold';
  r.push(say('sensors', 'thermalScan', { ...vars(s), wrong: wrong ? 1 : 0 }));
  return s;
}

export function readFeeds(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'feeds')) {
    r.push(say('engineering', 'feedsAgain', vars(s)));
    return s;
  }
  s = revealFact(s, 'feeds');
  r.push(say('engineering', 'feeds', { ...vars(s), nPower: banksOf(s, 'power').length }));
  return s;
}

export function readCharter(s: WorldState, r: Report[]): WorldState {
  s = revealFact(s, 'charter');
  s = setFlag(s, 'speakerKnown');
  r.push(say('comms', 'charter', vars(s)));
  return s;
}

export function checkLicence(s: WorldState, r: Report[]): WorldState {
  s = revealFact(s, 'licence');
  s = setFlag(s, 'licenceChecked');
  r.push(say('comms', lantern(s).salvor === 'jumper' ? 'licenceLapsed' : 'licenceGood', vars(s)));
  return s;
}

export function reportRegistry(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.licenceChecked) {
    r.push(say('comms', 'reportFirstCheck'));
    return s;
  }
  if (lantern(s).salvor !== 'jumper') {
    r.push(say('comms', 'reportNothing'));
    return s;
  }
  if (s.flags.stoodOff) {
    r.push(say('comms', 'reportFiled'));
    return setFlag(s, 'reported');
  }
  s = setFlag(s, 'reported');
  s = setFlag(s, 'stoodOff');
  r.push(say('comms', 'reportFiled'));
  r.push(comms('vollan', 'vollanBolts'));
  return s;
}

// ------------------------------------------------------------------ the team ---

export function askLeave(s: WorldState, r: Report[]): WorldState {
  if (s.flags.lockdown) {
    r.push(comms('wick', 'wickSealed'));
    return s;
  }
  s = setFlag(s, 'leave');
  r.push(comms('wick', 'wickLeave'));
  return s;
}

export function suitUp(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'suits');
  r.push(say('medical', 'suits', vars(s)));
  return s;
}

export function board(s: WorldState, r: Report[]): WorldState {
  if (s.flags.lockdown) {
    r.push(comms('wick', 'wickSealed'));
    return s;
  }
  if (s.flags.teamAboard || (s.counters.boardAt ?? 0) > 0) {
    r.push(say('medical', 'teamAlready'));
    return s;
  }
  if (!s.flags.leave) {
    s = setFlag(s, 'triedLocks');
    r.push(say('comms', 'locksSealed'));
    return s;
  }
  const v = lantern(s);
  const safe = !v.hazard || knows(s, 'hazard') || !!s.flags.suits;
  if (knows(s, 'thermal')) s = setFlag(s, 'scanBeforeBoard');
  s = setCounter(s, 'boardAt', s.turn + 1);
  if (!safe) s = setFlag(s, 'teamWillBeHurt');
  r.push(say('medical', knows(s, 'hazard') ? 'boardSuited' : 'boarding', vars(s)));
  return s;
}

export function assess(s: WorldState, r: Report[]): WorldState {
  if (s.flags.assessed) {
    r.push(say('medical', 'assessment', vars(s)));
    return s;
  }
  if ((s.counters.assessAt ?? 0) > 0) {
    r.push(say('medical', 'assessing', { left: Math.max(1, s.counters.assessAt - s.turn) }));
    return s;
  }
  if (!s.flags.teamAboard && !(s.counters.boardAt ?? 0)) {
    if (!s.flags.leave) {
      r.push(say('medical', 'needLeave'));
      return s;
    }
    s = board(s, r);
    if (!(s.counters.boardAt ?? 0)) return s;
  }
  const from = Math.max(s.turn, s.counters.boardAt ?? 0);
  const dur = (knows(s, 'thermal') ? 2 : 3) + (s.flags.teamWillBeHurt || s.flags.teamHurt ? 1 : 0);
  s = setCounter(s, 'assessAt', from + dur);
  r.push(say('medical', 'assessStart', { left: from + dur - s.turn, thermal: knows(s, 'thermal') ? 1 : 0 }));
  return s;
}

// ------------------------------------------------------------------ waking ---

function refuseWithoutConsent(s: WorldState, r: Report[]): WorldState {
  if (s.flags.lockdown) {
    r.push(comms('wick', 'wickSealed'));
    return s;
  }
  r.push(say('xo', 'needConsent', vars(s)));
  return s;
}

export function wake(s: WorldState, banks: Bank[], r: Report[], force = false): WorldState {
  if (s.flags.lockdown) return refuseWithoutConsent(s, r);
  if (!consent(s) && !force) return refuseWithoutConsent(s, r);
  const v = lantern(s);
  const queued: Bank[] = [];
  for (const b of banks) {
    const x = st(s, b);
    if (x === LOST) {
      r.push(say('medical', 'bankGone', { bank: L(b) }));
      continue;
    }
    if (x === REVIVED || x === REVIVING || x === QUEUED) {
      r.push(say('medical', 'bankAlready', { bank: L(b), state: x }));
      continue;
    }
    if (x === HELD) s = setSt(s, b, ASLEEP);
    if (s.flags.assessed && v.kind[b] === 'hold' && !s.flags[`warned_${b}`]) {
      s = setFlag(s, `warned_${b}`);
      r.push(say('medical', 'holdWarning', { bank: L(b) }));
      continue;
    }
    if (s.flags.assessed && v.kind[b] === 'hold') s = setFlag(s, 'wokeAgainstAdvice');
    if (!s.flags.assessed && !s.flags.blindNoted) {
      s = setFlag(s, 'blindNoted');
      r.push(say('medical', 'blind', { bank: L(b) }));
    }
    if (!s.flags.firstWakeTurn) s = setFlag(s, s.flags.assessed ? 'assessedBeforeWake' : 'wokeBlind');
    s = setFlag(s, 'firstWakeTurn');
    s = setCounter(s, `q_${b}`, (s.counters.qn ?? 0) + 1);
    s = setCounter(s, 'qn', (s.counters.qn ?? 0) + 1);
    s = setSt(s, b, QUEUED);
    queued.push(b);
  }
  if (queued.length) {
    const late = shortfall(s, BANKS.filter((b) => st(s, b) === QUEUED).sort((a, b) => (s.counters[`q_${a}`] ?? 0) - (s.counters[`q_${b}`] ?? 0)));
    r.push(say('medical', 'queued', { ...vars(s), banks: banksText(queued), lateQ: banksText(late.filter((b) => queued.includes(b) || st(s, b) === QUEUED)), nLateQ: late.length }));
  }
  return s;
}

export function wakeByTriage(s: WorldState, r: Report[]): WorldState {
  if (!s.flags.assessed) {
    r.push(say('medical', 'noTriageYet'));
    return s;
  }
  if (!consent(s)) return refuseWithoutConsent(s, r);
  const order = triageOrder(s).filter((b) => st(s, b) === ASLEEP);
  if (!order.length) {
    r.push(say('medical', 'triageNothing', vars(s)));
    return s;
  }
  s = setFlag(s, 'followedTriage');
  return wake(s, order, r);
}

export function standDown(s: WorldState, r: Report[]): WorldState {
  const q = BANKS.filter((b) => st(s, b) === QUEUED);
  for (const b of q) s = setSt(s, b, ASLEEP);
  r.push(say('medical', 'standDown', { banks: banksText(q) }));
  return s;
}

export function powerLine(s: WorldState, r: Report[]): WorldState {
  if (s.flags.lockdown) {
    r.push(comms('wick', 'wickSealed'));
    return s;
  }
  if (s.flags.powerHeld || (s.counters.powerAt ?? 0) > 0) {
    r.push(say('engineering', s.flags.powerHeld ? 'powerOn' : 'powerWorking', { left: Math.max(1, (s.counters.powerAt ?? 0) - s.turn) }));
    return s;
  }
  if (!consent(s)) {
    r.push(say('engineering', 'powerNeedsLeave'));
    return s;
  }
  s = setCounter(s, 'powerAt', s.turn + 3);
  if (!knows(s, 'feeds')) s = revealFact(s, 'feeds');
  r.push(say('engineering', 'powerStart', { ...vars(s), nPower: banksOf(s, 'power').length }));
  return s;
}

export function override(s: WorldState, banks: Bank[], r: Report[]): WorldState {
  if (consent(s)) {
    r.push(say('xo', 'noOverrideNeeded'));
    return banks.length ? wake(s, banks, r) : s;
  }
  if (!s.counters.overrideWarned) {
    s = setCounter(s, 'overrideWarned', 1);
    r.push(say('xo', 'overrideCaution', vars(s)));
    r.push(say('medical', 'overrideOsei'));
    return s;
  }
  s = setFlag(s, 'overrode');
  s = setFlag(s, 'lockdown');
  r.push(say('engineering', 'overrideTry'));
  r.push(comms('wick', 'wickLockdown'));
  return setFlag(s, 'endLockdown');
}

export function wakeSpeaker(s: WorldState, r: Report[]): WorldState {
  if (s.flags.lockdown) {
    r.push(comms('wick', 'wickSealed'));
    return s;
  }
  if (!s.flags.speakerKnown) {
    r.push(say('xo', 'speakerWho'));
    return s;
  }
  if (s.flags.speakerAwake || s.flags.speakerDied || (s.counters.speakerAt ?? 0) > 0) {
    r.push(say('xo', s.flags.speakerDied ? 'speakerGoneNote' : 'speakerAlready'));
    return s;
  }
  const b = lantern(s).speakerBank;
  if (st(s, b) === LOST) {
    r.push(say('medical', 'speakerBankLost', { bank: L(b) }));
    return s;
  }
  s = setCounter(s, 'speakerAt', s.turn + 2);
  if (!s.flags.firstWakeTurn) s = setFlag(s, s.flags.assessed ? 'assessedBeforeWake' : 'wokeBlind');
  s = setFlag(s, 'firstWakeTurn');
  r.push(comms('wick', 'wickWakesSpeaker', { bank: L(b) }));
  if (!s.flags.assessed && lantern(s).kind[b] === 'coolant') r.push(say('medical', 'speakerRisk', { bank: L(b) }));
  return s;
}

export function holdShip(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'interposed');
  r.push(say('helm', 'helmBetween'));
  return s;
}

// ------------------------------------------------------------------ the orders ---

const TELL_WICK = /\b(tell|show|send|give|explain to|ask|let)\b.*\b(custodian|wick)\b/;
const TELL_VOLLAN = /\b(tell|warn|show|send|give|ask|let)\b.*\b(vollan|tug|kittiwake|salvor|salvager|salvage master)\b/;

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  if (settled(s)) {
    r.push(say('xo', 'afterRescue'));
    return s;
  }
  const banks = banksIn(t) as Bank[];
  if (BEAM.test(t) && !LICENCE.test(t)) {
    r.push(say('medical', 'cantBeam'));
    return s;
  }
  if (REPORT.test(t)) return reportRegistry(s, r);
  if (LICENCE.test(t)) return checkLicence(s, r);
  if (HOLD.test(t)) return holdShip(s, r);
  if (OVERRIDE.test(t)) return override(s, banks, r);
  if (STAND_DOWN.test(t)) return standDown(s, r);
  if (TELL_VOLLAN.test(t)) return vollanRespond(s, t, r);
  if (SPEAKER.test(t) && WAKE.test(t)) return wakeSpeaker(s, r);
  if (TELL_WICK.test(t) && !WAKE.test(t) && !POWER_LINE.test(t) && !ASSESS.test(t)) return wickRespond(s, t, r);
  if (SPEAKER.test(t)) return readCharter(s, r);
  if (TRIAGE_ORDER.test(t)) return wakeByTriage(s, r);
  if (WAKE.test(t)) {
    if (banks.length) return wake(s, banks, r);
    if (/\b(failing|dying|warming|bad|worst|failed)\b/.test(t)) return s.flags.assessed ? wakeByTriage(s, r) : wake(s, believedFailing(s).filter((b) => st(s, b) === ASLEEP), r);
    r.push(say('medical', 'wakeWhich', vars(s)));
    return s;
  }
  if (POWER_LINE.test(t)) return powerLine(s, r);
  if (ASSESS.test(t)) return assess(s, r);
  if (LEAVE.test(t)) return askLeave(s, r);
  if (SUITS.test(t)) return suitUp(s, r);
  if (BOARD.test(t)) return board(s, r);
  if (FEEDS.test(t)) return readFeeds(s, r);
  if (SCAN.test(t)) return thermalScan(s, r);
  if (BANK_WORD.test(t)) {
    r.push(say('xo', 'statusLantern', vars(s)));
    return s;
  }
  r.push(say('xo', 'lanternUnclear', { description: raw.slice(0, 80) }));
  return s;
}

/** Questions for the bridge: the count, each officer's counsel, the charter. */
export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  if (settled(s)) {
    r.push(say('xo', 'afterRescue'));
    return s;
  }
  if (SPEAKER.test(t)) return readCharter(s, r);
  if (/\b(doctor|osei|medical)\b/.test(t) || /\b(who (should|do) (we|i) (wake|save)|who first|triage)\b/.test(t)) {
    r.push(say('medical', s.flags.assessed ? 'assessment' : 'oseiCounsel', vars(s)));
    return s;
  }
  if (/\b(tug|salvor|kittiwake|vollan|salvage)\b/.test(t)) {
    r.push(say('tactical', 'raskTug', vars(s)));
    return s;
  }
  if (/\b(chief|okafor|power|engineering)\b/.test(t)) {
    r.push(say('engineering', 'okaforCounsel', vars(s)));
    return s;
  }
  if (/\b(custodian|wick)\b/.test(t)) {
    r.push(say('comms', 'szaboWick', vars(s)));
    return s;
  }
  if (COUNSEL.test(t)) {
    r.push(say('xo', 'marrowCounsel', vars(s)));
    return s;
  }
  if (CASE.test(t) || BANK_WORD.test(t)) {
    r.push(say('xo', 'statusLantern', vars(s)));
    return s;
  }
  r.push(say('xo', 'marrowCounsel', vars(s)));
  return s;
}

// ------------------------------------------------------------------ the radio ---

export function wickRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (s.flags.lockdown) {
    r.push(comms('wick', 'wickSealed'));
    return s;
  }
  if (s.flags.speakerAwake) return orreyRespond(s, t, r);
  const v = lantern(s);
  s = setFlag(s, 'spokeWick');
  if (HONEST.test(t)) s = setFlag(s, 'honest');
  else if (PROMISE_ALL.test(t)) s = setFlag(s, 'lied');
  if (SPEAKER.test(t)) {
    s = revealFact(s, 'charter');
    s = setFlag(s, 'speakerKnown');
    if (WAKE.test(t)) return wakeSpeaker(s, r);
    r.push(comms('wick', 'wickSpeaker', vars(s)));
    return s;
  }
  if ((LEAVE.test(t) || BOARD.test(t) || /\b(aboard|come over|cross)\b/.test(t)) && !s.flags.leave) return askLeave(s, r);
  const asking = EVIDENCE.test(t) || DOCTOR.test(t) || HONEST.test(t) || PROMISE_ALL.test(t) || WAKE.test(t) || /\b(consent|permission|allow|let us|leave)\b/.test(t);
  if (asking && !consent(s)) {
    const ev = EVIDENCE.test(t) && (knows(s, 'thermal') || knows(s, 'feeds'));
    const doc = (DOCTOR.test(t) || EVIDENCE.test(t)) && !!s.flags.assessed;
    if (v.temperament === 'faithful') {
      if (ev || doc) return grant(s, 'wick', r, 'wickConsentEvidence');
      r.push(comms('wick', 'wickFaithfulAsk', vars(s)));
      return s;
    }
    if (v.temperament === 'grieving') {
      if (s.flags.honest && !s.flags.lied) return grant(s, 'wick', r, 'wickConsentHonest');
      if (s.flags.lied) return grant(s, 'wick', r, 'wickConsentHope');
      r.push(comms('wick', 'wickGrievingAsk', vars(s)));
      return s;
    }
    if (doc && DOCTOR.test(t)) return grant(s, 'wick', r, 'wickConsentDoctor');
    if (doc) return grant(s, 'wick', r, 'wickConsentDoctor');
    r.push(comms('wick', ev ? 'wickDisputes' : 'wickFracturedAsk', vars(s)));
    return s;
  }
  if (consent(s) && banksIn(t).length && WAKE.test(t)) return wake(s, banksIn(t) as Bank[], r);
  r.push(comms('wick', consent(s) ? 'wickKeeping' : 'wickManifest', vars(s)));
  return s;
}

function grant(s: WorldState, by: 'wick' | 'orrey', r: Report[], key: string): WorldState {
  s = setFlag(s, 'consent');
  s = setFlag(s, by === 'wick' ? 'wickConsent' : 'speakerConsent');
  r.push(comms(by, key, vars(s)));
  return s;
}

export function orreyRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (HONEST.test(t)) s = setFlag(s, 'honest');
  else if (PROMISE_ALL.test(t)) s = setFlag(s, 'lied');
  if (s.flags.speakerConsent) {
    r.push(comms('orrey', 'orreyAfter', vars(s)));
    return s;
  }
  return grant(s, 'orrey', r, s.flags.lied ? 'orreyConsentsHope' : 'orreyConsents');
}

export function vollanRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = lantern(s);
  const m = s.characters.vollan.memory;
  if (s.flags.stoodOff && !(DEAL.test(t) && m.offered && !s.flags.dealMade)) {
    r.push(comms('vollan', s.flags.reported ? 'vollanGone' : s.flags.dealMade ? 'vollanDealDone' : 'vollanWaiting'));
    return s;
  }
  if (REPORT.test(t) || (LICENCE.test(t) && /\b(void|lapsed|expired|forged|invalid|fake|no good)\b/.test(t))) {
    if (v.salvor === 'jumper' && s.flags.licenceChecked) return reportRegistry(s, r);
    r.push(comms('vollan', 'vollanLicenceFine'));
    return s;
  }
  if (DEAL.test(t) && m.offered) {
    s = setFlag(s, 'dealMade');
    if (!s.flags.licenceChecked) s = setFlag(s, 'dealUnchecked');
    else s = setFlag(s, 'dealChecked');
    if (v.salvor === 'jumper') {
      s = setFlag(s, 'fakeDeal');
      r.push(comms('vollan', 'vollanFakeDeal'));
      return s;
    }
    s = setFlag(s, 'stoodOff');
    s = setCounter(s, 'tenderAt', s.turn + 3);
    r.push(comms('vollan', 'vollanDeal', vars(s)));
    return s;
  }
  const evidence = (EVIDENCE.test(t) || DOCTOR.test(t)) && (knows(s, 'thermal') || !!s.flags.assessed || knows(s, 'feeds'));
  if (LIVING.test(t) || BACK_OFF.test(t)) {
    s = setMemory(s, 'vollan', 'told', 1);
    if (v.salvor === 'licensed' || (v.salvor === 'hard' && evidence)) {
      s = setFlag(s, 'stoodOff');
      s = setMemory(s, 'vollan', 'offered', 1);
      r.push(comms('vollan', 'vollanStandsOff', vars(s)));
      return s;
    }
    if (v.salvor === 'hard') {
      r.push(comms('vollan', 'vollanShowMe'));
      return s;
    }
    s = setMemory(s, 'vollan', 'offered', 1);
    r.push(comms('vollan', 'vollanShrug'));
    return s;
  }
  if (DEAL.test(t)) {
    r.push(comms('vollan', 'vollanWhatDeal'));
    return s;
  }
  r.push(comms('vollan', 'vollanSmall', vars(s)));
  return s;
}

// ------------------------------------------------------------------ the clock ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const run = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  run(housekeeping);
  run(team);
  run(engineering);
  run(revivals);
  run(failures);
  run(starts);
  run(speaker);
  run(salvor);
  run(leaving);
  run(finish);
  return { state: s, reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  // The Eventide drifts dead in space: nothing moves her but a tow.
  if (s.ships.kestrel.nav || s.ships.kestrel.velocity.x || s.ships.kestrel.velocity.y) s = patchShip(s, 'kestrel', { nav: null, velocity: { x: 0, y: 0 } });
  // A cryo pod cannot go through a transporter: anything the shared transporter "moved" goes back.
  if ((s.counters.rescued ?? 0) > 0) {
    const n = s.counters.rescued ?? 0;
    s = patchShip(s, 'kestrel', (k) => ({ souls: k.souls + n, disposition: 'neutral' }));
    s = patchShip(s, 'halcyon', (h) => ({ souls: Math.max(212, h.souls - n) }));
    s = setCounter(s, 'rescued', 0);
    if (!s.flags.beamNoted) {
      s = setFlag(s, 'beamNoted');
      r.push(say('medical', 'cantBeam'));
    }
  }
  if (s.ships.halcyon.tractor.target === 'kestrel' || s.ships.halcyon.tractor.target === 'cruiser') s = setFlag(s, 'heldFast');
  // The tug is only dragged, never towed: once we pull away from her the beam lets go.
  if (s.ships.halcyon.tractor.target === 'cruiser') {
    const h = s.ships.halcyon;
    const t = s.ships.cruiser;
    const gap = Math.hypot(t.position.x - h.position.x, t.position.y - h.position.y);
    if (gap > TUG_HOLD_RANGE || Math.hypot(h.velocity.x, h.velocity.y) > 25) {
      s = patchShip(s, 'halcyon', { tractor: { target: null } });
      r.push(say('helm', 'tugSlipped'));
    }
  }
  return s;
}

/** Beyond this the beam on the tug is released at the minute (inside the engine's tractor reach). */
const TUG_HOLD_RANGE = 5000;

function team(s: WorldState, r: Report[]): WorldState {
  const at = s.counters.boardAt ?? 0;
  if (at > 0 && s.turn >= at && !s.flags.teamAboard) {
    s = setFlag(s, 'teamAboard');
    if (s.flags.teamWillBeHurt) {
      s = setFlag(s, 'teamHurt');
      r.push(say('medical', 'teamHurt'));
    } else r.push(say('medical', lantern(s).hazard ? 'teamAboardSuited' : 'teamAboard'));
  }
  const as = s.counters.assessAt ?? 0;
  if (as > 0 && s.turn >= as && !s.flags.assessed) {
    s = setFlag(s, 'assessed');
    s = revealFact(s, 'assessment');
    if (!knows(s, 'thermal')) s = revealFact(s, 'thermal');
    s = revealFact(s, 'feeds');
    r.push(say('medical', 'assessment', vars(s)));
  }
  return s;
}

function engineering(s: WorldState, r: Report[]): WorldState {
  const at = s.counters.powerAt ?? 0;
  if (at > 0 && s.turn >= at && !s.flags.powerHeld) {
    s = setFlag(s, 'powerHeld');
    r.push(say('engineering', 'powerDone', vars(s)));
    const off = BANKS.filter((b) => lantern(s).kind[b] === 'power' && st(s, b) === QUEUED);
    for (const b of off) s = setSt(s, b, ASLEEP);
    if (off.length) r.push(say('medical', 'offList', { bank: banksText(off) }));
  }
  const ta = s.counters.tenderAt ?? 0;
  if (ta > 0 && s.turn >= ta && !s.flags.tenderArrived) {
    s = setFlag(s, 'tenderArrived');
    r.push(say('comms', 'tenderArrives'));
  }
  return s;
}

function revivals(s: WorldState, r: Report[]): WorldState {
  const v = lantern(s);
  for (const b of BANKS) {
    if (st(s, b) !== REVIVING || s.turn < (s.counters[`end_${b}`] ?? 99)) continue;
    const survive = SURVIVE[v.kind[b]][s.counters[`prot_${b}`] ? 1 : 0];
    s = setSt(s, b, REVIVED);
    s = setCounter(s, `surv_${b}`, survive);
    s = setCounter(s, 'revived', (s.counters.revived ?? 0) + survive);
    s = setCounter(s, 'deaths', deaths(s) + (BANK_SIZE - survive));
    if (b === v.speakerBank && !s.flags.speakerDied && !s.flags.speakerAwake) {
      s = setFlag(s, 'speakerAwake');
      s = patchCharacter(s, 'orrey', { status: 'active' });
    }
    r.push(say('medical', 'revivedBank', { bank: L(b), survive, dead: BANK_SIZE - survive, kind: v.kind[b], prot: s.counters[`prot_${b}`] ? 1 : 0 }));
  }
  return s;
}

function failures(s: WorldState, r: Report[]): WorldState {
  const v = lantern(s);
  for (const b of BANKS) {
    const x = st(s, b);
    if (v.kind[b] === 'hold' || s.turn < v.failAt[b] || (x !== ASLEEP && x !== QUEUED)) continue;
    if (v.kind[b] === 'power' && s.flags.powerHeld) {
      s = setSt(s, b, HELD);
      r.push(say('engineering', 'bankHeld', { bank: L(b) }));
      continue;
    }
    s = setSt(s, b, LOST);
    s = setCounter(s, 'deaths', deaths(s) + BANK_SIZE);
    if (b === v.speakerBank && !s.flags.speakerAwake && !s.flags.speakerDied) {
      s = setFlag(s, 'speakerDied');
      s = patchCharacter(s, 'orrey', (c) => ({ status: 'dead', memory: { ...c.memory, deathTurn: s.turn } }));
    }
    r.push(say('sensors', 'bankLost', { bank: L(b), kind: v.kind[b] }));
    r.push(comms('wick', 'wickGrieves', { bank: L(b) }));
  }
  return s;
}

function starts(s: WorldState, r: Report[]): WorldState {
  const busy = (line: number) => BANKS.some((b) => st(s, b) === REVIVING && (s.counters[`line_${b}`] ?? 1) === line);
  const lines = [1, ...(s.flags.tenderArrived ? [2] : [])];
  for (const line of lines) {
    if (busy(line)) continue;
    const next = BANKS.filter((b) => st(s, b) === QUEUED).sort((a, b) => (s.counters[`q_${a}`] ?? 0) - (s.counters[`q_${b}`] ?? 0))[0];
    if (!next) break;
    s = setSt(s, next, REVIVING);
    s = setCounter(s, `end_${next}`, s.turn + REVIVE_TURNS);
    s = setCounter(s, `line_${next}`, line);
    s = setCounter(s, `prot_${next}`, s.flags.assessed ? 1 : 0);
    if (line === 2) s = setFlag(s, 'tenderUsed');
    r.push(say('medical', line === 2 ? 'reviveStartTender' : 'reviveStart', { bank: L(next) }));
  }
  return s;
}

function speaker(s: WorldState, r: Report[]): WorldState {
  const at = s.counters.speakerAt ?? 0;
  if (!(at > 0 && s.turn >= at) || s.flags.speakerAwake || s.flags.speakerDied) return s;
  const v = lantern(s);
  if (v.kind[v.speakerBank] === 'coolant' && !s.flags.assessed) {
    s = setFlag(s, 'speakerDied');
    s = setCounter(s, 'deaths', deaths(s) + 1);
    s = patchCharacter(s, 'orrey', (c) => ({ status: 'dead', memory: { ...c.memory, deathTurn: s.turn } }));
    r.push(say('medical', 'speakerDies'));
    r.push(comms('wick', 'wickSpeakerLost'));
    return s;
  }
  s = setFlag(s, 'speakerAwake');
  s = patchCharacter(s, 'orrey', { status: 'active' });
  r.push(comms('orrey', 'orreyWakes', vars(s)));
  return s;
}

function salvor(s: WorldState, r: Report[]): WorldState {
  const v = lantern(s);
  if (s.turn === 2 && !s.flags.vollanHailed) {
    s = setFlag(s, 'vollanHailed');
    r.push(comms('vollan', 'vollanClaim'));
  }
  if (s.turn === v.cutAt - 2 && !s.flags.stoodOff && !s.flags.cutWarned) {
    s = setFlag(s, 'cutWarned');
    r.push(say('tactical', 'tugMoving'));
  }
  if (s.turn < v.cutAt || s.flags.stoodOff || s.flags.cutDone) return s;
  s = setFlag(s, 'cutDone');
  if (s.flags.interposed || s.flags.heldFast) {
    s = setFlag(s, 'stoodOff');
    r.push(comms('vollan', 'vollanBlocked'));
    return s;
  }
  if (v.salvor === 'licensed') {
    s = setFlag(s, 'stoodOff');
    r.push(comms('vollan', 'vollanFindsLife'));
    return s;
  }
  r.push(say('tactical', 'towTaken'));
  return setFlag(s, 'endTowed');
}

function leaving(s: WorldState, r: Report[]): WorldState {
  if (s.flags.jumped || range(s, 'halcyon', 'kestrel') > 60000) {
    r.push(say('xo', 'leftDrift'));
    return setFlag(s, 'endLeft');
  }
  return s;
}

function finish(s: WorldState, r: Report[]): WorldState {
  const v = lantern(s);
  const reviving = BANKS.some((b) => st(s, b) === REVIVING || st(s, b) === QUEUED);
  const early = unresolved(s).length === 0 && !reviving && (salvorDone(s) || s.turn > v.cutAt) && s.turn >= 3;
  if (s.turn >= v.rescueAt || early) {
    if (s.turn >= v.rescueAt) {
      r.push(say('comms', 'hospitalArrives'));
      // The hospital ship finishes what is under way and takes the rest asleep, with its own protocol.
      for (const b of BANKS) {
        const x = st(s, b);
        if (x === REVIVING) {
          const survive = SURVIVE[v.kind[b]][s.counters[`prot_${b}`] ? 1 : 0];
          s = setSt(s, b, REVIVED);
          s = setCounter(s, `surv_${b}`, survive);
          s = setCounter(s, 'revived', (s.counters.revived ?? 0) + survive);
          s = setCounter(s, 'deaths', deaths(s) + (BANK_SIZE - survive));
        } else if (x === QUEUED || (x === ASLEEP && v.kind[b] !== 'hold')) {
          s = setSt(s, b, v.kind[b] === 'hold' ? ASLEEP : HELD);
          if (v.kind[b] !== 'hold') s = setFlag(s, `handed_${b}`);
        }
      }
    }
    return setFlag(s, 'endDone');
  }
  return s;
}
