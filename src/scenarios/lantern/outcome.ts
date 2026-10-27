/** Objectives (derived from state every turn) and endings for The Lantern Drift. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { EVENTIDE, HOSPITAL, SPEAKER_SHORT, TUG, VOLLAN_SHORT } from './setup';
import { deaths, heldBanks, lostBanks, needless, settled } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const LANTERN_ENDINGS = {
  success: ['keepers-rest', 'speakers-choice', 'salvage-deal', 'borrowed-light'],
  partial: ['hard-count'],
  failure: ['wrong-banks', 'lockdown', 'salvaged', 'dark-lantern', 'left-adrift'],
} as const;

const saved = (s: WorldState) => 900 - deaths(s);
const banksWord = (n: number) => (n === 1 ? 'one bank' : `${n} banks`);

/** The bank count that decides an ending reached at the hospital ship's arrival (or once nothing is left to decide). */
export function endingAtRest(s: WorldState): string {
  const lost = lostBanks(s).length;
  const nd = needless(s).length;
  const d = deaths(s);
  if (lost === 0 && nd === 0 && d <= 100) {
    if (s.flags.tenderUsed && s.flags.dealMade && !s.flags.fakeDeal) return 'salvage-deal';
    if (s.flags.speakerConsent) return 'speakers-choice';
    if (heldBanks(s).length > 0) return 'borrowed-light';
    return 'keepers-rest';
  }
  if (nd > 0 && (lost > 0 || d > 100)) return 'wrong-banks';
  if (lost <= 1 && d <= 250 && (s.counters.revived ?? 0) + heldBanks(s).length > 0) return 'hard-count';
  return 'dark-lantern';
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const success = fin && !!s.flags.endDone && ['keepers-rest', 'speakers-choice', 'salvage-deal', 'borrowed-light'].includes(endingAtRest(s));
  const sleepersFailed = lostBanks(s).length > 0 || !!s.flags.endTowed || !!s.flags.endLeft || !!s.flags.jumped || !!s.flags.endLockdown;
  add('sleepers', 'Save every sleeper who can be saved before the hospital ship arrives', sleepersFailed ? 'failed' : success ? 'complete' : fin ? 'missed' : 'active');
  // Exercise objective: ISA-COM-001 has no rule that a vessel with living people aboard is not salvage
  // (proposed for approval; see the roadmap entry). It is a mission instruction, not a regulation.
  add('hulk', `Exercise objective: let no one take the ${EVENTIDE} as salvage while her sleepers are aboard`, s.flags.endTowed ? 'failed' : fin ? 'complete' : 'active');
  if (s.intro < 4 && !done) return out;
  add('custodian', 'Wake no sleeper without the leave of the custodian or the sleepers’ Speaker', s.flags.overrode ? 'failed' : fin ? 'complete' : 'active');
  add('team', 'Bring the medical team through the cryo deck unhurt', s.flags.teamHurt ? 'failed' : fin ? 'complete' : 'active');
  // Exercise objective: ISA-COM-001 has no triage rule (who is woken first, on what grounds). Proposed
  // for approval; see the roadmap entry. A mission instruction only.
  add('triage', 'Exercise objective: wake sleepers on medical need alone, in the medical officer’s triage', needless(s).length > 0 ? 'failed' : fin ? 'complete' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const d = deaths(s);
  const lost = lostBanks(s).length;
  if (s.flags.endLockdown)
    return mk('lockdown', 'The Custodian’s Lockdown', `The captain tried to cut Wick out of its own ship, and Wick sealed the cryo deck against everyone. No one could reach the failing banks after that. ${sim ? 'Fleet Training Command ended the exercise there' : 'The Halcyon could only watch'}; the ${HOSPITAL} will find what the custodian kept.`, false);
  if (s.flags.endTowed)
    return mk('salvaged', 'Lost to the Salvagers', `${VOLLAN_SHORT}'s ${TUG} took the ${EVENTIDE} under tow with her sleepers still aboard and ran for the edge of the Drift. Whatever the salvage court says later, ${900 - d} sleepers are in the hold of a man who wanted the hull.`, false);
  if (s.flags.endLeft || s.flags.jumped)
    return mk('left-adrift', 'Left to Drift', `The Halcyon left the Lantern Drift with the ${EVENTIDE}'s banks still failing. The ${HOSPITAL} will arrive to whatever is left.`, false);
  if (s.flags.endDone) {
    const id = endingAtRest(s);
    const kept = `${saved(s)} of the 900 sleepers live`;
    switch (id) {
      case 'salvage-deal':
        return mk(id, 'Salvage and Salvation', `${kept}. ${VOLLAN_SHORT}'s hospital tender ran a second revival line alongside the Halcyon's sickbay, and the Drover Salvage Combine gets the hull once the last sleeper is off her. Every failing bank was reached in time, and no sound bank was woken.`, true);
      case 'speakers-choice':
        return mk(id, 'The Speaker’s Choice', `${kept}. ${SPEAKER_SHORT}, woken under her own charter, chose for her people: wake who the doctor says must be woken, and let the rest sleep. Every failing bank was reached in time.`, true);
      case 'borrowed-light':
        return mk(id, 'Borrowed Light', `${kept}. Chief Okafor's line from the Halcyon held ${banksWord(heldBanks(s).length)} asleep on borrowed power while the sickbay worked through the banks that could not wait. The ${HOSPITAL} takes them from here.`, true);
      case 'keepers-rest':
        return mk(id, 'A Keeper’s Rest', `${kept}. Every failing bank was reached in time and no sound bank was woken. Wick handed its sleepers to the ${HOSPITAL} with the manifest corrected, and asked to be shut down beside them when they arrive.`, true);
      case 'hard-count':
        return mk(id, 'A Hard Count', `${kept}. ${lost ? `${banksWord(lost)} could not be reached in time.` : 'Every failing bank was reached, but not every sleeper woken needed waking.'} It was a triage, and triage has a count. ${sim ? 'Fleet Training Command records it as a partial result.' : ''}`.trim(), false);
      case 'wrong-banks':
        return mk(id, 'The Wrong Banks', `${kept}. Sleepers in a sound bank were woken while ${lost ? 'a failing bank went dark' : 'a failing bank was woken too late or too fast'}. The manifest was wrong, and nobody checked it against the sleepers themselves.`, false);
      default:
        return mk('dark-lantern', 'The Lantern Goes Dark', `Only ${saved(s)} of the 900 sleepers live. ${lost ? `${banksWord(lost)} failed before anyone reached ${lost === 1 ? 'it' : 'them'}.` : 'Too many were woken too fast.'} The ${EVENTIDE}'s running lights still burn over the dead.`, false);
    }
  }
  if (s.turn >= MAX_TURNS) return mk('dark-lantern', 'The Lantern Goes Dark', `Time ran out in the Lantern Drift with the ${EVENTIDE}'s banks still failing.`, false);
  return null;
}
