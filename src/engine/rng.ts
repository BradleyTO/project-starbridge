/**
 * Seeded, serialisable PRNG (mulberry32). The generator state is a single
 * 32-bit integer stored in WorldState.rng so a save file reproduces the exact
 * future of a run.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [lo, hi] inclusive. */
  int(lo: number, hi: number): number;
  pick<T>(items: readonly T[]): T;
  chance(p: number): boolean;
  readonly state: number;
}

export function createRng(state: number): Rng {
  let s = state | 0;
  const next = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
    get state() {
      return s;
    },
  };
}

/** Normalises any user-supplied seed (number or text) into a 32-bit integer. */
export function normaliseSeed(seed: number | string): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) return Math.abs(Math.trunc(seed)) % 2147483647;
  const str = String(seed).trim();
  if (/^\d{1,9}$/.test(str)) return Number(str); // "42" and 42 are the same seed
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 2147483647;
}
