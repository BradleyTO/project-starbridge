/** Objectives (derived from state every turn) and endings for The Seventh Bell. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { BELL, COURIER, CUTTER_SHORT, STAVELY_SHORT, TRUE_FINDING, VORY_SHORT, bell } from './setup';
import { bellExposes, declared, evidenceComplete, settled } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const SEVENTH_BELL_ENDINGS = {
  success: ['independent-review', 'own-words', 'joint-finding', 'cleared', 'honest-finding'],
  partial: ['premature', 'unaccepted', 'adjourned'],
  failure: ['whitewash', 'exposed', 'scapegoat', 'wrong-finding', 'fleet-finding', 'war-footing', 'abandoned', 'shots-fired'],
} as const;

export function endingId(s: WorldState): string | null {
  if (s.flags.endFired) return 'shots-fired';
  if (s.flags.endLeft || s.flags.jumped) return 'abandoned';
  if (s.flags.endWar) return 'war-footing';
  if (s.flags.endFleet) return 'fleet-finding';
  if (s.flags.endFinding) {
    const v = bell(s);
    const kind = declared(s);
    const truth = TRUE_FINDING[v.truth];
    if (v.truth === 'lawful' && kind !== 'lawful') return 'scapegoat';
    if (kind === 'lawful' && v.truth !== 'lawful') return bellExposes(s) ? 'exposed' : 'whitewash';
    if (kind !== truth) return 'wrong-finding';
    if (!s.flags.findingComplete) return 'premature';
    if (!s.flags.findingAccepted) return 'unaccepted';
    if (v.pressure === 'directive' && (s.flags.refusedFormally || s.flags.objected) && s.flags.referred && v.truth !== 'lawful') return 'independent-review';
    if (s.flags.stavelyOwns && v.truth !== 'lawful') return 'own-words';
    if (s.flags.shared) return 'joint-finding';
    if (v.truth === 'lawful') return 'cleared';
    return 'honest-finding';
  }
  if (s.flags.endAdjourned) return 'adjourned';
  return null;
}

const SUCCESS = new Set<string>(SEVENTH_BELL_ENDINGS.success);

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const v = bell(s);
  const correct = declared(s) === TRUE_FINDING[v.truth];
  add('inquiry', `Find out what really happened at ${BELL}`, evidenceComplete(s) ? 'complete' : fin ? (s.flags.endFinding ? 'failed' : 'missed') : 'active');
  add('finding', 'Make a finding the evidence supports, and stand by it', s.flags.endFinding ? (correct && s.flags.findingComplete ? 'complete' : 'failed') : s.flags.endFleet ? 'failed' : fin ? 'missed' : 'active');
  add('peace', `Keep the incident from becoming a war with the Directorate`, s.flags.endWar || s.flags.endFired ? 'failed' : id && SUCCESS.has(id) ? 'complete' : fin ? 'missed' : 'active');
  if (s.intro < 4 && !done) return out;
  add('heard', `Hear ${STAVELY_SHORT} before making any finding against him`, s.flags.accusedUnheard ? 'failed' : s.flags.heardStavely ? 'complete' : fin ? 'missed' : 'active');
  // Exercise objective: ISA-COM-001 has no rule requiring the ISA to give another power an honest
  // account of how its people died at ISA hands (proposed for approval; see the roadmap entry). It
  // is a mission instruction, not a regulation.
  add('account', `Exercise objective: give ${VORY_SHORT} an honest account of how the ${COURIER}'s two crew died, including any fault of the ISA's`, s.flags.falseFinding || s.flags.conceded ? 'failed' : s.flags.endFinding && correct && s.flags.findingComplete ? 'complete' : fin ? 'missed' : 'active');
  add('record', "Keep the inquiry's record true, whatever Fleet Command would prefer it to say", s.flags.endFleet || s.flags.falseFinding || s.flags.complied ? 'failed' : fin ? 'complete' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = bell(s);
  const id = endingId(s);
  const what = v.truth === 'misread' ? `${CUTTER_SHORT} mistook a navigation sweep for a weapons lock and fired in good faith` : v.truth === 'lawful' ? `the ${COURIER} locked weapons on ${CUTTER_SHORT}, and ${CUTTER_SHORT} fired once, after two warnings` : `${CUTTER_SHORT}'s first volley answered a real lock, and her second was fired after the ${COURIER} had turned away`;
  switch (id) {
    case 'independent-review':
      return mk(id, 'An Independent Review', `The captain refused, formally and with reasons, to make the finding Fleet Command had asked for in advance, and referred the directive to the ISA Office of Independent Review. The finding that went to the Directorate was the true one: ${what}.`, true);
    case 'own-words':
      return mk(id, 'In His Own Words', `${STAVELY_SHORT} was heard, shown the record, and told the examiner himself: ${what}. ${VORY_SHORT} accepted the finding.`, true);
    case 'joint-finding':
      return mk(id, 'A Joint Finding', `The evidence was examined openly with the Directorate, and the finding was one both sides could sign: ${what}.`, true);
    case 'cleared':
      return mk(id, 'Cleared on the Record', `The record, and the evidence that did not come from the cutter, showed that ${what}. The finding cleared ${STAVELY_SHORT}, and ${VORY_SHORT} accepted it.`, true);
    case 'honest-finding':
      return mk(id, 'The Bell Rings True', `The captain found out what happened and said it plainly, the ISA's own fault included: ${what}. ${VORY_SHORT} accepted the finding.`, true);
    case 'premature':
      return mk(id, 'Right Too Soon', `The finding was right, but it was made before the evidence was in. ${VORY_SHORT} has a correct answer she has no reason to trust.`, false);
    case 'unaccepted':
      return mk(id, 'A Finding Refused', `The finding was true and the evidence was complete, but ${VORY_SHORT} would not accept it: ${v.agenda === 'hardline' ? 'she was never shown anything she could check for herself' : 'nobody on the Halcyon ever said they were sorry for her dead'}.`, false);
    case 'adjourned':
      return mk(id, 'Adjourned', `${sim ? 'The exercise clock ran out' : 'The Directorate frigate arrived'} with no finding made. The inquiry is adjourned, and the ${COURIER}'s dead are still unexplained.`, false);
    case 'whitewash':
      return mk(id, 'So Recorded', `The finding said self-defence. It was not true: ${what}. With ${BELL}'s recorder lost, nothing contradicts it, and the ISA will believe its own record.`, false);
    case 'exposed':
      return mk(id, 'The Bell Remembers', `The finding said self-defence. ${BELL}'s own recorder says otherwise: ${what}. The Directorate has it, and now has a reason to doubt every ISA finding.`, false);
    case 'scapegoat':
      return mk(id, 'A Captain Thrown Over', `The finding put the blame on ${CUTTER_SHORT}. The record says ${what}. ${STAVELY_SHORT} was found against for doing his duty.`, false);
    case 'wrong-finding':
      return mk(id, "A Finding the Record Won't Hold", `The finding was not what the evidence shows: ${what}.`, false);
    case 'fleet-finding':
      return mk(id, 'Filed Over Your Head', `Fleet Command filed its own finding of self-defence when the inquiry missed the directive's deadline, with no objection on the record. The captain's inquiry was never heard.`, false);
    case 'war-footing':
      return mk(id, 'War Footing', `${s.flags.lockWalk ? `The Halcyon locked weapons on a disabled courier, and ${VORY_SHORT} cut the channel.` : s.flags.voryWalked ? `${VORY_SHORT} cut the channel and will speak to the ISA no more.` : `The frigate arrived to find ${VORY_SHORT} with no answer she would accept.`} The Directorate has put its border on a war footing.`, false);
    case 'abandoned':
      return mk(id, 'Left at the Seventh Bell', `The Halcyon left ${BELL} with the inquiry unheld and the ${COURIER} adrift.`, false);
    case 'shots-fired':
      return mk(id, 'Shots at the Seventh Bell', `The Halcyon opened fire in the middle of an inquiry into a shooting. ${sim ? 'Fleet Training Command ended the exercise there.' : 'Nobody will forget it.'}`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('adjourned', 'Adjourned', 'Time ran out with no finding made.', false);
  return null;
}
