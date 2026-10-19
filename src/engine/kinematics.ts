/**
 * 2D kinematics and helm guidance. Pure functions only.
 *
 * Every ship has a position (km), velocity (km/s), heading (degrees, 0 = +y, clockwise)
 * and performance limits (max speed, acceleration, turn rate) scaled by impulse-engine
 * efficiency. A NavGoal names a guidance behaviour (interpose, intercept, escort…);
 * each sub-step the behaviour produces a guidance point plus the velocity to match
 * there, the steering law turns that into a desired velocity, and the ship turns and
 * accelerates toward it within its limits. Distances, bearings and closing rates are
 * all derived from these positions.
 */
import { clamp, distance, efficiency } from './rules';
import type { ManeuverIntent, NavGoal, NavRef, Ship, ShipId, Vec2, WorldState } from './types';

export const SUBSTEP_SECONDS = 5;
/** Arrival tolerance for point goals, km. */
export const ARRIVE_KM = 600;
export const SHIP_IDS: ShipId[] = ['halcyon', 'kestrel', 'cruiser'];
/** Below this speed, corrections are made with thrusters without turning the ship. */
export const RCS_SPEED = 15;

// ---------- vector helpers ----------
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export function unit(a: Vec2, fallback: Vec2 = { x: 0, y: 1 }): Vec2 {
  const l = len(a);
  return l < 1e-9 ? fallback : { x: a.x / l, y: a.y / l };
}
export function headingOf(v: Vec2): number {
  return norm360((Math.atan2(v.x, v.y) * 180) / Math.PI);
}
export function headingVec(deg: number): Vec2 {
  const r = (deg * Math.PI) / 180;
  return { x: Math.sin(r), y: Math.cos(r) };
}
export const norm360 = (d: number) => ((d % 360) + 360) % 360;
/** Signed smallest difference b − a in degrees, (−180, 180]. */
export function angleDiff(a: number, b: number): number {
  let d = norm360(b - a);
  if (d > 180) d -= 360;
  return d;
}

// ---------- performance ----------
export interface Perf {
  maxSpeed: number;
  accel: number;
  turnRate: number;
}

/** Performance after engine damage/power, towing and tractor drag. */
export function effectivePerf(s: WorldState, id: ShipId): Perf {
  const ship = s.ships[id];
  if (ship.destroyed) return { maxSpeed: 0, accel: 0, turnRate: 0 };
  const e = efficiency(ship, 'engines');
  if (e < 0.1) return { maxSpeed: 0, accel: ship.perf.accel * 0.25, turnRate: 0 };
  const eff = Math.min(1.25, e);
  let drag = 1;
  if (id === 'halcyon' && ship.tractor.target === 'kestrel') drag = 0.5;
  if (id === 'cruiser' && s.ships.halcyon.tractor.target === 'cruiser') drag = 0.4;
  return {
    maxSpeed: ship.perf.maxSpeed * eff * drag,
    accel: ship.perf.accel * Math.max(0.3, eff) * drag,
    turnRate: ship.perf.turnRate * Math.max(0.3, Math.min(1.1, eff)),
  };
}

// ---------- references ----------
export function refPos(s: WorldState, ref: NavRef): Vec2 | null {
  if (ref === 'border') return s.landmarks.border ? borderPointFor(s, s.ships.halcyon.position) : null;
  const sh = s.ships[ref];
  return sh.destroyed ? null : sh.position;
}
export function refVel(s: WorldState, ref: NavRef): Vec2 {
  return ref === 'border' ? { x: 0, y: 0 } : s.ships[ref].velocity;
}
/** The border is a line y = border.y; the nearest crossing point from `from`. */
export function borderPointFor(s: WorldState, from: Vec2): Vec2 {
  const b = s.landmarks.border ?? { x: 0, y: -120000 };
  return { x: from.x, y: b.y };
}
export function refAvailable(s: WorldState, ref: NavRef | null): boolean {
  if (!ref) return false;
  if (ref === 'border') return !!s.landmarks.border;
  const sh = s.ships[ref];
  return !sh.destroyed && (ref === 'halcyon' || sh.detected);
}

/** A ship that the guidance treats as the threat end of an interposition. */
export function isThreat(s: WorldState, ref: NavRef): boolean {
  if (ref === 'border') return false;
  const sh = s.ships[ref];
  return sh.disposition === 'hostile' || sh.faction === 'directorate';
}

// ---------- geometry ----------
/** Distance from p to segment ab and the projection parameter t (0 at a, 1 at b). */
export function segmentInfo(p: Vec2, a: Vec2, b: Vec2): { d: number; t: number } {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  if (l2 < 1e-9) return { d: distance(p, a), t: 0 };
  const t = dot(sub(p, a), ab) / l2;
  const tc = clamp(t, 0, 1);
  return { d: distance(p, add(a, scale(ab, tc))), t };
}

