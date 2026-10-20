/** Read-only projections of the WorldState for the UI: only what the crew knows. */
import type { Disposition, ShipId, Vec2, WorldState } from '../engine/types';
import { angleDiff, dot, len, sub, unit } from '../engine/kinematics';
import { goalPoint, predictPath } from '../engine/motion';
import { visibleOrders } from '../engine/orders';
import type { TrackedOrder } from '../engine/types';
import type { ScenarioModule } from '../engine/scenario';
import { bearingFrom, range } from '../engine/rules';

export interface ContactView {
  id: ShipId;
  name: string;
  classification: string;
  faction: string;
  range: number;
  /** Absolute bearing (0 = galactic north). */
  bearing: number;
  /** Bearing relative to the Halcyon's heading (−180..180, 0 = dead ahead). */
  relBearing: number;
  /** Closing speed toward the Halcyon, km/s (negative = opening). */
  closing: number;
  speed: number;
  heading: number;
  position: Vec2;
  disposition: Disposition;
  scanned: boolean;
  destroyed: boolean;
  details: string[];
}

const FACTION_LABEL: Record<string, string> = { concord: 'The Agency', directorate: 'Tessarine Directorate', independent: 'Independent' };

export function contactsView(s: WorldState, scenario: ScenarioModule): ContactView[] {
  const h = s.ships.halcyon;
  return (['kestrel', 'cruiser'] as const)
    .filter((id) => s.ships[id].detected)
    .map((id) => {
      const sh = s.ships[id];
      const known = sh.scanLevel > 0;
      return {
        id,
        name: known ? sh.name : `Unidentified ${id === 'cruiser' ? 'warship' : 'vessel'}`,
        classification: known ? sh.classification : 'Unknown configuration',
        faction: known ? (FACTION_LABEL[sh.faction] ?? sh.faction) : 'Unknown',
        range: range(s, 'halcyon', id),
        bearing: Math.round(bearingFrom(h.position, sh.position)),
        relBearing: Math.round(angleDiff(h.heading, bearingFrom(h.position, sh.position))),
        closing: Math.round(-dot(sub(sh.velocity, h.velocity), unit(sub(sh.position, h.position)))),
        speed: Math.round(len(sh.velocity)),
        heading: Math.round(sh.heading) % 360,
        position: sh.position,
        disposition: sh.disposition,
        scanned: sh.scanLevel >= 2,
        destroyed: sh.destroyed,
        details: scenario.contactDetails(s, id),
      };
    });
}

export interface HelmView {
  position: Vec2;
  heading: number;
  speed: number;
  /** Guidance point of the active helm order. */
  goal: Vec2 | null;
  /** Projected track (next three minutes). */
  path: Vec2[];
  border: number | null;
}

export function helmView(s: WorldState): HelmView {
  const h = s.ships.halcyon;
  const active = !!h.nav && !s.outcome && !h.destroyed;
  return {
    position: h.position,
    heading: Math.round(h.heading) % 360,
    speed: Math.round(len(h.velocity)),
    goal: active ? goalPoint(s, 'halcyon') : null,
    path: active ? predictPath(s, 'halcyon') : [h.position],
    border: s.landmarks.border?.y ?? null,
  };
}

export function ordersView(s: WorldState): TrackedOrder[] {
  return visibleOrders(s);
}
