/**
 * Reactor Night — the agents: the cascade itself, Chief Okafor's diagnosis and jobs, Crewman Paley
 * and the work pod Tern, Dr. Osei's watch on Paley's dose, the XO's deck-six precautions, and
 * Commander Basant's own call from the Larkspur. Deterministic: no randomness after setup.
 *
 * The heat climbs every minute by the cascade's seeded rate, faster as it gets hotter, faster
 * still with the jump drive charging or the shields drawing load; starving the reaction and using
 * the shield emitters as radiators slow it. It stops only when the real fault is fixed (Okafor's
 * manual regulator for a lying sensor, the standby pump for a failing pump, Paley's hands on a
 * stuck valve, or a cold bypass through the shield loop for either coolant fault) or when the core
 * is ejected. Nobody aboard knows which fault it is until Okafor has had time to find it.
 */
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms, say } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { deriveStatus } from '../../engine/rules';
import { knows, patchCharacter, patchShip, revealFact, setCounter, setFlag, setMemory } from '../../engine/state';
import { destroyShip } from '../../engine/combat';
import { BREACH_AT, DECK_AT, DIAG_AT, DIAG_PARTIAL, DOSE_FATAL, FAULT_NAME, POD_STANDOFF, reactor } from './setup';

/** Okafor's jobs (counters.job). */
export const JOB = { none: 0, manual: 1, pump: 2, clamps: 3, rig: 4 } as const;
export const JOB_NAME: Record<number, string> = { 0: 'nothing', 1: 'running the regulator by hand', 2: 'cross-connecting the backup pump', 3: 'cutting the ejection clamps', 4: 'rigging the shield loop for a bypass' };
export const JOB_TURNS: Record<number, number> = { 1: 2, 2: 3, 3: 2, 4: 1 };
/** Pod tasks (paley.memory.task) and stages (paley.memory.stage). */
export const TASK = { none: 0, valve: 1, manifold: 2 } as const;
export const STAGE = { standoff: 0, outbound: 1, working: 2, inbound: 3, adrift: 4 } as const;

export const pm = (s: WorldState) => s.characters.paley.memory;
export const bm = (s: WorldState) => s.characters.basant.memory;
export const heat = (s: WorldState) => s.counters.heat ?? 0;
export const settled = (s: WorldState) => !!s.flags.stopped || !!s.flags.ejected;
export const paleyAlive = (s: WorldState) => s.characters.paley.status !== 'dead';
/** Paley is in the pod (not beamed aboard, not dead). */
export const paleyInPod = (s: WorldState) => paleyAlive(s) && s.characters.paley.ship === 'kestrel' && s.ships.kestrel.souls > 0 && !s.ships.kestrel.destroyed;
export const podUsable = (s: WorldState) => !s.ships.kestrel.destroyed && pm(s).stage !== STAGE.adrift;
/** The pod is latched on the reactor spine (it blocks an ejection: the interlock will not release). */
export const podOnSpine = (s: WorldState) => !s.ships.kestrel.destroyed && (pm(s).stage === STAGE.outbound || pm(s).stage === STAGE.working || pm(s).stage === STAGE.adrift);
export const casualties = (s: WorldState) => (s.counters.deckLost ?? 0) + (paleyAlive(s) ? 0 : 1);

/** The cascade's climb this minute (before it is stopped). */
export function heatRate(s: WorldState): number {
  const v = reactor(s);
  const h = s.ships.halcyon;
  const t = heat(s);
  let r = v.rate + (t >= 80 ? 2 : t >= 60 ? 1 : 0);
  if (s.orders.jumpCharging) r += 1;
  if (h.shields.raised) r += 1;
  if (powerCut(s)) r -= 1;
  if (s.flags.radiators) r -= 1;
  if (s.flags.bypassSlows) r -= 2;
  return Math.max(1, r);
}

/** Load taken off the reactor: Okafor starved it, or the captain cut power to systems. */
export function powerCut(s: WorldState): boolean {
  if (s.flags.starved) return true;
  const h = s.ships.halcyon;
  let total = 0;
  for (const [id, x] of Object.entries(h.systems)) if (id !== 'reactor') total += x.power;
  return total <= 850;
}

export const minutesLeft = (s: WorldState) => Math.max(0, Math.ceil((BREACH_AT - heat(s)) / heatRate(s)));

