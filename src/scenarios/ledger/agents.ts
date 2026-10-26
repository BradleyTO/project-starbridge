/**
 * Ghost Ledger — the agents: four guests (each with something to hide, and one of them the thief),
 * the thief's own plan to get the copied keys off the ship, the courier's handler, and the
 * Halcyon's officers, each of whom can check one guest's story against a ship's system.
 * Deterministic: no randomness after setup.
 *
 * The case is decided by evidence, not demeanour: an innocent guest's confession and the thief's
 * cover story read exactly alike. Only the ship's logs tell them apart.
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { addTension, knows, patchShip, revealFact, setCounter, setFlag, setMemory } from '../../engine/state';
import type { Guest } from './setup';
import { CHECKER, CHECK_SOURCE, COURIER, DEVICE, DEVICE_TEXT, GUESTS, GUEST_NAME, GUEST_SHORT, PACKET, PRONOUN, SECRET, clock, ledger } from './setup';
import { ACCUSE, ASKWHERE, BLACKOUT, CASE, CONFRONT, COPYTIME, DELAY, DEVICE as DEVICE_RE, DOORS, FEED, FORCE, FOSSE, HUNCH, INTERVIEW, KRENN, PLACE_FOSSE, PLACE_KRENN, PLACE_SALLOW, PLACE_VESK, REKEY, SALLOW, SEARCH, STORY, VERIFY, VESK, WATCH } from './words';

export const gm = (s: WorldState, g: Guest) => s.characters[g].memory;
export const isCulprit = (s: WorldState, g: Guest) => ledger(s).culprit === g;
export const covers = (s: WorldState, g: Guest) => {
  const v = ledger(s);
  return v.out[g] <= v.copyMin && v.copyMin <= v.back[g];
};
export const placedKnown = (s: WorldState) => knows(s, 'copyTime') && knows(s, 'doors');
export const cleared = (s: WorldState, g: Guest) => !isCulprit(s, g) && !!gm(s, g).checked;
/** The culprit's cover story has been told and checked against the ship's logs. */
export const lieBroken = (s: WorldState) => {
  const c = ledger(s).culprit;
  return !!gm(s, c).checked && !!gm(s, c).admitted;
};
export function excluded(s: WorldState, g: Guest): boolean {
  if (cleared(s, g)) return true;
  if (placedKnown(s) && !covers(s, g)) return true;
  if (knows(s, 'device') && DEVICE[g] !== DEVICE[ledger(s).culprit]) return true;
  return false;
}
export const suspects = (s: WorldState) => GUESTS.filter((g) => !excluded(s, g));
/** Evidence pointing at the culprit: placed at the time, the device class, a broken story. */
export const items = (s: WorldState) => (placedKnown(s) && covers(s, ledger(s).culprit) ? 1 : 0) + (knows(s, 'device') ? 1 : 0) + (lieBroken(s) ? 1 : 0);
/** The evidence points to one guest alone, by at least two independent lines. */
export const proven = (s: WorldState) => {
  const left = suspects(s);
  return left.length === 1 && left[0] === ledger(s).culprit && items(s) >= 2;
};

const END_FLAGS = ['endUnmasked', 'endFeed', 'endQuiet', 'endCaught', 'endRekeyed', 'endHunch', 'endWrong', 'endKeysGone', 'endHarmed', 'endIncident'] as const;
/** The case is over, one way or another (the outcome is detected from these flags). */
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
export const departAt = (s: WorldState) => ledger(s).departTurn + (s.counters.delay ?? 0);
export const current = (s: WorldState): Guest | null => GUESTS[(s.counters.current ?? 0) - 1] ?? null;
const setCurrent = (s: WorldState, g: Guest) => setCounter(s, 'current', GUESTS.indexOf(g) + 1);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export const gvars = (s: WorldState, g: Guest): Record<string, string | number> => {
  const v = ledger(s);
  return {
    guest: g,
    name: GUEST_NAME[g],
    short: GUEST_SHORT[g],
    sub: PRONOUN[g].sub,
    obj: PRONOUN[g].obj,
    pos: PRONOUN[g].pos,
    secret: SECRET[g],
    source: CHECK_SOURCE[g],
    out: clock(v.out[g]),
    back: clock(v.back[g]),
  };
};

