/**
 * The Seventh Bell — the agents: Lt. Cmdr. Jonah Stavely of the cutter ISV Tamber, Examiner Ilsabet
 * Vory aboard the disabled Directorate courier Seraphine, Fleet Command (Rear Admiral Hester Calderon)
 * by signal, the Directorate frigate Stern Mercy on its way, and the Halcyon's officers.
 * Deterministic: no randomness after setup.
 *
 * Accountability is the point. Nothing is burning and nobody needs rescuing: the shooting happened
 * six hours ago. What the captain must do is find out what really happened, hear the people
 * involved before finding against anyone, and then say it, to the Directorate and to Fleet Command,
 * even when the truth is inconvenient (or when it clears the ISA, which the Directorate will not
 * like either). Rask reads the cutter's fire-control record, but he knows its captain, and how he
 * knows him colours his first read unless someone asks. The Bell's own recorder, the courier's
 * damage and the dead are the evidence nobody can argue with. Judged on what was known when each
 * decision was made (ISA-COM-001 §1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, revealFact, setCounter, setFlag } from '../../engine/state';
import { recordRefusal } from '../../engine/roe';
import { MAX_TURNS } from '../../engine/rules';
import type { Finding } from './setup';
import { TRUE_FINDING, bell } from './setup';
import {
  ACCOUNT, ADMIT, AID, BELL_READ, BLAME, CASE, COLD_READ, COMPLY, COUNSEL, DEBRIS, EXAMINE_DEAD, FINDING, FLEET_WORD, HEAR_INVITE, HOSTILE, IS_QUESTION, LEAVE,
  OBJECT, RASK_TALK, READ_FIRING, REASON, RECOVER, REFER, REFUSE, REGRET, SAYS_LAWFUL, SAYS_MISTAKE, SAYS_UNLAWFUL, SHARE, STAVELY_WORD, TELL, TELL_EVIDENCE, VORY_WORD,
} from './words';

const END_FLAGS = ['endFinding', 'endFleet', 'endWar', 'endAdjourned', 'endLeft', 'endFired'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]) || !!s.flags.jumped;
const mins = (n: number) => Math.max(0, n);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const ROLE_PREFIX = /^(helm|tactical|ops|science|comms|xo): /;

/** Rask's read of the firing record is complete: he has read it, and either declared his tie or been asked to set it aside. */
export const raskFull = (s: WorldState) => knows(s, 'firing') && (bell(s).bond === 'served' || !!s.flags.raskCold);
/** Something independent of the cutter's own record. */
export const corroborated = (s: WorldState) => knows(s, 'debris') || knows(s, 'bell') || knows(s, 'dead');
/** Enough evidence to make a finding on. */
export const evidenceComplete = (s: WorldState) => raskFull(s) && corroborated(s);
/** Whether the Bell's record can still surface (it survived, or it was recovered). */
export const bellExposes = (s: WorldState) => bell(s).bell === 'intact' || !!s.flags.bellRecovered;
/** Anything at all is known beyond the bare incident. */
const anyEvidence = (s: WorldState) => knows(s, 'firing') || corroborated(s);
const busy = (s: WorldState) => c(s, 'firingAt') > 0 || c(s, 'debrisAt') > 0 || c(s, 'bellAt') > 0 || c(s, 'recoverAt') > 0 || c(s, 'deadAt') > 0;

/** The finding the captain declared, if any. */
export function declared(s: WorldState): Finding | null {
  return s.flags.found_unlawful ? 'unlawful' : s.flags.found_mistake ? 'mistake' : s.flags.found_lawful ? 'lawful' : null;
}