export function simulate(s: WorldState, rng: Rng): Applied {
  const reports: Report[] = [];
  const run = (fn: (s: WorldState, rng: Rng, r: Report[]) => WorldState) => {
    if (s.outcome || s.ships.halcyon.destroyed) return;
    s = fn(s, rng, reports);
  };
  run(housekeeping);
  run(okaforWork);
  run(podWork);
  run(queuedEjection);
  run(cascade);
  run(afterEjection);
  run(basantCalls);
  return { state: s, reports };
}

// --------------------------------------------------------- housekeeping ---

function housekeeping(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  // "Stabilise the reactor" sends the shared engineering team to contact A; here it means Okafor's own core.
  const k = s.ships.kestrel;
  if (s.flags.kestrelStable || (k.containment < 100 && !k.destroyed)) {
    s = setFlag(s, 'kestrelStable', false);
    s = patchShip(s, 'kestrel', { containment: 100 });
    s = taskOkafor(s);
  }
  // The pod stays within a kilometre or so of the hull whatever the tractor or the helm does.
  if (!k.destroyed) {
    const h = s.ships.halcyon;
    const out = pm(s).stage === STAGE.standoff ? 1 : 0.4;
    s = patchShip(s, 'kestrel', { position: { x: h.position.x + POD_STANDOFF * 0.6 * out, y: h.position.y - POD_STANDOFF * 0.5 * out }, velocity: { ...h.velocity }, nav: null });
  }
  // Hauled in on the tractor beam: the pod comes off the spine (or in from its standoff) and docks.
  if (s.ships.halcyon.tractor.target === 'kestrel' && !k.destroyed) {
    const was = pm(s).stage;
    s = patchShip(s, 'halcyon', { tractor: { target: null } });
    s = setMemory(s, 'paley', 'stage', STAGE.standoff);
    s = setMemory(s, 'paley', 'task', TASK.none);
    s = setMemory(s, 'paley', 'frozen', 0);
    s = setMemory(s, 'paley', 'docked', 1);
    if (was !== STAGE.standoff && was !== STAGE.inbound) s = setFlag(s, 'paleyRecalled');
    r.push(say('helm', 'podHauledIn', { off: was === STAGE.outbound || was === STAGE.working || was === STAGE.adrift ? 1 : 0, aboard: paleyInPod(s) ? 1 : 0 }));
  }
  return s;
}

export function taskOkafor(s: WorldState): WorldState {
  if (!s.flags.okaforOnIt) s = setCounter(s, 'okaforFrom', s.turn);
  return s.flags.okaforOnIt ? s : setFlag(s, 'okaforOnIt');
}

// -------------------------------------------------------------- Okafor ---

/** Diagnosis progress (Varga's flow scan adds two at once). */
export function advanceDiag(s: WorldState, n: number, r: Report[]): WorldState {
  if (knows(s, 'fault_known')) return s;
  const v = reactor(s);
  const d = (s.counters.diag ?? 0) + n;
  s = setCounter(s, 'diag', d);
  if (d >= DIAG_PARTIAL && !knows(s, 'fault_ruled_out')) {
    s = revealFact(s, 'fault_ruled_out');
    r.push(say('engineering', 'okaforRulesOut', { not: FAULT_NAME[v.ruledOut] }));
  }
  if (d >= DIAG_AT) s = knowFault(s, r, 'diagnosis');
  return s;
}

export function knowFault(s: WorldState, r: Report[], how: 'diagnosis' | 'elimination' | 'valve'): WorldState {
  if (knows(s, 'fault_known')) return s;
  s = revealFact(s, 'fault_ruled_out');
  s = revealFact(s, 'fault_known');
  s = setCounter(s, 'diag', Math.max(s.counters.diag ?? 0, DIAG_AT));
  if (!s.flags.firstFixTurn) s = setFlag(s, 'diagnosedBeforeFix');
  r.push(say('engineering', `okaforKnows_${reactor(s).fault}`, { how, bypass: s.flags.bypassRigged ? 1 : 0 }));
  return s;
}

function okaforWork(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (s.flags.okaforOnIt && !settled(s)) s = advanceDiag(s, 1, r);
  const job = s.counters.job ?? 0;
  if (!job) return s;
  const left = (s.counters.jobLeft ?? 0) - 1;
  s = setCounter(s, 'jobLeft', Math.max(0, left));
  if (left > 0) return s;
  s = setCounter(s, 'job', JOB.none);
  return finishJob(s, job, r);
}