/** Who the captain means: a guest named in the words, else the guest in the room. */
export function guestIn(s: WorldState, t: string): Guest | null {
  const named = GUESTS.filter((g) => ({ krenn: KRENN, vesk: VESK, sallow: SALLOW, fosse: FOSSE })[g].test(t));
  if (named.length === 1) return named[0];
  if (named.length > 1) return null;
  if (/\b(him|her|them|he|she|his|this guest|the guest)\b/.test(t) || STORY.test(t) || CONFRONT.test(t) || ASKWHERE.test(t)) return current(s);
  return null;
}
const placeGuest = (t: string): Guest | null => (PLACE_KRENN.test(t) ? 'krenn' : PLACE_VESK.test(t) ? 'vesk' : PLACE_SALLOW.test(t) ? 'sallow' : PLACE_FOSSE.test(t) ? 'fosse' : null);

/** A guest speaks, in person (voiced as that guest). */
export const guestSays = (s: WorldState, g: Guest, key: string, r: Report[], extra: Record<string, string | number> = {}) => {
  r.push(comms(g, key, { ...gvars(s, g), ...extra }));
  return s;
};

// ------------------------------------------------------------------ the evidence ---

export function copyTime(s: WorldState, r: Report[]): WorldState {
  if (knows(s, 'copyTime')) {
    r.push(say('sensors', 'copyTimeAgain', { time: clock(ledger(s).copyMin) }));
    return s;
  }
  s = revealFact(s, 'copyTime');
  r.push(say('sensors', 'copyTimeFound', { time: clock(ledger(s).copyMin) }));
  return placedNote(s, r);
}

export function doorLogs(s: WorldState, r: Report[]): WorldState {
  const v = ledger(s);
  const lines = GUESTS.map((g) => `${GUEST_SHORT[g]} out at ${clock(v.out[g])}, back at ${clock(v.back[g])}`).join('; ');
  if (knows(s, 'doors')) {
    r.push(say('tactical', 'doorsAgain', { lines }));
    return s;
  }
  s = revealFact(s, 'doors');
  r.push(say('tactical', 'doorsFound', { lines }));
  return placedNote(s, r);
}

function placedNote(s: WorldState, r: Report[]): WorldState {
  if (!placedKnown(s) || s.flags.placedNoted) return s;
  const v = ledger(s);
  const out = GUESTS.filter((g) => covers(s, g)).map((g) => GUEST_SHORT[g]);
  r.push(say('tactical', 'placedNote', { time: clock(v.copyMin), out: list(out), n: out.length }));
  return setFlag(s, 'placedNoted');
}

export function deviceTrace(s: WorldState, r: Report[]): WorldState {
  const d = DEVICE_TEXT[DEVICE[ledger(s).culprit]];
  if (knows(s, 'device')) {
    r.push(say('sensors', 'deviceAgain', { device: d }));
    return s;
  }
  s = revealFact(s, 'device');
  r.push(say('sensors', 'deviceFound', { device: d }));
  return s;
}

export function caseVars(s: WorldState): Record<string, string | number> {
  const left = suspects(s);
  const known: string[] = [];
  if (knows(s, 'copyTime')) known.push(`the copy at ${clock(ledger(s).copyMin)}`);
  if (knows(s, 'doors')) known.push('the badge logs');
  if (knows(s, 'device')) known.push(`the port trace (${DEVICE_TEXT[DEVICE[ledger(s).culprit]]})`);
  const ok = GUESTS.filter((g) => cleared(s, g)).map((g) => GUEST_SHORT[g]);
  if (ok.length) known.push(`${list(ok)} checked out`);
  if (lieBroken(s)) known.push(`${GUEST_SHORT[ledger(s).culprit]}’s story does not hold up`);
  return { known: known.length ? list(known) : 'nothing yet beyond the theft', left: list(left.map((g) => GUEST_SHORT[g])), n: left.length, proven: proven(s) ? 1 : 0, culprit: GUEST_SHORT[ledger(s).culprit] };
}

// ------------------------------------------------------------------ the guests ---