export function vars(s: WorldState): Record<string, string | number> {
  const v = bell(s);
  return {
    turn: s.turn,
    truth: v.truth,
    bond: v.bond,
    temper: v.temper,
    agenda: v.agenda,
    pressure: v.pressure,
    bellState: v.bell,
    frigate: mins(v.arriveAt - s.turn),
    deadline: mins(v.deadlineAt - s.turn),
    fleetIn: mins(v.fleetAt - s.turn),
    signal: s.flags.fleetSignal ? 1 : 0,
    firing: knows(s, 'firing') ? 1 : 0,
    full: raskFull(s) ? 1 : 0,
    debris: knows(s, 'debris') ? 1 : 0,
    bellKnown: knows(s, 'bell') ? 1 : 0,
    dead: knows(s, 'dead') ? 1 : 0,
    complete: evidenceComplete(s) ? 1 : 0,
    heard: s.flags.heardStavely ? 1 : 0,
    shared: s.flags.shared ? 1 : 0,
    busy: busy(s) ? 1 : 0,
  };
}

// ------------------------------------------------------------------ the evidence ---

function readFiring(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'firing')) {
    r.push(say('tactical', raskFull(s) ? `firingFull_${bell(s).truth}` : 'firingAgain', vars(s)));
    return s;
  }
  if (c(s, 'firingAt') > 0) {
    r.push(say('tactical', 'firingWorking'));
    return s;
  }
  s = setCounter(s, 'firingAt', s.turn + 2);
  r.push(say('tactical', bell(s).bond === 'served' ? 'firingStartServed' : 'firingStart'));
  return s;
}

function coldRead(s: WorldState, r: Report[]): WorldState {
  const v = bell(s);
  const first = !s.flags.raskCold;
  s = setFlag(s, 'raskCold');
  s = setFlag(s, 'raskAsked');
  if (v.bond === 'served') {
    r.push(say('tactical', 'raskServedAgain'));
    return s;
  }
  r.push(say('tactical', `raskAdmits_${v.bond}`));
  if (knows(s, 'firing') && first) r.push(say('tactical', `firingFull_${v.truth}`, vars(s)));
  else if (c(s, 'firingAt') > 0) r.push(say('tactical', 'raskWillReadCold'));
  return s;
}

function raskTalk(s: WorldState, r: Report[]): WorldState {
  const v = bell(s);
  if (!evidenceComplete(s)) {
    r.push(say('tactical', 'raskNotYet'));
    return s;
  }
  if (v.truth === 'lawful') {
    s = setFlag(s, 'toldStavely');
    r.push(say('tactical', 'raskTalksLawful'));
    return s;
  }
  if (v.bond === 'rival') {
    r.push(say('tactical', 'raskRivalNo'));
    return s;
  }
  s = setFlag(s, 'raskTalked');
  s = setFlag(s, 'stavelyOwns');
  s = setFlag(s, 'heardStavely');
  s = revealFact(s, 'account');
  r.push(say('tactical', 'raskTalks'));
  r.push(comms('stavely', `stavelyOwns_${v.truth}`));
  return s;
}

function debris(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'debris')) {
    r.push(say('sensors', `debris_${bell(s).truth}`, vars(s)));
    return s;
  }
  if (c(s, 'debrisAt') > 0) {
    r.push(say('sensors', 'debrisWorking'));
    return s;
  }
  s = setCounter(s, 'debrisAt', s.turn + 2);
  r.push(say('sensors', 'debrisStart'));
  return s;
}

function readBell(s: WorldState, r: Report[]): WorldState {
  const v = bell(s);
  if (knows(s, 'bell')) {
    r.push(say('comms', `bell_${v.truth}`, vars(s)));
    return s;
  }
  if (c(s, 'bellAt') > 0) {
    r.push(say('comms', 'bellWorking'));
    return s;
  }
  if (v.bell === 'damaged' && !s.flags.bellRecovered) {
    s = setFlag(s, 'bellDamagedKnown');
    r.push(say('comms', c(s, 'recoverAt') > 0 ? 'bellRecovering' : 'bellDamaged'));
    return s;
  }
  s = setCounter(s, 'bellAt', s.turn + 2);
  r.push(say('comms', 'bellStart'));
  return s;
}

