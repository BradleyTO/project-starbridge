/**
 * The Glass Nebula — the agents: Surveyor Nessa Vale on the shuttle Citrine (whose voice may be
 * an echo), the automated buoy Prism, the nebula itself (which bends sensors and stretches time),
 * and the Halcyon's officers. Deterministic: no randomness after setup.
 *
 * Relying on the science officer is the point. The environment lies. Two messages contradict, and
 * which is real depends on physics only Lt. Varga can model, a stage at a time. The captain's gut
 * call — which message to believe — is only sound once that model is in; plunging on a stamp or a
 * feeling strands the ship, chases a ghost, or arrives too late by the shuttle's clock. Judged on
 * what was known when each decision was made (ISA-COM-001 §1.4).
 */
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import type { Applied } from '../../engine/reduce';
import { knows, patchShip, revealFact, setCounter, setFlag } from '../../engine/state';
import { falseLocus, glass, trueLocus, type GlassVariant } from './setup';
import {
  CASE, COUNSEL, FOLD_WORD, FORCE, GLASS_WORD, GO_DEEP, HOLD, IS_QUESTION, LEAVE, MESSAGES, MODEL, PROBE, RESCUE, RIM_WORD, TURN_BACK,
} from './words';

const END_FLAGS = ['endHome', 'endShear', 'endProbe', 'endTurned', 'endGhost', 'endStrand', 'endLate', 'endLeft', 'endLost', 'endShatter'] as const;
export const settled = (s: WorldState) => END_FLAGS.some((f) => !!s.flags[f]);
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;

/** Where the Halcyon is relative to the nebula. */
export const POS = ['rim', 'glass', 'fold', 'deep'] as const;
export type Pos = (typeof POS)[number];
export const posOf = (s: WorldState): Pos => POS[c(s, 'pos')] ?? 'rim';
const posIndex = (p: Pos) => POS.indexOf(p);

export const modeling = (s: WorldState) => c(s, 'modelAt') > 0;
export const modelReady = (s: WorldState) => knows(s, 'model');
export const locusKnown = (s: WorldState) => knows(s, 'locus');
export const orderKnown = (s: WorldState) => knows(s, 'order');

export function vars(s: WorldState): Record<string, string | number> {
  const v = glass(s);
  return {
    turn: s.turn,
    echo: v.echo,
    physics: v.physics,
    crew: v.crew,
    pace: v.pace,
    souls: v.souls,
    failIn: Math.max(0, v.failAt - s.turn),
    pos: posOf(s),
    trueLocus: trueLocus(v),
    falseLocus: falseLocus(v),
    modeling: modeling(s) ? 1 : 0,
    model: modelReady(s) ? 1 : 0,
    order: orderKnown(s) ? 1 : 0,
    locus: locusKnown(s) ? 1 : 0,
    crewKnown: knows(s, 'crew') ? 1 : 0,
    rescued: c(s, 'rescued'),
    hull: s.ships.halcyon.hull,
    delay: c(s, 'delay'),
  };
}

const varga = (key: string, v?: Record<string, string | number>) => say('sensors', key, v);
const helm = (key: string, v?: Record<string, string | number>) => say('helm', key, v);
const xo = (key: string, v?: Record<string, string | number>) => say('xo', key, v);
const szabo = (key: string, v?: Record<string, string | number>) => say('comms', key, v);
const okafor = (key: string, v?: Record<string, string | number>) => say('engineering', key, v);
const rask = (key: string, v?: Record<string, string | number>) => say('tactical', key, v);
const osei = (key: string, v?: Record<string, string | number>) => say('medical', key, v);

function commit(s: WorldState, deep: boolean): WorldState {
  if (!s.flags.committed) {
    s = setFlag(s, 'committed');
    if (!modelReady(s) && deep) s = setFlag(s, 'committedBlind');
  }
  return s;
}

// ------------------------------------------------------------------ endings ---

function endHome(s: WorldState, r: Report[], how: 'direct' | 'shear' | 'probe' | 'turned'): WorldState {
  if (settled(s)) return s;
  const flag = how === 'shear' ? 'endShear' : how === 'probe' ? 'endProbe' : how === 'turned' ? 'endTurned' : 'endHome';
  s = setFlag(s, flag);
  s = setCounter(s, 'rescued', glass(s).souls || c(s, 'rescued') || 4);
  r.push(osei('crewAboard', vars(s)));
  return s;
}

