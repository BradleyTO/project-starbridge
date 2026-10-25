/**
 * Ion Season — the storm and the people in it: charge building on every hull at a band's edge and
 * in rough water; the two hauler captains (one may be unfit to fly the Maw, and Captain Teague will
 * not wait for ever); Ensign Adeyemi's feel for the water, Lt. Varga's model, the probes; and what
 * happens to a hauler that goes dark in the storm. Deterministic: no randomness after setup.
 *
 * The convoy crosses one band at a time, in the channel the captain chooses. One channel in each
 * band is calm and one is rough, and nobody aboard can see which. Every source of information is
 * partial: the helmsman's feel is right once he has felt the band but is hard to get out of him if
 * he is unsure of himself; the model is only firm where the buoys still report; a probe is certain
 * but costs time; the hauler captains know the Fringe, and one of them may be in no state to know
 * anything.
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, patchCharacter, patchShip, revealFact, setCounter, setFlag, setMemory } from '../../engine/state';
import { commsOf } from '../../engine/comms';
import { deriveStatus } from '../../engine/rules';
import type { Channel, Hauler } from './setup';
import { BAND_NAME, CAPTAIN, CAPTAIN_NAME, CAPTAIN_SHORT, HAULERS, MATE_NAME, PRONOUN, SHIP_NAME, SLOT, ion, otherCh } from './setup';

const K = (h: Hauler) => (h === 'mule' ? 'Mule' : 'Gannet');
export const band = (s: WorldState) => s.counters.band ?? 0;
export const edge = (s: WorldState) => s.counters.edge ?? 0;
export const through = (s: WorldState) => band(s) >= 3;
export const charge = (s: WorldState, h: Hauler) => s.counters[`charge${K(h)}`] ?? 0;
export const chargeH = (s: WorldState) => s.counters.chargeH ?? 0;
export const adrift = (s: WorldState, h: Hauler) => (s.counters[`adrift${K(h)}`] ?? 0) > 0;
export const crewOff = (s: WorldState, h: Hauler) => !!s.flags[`crewOff${K(h)}`];
export const crewLost = (s: WorldState, h: Hauler) => !!s.flags[`lost${K(h)}`];
/** The hauler itself was left behind in the storm (crew taken off, or not). */
export const shipLeft = (s: WorldState, h: Hauler) => !!s.flags[`left${K(h)}`];
export const alone = (s: WorldState) => !!s.flags.teagueAlone;
export const towed = (s: WorldState, h: Hauler) => s.ships.halcyon.tractor.target === SLOT[h];
export const cm = (s: WorldState, h: Hauler) => s.characters[CAPTAIN[h]].memory;
export const isUnfit = (s: WorldState, h: Hauler) => ion(s).unfit === h;
export const relieved = (s: WorldState, h: Hauler) => !!cm(s, h).relieved;
export const remote = (s: WorldState, h: Hauler) => !!cm(s, h).remote;
/** An unfit master's ship is in safe hands: the mate has the helm, the Halcyon flies it, or it is under tow. */
export const handled = (s: WorldState, h: Hauler) => relieved(s, h) || remote(s, h) || towed(s, h);
export const unfitUnhandled = (s: WorldState, h: Hauler) => isUnfit(s, h) && !handled(s, h);
/** Still flying with the convoy (not lost, not left behind, not off on her own). */
export const inConvoy = (s: WorldState, h: Hauler) => !crewLost(s, h) && !shipLeft(s, h) && !(h === 'gannet' && alone(s));
export const captainAlive = (s: WorldState, h: Hauler) => s.characters[CAPTAIN[h]].status !== 'dead';
/** Through the Maw, but a hauler went dark on the way out with her crew still aboard: they need taking off. */
export const stranded = (s: WorldState) => !s.outcome && through(s) && !s.flags.halcyonDark && HAULERS.some((h) => adrift(s, h) && !towed(s, h) && !crewOff(s, h) && !crewLost(s, h) && !shipLeft(s, h));
export const over = (s: WorldState) => !stranded(s) && !!(s.outcome || through(s) || s.flags.turnedBack || s.flags.leftStorm || s.flags.halcyonDark);
export const isSpate = (s: WorldState) => ion(s).season === 'spate';