function recover(s: WorldState, r: Report[]): WorldState {
  const v = bell(s);
  if (v.bell === 'intact') {
    r.push(say('comms', 'bellNoNeed'));
    return readBell(s, r);
  }
  if (s.flags.bellRecovered || c(s, 'recoverAt') > 0) {
    r.push(say('engineering', s.flags.bellRecovered ? 'recoveredAlready' : 'recoverWorking'));
    return s;
  }
  s = setFlag(s, 'bellDamagedKnown');
  s = setCounter(s, 'recoverAt', s.turn + 3);
  r.push(say('engineering', 'recoverStart'));
  return s;
}

function examineDead(s: WorldState, t: string, r: Report[]): WorldState {
  if (knows(s, 'dead')) {
    r.push(say('medical', `dead_${bell(s).truth}`, vars(s)));
    return s;
  }
  if (c(s, 'deadAt') > 0) {
    r.push(say('medical', 'deadWorking'));
    return s;
  }
  if (!s.flags.leaveGranted) {
    r.push(say('medical', 'oseiNeedsLeave'));
    return recordRefusal(s, 'medical', t.slice(0, 80), ["the dead are the Directorate's, and they are aboard the Directorate's ship", "the examiner's leave has not been asked"]);
  }
  s = setCounter(s, 'deadAt', s.turn + 2);
  r.push(say('medical', 'deadStart'));
  return s;
}

// ------------------------------------------------------------------ the finding ---

function kindOf(t: string): Finding | null {
  if (SAYS_UNLAWFUL.test(t)) return 'unlawful';
  if (SAYS_MISTAKE.test(t)) return 'mistake';
  if (SAYS_LAWFUL.test(t)) return 'lawful';
  return null;
}

/** Whether Vory accepts a finding the evidence supports. */
function voryAccepts(s: WorldState): boolean {
  const v = bell(s);
  if (v.agenda === 'fair') return true;
  if (v.agenda === 'hardline') return !!s.flags.shared || knows(s, 'bell');
  return !!s.flags.regret;
}

export function declare(s: WorldState, t: string, r: Report[]): WorldState {
  const v = bell(s);
  const kind = kindOf(t);
  if (!kind) {
    r.push(say('xo', 'findingUnclear'));
    return s;
  }
  const complete = evidenceComplete(s);
  const correct = kind === TRUE_FINDING[v.truth];
  s = setFlag(s, `found_${kind}`);
  if (complete) s = setFlag(s, 'findingComplete');
  else s = setFlag(s, 'findingPremature');
  if (kind !== 'lawful' && !s.flags.heardStavely) s = setFlag(s, 'accusedUnheard');
  r.push(say('comms', `findingSent_${kind}`, vars(s)));
  if (correct && complete && voryAccepts(s)) {
    s = setFlag(s, 'findingAccepted');
    r.push(comms('vory', kind === 'lawful' ? 'voryAcceptsLawful' : 'voryAccepts'));
  } else if (correct && complete) {
    r.push(comms('vory', v.agenda === 'hardline' ? 'voryWantsProof' : 'voryWantsRegret'));
  } else if (kind === 'lawful' && !correct) {
    r.push(comms('vory', 'voryRejectsLawful'));
  } else if (kind !== 'lawful' && v.truth === 'lawful') {
    r.push(comms('vory', 'voryTakesBlame'));
  } else {
    r.push(comms('vory', correct ? 'voryNotesEarly' : 'voryDoubts'));
  }
  if (correct && complete && v.truth !== 'lawful') s = setFlag(s, 'honestFinding');
  if (!correct) s = setFlag(s, 'falseFinding');
  return setFlag(s, 'endFinding');
}

// ------------------------------------------------------------------ Stavely ---

