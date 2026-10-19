/**
 * Physics for one turn: TURN_SECONDS of simulated time integrated in sub-steps.
 * All ships follow their NavGoal (the Halcyon's helm order, the NPC agents'
 * decisions); the Kestrel is towed rigidly when held in the tractor beam.
 * Emits helm lifecycle reports (underway / in position / failed) as they happen.
 */
import { say, type Report } from './report';
import { TURN_SECONDS, distance } from './rules';
import { SHIP_IDS, SUBSTEP_SECONDS, add, effectivePerf, estimateEta, guidanceFor, headingOf, isBetween, len, stepShip, sub } from './kinematics';
import { getOrder, goalLabel, refName, updateOrder } from './orders';
import { patchShip, setCounter } from './state';
import type { NavGoal, ShipId, Vec2, WorldState } from './types';

/** Behaviours that complete on geometry alone (no need to match velocity first). */
const UNSETTLED = ['intercept', 'orbit', 'block'];

const r1 = (n: number) => Math.round(n * 10) / 10;
const roundV = (v: Vec2): Vec2 => ({ x: r1(v.x), y: r1(v.y) });

/** Speed fraction after posture bias: a declared non-hostile posture caps closing speed on a warship. */
export function postureSpeed(s: WorldState, id: ShipId, goal: NavGoal): number {
  let f = goal.speedFactor;
  if (id !== 'halcyon' || s.posture.stance !== 'nonHostile') return f;
  const c = s.ships.cruiser;
  if (c.destroyed || !c.detected) return f;
  const me = s.ships.halcyon;
  const toC = sub(c.position, me.position);
  const d = len(toC);
  const headingToward = Math.abs(((headingOf(toC) - me.heading + 540) % 360) - 180) < 60;
  if (d < 60000 && headingToward && goal.target !== 'kestrel' && goal.intent !== 'interpose') f = Math.min(f, 0.6);
  return f;
}

export function runPhysics(s: WorldState): { state: WorldState; reports: Report[] } {
  const reports: Report[] = [];
  const steps = Math.round(TURN_SECONDS / SUBSTEP_SECONDS);
  const helm0 = s.ships.halcyon.nav;
  const order0 = helm0 ? getOrder(s, helm0.orderId) : undefined;

  // First tick of a new helm order: underway.
  if (helm0 && order0 && order0.status === 'acknowledged') {
    const perf = effectivePerf(s, 'halcyon');
    if (perf.maxSpeed > 0 || helm0.intent === 'allStop') {
      s = updateOrder(s, order0.id, { status: 'underway' });
      if (!['allStop', 'face', 'evasive', 'holdStation'].includes(helm0.intent)) {
        const g = guidanceFor(s, 'halcyon', helm0);
        const course = g.point ? headingOf(sub(g.point, s.ships.halcyon.position)) : s.ships.halcyon.heading;
        reports.push(say('helm', 'helmUnderway', { course: String(Math.round(course) % 360).padStart(3, '0'), speed: Math.round(perf.maxSpeed * postureSpeed(s, 'halcyon', helm0)) }));
      }
    }
  }

  let towOffset: Vec2 | null = null;
  if (s.ships.halcyon.tractor.target === 'kestrel' && !s.ships.kestrel.destroyed) towOffset = sub(s.ships.kestrel.position, s.ships.halcyon.position);

  for (let tick = 0; tick < steps; tick++) {
    for (const id of SHIP_IDS) {
      const ship = s.ships[id];
      if (ship.destroyed) continue;
      if (id === 'kestrel' && towOffset) continue;
      const goal = ship.nav;
      const perf = effectivePerf(s, id);
      const g = goal ? guidanceFor(s, id, goal, tick) : null;
      if (goal && g?.lost) {
        if (id === 'halcyon') {
          s = updateOrder(s, goal.orderId, { status: 'failed', maintaining: false, detail: 'target lost' });
          reports.push(say('helm', 'helmLost', { label: goalLabel(s, goal) }));
        }
        s = patchShip(s, id, { nav: { intent: 'allStop', target: null, second: null, rangeKm: null, speedFactor: 1, offset: null, orderId: null, reached: false, startedTurn: s.turn } });
        continue;
      }
      // No goal: ships with working engines hold their state; drifting hulks coast.
      const moved = stepShip(ship, g, perf, goal ? postureSpeed(s, id, goal) : 1, SUBSTEP_SECONDS);
      s = patchShip(s, id, { position: moved.position, velocity: moved.velocity, heading: moved.heading });
      if (goal?.intent === 'evasive') s = setCounter(s, `evasive_${id}`, s.turn);
      if (goal && g && !g.lost) {
        const after = guidanceFor(s, id, goal, tick);
        const settled = after.point === null || UNSETTLED.includes(goal.intent) || len(sub(s.ships[id].velocity, after.match)) < 40;
        if (after.reached && settled && !goal.reached) {
          s = patchShip(s, id, { nav: { ...goal, reached: true } });
          if (id === 'halcyon') {
            const stays = !['allStop', 'face', 'flee'].includes(goal.intent);
            s = updateOrder(s, goal.orderId, { status: 'completed', maintaining: stays, etaSeconds: 0 });
            reports.push(say('helm', `helmDone_${goal.intent}`, { target: refName(s, goal.target), second: refName(s, goal.second), km: Math.round(goal.target && goal.target !== 'border' ? distance(s.ships.halcyon.position, s.ships[goal.target].position) : 0).toLocaleString('en-US'), t: (tick + 1) * SUBSTEP_SECONDS }));
            if (goal.intent === 'flee') s = { ...s, flags: { ...s.flags, leftReach: true, ...(towOffset ? { kestrelTowedOut: true } : {}) } };
          }
        }
      }
    }
    if (towOffset) s = patchShip(s, 'kestrel', { position: add(s.ships.halcyon.position, towOffset), velocity: s.ships.halcyon.velocity });
  }

  // Engines failed under an active order.
  const h = s.ships.halcyon;
  if (h.nav?.orderId && effectivePerf(s, 'halcyon').maxSpeed <= 0 && !h.destroyed && h.nav.intent !== 'allStop') {
    const o = getOrder(s, h.nav.orderId);
    if (o && (o.status === 'underway' || o.status === 'acknowledged' || o.maintaining)) {
      s = updateOrder(s, o.id, { status: 'failed', maintaining: false, detail: 'impulse engines offline' });
      reports.push(say('helm', 'helmEnginesLost'));
    }
  }
  // Update ETA for an order still underway.
  if (s.ships.halcyon.nav && !s.ships.halcyon.nav.reached) {
    const o = getOrder(s, s.ships.halcyon.nav.orderId);
    if (o && o.status === 'underway') s = updateOrder(s, o.id, { etaSeconds: roundEta(estimateEta(s, 'halcyon', s.ships.halcyon.nav)) });
  }

  for (const id of SHIP_IDS) {
    const sh = s.ships[id];
    s = patchShip(s, id, { position: roundV(sh.position), velocity: roundV(sh.velocity), heading: r1(sh.heading) % 360 });
  }
  const k = s.ships.kestrel;
  const c = s.ships.cruiser;
  const between = !k.destroyed && !c.destroyed && c.detected && isBetween(s.ships.halcyon.position, k.position, c.position);
  s = { ...s, flags: { ...s.flags, interposing: between } };
  return { state: s, reports };
}

