/** Physical constants and derived quantities. Pure functions only. */
import type { Ship, ShipId, ShipSystem, SystemId, Vec2, WorldState } from './types';

export const TURN_SECONDS = 60;
export const TRANSPORT_RANGE = 5000;
export const TRANSPORT_RANGE_STORM = 3000;
export const TRACTOR_RANGE = 6000;
export const BEAM_RANGE = 40000;
export const TORPEDO_RANGE = 120000;
export const HALCYON_SPEED = 14000; // km per turn at full impulse
export const CRUISER_SPEED = 30000;
export const STANDOFF_KESTREL = 1500;
export const STANDOFF_CRUISER = 10000;
export const SENSOR_MAX_RANGE = 260000;
export const MAX_TURNS = 30;

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const round = (n: number) => Math.round(n);

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function range(s: WorldState, a: ShipId, b: ShipId): number {
  return distance(s.ships[a].position, s.ships[b].position);
}

/** Relative bearing from the Halcyon in degrees (0 = ahead/+y, clockwise), 0–359. */
export function bearingFrom(from: Vec2, to: Vec2): number {
  const deg = (Math.atan2(to.x - from.x, to.y - from.y) * 180) / Math.PI;
  return (Math.round(deg) + 360) % 360;
}

export function deriveStatus(sys: Pick<ShipSystem, 'health' | 'power'>): ShipSystem['status'] {
  if (sys.health <= 0) return 'destroyed';
  if (sys.power <= 0) return 'offline';
  if (sys.health < 50) return 'damaged';
  return 'online';
}

/** Effective output of a system, 0–1.5. Destroyed or unpowered systems give 0. */
export function efficiency(ship: Ship, id: SystemId): number {
  const sys = ship.systems[id];
  if (ship.destroyed || sys.health <= 0 || sys.power <= 0) return 0;
  return (sys.health / 100) * (Math.min(sys.power, 150) / 100);
}

export function usable(ship: Ship, id: SystemId, min = 0.15): boolean {
  return efficiency(ship, id) >= min;
}

export function transportRange(s: WorldState): number {
  return s.variant.complication === 'ionStorm' ? TRANSPORT_RANGE_STORM : TRANSPORT_RANGE;
}

export function halcyonSpeed(s: WorldState): number {
  const h = s.ships.halcyon;
  const towing = h.tractor.target === 'kestrel';
  return round(HALCYON_SPEED * Math.min(1.25, efficiency(h, 'engines')) * (towing ? 0.5 : 1));
}

/** Move `from` toward `to` by at most `step`, stopping `standoff` short. */
export function stepToward(from: Vec2, to: Vec2, step: number, standoff: number): Vec2 {
  const d = distance(from, to);
  const travel = clamp(d - standoff, 0, step);
  if (d === 0 || travel === 0) return from;
  return { x: from.x + ((to.x - from.x) / d) * travel, y: from.y + ((to.y - from.y) / d) * travel };
}

/** Move `from` directly away from `threat` by `step`. */
export function stepAway(from: Vec2, threat: Vec2, step: number): Vec2 {
  const d = distance(from, threat) || 1;
  return { x: from.x + ((from.x - threat.x) / d) * step, y: from.y + ((from.y - threat.y) / d) * step };
}

/** Point `offset` km from `anchor` toward `toward` (used to interpose). */
export function pointBetween(anchor: Vec2, toward: Vec2, offset: number): Vec2 {
  const d = distance(anchor, toward) || 1;
  return { x: anchor.x + ((toward.x - anchor.x) / d) * offset, y: anchor.y + ((toward.y - anchor.y) / d) * offset };
}

export function systemLabel(id: SystemId): string {
  return (
    {
      reactor: 'reactor',
      engines: 'impulse engines',
      shields: 'shields',
      weapons: 'weapons',
      sensors: 'sensors',
      tractor: 'tractor beam',
      transporter: 'transporter',
      jumpDrive: 'jump drive',
      comms: 'communications',
      lifeSupport: 'life support',
    } as const
  )[id];
}

export function km(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} km`;
}