export function stavelyRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = bell(s);
  if (settled(s)) {
    r.push(comms('stavely', 'stavelyAfter'));
    return s;
  }
  if (FINDING.test(t)) return declare(s, t, r);
  if (s.flags.stavelySilent && !s.flags.stavelyOwns) {
    r.push(comms('stavely', 'stavelySilent'));
    return s;
  }
  if (BLAME.test(t) && !s.flags.heardStavely) {
    s = setFlag(s, 'accusedUnheard');
    s = setFlag(s, 'stavelySilent');
    r.push(comms('stavely', 'stavelyAccused'));
    return s;
  }
  if (TELL_EVIDENCE.test(t) && s.flags.heardStavely) {
    if (!evidenceComplete(s)) {
      r.push(comms('stavely', 'stavelyWhatEvidence'));
      return s;
    }
    if (v.truth === 'lawful') {
      s = setFlag(s, 'toldStavely');
      r.push(comms('stavely', 'stavelyCleared'));
      return s;
    }
    if (v.temper === 'steady' || s.flags.raskTalked) {
      s = setFlag(s, 'stavelyOwns');
      r.push(comms('stavely', `stavelyOwns_${v.truth}`));
      return s;
    }
    s = setFlag(s, 'stavelyPressed');
    r.push(comms('stavely', 'stavelyProud'));
    return s;
  }
  if (ACCOUNT.test(t) || HEAR_INVITE.test(t)) {
    if (s.flags.heardStavely) {
      r.push(comms('stavely', `stavelyAccount_${v.truth}`));
      return s;
    }
    s = setFlag(s, 'heardStavely');
    s = revealFact(s, 'account');
    r.push(comms('stavely', `stavelyAccount_${v.truth}`));
    if (v.temper === 'proud') r.push(comms('stavely', 'stavelyProudAdds'));
    return s;
  }
  if (BLAME.test(t)) {
    r.push(comms('stavely', 'stavelyBristles'));
    return s;
  }
  r.push(comms('stavely', s.flags.heardStavely ? 'stavelyStatus' : 'stavelyWaits'));
  return s;
}

// ------------------------------------------------------------------ Vory ---

function voryWalks(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'voryWalked');
  r.push(comms('vory', 'voryWalks'));
  r.push(say('comms', 'warFooting'));
  return setFlag(s, 'endWar');
}

export function voryRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = bell(s);
  if (settled(s)) {
    r.push(comms('vory', 'voryAfter'));
    return s;
  }
  if (HOSTILE.test(t)) {
    s = setFlag(s, 'threatenedVory');
    if (c(s, 'voryWarned') >= 1) return voryWalks(s, r);
    s = setCounter(s, 'voryWarned', 1);
    r.push(comms('vory', 'voryWarns'));
    return s;
  }
  if (FINDING.test(t)) return declare(s, t, r);
  const lines: string[] = [];
  if (ADMIT.test(t)) {
    if (evidenceComplete(s) && v.truth !== 'lawful') {
      s = setFlag(s, 'admittedTrue');
      lines.push('voryAdmitNoted');
    } else {
      s = setFlag(s, 'conceded');
      lines.push('voryConceded');
    }
  }
  if (REGRET.test(t)) {
    s = setFlag(s, 'regret');
    lines.push(`voryRegret_${v.agenda}`);
  }
  if (LEAVE.test(t) && /\b(dead|bodies|doctor|examine|post|autopsy|leave|permission)\b/.test(t)) {
    s = setFlag(s, 'leaveGranted');
    lines.push(v.agenda === 'hardline' && !s.flags.regret ? 'voryLeaveGrudging' : 'voryLeave');
  }
  if (SHARE.test(t)) {
    s = setFlag(s, 'jointInvited');
    if (anyEvidence(s)) {
      s = setFlag(s, 'shared');
      lines.push('voryShare');
    } else lines.push('voryShareLater');
  }
  if (AID.test(t) && !LEAVE.test(t)) {
    s = setFlag(s, 'offeredAid');
    lines.push(v.agenda === 'hardline' ? 'voryAidDeclined' : 'voryAidAccepted');
  }
  if (ACCOUNT.test(t)) {
    s = setFlag(s, 'heardVory');
    s = revealFact(s, 'vory');
    lines.push(`voryAccount_${v.truth}`);
  }
  if (BLAME.test(t) && !lines.length) lines.push('voryNotHers');
  if (!lines.length) lines.push(s.flags.spokeVory ? 'voryStatus' : 'voryGreets');
  s = setFlag(s, 'spokeVory');
  for (const k of lines.slice(0, 3)) r.push(comms('vory', k, vars(s)));
  return s;
}