function endFail(s: WorldState, flag: (typeof END_FLAGS)[number], r: Report[], key: string, role: 'xo' | 'helm' | 'sensors' | 'engineering' | 'tactical' = 'xo'): WorldState {
  if (settled(s)) return s;
  r.push(say(role, key, vars(s)));
  return setFlag(s, flag);
}

// ------------------------------------------------------------------ science ---

export function startModel(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (!s.flags.committedBlind && !s.flags.plunged) s = setFlag(s, 'studiedFirst');
  if (modeling(s) || modelReady(s)) {
    r.push(varga(modelReady(s) ? 'modelDone' : 'modelWorking', vars(s)));
    return s;
  }
  const pace = glass(s).pace;
  s = setFlag(s, 'modeling');
  s = setCounter(s, 'modelAt', Math.max(1, s.turn));
  s = setCounter(s, 'orderAt', s.turn + pace);
  s = setCounter(s, 'locusAt', s.turn + pace * 2);
  s = setCounter(s, 'crewAt', s.turn + pace * 3);
  r.push(varga('modelStart', vars(s)));
  return s;
}

function advanceModel(s: WorldState, r: Report[]): WorldState {
  if (!modeling(s) || settled(s)) return s;
  const v = glass(s);
  if (!orderKnown(s) && s.turn >= c(s, 'orderAt')) {
    s = revealFact(s, 'order');
    s = revealFact(s, 'messages');
    s = setCounter(s, 'strandAt', 0);
    r.push(varga(v.echo === 'help-false' ? 'orderHelpEcho' : 'orderStayEcho', vars(s)));
  }
  if (!locusKnown(s) && s.turn >= c(s, 'locusAt') && orderKnown(s)) {
    s = revealFact(s, 'locus');
    r.push(varga(`locus_${trueLocus(v)}`, vars(s)));
  }
  if (!knows(s, 'crew') && s.turn >= c(s, 'crewAt') && locusKnown(s)) {
    s = revealFact(s, 'crew');
    s = revealFact(s, 'model');
    s = setCounter(s, 'strandAt', 0); // a working model finds the way out
    r.push(varga(`crew_${v.crew}`, vars(s)));
    r.push(varga(`physics_${v.physics}`, vars(s)));
  }
  return s;
}

// ------------------------------------------------------------------ movement ---

function moveTo(s: WorldState, p: Pos, r: Report[]): WorldState {
  if (c(s, 'arriveAt') > 0) {
    r.push(helm('helmBusy'));
    return s;
  }
  if (posOf(s) === p && !c(s, 'moveAt')) {
    r.push(helm(`helmAlready_${p}`, vars(s)));
    return s;
  }
  const deep = p === 'glass' || p === 'fold' || p === 'deep';
  // Adeyemi warns once before taking the Fold without a model.
  if (p === 'fold' && !modelReady(s) && !s.flags.adeyemiWarned) {
    s = setFlag(s, 'adeyemiWarned');
    r.push(helm('adeyemiFoldWarn', vars(s)));
    return s;
  }
  s = commit(s, deep);
  if (deep && !modelReady(s)) s = setFlag(s, 'plunged');
  s = setCounter(s, 'moveTo', posIndex(p));
  // Blind deep moves take longer (time shear / wrong path).
  const delay = deep && !modelReady(s) ? 3 : deep && modelReady(s) && p === trueLocus(glass(s)) ? 1 : 2;
  s = setCounter(s, 'moveAt', s.turn + delay);
  s = setCounter(s, 'delay', c(s, 'delay') + (deep && !modelReady(s) ? 2 : 0));
  r.push(helm(`helmMoving_${p}`, vars(s)));
  return s;
}

function holdRim(s: WorldState, r: Report[]): WorldState {
  if (posOf(s) === 'rim') {
    s = setFlag(s, 'heldRim');
    r.push(helm('helmHoldingRim'));
    return s;
  }
  return moveTo(s, 'rim', r);
}

