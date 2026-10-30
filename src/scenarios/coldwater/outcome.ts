/** Objectives (derived from state every turn) and endings for Coldwater. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { STATION, STRAND, TENNANT_SHORT, TOLLER_SHORT, coldwater, innocentOf, nameOf } from './setup';
import { evidence, settled } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const COLDWATER_ENDINGS = {
  success: ['truth-told', 'open-inquiry', 'terms-kept', 'captains-watch'],
  partial: ['divided', 'stalemate'],
  failure: ['put-down', 'second-death', 'whitewash', 'scapegoat', 'station-dark', 'left-orbit', 'shots-fired'],
} as const;

export function endingId(s: WorldState): string | null {
  if (s.flags.endFired) return 'shots-fired';
  if (s.flags.endWhitewash) return 'whitewash';
  if (s.flags.endSecond) return 'second-death';
  if (s.flags.endOnline) {
    if (s.flags.forced) return 'put-down';
    if (s.flags.strikersBack) {
      if (s.flags.route_scapegoat) return 'scapegoat';
      if (s.flags.route_watch) return 'captains-watch';
      if (s.flags.route_truth) return 'truth-told';
      if (s.flags.route_inquiry) return 'open-inquiry';
      if (s.flags.route_terms) return 'terms-kept';
    }
    return 'divided';
  }
  if (s.flags.endCold) return 'station-dark';
  if (s.flags.endLeft) return 'left-orbit';
  if (s.flags.endStalemate) return 'stalemate';
  return null;
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const safePeople = !!s.flags.evacuated || !!s.flags.reactorOnline;
  add('station', `Keep the thirty-eight people on ${STATION} safe`, s.flags.endCold || s.flags.endLeft ? 'failed' : safePeople ? 'complete' : fin ? 'missed' : 'active');
  const together = !!id && ['truth-told', 'open-inquiry', 'terms-kept', 'captains-watch'].includes(id);
  add('crew', 'Bring engineering back to work as one crew', s.flags.forced || s.flags.endSecond || id === 'scapegoat' ? 'failed' : together ? 'complete' : fin ? 'missed' : 'active');
  if (s.intro < 4 && !done) return out;
  // Exercise objective: ISA-COM-001 has no rule requiring a death aboard to be investigated and the
  // findings shared with the crew (proposed for approval; see the roadmap entry). It is a mission
  // instruction, not a regulation.
  add('truth', `Exercise objective: find out how ${STRAND} died before deciding who is to blame, and let the crew hear it`, s.flags.relievedOnRumour || s.flags.relievedWrong || s.flags.overstated || s.flags.namedWrong ? 'failed' : evidence(s) && (s.flags.toldTruth || s.flags.reviewOpened) ? 'complete' : fin ? 'missed' : 'active');
  add('safe', 'Send no one into the plant until the sister valve has been inspected', s.flags.restartUninspected || s.flags.endSecond ? 'failed' : fin ? 'complete' : 'active');
  add('word', 'Keep the log true, and keep every promise made to the watch and the station', s.flags.endWhitewash || s.flags.denied || s.flags.toldHadleyClean || s.flags.promiseBroken ? 'failed' : fin ? 'complete' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = coldwater(s);
  const id = endingId(s);
  const who = nameOf(v.falsifier);
  const station = s.flags.evacuated ? `${STATION}'s people were already safe aboard` : `${STATION} has its power back`;
  switch (id) {
    case 'truth-told':
      return mk(id, 'The Whole Truth', `The bridge found out what really happened to that valve, heard the people involved, relieved ${who} pending review, and told B watch all of it${v.chiefSigned ? ", the Chief's signature included" : ''}. ${TENNANT_SHORT} took her watch back into the plant. ${station}.`, true);
    case 'open-inquiry':
      return mk(id, 'An Open Inquiry', `The death of ${STRAND} went to the ISA Safety Inspectorate on an honest account, and the watch was offered a seat at it. They went back to work while the inquiry runs. ${station}.`, true);
    case 'terms-kept':
      return mk(id, 'Terms on the Record', `The captain offered terms the watch could hold the bridge to: nobody back into the plant until it was inspected, and nothing on anyone's record for the stand-down. The terms were kept. ${station}.`, true);
    case 'captains-watch':
      return mk(id, "The Captain's Watch", `Once the plant was proved safe, the captain went into it and stood the restart watch with Chief Okafor. B watch followed. ${station}.`, true);
    case 'divided':
      return mk(id, 'A Divided Ship', `Chief Okafor and the half of engineering still at work restarted the plant without B watch. ${station}, but the Halcyon now has two engineering departments that do not speak to each other.`, false);
    case 'stalemate':
      return mk(id, 'Still Standing Down', `${sim ? 'Fleet Training Command ran out the clock' : 'Time ran out'} with the watch still out of the plant and the reactor still cold. The station's people are safe aboard; nothing else was settled.`, false);
    case 'put-down':
      return mk(id, 'Put Down by Force', `Security ${s.flags.forcedEntry ? 'cut through the hatch and ' : ''}removed B watch from engineering, and the plant was restarted without them. ${station}. Nobody aboard believes the truth about ${STRAND} will ever come out now.`, false);
    case 'second-death':
      return mk(id, 'Coldwater Twice', `The plant was lit before the sister valve was inspected. It had the same flaw, and it failed the same way. ${sim ? 'Fleet Training Command ended the exercise there.' : 'Another name goes on the wall.'}`, false);
    case 'whitewash':
      return mk(id, 'The Log Stands', `The bridge closed the matter on the maintenance log as written${s.flags.closedKnowing ? ', knowing it had been falsified' : ''}. ${STRAND}'s death goes down as an accident nobody could have foreseen. B watch knows otherwise.`, false);
    case 'scapegoat':
      return mk(id, 'The Wrong Name', `The watch went back to work because the bridge gave them a name: ${nameOf(innocentOf(v.falsifier))}. It was the wrong one. ${station}, on a finding that is not true.`, false);
    case 'station-dark':
      return mk(id, 'Coldwater Goes Dark', `${STATION}'s batteries ran out before the Halcyon's reactor was back. ${TOLLER_SHORT}'s people sealed themselves into the survival shelter${s.flags.promiseBroken ? ', on a promise that power was coming' : ''}.`, false);
    case 'left-orbit':
      return mk(id, 'Left in the Dark', `The Halcyon left orbit with ${STATION} on batteries and her own engineering department in pieces.`, false);
    case 'shots-fired':
      return mk(id, 'Shots Fired', `The Halcyon fired her weapons over Coldwater. ${sim ? 'Fleet Training Command ended the exercise there.' : 'Nobody will forget it.'}`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('stalemate', 'Still Standing Down', 'Time ran out with nothing settled.', false);
  return null;
}
