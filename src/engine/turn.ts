/**
 * The command pipeline:
 *   interpretation (ProposedActions) → schema check → validate → apply →
 *   [if time passes] standing orders + NPC agents + events → objectives →
 *   outcome → narration (reports + state diff) → new WorldState.
 */
import type { Interpretation, ProposedAction } from './schema';
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
import type { ShipId, WorldState } from './types';
import { STANDOFF_CRUISER, STANDOFF_KESTREL, TURN_SECONDS, clamp, distance, efficiency, halcyonSpeed, km, pointBetween, range, stepAway, stepToward } from './rules';
import { addLog, patchShip, patchSystem, setCounter } from './state';

export interface TurnResult {
  state: WorldState;
  results: { action: ProposedAction; status: 'accepted' | 'partial' | 'rejected' }[];
}

function commitLogs(s: WorldState, reports: Report[], narrator: Narrator): WorldState {
  for (const d of narrator.render(reports, s)) s = addLog(s, d.channel, d.speaker, d.text);
  return s;
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

  const actions = interp.kind === 'unrecognised' ? [] : interp.actions;
  if (interp.kind === 'unrecognised') reports.push(say('xo', 'notUnderstood', { text: interp.unparsed.join(' / ') || text }));
  else if (interp.unparsed.length) reports.push(say('xo', 'partlyUnderstood', { text: interp.unparsed.join(' / ') }));

  for (const raw of actions) {
    const parsed = ProposedActionSchema.safeParse(raw);
    if (!parsed.success) {
      reports.push(sys('invalidAction'));
      continue;
    }
    const v = validate(s, parsed.data);
    reports.push(...v.reasons);
    results.push({ action: v.action, status: v.status });
    if (v.status === 'rejected') continue;
    const applied = applyAction(s, v.action, rng, scenario.hooks);
    s = applied.state;
    reports.push(...applied.reports);
    if (v.timeCost) timePasses = true;
    if (s.flags.jumped || s.ships.halcyon.destroyed) break;
  }

  s = { ...s, lastTarget: lastTargetOf(actions, s.lastTarget) };
  const lastComm = [...results].reverse().find((r) => r.action.type === 'communicate' && r.status !== 'rejected');
  if (lastComm && lastComm.action.type === 'communicate') s = setCounter(s, 'lastCommTarget', ['kestrel', 'cruiser', 'passenger'].indexOf(lastComm.action.target) + 1);
  s = { ...s, clarification: interp.kind === 'clarify' ? interp.clarification : null };
  if (interp.kind === 'clarify') reports.push(say('xo', 'clarify', { question: interp.clarification.question }));

  if (timePasses && !s.flags.jumped) {
    const t = advanceTurn({ ...s, rng: rng.state }, rng, scenario);
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

function finalise(s: WorldState, scenario: ScenarioModule): WorldState {
  const outcome = s.outcome ?? scenario.detectOutcome(s);
  if (outcome && !s.outcome) s = { ...s, outcome, orders: { helm: null, jumpCharging: false }, clarification: null };
  return { ...s, objectives: scenario.objectives(s, !!s.outcome) };
}

/** One minute of simulated time: standing orders, physics, then the scenario's agents and events. */
export function advanceTurn(s: WorldState, rng: Rng, scenario: ScenarioModule): { state: WorldState; reports: Report[] } {
  const reports: Report[] = [];
  s = { ...s, turn: s.turn + 1, time: s.time + TURN_SECONDS };

  // Helm standing order.
  const order = s.orders.helm;
  const h0 = s.ships.halcyon;
  if (order && !h0.destroyed) {
    const speed = halcyonSpeed(s);
    const from = h0.position;
    let to = from;
    let done = false;
    const tgt = order.target ? s.ships[order.target] : null;
    if (order.mode === 'approach' && tgt) {
      const standoff = order.target === 'cruiser' ? STANDOFF_CRUISER : STANDOFF_KESTREL;
      to = stepToward(from, tgt.position, speed, standoff);
      done = distance(to, tgt.position) <= standoff + 50;
      if (done) reports.push(say('helm', 'arrived', { target: tgt.name, km: km(distance(to, tgt.position)) }));
    } else if (order.mode === 'range' && tgt && order.rangeKm !== null) {
      const d = distance(from, tgt.position);
      if (d > order.rangeKm) to = stepToward(from, tgt.position, speed, order.rangeKm);
      else to = stepAway(from, tgt.position, Math.min(speed, order.rangeKm - d));
      done = Math.abs(distance(to, tgt.position) - order.rangeKm) <= 100;
      if (done) reports.push(say('helm', 'atRange', { target: tgt.name, km: km(order.rangeKm) }));
    } else if (order.mode === 'away' && tgt) {
      to = stepAway(from, tgt.position, speed);
    } else if (order.mode === 'interpose') {
      const k = s.ships.kestrel;
      const c = s.ships.cruiser;
      if (!k.destroyed && !c.destroyed && c.detected) to = stepToward(from, pointBetween(k.position, c.position, 1000), speed, 0);
    }
    s = patchShip(s, 'halcyon', { position: { x: Math.round(to.x), y: Math.round(to.y) } });
    // Towing drags the Kestrel along.
    if (s.ships.halcyon.tractor.target === 'kestrel' && !s.ships.kestrel.destroyed) {
      const k = s.ships.kestrel.position;
      s = patchShip(s, 'kestrel', { position: { x: Math.round(k.x + (to.x - from.x)), y: Math.round(k.y + (to.y - from.y)) } });
    }
    if (done) s = { ...s, orders: { ...s.orders, helm: null } };
  }
  const k = s.ships.kestrel;
  const c = s.ships.cruiser;
  if (!k.destroyed && !c.destroyed && c.detected) {
    const point = pointBetween(k.position, c.position, 1000);
    s = { ...s, flags: { ...s.flags, interposing: distance(s.ships.halcyon.position, point) <= 2500 && range(s, 'halcyon', 'kestrel') <= 3500 } };
  }

  // Jump drive charging.
  if (s.orders.jumpCharging) {
    const h = s.ships.halcyon;
    const charge = clamp(h.jump.charge + Math.round(55 * efficiency(h, 'jumpDrive')), 0, 100);
    s = patchShip(s, 'halcyon', { jump: { charge } });
    if (charge >= 100) {
      s = { ...s, orders: { ...s.orders, jumpCharging: false } };
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
  return { state: sim.state, reports: [...reports, ...sim.reports] };
}
