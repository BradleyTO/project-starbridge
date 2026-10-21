/**
 * The command pipeline:
 *   interpretation (ProposedActions) → schema check → validate → apply →
 *   [if time passes] standing orders + NPC agents + events → objectives →
 *   outcome → narration (reports + state diff) → new WorldState.
 */
import type { Interpretation, ProposedAction } from './schema';
import { addRestriction, addStanding, checkStanding, describeTrigger, liftFor, planConflict, planOrder, SUBJECT_LABEL } from './standing';
import { ProposedActionSchema } from './schema';
import type { Report } from './report';
import { say, sys } from './report';
import { createRng } from './rng';
import type { Rng } from './rng';
import type { ScenarioModule } from './scenario';
import type { Narrator } from './narrator';
import { TemplateNarrator } from './narrator';
import { validate } from './validate';
import { applyAction } from './reduce';
import { diffReports } from './diff';
import type { Department, ShipId, WorldState } from './types';
import { TURN_SECONDS, clamp, efficiency } from './rules';
import { addLog, patchShip, patchSystem, setCounter } from './state';
import { runPhysics } from './motion';
import { addOrder, goalLabel, updateOrder } from './orders';
import { checkPromises } from './comms';
import { recordRefusal } from './roe';

export interface TurnResult {
  state: WorldState;
  results: { action: ProposedAction; status: 'accepted' | 'partial' | 'rejected' }[];
}

function commitLogs(s: WorldState, reports: Report[], narrator: Narrator): WorldState {
  for (const d of narrator.render(reports, s)) s = addLog(s, d.channel, d.speaker, d.text, d.voice);
  return s;
}

/** v0.5: append reports to the log outside a turn (idle-bridge ambience); the clock does not move. */
export function appendReports(s: WorldState, scenario: ScenarioModule, reports: Report[], narrator: Narrator = new TemplateNarrator(scenario)): WorldState {
  return reports.length ? commitLogs(s, reports, narrator) : s;
}

export function playIntroBeat(s: WorldState, scenario: ScenarioModule, narrator: Narrator = new TemplateNarrator(scenario)): WorldState {
  if (s.intro >= scenario.intro.length) return s;
  const before = s;
  const r = scenario.intro[s.intro](s);
  let next: WorldState = { ...r.state, intro: s.intro + 1, time: r.state.time + 5 };
  next = { ...next, objectives: scenario.objectives(next, false) };
  // Intro beats narrate their own detections; skip the generic contact lines.
  return commitLogs(next, [...r.reports, ...diffReports(before, next).filter((x) => x.key !== 'contactDetected')], narrator);
}

export function completeIntro(s: WorldState, scenario: ScenarioModule, narrator?: Narrator): WorldState {
  while (s.intro < scenario.intro.length) s = playIntroBeat(s, scenario, narrator);
  return s;
}

function lastTargetOf(actions: ProposedAction[], prev: ShipId | null): ShipId | null {
  let t = prev;
  for (const a of actions) {
    const cand = 'target' in a ? a.target : undefined;
    if (cand === 'kestrel' || cand === 'cruiser') t = cand;
  }
  return t;
}