function finishJob(s: WorldState, job: number, r: Report[]): WorldState {
  const v = reactor(s);
  switch (job) {
    case JOB.manual:
      if (v.fault === 'sensor') return stop(s, 'manual', r);
      s = setFlag(s, 'manualTried');
      if (!knows(s, 'fault_known')) s = setFlag(s, 'wrongFixBlind');
      r.push(say('engineering', 'okaforManualNoGood'));
      return eliminate(s, r);
    case JOB.pump:
      if (v.fault === 'pump') return stop(s, 'pump', r);
      s = setFlag(s, 'pumpTried');
      if (!knows(s, 'fault_known')) s = setFlag(s, 'wrongFixBlind');
      r.push(say('engineering', 'okaforPumpNoGood'));
      return eliminate(s, r);
    case JOB.clamps:
      s = setFlag(s, 'clampsCut');
      r.push(say('engineering', 'okaforClampsCut', { queued: s.flags.ejectQueued ? 1 : 0 }));
      if (s.flags.ejectQueued) s = tryEject(s, r, false);
      return s;
    case JOB.rig:
      s = setFlag(s, 'bypassRigged');
      r.push(say('engineering', 'okaforRigged', { sensor: knows(s, 'fault_known') && v.fault === 'sensor' ? 1 : 0 }));
      if (s.flags.remotePending && pm(s).remote && podUsable(s) && pm(s).stage === STAGE.standoff) {
        s = setFlag(s, 'remotePending', false);
        s = launch(s, TASK.manifold, r);
        r.push(say('helm', 'remoteToManifold', { aboard: paleyInPod(s) ? 1 : 0, left: pm(s).left ?? 0 }));
      }
      return s;
  }
  return s;
}

/** A wrong fix is still information: two ruled out is one left. */
function eliminate(s: WorldState, r: Report[]): WorldState {
  const tried = (['manualTried', 'pumpTried', 'valveTried'] as const).filter((f) => s.flags[f]).length;
  const ruled = knows(s, 'fault_ruled_out') ? 1 : 0;
  if (tried + ruled >= 2 && !knows(s, 'fault_known')) return knowFault(s, r, 'elimination');
  return advanceDiag(s, 1, r);
}

/** Start one of Okafor's jobs (one at a time). */
export function startJob(s: WorldState, job: number, r: Report[]): WorldState {
  const cur = s.counters.job ?? 0;
  if (cur === job) {
    r.push(say('engineering', 'okaforAlreadyOnIt', { job: JOB_NAME[job], left: s.counters.jobLeft ?? 0 }));
    return s;
  }
  if (cur) r.push(say('engineering', 'okaforDropsJob', { job: JOB_NAME[cur] }));
  s = taskOkafor(s);
  s = setCounter(s, 'job', job);
  s = setCounter(s, 'jobLeft', JOB_TURNS[job]);
  if ((job === JOB.manual || job === JOB.pump) && !s.flags.firstFixTurn) s = setFlag(s, 'firstFixTurn');
  return s;
}

/** The cascade is stopped by a real fix. */
export function stop(s: WorldState, how: 'manual' | 'pump' | 'valve' | 'bypass', r: Report[]): WorldState {
  if (settled(s)) return s;
  s = setFlag(s, 'stopped');
  s = setFlag(s, `stopped_${how}`);
  if (how === 'bypass') {
    // The shield loop now cools the core: the shields are down for the night.
    s = patchShip(s, 'halcyon', (h) => ({ shields: { raised: false, strength: Math.min(h.shields.strength, 10) }, systems: { ...h.systems, shields: { health: Math.min(h.systems.shields.health, 15), power: h.systems.shields.power, status: deriveStatus({ health: Math.min(h.systems.shields.health, 15), power: h.systems.shields.power }) } } }));
  }
  if (s.orders.jumpCharging) s = { ...s, orders: { ...s.orders, jumpCharging: false } };
  r.push(say('engineering', `stopped_${how}`, { heat: heat(s), paley: paleyInPod(s) ? 1 : 0 }));
  return s;
}

// -------------------------------------------------------- the ejection ---