function leave(s: WorldState, r: Report[]): WorldState {
  const v = glass(s);
  r.push(helm('leavingNebula'));
  if (v.echo === 'stay-false' && v.crew !== 'gone' && c(s, 'rescued') === 0) return endFail(s, 'endLeft', r, 'leftThem');
  if (c(s, 'rescued') > 0) return s; // already ended via rescue
  return endFail(s, 'endLeft', r, 'leftEmpty');
}

// ------------------------------------------------------------------ rescue paths ---

function atTrue(s: WorldState): boolean {
  return posOf(s) === trueLocus(glass(s));
}

function canRecover(s: WorldState): boolean {
  const v = glass(s);
  if (v.crew === 'gone') return false;
  if (v.crew === 'failing' && s.turn >= v.failAt) return false;
  return true;
}

function tryRescue(s: WorldState, r: Report[], how: 'direct' | 'shear' | 'probe' | 'turned'): WorldState {
  if (settled(s)) return s;
  const v = glass(s);
  if (how === 'turned') {
    if (v.echo !== 'help-false') {
      r.push(varga('turnBackWrong', vars(s)));
      return s;
    }
    if (!orderKnown(s)) {
      r.push(varga('turnBackBlind'));
      return s;
    }
    s = setFlag(s, 'turnedBack');
    if (orderKnown(s)) s = setFlag(s, 'turnedOnEvidence');
    if (trueLocus(v) === 'rim' && canRecover(s)) {
      r.push(varga('turnBackRight', vars(s)));
      return endHome(s, r, 'turned');
    }
    // Help was an echo; crew already gone — success of judgment, shuttle lost.
    r.push(varga('turnBackGone', vars(s)));
    return endFail(s, 'endLost', r, 'shuttleGone', 'sensors');
  }
  if (!canRecover(s)) {
    s = setFlag(s, 'tooLate');
    return endFail(s, 'endLate', r, 'tooLateByClock', 'sensors');
  }
  if (how === 'probe') {
    if (!locusKnown(s)) {
      r.push(okafor('probeNeedsLocus'));
      return s;
    }
    s = setFlag(s, 'probeUsed');
    if (locusKnown(s) && !s.flags.committedBlind) s = setFlag(s, 'probeOnEvidence');
    r.push(okafor('probeRelayGoing', vars(s)));
    s = setCounter(s, 'relayAt', s.turn + 2);
    return s;
  }
  if (how === 'shear') {
    if (v.physics !== 'shear') {
      r.push(varga('shearNotHere', vars(s)));
      return s;
    }
    if (!modelReady(s)) {
      r.push(varga('shearNeedsModel'));
      return s;
    }
    s = setFlag(s, 'shearUsed');
    s = setFlag(s, 'shearOnEvidence');
    r.push(helm('helmShearIn', vars(s)));
    s = setCounter(s, 'pos', posIndex('fold'));
    s = setCounter(s, 'shearAt', s.turn + 1);
    return s;
  }
  if (!atTrue(s)) {
    r.push(xo('notThereYet', vars(s)));
    return s;
  }
  s = setFlag(s, 'rescuedDirect');
  if (modelReady(s) && !s.flags.committedBlind) s = setFlag(s, 'rescuedOnEvidence');
  return endHome(s, r, 'direct');
}

function launchProbe(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (c(s, 'probeAt') > 0 || c(s, 'relayAt') > 0) {
    r.push(okafor('probeBusy'));
    return s;
  }
  if (!modeling(s) && !modelReady(s)) {
    // A probe can also feed Varga's model.
    s = startModel(s, r);
    s = setFlag(s, 'probed');
    s = setCounter(s, 'probeAt', s.turn + 1);
    // Speeds the next stage by a minute.
    for (const k of ['orderAt', 'locusAt', 'crewAt']) {
      const at = c(s, k);
      if (at > s.turn + 1) s = setCounter(s, k, at - 1);
    }
    r.push(okafor('probeForScience'));
    return s;
  }
  return tryRescue(s, r, 'probe');
}

// ------------------------------------------------------------------ force / shatter ---

function forceEntry(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  s = setFlag(s, 'forced');
  s = setFlag(s, 'committedBlind');
  r.push(rask('forceWarned'));
  // Second force order shatters.
  if (s.flags.forceWarned) {
    s = patchShip(s, 'kestrel', { hull: 0, destroyed: true, souls: 0 });
    const vale = s.characters.vale;
    if (vale) s = { ...s, characters: { ...s.characters, vale: { ...vale, status: 'dead' } } };
    return endFail(s, 'endShatter', r, 'shatteredShuttle', 'tactical');
  }
  return setFlag(s, 'forceWarned');
}

