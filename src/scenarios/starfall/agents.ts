/**
 * Starfall — the agents: Factor Idris Kemble on the sinking habitat Thistledown (who wants his
 * people off and his post kept, and may not have put everyone on the manifest), Agent Sabra Quell
 * on the company yacht Dividend (who wants the company's scoop works saved), the gas giant Caradoc
 * (which only pulls), and the Halcyon's officers. Deterministic: no randomness after setup.
 *
 * The question is who flies, and how far the captain trusts him. Ens. Adeyemi has the hands for the
 * storm, and after one descent he has a line through it that the orbital model does not see; he is
 * in his first real crisis, and his nerve is seeded. Lt. Duarte is senior, sound and slower, and
 * cannot hold a dock as deep in rough air. Chief Okafor knows what the hull can take; Adeyemi, eager,
 * does not. Trust his flying, verify the hull with the Chief: ISA-COM-001 §2.5 (delegate, and stay
 * accountable), §3.9 (no avoidable risk to the ship), §4.1, §4.2, §6.1. Judged on what was known
 * at the time (§1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, revealFact, setCounter, setFlag } from '../../engine/state';
import { CRUSH, DOCK_FLOOR, HALCYON_SOULS, breakingOf, starfall } from './setup';
import {
  ABORT, APPROVE, BACK, CASE, COUNSEL, CUT, DELEGATE, DESCEND, DUARTE_WORD, HELM_SWAP, HULL, IS_QUESTION, KEMBLE_WORD, LEAVE, LIFESIGNS, LIGHTEN, LIMIT, MICRO, PROMISE, QUELL_WORD,
  REASON, STORM_READ, TELL, TOW, WORKERS,
} from './words';

const END_FLAGS = ['endClear', 'endLost', 'endDragged', 'endLeft', 'endFired', 'endTow'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const QUESTION = IS_QUESTION;
/** Telling the company the truth: the plant cannot be saved, people come first. */
const NO_SAVE = /\b(can'?t|cannot|won'?t|will not|not going to|no way to) (save|tow|lift|bring up|keep)\b|\bpeople (first|before|come first)\b|\blives (first|before|over|come first)\b|\bnot (the|your) (plant|scoop works|property)\b/;

export const duarteFlying = (s: WorldState) => c(s, 'pilot') === 2;
/** A trip is underway (the ship is in the cloud deck, or climbing out of it). */
export const flying = (s: WorldState) => c(s, 'tripEnd') > 0;
export const towing = (s: WorldState) => c(s, 'towEnd') > 0;
const shakenUnbacked = (s: WorldState) => starfall(s).nerve === 'shaken' && !s.flags.backed && !duarteFlying(s);
const sinkNow = (s: WorldState) => (s.flags.cutLoose ? 1 : starfall(s).sink);
/** People still aboard the habitat, counted or not. */
export const onHabitat = (s: WorldState) => c(s, 'upper') + c(s, 'hidden');
const pilotKey = (s: WorldState) => (duarteFlying(s) ? 'relief_helm' : 'adeyemi');
const pilot = (s: WorldState, key: string, v?: Record<string, string | number>) => say({ character: pilotKey(s) }, key, v);
const adeyemi = (key: string, v?: Record<string, string | number>) => say({ character: 'adeyemi' }, key, v);
const duarte = (key: string, v?: Record<string, string | number>) => say({ character: 'relief_helm' }, key, v);

const BASE = { squall: 12, gale: 17, shear: 22 } as const;
const DUARTE_DOCK = { squall: 90, gale: 78, shear: 66 } as const;

/** Turns one descent takes: down, dock, up. */
export function tripLength(s: WorldState): number {
  return 3 + (duarteFlying(s) ? 1 : 0) + (!duarteFlying(s) && !s.flags.delegated ? 1 : 0) + (shakenUnbacked(s) ? 1 : 0);
}
/** The deepest the pilot can hold a dock at the ring. */
export function dockLimit(s: WorldState): number {
  if (duarteFlying(s)) return DUARTE_DOCK[starfall(s).storm];
  return shakenUnbacked(s) ? DOCK_FLOOR - 8 : DOCK_FLOOR;
}
const pilotFactor = (s: WorldState) => (duarteFlying(s) ? 1.25 : shakenUnbacked(s) ? 1.4 : 1);
const lineFactor = (s: WorldState) => (!duarteFlying(s) && s.flags.lineApproved ? 0.45 : 1);
/** The strain one descent puts on the hull, docking at a given depth. */
export function tripStrain(s: WorldState, dockDepth: number): number {
  const v = starfall(s);
  return Math.round(BASE[v.storm] * (1 + Math.max(0, dockDepth - 36) / 50) * pilotFactor(s) * lineFactor(s));
}
const towStrain = (s: WorldState) => Math.round(BASE[starfall(s).storm] * 1.6 * pilotFactor(s) * lineFactor(s));
const towLength = (s: WorldState) => 3 + (!duarteFlying(s) && !s.flags.delegated ? 1 : 0);
/** What the next descent would put on the hull, if it started now. */
export function projected(s: WorldState): number {
  return tripStrain(s, c(s, 'depth') + sinkNow(s) * tripLength(s));
}