/** Eject the core now if nothing prevents it; otherwise say why (and queue it behind the clamps). */
export function tryEject(s: WorldState, r: Report[], ordered: boolean): WorldState {
  const v = reactor(s);
  if (s.flags.ejected) {
    r.push(say('engineering', 'ejectAlready'));
    return s;
  }
  if (s.flags.stopped) {
    r.push(say('engineering', 'ejectNotNeeded'));
    return s;
  }
  if (ordered) s = setFlag(s, 'ejectOrdered');
  if (v.clamps === 'jammed' && !s.flags.clampsCut) {
    s = revealFact(s, 'clamps_jammed');
    s = setFlag(s, 'ejectQueued');
    if ((s.counters.job ?? 0) !== JOB.clamps) {
      s = startJob(s, JOB.clamps, []);
      r.push(say('engineering', 'ejectClampsJammed'));
    } else r.push(say('engineering', 'okaforAlreadyOnIt', { job: JOB_NAME[JOB.clamps], left: s.counters.jobLeft ?? 0 }));
    return s;
  }
  if (podOnSpine(s)) {
    s = setFlag(s, 'ejectQueued');
    s = setFlag(s, 'ejectWaitedForPod');
    r.push(say('engineering', 'ejectInterlock', { aboard: paleyInPod(s) ? 1 : 0 }));
    return s;
  }
  return eject(s, r, 'captain');
}

export function eject(s: WorldState, r: Report[], by: 'captain' | 'okafor'): WorldState {
  const h = s.ships.halcyon;
  const stored = h.jump.charge >= 100;
  s = setFlag(s, 'ejected');
  s = setFlag(s, 'ejectQueued', false);
  s = setCounter(s, 'ejectTurn', s.turn);
  if (by === 'okafor') s = setFlag(s, 'lastDitch');
  if (stored) s = setFlag(s, 'storedJump');
  if (s.flags.salvagePressed) s = setFlag(s, 'ejectedDespitePressure');
  if (s.counters.job === JOB.clamps) s = setCounter(s, 'job', JOB.none);
  s = { ...s, orders: { ...s.orders, jumpCharging: false } };
  s = patchShip(s, 'halcyon', (x) => ({
    shields: { raised: false, strength: x.shields.strength },
    systems: { ...x.systems, reactor: { health: 0, power: 0, status: deriveStatus({ health: 0, power: 0 }) } },
  }));
  s = { ...s, fx: [...s.fx, { kind: 'explosion', from: 'halcyon', to: 'halcyon' }] };
  r.push(say('engineering', by === 'okafor' ? 'okaforLastDitch' : 'coreEjected', { stored: stored ? 1 : 0, charge: Math.round(h.jump.charge), heat: heat(s) }));
  return s;
}

/** An ejection that waited for the pod to come off the spine goes the moment it is clear. */
function queuedEjection(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (!s.flags.ejectQueued || settled(s) || podOnSpine(s)) return s;
  if (reactor(s).clamps === 'jammed' && !s.flags.clampsCut) return s;
  return eject(s, r, 'captain');
}

function afterEjection(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (!s.flags.ejected || s.flags.stranded) return s;
  if (s.flags.ejectQueued) s = setFlag(s, 'ejectQueued', false);
  if (s.orders.jumpCharging) {
    s = { ...s, orders: { ...s.orders, jumpCharging: false } };
    r.push(say('engineering', 'noPowerToCharge'));
  }
  if (s.flags.storedJump) {
    const since = s.turn - (s.counters.ejectTurn ?? s.turn);
    if (since === 2) r.push(say('helm', 'storedJumpReminder'));
    if (since >= 5) {
      s = setFlag(s, 'stranded');
      s = setFlag(s, 'storedJump', false);
      s = patchShip(s, 'halcyon', { jump: { charge: 0 } });
      r.push(say('helm', 'storedJumpBled'));
    }
  }
  return s;
}

// ------------------------------------------------------- Paley and the pod ---

/** Minutes for the pod to reach its work (deep valve: three; remote control: one more). */
export function travelFor(s: WorldState, task: number): number {
  return (task === TASK.valve && reactor(s).valveDeep ? 3 : 2) + (pm(s).remote ? 1 : 0);
}
export function workFor(s: WorldState, task: number): number {
  if (task === TASK.valve) return 1;
  return (knows(s, 'bypass_procedure') ? 2 : 3) + (pm(s).remote ? 1 : 0);
}

/** Send the pod out (by Paley's hands or Adeyemi's remote). */
export function launch(s: WorldState, task: number, r: Report[]): WorldState {
  s = setMemory(s, 'paley', 'task', task);
  s = setMemory(s, 'paley', 'stage', STAGE.outbound);
  s = setMemory(s, 'paley', 'left', travelFor(s, task));
  s = setMemory(s, 'paley', 'frozen', 0);
  s = setMemory(s, 'paley', 'docked', 0);
  if (s.counters.podSentTurn === undefined) s = setCounter(s, 'podSentTurn', s.turn);
  void r;
  return s;
}