export function interview(s: WorldState, g: Guest, r: Report[]): WorldState {
  s = setCurrent(s, g);
  s = setFlag(s, 'interviewed');
  if (gm(s, g).admitted) return guestSays(s, g, 'storyAgain', r);
  if (!gm(s, g).claimed) {
    s = setMemory(s, g, 'claimed', 1);
    return guestSays(s, g, 'claim', r);
  }
  return guestSays(s, g, 'stillClaims', r);
}

/** Confront a guest with the badge logs: an innocent tells the truth; the thief tells a story that sounds just like it. */
export function confront(s: WorldState, g: Guest, r: Report[]): WorldState {
  s = setCurrent(s, g);
  s = setMemory(s, g, 'claimed', 1);
  if (gm(s, g).admitted) return guestSays(s, g, 'storyAgain', r);
  if (!knows(s, 'doors')) {
    s = guestSays(s, g, 'showMe', r);
    r.push(say('tactical', 'needDoors'));
    return s;
  }
  s = setMemory(s, g, 'admitted', 1);
  s = revealFact(s, `story_${g}`);
  s = setFlag(s, 'confronted');
  s = guestSays(s, g, `admit_${isCulprit(s, g) ? ledger(s).culprit : g}`, r);
  if (gm(s, g).checked) {
    // The log was already pulled: it answers the story at once.
    if (isCulprit(s, g)) {
      s = revealFact(s, `checked_${g}`);
      r.push(say(CHECKER[g], 'checkBreaks', gvars(s, g)));
    }
    return s;
  }
  r.push(say(CHECKER[g], 'canCheck', gvars(s, g)));
  return s;
}

export function askWhere(s: WorldState, g: Guest, r: Report[]): WorldState {
  s = setCurrent(s, g);
  if (gm(s, g).admitted) return guestSays(s, g, 'storyAgain', r);
  s = setMemory(s, g, 'claimed', 1);
  s = guestSays(s, g, 'claim', r);
  if (knows(s, 'doors')) r.push(say('tactical', 'badgeSays', gvars(s, g)));
  return s;
}

/** Check a guest's story against the ship's own record (or, for Mr Vesk, the packet master). */
export function verify(s: WorldState, g: Guest, r: Report[], viaMoll = false): WorldState {
  const already = !!gm(s, g).checked;
  s = setMemory(s, g, 'checked', 1);
  s = setFlag(s, 'checkedStory');
  s = setCounter(s, 'checks', (s.counters.checks ?? 0) + (already ? 0 : 1));
  const who = viaMoll ? null : CHECKER[g];
  if (!isCulprit(s, g)) {
    s = revealFact(s, `story_${g}`);
    s = revealFact(s, `checked_${g}`);
    if (who) r.push(say(who, 'checkClears', gvars(s, g)));
    return s;
  }
  if (gm(s, g).admitted) {
    s = revealFact(s, `checked_${g}`);
    if (who) r.push(say(who, 'checkBreaks', gvars(s, g)));
    return s;
  }
  if (who) r.push(say(who, 'checkEmpty', gvars(s, g)));
  return s;
}

export function search(s: WorldState, g: Guest, r: Report[]): WorldState {
  s = setCurrent(s, g);
  s = setMemory(s, g, 'searched', 1);
  if (!isCulprit(s, g)) {
    s = setFlag(s, 'searchedWithConsent');
    s = guestSays(s, g, 'searchConsents', r);
    r.push(say('tactical', 'searchClean', gvars(s, g)));
    if (g === 'sallow') s = verify(s, 'sallow', [], true);
    return s;
  }
  if (proven(s) || s.flags.caught) {
    s = setFlag(s, 'shardFound');
    s = guestSays(s, g, 'searchCornered', r);
    r.push(say('tactical', 'searchFound', { ...gvars(s, g), device: DEVICE_TEXT[DEVICE[g]] }));
    return s;
  }
  s = guestSays(s, g, 'searchRefuses', r);
  r.push(say('tactical', 'refusalNotProof', gvars(s, g)));
  return s;
}