export function vars(s: WorldState): Record<string, string | number> {
  const v = starfall(s);
  const tol = v.tolerance;
  const next = projected(s);
  return {
    turn: s.turn,
    depth: c(s, 'depth'),
    toCrush: Math.max(0, Math.ceil((CRUSH - c(s, 'depth')) / sinkNow(s))),
    sink: sinkNow(s),
    upper: c(s, 'upper'),
    aboard: c(s, 'aboard'),
    load: c(s, 'tripLoad'),
    strain: c(s, 'strain'),
    tolerance: tol,
    margin: Math.max(0, tol - c(s, 'strain')),
    next,
    left: Math.max(0, Math.floor((tol - c(s, 'strain')) / Math.max(1, next))),
    ring: v.ring,
    trips: c(s, 'trips'),
    manifest: v.manifest,
    total: v.manifest + v.hidden,
    scoop: v.hidden,
    len: tripLength(s),
    storm: v.storm,
    nerve: v.nerve,
    count: v.count,
    agent: v.agent,
    duarte: duarteFlying(s) ? 1 : 0,
    delegated: s.flags.delegated ? 1 : 0,
    line: s.flags.lineApproved ? 1 : 0,
    known: knows(s, 'tolerance') ? 1 : 0,
    dead: c(s, 'deadCiv'),
    cut: s.flags.cutLoose ? 1 : 0,
  };
}

/** Keep the shared engine's soul counts in step with the scenario's own (transports cannot reach the habitat). */
function syncSouls(s: WorldState): WorldState {
  const k = s.ships.kestrel;
  const h = s.ships.halcyon;
  const hull = Math.max(8, Math.min(100, 100 - Math.round(c(s, 'strain') * 0.7)));
  const lead = s.characters.kemble;
  const chars = lead && lead.ship !== 'kestrel' ? { ...s.characters, kemble: { ...lead, ship: 'kestrel' as const } } : s.characters;
  return {
    ...s,
    characters: chars,
    ships: { ...s.ships, kestrel: { ...k, souls: s.flags.endLost || s.flags.endDragged || s.flags.endLeft ? 0 : onHabitat(s), disposition: 'friendly' }, halcyon: { ...h, souls: HALCYON_SOULS + c(s, 'aboard'), hull: Math.min(h.hull, hull) } },
  };
}

// ------------------------------------------------------------------ the descents ---

function startTrip(s: WorldState, r: Report[], by: 'captain' | 'auto' | 'eager'): WorldState {
  const L = tripLength(s);
  const t = s.turn;
  s = setCounter(s, 'tripStart', Math.max(1, t));
  s = setCounter(s, 'tripDock', t + L - 1);
  s = setCounter(s, 'tripEnd', t + L);
  s = setCounter(s, 'tripLoad', 0);
  s = setCounter(s, 'tripOverrides', 0);
  s = setCounter(s, 'tripExtra', 0);
  s = setFlag(s, 'tripInformed', knows(s, 'tolerance'));
  s = setFlag(s, 'tripLine', !duarteFlying(s) && !!s.flags.lineApproved);
  s = setFlag(s, 'paused', false);
  s = setCounter(s, 'eagerAt', 0);
  if (duarteFlying(s)) s = setFlag(s, 'duarteFlew');
  else s = setFlag(s, 'adeyemiFlew');
  if (c(s, 'strain') + projected(s) > starfall(s).tolerance) s = setFlag(s, 'pastLimitTrip');
  if (by === 'eager') {
    s = setFlag(s, 'eagerWent');
    s = setFlag(s, 'eagerPushed');
    r.push(adeyemi('adeyemiGoesAnyway', vars(s)));
    return s;
  }
  const key = duarteFlying(s) ? 'duarteDown' : s.flags.lineApproved ? 'adeyemiDownLine' : shakenUnbacked(s) ? 'adeyemiDownShaken' : s.flags.delegated ? 'adeyemiDownOwn' : 'adeyemiDown';
  r.push(pilot(s, c(s, 'trips') === 0 && by === 'captain' ? `${key}First` : key, vars(s)));
  return s;
}

function descend(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (towing(s)) {
    r.push(pilot(s, 'towUnderway'));
    return s;
  }
  if (flying(s)) {
    r.push(pilot(s, 'alreadyDown', vars(s)));
    return setFlag(s, 'rescueOn');
  }
  if (c(s, 'upper') === 0) {
    r.push(say('xo', 'nobodyAtRing'));
    return s;
  }
  // Past the Chief's limit, an explicit order to go again is the captain's own decision.
  if (s.flags.paused || c(s, 'strain') + projected(s) > starfall(s).tolerance) {
    if (knows(s, 'tolerance')) s = setFlag(s, 'pastAuthorised');
  }
  s = setFlag(s, 'rescueOn');
  if (!c(s, 'rescueAt')) s = setCounter(s, 'rescueAt', Math.max(1, s.turn));
  return startTrip(s, r, 'captain');
}

function abort(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'rescueOn', false);
  s = setCounter(s, 'eagerAt', 0);
  if (towing(s)) {
    r.push(pilot(s, 'towNoAbort'));
    return s;
  }
  if (!flying(s)) {
    s = setFlag(s, 'paused');
    r.push(pilot(s, 'holdingAbove'));
    return s;
  }
  if (s.turn >= c(s, 'tripDock')) {
    r.push(pilot(s, 'alreadyClimbing'));
    return s;
  }
  s = setFlag(s, 'tripAborted');
  s = setCounter(s, 'tripDock', 0);
  s = setCounter(s, 'tripEnd', s.turn + 1);
  s = setFlag(s, 'paused');
  r.push(pilot(s, 'breakingOff'));
  return s;
}

