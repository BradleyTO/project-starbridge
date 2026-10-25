/** Objectives (derived from state every turn) and endings for Ion Season. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { CAPTAIN_NAME, HAULERS, SHIP_NAME, STATION, ion } from './setup';
import type { Hauler } from './setup';
import { alone, crewLost, shipLeft, stranded, through } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const ION_ENDINGS = {
  success: ['clear-water', 'the-lull', 'steady-hand', 'weathered'],
  partial: ['long-way-round', 'crew-saved'],
  failure: ['hauler-lost', 'dead-in-storm', 'left-in-storm'],
  /** Time-limit backstop: thirty minutes at the edge of the storm without getting through or out. */
  backstop: ['held-in-season'],
} as const;

const anyCrewLost = (s: WorldState) => HAULERS.some((h) => crewLost(s, h));
const anyShipLeft = (s: WorldState) => HAULERS.some((h) => shipLeft(s, h) && !crewLost(s, h));
const ended = (s: WorldState) => !!(s.flags.halcyonDark || s.flags.leftStorm || anyCrewLost(s) || s.flags.turnedBack || (through(s) && !stranded(s)));

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || ended(s);
  const convoyBroken = anyCrewLost(s) || anyShipLeft(s) || !!s.flags.leftStorm || !!s.flags.halcyonDark || !!s.flags.teagueLostAlone;
  add('convoy', `Lead the ${SHIP_NAME.mule} and ${SHIP_NAME.gannet} through the Corrie Drift to ${STATION}`, convoyBroken ? 'failed' : through(s) && !stranded(s) ? 'complete' : fin ? 'missed' : 'active');
  add('crews', 'Bring both hauler crews out of the storm alive', anyCrewLost(s) || s.flags.halcyonDark || s.flags.leftStorm ? 'failed' : fin ? 'complete' : 'active');
  if (s.intro < 4 && !done) return out;
  add('halcyon', "Keep the Halcyon's own charge short of the point where she goes dark", s.flags.halcyonDark ? 'failed' : fin ? 'complete' : 'active');
  // Exercise objective: ISA-COM-001 has no rule on acting when a civilian master under escort is
  // unfit to command in a hazard (proposed for approval; see the roadmap entry). It is a mission instruction.
  if (ion(s).unfit !== 'none' && (knows(s, 'unfit') || knows(s, 'drift'))) {
    add('fitness', 'Exercise objective: everyone at a helm in the convoy is fit to fly the Maw', s.flags.unfitAtMaw ? 'failed' : s.flags.steadyAtMaw ? 'complete' : fin ? 'missed' : 'active');
  }
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const lostList = HAULERS.filter((h) => crewLost(s, h));
  const lostNames = lostList.map((h: Hauler) => `the ${SHIP_NAME[h]}`).join(' and ');

  if (s.flags.halcyonDark) return mk('dead-in-storm', 'Dead in the Storm', `The charge the Halcyon carried for everyone else finally came home: her systems went dark at the edge of the storm, and the convoy sat in the static with nobody to lead it. ${sim ? 'Fleet Training Command ended the exercise there.' : 'The Hesper Deep tug found them all eleven hours later.'}`, false);
  if (s.flags.leftStorm && !through(s)) return mk('left-in-storm', 'Left in the Storm', `The Halcyon left the Corrie Drift and the convoy did not. Two hauler crews were left at the edge of the ion storm without the only ship that could see the way through.`, false);
  if (lostList.length) {
    const alone = s.flags.teagueLostAlone && lostList.length === 1 && lostList[0] === 'gannet';
    return mk('hauler-lost', 'A Hauler Lost', alone ? `${CAPTAIN_NAME.gannet} ran her own line through the storm, and ${SHIP_NAME.gannet} went dark in it with everyone aboard. The convoy had stopped being a convoy some time before that.` : `${lostNames[0].toUpperCase()}${lostNames.slice(1)} went dark in the storm and nobody got to the crew in time. ${sim ? 'The exercise ended there.' : 'The season closed over them.'}`, false);
  }
  if (s.flags.turnedBack) {
    if (anyShipLeft(s)) return mk('crew-saved', 'Crews Saved', `The convoy turned back out of the storm. Every crew is alive, but a hauler was left dark in the Corrie Drift, and ${STATION} will go a month short.`, false);
    return mk('long-way-round', 'The Long Way Round', `The captain turned the convoy back out of the storm with every ship and every crew. ${STATION} will go short until the season reopens; the haulers will try again, with the Halcyon or without her.`, false);
  }
  if (stranded(s)) return null;
  if (through(s)) {
    if (anyShipLeft(s)) return mk('crew-saved', 'Crews Saved', `The Halcyon came out of the Maw at ${STATION} with every crew alive, and one hauler fewer than she went in with. The ore in the abandoned hold will sit in the storm until spring.`, false);
    if (s.flags.lullCrossed && !s.flags.lostTheLine) return mk('the-lull', 'The Lull', `In the middle of a spate, the Maw went slack for a minute, and the helm felt it. The convoy went through the gap and came out at ${STATION} with the season closing behind it.`, true);
    if (s.flags.steadyAtMaw && s.flags.foundUnfit) return mk('steady-hand', 'A Steady Hand', `A master who should not have been flying the Maw did not have to. The convoy came through to ${STATION} together, and nobody had to say why.`, true);
    if (s.flags.roughTaken || s.flags.lostTheLine || s.flags.anyAdrift || alone(s) || s.flags.towedAny) return mk('weathered', 'Weathered Through', `Everyone made ${STATION}, not by the way anyone would have chosen. ${alone(s) ? `${CAPTAIN_NAME.gannet} came through on her own line, which is luck, not leadership. ` : ''}The hulls will crackle for a week.`, true);
    return mk('clear-water', 'Clear Water', `Three bands, three calm channels. The convoy came through the Corrie Drift to ${STATION} as if the storm were not there, which is what good weather work looks like from the outside.`, true);
  }
  if (s.turn >= MAX_TURNS) return mk('held-in-season', 'Held in the Season', sim ? `Thirty minutes passed at the edge of the storm without a crossing or a retreat; Fleet Training Command ended the exercise with the convoy still waiting.` : `Thirty minutes passed at the edge of the storm, and the season closed while the convoy waited.`, false);
  return null;
}