export function accuse(s: WorldState, g: Guest | null, r: Report[]): WorldState {
  if (!g) {
    r.push(say('tactical', 'accuseWho'));
    return s;
  }
  const v = ledger(s);
  s = setCurrent(s, g);
  if (g === v.culprit && proven(s)) {
    s = setFlag(s, 'accusedWithProof');
    s = guestSays(s, g, 'unmasked', r);
    return setFlag(s, 'endUnmasked');
  }
  if (!s.flags.accuseWarned) {
    s = setFlag(s, 'accuseWarned');
    s = setCounter(s, 'accusePending', GUESTS.indexOf(g) + 1);
    r.push(say('tactical', proven(s) ? 'accuseOther' : 'accuseCaution', { ...caseVars(s), short: GUEST_SHORT[g] }));
    return s;
  }
  s = setFlag(s, 'accusedUnproven');
  s = setFlag(s, 'accusedWho_' + g);
  if (g === v.culprit) {
    s = guestSays(s, g, 'deniesFlat', r);
    return setFlag(s, 'endHunch');
  }
  s = guestSays(s, g, 'wronglyAccused', r);
  return setFlag(s, 'endWrong');
}

export function forceOn(s: WorldState, g: Guest | null, r: Report[]): WorldState {
  if (!s.flags.forceWarned) {
    s = setFlag(s, 'forceWarned');
    r.push(say('tactical', 'forceCaution', { short: g ? GUEST_SHORT[g] : 'a guest' }));
    return s;
  }
  const who = g ?? current(s) ?? ledger(s).decoy;
  s = setMemory(s, who, 'harmed', 1);
  s = setFlag(s, 'harmedGuest');
  s = setFlag(s, `harmed_${who}`);
  return setFlag(s, 'endHarmed');
}

// ------------------------------------------------------------------ the ship ---

export function watchComms(s: WorldState, r: Report[]): WorldState {
  if (s.flags.watching) {
    r.push(say('comms', 'watchingAlready'));
    return s;
  }
  s = setFlag(s, 'watching');
  r.push(say('comms', 'watching'));
  return s;
}

export function blackout(s: WorldState, r: Report[]): WorldState {
  if (s.flags.blackout) {
    r.push(say('comms', 'blackoutAlready'));
    return s;
  }
  s = setFlag(s, 'blackout');
  s = addTension(s, 5);
  r.push(say('comms', 'blackoutOn'));
  return guestSays(s, 'krenn', 'blackoutProtest', r);
}

export function rekey(s: WorldState, r: Report[]): WorldState {
  if (s.flags.rekeyed || (s.counters.rekeyAt ?? 0) > 0) {
    r.push(say('engineering', 'rekeyAlready'));
    return s;
  }
  s = setCounter(s, 'rekeyAt', s.turn + 3);
  r.push(say('engineering', 'rekeyStart', { feed: (s.counters.feedAt ?? 0) > 0 || s.flags.counterFed ? 1 : 0 }));
  return s;
}

export function counterFeed(s: WorldState, r: Report[]): WorldState {
  if (s.flags.counterFed || (s.counters.feedAt ?? 0) > 0) {
    r.push(say('tactical', 'feedAlready'));
    return s;
  }
  if (!proven(s) && !s.flags.caught) {
    r.push(say('tactical', 'feedNeedsProof', caseVars(s)));
    return s;
  }
  s = setCounter(s, 'feedAt', s.turn + 2);
  r.push(say('tactical', 'feedStart', caseVars(s)));
  return s;
}

export function delay(s: WorldState, r: Report[]): WorldState {
  if (s.flags.delayed) {
    r.push(say('xo', 'delayAgain'));
    return s;
  }
  s = setFlag(s, 'delayed');
  s = setCounter(s, 'delay', 6);
  s = addTension(s, 5);
  r.push(say('xo', 'delayed', { left: departAt(s) - s.turn }));
  return guestSays(s, 'krenn', 'delayProtest', r);
}