function dock(s: WorldState, r: Report[]): WorldState {
  const v = starfall(s);
  s = setCounter(s, 'tripDock', 0);
  if (c(s, 'depth') > dockLimit(s)) {
    s = setFlag(s, 'tripAborted');
    s = setFlag(s, 'dockFailed');
    r.push(pilot(s, duarteFlying(s) ? 'duarteCantDock' : 'adeyemiCantDock', vars(s)));
    if (!knows(s, 'cutLoose')) {
      s = revealFact(s, 'cutLoose');
      r.push(say('engineering', 'okaforIdea', vars(s)));
    }
    return s;
  }
  const load = Math.min(v.ring, c(s, 'upper'));
  s = setCounter(s, 'upper', c(s, 'upper') - load);
  s = setCounter(s, 'tripLoad', load);
  if (!duarteFlying(s) && !s.flags.feltIt) s = setFlag(s, 'feltIt');
  r.push(say('xo', c(s, 'upper') ? 'docked' : 'dockedLast', vars(s)));
  // Varga counts the living at the ring, where the cloud cannot hide them.
  if (s.flags.countPending) {
    s = setFlag(s, 'countPending', false);
    s = countRevealed(s, r);
  }
  // The ashamed Factor, watching the last of the manifest go up, owns up.
  if (c(s, 'upper') === 0 && c(s, 'hidden') > 0 && v.count === 'ashamed' && !s.flags.scoopUp) {
    r.push(comms('kemble', 'kembleLateConfess', vars(s)));
    s = setFlag(s, 'lateConfession');
    s = scoopUp(s);
  }
  return s;
}

function tripHome(s: WorldState, r: Report[]): WorldState {
  const v = starfall(s);
  const aborted = !!s.flags.tripAborted;
  const before = c(s, 'strain');
  const full = tripStrain(s, Math.min(c(s, 'depth'), CRUSH)) + c(s, 'tripExtra');
  const add = aborted ? Math.round(full / 2) : full;
  const strain = before + add;
  s = setCounter(s, 'strain', strain);
  s = setCounter(s, 'peakStrain', Math.max(c(s, 'peakStrain'), strain));
  s = setCounter(s, 'aboard', c(s, 'aboard') + c(s, 'tripLoad'));
  s = setCounter(s, 'rescued', c(s, 'aboard'));
  if (!aborted) s = setCounter(s, 'trips', c(s, 'trips') + 1);
  if (s.flags.tripLine) s = setFlag(s, 'flewLine');
  const crossed = before <= v.tolerance && strain > v.tolerance;
  if (crossed) {
    s = setFlag(s, s.flags.tripInformed ? 'crossedInformed' : 'crossedBlind');
    if (s.flags.eagerWent) s = setFlag(s, 'eagerCrossed');
  }
  for (const k of ['tripStart', 'tripDock', 'tripEnd', 'tripLoad', 'tripOverrides', 'tripExtra']) s = setCounter(s, k, 0);
  s = setFlag(s, 'tripAborted', false);
  s = setFlag(s, 'eagerWent', false);
  if (strain >= breakingOf(v)) {
    r.push(say('engineering', 'frameGives', vars(s)));
    return setFlag(s, 'endDragged');
  }
  r.push(say('xo', aborted ? 'tripBackEmpty' : 'tripHome', { ...vars(s), load: c(s, 'aboard') }));
  if (crossed && !s.flags.okaforWarned) {
    s = revealFact(s, 'tolerance');
    s = setFlag(s, 'okaforWarned');
    r.push(say('engineering', 'okaforPast', vars(s)));
    if (c(s, 'upper') > 0) {
      s = setFlag(s, 'rescueOn', false);
      s = setFlag(s, 'paused');
    }
  } else if (strain > v.tolerance && c(s, 'upper') > 0) {
    r.push(say('engineering', 'okaforStillPast', vars(s)));
    s = setFlag(s, 'rescueOn', false);
    s = setFlag(s, 'paused');
  }
  // Having felt the storm, the pilot has his own line through it.
  if (s.flags.feltIt && !duarteFlying(s) && !s.flags.lineOffered && c(s, 'upper') > 0) {
    const n = v.nerve;
    if (n === 'eager' || (n === 'steady' && s.flags.delegated)) s = offerLine(s, r);
  }
  return s;
}

function offerLine(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'lineOffered');
  s = revealFact(s, 'line');
  r.push(adeyemi('adeyemiLine', vars(s)));
  r.push(say('sensors', 'vargaLineDoubt'));
  // Handed the descent, he flies his own line without asking twice.
  if (s.flags.delegated && starfall(s).nerve !== 'shaken') {
    s = setFlag(s, 'lineApproved');
    s = setFlag(s, 'lineByDelegation');
  }
  return s;
}

function approveLine(s: WorldState, r: Report[]): WorldState {
  if (duarteFlying(s)) {
    r.push(duarte('duarteNoLine'));
    return s;
  }
  if (s.flags.lineApproved) {
    r.push(adeyemi('adeyemiLineAlready'));
    return setFlag(s, 'lineBacked');
  }
  s = setFlag(s, 'lineApproved');
  s = setFlag(s, 'lineBacked');
  r.push(adeyemi('adeyemiLineGo', vars(s)));
  return s;
}