// ------------------------------------------------------------------ ask / act ---

export function ask(s: WorldState, text: string, r: Report[]): WorldState {
  const t = text.toLowerCase();
  if (MODEL.test(t) || /\b(varga|science|sensors)\b/.test(t) && /\b(model|study|map|nebula|physics|what)\b/.test(t)) return startModel(s, r);
  if (MESSAGES.test(t) || /\b(which|echo|real|later|stamp)\b/.test(t)) {
    if (orderKnown(s)) r.push(varga(glass(s).echo === 'help-false' ? 'orderHelpEcho' : 'orderStayEcho', vars(s)));
    else if (modeling(s)) r.push(varga('modelWorking', vars(s)));
    else r.push(varga('orderUnknown'));
    return s;
  }
  if (/\b(where|locus|position|shuttle|citrine)\b/.test(t)) {
    if (locusKnown(s)) r.push(varga(`locus_${trueLocus(glass(s))}`, vars(s)));
    else if (modeling(s)) r.push(varga('modelWorking', vars(s)));
    else r.push(varga('locusUnknown'));
    return s;
  }
  if (/\b(crew|alive|souls|vale|failing|life support)\b/.test(t)) {
    if (knows(s, 'crew')) r.push(varga(`crew_${glass(s).crew}`, vars(s)));
    else if (modeling(s)) r.push(varga('modelWorking', vars(s)));
    else r.push(varga('crewUnknown'));
    return s;
  }
  if (/\b(fold|shear)\b/.test(t)) {
    if (modelReady(s)) r.push(varga(glass(s).physics === 'shear' ? 'physics_shear' : 'shearNotHere', vars(s)));
    else r.push(varga('shearNeedsModel'));
    return s;
  }
  if (CASE.test(t) || COUNSEL.test(t) || IS_QUESTION.test(t)) {
    r.push(xo('counsel', vars(s)));
    if (!modelReady(s)) r.push(varga(modeling(s) ? 'modelWorking' : 'counselScience', vars(s)));
    return s;
  }
  r.push(xo('counsel', vars(s)));
  return s;
}

export function act(s: WorldState, text: string, r: Report[]): WorldState {
  const t = text.toLowerCase();
  if (FORCE.test(t)) return forceEntry(s, r);
  if (MODEL.test(t)) return startModel(s, r);
  if (PROBE.test(t)) return launchProbe(s, r);
  if (FOLD_WORD.test(t) && /\b(use|ride|take the (fold|shear)|through the (fold|shear))\b/.test(t)) {
    // Prefer the shear rescue path when the model says it is one; otherwise just move to the Fold.
    if (modelReady(s) && glass(s).physics === 'shear') return tryRescue(s, r, 'shear');
    return moveTo(s, 'fold', r);
  }
  if (FOLD_WORD.test(t) && /\b(take|go|head|fly|enter)\b/.test(t)) return moveTo(s, 'fold', r);
  if (GLASS_WORD.test(t) && /\b(take|go|head|fly|enter|into|make)\b/.test(t)) return moveTo(s, 'glass', r);
  if (TURN_BACK.test(t)) return tryRescue(holdRim(s, r), r, 'turned');
  if (RIM_WORD.test(t) || HOLD.test(t)) {
    if (HOLD.test(t) && orderKnown(s) && glass(s).echo === 'help-false')
      return tryRescue(holdRim(s, r), r, 'turned');
    return holdRim(s, r);
  }
  if (GO_DEEP.test(t)) {
    const v = glass(s);
    const target: Pos = locusKnown(s) ? trueLocus(v) : v.echo === 'stay-false' || !orderKnown(s) ? 'glass' : 'rim';
    if (target === 'rim') return holdRim(s, r);
    return moveTo(s, target === 'fold' ? 'fold' : 'glass', r);
  }
  if (RESCUE.test(t)) {
    if (atTrue(s) || (posOf(s) === 'rim' && trueLocus(glass(s)) === 'rim')) return tryRescue(s, r, 'direct');
    if (locusKnown(s)) return moveTo(s, trueLocus(glass(s)) === 'fold' ? 'fold' : trueLocus(glass(s)) === 'rim' ? 'rim' : 'glass', r);
    r.push(xo('rescueBlind'));
    return moveTo(s, 'glass', r);
  }
  if (LEAVE.test(t) && !/\bcharge the jump|engage the jump\b/.test(t)) return leave(s, r);
  // Addressee-routed: "sensors: …" / "helm: …"
  if (/^sensors:/.test(t) || /^science:/.test(t)) return startModel(s, r);
  if (/^helm:/.test(t)) {
    if (FOLD_WORD.test(t)) return moveTo(s, 'fold', r);
    if (GLASS_WORD.test(t)) return moveTo(s, 'glass', r);
    if (RIM_WORD.test(t) || HOLD.test(t)) return holdRim(s, r);
    if (GO_DEEP.test(t)) return moveTo(s, 'glass', r);
  }
  if (/^engineering:/.test(t) && PROBE.test(t)) return launchProbe(s, r);
  r.push(xo('impOther'));
  return s;
}