export function roundEta(sec: number | null): number | null {
  if (sec === null || !Number.isFinite(sec)) return null;
  return Math.max(5, Math.round(sec / 5) * 5);
}

export function etaText(sec: number | null): string {
  if (sec === null) return 'unknown';
  if (sec <= 90) return `about ${Math.max(5, Math.round(sec / 5) * 5)} seconds`;
  const m = Math.round(sec / 30) / 2;
  return `about ${m} minute${m === 1 ? '' : 's'}`;
}

/**
 * Projected track for a ship following its current nav goal (other ships are
 * extrapolated along their current velocity). Pure; used by the tactical plot.
 */
export function predictPath(s: WorldState, id: ShipId, seconds = 180, every = 15): Vec2[] {
  const pts: Vec2[] = [s.ships[id].position];
  const goal = s.ships[id].nav;
  if (!goal || s.ships[id].destroyed) return pts;
  let w = s;
  const steps = Math.round(seconds / SUBSTEP_SECONDS);
  for (let i = 1; i <= steps; i++) {
    for (const other of SHIP_IDS) {
      if (other === id || w.ships[other].destroyed) continue;
      const o = w.ships[other];
      w = patchShip(w, other, { position: add(o.position, { x: o.velocity.x * SUBSTEP_SECONDS, y: o.velocity.y * SUBSTEP_SECONDS }) });
    }
    const g = guidanceFor(w, id, goal, i);
    if (g.lost) break;
    const moved = stepShip(w.ships[id], g, effectivePerf(w, id), postureSpeed(w, id, goal), SUBSTEP_SECONDS);
    w = patchShip(w, id, { position: moved.position, velocity: moved.velocity, heading: moved.heading });
    if ((i * SUBSTEP_SECONDS) % every === 0) pts.push(roundV(moved.position));
  }
  return pts;
}

/** Current guidance point of a ship's nav goal (for drawing), if any. */
export function goalPoint(s: WorldState, id: ShipId): Vec2 | null {
  const goal = s.ships[id].nav;
  if (!goal) return null;
  const g = guidanceFor(s, id, goal);
  return g.lost ? null : g.point;
}