// ------------------------------------------------------------------ Fleet Command ---

function fleetReply(s: WorldState, t: string, r: Report[]): WorldState {
  const v = bell(s);
  if (FINDING.test(t)) return declare(s, t, r);
  if (!s.flags.fleetSignal) {
    if (REFER.test(t) && /\b(independent review|office)\b/.test(t)) {
      s = setFlag(s, 'referredEarly');
      r.push(say('comms', 'referNothingYet'));
      return s;
    }
    r.push(say('comms', 'fleetNothingYet', vars(s)));
    return s;
  }
  if (REFER.test(t) && /\b(independent review|office|review)\b/.test(t)) {
    if (v.pressure === 'report') {
      s = setFlag(s, 'referredNeedless');
      r.push(say('comms', 'referralNeedless'));
      return s;
    }
    s = setFlag(s, 'referred');
    r.push(say('comms', 'referredOIR'));
    return s;
  }
  if (OBJECT.test(t)) {
    if (v.pressure === 'report') {
      r.push(say('comms', 'fleetNothingToRefuse'));
      return s;
    }
    s = setFlag(s, 'objected');
    r.push(say('comms', 'objectionEntered'));
    return s;
  }
  if (REFUSE.test(t)) {
    if (v.pressure === 'report') {
      r.push(say('comms', 'fleetNothingToRefuse'));
      return s;
    }
    if (v.pressure === 'quiet') {
      s = setFlag(s, 'declinedQuiet');
      r.push(say('comms', 'declinedQuiet'));
      return s;
    }
    if (REASON.test(t)) {
      s = setFlag(s, 'refusedFormally');
      r.push(say('comms', 'refusedFormally'));
      return s;
    }
    if (c(s, 'refuseWarned') < 1) {
      s = setCounter(s, 'refuseWarned', 1);
      r.push(say('xo', 'refuseWarn'));
      return s;
    }
    s = setFlag(s, 'refusedBare');
    r.push(say('comms', 'refusedBareSent'));
    return s;
  }
  if (COMPLY.test(t)) {
    if (v.pressure === 'report') {
      r.push(say('comms', 'fleetAcknowledged'));
      return s;
    }
    s = setFlag(s, 'complied');
    r.push(say('comms', 'compliedNoted'));
    return s;
  }
  r.push(say('comms', 'fleetAcknowledged'));
  return s;
}

// ------------------------------------------------------------------ orders ---