export function processOrders(
  state: WorldState,
  text: string,
  interp: Interpretation,
  scenario: ScenarioModule,
  narrator: Narrator = new TemplateNarrator(scenario),
): TurnResult {
  let s = completeIntro(state, scenario, narrator);
  s = { ...s, fx: [] };
  s = addLog(s, 'captain', 'Captain', text.trim());
  const results: TurnResult['results'] = [];

  if (s.outcome) return { state: commitLogs(s, [sys('simEnded')], narrator), results };

  const before = s;
  const reports: Report[] = [];
  const rng = createRng(s.rng);
  let timePasses = false;
  let seconds = 0;

  // The WHOLE command becomes a validated plan before anything changes: every action must pass
  // the schema, and contradictory parts mean nothing runs (the crew asks instead).
  const raw0 = interp.kind === 'unrecognised' ? [] : interp.actions;
  const plan: ProposedAction[] = [];
  for (const raw of raw0) {
    const parsed = ProposedActionSchema.safeParse(raw);
    if (parsed.success) plan.push(parsed.data);
    else reports.push(sys('invalidAction'));
  }
  const conflict = planConflict(plan);
  if (conflict) {
    reports.push(say('xo', 'clarify', { question: conflict }));
    s = { ...s, clarification: { question: conflict, options: [], clause: text.trim() } };
    return { state: commitLogs(s, reports, narrator), results };
  }
  // Posture first (it colours the other orders), then prohibitions, then the rest in order.
  const actions = planOrder(plan);
  if (interp.kind === 'unrecognised') reports.push(say('xo', 'notUnderstood', { text: interp.unparsed.join(' / ') || text }));
  else if (interp.unparsed.length) reports.push(say('xo', 'partlyUnderstood', { text: interp.unparsed.join(' / ') }));

  for (const action of actions) {
    const parsed = { data: action };
    // An explicit order from the captain lifts an earlier prohibition it overrides.
    if (action.type !== 'restrict' && action.type !== 'standing') {
      const lift = liftFor(s, action);
      s = lift.state;
      reports.push(...lift.reports);
    }
    const v = validate(s, parsed.data);
    reports.push(...v.reasons);
    results.push({ action: v.action, status: v.status });
    const label = orderLabel(s, parsed.data);
    if (v.status === 'rejected') {
      if (v.refusal) s = recordRefusal(s, v.refusal.officer, v.refusal.order, v.refusal.reasons);
      if (label) s = addOrder(s, deptOf(parsed.data), label, 'impossible', v.reasons[0]?.key ?? '').state;
      continue;
    }
    if (v.noop) {
      if (label) s = addOrder(s, deptOf(parsed.data), label, 'completed', 'already in effect').state;
      continue;
    }
    if (v.action.type === 'standing' || v.action.type === 'restrict') {
      const added = v.action.type === 'standing' ? addStanding(s, v.action, label ?? 'Standing order') : addRestriction(s, v.action, label ?? 'Hold');
      s = added.state;
      reports.push(...added.reports);
      continue;
    }
    const applied = applyAction(s, v.action, rng, scenario.hooks);
    s = applied.state;
    reports.push(...applied.reports);
    // Manoeuvres and jump charging track their own lifecycle; everything else completes now.
    if (label && v.action.type !== 'maneuver' && !(v.action.type === 'jump' && v.action.mode !== 'engage')) s = addOrder(s, deptOf(v.action), orderLabel(s, v.action) ?? label, 'completed').state;
    if (v.timeCost) timePasses = true;
    seconds += v.seconds ?? 0;
    if (s.flags.jumped || s.ships.halcyon.destroyed) break;
  }

  // Conditions already true fire now (e.g. "if the Kestrel arms" when she already has).
  const now = checkStanding(s, rng, scenario.hooks);
  s = now.state;
  reports.push(...now.reports);
  // Promises made on the record are checked immediately (arming right after promising not to is noticed).
  const kept = checkPromises(s, scenario.hooks.dialogue);
  s = kept.state;
  reports.push(...kept.reports);

  s = { ...s, lastTarget: lastTargetOf(actions, s.lastTarget) };
  const lastComm = [...results].reverse().find((r) => r.action.type === 'communicate' && r.status !== 'rejected');
  if (lastComm && lastComm.action.type === 'communicate' && lastComm.action.target !== 'all') s = setCounter(s, 'lastCommTarget', ['kestrel', 'cruiser', 'passenger'].indexOf(lastComm.action.target) + 1);
  s = { ...s, clarification: interp.kind === 'clarify' ? interp.clarification : null };
  if (interp.kind === 'clarify') reports.push(say('xo', 'clarify', { question: interp.clarification.question }));

  if (timePasses && !s.flags.jumped) {
    const t = advanceTurn({ ...s, rng: rng.state }, rng, scenario);
    s = t.state;
    reports.push(...t.reports);
  } else if (seconds > 0 && !s.flags.jumped && !s.outcome) {
    // Talking costs seconds, not minutes. The clock still runs: every full minute the world acts.
    const t = advanceSeconds({ ...s, rng: rng.state }, seconds, rng, scenario);
    s = t.state;
    reports.push(...t.reports);
  }
  s = { ...s, rng: rng.state };
  s = finalise(s, scenario);
  const diffs = diffReports(before, s);
  const isObjective = (r: Report) => r.key === 'objectiveNew' || r.key === 'objectiveUpdate';
  const ending = s.outcome && !before.outcome ? [sys('outcome', { title: s.outcome.title, summary: s.outcome.summary })] : [];
  s = commitLogs(s, [...reports, ...diffs.filter((r) => !isObjective(r)), ...ending, ...diffs.filter(isObjective)], narrator);
  return { state: s, results };
}