/** The Maw in a spate season: both channels rough, except in a lull. */
export const spateMaw = (s: WorldState, b = band(s)) => isSpate(s) && b === 2;
export function lullActive(s: WorldState): boolean {
  if (!spateMaw(s)) return false;
  const L = ion(s).lullAt;
  const e = edge(s);
  return e === L || e === L + 1 || e === L + 4 || e === L + 5;
}
/** Is this channel calm right now in the current band? */
export function calmNow(s: WorldState, c: Channel, b = band(s)): boolean {
  const v = ion(s);
  if (spateMaw(s, b)) return lullActive(s) && c === v.calm[2];
  return c === v.calm[b];
}

export type GutRead = { kind: 'unsure' } | { kind: 'lean'; ch: Channel } | { kind: 'lullComing'; ch: Channel; mins: number } | { kind: 'lullNow'; ch: Channel } | { kind: 'rough'; ch: Channel; mins: number };
/** What Ensign Adeyemi actually feels (always right, once he has felt the band). */
export function gutRead(s: WorldState): GutRead {
  const v = ion(s);
  const b = band(s);
  if (b >= 3) return { kind: 'lean', ch: 'high' };
  if (v.blind === b && edge(s) < 1) return { kind: 'unsure' };
  if (spateMaw(s)) {
    if (lullActive(s)) return { kind: 'lullNow', ch: v.calm[2] };
    const e = edge(s);
    const L = v.lullAt;
    if (e < L) return { kind: 'lullComing', ch: v.calm[2], mins: L - e };
    if (e < L + 4) return { kind: 'lullComing', ch: v.calm[2], mins: L + 4 - e };
    return { kind: 'rough', ch: v.calm[2], mins: 0 };
  }
  return { kind: 'lean', ch: v.calm[b] };
}
/** The storm model's line for this band (firm where the buoys still report; soft and often wrong elsewhere). */
export function modelLine(s: WorldState, b = band(s)): { ch: Channel; firm: boolean; bothRough: boolean } {
  const v = ion(s);
  const bb = Math.min(b, 2);
  const ch = v.firm[bb] ? v.calm[bb] : v.wrong[bb] ? otherCh(v.calm[bb]) : v.calm[bb];
  return { ch, firm: v.firm[bb], bothRough: spateMaw(s, bb) };
}
export const chCode = (c: Channel) => (c === 'high' ? 1 : 2);
export const chOf = (n: number): Channel | null => (n === 1 ? 'high' : n === 2 ? 'low' : null);
/** The channel Adeyemi has named for this band, if any (his own feel or his guess). */
export const gutLean = (s: WorldState): Channel | null => ((s.counters.gutBand ?? 0) === band(s) + 1 ? chOf(s.counters.gutCh ?? 0) : null);
export const probeLean = (s: WorldState): Channel | null => {
  if ((s.counters.probedBand ?? 0) !== band(s) + 1) return null;
  const c = chOf(s.counters.probedCh ?? 0);
  if (!c) return null;
  return (s.counters.probedRes ?? 0) === 1 ? c : otherCh(c);
};
/** Has the captain asked anyone anything about this band before crossing it? */
export function consulted(s: WorldState): boolean {
  const n = band(s) + 1;
  return ['gutAsked', 'modelBand', 'probeAsked', 'loreBand'].some((k) => (s.counters[k] ?? 0) === n);
}

export function vars(s: WorldState, h: Hauler, extra: Record<string, string | number> = {}): Record<string, string | number> {
  return { ship: SHIP_NAME[h], name: CAPTAIN_NAME[h], short: CAPTAIN_SHORT[h], mate: MATE_NAME[h], sub: PRONOUN[h].sub, obj: PRONOUN[h].obj, pos: PRONOUN[h].pos, hauler: h, band: BAND_NAME[Math.min(band(s), 2)], ...extra };
}