/** Asking the pilot how he would fly it. */
function askPilot(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'askedPilot');
  if (duarteFlying(s)) {
    r.push(duarte('duarteRead', vars(s)));
    return s;
  }
  if (!s.flags.feltIt) {
    r.push(adeyemi(starfall(s).nerve === 'shaken' && !s.flags.backed ? 'adeyemiNotYetShaken' : 'adeyemiNotYet', vars(s)));
    return s;
  }
  if (s.flags.lineOffered) {
    r.push(adeyemi('adeyemiLineAgain', vars(s)));
    return s;
  }
  if (starfall(s).nerve === 'shaken' && !s.flags.backed) {
    r.push(adeyemi('adeyemiShakenHolds'));
    return setFlag(s, 'sawShaken');
  }
  return offerLine(s, r);
}

function delegate(s: WorldState, r: Report[]): WorldState {
  if (duarteFlying(s)) {
    r.push(duarte('duarteDelegated'));
    return s;
  }
  const first = !s.flags.delegated;
  s = setFlag(s, 'delegated');
  if (!c(s, 'rescueAt') && !flying(s)) s = setFlag(s, 'delegatedEarly');
  const n = starfall(s).nerve;
  r.push(adeyemi(!first ? 'adeyemiDelegatedAgain' : n === 'shaken' && !s.flags.backed ? 'adeyemiDelegatedShaken' : n === 'eager' ? 'adeyemiDelegatedEager' : 'adeyemiDelegatedSteady'));
  if (s.flags.lineOffered && !s.flags.lineApproved && n !== 'shaken') {
    s = setFlag(s, 'lineApproved');
    s = setFlag(s, 'lineByDelegation');
  }
  if (s.flags.feltIt && !s.flags.lineOffered && n === 'steady' && c(s, 'upper') > 0) s = offerLine(s, r);
  return s;
}

function backHim(s: WorldState, r: Report[]): WorldState {
  const was = !!s.flags.backed;
  s = setFlag(s, 'backed');
  if (!c(s, 'trips') && !flying(s)) s = setFlag(s, 'backedEarly');
  const n = starfall(s).nerve;
  r.push(adeyemi(was ? 'adeyemiBackedAgain' : n === 'shaken' ? 'adeyemiSteadies' : n === 'eager' ? 'adeyemiBackedEager' : 'adeyemiBackedSteady'));
  return s;
}

function micro(s: WorldState, r: Report[]): WorldState {
  if (!flying(s) || towing(s)) {
    r.push(pilot(s, 'microNotFlying'));
    return s;
  }
  s = setCounter(s, 'overrides', c(s, 'overrides') + 1);
  s = setCounter(s, 'tripOverrides', c(s, 'tripOverrides') + 1);
  s = setCounter(s, 'tripExtra', c(s, 'tripExtra') + 6);
  // Flying to the captain's hands costs time, too, up to a point.
  if (c(s, 'tripOverrides') <= 2) {
    if (c(s, 'tripDock') > s.turn) s = setCounter(s, 'tripDock', c(s, 'tripDock') + 1);
    s = setCounter(s, 'tripEnd', c(s, 'tripEnd') + 1);
  }
  if (!duarteFlying(s) && starfall(s).nerve === 'shaken' && s.flags.backed) {
    s = setFlag(s, 'backed', false);
    s = setFlag(s, 'lostBacking');
    r.push(adeyemi('adeyemiRattled'));
    return s;
  }
  r.push(pilot(s, duarteFlying(s) ? 'duarteOverride' : 'adeyemiOverride'));
  return s;
}

function setLimit(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'limitSet');
  s = revealFact(s, 'tolerance');
  s = setFlag(s, 'hullAsked');
  s = setCounter(s, 'eagerAt', 0);
  r.push(pilot(s, duarteFlying(s) ? 'duarteLimit' : 'adeyemiLimit'));
  r.push(say('engineering', 'okaforLimitSet', vars(s)));
  return s;
}

function swapToDuarte(s: WorldState, r: Report[]): WorldState {
  if (duarteFlying(s)) {
    r.push(duarte('duarteAlready'));
    return s;
  }
  s = setCounter(s, 'pilot', 2);
  s = setFlag(s, 'relievedAdeyemi');
  if (!c(s, 'trips')) s = setFlag(s, 'duarteFromStart');
  r.push(duarte(flying(s) ? 'duarteNextTrip' : 'duarteTakes', vars(s)));
  r.push(adeyemi('adeyemiRelieved'));
  return s;
}

function swapToAdeyemi(s: WorldState, r: Report[]): WorldState {
  if (!duarteFlying(s)) {
    r.push(adeyemi('adeyemiAlready'));
    return s;
  }
  s = setCounter(s, 'pilot', 1);
  s = setFlag(s, 'adeyemiRestored');
  r.push(adeyemi(starfall(s).nerve === 'shaken' && !s.flags.backed ? 'adeyemiBackShaken' : 'adeyemiBack'));
  return s;
}

// ------------------------------------------------------------------ the count ---

function scoopUp(s: WorldState): WorldState {
  if (s.flags.scoopUp) return s;
  s = setFlag(s, 'scoopUp');
  s = setCounter(s, 'scoopUpAt', Math.max(1, s.turn));
  s = setCounter(s, 'upper', c(s, 'upper') + c(s, 'hidden'));
  return setCounter(s, 'hidden', 0);
}

function countRevealed(s: WorldState, r: Report[]): WorldState {
  const v = starfall(s);
  s = revealFact(s, 'count');
  s = setFlag(s, 'countKnown');
  s = setCounter(s, 'countAt', Math.max(1, s.turn));
  if (v.hidden > 0 && !s.flags.scoopUp) {
    s = setFlag(s, 'countFound');
    r.push(say('sensors', 'vargaCountMore', vars(s)));
  } else r.push(say('sensors', 'vargaCountMatches', vars(s)));
  return s;
}