// ------------------------------------------------------------------ dialogue helpers ---

export function valeRespond(s: WorldState, t: string, r: Report[]): WorldState {
  const v = glass(s);
  s = setFlag(s, 'hailedVale');
  // Contact is garbled until the model has the order, or until we are at the true locus.
  const clear = orderKnown(s) || atTrue(s) || !!s.flags.channelClear;
  if (!clear) {
    s = setCounter(s, 'garbled', c(s, 'garbled') + 1);
    r.push(comms('vale', c(s, 'garbled') % 2 === 0 ? 'valeGarbledHelp' : 'valeGarbledStay', vars(s)));
    return s;
  }
  s = setFlag(s, 'channelClear');
  if (v.crew === 'gone') {
    r.push(comms('vale', 'valeGone'));
    return s;
  }
  if (/\b(hold|stay|coming|hang on|rescue|help is)\b/.test(t)) {
    r.push(comms('vale', v.crew === 'failing' ? 'valeFailing' : 'valeAlive', vars(s)));
    return s;
  }
  if (/\b(where|position|are you)\b/.test(t)) {
    r.push(comms('vale', locusKnown(s) ? `valeAt_${trueLocus(v)}` : 'valeWhereGarbled', vars(s)));
    return s;
  }
  r.push(comms('vale', v.crew === 'failing' ? 'valeFailing' : 'valeAlive', vars(s)));
  return s;
}

export function prismRespond(s: WorldState, _t: string, r: Report[]): WorldState {
  s = setFlag(s, 'hailedPrism');
  r.push(comms('prism', 'prismTelemetry', vars(s)));
  // Hailing the buoy can start or speed the model.
  if (!modeling(s) && !modelReady(s)) s = startModel(s, r);
  return s;
}

// ------------------------------------------------------------------ simulate ---

function resolveMove(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'moveAt') > 0 && s.turn >= c(s, 'moveAt')) {
    const dest = POS[c(s, 'moveTo')] ?? 'rim';
    s = setCounter(s, 'pos', posIndex(dest));
    s = setCounter(s, 'moveAt', 0);
    r.push(helm(`helmArrived_${dest}`, vars(s)));
    const v = glass(s);
    const deep = dest === 'glass' || dest === 'fold' || dest === 'deep';
    // Arriving at the false locus without a model: ghost chase.
    if (!modelReady(s) && dest === falseLocus(v) && dest !== 'rim') {
      s = setFlag(s, 'ghostChase');
      s = patchShip(s, 'halcyon', { hull: Math.max(40, s.ships.halcyon.hull - 25) });
      r.push(varga('ghostHit', vars(s)));
    }
    // Any blind deep arrival risks stranding.
    if (deep && !modelReady(s) && !s.flags.strandWarned) {
      s = setFlag(s, 'strandWarned');
      s = setCounter(s, 'strandAt', s.turn + 4);
      r.push(okafor('strandWarn', vars(s)));
    }
    // Arriving at true locus with model: ready to recover.
    if (dest === trueLocus(v) && modelReady(s)) {
      r.push(varga('atTrueLocus', vars(s)));
      if (canRecover(s) && !settled(s)) {
        // Auto-prompt; captain still needs rescue order, unless shear arrival.
        if (s.flags.shearUsed) return tryRescue(s, r, 'shear');
      }
    }
    // Blind arrival at true locus still works but may be late.
    if (dest === trueLocus(v) && !modelReady(s) && canRecover(s)) {
      r.push(varga('atTrueBlind', vars(s)));
    }
  }
  return s;
}