/** Is `p` physically between a and b (on the line segment, within a corridor)? */
export function isBetween(p: Vec2, a: Vec2, b: Vec2): boolean {
  const { d, t } = segmentInfo(p, a, b);
  const span = distance(a, b);
  return t > 0.01 && t < 0.99 && d <= Math.max(1500, span * 0.1);
}

/**
 * Where to sit to interpose between two references. Protecting a vulnerable ship
 * from a threat: close to the protected ship on the threat's line of fire (inside
 * transporter range, so the protected ship can still be helped). Otherwise the midpoint.
 */
export function interposePoint(s: WorldState, a: NavRef, b: NavRef, lookAhead = 0): Vec2 | null {
  let pa = refPos(s, a);
  let pb = refPos(s, b);
  if (!pa || !pb) return null;
  if (lookAhead) {
    pa = add(pa, scale(refVel(s, a), lookAhead));
    pb = add(pb, scale(refVel(s, b), lookAhead));
  }
  const span = distance(pa, pb);
  const ta = isThreat(s, a);
  const tb = isThreat(s, b);
  if (ta !== tb && a !== 'border' && b !== 'border') {
    const [prot, threat] = ta ? [pb, pa] : [pa, pb];
    const off = Math.min(span * 0.4, 2500);
    return add(prot, scale(unit(sub(threat, prot)), off));
  }
  if (a === 'border' || b === 'border') {
    const [ship, border] = a === 'border' ? [pb, pa] : [pa, pb];
    return add(ship, scale(unit(sub(border, ship)), Math.min(span * 0.5, 20000)));
  }
  return scale(add(pa, pb), 0.5);
}

// ---------- guidance ----------
export interface Guidance {
  /** Point to reach (null: velocity-only command). */
  point: Vec2 | null;
  /** Velocity to match at the point (moving targets). */
  match: Vec2;
  /** Explicit desired velocity overriding point-steering (retreat, evasive, stop). */
  velocity?: Vec2;
  /** Explicit desired heading (face). */
  heading?: number;
  /** Has the behaviour's objective been reached right now? */
  reached: boolean;
  /** The goal can no longer be pursued (target lost). */
  lost: boolean;
}

export const DEFAULT_RANGE: Record<ManeuverIntent, number> = {
  approach: 1500,
  standoff: 30000,
  interpose: 0,
  intercept: 2000,
  follow: 15000,
  escort: 3000,
  block: 6000,
  retreat: 150000,
  flee: 0,
  orbit: 3000,
  holdStation: 0,
  allStop: 0,
  face: 0,
  evasive: 0,
};

/** Default close-approach distance to a ship (keeps a safe standoff from warships). */
export function approachRange(s: WorldState, target: NavRef | null): number {
  if (target && target !== 'border' && isThreat(s, target)) return 10000;
  return DEFAULT_RANGE.approach;
}