function lifeSigns(s: WorldState, r: Report[]): WorldState {
  s = setFlag(s, 'countAsked');
  if (s.flags.countKnown) {
    r.push(say('sensors', starfall(s).hidden > 0 && !s.flags.scoopUp ? 'vargaCountMore' : 'vargaCountMatches', vars(s)));
    return s;
  }
  if (s.flags.countPending) {
    r.push(say('sensors', 'vargaCountPending'));
    return s;
  }
  s = setFlag(s, 'countPending');
  r.push(say('sensors', flying(s) && c(s, 'tripDock') > s.turn ? 'vargaCountInCloud' : 'vargaCountNeedsDescent'));
  return s;
}

// ------------------------------------------------------------------ cut and tow ---

function cutWorks(s: WorldState, t: string, r: Report[]): WorldState {
  if (s.flags.cutLoose || c(s, 'cutAt') > 0) {
    r.push(say('engineering', 'cutAlready'));
    return s;
  }
  const v = starfall(s);
  s = revealFact(s, 'cutLoose');
  // The habitat is the Factor's to cut; the company says the plant is theirs.
  const reason = REASON.test(t) || s.flags.toldKembleLives;
  if (!s.flags.quellAgreed && v.agent === 'company' && !reason) {
    s = setFlag(s, 'cutBalked');
    r.push(comms('kemble', 'kembleCutBalks'));
    return s;
  }
  if (c(s, 'hidden') > 0 && !s.flags.scoopUp) {
    r.push(comms('kemble', v.count === 'defensive' ? 'kembleCutConfessDefensive' : 'kembleCutConfess', vars(s)));
    s = setFlag(s, 'confessedAtCut');
    s = scoopUp(s);
  }
  s = setCounter(s, 'cutAt', s.turn + 2);
  s = setFlag(s, 'cutOrdered');
  r.push(comms('kemble', 'kembleCuts'));
  r.push(say('engineering', 'okaforCutting'));
  return s;
}

function tow(s: WorldState, r: Report[]): WorldState {
  if (towing(s)) {
    r.push(pilot(s, 'towUnderway'));
    return s;
  }
  if (!s.flags.cutLoose) {
    r.push(say('engineering', c(s, 'cutAt') > 0 ? 'towWaitCut' : 'towTooHeavy'));
    if (!c(s, 'cutAt')) s = revealFact(s, 'cutLoose');
    return s;
  }
  if (flying(s)) {
    r.push(pilot(s, 'towAfterTrip'));
    return s;
  }
  if (duarteFlying(s) && starfall(s).storm !== 'squall') {
    s = setFlag(s, 'duarteNoTow');
    r.push(duarte('duarteCantTow'));
    return s;
  }
  const L = towLength(s);
  s = setFlag(s, 'rescueOn', false);
  s = setFlag(s, 'paused', false);
  s = setCounter(s, 'towStart', Math.max(1, s.turn));
  s = setCounter(s, 'towEnd', s.turn + L);
  s = setFlag(s, 'tripInformed', knows(s, 'tolerance'));
  if (!duarteFlying(s)) s = setFlag(s, 'adeyemiFlew');
  r.push(pilot(s, duarteFlying(s) ? 'duarteTows' : 'adeyemiTows', { ...vars(s), len: L }));
  return s;
}

// ------------------------------------------------------------------ the people ---