function deptOf(a: ProposedAction): Department {
  switch (a.type) {
    case 'maneuver':
    case 'jump':
    case 'tractor':
      return 'helm';
    case 'weapons':
    case 'shields':
    case 'setAlert':
      return 'tactical';
    case 'power':
    case 'repair':
    case 'transport':
    case 'improvise':
      return 'ops';
    case 'scan':
      return 'science';
    case 'communicate':
    case 'speak':
    case 'channel':
      return 'comms';
    default:
      return 'xo';
  }
}

/** Short label for the orders strip; null for things that are not orders (queries, waiting). */
function orderLabel(s: WorldState, a: ProposedAction): string | null {
  const name = (t: string | undefined) => (t === 'kestrel' || t === 'cruiser' ? s.ships[t].name : t === 'all' ? 'all contacts' : (t ?? ''));
  switch (a.type) {
    case 'query':
    case 'wait':
    case 'bridge':
      return null;
    case 'setAlert':
      return `${a.level[0].toUpperCase()}${a.level.slice(1)} alert`;
    case 'shields':
      return a.raise ? 'Shields up' : 'Shields down';
    case 'weapons':
      return a.mode === 'safe' ? 'Weapons safe' : a.mode === 'arm' ? 'Arm weapons' : a.mode === 'lock' ? `Lock on ${name(a.target)}` : `Fire ${a.weapon} at ${name(a.target)}`;
    case 'scan':
      return `Scan ${a.target === 'area' ? 'area' : a.target === 'compartment' ? 'compartment' : name(a.target)}`;
    case 'communicate':
      return `${a.intent === 'open' ? 'Hail' : 'Message'} ${a.target === 'passenger' ? 'passenger' : name(a.target)}${a.onScreen ? ' (on screen)' : ''}`;
    case 'maneuver':
      return goalLabel(s, { intent: a.intent, target: a.target ?? null, second: a.second ?? null, rangeKm: a.rangeKm ?? null });
    case 'posture':
      return a.stance === 'nonHostile' ? 'Posture: non-hostile' : a.stance === 'assertive' ? 'Posture: assertive' : 'Posture: neutral';
    case 'power':
      return `Power${a.from ? ` from ${a.from}` : ''}${a.to ? ` to ${a.to}` : ''}`;
    case 'tractor':
      return a.engage ? `Tractor ${name(a.target)}` : 'Release tractor';
    case 'transport':
      return `Transport ${a.payload}`;
    case 'repair':
      return `Repair ${a.system}${a.ship === 'kestrel' ? ` (${s.ships.kestrel.name})` : ''}`;
    case 'jump':
      return a.mode === 'engage' ? 'Engage jump drive' : a.mode === 'charge' ? 'Charge jump drive' : 'Withdraw';
    case 'improvise':
      return `Improvise: ${a.method}`;
    case 'standing':
      return `When ${describeTrigger(s, a.trigger)}: ${a.actions.map((x) => orderLabel(s, x) ?? x.type).join(', ')}`;
    case 'restrict':
      return `Hold: ${SUBJECT_LABEL[a.subject]}${a.until ? ` until ${describeTrigger(s, a.until)}` : ''}`;
    case 'learn':
    case 'speak':
      return null;
    case 'channel':
      return a.op === 'open' ? `${a.private ? 'Private channel' : 'Channel'} to ${name(a.party === 'passenger' ? 'passenger' : a.party)}` : `Channel: ${a.op}`;
  }
}

function finalise(s: WorldState, scenario: ScenarioModule): WorldState {
  const outcome = s.outcome ?? scenario.detectOutcome(s);
  if (outcome && !s.outcome) s = { ...s, outcome, orders: { ...s.orders, jumpCharging: false, list: s.orders.list.map((o) => (o.status === 'acknowledged' || o.status === 'underway' || o.maintaining ? { ...o, status: o.status === 'acknowledged' || o.status === 'underway' ? ('failed' as const) : o.status, maintaining: false, detail: 'simulation ended' } : o)) }, clarification: null };
  return { ...s, objectives: scenario.objectives(s, !!s.outcome) };
}

