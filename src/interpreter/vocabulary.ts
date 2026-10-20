/**
 * v0.6: scenario vocabulary for the offline interpreter. The parser's built-in ship words were
 * written for the Kestrel Incident ("the freighter", "the Prefect"); a scenario adds its own
 * names for the two contact slots through Ship.aliases (see contextFrom). Interpretation is
 * synchronous, so the active vocabulary is set at the start of each interpretSync call.
 */
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface Vocabulary {
  kestrel: string[];
  cruiser: string[];
  /** Words naming the contact-A system an engineering team can fix (e.g. "water recycler"). */
  repair: string[];
}

let current: Vocabulary = { kestrel: [], cruiser: [], repair: [] };
let key = '';
const cache = new Map<string, RegExp>();

export function setVocabulary(v: Partial<Vocabulary> | undefined): void {
  const next = { kestrel: v?.kestrel ?? [], cruiser: v?.cruiser ?? [], repair: v?.repair ?? [] };
  const k = JSON.stringify(next);
  if (k === key) return;
  key = k;
  current = next;
}
export const vocabulary = (): Vocabulary => current;

/** A base reference pattern extended with the active scenario's words for that slot (same match semantics). */
export function withAliases(base: RegExp, slot: 'kestrel' | 'cruiser' | 'repair'): RegExp {
  const words = current[slot];
  if (!words.length) return base;
  const k = `${slot}|${base.source}|${words.join('|')}`;
  let re = cache.get(k);
  if (!re) {
    re = new RegExp(`${base.source}|\\b(?:${[...words].sort((a, b) => b.length - a.length).map(esc).join('|')})\\b`, base.flags);
    cache.set(k, re);
  }
  return re;
}

/** Alternation of the active words for a slot ('' when none), for building larger patterns. */
export function aliasAlternation(slot: 'kestrel' | 'cruiser'): string {
  return [...current[slot]].sort((a, b) => b.length - a.length).map(esc).join('|');
}