const REPLY_KEYS = [
  'kembleStatus', 'kembleHonest', 'kembleConfess', 'kembleDenies', 'kembleCaves', 'kembleRing', 'kembleThanks', 'kemblePromise', 'kembleAfter', 'kembleCutBalks', 'kembleCuts',
  'quellStatus', 'quellPayroll', 'quellNoPayroll', 'quellCutAgree', 'quellCutYield', 'quellCutRefuse', 'quellPleased', 'quellHonest', 'quellAfter', 'quellTow',
];
function once(who: 'kemble' | 'quell', fn: (s: WorldState, t: string, r: Report[]) => WorldState) {
  return (s: WorldState, t: string, r: Report[]): WorldState => {
    const mine: Report[] = [];
    s = fn(s, t, mine);
    const mark = s.log.length + 1;
    const fresh = c(s, `${who}Mark`) !== mark;
    let heard = fresh ? 0 : c(s, `${who}Heard`);
    for (const x of mine) {
      const i = REPLY_KEYS.indexOf(x.key);
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

export const kembleRespond = once('kemble', kembleReply);
export const quellRespond = once('quell', quellReply);

function falsePromise(s: WorldState, t: string): boolean {
  if (!PROMISE.test(t)) return false;
  // "We can't save the plant" is the opposite of a promise.
  if (NO_SAVE.test(t) || /\b(can'?t|cannot|won'?t|will not|not|never)\b[^.]*\b(save|tow|keep|rescue)\b/.test(t)) return false;
  return /\b(plant|scoop works|whole|both|everything)\b/.test(t) || (!s.flags.cutLoose && !c(s, 'cutAt'));
}

function kembleReply(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('kemble', 'kembleAfter'));
    return s;
  }
  s = setFlag(s, 'spokeKemble');
  const v = starfall(s);
  if (REASON.test(t)) s = setFlag(s, 'toldKembleLives');
  if (falsePromise(s, t)) {
    s = setFlag(s, 'falsePromise');
    r.push(comms('kemble', 'kemblePromise'));
    return s;
  }
  if (CUT.test(t) && !QUESTION.test(t)) return cutWorks(s, t, r);
  if (WORKERS.test(t)) {
    s = setFlag(s, 'askedKemble');
    if (c(s, 'hidden') === 0) {
      r.push(comms('kemble', s.flags.scoopUp ? 'kembleThanks' : 'kembleHonest', vars(s)));
      return s;
    }
    if (v.count === 'ashamed' || s.flags.countKnown || s.flags.payroll) {
      r.push(comms('kemble', v.count === 'ashamed' && !s.flags.countKnown && !s.flags.payroll ? 'kembleConfess' : 'kembleCaves', vars(s)));
      s = setFlag(s, 'kembleOwned');
      return scoopUp(s);
    }
    s = setFlag(s, 'kembleLied');
    r.push(comms('kemble', 'kembleDenies', vars(s)));
    return s;
  }
  if (DESCEND.test(t) || /\b(ring|dock\w*|ready|coming|on our way)\b/.test(t)) {
    r.push(comms('kemble', 'kembleRing', vars(s)));
    return s;
  }
  r.push(comms('kemble', 'kembleStatus', vars(s)));
  return s;
}

function quellReply(s: WorldState, t: string, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(comms('quell', 'quellAfter'));
    return s;
  }
  s = setFlag(s, 'spokeQuell');
  const v = starfall(s);
  if (falsePromise(s, t)) {
    s = setFlag(s, 'falsePromise');
    r.push(comms('quell', 'quellPleased'));
    return s;
  }
  if (CUT.test(t) || /\b(cut|drop|jettison)\b/.test(t)) {
    if (v.agent === 'pragmatic' || REASON.test(t)) {
      s = setFlag(s, 'quellAgreed');
      r.push(comms('quell', v.agent === 'pragmatic' ? 'quellCutAgree' : 'quellCutYield'));
      return s;
    }
    r.push(comms('quell', 'quellCutRefuse'));
    return setFlag(s, 'quellRefusedCut');
  }
  if (NO_SAVE.test(t)) {
    s = setFlag(s, 'toldQuellTruth');
    r.push(comms('quell', 'quellHonest'));
    return s;
  }
  if (WORKERS.test(t)) {
    if (v.agent === 'pragmatic') {
      s = setFlag(s, 'payroll');
      r.push(comms('quell', 'quellPayroll', vars(s)));
      if (!s.flags.countKnown) {
        s = revealFact(s, 'count');
        s = setFlag(s, 'countKnown');
        s = setCounter(s, 'countAt', Math.max(1, s.turn));
        if (v.hidden > 0 && !s.flags.scoopUp) s = setFlag(s, 'countFound');
      }
      return s;
    }
    r.push(comms('quell', 'quellNoPayroll'));
    return s;
  }
  if (TOW.test(t) || /\b(save|salvage|asset)\b/.test(t)) {
    r.push(comms('quell', 'quellTow'));
    return s;
  }
  r.push(comms('quell', 'quellStatus', vars(s)));
  return s;
}

// ------------------------------------------------------------------ orders ---

/** The officer an order was addressed to, passed on by the interpreter as a prefix ("helm: …"). */
const PREFIX = /^(xo|tactical|sensors|science|ops|helm|comms|engineering|medical): /;

export function leave(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (onHabitat(s) === 0 || s.flags.endTow) {
    r.push(say('helm', 'leavingClear'));
    return setFlag(s, 'endClear');
  }
  r.push(say('helm', 'leavingHabitat', vars(s)));
  s = setCounter(s, 'deadCiv', onHabitat(s));
  return setFlag(s, 'endLeft');
}

export function act(s: WorldState, raw: string, r: Report[]): WorldState {
  const low = raw.toLowerCase();
  const to = (low.match(PREFIX)?.[1] ?? '') as string;
  const t = low.replace(PREFIX, '');
  if (settled(s)) {
    r.push(say('xo', 'afterEnd'));
    return s;
  }
  if (LEAVE.test(t)) return leave(s, r);
  // Who flies.
  if (DUARTE_WORD.test(t) && (HELM_SWAP.test(t) || DELEGATE.test(t))) return swapToDuarte(s, r);
  if (/\badeyemi\b/.test(t) && /\b(back|again|retake|return)\b/.test(t) && HELM_SWAP.test(t)) return swapToAdeyemi(s, r);
  // Talking to the habitat or the yacht through comms.
  if (QUELL_WORD.test(t) && (TELL.test(t) || PROMISE.test(t))) {
    r.push(say('comms', 'relayed'));
    return quellRespond(s, t, r);
  }
  if (KEMBLE_WORD.test(t) && TELL.test(t) && !DESCEND.test(t)) {
    r.push(say('comms', 'relayed'));
    return kembleRespond(s, t, r);
  }
  let did = false;
  if (LIMIT.test(t)) {
    s = setLimit(s, r);
    did = true;
  }
  if (!did && ABORT.test(t)) return abort(s, r);
  if (BACK.test(t)) {
    s = backHim(s, r);
    did = true;
  }
  if (DELEGATE.test(t)) {
    s = delegate(s, r);
    did = true;
  }
  if (s.flags.lineOffered && !s.flags.lineApproved && APPROVE.test(t) && (to === 'helm' || to === '' || /\b(line|column|updraft)\b/.test(t))) {
    s = approveLine(s, r);
    did = true;
  } else if (s.flags.lineApproved && /\b(fly|take|ride|use) (your|that|the|his) (line|column|updraft)\b/.test(t)) {
    s = approveLine(s, r);
    did = true;
  }
  if (CUT.test(t)) return cutWorks(s, t, r);
  if (TOW.test(t) && !DESCEND.test(t)) return tow(s, r);
  if (LIFESIGNS.test(t)) return lifeSigns(s, r);
  if (STORM_READ.test(t)) {
    s = revealFact(s, 'storm');
    r.push(say('sensors', `vargaStorm_${starfall(s).storm}`));
    return s;
  }
  if (DESCEND.test(t)) return descend(s, r);
  if (/\badeyemi\b/.test(t) && HELM_SWAP.test(t)) return swapToAdeyemi(s, r);
  if (!did && MICRO.test(t)) return micro(s, r);
  if (did) return s;
  if (to === 'helm' && HELM_SWAP.test(t)) {
    r.push(pilot(s, 'helmReady', vars(s)));
    return s;
  }
  if (KEMBLE_WORD.test(t)) {
    r.push(say('comms', 'relayed'));
    return kembleRespond(s, t, r);
  }
  r.push(say('xo', 'starfallUnclear', { description: raw.slice(0, 80) }));
  return s;
}