/** One minute of simulated time: standing orders, physics, then the scenario's agents and events. */
export function advanceTurn(s: WorldState, rng: Rng, scenario: ScenarioModule): { state: WorldState; reports: Report[] } {
  const reports: Report[] = [];
  // Seconds already spent talking since the last minute boundary count toward this minute.
  const carry = s.counters.clockCarry ?? 0;
  s = { ...s, turn: s.turn + 1, time: s.time + TURN_SECONDS - carry, counters: { ...s.counters, clockCarry: 0 } };

  // Physics: every ship follows its nav goal for the rest of the minute (talk time already moved them).
  const phys = runPhysics(s, TURN_SECONDS - carry);
  s = phys.state;
  reports.push(...phys.reports);

  // Jump drive charging.
  if (s.orders.jumpCharging) {
    const h = s.ships.halcyon;
    const charge = clamp(h.jump.charge + Math.round(55 * efficiency(h, 'jumpDrive')), 0, 100);
    s = patchShip(s, 'halcyon', { jump: { charge } });
    if (charge >= 100) {
      s = { ...s, orders: { ...s.orders, jumpCharging: false } };
      const o = [...s.orders.list].reverse().find((x) => x.label.startsWith('Charge jump drive') && (x.status === 'underway' || x.status === 'acknowledged'));
      if (o) s = updateOrder(s, o.id, { status: 'completed', etaSeconds: 0 });
      reports.push(say('helm', 'jumpReady'));
    }
  }

  // Shield regeneration.
  for (const id of ['halcyon', 'cruiser'] as ShipId[]) {
    const sh = s.ships[id];
    if (sh.destroyed || sh.systems.shields.health <= 0) continue;
    const regen = Math.round((sh.shields.raised ? 4 : 10) * Math.max(0.2, efficiency(sh, 'shields')));
    s = patchShip(s, id, { shields: { ...sh.shields, strength: clamp(sh.shields.strength + regen, 0, 100) } });
  }

  // Tractor strain when holding something as massive as a cruiser.
  if (s.ships.halcyon.tractor.target === 'cruiser') s = patchSystem(s, 'halcyon', 'tractor', { health: s.ships.halcyon.systems.tractor.health - 12 });
  if (s.ships.halcyon.tractor.target && efficiency(s.ships.halcyon, 'tractor') < 0.3) {
    s = patchShip(s, 'halcyon', { tractor: { target: null } });
    reports.push(say('helm', 'tractorFailed'));
  }

  const sim = scenario.simulate(s, rng);
  // Standing orders and conditional prohibitions react to what just happened.
  const st = checkStanding(sim.state, rng, scenario.hooks);
  const pr = checkPromises(st.state, scenario.hooks.dialogue);
  return { state: pr.state, reports: [...reports, ...sim.reports, ...st.reports, ...pr.reports] };
}

/**
 * Sub-minute time (dialogue, hails, channel operations). The clock advances by `seconds`;
 * whenever that crosses a minute boundary the world takes its normal one-minute turn
 * (physics, NPC agents, events), so talking is cheap but never free.
 */
export function advanceSeconds(s: WorldState, seconds: number, rng: Rng, scenario: ScenarioModule): { state: WorldState; reports: Report[] } {
  const reports: Report[] = [];
  let carry = s.counters.clockCarry ?? 0;
  let left = seconds;
  while (left > 0 && !s.outcome) {
    const room = TURN_SECONDS - carry;
    if (left < room) {
      // Ships keep moving while we talk; the NPCs decide again at the minute boundary.
      const phys = runPhysics(s, left);
      s = { ...phys.state, time: s.time + left, counters: { ...phys.state.counters, clockCarry: carry + left } };
      reports.push(...phys.reports);
      break;
    }
    const t = advanceTurn(s, rng, scenario);
    s = t.state;
    reports.push(...t.reports);
    left -= room;
    carry = 0;
    if (scenario.detectOutcome(s)) break;
  }
  return { state: s, reports };
}
