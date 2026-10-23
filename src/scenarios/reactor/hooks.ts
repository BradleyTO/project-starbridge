/** Scenario-specific meaning of scans, one-shot comm actions, improvised tactics, queries and officers' bridge talk for Reactor Night. */
import { explainRefusal } from '../../engine/roe';
import type { ProposedAction } from '../../engine/schema';
import type { Applied, ScenarioHooks } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { say, sys } from '../../engine/report';
import type { Rng } from '../../engine/rng';
import type { WorldState } from '../../engine/types';
import { deriveStatus as deriveStatusOf, km, range } from '../../engine/rules';
import { knows, patchShip, revealFact, setFlag, setMemory } from '../../engine/state';
import { FAULT_NAME, reactor } from './setup';
import { JOB, JOB_NAME, STAGE, TASK, advanceDiag, bm, heat, heatRate, launch, minutesLeft, paleyAlive, paleyInPod, pm, podOnSpine, podUsable, powerCut, settled, startJob, taskOkafor, tryEject } from './agents';
import { basantRespond, paleyRespond } from './dialogue';

// ------------------------------------------------------------------ scan ---

/** Varga's internal scan of the coolant loop: two minutes' worth of Okafor's diagnosis, once. */
export function flowScan(s: WorldState, r: Report[]): WorldState {
  if (settled(s)) {
    r.push(say('sensors', 'flowScanSettled'));
    return s;
  }
  if (knows(s, 'flow_scan')) {
    r.push(say('sensors', 'flowScanAgain', { known: knows(s, 'fault_known') ? 1 : 0 }));
    return s;
  }
  s = revealFact(s, 'flow_scan');
  r.push(say('sensors', 'flowScan', { tasked: s.flags.okaforOnIt ? 1 : 0 }));
  s = taskOkafor(s);
  return advanceDiag(s, 2, r);
}

function scan(s: WorldState, target: 'kestrel' | 'cruiser' | 'compartment' | 'area' | 'halcyon'): Applied {
  const r: Report[] = [];
  switch (target) {
    case 'halcyon':
      s = flowScan(s, r);
      return { state: s, reports: r };
    case 'compartment':
    case 'kestrel': {
      if (s.ships.kestrel.destroyed) return { state: s, reports: [say('sensors', 'podGoneScan')] };
      s = patchShip(s, 'kestrel', { scanLevel: 2 });
      const m = pm(s);
      r.push(say('sensors', 'scanPod', { aboard: paleyInPod(s) ? 1 : 0, alive: paleyAlive(s) ? 1 : 0, dose: Math.round(m.dose ?? 0), stage: m.stage ?? 0, frozen: m.frozen ?? 0 }));
      return { state: s, reports: r };
    }
    case 'cruiser':
      s = patchShip(s, 'cruiser', { scanLevel: 2 });
      return { state: s, reports: [say('sensors', 'scanTender', { km: km(range(s, 'halcyon', 'cruiser')) })] };
    case 'area':
      return { state: s, reports: [say('sensors', 'areaSweepReactor', { tender: km(range(s, 'halcyon', 'cruiser')) })] };
  }
}

// ---------------------------------------------------------- communicate ---

type Comm = Extract<ProposedAction, { type: 'communicate' }>;
const SPEAK_FROM: Record<Comm['intent'], string> = {
  open: 'greet',
  ask: 'ask',
  humanitarian: 'humanitarian',
  legal: 'legal',
  reassure: 'declarePeaceful',
  warn: 'warn',
  bluff: 'bluff',
  trade: 'trade',
  appeal: 'appeal',
  offerAsylum: 'offerAsylum',
};

function communicate(s: WorldState, a: Comm, rng: Rng): Applied {
  const line = { type: 'speak' as const, to: a.target === 'cruiser' ? ('cruiser' as const) : ('kestrel' as const), text: '', intents: [SPEAK_FROM[a.intent]] as never, topic: undefined, relayed: false };
  return a.target === 'cruiser' ? basantRespond(s, line, rng) : paleyRespond(s, line, rng);
}

// ------------------------------------------------------------ improvise ---

const RADIATOR = /\b(radiators?|heat ?sinks?|dump (the )?heat|shed heat|emitters?|shield grid)\b/;
const REMOTE = /\b(remote\w*|helm|pilot|fly|flies|slave\w*|waldo\w*)\b/;
const POD = /\b(pod|tern)\b/;
const BYPASS = /\b(bypass|shield (coolant )?loop|cold loop|manifold|second loop|re-?route|route (the )?coolant)\b/;
const VALVE = /\bvalve\b/;
const STARVE = /\b(starve|shed (the )?load|cut (the )?load|power down|throttle|reduce (the )?(load|demand|output)|turn (it|her|the reactor) down)\b/;

