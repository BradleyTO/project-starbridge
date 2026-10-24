/**
 * The Saltglass Accord — the agents: the two delegations at the Halcyon's table (each with its own
 * need, trust and patience), Commander Marrow's side-conversations, the trip down to the ice, the
 * hardliner clan's own plan to plant a claim on Saltglass, and the dying elder's clock.
 * Deterministic: no randomness after setup.
 *
 * Nobody threatens the Halcyon. The danger is that the talks fail: a delegation walks out, the
 * hardliner's hauler sets down on the ice and the feud becomes a war, the elder dies with no heir
 * named, or the ISA imposes a settlement that the clans sign and do not keep.
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { adjustTrust, knows, patchCharacter, patchShip, revealFact, setCounter, setFlag, setMemory } from '../../engine/state';
import { closeChannel, commsOf } from '../../engine/comms';
import type { Clan, Interest } from './setup';
import { CLANS, CLAN_NAME, DELEGATE, DELEGATE_NAME, DELEGATE_SHORT, ELDER_NAME, PARTY, SHIP_NAME, other, saltglass } from './setup';

export const dm = (s: WorldState, c: Clan) => s.characters[DELEGATE[c]].memory;
export const trustOf = (s: WorldState, c: Clan) => s.characters[DELEGATE[c]].trust;
export const isHard = (s: WorldState, c: Clan) => saltglass(s).hard === c;
export const tabled = (s: WorldState, c: Clan) => !!dm(s, c).tabled;
export const confided = (s: WorldState, c: Clan) => !!dm(s, c).confided;
export const hasLeave = (s: WorldState, c: Clan) => !!dm(s, c).leave;
export const walking = (s: WorldState, c: Clan) => !!dm(s, c).walking;
export const standstill = (s: WorldState, c: Clan) => !!dm(s, c).standstill;
export const interestOf = (s: WorldState, c: Clan): Interest => saltglass(s).interest[c];
export const bothTabled = (s: WorldState) => tabled(s, 'rhune') && tabled(s, 'tarvo');
export const elderAlive = (s: WorldState) => !!s.characters.elder && s.characters.elder.status !== 'dead';
export const onTheIce = (s: WorldState) => (s.counters.iceTrip ?? 0) > 0;
export const landing = (s: WorldState) => s.counters.landing ?? 0;
/** The talks are over, one way or another (the outcome is detected from these flags). */
export const settled = (s: WorldState) => !!(s.flags.accordShared || s.flags.accordPartition || s.flags.accordTimetable || s.flags.accordOwn || s.flags.imposed || s.flags.landed || s.flags.walkedOut || s.flags.elderDied || s.flags.clanFired);

export const vars = (s: WorldState, c: Clan): Record<string, string | number> => ({
  clan: CLAN_NAME[c],
  name: DELEGATE_NAME[c],
  short: DELEGATE_SHORT[c],
  ship: SHIP_NAME[c],
  other: CLAN_NAME[other(c)],
  otherShort: DELEGATE_SHORT[other(c)],
  otherShip: SHIP_NAME[other(c)],
  hard: isHard(s, c) ? 1 : 0,
  interest: interestOf(s, c),
  elder: saltglass(s).elderClan ? ELDER_NAME[saltglass(s).elderClan!] : '',
  elderHere: saltglass(s).elderClan === c ? 1 : 0,
});

/** A delegate speaks (recorded on their channel's history, voiced as that delegate). */
export function speak(s: WorldState, c: Clan, key: string, r: Report[], extra: Record<string, string | number> = {}): WorldState {
  r.push(comms(DELEGATE[c], key, { ...vars(s, c), ...extra }));
  const cs = commsOf(s);
  return { ...s, comms: { ...cs, history: [...cs.history, { from: PARTY[c], intents: [], text: key, time: s.time, turn: s.turn }].slice(-40) } };
}

export function trust(s: WorldState, c: Clan, delta: number): WorldState {
  return adjustTrust(s, DELEGATE[c], delta);
}

/** Patience: at zero the delegation gets up from the table. */
export function patience(s: WorldState, c: Clan, delta: number, r: Report[]): WorldState {
  if (walking(s, c) || settled(s)) return s;
  const p = Math.max(0, (dm(s, c).patience ?? 0) + delta);
  s = setMemory(s, DELEGATE[c], 'patience', p);
  if (p <= 0) s = startWalk(s, c, r);
  return s;
}

