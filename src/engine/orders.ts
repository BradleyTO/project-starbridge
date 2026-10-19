/**
 * Order lifecycle tracking: every order the captain gives becomes a TrackedOrder
 * (acknowledged → underway → completed / failed / impossible / superseded).
 * Instant orders complete on the spot; helm manoeuvres and jump charging progress
 * as simulated time passes.
 */
import type { Department, NavGoal, NavRef, OrderStatus, TrackedOrder, WorldState } from './types';

export const ORDER_HISTORY = 12;
export const ACTIVE: OrderStatus[] = ['acknowledged', 'underway'];

export function addOrder(s: WorldState, dept: Department, label: string, status: OrderStatus, detail = '', etaSeconds: number | null = null): { state: WorldState; id: number } {
  const id = s.orders.nextId;
  const o: TrackedOrder = { id, dept, label, status, issuedTurn: s.turn, updatedTurn: s.turn, etaSeconds, maintaining: false, detail };
  const list = [...s.orders.list, o];
  // Trim old finished orders first; active ones are always kept.
  while (list.length > ORDER_HISTORY) {
    const i = list.findIndex((x) => !isActive(x) && !x.maintaining);
    if (i < 0) break;
    list.splice(i, 1);
  }
  return { state: { ...s, orders: { ...s.orders, list, nextId: id + 1 } }, id };
}

export function updateOrder(s: WorldState, id: number | null | undefined, patch: Partial<Omit<TrackedOrder, 'id'>>): WorldState {
  if (id === null || id === undefined) return s;
  const list = s.orders.list.map((o) => (o.id === id ? { ...o, ...patch, updatedTurn: s.turn } : o));
  return { ...s, orders: { ...s.orders, list } };
}

export function getOrder(s: WorldState, id: number | null | undefined): TrackedOrder | undefined {
  return id === null || id === undefined ? undefined : s.orders.list.find((o) => o.id === id);
}

export function isActive(o: TrackedOrder): boolean {
  return ACTIVE.includes(o.status);
}

/** Orders worth showing: active or maintaining, plus anything resolved this turn. */
export function visibleOrders(s: WorldState): TrackedOrder[] {
  return s.orders.list.filter((o) => isActive(o) || o.maintaining || o.updatedTurn >= s.turn - 1);
}

export function refName(s: WorldState, ref: NavRef | null): string {
  if (!ref) return 'position';
  if (ref === 'border') return 'the Concord border';
  return `the ${s.ships[ref].name}`;
}

/** Short human label for a helm goal ("Interpose: Kestrel ↔ Ashen Covenant"). */
export function goalLabel(s: WorldState, g: Pick<NavGoal, 'intent' | 'target' | 'second' | 'rangeKm'>): string {
  const n = (r: NavRef | null) => refName(s, r).replace(/^the /, '');
  const km = g.rangeKm !== null ? ` @ ${Math.round(g.rangeKm).toLocaleString('en-US')} km` : '';
  switch (g.intent) {
    case 'interpose':
      return `Interpose: ${n(g.target)} ↔ ${n(g.second)}`;
    case 'approach':
      return `Approach ${n(g.target)}${km}`;
    case 'standoff':
      return `Stand off from ${n(g.target)}${km}`;
    case 'intercept':
      return `Intercept ${n(g.target)}`;
    case 'follow':
      return `Shadow ${n(g.target)}${km}`;
    case 'escort':
      return `Escort ${n(g.target)}${km}`;
    case 'block':
      return `Block ${n(g.target)}'s path`;
    case 'retreat':
      return `Retreat from ${n(g.target)}${km}`;
    case 'flee':
      return 'Run for the Concord border';
    case 'orbit':
      return `Orbit ${n(g.target)}${km}`;
    case 'holdStation':
      return g.target ? `Hold station on ${n(g.target)}` : 'Hold position';
    case 'allStop':
      return 'All stop';
    case 'face':
      return g.target ? `Come about to face ${n(g.target)}` : 'Come about';
    case 'evasive':
      return 'Evasive manoeuvres';
  }
}