export function ask(s: WorldState, raw: string, r: Report[]): WorldState {
  const low = raw.toLowerCase();
  const to = (low.match(PREFIX)?.[1] ?? '') as string;
  const t = low.replace(PREFIX, '');
  const v = starfall(s);
  if (to === 'helm' || /\b(adeyemi|kofi|ensign)\b/.test(t) || /\bhow (would you )?fly\b/.test(t)) {
    if (HULL.test(t) && !duarteFlying(s)) {
      r.push(adeyemi(v.nerve === 'eager' ? 'adeyemiHullEager' : 'adeyemiHullDefer'));
      return s;
    }
    return askPilot(s, r);
  }
  if (DUARTE_WORD.test(t)) {
    r.push(duarte('duarteRead', vars(s)));
    return s;
  }
  if (to === 'engineering' || HULL.test(t) || /\b(chief|okafor)\b/.test(t)) {
    if (LIGHTEN.test(t) || CUT.test(t)) {
      s = revealFact(s, 'cutLoose');
      r.push(say('engineering', 'okaforIdea', vars(s)));
      return s;
    }
    s = setFlag(s, 'hullAsked');
    if (!c(s, 'trips') && !flying(s)) s = setFlag(s, 'hullAskedEarly');
    s = revealFact(s, 'tolerance');
    r.push(say('engineering', c(s, 'strain') > v.tolerance ? 'okaforHullPast' : 'okaforHull', vars(s)));
    if (v.nerve === 'eager' && !duarteFlying(s) && !s.flags.okaforEagerNote) {
      s = setFlag(s, 'okaforEagerNote');
      r.push(say('engineering', 'okaforEager'));
    }
    return s;
  }
  if (LIGHTEN.test(t) || /\b(scoop works|cut (her|it) loose)\b/.test(t)) {
    s = revealFact(s, 'cutLoose');
    r.push(say('engineering', 'okaforIdea', vars(s)));
    return s;
  }
  if (to === 'sensors' || to === 'science' || /\b(storm|clouds?|weather|wind|varga)\b/.test(t)) {
    if (/\b(life ?signs?|count|how many|people|souls|manifest)\b/.test(t)) return lifeSigns(s, r);
    s = revealFact(s, 'storm');
    r.push(say('sensors', `vargaStorm_${v.storm}`));
    return s;
  }
  if (/\b(life ?signs?|manifest|head ?count|how many (people|souls|are (there|aboard|left)))\b/.test(t)) {
    r.push(say('xo', 'xoCount', vars(s)));
    return s;
  }
  if (/\b(quell|agent|yacht|dividend|company)\b/.test(t)) {
    r.push(say('comms', 'commsQuell'));
    return s;
  }
  if (/\b(kemble|factor|habitat|thistledown)\b/.test(t) && !CASE.test(t)) {
    r.push(say('comms', 'commsKemble', vars(s)));
    return s;
  }
  if (COUNSEL.test(t) || /\b(who should fly|which pilot|duarte or adeyemi|adeyemi or duarte)\b/.test(t)) {
    const key = !c(s, 'rescueAt') && !s.flags.relievedAdeyemi && !s.flags.delegated ? 'xoCounselPilot' : !knows(s, 'tolerance') ? 'xoCounselHull' : !s.flags.countKnown && !s.flags.scoopUp ? 'xoCounselCount' : 'xoCounselGo';
    r.push(say('xo', key, vars(s)));
    return s;
  }
  r.push(say('xo', 'xoCase', vars(s)));
  return s;
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
  step(work);
  step(planet);
  return { state: syncSouls(s), reports };
}

function housekeeping(s: WorldState, r: Report[]): WorldState {
  for (const id of ['kestrel'] as const) {
    const k = s.ships[id];
    if (k.nav || k.velocity.x || k.velocity.y) s = { ...s, ships: { ...s.ships, [id]: { ...k, nav: null, velocity: { x: 0, y: 0 } } } };
  }
  if (s.flags.shotsFired) {
    r.push(say('xo', 'shotsAtHabitat'));
    return setFlag(s, 'endFired');
  }
  if (s.flags.jumped || s.ships.halcyon.position.x < -30000) return leave(s, r);
  return s;
}