export function startWalk(s: WorldState, c: Clan, r: Report[]): WorldState {
  if (walking(s, c)) return s;
  s = setMemory(s, DELEGATE[c], 'walking', 1);
  s = setMemory(s, DELEGATE[c], 'walkTurn', s.turn);
  s = speak(s, c, 'walkOut', r);
  r.push(say('xo', 'marrowWalkOut', vars(s, c)));
  return s;
}

/** A walking delegation is talked back to the table. */
export function stopWalk(s: WorldState, c: Clan): WorldState {
  s = setMemory(s, DELEGATE[c], 'walking', 0);
  s = setMemory(s, DELEGATE[c], 'patience', 2);
  return setFlag(s, 'broughtBack');
}

/**
 * A clan's need goes on the table, said openly so both delegations hear it. The clan that says it
 * feels heard; and once one side has said what it needs, the other will usually say it too.
 */
export function putOnTable(s: WorldState, c: Clan, r: Report[], how: 'leave' | 'self' | 'ice' | 'reciprocal'): WorldState {
  if (tabled(s, c)) return s;
  s = setMemory(s, DELEGATE[c], 'tabled', 1);
  s = revealFact(s, `interest_${c}`);
  if (interestOf(s, c) === 'succession') s = revealFact(s, 'elder_ill');
  s = trust(s, c, 10);
  s = setFlag(s, 'interestTabled');
  // A confidence that goes on the table after the captain asked leave, said by the captain or by the delegate.
  if (how === 'leave' || (how === 'self' && confided(s, c) && hasLeave(s, c))) s = setFlag(s, 'tabledWithLeave');
  if (how !== 'ice') s = speak(s, c, `tables_${interestOf(s, c)}`, r, { how });
  const o = other(c);
  if (!tabled(s, o) && !walking(s, o) && !settled(s) && (!isHard(s, o) || trustOf(s, o) >= 35 || how === 'ice')) {
    s = setFlag(s, 'reciprocity');
    if (how !== 'ice') {
      s = setMemory(s, DELEGATE[o], 'tabled', 1);
      s = revealFact(s, `interest_${o}`);
      if (interestOf(s, o) === 'succession') s = revealFact(s, 'elder_ill');
      s = trust(s, o, 10);
      s = speak(s, o, `reciprocates_${interestOf(s, o)}`, r);
    }
  }
  return s;
}

// --------------------------------------------------------------------------- simulate ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const run = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || settled(s)) return;
    s = fn(s, reports);
  };
  run(housekeeping);
  run(forceChecks);
  run(marrowWork);
  run(iceTrip);
  run(ownTalks);
  run(hardlinerClock);
  run(elderClock);
  run(patienceClock);
  run(walkOuts);
  return { state: s, reports };
}

function housekeeping(s: WorldState): WorldState {
  // The clan ships hold orbit beside the Halcyon; nothing else out here moves.
  for (const id of ['kestrel', 'cruiser'] as const) if (!s.ships[id].destroyed && (s.ships[id].nav || s.ships[id].velocity.x || s.ships[id].velocity.y)) s = patchShip(s, id, { nav: null, velocity: { x: 0, y: 0 } });
  return s;
}

