/**
 * v0.7: how dialogue refers to the captain. The name comes from the captain's profile (set by
 * the app on the WorldState as display data). Formal address uses rank + surname ("Captain
 * Ashby", "Commodore Ashby"); the crew may still say "Captain" casually. Without a name, the
 * rank title alone is used, exactly as before v0.7.
 */
import type { CaptainAddress, WorldState } from './types';

export const formalOf = (s: WorldState | undefined): string => s?.captain?.formal ?? 'Captain';
export const rankWordOf = (s: WorldState | undefined): string => s?.captain?.rank ?? 'Captain';

/** Stamp the captain's address on a state (no-op when unchanged, so React state stays stable). */
export function withCaptain(s: WorldState, a: CaptainAddress | null): WorldState {
  if (!a) return s;
  const c = s.captain;
  if (c && c.name === a.name && c.formal === a.formal && c.rank === a.rank) return s;
  return { ...s, captain: { name: a.name, formal: a.formal, rank: a.rank } };
}
