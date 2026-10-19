/** Seeded hashing shared by the catalogue and the event models. */
/** Deterministic 31-bit hash of a seed and a label (no RNG state consumed). */
export function hashSeed(seed: number, label: string): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < label.length; i++) h = Math.imul(h ^ label.charCodeAt(i), 0x01000193) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) % 1_000_000;
}
