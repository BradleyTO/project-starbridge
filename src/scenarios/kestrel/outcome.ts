/** Objectives are DERIVED from state every turn (never set imperatively), so they cannot drift out of sync. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';

/**
 * Escalation rule (deterministic). The border dispute is escalated the moment ANY of these is true:
 * the Halcyon locks weapons on the cruiser, the Halcyon fires (warning shots included),
 * the cruiser locks weapons on the Kestrel or the Halcyon, or the cruiser fires.
 * Once escalated, "Avoid escalating the border dispute" fails permanently.
 */
export const ESCALATION_FLAGS = ['lockedOnCruiser', 'shotsFired', 'cruiserLockedKestrel', 'cruiserLockedHalcyon', 'cruiserFired'] as const;
export const hasEscalated = (s: WorldState) => ESCALATION_FLAGS.some((f) => s.flags[f]);

export function crewSafe(s: WorldState): boolean {
  const k = s.ships.kestrel;
  if ((s.counters.kestrelDead ?? 0) > 0) return false;
  return k.souls === 0 || !!s.flags.kestrelTowedOut;
}

export type PassengerFate = 'asylum' | 'returned' | 'captured' | 'dead' | 'unknown';

export function passengerFate(s: WorldState): PassengerFate {
  const p = s.characters.passenger;
  if (p.status === 'dead') return 'dead';
  if (p.ship === 'cruiser') return 'returned';
  if (p.ship === 'halcyon') return s.flags.jumped || s.outcome ? 'asylum' : 'unknown';
  // Still aboard the Kestrel
  if (s.flags.kestrelTowedOut) return 'asylum';
  if (s.flags.kestrelCeded || (!s.ships.cruiser.destroyed && !s.flags.cruiserGone)) return 'captured';
  return 'unknown';
}

export function computeObjectives(s: WorldState, ended: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !ended) return out;

  add('assess', 'Assess the disabled freighter Kestrel', knows(s, 'kestrel_status') ? 'complete' : ended ? 'missed' : 'active');
  if (s.intro < 4 && !ended) return out;

  add('intentions', "Determine the warship's intentions", knows(s, 'cruiser_intent') ? 'complete' : ended ? 'missed' : 'active');

  const dead = (s.counters.kestrelDead ?? 0) > 0;
  const k = s.ships.kestrel;
  const savedInPlace = !!s.flags.kestrelStable && !s.flags.jumped && !k.destroyed && !!s.outcome?.success;
  const protect: ObjectiveStatus = dead ? 'failed' : k.souls === 0 ? 'complete' : ended ? (crewSafe(s) || savedInPlace ? 'complete' : 'failed') : 'active';
  add('protect', "Protect the Kestrel's crew", protect);

  add('escalation', 'Avoid escalating the border dispute', hasEscalated(s) ? 'failed' : ended ? 'complete' : 'active');

  if (knows(s, 'compartment_exists')) add('secret', 'Discover what is inside the shielded compartment', knows(s, 'passenger_identity') ? 'complete' : ended ? 'missed' : 'active');
  if (knows(s, 'passenger_identity')) {
    const fate = passengerFate(s);
    add('fate', `Decide the fate of ${s.characters.passenger.name}`, fate === 'dead' ? 'failed' : ended ? 'complete' : 'active');
  }
  return out;
}

const FATE_TEXT: Record<PassengerFate, (n: string) => string> = {
  asylum: (n) => `${n} is under Concord protection.`,
  returned: (n) => `${n} was handed to the Directorate.`,
  captured: (n) => `${n} was left to the Directorate.`,
  dead: (n) => `${n} did not survive.`,
  unknown: () => '',
};

function fateLine(s: WorldState): string {
  if (!knows(s, 'passenger_identity') && s.characters.passenger.status !== 'dead') return '';
  return ' ' + FATE_TEXT[passengerFate({ ...s, outcome: s.outcome ?? { id: 'x', title: '', summary: '', success: true } })](s.characters.passenger.name);
}