export function guidanceFor(s: WorldState, id: ShipId, goal: NavGoal, tick = 0): Guidance {
  const me = s.ships[id];
  const p = me.position;
  const lost: Guidance = { point: null, match: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, reached: false, lost: true };
  const tgtPos = goal.target ? refPos(s, goal.target) : null;
  const tgtVel = goal.target ? refVel(s, goal.target) : { x: 0, y: 0 };
  const R = goal.rangeKm ?? (goal.intent === 'approach' ? approachRange(s, goal.target) : DEFAULT_RANGE[goal.intent]);
  const ringPoint = (tp: Vec2, r: number) => add(tp, scale(unit(sub(p, tp), headingVec(me.heading + 180)), r));
  const near = (pt: Vec2, tol = ARRIVE_KM) => distance(p, pt) <= tol;

  switch (goal.intent) {
    case 'allStop':
      return { point: null, match: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, reached: len(me.velocity) < 1, lost: false };
    case 'face': {
      const want = tgtPos ? headingOf(sub(tgtPos, p)) : norm360((goal.offset?.x ?? me.heading) + 0);
      if (goal.target && !tgtPos) return lost;
      return { point: null, match: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: want, reached: Math.abs(angleDiff(me.heading, want)) < 3, lost: false };
    }
    case 'evasive': {
      const jink = (((s.turn * 7 + Math.floor(tick / 3) * 3) % 5) - 2) * 30;
      const base = tgtPos ? headingOf(sub(p, tgtPos)) : me.heading;
      return { point: null, match: { x: 0, y: 0 }, velocity: scale(headingVec(base + jink), 1e6), reached: false, lost: false };
    }
    case 'holdStation': {
      if (!goal.target) return { point: null, match: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, reached: len(me.velocity) < 1, lost: false };
      if (!tgtPos) return lost;
      const pt = add(tgtPos, goal.offset ?? sub(p, tgtPos));
      return { point: pt, match: tgtVel, reached: near(pt), lost: false };
    }
    case 'flee': {
      const pt = borderPointFor(s, p);
      return { point: add(pt, { x: 0, y: -5000 }), match: { x: 0, y: 0 }, reached: p.y <= pt.y, lost: false };
    }
    case 'interpose': {
      if (!goal.target || !goal.second) return lost;
      const pt = interposePoint(s, goal.target, goal.second);
      if (!pt) return lost;
      // The point's own velocity (it moves as the two references move).
      const ahead = interposePoint(s, goal.target, goal.second, 10)!;
      const match = scale(sub(ahead, pt), 1 / 10);
      const a = refPos(s, goal.target)!;
      const b = refPos(s, goal.second)!;
      return { point: pt, match, reached: near(pt, Math.max(ARRIVE_KM, distance(a, b) * 0.03)) && isBetween(p, a, b), lost: false };
    }
  }
  if (!tgtPos) return lost;
  const d = distance(p, tgtPos);
  switch (goal.intent) {
    case 'approach':
    case 'standoff': {
      const pt = ringPoint(tgtPos, R);
      return { point: pt, match: tgtVel, reached: Math.abs(d - R) <= Math.max(ARRIVE_KM, R * 0.03), lost: false };
    }
    case 'retreat': {
      if (goal.rangeKm !== null) {
        const pt = ringPoint(tgtPos, R);
        return { point: pt, match: { x: 0, y: 0 }, reached: d >= R - Math.max(ARRIVE_KM, R * 0.03), lost: false };
      }
      return { point: null, match: { x: 0, y: 0 }, velocity: scale(unit(sub(p, tgtPos), headingVec(me.heading)), 1e6), reached: d >= R, lost: false };
    }
    case 'intercept': {
      const perf = effectivePerf(s, id);
      const tgo = d / Math.max(50, perf.maxSpeed + Math.max(0, -dot(unit(sub(tgtPos, p)), tgtVel)));
      const lead = add(tgtPos, scale(tgtVel, Math.min(tgo, 600)));
      const pt = d <= R * 2 ? ringPoint(tgtPos, R) : lead;
      return { point: pt, match: d <= R * 2 ? tgtVel : { x: 0, y: 0 }, reached: d <= R + ARRIVE_KM, lost: false };
    }
    case 'follow': {
      const moving = len(tgtVel) > 5;
      const pt = moving ? sub(tgtPos, scale(unit(tgtVel), R)) : ringPoint(tgtPos, R);
      return { point: pt, match: tgtVel, reached: near(pt, Math.max(ARRIVE_KM, R * 0.05)), lost: false };
    }
    case 'escort': {
      const tgt = goal.target !== 'border' ? s.ships[goal.target!] : null;
      const fwd = len(tgtVel) > 5 ? unit(tgtVel) : headingVec(tgt?.heading ?? 0);
      const side = { x: fwd.y, y: -fwd.x }; // starboard of the escorted ship
      const pt = add(tgtPos, scale(side, R));
      return { point: pt, match: tgtVel, reached: near(pt, Math.max(ARRIVE_KM, R * 0.1)), lost: false };
    }
    case 'block': {
      const tgt = goal.target !== 'border' ? s.ships[goal.target!] : null;
      const moving = len(tgtVel) > 5;
      const dir = moving ? unit(tgtVel) : headingVec(tgt?.heading ?? 0);
      const lead = moving ? clamp(len(tgtVel) * 30, R, 25000) : R;
      const pt = add(tgtPos, scale(dir, lead));
      // In the path: ahead of the target and close to its line of travel.
      const rel = sub(p, tgtPos);
      const ahead = dot(rel, dir);
      const lateral = Math.abs(rel.x * dir.y - rel.y * dir.x);
      return { point: pt, match: tgtVel, reached: ahead > 1000 && lateral <= Math.max(1500, lead * 0.15) && ahead <= lead * 1.5 + 2000, lost: false };
    }
    case 'orbit': {
      const ang = headingOf(sub(p, tgtPos));
      const pt = add(tgtPos, scale(headingVec(ang + 25), R));
      return { point: pt, match: tgtVel, reached: Math.abs(d - R) <= Math.max(ARRIVE_KM, R * 0.15), lost: false };
    }
  }
  return lost;
}