/** The shield emitters, run hot and unshielded, as radiators: slows the cascade, costs the shields. */
export function radiators(s: WorldState, r: Report[]): WorldState {
  if (s.flags.radiators) {
    r.push(say('engineering', 'radiatorsAlready'));
    return s;
  }
  if (settled(s)) {
    r.push(say('engineering', 'radiatorsNotNeeded'));
    return s;
  }
  const h = s.ships.halcyon;
  if (h.systems.shields.health < 30) {
    r.push(say('engineering', 'radiatorsNoEmitters'));
    return s;
  }
  s = setFlag(s, 'radiators');
  s = setFlag(s, 'improvised');
  s = patchShip(s, 'halcyon', (x) => {
    const health = Math.max(0, x.systems.shields.health - 45);
    return { shields: { raised: false, strength: Math.min(x.shields.strength, 40) }, systems: { ...x.systems, shields: { ...x.systems.shields, health, status: x.systems.shields.status } } };
  });
  s = fixStatus(s);
  r.push(say('engineering', 'radiatorsRigged', { left: minutesLeft(s) }));
  return s;
}

/** Okafor takes load off the core: weapons and the survey sensors go dark. */
export function starve(s: WorldState, r: Report[]): WorldState {
  if (s.flags.starved) {
    r.push(say('engineering', 'starvedAlready'));
    return s;
  }
  if (settled(s)) {
    r.push(say('engineering', 'radiatorsNotNeeded'));
    return s;
  }
  s = setFlag(s, 'starved');
  s = patchShip(s, 'halcyon', (x) => ({ weapons: { state: 'safe', target: null }, systems: { ...x.systems, weapons: { ...x.systems.weapons, power: 0 } } }));
  s = fixStatus(s);
  r.push(say('engineering', 'starved', { left: minutesLeft(s) }));
  return s;
}

function fixStatus(s: WorldState): WorldState {
  return patchShip(s, 'halcyon', (x) => {
    const systems = { ...x.systems };
    for (const [k, v] of Object.entries(systems)) systems[k as keyof typeof systems] = { ...v, status: deriveStatusOf(v) };
    return { systems };
  });
}

/** Adeyemi takes the pod's controls from the helm (it works for the manifold, not the valve). */
export function remote(s: WorldState, r: Report[], task?: number): WorldState {
  if (s.ships.kestrel.destroyed) {
    r.push(say('helm', 'podGoneHelm'));
    return s;
  }
  const fresh = !pm(s).remote;
  s = setMemory(s, 'paley', 'remote', 1);
  s = setFlag(s, 'remotePod');
  s = setFlag(s, 'improvised');
  const m = pm(s);
  if (m.frozen) {
    s = setMemory(s, 'paley', 'frozen', 0);
    s = setFlag(s, 'paleyRelieved');
  }
  if (m.stage === STAGE.adrift) s = setMemory(s, 'paley', 'stage', m.task ? STAGE.working : STAGE.inbound);
  if (task === TASK.valve || (m.task === TASK.valve && (m.stage === STAGE.outbound || m.stage === STAGE.working))) {
    r.push(say('helm', 'remoteNoValve', { fresh: fresh ? 1 : 0 }));
    return s;
  }
  if (task === TASK.manifold && m.stage === STAGE.standoff) {
    if (!s.flags.bypassRigged) {
      // With the Chief already rigging, the helm waits on the spine-side and goes the minute she is done.
      if (s.flags.bypassPlanned) s = setFlag(s, 'remotePending');
      r.push(say('helm', 'remoteNeedsRig', { fresh: fresh ? 1 : 0, planned: s.flags.bypassPlanned ? 1 : 0 }));
      return s;
    }
    s = launch(s, TASK.manifold, r);
    r.push(say('helm', 'remoteToManifold', { aboard: paleyInPod(s) ? 1 : 0, left: pm(s).left ?? 0 }));
    return s;
  }
  r.push(say('helm', fresh ? 'remoteTaken' : 'remoteAlready', { aboard: paleyInPod(s) ? 1 : 0, stage: m.stage ?? 0, task: m.task ?? 0 }));
  return s;
}