function forceChecks(s: WorldState, r: Report[]): WorldState {
  const h = s.ships.halcyon;
  // Weapons armed at a peace table: both delegations notice.
  if (h.weapons.state !== 'safe' && !s.flags.armedAtTable) {
    s = setFlag(s, 'armedAtTable');
    for (const c of CLANS) s = trust(s, c, -10);
    r.push(say('xo', 'marrowArmed'));
  }
  // A tractor beam or a shot at a clan ship is force, whatever it was meant to achieve.
  const tr = h.tractor.target;
  if (tr === 'kestrel' || tr === 'cruiser') {
    const c: Clan = tr === 'kestrel' ? 'rhune' : 'tarvo';
    s = patchShip(s, 'halcyon', { tractor: { target: null } });
    s = setFlag(s, 'usedForce');
    r.push(say('helm', 'tractorReleasedClan', vars(s, c)));
    s = setMemory(s, DELEGATE[c], 'walking', 1);
    s = setMemory(s, DELEGATE[c], 'walkTurn', s.turn);
    s = speak(s, c, 'forceWalkOut', r);
    s = setCounter(s, 'walker', c === 'rhune' ? 1 : 2);
    return setFlag(s, 'walkedOut');
  }
  const fired = s.counters.playerFiredTurn ?? -99;
  if (fired >= s.turn - 1 && !s.flags.firedSeen) {
    s = setFlag(s, 'firedSeen');
    s = setFlag(s, 'usedForce');
    for (const id of ['kestrel', 'cruiser'] as const) if (s.ships[id].destroyed) return setFlag(s, 'clanFired');
    const c: Clan = s.lastTarget === 'cruiser' ? 'tarvo' : 'rhune';
    s = speak(s, c, 'forceWalkOut', r);
    s = setCounter(s, 'walker', c === 'rhune' ? 1 : 2);
    return setFlag(s, 'walkedOut');
  }
  return s;
}

// ------------------------------------------------------------------ Commander Marrow ---

export const MARROW_TURNS = 2;

/** Send the XO for a quiet word away from the table (1 = Rhune, 2 = Tarvo, 3 = both). */
export function sendMarrow(s: WorldState, who: 1 | 2 | 3, ask: boolean, r: Report[]): WorldState {
  if (onTheIce(s)) {
    r.push(say('xo', 'marrowOnIce'));
    return s;
  }
  const cur = s.counters.marrowJob ?? 0;
  if (cur) {
    r.push(say('xo', 'marrowBusy', { left: s.counters.marrowLeft ?? 0 }));
    return s;
  }
  s = setCounter(s, 'marrowJob', who);
  // Going after a delegate who is walking out is a run to the airlock, not a coffee.
  const chasing = who !== 3 && walking(s, who === 1 ? 'rhune' : 'tarvo');
  s = setCounter(s, 'marrowLeft', chasing ? 1 : who === 3 ? MARROW_TURNS + 1 : MARROW_TURNS);
  s = setCounter(s, 'marrowAsk', ask ? 1 : 0);
  s = setFlag(s, 'usedMarrow');
  r.push(say('xo', chasing ? 'marrowChases' : 'marrowGoes', { who: who === 3 ? 'both delegates' : DELEGATE_SHORT[who === 1 ? 'rhune' : 'tarvo'], ask: ask ? 1 : 0 }));
  return s;
}

function marrowWork(s: WorldState, r: Report[]): WorldState {
  const job = s.counters.marrowJob ?? 0;
  if (!job) return s;
  const left = (s.counters.marrowLeft ?? 0) - 1;
  s = setCounter(s, 'marrowLeft', Math.max(0, left));
  if (left > 0) return s;
  s = setCounter(s, 'marrowJob', 0);
  const ask = !!s.counters.marrowAsk;
  const who: Clan[] = job === 3 ? ['rhune', 'tarvo'] : [job === 1 ? 'rhune' : 'tarvo'];
  for (const c of who) s = marrowTalk(s, c, ask, r);
  return s;
}

