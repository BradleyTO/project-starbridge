/**
 * Timeline contexts and the canonical commit gate.
 *
 * The ONLY way to change canonical data is CanonStore.commit(ctx, …), and the
 * only way to obtain a CanonicalContext is openCanonicalContext(), which
 * requires the Living Universe entitlement. Simulation code only ever holds a
 * SimulationContext, which the gate rejects both at compile time (the types
 * differ) and at run time (contexts are registered in a private WeakSet, so an
 * object literal that merely claims timeline: 'canonical' is refused too).
 */
import type { Entitlements } from './types';

declare const canonicalBrand: unique symbol;
export interface CanonicalContext {
  readonly timeline: 'canonical';
  readonly [canonicalBrand]: true;
}
export interface SimulationContext {
  readonly timeline: 'simulation';
}
export type TimelineContext = CanonicalContext | SimulationContext;

const issued = new WeakSet<object>();

export class TimelineViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimelineViolation';
  }
}

export function openCanonicalContext(ent: Pick<Entitlements, 'livingUniverse'>): CanonicalContext {
  if (!ent.livingUniverse) throw new TimelineViolation('Living Universe is not enabled for this profile.');
  const ctx = Object.freeze({ timeline: 'canonical' as const }) as CanonicalContext;
  issued.add(ctx);
  return ctx;
}

export function simulationContext(): SimulationContext {
  return Object.freeze({ timeline: 'simulation' as const });
}

/** Runtime half of the gate (the type system is the compile-time half). */
export function assertCanonical(ctx: unknown): asserts ctx is CanonicalContext {
  if (!ctx || typeof ctx !== 'object' || (ctx as { timeline?: string }).timeline !== 'canonical' || !issued.has(ctx)) {
    throw new TimelineViolation('Only a canonical session may commit to the canonical timeline.');
  }
}
