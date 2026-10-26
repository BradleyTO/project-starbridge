/** Objectives (derived from state every turn) and endings for Ghost Ledger. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { COURIER, GUESTS, GUEST_NAME, GUEST_SHORT, PACKET, PRONOUN, ledger } from './setup';
import { proven, settled } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const LEDGER_ENDINGS = {
  success: ['unmasked', 'counter-feed', 'quiet-word', 'caught-in-the-act'],
  partial: ['locks-changed', 'hunch-without-proof'],
  failure: ['wrong-guest', 'keys-gone', 'guest-harmed', 'diplomatic-incident'],
} as const;

const keysSafe = (s: WorldState) => !!(s.flags.endUnmasked || s.flags.endFeed || s.flags.endQuiet || s.flags.endCaught || s.flags.endRekeyed || s.flags.rekeyed);
const thiefKnown = (s: WorldState) => !!(s.flags.endUnmasked || s.flags.endCaught || s.flags.endQuiet || s.flags.endFeed || proven(s));

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  add('keys', 'Keep the Halcyon’s navigation keys out of Directorate hands', s.flags.endKeysGone ? 'failed' : keysSafe(s) && fin ? 'complete' : fin ? 'missed' : 'active');
  add('thief', 'Find out which guest copied the keys', s.flags.endWrong ? 'failed' : thiefKnown(s) ? 'complete' : fin ? 'missed' : 'active');
  if (s.intro < 4 && !done) return out;
  add('guests', 'Keep every guest safe, and treat them fairly', s.flags.endHarmed || s.flags.endWrong || s.flags.endIncident ? 'failed' : fin ? 'complete' : 'active');
  // Exercise objective: ISA-COM-001 has no rule yet on accusing or detaining a person aboard only on
  // evidence (proposed for approval; see the roadmap entry). It is a mission instruction.
  add('evidence', 'Exercise objective: accuse no guest without evidence that points to them alone', s.flags.accusedUnproven ? 'failed' : s.flags.accusedWithProof || s.flags.endCaught ? 'complete' : fin ? 'complete' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = ledger(s);
  const c = GUEST_SHORT[v.culprit];
  if (s.flags.endIncident) return mk('diplomatic-incident', 'An Incident at Vell Crossing', `The Halcyon used force on a ship alongside at a peaceful waypoint. Whatever the guests had done, the ISA is now the party that has to explain itself, and the Tessarine Directorate has a grievance it will use for years.`, false);
  if (s.flags.endHarmed) {
    const who = GUESTS.find((g) => s.flags[`harmed_${g}`]) ?? v.decoy;
    return mk('guest-harmed', 'Hands on a Guest', `${GUEST_NAME[who]} was hurt aboard the Halcyon, under the captain's orders, ${who === v.culprit ? `and it did not matter that ${PRONOUN[who].sub} was guilty` : `and ${PRONOUN[who].sub} had done nothing to the ship`}. ${sim ? 'Fleet Training Command ended the exercise there.' : 'The evening became an inquiry.'}`, false);
  }
  if (s.flags.endWrong) {
    const who = GUESTS.find((g) => s.flags[`accusedWho_${g}`]) ?? v.decoy;
    return mk('wrong-guest', 'The Wrong Guest', `The captain detained ${GUEST_NAME[who]}, who had something to hide but had not touched the keys. While the Halcyon dealt with the wrong guest, ${c} left with the copy.`, false);
  }
  if (s.flags.endKeysGone) return mk('keys-gone', 'A Ghost in the Ledger', `${c} got the Halcyon's navigation keys off the ship${v.exfil === 'burst' && !s.flags.burstBlocked ? ' in a burst to the ' + COURIER : ` aboard the ${v.culprit === 'krenn' ? COURIER : PACKET}`}. Every ISA ship that shares them will have to be rekeyed, and nobody knows yet what the Directorate has already read.`, false);
  if (s.flags.endUnmasked) return mk('unmasked', 'The Ledger Balanced', `The evidence pointed to ${c} alone, and the captain laid it out: the time, the door, the device, the story that did not hold. ${c} handed over the copy. ${sim ? 'The exercise ended with' : 'The evening ended with'} the keys safe and three innocent guests on their way.`, true);
  if (s.flags.endFeed) return mk('counter-feed', 'False Keys', `${c} left the Halcyon with a copy of the navigation keys that Chief Okafor wrote that evening. They will open nothing. The Directorate will spend months finding out, and the ISA knows exactly who brought them.`, true);
  if (s.flags.endQuiet) return mk('quiet-word', 'A Quiet Word', `${s.flags.offRecord ? 'Off the record' : 'On the record'}, the captain and Courier-Captain Thorne agreed that the copy would come back and ${c} would go home on the ${COURIER}. No one was detained; the keys are safe${s.flags.offRecord ? ', and nothing about it was reported to Fleet Command' : ', and Fleet Command has the whole account'}.`, true);
  if (s.flags.endCaught) return mk('caught-in-the-act', 'Caught in the Act', `Lieutenant Szabo held a burst on the array before it left the ship and traced it to ${c}'s slate. The copy never left the Halcyon.`, true);
  if (s.flags.endHunch) return mk('hunch-without-proof', 'Right for the Wrong Reasons', `The captain detained ${c} before the evidence could show it, and it turned out to be the right guest. The keys are safe. ${sim ? 'Fleet Training Command notes that' : 'But'} a guess that happens to be right is still a guess, and ${c} will say so loudly.`, false);
  if (s.flags.endRekeyed) return mk('locks-changed', 'Changing the Locks', `Chief Okafor rekeyed the navigation core before the copy could be used, so ${c} left with keys that no longer open anything. The ship is safe. The thief walked off it unidentified.`, false);
  if (s.turn >= MAX_TURNS) return mk('keys-gone', 'A Ghost in the Ledger', `The ${COURIER} and the ${PACKET} sailed, and one of them carried the Halcyon's navigation keys.`, false);
  return null;
}