function resolveRelay(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'relayAt') > 0 && s.turn >= c(s, 'relayAt')) {
    s = setCounter(s, 'relayAt', 0);
    if (!canRecover(s)) return endFail(s, 'endLate', r, 'tooLateByClock', 'sensors');
    r.push(okafor('probeRelayDone', vars(s)));
    return endHome(s, r, 'probe');
  }
  if (c(s, 'shearAt') > 0 && s.turn >= c(s, 'shearAt')) {
    s = setCounter(s, 'shearAt', 0);
    if (!canRecover(s)) return endFail(s, 'endLate', r, 'tooLateByClock', 'sensors');
    return endHome(s, r, 'shear');
  }
  return s;
}

function resolveStrand(s: WorldState, r: Report[]): WorldState {
  if (c(s, 'strandAt') > 0 && s.turn >= c(s, 'strandAt') && !modelReady(s) && !orderKnown(s) && posOf(s) !== 'rim') {
    if (s.flags.ghostChase) return endFail(s, 'endGhost', r, 'ghostChased', 'sensors');
    return endFail(s, 'endStrand', r, 'strandedWeeks', 'engineering');
  }
  // If still at false locus and captain never models, ghost-chase ending after damage.
  if (s.flags.ghostChase && !modelReady(s) && posOf(s) !== 'rim' && s.turn >= (c(s, 'strandAt') || 99) - 1 && !settled(s) && s.ships.halcyon.hull < 80) {
    // Prefer stranded if timer hit; else if they jump/leave from ghost it's separate.
  }
  if (s.flags.ghostChase && s.flags.committedBlind && !modelReady(s) && posOf(s) !== 'rim' && c(s, 'delay') >= 4 && !c(s, 'strandAt')) {
    return endFail(s, 'endGhost', r, 'ghostChased', 'sensors');
  }
  return s;
}

function resolveCrewClock(s: WorldState, r: Report[]): WorldState {
  const v = glass(s);
  if (v.crew === 'failing' && s.turn >= v.failAt && c(s, 'rescued') === 0 && !settled(s)) {
    s = setFlag(s, 'crewFailed');
    // Update variant-facing flag; treat as gone for recovery.
    r.push(szabo('crewWentSilent', vars(s)));
    if (atTrue(s) || locusKnown(s)) return endFail(s, 'endLate', r, 'tooLateByClock', 'sensors');
    return endFail(s, 'endLost', r, 'shuttleGone', 'sensors');
  }
  return s;
}

function resolveJump(s: WorldState, r: Report[]): WorldState {
  if (s.flags.jumped && !settled(s)) return leave(s, r);
  return s;
}

/** Ghost-chase ending when captain followed the false help and never corrected. */
function resolveGhostEnd(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) return s;
  if (s.flags.ghostChase && s.flags.committedBlind && !modelReady(s) && posOf(s) !== 'rim' && s.turn >= 8) {
    return endFail(s, 'endGhost', r, 'ghostChased', 'sensors');
  }
  return s;
}

export function simulate(s: WorldState, _rng: Rng): Applied {
  if (settled(s) || s.outcome) return { state: s, reports: [] };
  const r: Report[] = [];
  s = advanceModel(s, r);
  s = resolveMove(s, r);
  s = resolveRelay(s, r);
  s = resolveStrand(s, r);
  s = resolveCrewClock(s, r);
  s = resolveJump(s, r);
  s = resolveGhostEnd(s, r);
  // Doing nothing forever with failing crew → lost.
  if (!settled(s) && glass(s).crew === 'alive' && s.turn >= 28 && c(s, 'rescued') === 0 && !modeling(s) && !s.flags.committed) {
    return { state: endFail(s, 'endLost', r, 'shuttleGone', 'xo'), reports: r };
  }
  return { state: s, reports: r };
}

export { glass, trueLocus, falseLocus };
export type { GlassVariant };