/** Every order in the investigation (the interpreter hands them over as improvised orders). */
export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  if (settled(s)) {
    r.push(say('xo', 'afterCase'));
    return s;
  }
  const g = guestIn(s, t);
  if (FORCE.test(t)) return forceOn(s, g, r);
  if (FEED.test(t)) return counterFeed(s, r);
  if (REKEY.test(t)) return rekey(s, r);
  if (BLACKOUT.test(t) && !WATCH.test(t)) return blackout(s, r);
  if (WATCH.test(t)) return watchComms(s, r);
  if (DELAY.test(t)) return delay(s, r);
  if (ACCUSE.test(t)) return accuse(s, g, r);
  if (SEARCH.test(t)) return g ? search(s, g, r) : (r.push(say('tactical', 'searchWho')), s);
  if (g && CONFRONT.test(t)) return confront(s, g, r);
  if (g && ASKWHERE.test(t)) return askWhere(s, g, r);
  if (COPYTIME.test(t)) return copyTime(s, r);
  if (DEVICE_RE.test(t)) return deviceTrace(s, r);
  if (DOORS.test(t)) return doorLogs(s, r);
  const place = placeGuest(t);
  if (place) return verify(s, place, r);
  if (g && VERIFY.test(t)) return verify(s, g, r);
  if (g && ASKWHERE.test(t)) return askWhere(s, g, r);
  if (g && INTERVIEW.test(t)) return interview(s, g, r);
  if (g) return interview(s, g, r);
  r.push(say('xo', 'ledgerUnclear', { description: raw.slice(0, 80) }));
  return s;
}

/** Questions for the bridge: Rask's case board, his hunch, or the evidence itself. */
export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const t = raw.toLowerCase();
  if (settled(s)) {
    r.push(say('xo', 'afterCase'));
    return s;
  }
  if (HUNCH.test(t)) {
    const v = ledger(s);
    s = setFlag(s, 'askedHunch');
    r.push(say('tactical', 'hunch', { short: GUEST_SHORT[v.hunchRight ? v.culprit : v.decoy] }));
    return s;
  }
  if (COPYTIME.test(t)) return copyTime(s, r);
  if (DEVICE_RE.test(t)) return deviceTrace(s, r);
  if (DOORS.test(t)) return doorLogs(s, r);
  if (CASE.test(t)) {
    s = setFlag(s, 'askedCase');
    r.push(say('tactical', 'caseBoard', caseVars(s)));
    return s;
  }
  r.push(say('xo', 'marrowRead', { left: departAt(s) - s.turn }));
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
  run(forceChecks);
  run(work);
  run(burst);
  run(departure);
  return { state: s, reports };
}

function housekeeping(s: WorldState): WorldState {
  // Both ships are docked alongside until they sail; nothing out here moves.
  for (const id of ['kestrel', 'cruiser'] as const) if (!s.ships[id].destroyed && (s.ships[id].nav || s.ships[id].velocity.x || s.ships[id].velocity.y)) s = patchShip(s, id, { nav: null, velocity: { x: 0, y: 0 } });
  return s;
}

function forceChecks(s: WorldState, r: Report[]): WorldState {
  const h = s.ships.halcyon;
  const tr = h.tractor.target;
  if (tr === 'kestrel' || tr === 'cruiser') {
    s = patchShip(s, 'halcyon', { tractor: { target: null } });
    s = setFlag(s, 'usedForce');
    if (tr === 'cruiser') {
      r.push(say('xo', 'tractorCourier'));
      return setFlag(s, 'endIncident');
    }
    r.push(say('xo', 'tractorPacket'));
    return s;
  }
  const fired = s.counters.playerFiredTurn ?? -99;
  if (fired >= s.turn - 1 && !s.flags.firedSeen) {
    s = setFlag(s, 'firedSeen');
    s = setFlag(s, 'usedForce');
    return setFlag(s, 'endIncident');
  }
  return s;
}

function work(s: WorldState, r: Report[]): WorldState {
  const rk = s.counters.rekeyAt ?? 0;
  if (rk > 0 && s.turn >= rk && !s.flags.rekeyed) {
    s = setFlag(s, 'rekeyed');
    r.push(say('engineering', 'rekeyDone'));
  }
  const fd = s.counters.feedAt ?? 0;
  if (fd > 0 && s.turn >= fd && !s.flags.counterFed) {
    s = setFlag(s, 'counterFed');
    r.push(say('tactical', 'feedDone', { short: GUEST_SHORT[ledger(s).culprit] }));
  }
  const left = departAt(s) - s.turn;
  if (left === 3 && !s.flags.departWarned) {
    s = setFlag(s, 'departWarned');
    r.push(say('xo', 'departSoon', { courier: COURIER, packet: PACKET }));
  }
  return s;
}