function improvise(s: WorldState, a: Extract<ProposedAction, { type: 'improvise' }>, _rng: Rng): Applied {
  const r: Report[] = [];
  switch (a.method) {
    case 'sensorGhost':
      r.push(say('sensors', 'impSensorGhostReactor'));
      break;
    case 'plasmaVent':
      r.push(say('engineering', 'impPlasmaVentReactor'));
      break;
    case 'tractorShield':
    case 'shieldExtend':
      r.push(say('tactical', 'impShieldReactor'));
      break;
    case 'ejectCore':
      s = tryEject(s, r, true);
      break;
    case 'other': {
      const d = a.description.toLowerCase();
      if (RADIATOR.test(d)) s = radiators(s, r);
      else if (REMOTE.test(d) && POD.test(d)) s = remote(s, r, BYPASS.test(d) ? TASK.manifold : VALVE.test(d) ? TASK.valve : undefined);
      else if (STARVE.test(d)) s = starve(s, r);
      else if (BYPASS.test(d)) s = engineer(s, 'set up the bypass', r);
      else if (VALVE.test(d)) r.push(say('engineering', 'valveNeedsHands'));
      else r.push(say('engineering', 'impOtherReactor', { description: a.description.slice(0, 80) }));
      break;
    }
  }
  return { state: s, reports: r };
}

// ------------------------------------------------------- officers on the bridge ---

const ENGINEER = /\b(okafor|dana|chief|engineering|engineer|cho)\b/;
const SCIENCE = /\b(varga|oona|sensors?|science|hale)\b/;
const HELM = /\b(adeyemi|kofi|helm|ensign|duarte)\b/;
const DOCTOR = /\b(osei|ama|doctor|doc|medical|ruiz|nurse)\b/;
const XO = /\b(marrow|xo|number one|first officer|commander|holt)\b/;

const CLAMPS = /\bclamps?\b/;
const MANUAL = /\b(manual\w*|by hand|regulator|off automatic|off auto|override|ignore the sensor|sensor)\b/;
const PUMP = /\b(pumps?|cross-?connect\w*)\b/;
const EJECT = /\b(eject\w*|jettison\w*|dump the core|blow the core)\b/;

/** Chief Okafor's answer to an engineering order or question (the captain's words, lower-cased). */
export function engineer(s: WorldState, t: string, r: Report[]): WorldState {
  const v = reactor(s);
  const was = !!s.flags.okaforOnIt;
  s = taskOkafor(s);
  if (s.flags.ejected) {
    r.push(say('engineering', s.flags.storedJump ? 'okaforAfterEjectStored' : 'okaforAfterEject'));
    return s;
  }
  if (s.flags.stopped) {
    r.push(say('engineering', 'okaforAfterStop', { heat: heat(s) }));
    return s;
  }
  if (CLAMPS.test(t)) {
    if (v.clamps === 'free' || s.flags.clampsCut) {
      r.push(say('engineering', 'okaforClampsFine', { cut: s.flags.clampsCut ? 1 : 0 }));
      return s;
    }
    s = revealFact(s, 'clamps_jammed');
    s = startJob(s, JOB.clamps, r);
    r.push(say('engineering', 'okaforCutsClamps'));
    return s;
  }
  if (EJECT.test(t) && !/\b(should|would|can|could|what about|if)\b/.test(t)) return tryEject(s, r, true);
  if (MANUAL.test(t) && !VALVE.test(t) && !PUMP.test(t)) {
    s = startJob(s, JOB.manual, r);
    r.push(say('engineering', 'okaforManual', { known: knows(s, 'fault_known') ? 1 : 0, right: v.fault === 'sensor' ? 1 : 0 }));
    return s;
  }
  if (PUMP.test(t) && !BYPASS.test(t)) {
    s = startJob(s, JOB.pump, r);
    r.push(say('engineering', 'okaforPump', { known: knows(s, 'fault_known') ? 1 : 0, right: v.fault === 'pump' ? 1 : 0 }));
    return s;
  }
  if (BYPASS.test(t)) {
    if (s.flags.bypassRigged) {
      r.push(say('engineering', 'okaforRiggedAlready', { out: podOnSpine(s) ? 1 : 0 }));
      return s;
    }
    s = setFlag(s, 'bypassPlanned');
    s = setFlag(s, 'improvised');
    s = startJob(s, JOB.rig, r);
    r.push(say('engineering', 'okaforBypassPlan', { sensor: knows(s, 'fault_known') && v.fault === 'sensor' ? 1 : 0 }));
    return s;
  }
  if (VALVE.test(t)) {
    r.push(say('engineering', 'valveNeedsHands'));
    return s;
  }
  if (RADIATOR.test(t)) return radiators(s, r);
  if (STARVE.test(t) || /\bcut (the )?power\b/.test(t)) return starve(s, r);
  if (EJECT.test(t)) {
    r.push(say('engineering', 'okaforOnEjecting', { charge: Math.round(s.ships.halcyon.jump.charge), clamps: v.clamps === 'jammed' && !s.flags.clampsCut ? 1 : 0, out: podOnSpine(s) ? 1 : 0 }));
    return s;
  }
  if (/\b(options?|ideas?|what (can|do|should|would) (we|you)|suggest\w*|recommend\w*|think|advice|advise|plan)\b/.test(t)) {
    r.push(okaforOptions(s));
    return s;
  }
  r.push(assessment(s, was));
  return s;
}

