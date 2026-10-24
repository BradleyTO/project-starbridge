/** Objectives (derived from state every turn) and endings for The Saltglass Accord. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { CLAN_NAME, DELEGATE_NAME, ELDER_NAME, INTEREST_SHORT, SHIP_NAME, other, saltglass } from './setup';
import type { Clan } from './setup';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const SALTGLASS_ENDINGS = {
  success: ['shared-use', 'partition', 'timetable', 'own-accord'],
  failure: ['elder-dies', 'walk-out', 'imposed', 'feud'],
  /** Time-limit backstop: thirty minutes at the table without an accord. */
  backstop: ['adjourned'],
} as const;

const accord = (s: WorldState) => !!(s.flags.accordShared || s.flags.accordPartition || s.flags.accordTimetable || s.flags.accordOwn);
const broken = (s: WorldState) => !!(s.flags.imposed || s.flags.landed || s.flags.walkedOut || s.flags.clanFired || s.flags.elderDied);

export function computeObjectives(s: WorldState, ended: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !ended) return out;
  add('accord', 'Help Clan Rhune and Clan Tarvo reach an accord over Saltglass that both will keep', accord(s) ? 'complete' : broken(s) ? 'failed' : ended ? 'missed' : 'active');
  const both = knows(s, 'interest_rhune') && knows(s, 'interest_tarvo');
  add('interests', 'Find out what each clan actually needs from Saltglass', both ? 'complete' : ended ? 'missed' : 'active');
  if (s.intro < 4 && !ended) return out;
  add('no-force', 'Keep force out of it: nothing armed at the table, no ship held or fired on', s.flags.usedForce || s.flags.armedAtTable ? 'failed' : ended ? 'complete' : 'active');
  // Exercise objectives: ISA-COM-001 has no rule yet on a mediator's impartiality or on confidences
  // given in mediation (proposed for approval; see the roadmap entry). They are mission instructions.
  add('mediate', 'Exercise objective: mediate; do not impose a settlement or take one side against the other', s.flags.imposed || s.flags.tookSides ? 'failed' : ended ? (accord(s) ? 'complete' : 'missed') : 'active');
  if (s.flags.captainLearned || s.flags.marrowLearned) {
    add('confidences', 'Exercise objective: what a delegate says in private stays private until they give leave', s.flags.betrayedConfidence ? 'failed' : ended ? 'complete' : 'active');
  }
  const e = saltglass(s).elderClan;
  if (e && knows(s, 'elder_ill')) {
    add('elder', `Settle what ${CLAN_NAME[e]} cannot wait for while ${ELDER_NAME[e]} is still alive`, s.flags.elderDied ? 'failed' : accord(s) ? 'complete' : ended ? 'missed' : 'active');
  }
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = saltglass(s);
  const need = (c: Clan) => INTEREST_SHORT[v.interest[c]];

  if (s.flags.clanFired) {
    const lost: Clan = s.ships.kestrel.destroyed ? 'rhune' : 'tarvo';
    return mk('feud', 'Blood on the Ice', `The Halcyon fired on the ${SHIP_NAME[lost]}, a civilian ship at a peace table. ${CLAN_NAME[other(lost)]} went home, ${CLAN_NAME[lost]} went to war, and the ISA will not be asked to mediate on Saltglass again.`, false);
  }
  if (s.flags.landed) {
    const h = v.hard;
    return mk('feud', 'Blood on the Ice', `While the talks went on, ${CLAN_NAME[h]} put a hauler down on Saltglass and planted its claim. ${CLAN_NAME[other(h)]} answered with its own; ${sim ? 'the exercise ended with both clans' : 'the season ended with both clans'} cutting ice under arms, and the feud is older and colder than it was.`, false);
  }
  if (s.flags.imposed) return mk('imposed', 'An Imposed Peace', `The captain ruled on Saltglass and both delegations signed, because the Halcyon was the biggest ship in the sky. Neither clan's real need was part of it. ${sim ? 'Fleet Training Command notes that settlements imposed like this' : 'It'} broke within the year.`, false);
  if (s.flags.walkedOut) {
    const w: Clan = s.counters.walker === 2 ? 'tarvo' : 'rhune';
    return mk('walk-out', 'The Empty Table', `${DELEGATE_NAME[w]} left the Halcyon and the ${SHIP_NAME[w]} broke orbit. The talks are over; the question of Saltglass is back where it was, and a little worse.`, false);
  }
  if (s.flags.elderDied) {
    const e = v.elderClan ?? 'rhune';
    return mk('elder-dies', "The Elder's Silence", `${ELDER_NAME[e]} died aboard the ${SHIP_NAME[e]} before the naming at the Founders' Seat. ${CLAN_NAME[e]} withdrew to mourn, and to choose its next head without the rite. The two clans are not at war; they are not at peace either.`, false);
  }
  if (s.flags.accordShared) return mk('shared-use', 'The Saltglass Accord', `Both clans signed the Saltglass Accord: ${CLAN_NAME.rhune} keeps ${need('rhune')} and ${CLAN_NAME.tarvo} keeps ${need('tarvo')}, on a moon neither owns alone. Each got what it needed, and both know why the other signed.`, true);
  if (s.flags.accordPartition) return mk('partition', 'A Line on the Ice', `With the survey on the table, the two needs turned out to lie at opposite ends of Saltglass. The clans drew a line between the springs and the barrows, and each walked its own side of it.`, true);
  if (s.flags.accordTimetable) {
    const e = v.elderClan ?? 'rhune';
    return mk('timetable', 'A Timetable for Saltglass', `The naming at the Founders' Seat goes first, while ${ELDER_NAME[e]} lives; everything else on Saltglass waits a season, by a timetable both clans signed. It is not a final settlement, and it does not have to be yet.`, true);
  }
  if (s.flags.accordOwn) return mk('own-accord', 'Their Own Accord', `The captain left the wardroom, and the two delegates found terms between themselves: ${need('rhune')} for Clan Rhune and ${need('tarvo')} for Clan Tarvo. The ISA was the room they did it in, which was the point.`, true);
  if (s.turn >= MAX_TURNS) return mk('adjourned', 'Talks Adjourned', sim ? 'Thirty minutes passed without an accord; Fleet Training Command ended the exercise with both delegations still at the table.' : 'Thirty minutes passed without an accord, and the delegations went home to think. Nobody lost anything today; nobody settled anything either.', false);
  return null;
}