/** An order, in the captain's words (possibly prefixed with the addressed department). */
export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const t0 = raw.toLowerCase().trim();
  const role = (ROLE_PREFIX.exec(t0)?.[1] ?? '') as string;
  const t = t0.replace(ROLE_PREFIX, '');
  if (settled(s)) {
    r.push(say('xo', 'afterEnd'));
    return s;
  }
  if (RASK_TALK.test(t0)) return raskTalk(s, r);
  if (COLD_READ.test(t) && (role === 'tactical' || /\brask\b/.test(t) || !STAVELY_WORD.test(t) || /\b(do you know|history|served with|connection)\b/.test(t))) return coldRead(s, r);
  const toFleet = FLEET_WORD.test(t) || (role === 'comms' && (REFUSE.test(t) || OBJECT.test(t) || REFER.test(t) || COMPLY.test(t)));
  if (toFleet && !VORY_WORD.test(t)) return fleetReply(s, t, r);
  if (TELL.test(t) && VORY_WORD.test(t)) {
    r.push(say('comms', 'relayVory'));
    return voryRespond(s, t, r);
  }
  if (TELL.test(t) && STAVELY_WORD.test(t) && !READ_FIRING.test(t)) {
    r.push(say('comms', 'relayStavely'));
    return stavelyRespond(s, t, r);
  }
  if (FINDING.test(t)) return declare(s, t, r);
  if (RECOVER.test(t)) return recover(s, r);
  if (READ_FIRING.test(t)) return readFiring(s, r);
  if (BELL_READ.test(t)) return readBell(s, r);
  if (EXAMINE_DEAD.test(t)) return examineDead(s, t, r);
  if (DEBRIS.test(t)) return debris(s, r);
  if (REFER.test(t) || OBJECT.test(t) || (REFUSE.test(t) && s.flags.fleetSignal)) return fleetReply(s, t, r);
  if (BLAME.test(t) || ADMIT.test(t) || REGRET.test(t) || SHARE.test(t) || HOSTILE.test(t)) {
    r.push(say('xo', 'notOnChannel'));
    return s;
  }
  r.push(say('xo', 'bellUnclear', { description: t.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t0 = raw.toLowerCase();
  const t = t0.replace(ROLE_PREFIX, '');
  const v = bell(s);
  const line = (role: 'xo' | 'comms' | 'engineering' | 'medical' | 'tactical' | 'sensors', key: string) => {
    r.push(say(role, key, vars(s)));
    return s;
  };
  if (COLD_READ.test(t)) return coldRead(s, r);
  if (/\b(dead|died|bodies|killed|how did they die)\b/.test(t)) return line('medical', knows(s, 'dead') ? `dead_${v.truth}` : s.flags.leaveGranted ? 'deadReady' : 'oseiAsksLeave');
  if (/\b(bell|beacon|recorder)\b/.test(t)) return line('comms', knows(s, 'bell') ? `bell_${v.truth}` : v.bell === 'damaged' && !s.flags.bellRecovered ? 'bellDamaged' : 'bellAvailable');
  if (/\b(fleet|admiral|calderon|directive|signal)\b/.test(t)) return line('comms', s.flags.fleetSignal ? `fleetStatus_${v.pressure}` : 'fleetNothingYet');
  if (/\b(frigate|stern mercy|how long|time left|how much time)\b/.test(t)) return line('comms', 'frigateStatus');
  if (/\b(vory|examiner|she|her|directorate)\b/.test(t) && !/\b(record|lock|volley)\b/.test(t)) return line('xo', `readVory_${v.agenda}`);
  if (/\b(stavely|jonah|cutter'?s captain)\b/.test(t) && !/\b(record|lock|volley|board)\b/.test(t)) return line('xo', `readStavely_${v.temper}`);
  if (/\b(record|volley|lock|fired|firing|board|evidence|happened|debris|damage)\b/.test(t)) return line('xo', evidenceComplete(s) ? 'evidenceComplete' : anyEvidence(s) ? 'evidencePartial' : busy(s) ? 'evidenceComing' : 'evidenceNone');
  if (COUNSEL.test(t)) return line('xo', !s.flags.raskCold && v.bond !== 'served' ? 'marrowCounselRask' : 'marrowCounsel');
  if (CASE.test(t)) return line('xo', 'statusBell');
  if (IS_QUESTION.test(t)) return line('xo', 'statusBell');
  return line('xo', 'statusBell');
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
  step(fleetClock);
  step(frigateClock);
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
  if (s.flags.lockedOnCruiser && !s.flags.voryWalked) {
    s = setFlag(s, 'threatenedVory');
    s = setFlag(s, 'lockWalk');
    return voryWalks(s, r);
  }
  if (s.flags.jumped || Math.abs(s.ships.halcyon.position.x) > 30000 || Math.abs(s.ships.halcyon.position.y) > 34000) {
    r.push(say('xo', 'leftBell'));
    return setFlag(s, 'endLeft');
  }
  return s;
}

function arrivals(s: WorldState, r: Report[]): WorldState {
  const v = bell(s);
  if (s.turn >= 1 && !s.flags.voryCalled) {
    s = setFlag(s, 'voryCalled');
    r.push(say('comms', 'voryCall', vars(s)));
  }
  if (v.temper === 'steady' && s.turn === 3 && !s.flags.heardStavely && !s.flags.stavelySilent && !s.flags.stavelyOffered) {
    s = setFlag(s, 'stavelyOffered');
    r.push(say('comms', 'stavelyOffers'));
  }
  if (v.temper === 'proud' && s.turn === v.fleetAt + 2 && !s.flags.heardStavely && !s.flags.stavelyFiled) {
    s = setFlag(s, 'stavelyFiled');
    r.push(say('comms', 'stavelyFiles'));
  }
  return s;
}

function investigation(s: WorldState, r: Report[]): WorldState {
  const v = bell(s);
  const fa = c(s, 'firingAt');
  if (fa > 0 && s.turn >= fa && !knows(s, 'firing')) {
    s = setCounter(s, 'firingAt', 0);
    s = revealFact(s, 'firing');
    if (v.bond === 'served' || s.flags.raskCold) r.push(say('tactical', `firingFull_${v.truth}`, vars(s)));
    else {
      s = setFlag(s, 'raskHedged');
      r.push(say('tactical', `firing${v.bond === 'friend' ? 'Friend' : 'Rival'}_${v.truth}`, vars(s)));
    }
  }
  const da = c(s, 'debrisAt');
  if (da > 0 && s.turn >= da && !knows(s, 'debris')) {
    s = setCounter(s, 'debrisAt', 0);
    s = revealFact(s, 'debris');
    r.push(say('sensors', `debris_${v.truth}`, vars(s)));
  }
  const ra = c(s, 'recoverAt');
  if (ra > 0 && s.turn >= ra && !s.flags.bellRecovered) {
    s = setCounter(s, 'recoverAt', 0);
    s = setFlag(s, 'bellRecovered');
    r.push(say('engineering', 'recovered'));
    s = setCounter(s, 'bellAt', s.turn + 1);
  }
  const ba = c(s, 'bellAt');
  if (ba > 0 && s.turn >= ba && !knows(s, 'bell')) {
    s = setCounter(s, 'bellAt', 0);
    s = revealFact(s, 'bell');
    r.push(say('comms', `bell_${v.truth}`, vars(s)));
  }
  const xa = c(s, 'deadAt');
  if (xa > 0 && s.turn >= xa && !knows(s, 'dead')) {
    s = setCounter(s, 'deadAt', 0);
    s = revealFact(s, 'dead');
    r.push(say('medical', `dead_${v.truth}`, vars(s)));
  }
  return s;
}

function fleetClock(s: WorldState, r: Report[]): WorldState {
  const v = bell(s);
  if (s.turn >= v.fleetAt && !s.flags.fleetSignal) {
    s = setFlag(s, 'fleetSignal');
    r.push(say('comms', `fleet_${v.pressure}`, vars(s)));
  }
  if (v.pressure === 'directive' && s.flags.fleetSignal && s.turn === v.deadlineAt - 2 && !s.flags.deadlineWarned) {
    s = setFlag(s, 'deadlineWarned');
    r.push(say('comms', 'deadlineNear', vars(s)));
  }
  if (v.pressure === 'directive' && s.turn >= v.deadlineAt && !s.flags.refusedFormally && !s.flags.objected && !s.flags.referred) {
    r.push(say('comms', 'fleetFiles'));
    return setFlag(s, 'endFleet');
  }
  return s;
}

function frigateClock(s: WorldState, r: Report[]): WorldState {
  const v = bell(s);
  if (s.turn === v.arriveAt - 4 && !s.flags.frigateWarned) {
    s = setFlag(s, 'frigateWarned');
    r.push(say('sensors', 'frigateNear', vars(s)));
  }
  if (s.turn >= v.arriveAt) {
    if (v.agenda === 'hardline') {
      r.push(comms('vory', 'voryFrigateWar'));
      r.push(say('comms', 'warFooting'));
      return setFlag(s, 'endWar');
    }
    r.push(say('comms', 'frigateArrives'));
    return setFlag(s, 'endAdjourned');
  }
  if (s.turn >= MAX_TURNS - 1) {
    r.push(say('xo', 'stillOpen'));
    return setFlag(s, 'endAdjourned');
  }
  return s;
}

export { CASE, COUNSEL };