/** Paley freezes on arrival unless she is steady, or steadied and only shaken. */
function freezesOnArrival(s: WorldState): boolean {
  if (!paleyInPod(s) || pm(s).remote) return false;
  const n = reactor(s).nerve;
  if (n === 'panicked') return true;
  if (n === 'shaken') return !pm(s).steadied;
  return false;
}

function podWork(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (s.ships.kestrel.destroyed) return s;
  const m = pm(s);
  const v = reactor(s);
  const stage = m.stage ?? 0;
  // The dose, while Paley is out on the spine.
  if (paleyInPod(s) && stage !== STAGE.standoff) {
    const onSpine = stage === STAGE.outbound || stage === STAGE.working || stage === STAGE.adrift;
    const add = onSpine ? 10 + (heat(s) >= 70 && !settled(s) ? 6 : 0) + (m.task === TASK.valve && v.valveDeep ? 5 : 0) : 4;
    const dose = (m.dose ?? 0) + add;
    s = setMemory(s, 'paley', 'dose', dose);
    if (dose >= DOSE_FATAL) {
      s = paleyDies(s, r);
      if (!pm(s).remote) return s;
    } else if (dose >= 80 && !m.warned80) {
      s = setMemory(s, 'paley', 'warned80', 1);
      r.push(say('medical', 'oseiDose80'));
    } else if (dose >= 50 && !m.warned50) {
      s = setMemory(s, 'paley', 'warned50', 1);
      r.push(say('medical', 'oseiDose50'));
    }
  }
  const mm = pm(s);
  if (mm.stage === STAGE.adrift && !mm.remote) return s;
  if (mm.frozen) {
    if (!mm.frozenNote || s.turn - (mm.frozenNote ?? 0) >= 2) {
      s = setMemory(s, 'paley', 'frozenNote', s.turn);
      r.push(comms('paley', 'paleyFrozenStill', { dose: Math.round(pm(s).dose ?? 0) }));
    }
    return s;
  }
  const left = (mm.left ?? 0) - 1;
  switch (mm.stage) {
    case STAGE.outbound:
      if (left > 0) return setMemory(s, 'paley', 'left', left);
      if (freezesOnArrival(s)) {
        s = setMemory(s, 'paley', 'frozen', 1);
        s = setMemory(s, 'paley', 'stage', STAGE.working);
        s = setMemory(s, 'paley', 'left', workFor(s, mm.task ?? 0));
        s = setMemory(s, 'paley', 'frozenNote', s.turn);
        s = setFlag(s, 'paleyFroze');
        r.push(comms('paley', 'paleyFreezes', { nerve: v.nerve }));
        r.push(say('medical', 'oseiSeesFreeze', { nerve: v.nerve }));
        return s;
      }
      s = setMemory(s, 'paley', 'stage', STAGE.working);
      s = setMemory(s, 'paley', 'left', workFor(s, mm.task ?? 0));
      r.push(paleyInPod(s) && !mm.remote ? comms('paley', 'paleyArrives', { task: mm.task ?? 0 }) : say('helm', 'remoteArrives', { task: mm.task ?? 0 }));
      return s;
    case STAGE.working:
      if (left > 0) return setMemory(s, 'paley', 'left', left);
      return finishTask(s, mm.task ?? 0, r);
    case STAGE.inbound:
      if (left > 0) return setMemory(s, 'paley', 'left', left);
      s = setMemory(s, 'paley', 'stage', STAGE.standoff);
      s = setMemory(s, 'paley', 'task', TASK.none);
      r.push(paleyInPod(s) ? comms('paley', 'paleyBackOff') : say('helm', 'podBackOff'));
      return s;
  }
  return s;
}

function finishTask(s: WorldState, task: number, r: Report[]): WorldState {
  const v = reactor(s);
  s = setMemory(s, 'paley', 'stage', STAGE.inbound);
  s = setMemory(s, 'paley', 'left', 2);
  s = setMemory(s, 'paley', 'done', (pm(s).done ?? 0) + 1);
  if (task === TASK.valve) {
    if (v.fault === 'valve') return stop(s, 'valve', r);
    s = setFlag(s, 'valveTried');
    if (!knows(s, 'fault_known')) s = setFlag(s, 'wrongFixBlind');
    r.push(comms('paley', 'paleyValveOpen'));
    return eliminate(s, r);
  }
  if (task === TASK.manifold) {
    if (v.fault !== 'sensor') return stop(s, 'bypass', r);
    s = setFlag(s, 'bypassSlows');
    r.push(say('engineering', 'bypassSlowsOnly'));
    return knowFault(s, r, 'elimination');
  }
  return s;
}