/** Okafor's honest read of the core. */
export function assessment(s: WorldState, wasTasked = true): Report {
  const v = reactor(s);
  const vars = { heat: heat(s), left: minutesLeft(s), rate: heatRate(s), job: JOB_NAME[s.counters.job ?? 0], jobLeft: s.counters.jobLeft ?? 0, not: FAULT_NAME[v.ruledOut] };
  if (knows(s, 'fault_known')) return say('engineering', `okaforAssess_${v.fault}`, vars);
  if (knows(s, 'fault_ruled_out')) return say('engineering', 'okaforAssessPartial', vars);
  return say('engineering', wasTasked ? 'okaforAssessNone' : 'okaforStarts', vars);
}

export function okaforOptions(s: WorldState): Report {
  const v = reactor(s);
  return say('engineering', 'okaforOptions', {
    known: knows(s, 'fault_known') ? 1 : 0,
    fault: v.fault,
    left: minutesLeft(s),
    charge: Math.round(s.ships.halcyon.jump.charge),
    rigged: s.flags.bypassRigged ? 1 : 0,
    radiators: s.flags.radiators ? 1 : 0,
    starved: powerCut(s) ? 1 : 0,
  });
}

function bridge(s: WorldState, action: Extract<ProposedAction, { type: 'bridge' }>, _rng: Rng): Applied {
  if (action.op !== 'chat') return { state: s, reports: [say('xo', 'bridgeNotNow')] };
  const who = (action.officer ?? '').toLowerCase();
  const t = (action.text ?? '').toLowerCase();
  const r: Report[] = [];
  if (ENGINEER.test(who)) {
    s = engineer(s, t, r);
    return { state: s, reports: r };
  }
  if (SCIENCE.test(who)) {
    if (/\b(scan|flow|coolant|reactor|core|loop|diagnos\w*|read\w*|look|check|sensor|wrong|fail\w*)\b/.test(t)) s = flowScan(s, r);
    else if (/\b(pod|paley|tern|dose|radiation)\b/.test(t)) return scan(s, 'kestrel');
    else return { state: s, reports: [] };
    return { state: s, reports: r };
  }
  if (HELM.test(who)) {
    if (/\b(pod|tern|remote\w*|fly|pilot|controls?|take over|manifold|valve)\b/.test(t)) {
      s = remote(s, r, /\b(manifold|bypass)\b/.test(t) ? TASK.manifold : VALVE.test(t) ? TASK.valve : undefined);
      return { state: s, reports: r };
    }
    return { state: s, reports: [] };
  }
  if (DOCTOR.test(who)) {
    if (/\b(paley|pod|crewman|her|she|fit\w*|dose|radiation|ines|able|ready|okay|ok|alright|how is)\b/.test(t)) {
      s = oseiOnPaley(s, r);
      return { state: s, reports: r };
    }
    if (/\b(deck|casualt\w*|crew|injur\w*)\b/.test(t)) return { state: s, reports: [say('medical', 'oseiDeckSix', { lost: s.counters.deckLost ?? 0, cleared: s.flags.deckCleared ? 1 : 0 })] };
    return { state: s, reports: [] };
  }
  if (XO.test(who)) return { state: s, reports: [say('xo', 'marrowRead', { heat: heat(s), left: minutesLeft(s), known: knows(s, 'fault_known') ? 1 : 0, options: suggestOptions(s).join('; ') })] };
  return { state: s, reports: [] };
}

/** Dr. Osei reads Paley's fitness from the pod's telemetry and her voice. */
export function oseiOnPaley(s: WorldState, r: Report[]): WorldState {
  if (!paleyAlive(s)) {
    r.push(say('medical', 'oseiPaleyGone'));
    return s;
  }
  const n = reactor(s).nerve;
  s = revealFact(s, 'paley_state');
  s = setFlag(s, 'oseiAssessed');
  if (n === 'panicked') s = setFlag(s, 'oseiUnfit');
  r.push(say('medical', `oseiOnPaley_${n}`, { dose: Math.round(pm(s).dose ?? 0), out: paleyInPod(s) && pm(s).stage !== STAGE.standoff ? 1 : 0, aboard: paleyInPod(s) ? 0 : 1 }));
  return s;
}