function contacts(s: WorldState, r: Report[]): WorldState {
  if (s.turn >= 1 && !s.flags.kembleCalled) {
    s = setFlag(s, 'kembleCalled');
    r.push(comms('kemble', 'kembleCall', vars(s)));
  }
  if (s.turn >= 2 && !s.flags.quellCalled) {
    s = setFlag(s, 'quellCalled');
    r.push(comms('quell', starfall(s).agent === 'company' ? 'quellCallCompany' : 'quellCallPragmatic'));
  }
  if (s.turn >= 3 && !c(s, 'rescueAt') && !flying(s) && !towing(s) && !s.flags.xoChased) {
    s = setFlag(s, 'xoChased');
    r.push(say('xo', 'xoChases', vars(s)));
  }
  return s;
}

function work(s: WorldState, r: Report[]): WorldState {
  const v = starfall(s);
  // The cut: the scoop works fall away and the habitat steadies.
  const ca = c(s, 'cutAt');
  if (ca > 0 && s.turn >= ca && !s.flags.cutLoose) {
    s = setFlag(s, 'cutLoose');
    r.push(say('sensors', 'worksFall', vars(s)));
  }
  // The tow.
  const te = c(s, 'towEnd');
  if (te > 0) {
    const ts = c(s, 'towStart');
    const per = Math.max(1, te - ts);
    s = setCounter(s, 'depth', Math.max(0, c(s, 'depth') - Math.ceil(c(s, 'depth') / per)));
    if (s.turn >= te) {
      const before = c(s, 'strain');
      const strain = before + towStrain(s);
      s = setCounter(s, 'strain', strain);
      s = setCounter(s, 'peakStrain', Math.max(c(s, 'peakStrain'), strain));
      if (before <= v.tolerance && strain > v.tolerance) s = setFlag(s, s.flags.tripInformed ? 'crossedInformed' : 'crossedBlind');
      s = setCounter(s, 'towEnd', 0);
      if (strain >= breakingOf(v)) {
        r.push(say('engineering', 'frameGives', vars(s)));
        return setFlag(s, 'endDragged');
      }
      s = setFlag(s, 'towed');
      r.push(pilot(s, 'towClear', vars(s)));
      return setFlag(s, 'endTow');
    }
    r.push(pilot(s, 'towClimbing', vars(s)));
    return s;
  }
  // A descent in progress.
  if (flying(s)) {
    if (c(s, 'tripDock') > 0 && s.turn >= c(s, 'tripDock')) s = dock(s, r);
    else if (c(s, 'tripDock') > 0 && s.turn === c(s, 'tripStart') + 1) r.push(pilot(s, 'inCloud', vars(s)));
    if (s.turn >= c(s, 'tripEnd')) {
      s = tripHome(s, r);
      if (settled(s)) return s;
      if (c(s, 'upper') === 0) {
        if (c(s, 'hidden') > 0) {
          r.push(say('xo', 'manifestClear', vars(s)));
          s = setCounter(s, 'deadCiv', c(s, 'hidden'));
          s = setFlag(s, 'leftHidden');
        } else r.push(say('xo', 'everyoneAboard', vars(s)));
        return setFlag(s, 'endClear');
      }
    }
    return s;
  }
  // Between descents.
  if (s.flags.rescueOn && c(s, 'upper') > 0) {
    if (c(s, 'depth') + sinkNow(s) * (tripLength(s) - 1) > dockLimit(s) && !s.flags.dockWarned) {
      s = setFlag(s, 'dockWarned');
      r.push(pilot(s, duarteFlying(s) ? 'duarteTooDeep' : 'adeyemiTooDeep', vars(s)));
    }
    const over = c(s, 'strain') + projected(s) > v.tolerance;
    if (over && !s.flags.pastAuthorised && (s.flags.hullAsked || s.flags.limitSet) && !s.flags.okaforWarned) {
      s = revealFact(s, 'tolerance');
      s = setFlag(s, 'okaforWarned');
      s = setFlag(s, 'warnedBeforeLimit');
      s = setFlag(s, 'rescueOn', false);
      s = setFlag(s, 'paused');
      r.push(say('engineering', 'okaforLimit', vars(s)));
      if (v.nerve === 'eager' && !duarteFlying(s) && !s.flags.limitSet) {
        s = setCounter(s, 'eagerAt', s.turn + 1);
        r.push(adeyemi('adeyemiEager', vars(s)));
      }
      return s;
    }
    return startTrip(s, r, 'auto');
  }
  // Eager, unchecked, he goes anyway.
  const ea = c(s, 'eagerAt');
  if (ea > 0 && s.turn >= ea && s.flags.paused && !duarteFlying(s) && c(s, 'upper') > 0) {
    s = setCounter(s, 'eagerAt', 0);
    s = setFlag(s, 'rescueOn');
    return startTrip(s, r, 'eager');
  }
  return s;
}

function planet(s: WorldState, r: Report[]): WorldState {
  if (towing(s) || s.flags.endTow) return s;
  const depth = c(s, 'depth') + sinkNow(s);
  s = setCounter(s, 'depth', depth);
  const left = Math.ceil((CRUSH - depth) / sinkNow(s));
  if (depth >= CRUSH) {
    if (c(s, 'upper') > 0) s = setFlag(s, 'lostUpper');
    s = setCounter(s, 'deadCiv', onHabitat(s));
    r.push(say('sensors', onHabitat(s) ? 'habitatCrushed' : 'habitatCrushedEmpty', vars(s)));
    return setFlag(s, 'endLost');
  }
  if (left <= 4 && !s.flags.crushWarned) {
    s = setFlag(s, 'crushWarned');
    r.push(say('sensors', 'crushNear', vars(s)));
  }
  return s;
}