export function paleyDies(s: WorldState, r: Report[]): WorldState {
  s = patchCharacter(s, 'paley', (c) => ({ status: 'dead', memory: { ...c.memory, deathTurn: s.turn } }));
  s = patchShip(s, 'kestrel', { souls: 0, disposition: 'evacuated' });
  s = setCounter(s, 'kestrelDead', (s.counters.kestrelDead ?? 0) + 1);
  s = setFlag(s, 'paleyLost');
  if (!pm(s).remote) {
    s = setMemory(s, 'paley', 'frozen', 0);
    if (pm(s).stage !== STAGE.standoff) s = setMemory(s, 'paley', 'stage', STAGE.adrift);
  }
  r.push(say('medical', 'oseiPaleyLost'));
  return s;
}

// ------------------------------------------------------------- the cascade ---

function cascade(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (settled(s)) {
    if (s.flags.stopped && heat(s) > 30) s = setCounter(s, 'heat', Math.max(30, heat(s) - 6));
    return mirror(s);
  }
  const before = heat(s);
  const after = Math.min(BREACH_AT, before + heatRate(s));
  s = setCounter(s, 'heat', after);
  s = mirror(s);
  const crossed = (x: number) => before < x && after >= x;
  if (crossed(50)) r.push(say('engineering', 'heat50', { left: minutesLeft(s), known: knows(s, 'fault_known') ? 1 : 0 }));
  if (crossed(70)) {
    s = setFlag(s, 'deckCleared');
    r.push(say('xo', 'heat70', { n: reactor(s).deckSix }));
  }
  if (crossed(85)) r.push(say('engineering', 'heat85', { left: minutesLeft(s), clamps: s.flags.clampsCut || reactor(s).clamps === 'free' ? 0 : 1 }));
  if (after >= DECK_AT && !s.flags.deckHit) {
    s = setFlag(s, 'deckHit');
    s = setCounter(s, 'deckLost', reactor(s).deckSix);
    r.push(say('xo', 'deckSixLost', { n: reactor(s).deckSix }));
  }
  if (after >= BREACH_AT) {
    s = setFlag(s, 'breach');
    r.push(say('engineering', 'breach'));
    return destroyShip(s, 'halcyon', r, { quiet: true });
  }
  // Okafor's own authority, seconds from breach: she ejects if she can.
  if (after >= 94 && !s.flags.ejected) {
    const clampsOk = reactor(s).clamps === 'free' || !!s.flags.clampsCut;
    if (clampsOk && !podOnSpine(s)) return eject(s, r, 'okafor');
    if (!clampsOk && (s.counters.job ?? 0) !== JOB.clamps) {
      s = revealFact(s, 'clamps_jammed');
      s = setFlag(s, 'ejectQueued');
      s = setCounter(s, 'job', JOB.clamps);
      s = setCounter(s, 'jobLeft', JOB_TURNS[JOB.clamps]);
      r.push(say('engineering', 'okaforCutsTooLate'));
    } else if (clampsOk && !s.flags.lastDitchBlocked) {
      s = setFlag(s, 'lastDitchBlocked');
      r.push(say('engineering', 'okaforBlockedByPod'));
    }
  }
  return s;
}

/** The ship-status panel's reactor bar reads core stability (100 − heat). */
function mirror(s: WorldState): WorldState {
  if (s.flags.ejected) return s;
  const health = Math.max(1, Math.min(100, 100 - heat(s)));
  return patchShip(s, 'halcyon', (h) => ({ systems: { ...h.systems, reactor: { health, power: h.systems.reactor.power, status: deriveStatus({ health, power: h.systems.reactor.power }) } } }));
}

// -------------------------------------------------------------- Basant ---

function basantCalls(s: WorldState, _rng: Rng, r: Report[]): WorldState {
  if (settled(s) || bm(s).called || heat(s) < 60) return s;
  s = setMemory(s, 'basant', 'called', 1);
  s = revealFact(s, 'basant_stance');
  const st = reactor(s).stance;
  if (st === 'salvage') s = setFlag(s, 'salvagePressed');
  if (st === 'byTheBook') s = setFlag(s, 'ejectUrged');
  r.push(say('comms', 'basantCalling'));
  r.push(comms('basant', `basantCalls_${st}`, { known: knows(s, 'fault_known') ? 1 : 0 }));
  return s;
}