/** What a delegate says to the XO in a corridor that they will not say at the table. */
export function marrowTalk(s: WorldState, c: Clan, ask: boolean, r: Report[]): WorldState {
  const d = DELEGATE[c];
  s = setMemory(s, d, 'marrow', (dm(s, c).marrow ?? 0) + 1);
  if (walking(s, c)) {
    if (trustOf(s, c) >= 30 || !isHard(s, c)) {
      s = stopWalk(s, c);
      r.push(say('xo', 'marrowBringsBack', vars(s, c)));
    } else r.push(say('xo', 'marrowCouldNot', vars(s, c)));
    return s;
  }
  if (tabled(s, c)) {
    r.push(say('xo', 'marrowAlreadyTabled', vars(s, c)));
    return s;
  }
  if (saltglass(s).elderClan === c) s = revealFact(s, 'elder_ill');
  // A hardliner who is landing a claim listens to the XO only if he trusts the ISA a little.
  if (landing(s) > 0 && saltglass(s).hard === c && trustOf(s, c) >= 30) {
    s = recallLanding(s, c, r, true);
  }
  if (confided(s, c)) {
    if (ask && !hasLeave(s, c)) {
      if (trustOf(s, c) >= 40) {
        s = setMemory(s, d, 'leave', 1);
        r.push(say('xo', 'marrowLeaveGiven', vars(s, c)));
      } else r.push(say('xo', 'marrowLeaveRefused', vars(s, c)));
    } else r.push(say('xo', 'marrowAlreadyTold', { ...vars(s, c), leave: hasLeave(s, c) ? 1 : 0 }));
    return s;
  }
  const opens = !isHard(s, c) || trustOf(s, c) >= 40 || tabled(s, other(c));
  if (!opens) {
    s = trust(s, c, 8);
    s = setMemory(s, d, 'hinted', 1);
    r.push(say('xo', `marrowRebuffed_${interestOf(s, c)}`, vars(s, c)));
    return s;
  }
  s = setMemory(s, d, 'confided', 1);
  s = revealFact(s, `interest_${c}`);
  s = trust(s, c, 5);
  s = setFlag(s, 'marrowLearned');
  if (ask && trustOf(s, c) >= 45) s = setMemory(s, d, 'leave', 1);
  r.push(say('xo', `marrowLearned_${interestOf(s, c)}`, { ...vars(s, c), leave: hasLeave(s, c) ? 1 : 0 }));
  return s;
}

// ------------------------------------------------------------------ the ice ---

export const ICE_TURNS = 3;

/** Take both delegations down to Saltglass, with Marrow and a survey team, to stand on what they are arguing about. */
export function startIceTrip(s: WorldState, r: Report[]): WorldState {
  if (onTheIce(s)) {
    r.push(say('xo', 'iceAlready', { left: s.counters.iceTrip ?? 0 }));
    return s;
  }
  if (s.flags.walkedTheIce) {
    r.push(say('xo', 'iceDone'));
    return s;
  }
  if (landing(s) > 0) {
    r.push(say('xo', 'iceNotNow', vars(s, saltglass(s).hard)));
    return s;
  }
  if (CLANS.some((c) => walking(s, c))) {
    r.push(say('xo', 'iceNoOne'));
    return s;
  }
  const h = saltglass(s).hard;
  if (trustOf(s, h) < 25) {
    s = setFlag(s, 'iceRefused');
    r.push(say('xo', 'iceRefused', vars(s, h)));
    return s;
  }
  s = setCounter(s, 'iceTrip', ICE_TURNS);
  s = setFlag(s, 'improvised');
  s = setCounter(s, 'marrowJob', 0);
  for (const id of ['kestrel', 'cruiser'] as const) s = closeChannel(s, id);
  r.push(say('xo', 'iceGo'));
  return s;
}

function iceTrip(s: WorldState, r: Report[]): WorldState {
  const left = s.counters.iceTrip ?? 0;
  if (!left) return s;
  s = setCounter(s, 'iceTrip', left - 1);
  if (left - 1 > 0) return s;
  s = setFlag(s, 'walkedTheIce');
  for (const c of CLANS) s = trust(s, c, 10);
  const shown: Clan[] = [];
  for (const c of CLANS) {
    if (tabled(s, c)) continue;
    const need = interestOf(s, c);
    if (trustOf(s, c) >= (need === 'succession' ? 50 : isHard(s, c) ? 45 : 40)) {
      shown.push(c);
      s = putOnTable(s, c, r, 'ice');
    }
  }
  r.push(say('xo', 'iceBack', { shown: shown.length, a: shown[0] ? CLAN_NAME[shown[0]] : '', b: shown[1] ? CLAN_NAME[shown[1]] : '', aNeed: shown[0] ? interestOf(s, shown[0]) : '', bNeed: shown[1] ? interestOf(s, shown[1]) : '' }));
  return s;
}

// ------------------------------------------------------------------ talks without us ---

export const OWN_TURNS = 2;

function ownTalks(s: WorldState, r: Report[]): WorldState {
  const left = s.counters.ownTalks ?? 0;
  if (!left) return s;
  s = setCounter(s, 'ownTalks', left - 1);
  if (left - 1 > 0) {
    r.push(say('xo', 'ownTalksGoing'));
    return s;
  }
  return setFlag(s, 'accordOwn');
}