// ---------------------------------------------------------------- query ---

export function suggestOptions(s: WorldState): string[] {
  const out: string[] = [];
  if (s.outcome) return out;
  if (s.flags.ejected) {
    if (s.flags.storedJump) out.push('engage the jump drive');
    return out;
  }
  if (s.flags.stopped) return out;
  const v = reactor(s);
  if (!s.flags.okaforOnIt) out.push("Okafor, what's failing?");
  if (!knows(s, 'flow_scan')) out.push('scan our ship');
  if (knows(s, 'fault_known')) {
    if (v.fault === 'sensor' && (s.counters.job ?? 0) !== JOB.manual) out.push('Okafor, take the regulator off automatic');
    if (v.fault === 'pump' && (s.counters.job ?? 0) !== JOB.pump) out.push('Okafor, switch to the backup pump');
    if (v.fault === 'valve' && pm(s).stage === STAGE.standoff && paleyInPod(s)) out.push('hail the pod');
  } else if (s.flags.okaforOnIt) out.push('Okafor, what are our options?');
  if (!paleyAlive(s) || !podUsable(s)) {
    /* nothing for the pod */
  } else if (pm(s).frozen) out.push('hail the pod');
  if (!bm(s).hailed) out.push('hail the Larkspur');
  if (heat(s) >= 75 && s.ships.halcyon.jump.charge < 100 && !s.orders.jumpCharging) out.push('charge the jump drive');
  if (heat(s) >= 80) out.push('eject the core');
  if (paleyInPod(s) && pm(s).stage !== STAGE.standoff && !s.flags.oseiAssessed) out.push('Doctor, how is Paley?');
  return [...new Set(out)].slice(0, 4);
}

function query(s: WorldState, topic: Extract<ProposedAction, { type: 'query' }>['topic']): Applied {
  const h = s.ships.halcyon;
  const m = pm(s);
  switch (topic) {
    case 'why':
      return { state: s, reports: explainRefusal(s, undefined) };
    case 'status':
      return {
        state: s,
        reports: [
          say('xo', 'statusReportReactor', {
            heat: heat(s),
            left: s.flags.stopped ? 'stopped' : s.flags.ejected ? 'core ejected' : `about ${minutesLeft(s)} min to breach`,
            fault: knows(s, 'fault_known') ? FAULT_NAME[reactor(s).fault] : knows(s, 'fault_ruled_out') ? `not ${FAULT_NAME[reactor(s).ruledOut]}; still looking` : s.flags.okaforOnIt ? 'Okafor is looking' : 'unknown; nobody has asked the Chief',
            job: s.counters.job ? JOB_NAME[s.counters.job] : 'standing by',
            pod: !paleyAlive(s) ? 'Paley lost' : !paleyInPod(s) ? 'Paley aboard' : m.frozen ? 'Paley frozen on the spine' : ['standing off', 'outbound to the spine', 'working on the spine', 'coming back', 'adrift'][m.stage ?? 0],
            dose: Math.round(m.dose ?? 0),
            shields: h.shields.raised ? `up (${h.shields.strength}%)` : `down (${h.shields.strength}%)`,
            jump: Math.round(h.jump.charge),
          }),
        ],
      };
    case 'systems': {
      if (settled(s)) return { state: s, reports: [say('engineering', s.flags.ejected ? (s.flags.storedJump && !s.flags.stranded ? 'okaforAfterEjectStored' : 'okaforAfterEject') : 'okaforAfterStop', { heat: heat(s) })] };
      const was = !!s.flags.okaforOnIt;
      const t = taskOkafor(s);
      return { state: t, reports: [assessment(t, was)] };
    }
    case 'contacts':
      return { state: s, reports: [say('sensors', 'contactsReport')] };
    case 'objectives':
      return { state: s, reports: [say('xo', 'objectivesReport')] };
    case 'options':
      return { state: s, reports: settled(s) ? [say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') })] : s.flags.okaforOnIt ? [okaforOptions(s)] : [okaforOptions(s), say('xo', 'optionsReport', { options: suggestOptions(s).join('; ') })] };
    case 'help':
      return { state: s, reports: [sys('help')] };
  }
}

export const hooks: ScenarioHooks = { scan: (s, t) => scan(s, t), communicate, improvise, query, bridge };
export { launch, paleyRespond };