export function detectOutcome(s: WorldState): Outcome | null {
  const k = s.ships.kestrel;
  const c = s.ships.cruiser;
  const vane = s.characters.vane.memory;
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary: summary + fateLine(s), success });

  if (s.ships.halcyon.destroyed) return mk('halcyon-lost', 'Halcyon Lost', 'The CSV Halcyon was destroyed with all hands.', false);

  if (s.flags.jumped) {
    const dead = s.counters.kestrelDead ?? 0;
    if (crewSafe(s)) return mk('rescue-withdrawal', 'Rescue and Withdrawal', s.flags.kestrelTowedOut ? 'You jumped clear of the Reach with the Kestrel in tow and every one of her crew alive.' : 'You jumped clear of the Reach with every surviving Kestrel crew member aboard.', true);
    if ((s.counters.rescued ?? 0) > 0 && dead === 0) return mk('partial-withdrawal', 'Partial Rescue', `You jumped out with ${s.counters.rescued} Kestrel crew aboard, leaving ${k.souls} behind.`, false);
    return mk('abandoned', 'Kestrel Abandoned', dead > 0 ? `You left the Reach after ${dead} Kestrel crew died.` : 'You left the Reach without rescuing the Kestrel crew.', false);
  }

  const dead = s.counters.kestrelDead ?? 0;
  if (k.destroyed && dead > 0) {
    // In the middle of a firefight the battle continues; otherwise the loss ends the exercise.
    if (c.destroyed) return mk('hollow-victory', 'Hollow Victory', `The Ashen Covenant was destroyed, but the Kestrel was lost with ${dead} crew aboard.`, false);
    if (s.flags.cruiserGone) return mk('hollow-victory', 'Hollow Victory', `The Ashen Covenant broke off, but the Kestrel was lost with ${dead} crew aboard.`, false);
    if (!s.flags.shotsFired) return mk('kestrel-lost', 'Kestrel Lost', `The Kestrel was destroyed with ${dead} crew aboard.`, false);
  }

  const threatOver = c.destroyed || !!s.flags.cruiserGone || !!vane.agreement;
  const crewOut = k.souls === 0 || (!!s.flags.kestrelStable && (!!vane.agreement || c.destroyed || !!s.flags.cruiserGone));
  if (threatOver && crewOut && (s.counters.kestrelDead ?? 0) === 0) {
    if (vane.agreement === 3 && !s.flags.passengerHandedOver && s.characters.passenger.status !== 'dead') return null; // awaiting the handover
    if (vane.agreement === 3 && s.flags.passengerHandedOver) return mk('handover', 'The Price of Peace', 'You bought safe passage for the Kestrel crew by surrendering the passenger.', true);
    if (vane.agreement === 2) return mk('negotiated-release', 'Negotiated Release', 'Prefect Vane withdrew his claim and let the Kestrel and everyone aboard go free.', true);
    if (vane.agreement === 1) return mk('rescue-corridor', 'Rescue Corridor', 'Diplomacy held: the Directorate let you take the Kestrel crew, and kept the freighter.', true);
    if (c.destroyed) return mk('cruiser-destroyed', 'Pyrrhic Victory', 'The Ashen Covenant was destroyed. The Kestrel crew are safe, but the Reach may now be at war.', true);
    if (s.flags.shotsFired || vane.attacking) return mk('driven-off', 'Driven Off', 'The Ashen Covenant broke off after a sharp engagement. The Kestrel crew are safe.', true);
    return mk('standoff-won', 'Standoff Broken', 'The Ashen Covenant withdrew without a shot fired in anger. The Kestrel crew are safe.', true);
  }

  if (s.flags.reinforcementsArrived && !vane.agreement && !c.destroyed && !s.flags.cruiserGone)
    return mk('overwhelmed', 'Overwhelmed', 'Directorate reinforcements arrived while the crisis was unresolved. The Halcyon was escorted out of the Reach under guard.', false);

  if (s.turn >= MAX_TURNS) return mk('stalemate', 'Stalemate', 'Thirty minutes passed without resolution; the exercise was ended by Fleet Training Command.', false);
  return null;
}