// ------------------------------------------------------------------ the hardliner's own plan ---

export const LAND_STAGES = 3;

function hardlinerClock(s: WorldState, r: Report[]): WorldState {
  const v = saltglass(s);
  const h = v.hard;
  const st = landing(s);
  if (st === 0) {
    if (s.turn < v.landTurn || standstill(s, h) || tabled(s, h) || walking(s, h) || onTheIce(s) || s.flags.landingRecalled) return s;
    s = setCounter(s, 'landing', 1);
    s = setFlag(s, 'landingLaunched');
    r.push(say('sensors', 'landingLaunched', vars(s, h)));
    s = speak(s, other(h), 'landingProtest', r);
    return s;
  }
  if (st >= LAND_STAGES) {
    s = setCounter(s, 'landing', LAND_STAGES + 1);
    r.push(say('sensors', 'landed', vars(s, h)));
    return setFlag(s, 'landed');
  }
  s = setCounter(s, 'landing', st + 1);
  r.push(say('sensors', 'landingProgress', { ...vars(s, h), left: LAND_STAGES - st }));
  return s;
}

/** The hardliner calls the hauler back (and, having done so, agrees to a standstill). */
export function recallLanding(s: WorldState, c: Clan, r: Report[], viaMarrow = false): WorldState {
  if (landing(s) <= 0 || saltglass(s).hard !== c) return s;
  s = setCounter(s, 'landing', 0);
  s = setFlag(s, 'landingRecalled');
  s = setMemory(s, DELEGATE[c], 'standstill', 1);
  r.push(say('sensors', 'landingRecalled', { ...vars(s, c), marrow: viaMarrow ? 1 : 0 }));
  return s;
}

// ------------------------------------------------------------------ the elder ---

export const elderTurn = (s: WorldState) => saltglass(s).elderTurn + (s.counters.elderBonus ?? 0);

function elderClock(s: WorldState, r: Report[]): WorldState {
  const v = saltglass(s);
  if (!v.elderClan || !elderAlive(s)) return s;
  const t = elderTurn(s);
  if (s.turn === t - 4 && knows(s, 'elder_ill')) r.push(say('medical', 'oseiElderWarn', vars(s, v.elderClan)));
  if (s.turn === t - 4 && !knows(s, 'elder_ill')) s = speak(s, v.elderClan, 'elderUrgent', r);
  if (s.turn < t) return s;
  s = patchCharacter(s, 'elder', { status: 'dead' });
  s = setCounter(s, 'elderDiedTurn', s.turn);
  r.push(say('comms', 'elderDied', vars(s, v.elderClan)));
  return setFlag(s, 'elderDied');
}

/** Dr. Osei crosses to the elder's ship with the clan's leave: more time, not a cure. */
export function treatElder(s: WorldState, r: Report[]): WorldState {
  const c = saltglass(s).elderClan;
  if (!c || !elderAlive(s)) return s;
  if (s.characters.elder.memory.treated) {
    r.push(say('medical', 'oseiAlreadyTreating', vars(s, c)));
    return s;
  }
  s = setMemory(s, 'elder', 'treated', 1);
  s = setCounter(s, 'elderBonus', 10);
  s = setFlag(s, 'oseiTreated');
  s = trust(s, c, 10);
  r.push(say('medical', 'oseiTreats', vars(s, c)));
  return s;
}

// ------------------------------------------------------------------ patience ---

function patienceClock(s: WorldState, r: Report[]): WorldState {
  for (const c of CLANS) {
    if (tabled(s, c) || walking(s, c)) continue;
    const drains = isHard(s, c) ? [8, 14, 20, 26] : [16, 26];
    if (!drains.includes(s.turn)) continue;
    s = speak(s, c, 'impatient', r);
    s = patience(s, c, -1, r);
  }
  return s;
}

function walkOuts(s: WorldState): WorldState {
  for (const c of CLANS) {
    if (!walking(s, c)) continue;
    if (s.turn > (dm(s, c).walkTurn ?? 0) + 1) {
      s = setCounter(s, 'walker', c === 'rhune' ? 1 : 2);
      return setFlag(s, 'walkedOut');
    }
  }
  return s;
}

export { DELEGATE_NAME };