function burst(s: WorldState, r: Report[]): WorldState {
  const v = ledger(s);
  if (v.exfil !== 'burst' || s.turn !== v.burstTurn || s.flags.burstDone) return s;
  s = setFlag(s, 'burstDone');
  const c = v.culprit;
  if (s.flags.blackout) {
    s = setFlag(s, 'burstBlocked');
    r.push(say('comms', 'burstBlocked', gvars(s, c)));
    return s;
  }
  if (s.flags.counterFed) {
    s = setFlag(s, 'feedSent');
    r.push(say('comms', 'burstFalse', gvars(s, c)));
    return setFlag(s, 'endFeed');
  }
  if (s.flags.watching) {
    s = setFlag(s, 'caught');
    r.push(say('comms', 'burstCaught', gvars(s, c)));
    s = guestSays(s, c, 'caughtOut', r);
    return setFlag(s, 'endCaught');
  }
  if (s.flags.rekeyed) return setFlag(s, 'burstWorthless');
  return setFlag(s, 'endKeysGone');
}

function departure(s: WorldState, r: Report[]): WorldState {
  if (s.turn < departAt(s)) return s;
  s = setFlag(s, 'departed');
  if (s.flags.counterFed) {
    s = setFlag(s, 'feedSent');
    return setFlag(s, 'endFeed');
  }
  if (s.flags.rekeyed) return setFlag(s, 'endRekeyed');
  r.push(say('xo', 'departedKeys'));
  return setFlag(s, 'endKeysGone');
}

// ------------------------------------------------------------------ the radio ---

export const BRANDY = /\b(brandy|cargo|lift|manifest|cases|crates|vesk|dorran|broker|smuggl\w*|transfer|shipment|loaded)\b/;
export const ACCUSE_COURIER = /\b(your (agent|people|guest|spy|attach[eé]|courier|service|government)|took|stole|steal|copied|copy|keys|thief|theft|we know|caught|spying|espionage|krenn|vesk|sallow|fosse)\b/;

export function mollRespond(s: WorldState, t: string, r: Report[]): WorldState {
  if (!BRANDY.test(t)) {
    r.push(comms('moll', 'mollSmall'));
    return s;
  }
  s = setFlag(s, 'askedMoll');
  if (isCulprit(s, 'vesk')) {
    r.push(comms('moll', 'mollNothing'));
    return verify(s, 'vesk', r, true);
  }
  r.push(comms('moll', 'mollBrandy', gvars(s, 'vesk')));
  return verify(s, 'vesk', r, true);
}

export function thorneRespond(s: WorldState, t: string, r: Report[], quiet: RegExp, offrec: RegExp): WorldState {
  if (offrec.test(t)) s = setFlag(s, 'offRecordSaid');
  const mem = s.characters.thorne.memory;
  if (mem.offered && quiet.test(t)) {
    s = setFlag(s, 'quietDeal');
    if (s.flags.offRecordSaid) s = setFlag(s, 'offRecord');
    r.push(comms('thorne', 'thorneDeal', { ...gvars(s, ledger(s).culprit), offRec: s.flags.offRecord ? 1 : 0 }));
    return setFlag(s, 'endQuiet');
  }
  if (ACCUSE_COURIER.test(t)) {
    if (proven(s) || s.flags.caught) {
      s = setMemory(s, 'thorne', 'offered', 1);
      r.push(comms('thorne', 'thorneOffer', gvars(s, ledger(s).culprit)));
      return s;
    }
    s = setMemory(s, 'thorne', 'denied', (mem.denied ?? 0) + 1);
    s = addTension(s, 5);
    s = setFlag(s, 'accusedCourier');
    r.push(comms('thorne', 'thorneDenies'));
    return s;
  }
  r.push(comms('thorne', mem.offered ? 'thorneWaits' : 'thorneSmall'));
  return s;
}