/** Desired velocity for a guidance solution: arrive at the point while matching its velocity. */
export function desiredVelocity(me: Ship, g: Guidance, perf: Perf, speedFactor: number): Vec2 {
  const vmax = perf.maxSpeed * clamp(speedFactor, 0.05, 1);
  if (g.velocity) {
    const l = len(g.velocity);
    return l > vmax ? scale(g.velocity, vmax / l) : g.velocity;
  }
  if (!g.point) return { x: 0, y: 0 };
  const off = sub(g.point, me.position);
  const d = len(off);
  // Speed that can still be shed before the point (with margin), capped by the speed limit.
  const brake = Math.sqrt(2 * Math.max(perf.accel, 0.01) * 0.6 * d);
  const closing = Math.min(vmax, brake, d / SUBSTEP_SECONDS);
  // Match the point's motion only when close to it; far away, just go there.
  const w = clamp(1 - (d - 2000) / 20000, 0, 1);
  const v = add(scale(g.match, w), scale(unit(off), closing));
  const l = len(v);
  return l > perf.maxSpeed ? scale(v, perf.maxSpeed / l) : v;
}

/** One integration step for one ship. */
export function stepShip(me: Ship, g: Guidance | null, perf: Perf, speedFactor: number, dt: number): Ship {
  const vNow = me.velocity;
  const want = g ? desiredVelocity(me, g, perf, speedFactor) : vNow; // no goal: coast
  const wantSpeed = len(want);
  // Heading: toward the desired velocity when it is meaningful, else an explicit heading.
  // Small station-keeping corrections use manoeuvring thrusters: no need to swing the bow.
  const rcs = g?.heading === undefined && wantSpeed <= RCS_SPEED && len(vNow) <= RCS_SPEED * 2;
  let targetHeading = me.heading;
  if (g?.heading !== undefined) targetHeading = g.heading;
  else if (wantSpeed > 2 && !rcs) targetHeading = headingOf(want);
  const err = angleDiff(me.heading, targetHeading);
  const maxTurn = perf.turnRate * dt;
  const heading = norm360(me.heading + clamp(err, -maxTurn, maxTurn));
  // Thrust along the heading only: the ship can speed up or brake along its axis;
  // lateral velocity bleeds off with the inertial dampers at the same acceleration.
  const fwd = headingVec(heading);
  const remainingErr = Math.abs(angleDiff(heading, targetHeading));
  const along = wantSpeed * Math.max(0, Math.cos((remainingErr * Math.PI) / 180));
  const desiredV = g?.heading !== undefined ? { x: 0, y: 0 } : rcs ? want : scale(fwd, along);
  const dv = sub(g ? desiredV : vNow, vNow);
  const maxDv = perf.accel * dt;
  const dl = len(dv);
  let v = dl > maxDv ? add(vNow, scale(dv, maxDv / dl)) : add(vNow, dv);
  // Never exceed the (possibly reduced) speed limit, except while braking down to it.
  const sp = len(v);
  const limit = Math.max(perf.maxSpeed, len(vNow) - maxDv);
  if (sp > limit) v = scale(v, limit / sp);
  const position = add(me.position, scale(add(vNow, v), dt / 2));
  return { ...me, position, velocity: v, heading };
}

/** Rough seconds for a ship to satisfy a goal (turn, accelerate, cruise, brake). */
export function estimateEta(s: WorldState, id: ShipId, goal: NavGoal): number | null {
  const me = s.ships[id];
  const g = guidanceFor(s, id, goal);
  const perf = effectivePerf(s, id);
  if (g.lost || perf.maxSpeed <= 0) return null;
  if (g.reached) return 0;
  if (g.heading !== undefined) return Math.abs(angleDiff(me.heading, g.heading)) / Math.max(perf.turnRate, 0.1);
  if (goal.intent === 'allStop' || (goal.intent === 'holdStation' && !goal.target)) return len(me.velocity) / Math.max(perf.accel, 0.1);
  let pt = g.point;
  if (!pt && goal.target) {
    const tp = refPos(s, goal.target);
    if (!tp) return null;
    const R = goal.rangeKm ?? DEFAULT_RANGE[goal.intent];
    pt = add(tp, scale(unit(sub(me.position, tp)), R));
  }
  if (!pt) return null;
  const d = distance(me.position, pt);
  const v = perf.maxSpeed * clamp(goal.speedFactor, 0.05, 1);
  const turn = Math.abs(angleDiff(me.heading, headingOf(sub(pt, me.position)))) / Math.max(perf.turnRate, 0.1);
  const accelT = v / Math.max(perf.accel, 0.01);
  const cruise = Math.max(0, d - v * accelT) / v;
  return turn + accelT + cruise;
}
