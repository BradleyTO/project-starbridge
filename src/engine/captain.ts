/**
 * v0.7: how dialogue refers to the captain. The name comes from the captain's profile (set by
 * the app on the WorldState as display data). Formal address uses rank + surname ("Captain
 * Ashby", "Commodore Ashby"); the crew may still say "Captain" casually. Without a name, the
 * rank title alone is used, exactly as before v0.7.
 */
import type { CaptainAddress, WorldState } from './types';
import type { CareerBrief } from '../career/advice';

export const formalOf = (s: WorldState | undefined): string => s?.captain?.formal ?? 'Captain';
export const rankWordOf = (s: WorldState | undefined): string => s?.captain?.rank ?? 'Captain';

/** Stamp the captain's address on a state (no-op when unchanged, so React state stays stable). */
export function withCaptain(s: WorldState, a: CaptainAddress | null): WorldState {
  if (!a) return s;
  const c = s.captain;
  if (c && c.name === a.name && c.formal === a.formal && c.rank === a.rank) return s;
  return { ...s, captain: { name: a.name, formal: a.formal, rank: a.rank } };
}

/** v0.7.1: stamp the Training Record summary the crew and Training Command answer from. */
export function withCareer(s: WorldState, brief: CareerBrief | null): WorldState {
  if (!brief) return s;
  if (s.career && JSON.stringify(s.career) === JSON.stringify(brief)) return s;
  return { ...s, career: brief };
}
