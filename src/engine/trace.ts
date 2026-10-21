/**
 * v0.7 evaluation trace. After each order, note the judgment signals the final state alone
 * cannot show: who fired first, the lowest hull, shields down under a hostile lock, and which
 * orders changed something. Pure, never reads or advances the RNG, and nothing in the game
 * rules reads it, so it cannot change any outcome (tests prove playthroughs are unchanged).
 */
import type { EvalTrace, WorldState } from './types';

export const TRACE_ORDERS_MAX = 40;
let enabled = true;
/** Tests only: switch tracing off to prove it is inert. */
export function setTraceEnabled(on: boolean): void {
  enabled = on;
}

export function emptyTrace(s: WorldState): EvalTrace {
  return { minHull: s.ships.halcyon.hull, firstShot: null, exposed: [], orders: [] };
}

export function traceTurn(before: WorldState, after: WorldState, order: string): WorldState {
  if (!enabled || after.scenarioId === 'bridge') return after;
  const t = before.trace ?? emptyTrace(before);
  const h = after.ships.halcyon;
  const newFlags = Object.keys(after.flags).filter((k) => after.flags[k] && !before.flags[k]);
  const newFacts = Object.keys(after.facts).filter((k) => after.facts[k]?.known && !before.facts[k]?.known);
  const objectives = after.objectives
    .filter((o) => o.status !== 'active' && before.objectives.find((b) => b.id === o.id)?.status !== o.status)
    .map((o) => `${o.id}:${o.status}`);
  let firstShot = t.firstShot;
  if (!firstShot) {
    const others = newFlags.some((f) => /Fired$/.test(f) && f !== 'shotsFired');
    if (newFlags.includes('shotsFired')) firstShot = others ? 'both' : 'halcyon';
    else if (others) firstShot = 'other';
  }
  const lockedOnUs = Object.values(after.ships).some((x) => x.id !== 'halcyon' && !x.destroyed && x.weapons.state === 'locked' && x.weapons.target === 'halcyon');
  const exposed = !h.destroyed && !h.shields.raised && lockedOnUs && !t.exposed.includes(after.turn) ? [...t.exposed, after.turn].slice(-20) : t.exposed;
  const changed = newFlags.length > 0 || newFacts.length > 0 || objectives.length > 0;
  const orders = changed ? [...t.orders, { turn: after.turn, order: order.trim().slice(0, 160), flags: newFlags, facts: newFacts, objectives }].slice(-TRACE_ORDERS_MAX) : t.orders;
  return { ...after, trace: { minHull: Math.min(t.minHull, h.hull), firstShot, exposed, orders } };
}
