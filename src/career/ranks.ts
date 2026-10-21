/**
 * v0.7 career foundations: ISA operational ranks (PROVISIONAL, approved by Brad for v0.7).
 *
 * The player commands ONE starship at every rank. Promotions come from training, service,
 * judgment and qualifications (never XP or hours), can be accepted, declined or deferred, and
 * never force the captain off a ship they want to keep. Promotion offers arrive in a later phase;
 * v0.7 uses ranks for the data model and for how people address the captain.
 *
 * Admirals exist in the fiction (Admiral Odessa Kaine, ISA Fleet Command) but are NPC-only.
 */
export type RankId = 'captain' | 'senior-captain' | 'commodore' | 'fleet-captain';

export interface Rank {
  id: RankId;
  /** Title used in formal address ("Commodore Morgan"). */
  title: string;
  /** Short insignia description (text only for now). */
  insignia: string;
  /** What the rank means in the ISA. */
  meaning: string;
}

export const RANKS: readonly Rank[] = [
  { id: 'captain', title: 'Captain', insignia: 'one gold bar under a star', meaning: 'Commands one starship.' },
  { id: 'senior-captain', title: 'Senior Captain', insignia: 'two gold bars under a star', meaning: 'A proven captain trusted with independent, long-duration or sensitive operations. Still one ship.' },
  { id: 'commodore', title: 'Commodore', insignia: 'a single silver star', meaning: 'A ship captain who also holds sector authority: may request coordination from other ISA ships, never command them.' },
  { id: 'fleet-captain', title: 'Fleet Captain', insignia: 'two silver stars', meaning: "The ISA's most senior operational rank. Still one ship, with the most consequential assignments." },
];

/** Ranks that exist only for non-player characters. */
export const NPC_ONLY_RANKS = ['Rear Admiral', 'Admiral'] as const;

export const DEFAULT_RANK: RankId = 'captain';

export function rankOf(id: string | undefined | null): Rank {
  return RANKS.find((r) => r.id === id) ?? RANKS[0];
}

export const isRankId = (v: unknown): v is RankId => typeof v === 'string' && RANKS.some((r) => r.id === v);