/** A hauler captain speaks on the convoy net (voiced as that captain). */
export function speak(s: WorldState, h: Hauler, key: string, r: Report[], extra: Record<string, string | number> = {}): WorldState {
  if (!captainAlive(s, h)) return s;
  r.push(comms(CAPTAIN[h], key, vars(s, h, extra)));
  s = setMemory(s, CAPTAIN[h], 'spoke', (cm(s, h).spoke ?? 0) + 1);
  const cs = commsOf(s);
  return { ...s, comms: { ...cs, history: [...cs.history, { from: SLOT[h], intents: [], text: key, time: s.time, turn: s.turn }].slice(-40) } };
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
export function addCharge(s: WorldState, h: Hauler, n: number): WorldState {
  return setCounter(s, `charge${K(h)}`, clamp(Math.round(charge(s, h) + n), 0, 150));
}
export function addChargeH(s: WorldState, n: number): WorldState {
  return setCounter(s, 'chargeH', clamp(Math.round(chargeH(s) + n), 0, 150));
}

/** A hauler's charge has reached the point where everything aboard goes dark. */
function goAdrift(s: WorldState, h: Hauler, r: Report[]): WorldState {
  if (adrift(s, h) || crewLost(s, h) || shipLeft(s, h)) return s;
  s = setCounter(s, `adrift${K(h)}`, 1);
  s = setCounter(s, `clock${K(h)}`, 5);
  s = setFlag(s, 'anyAdrift');
  s = patchShip(s, SLOT[h], { disposition: 'distressed', systems: { ...s.ships[SLOT[h]].systems, engines: { health: 100, power: 0, status: deriveStatus({ health: 100, power: 0 }) }, lifeSupport: { health: 100, power: 30, status: deriveStatus({ health: 100, power: 30 }) } } });
  r.push(say('sensors', 'haulerAdrift', vars(s, h, { crew: s.ships[SLOT[h]].souls })));
  return s;
}

/** Everyone aboard an adrift hauler has died (their battery air ran out, or they were left behind). */
export function loseCrew(s: WorldState, h: Hauler, r: Report[], key = 'crewLost'): WorldState {
  if (crewLost(s, h)) return s;
  const aboard = s.characters[CAPTAIN[h]].ship === SLOT[h];
  s = setFlag(s, `lost${K(h)}`);
  s = setFlag(s, 'crewLostAny');
  s = setCounter(s, 'soulsLost', (s.counters.soulsLost ?? 0) + s.ships[SLOT[h]].souls);
  s = patchShip(s, SLOT[h], { souls: 0, disposition: 'neutral' });
  r.push(say('sensors', key, vars(s, h)));
  if (aboard) s = patchCharacter(s, CAPTAIN[h], { status: 'dead', memory: { ...cm(s, h), deathTurn: s.turn } });
  return s;
}

function maybeAdrift(s: WorldState, r: Report[]): WorldState {
  for (const h of HAULERS) if (inConvoy(s, h) && charge(s, h) >= 100) s = goAdrift(s, h, r);
  if (chargeH(s) >= 100 && !s.flags.halcyonDark) {
    s = setFlag(s, 'halcyonDark');
    r.push(say('engineering', 'halcyonDark'));
  }
  return s;
}

// --------------------------------------------------------------- Teague on her own ---

/** Captain Teague runs her own line from the current band; her fate is fixed now and heard later. */
function teagueBreaks(s: WorldState, r: Report[]): WorldState {
  const v = ion(s);
  let c = charge(s, 'gannet');
  const unfit = unfitUnhandled(s, 'gannet');
  for (let b = band(s); b < 3; b++) {
    const lean = v.teagueLean[b];
    const rough = (unfit && b === 2) || (isSpate(s) && b === 2) || lean !== v.calm[b];
    c += rough ? 30 + (unfit ? 12 : 0) : 4 + (unfit ? 1 : 0);
  }
  s = setFlag(s, 'teagueAlone');
  s = setCounter(s, 'teagueEta', 2);
  s = setCounter(s, 'teagueFate', c >= 100 ? 2 : 1);
  s = speak(s, 'gannet', 'teagueGoes', r, { lean: v.teagueLean[band(s)] });
  r.push(say('helm', 'teagueGone', vars(s, 'gannet')));
  return s;
}

export function resolveTeague(s: WorldState, r: Report[]): WorldState {
  if (!alone(s) || s.flags.teagueResolved) return s;
  s = setFlag(s, 'teagueResolved');
  s = setCounter(s, 'teagueEta', 0);
  if ((s.counters.teagueFate ?? 1) === 2) {
    s = setFlag(s, 'teagueLostAlone');
    return loseCrew(s, 'gannet', r, 'teagueLost');
  }
  s = setFlag(s, 'teagueThrough');
  return speak(s, 'gannet', 'teagueMadeIt', r);
}

// --------------------------------------------------------------- the crossing ---

/** The convoy crosses the current band in channel `ch`. */
export function cross(s: WorldState, ch: Channel, r: Report[], how: 'gut' | 'model' | 'probe' | 'own' | 'lull' = 'own'): WorldState {
  const v = ion(s);
  const b = band(s);
  const calm = calmNow(s, ch);
  const lull = spateMaw(s) && lullActive(s);
  const gut = gutLean(s);
  const model = modelLine(s);
  if (!consulted(s)) s = setCounter(s, 'blindCrossings', (s.counters.blindCrossings ?? 0) + 1);
  if (gut && ch === gut && (s.counters.modelBand ?? 0) === b + 1 && model.ch !== gut) s = setFlag(s, 'wentWithGut');
  if (gut && ch !== gut && how !== 'probe') s = setFlag(s, 'overruledHelm');
  if (!calm) s = setFlag(s, 'roughTaken');
  if (lull && calm) s = setFlag(s, 'lullCrossed');
  if (spateMaw(s) && calm && !lull) s = setFlag(s, 'roughTaken');
  s = setFlag(s, 'crossedOnce');
  r.push(say('helm', 'crossing', { band: BAND_NAME[b], ch, rough: calm ? 0 : 1, how }));

  // Hauler left adrift and untowed: crossing on leaves it behind.
  for (const h of HAULERS) {
    if (!inConvoy(s, h) || !adrift(s, h) || towed(s, h)) continue;
    s = setFlag(s, `left${K(h)}`);
    if (!crewOff(s, h)) {
      s = setFlag(s, 'leftTheCrew');
      s = loseCrew(s, h, r, 'leftBehindCrew');
    } else r.push(say('xo', 'leftBehindHull', vars(s, h)));
  }

  const wake = !!s.flags.wake;
  const shields = !!s.flags.shieldsOver && s.ships.halcyon.shields.raised;
  for (const h of HAULERS) {
    if (!inConvoy(s, h)) continue;
    if (adrift(s, h)) continue; // towed through with the Halcyon
    let rough = !calm;
    const u = unfitUnhandled(s, h);
    if (u && b === 2) s = setFlag(s, 'unfitAtMaw');
    if (u && b === 2 && knows(s, 'unfit')) s = setFlag(s, 'pushedUnfit');
    if (u && b === 2 && !rough) {
      rough = true;
      s = setFlag(s, 'lostTheLine');
      r.push(say('helm', 'lostTheLine', vars(s, h)));
    }
    let gain = rough ? 30 : 4;
    if (u) gain += rough ? 12 : 1;
    if (rough && wake) gain = Math.round(gain * 0.7);
    if (shields) gain = Math.round(gain / 2);
    if (towed(s, h)) gain = rough ? 10 : 2;
    s = addCharge(s, h, gain);
    if (u && b === 0) s = setFlag(s, 'driftPending');
  }
  if (b === 2 && HAULERS.some((h) => isUnfit(s, h) && inConvoy(s, h) && handled(s, h)) && !HAULERS.some((h) => unfitUnhandled(s, h) && inConvoy(s, h))) s = setFlag(s, 'steadyAtMaw');
  if (s.ships.halcyon.tractor.target) s = setFlag(s, 'towedAny');
  if (shields) s = setFlag(s, 'shieldedCrossing');
  let gh = calm ? 2 : 18;
  if (shields) gh += calm ? 4 : 14;
  if (wake && !calm) gh += 6;
  if (s.ships.halcyon.tractor.target) gh += 8;
  s = addChargeH(s, gh);
  if (!calm) s = patchShip(s, 'halcyon', { hull: Math.max(40, s.ships.halcyon.hull - 8) });

  s = setCounter(s, 'band', b + 1);
  s = setCounter(s, 'edge', 0);
  s = setCounter(s, 'teagueHold', 0);
  s = setFlag(s, 'justCrossed');
  if (b === 2 && v.season === 'spate' && !lull) s = setFlag(s, 'mawRough');
  s = maybeAdrift(s, r);
  r.push(say('sensors', 'afterCrossing', { mule: inConvoy(s, 'mule') ? charge(s, 'mule') : -1, gannet: inConvoy(s, 'gannet') ? charge(s, 'gannet') : -1, halcyon: chargeH(s), rough: calm ? 0 : 1 }));
  if (b + 1 >= 3) {
    s = resolveTeague(s, r);
    // A crew still aboard a towed, dark hull comes through with it; one dark and untowed needs taking off.
    if (stranded(s)) r.push(say('xo', 'strandedAtExit'));
    return s;
  }
  r.push(say('helm', 'atEdge', { band: BAND_NAME[b + 1] }));
  return arrivalRemarks(s, r);
}

/** Ensign Adeyemi's first impression on reaching a band (only if he is sure of himself). */
export function arrivalRemarks(s: WorldState, r: Report[]): WorldState {
  const v = ion(s);
  const b = band(s);
  if (b >= 3) return s;
  if (spateMaw(s) && !s.flags.spateTold) {
    s = setFlag(s, 'spateTold');
    s = revealFact(s, 'season');
    r.push(say('sensors', 'spateMaw'));
  }
  if (!v.confident) return s;
  const g = gutRead(s);
  if (g.kind === 'unsure') r.push(say('helm', 'arriveBlind', { band: BAND_NAME[b] }));
  else if (g.kind === 'lean') {
    s = setCounter(s, 'gutBand', b + 1);
    s = setCounter(s, 'gutCh', chCode(g.ch));
    r.push(say('helm', 'arriveLean', { band: BAND_NAME[b], ch: g.ch }));
  } else if (g.kind === 'lullComing') r.push(say('helm', 'arriveLull', { mins: g.mins, ch: g.ch }));
  return s;
}

/** The convoy turns back out of the storm the way it came. */
export function turnBack(s: WorldState, r: Report[]): WorldState {
  const b = band(s);
  s = setFlag(s, 'turnedBack');
  for (const h of HAULERS) {
    if (!inConvoy(s, h)) continue;
    if (adrift(s, h) && !towed(s, h)) {
      s = setFlag(s, `left${K(h)}`);
      if (!crewOff(s, h)) {
        s = setFlag(s, 'leftTheCrew');
        s = loseCrew(s, h, r, 'leftBehindCrew');
      }
      continue;
    }
    if (!adrift(s, h)) s = addCharge(s, h, 4 * b);
  }
  s = addChargeH(s, 2 * b);
  s = resolveTeague(s, r);
  r.push(say('helm', b === 0 ? 'turnBackEdge' : 'turnBack', { bands: b }));
  return s;
}

/** Okafor runs the charge off the haulers through the Halcyon's hull. */
export function discharge(s: WorldState, r: Report[]): WorldState {
  const n = s.counters.discharges ?? 0;
  if (n >= 3) {
    r.push(say('engineering', 'dischargeSpent'));
    return s;
  }
  const targets = HAULERS.filter((h) => inConvoy(s, h) && !adrift(s, h));
  if (!targets.length) {
    r.push(say('engineering', 'dischargeNobody'));
    return s;
  }
  for (const h of targets) s = addCharge(s, h, -Math.min(25, Math.max(0, charge(s, h) - 10)));
  s = addChargeH(s, targets.length === 2 ? 22 : 12);
  s = setCounter(s, 'discharges', n + 1);
  s = setFlag(s, 'discharged');
  r.push(say('engineering', 'discharged', { n: n + 1, halcyon: chargeH(s), mule: inConvoy(s, 'mule') ? charge(s, 'mule') : -1, gannet: inConvoy(s, 'gannet') ? charge(s, 'gannet') : -1 }));
  return maybeAdrift(s, r);
}

/** Take the crew off an adrift hauler (the haulers sit within transporter range of the Halcyon). */
export function evacuate(s: WorldState, which: Hauler | null, r: Report[]): WorldState {
  const cands = HAULERS.filter((h) => (which ? h === which : true) && adrift(s, h) && !crewOff(s, h) && !crewLost(s, h) && !shipLeft(s, h));
  if (!cands.length) {
    const live = HAULERS.filter((h) => (which ? h === which : true) && inConvoy(s, h) && !crewOff(s, h));
    r.push(say('xo', live.length ? 'evacNotNeeded' : 'evacNobody', live.length ? vars(s, live[0]) : {}));
    return s;
  }
  for (const h of cands) {
    const n = s.ships[SLOT[h]].souls;
    s = patchShip(s, SLOT[h], { souls: 0, disposition: 'evacuated' });
    s = patchShip(s, 'halcyon', { souls: s.ships.halcyon.souls + n });
    s = patchCharacter(s, CAPTAIN[h], { ship: 'halcyon' });
    s = setFlag(s, `crewOff${K(h)}`);
    s = setFlag(s, 'tookCrewOff');
    s = setCounter(s, 'rescued', (s.counters.rescued ?? 0) + n);
    s = addChargeH(s, 6);
    r.push(say('xo', 'evacDone', vars(s, h, { n })));
  }
  return maybeAdrift(s, r);
}

// --------------------------------------------------------------- one minute ---

export function simulate(s: WorldState, _rng: Rng): Applied {
  const reports: Report[] = [];
  const run = (fn: (s: WorldState, r: Report[]) => WorldState) => {
    if (s.outcome || s.flags.halcyonDark) return;
    s = fn(s, reports);
  };
  run(housekeeping);
  run(edgeMinute);
  run(probes);
  run(clocks);
  run(teague);
  run(helmVoice);
  s = { ...s, flags: { ...s.flags, justCrossed: false } };
  return { state: s, reports };
}

function completeHelmOrders(s: WorldState): WorldState {
  return { ...s, orders: { ...s.orders, list: s.orders.list.map((o) => (o.dept === 'helm' && !o.label.startsWith('Charge jump') && (o.status === 'acknowledged' || o.status === 'underway' || o.maintaining) ? { ...o, status: 'completed' as const, maintaining: false, detail: 'convoy holds together' } : o)) } };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  // The haulers fly close on the Halcyon; in here the convoy moves together, channel by channel.
  for (const id of ['kestrel', 'cruiser'] as const) if (s.ships[id].nav || s.ships[id].velocity.x || s.ships[id].velocity.y) s = patchShip(s, id, { nav: null, velocity: { x: 0, y: 0 } });
  const h = s.ships.halcyon;
  if (s.flags.jumped && !s.flags.leftStorm) {
    s = setFlag(s, 'leftStorm');
    if (h.tractor.target) s = patchShip(s, 'halcyon', { tractor: { target: null } });
    return s;
  }
  if (h.nav) {
    // The convoy's frame is the Halcyon's: a held order leaves her where she was, at its head.
    if ((h.nav.intent === 'flee' || h.nav.intent === 'retreat') && !s.flags.leftStorm && !through(s)) {
      s = patchShip(s, 'halcyon', { nav: null, velocity: { x: 0, y: 0 }, position: { x: 0, y: 0 } });
      s = completeHelmOrders(s);
      // The first time, Marrow makes sure the captain means it: the haulers cannot see without us.
      if (!s.flags.leaveWarned) {
        s = setFlag(s, 'leaveWarned');
        r.push(say('xo', 'leaveWarn'));
        return s;
      }
      s = setFlag(s, 'leftStorm');
      if (s.ships.halcyon.tractor.target) s = patchShip(s, 'halcyon', { tractor: { target: null } });
      r.push(say('helm', 'leftTheConvoy'));
      return s;
    }
    s = patchShip(s, 'halcyon', { nav: null, velocity: { x: 0, y: 0 }, position: { x: 0, y: 0 } });
    s = completeHelmOrders(s);
    if (!s.flags.toldNav) {
      s = setFlag(s, 'toldNav');
      r.push(say('helm', 'navHeld'));
    }
  } else if (h.velocity.x || h.velocity.y) s = patchShip(s, 'halcyon', { velocity: { x: 0, y: 0 } });
  if (!h.shields.raised && s.flags.shieldsOver) s = setFlag(s, 'shieldsOver', false);
  return s;
}

function edgeMinute(s: WorldState, r: Report[]): WorldState {
  if (s.flags.justCrossed || through(s) || s.flags.turnedBack || s.flags.leftStorm) return s;
  const v = ion(s);
  const rate = v.season === 'settled' ? 3 : 4;
  const shields = !!s.flags.shieldsOver && s.ships.halcyon.shields.raised;
  for (const h of HAULERS) if (inConvoy(s, h) && !adrift(s, h)) s = addCharge(s, h, shields ? Math.ceil(rate / 2) : rate);
  s = addChargeH(s, (v.season === 'settled' ? 1 : 2) + (shields ? 2 : 0));
  s = setCounter(s, 'edge', edge(s) + 1);
  const worst = Math.max(...HAULERS.filter((h) => inConvoy(s, h) && !adrift(s, h)).map((h) => charge(s, h)), 0);
  if (worst >= 75 && !s.flags.warned75) {
    s = setFlag(s, 'warned75');
    r.push(say('engineering', 'chargeHigh', { worst }));
  }
  return maybeAdrift(s, r);
}

function probes(s: WorldState, r: Report[]): WorldState {
  const left = s.counters.probeLeft ?? 0;
  if (left <= 0) return s;
  s = setCounter(s, 'probeLeft', left - 1);
  if (left - 1 > 0) return s;
  const pb = s.counters.probeBand ?? -1;
  const c = chOf(s.counters.probeCh ?? 0) ?? 'high';
  if (pb !== band(s)) {
    r.push(say('sensors', 'probeStale', { ch: c }));
    return s;
  }
  const calm = calmNow(s, c);
  s = setCounter(s, 'probedBand', band(s) + 1);
  s = setCounter(s, 'probedCh', chCode(c));
  s = setCounter(s, 'probedRes', calm ? 1 : 2);
  s = setFlag(s, 'probed');
  r.push(say('sensors', 'probeResult', { ch: c, calm: calm ? 1 : 0, band: BAND_NAME[band(s)], spate: spateMaw(s) ? 1 : 0 }));
  return s;
}

function clocks(s: WorldState, r: Report[]): WorldState {
  for (const h of HAULERS) {
    if (!adrift(s, h) || crewOff(s, h) || crewLost(s, h)) continue;
    const c = (s.counters[`clock${K(h)}`] ?? 0) - 1;
    s = setCounter(s, `clock${K(h)}`, Math.max(0, c));
    if (c <= 0) s = loseCrew(s, h, r);
    else if (c === 2) r.push(say('medical', 'airFailing', vars(s, h, { mins: c })));
  }
  const eta = s.counters.teagueEta ?? 0;
  if (alone(s) && !s.flags.teagueResolved && eta > 0) {
    s = setCounter(s, 'teagueEta', eta - 1);
    if (eta - 1 <= 0) s = resolveTeague(s, r);
  }
  return s;
}

function teague(s: WorldState, r: Report[]): WorldState {
  if (s.flags.justCrossed || through(s) || s.flags.turnedBack || s.flags.leftStorm) return s;
  if (!inConvoy(s, 'gannet') || adrift(s, 'gannet') || towed(s, 'gannet') || remote(s, 'gannet')) return s;
  if (relieved(s, 'gannet')) return s; // Mate Hollow will wait as long as the Halcyon asks
  const v = ion(s);
  const hold = (s.counters.teagueHold ?? 0) + 1;
  s = setCounter(s, 'teagueHold', hold);
  if (hold === v.patience - 1 && !cm(s, 'gannet').warned) {
    s = setMemory(s, 'teague', 'warned', 1);
    s = revealFact(s, 'impatient');
    return speak(s, 'gannet', 'teagueRestless', r);
  }
  if (hold >= v.patience) return teagueBreaks(s, r);
  return s;
}

/** Things the helm and the first officer say without being asked. */
function helmVoice(s: WorldState, r: Report[]): WorldState {
  const v = ion(s);
  if (s.flags.driftPending && !s.flags.driftTold && band(s) >= 1) {
    s = setFlag(s, 'driftTold');
    s = setFlag(s, 'driftPending', false);
    const h = v.unfit === 'none' ? null : v.unfit;
    if (h && inConvoy(s, h) && !handled(s, h)) {
      s = revealFact(s, 'drift');
      r.push(say('helm', 'driftReport', vars(s, h)));
    }
  }
  if (over(s)) return s;
  const b = band(s);
  // The blind band: after a minute at its edge he has the feel of it.
  if (v.blind === b && edge(s) === 1 && !spateMaw(s) && v.confident && (s.counters.gotItBand ?? 0) !== b + 1) {
    s = setCounter(s, 'gotItBand', b + 1);
    s = setCounter(s, 'gutBand', b + 1);
    s = setCounter(s, 'gutCh', chCode(v.calm[b]));
    r.push(say('helm', 'gotIt', { ch: v.calm[b], band: BAND_NAME[b] }));
  }
  if (spateMaw(s)) {
    const L = v.lullAt;
    const e = edge(s);
    const speaks = v.confident || !!s.flags.backedHelm;
    if ((e === L || e === L + 4) && speaks) r.push(say('helm', 'lullNow', { ch: v.calm[2] }));
    if ((e === L + 2 || e === L + 6) && !speaks && (s.counters.lullMissedTold ?? 0) < 2) {
      s = setCounter(s, 'lullMissedTold', (s.counters.lullMissedTold ?? 0) + 1);
      r.push(say('helm', 'lullMissed', { ch: v.calm[2] }));
      if (!s.flags.marrowLull) {
        s = setFlag(s, 'marrowLull');
        r.push(say('xo', 'marrowLull'));
      }
    }
  }
  return s;
}

export function captainKnownUnfit(s: WorldState, h: Hauler): boolean {
  return isUnfit(s, h) && (knows(s, 'unfit') || !!cm(s, h).admitted);
}

// --------------------------------------------------------------- an unfit master ---

export function admit(s: WorldState, h: Hauler, r: Report[]): WorldState {
  if (!cm(s, h).admitted) {
    s = setMemory(s, CAPTAIN[h], 'admitted', 1);
    s = revealFact(s, 'unfit');
    s = setFlag(s, 'foundUnfit');
  }
  return speak(s, h, 'admits', r);
}

/** The master hands the helm to the mate (only once they have admitted they are not fit). */
export function relieve(s: WorldState, h: Hauler, r: Report[]): WorldState {
  if (relieved(s, h)) return speak(s, h, 'alreadyRelieved', r);
  if (!isUnfit(s, h)) {
    s = adjustTrustSafe(s, h, -8);
    s = setFlag(s, 'reliefRefusedFit');
    return speak(s, h, 'reliefInsult', r);
  }
  if (!cm(s, h).admitted) {
    s = adjustTrustSafe(s, h, -3);
    return speak(s, h, 'reliefDenied', r);
  }
  s = setMemory(s, CAPTAIN[h], 'relieved', 1);
  s = setFlag(s, 'relieved');
  s = adjustTrustSafe(s, h, 5);
  s = speak(s, h, 'handsOver', r);
  r.push(say('helm', 'mateFlying', vars(s, h)));
  return s;
}

/** Ensign Adeyemi flies a hauler from the Halcyon's helm (needs the master's consent). */
export function remoteHelm(s: WorldState, h: Hauler, r: Report[]): WorldState {
  if (!inConvoy(s, h) || adrift(s, h)) {
    r.push(say('helm', 'remoteNothing', vars(s, h)));
    return s;
  }
  if (remote(s, h)) {
    r.push(say('helm', 'remoteAlready', vars(s, h)));
    return s;
  }
  const other: Hauler = h === 'mule' ? 'gannet' : 'mule';
  if (remote(s, other)) {
    r.push(say('helm', 'remoteOneOnly', vars(s, other)));
    return s;
  }
  const c = s.characters[CAPTAIN[h]];
  const consent = c.ship !== SLOT[h] || !captainAlive(s, h) || (isUnfit(s, h) && (!!cm(s, h).admitted || c.trust >= 60)) || relieved(s, h);
  if (!consent) {
    s = adjustTrustSafe(s, h, isUnfit(s, h) ? -4 : -10);
    s = setFlag(s, 'remoteRefused');
    return speak(s, h, isUnfit(s, h) ? 'remoteRefusedUnfit' : 'remoteRefused', r);
  }
  if (isUnfit(s, h) && !cm(s, h).admitted) s = admit(s, h, r);
  s = setMemory(s, CAPTAIN[h], 'remote', 1);
  s = setFlag(s, 'remoteFlown');
  r.push(say('helm', 'remoteOn', vars(s, h)));
  return s;
}

function adjustTrustSafe(s: WorldState, h: Hauler, d: number): WorldState {
  const c = s.characters[CAPTAIN[h]];
  return patchCharacter(s, CAPTAIN[h], { trust: clamp(c.trust + d, -100, 100) });
}
export const trustOf = (s: WorldState, h: Hauler) => s.characters[CAPTAIN[h]].trust;
export const adjustHaulerTrust = adjustTrustSafe;
