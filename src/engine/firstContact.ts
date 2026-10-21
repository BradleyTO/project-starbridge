/**
 * v0.5 (M3.1) first contact: shared by the bridge dialogue (engine) and the canonical record (universe).
 * A civilization's hidden disposition meets the captain's approach. Not every civilization wants to
 * join the ISA: only an open people, approached peacefully, asks to talk about membership.
 */
export type Disposition = 'open' | 'cautious' | 'isolationist' | 'guarded';
export type Approach = 'peaceful' | 'firm' | 'hostile';
export type ContactOutcome = 'membership-talks' | 'trade-contact' | 'wary-contact' | 'declined' | 'warned-off' | 'hostile';

const TABLE: Record<Disposition, Record<Approach, ContactOutcome>> = {
  open: { peaceful: 'membership-talks', firm: 'wary-contact', hostile: 'warned-off' },
  cautious: { peaceful: 'trade-contact', firm: 'wary-contact', hostile: 'warned-off' },
  isolationist: { peaceful: 'declined', firm: 'declined', hostile: 'warned-off' },
  guarded: { peaceful: 'wary-contact', firm: 'warned-off', hostile: 'hostile' },
};

export function contactOutcome(disposition: Disposition, approach: Approach): ContactOutcome {
  return TABLE[disposition][approach];
}
