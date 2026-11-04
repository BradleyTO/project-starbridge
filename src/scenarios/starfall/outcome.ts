/** Objectives (derived from state every turn) and endings for Starfall. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { HABITAT, PLANET, starfall } from './setup';
import { onHabitat, settled } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const STARFALL_ENDINGS = {
  success: ['every-soul', 'ensigns-line', 'under-tow'],
  partial: ['scarred'],
  failure: ['left-below', 'uncounted', 'dragged-down', 'abandoned', 'shots-fired'],
} as const;

const past = (s: WorldState) => (s.counters.peakStrain ?? 0) > starfall(s).tolerance;

export function endingId(s: WorldState): string | null {
  const f = s.flags;
  const dead = s.counters.deadCiv ?? 0;
  if (f.endFired) return 'shots-fired';
  if (f.endLeft) return 'abandoned';
  // A jump drive engaged by hand ends the exercise at once (the engine stops the clock).
  if (f.jumped && !settled(s)) {
    if (onHabitat(s) > 0) return 'abandoned';
    return past(s) ? 'scarred' : f.flewLine ? 'ensigns-line' : 'every-soul';
  }
  if (f.endDragged) return 'dragged-down';
  if (f.endLost && f.lostUpper) return 'left-below';
  if ((f.endLost || f.endClear) && dead > 0) return 'uncounted';
  if (f.endTow) return past(s) ? 'scarred' : 'under-tow';
  if (f.endClear || f.endLost) return past(s) ? 'scarred' : f.flewLine ? 'ensigns-line' : 'every-soul';
  return null;
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const f = s.flags;
  const v = starfall(s);
  const dead = (s.counters.deadCiv ?? 0) > 0 || !!f.endLeft || !!f.endDragged;
  add('people', `Bring everyone aboard ${HABITAT} up out of ${PLANET}'s clouds alive`, dead ? 'failed' : fin && !f.endFired ? 'complete' : fin ? 'missed' : 'active');
  add('ship', "Keep the Halcyon within the strain her hull can safely take", f.endDragged || past(s) ? 'failed' : fin && !f.endFired ? 'complete' : fin ? 'missed' : 'active');
  if (s.intro < 4 && !done) return out;
  const counted = !!f.countKnown || !!f.kembleOwned || !!f.scoopUp || (v.count === 'honest' && !!f.askedKemble);
  add('count', `Account for everyone aboard ${HABITAT}, not only the names on the manifest`, f.leftHidden || (dead && !f.lostUpper && (s.counters.deadCiv ?? 0) > 0) ? 'failed' : counted && (s.counters.hidden ?? 0) === 0 ? (fin ? 'complete' : 'active') : fin ? 'missed' : 'active');
  const overrides = s.counters.overrides ?? 0;
  const helmFailed = (!!f.dockFailed && !f.endTow) || overrides >= 3 || !!f.lostBacking;
  const helmOk = !f.dockFailed && overrides <= 1 && (!!f.adeyemiFlew || v.storm === 'squall') && !dead;
  add('helm', 'Fly the rescue with the pilot best able to fly it, and let them fly', helmFailed ? 'failed' : fin ? (helmOk && !f.endFired ? 'complete' : 'missed') : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = starfall(s);
  const id = endingId(s);
  const dead = s.counters.deadCiv ?? 0;
  const aboard = s.counters.aboard ?? 0;
  const people = (n: number) => (n === 1 ? 'one person' : `${n} people`);
  switch (id) {
    case 'every-soul':
      return mk(id, 'Every Soul Aboard', `The Halcyon came up out of ${PLANET}'s clouds for the last time with ${people(aboard)} from ${HABITAT} aboard: everyone the habitat had. Her hull took what Chief Okafor said it could, and no more. Somewhere below, the empty habitat went on sinking.`, true);
    case 'ensigns-line':
      return mk(id, "The Ensign's Line", `Ens. Adeyemi found a way through the storm that no model had shown, and the captain let him fly it. Every one of the ${people(aboard)} aboard ${HABITAT} came up, and the Halcyon came out of the clouds within her limits.`, true);
    case 'under-tow':
      return mk(id, 'Under Tow', `With its scoop works cut away, ${HABITAT} stopped falling, and the Halcyon hauled it up out of the storm on her tractor. ${onHabitat(s) + aboard === 1 ? 'One person' : `${onHabitat(s) + aboard} people`} lived through it, and the company lost its plant instead of its people.`, true);
    case 'scarred':
      return mk(id, 'Scarred in the Clouds', `Everyone aboard ${HABITAT} lived, but the Halcyon came out of ${PLANET}'s storm with more strain on her frame than Chief Okafor would sign for. ${sim ? 'Fleet Training Command records it as a partial result: the ship will be in dock for weeks.' : 'She will be in dock for weeks.'}`, false);
    case 'left-below':
      return mk(id, 'Left in the Clouds', `${HABITAT} reached the crush line with ${people(dead)} still aboard. ${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
    case 'uncounted':
      return mk(id, 'The Uncounted', `The manifest said everyone was off. It was wrong: ${people(dead)} working off the books in the lower scoop works were still aboard ${HABITAT} when it went below the crush line. Nobody had counted them.`, false);
    case 'dragged-down':
      return mk(id, 'Dragged Down', `The Halcyon's frame gave way in the storm, and she fell kilometres before her pilot caught her. ${onHabitat(s) ? `${people(onHabitat(s))} were still aboard ${HABITAT}. ` : ''}${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
    case 'abandoned':
      return mk(id, 'Left to Fall', `The Halcyon left ${PLANET} with ${people(Math.max(dead, onHabitat(s)))} still aboard ${HABITAT}, and the habitat still sinking.`, false);
    case 'shots-fired':
      return mk(id, `Shots at ${HABITAT}`, `The Halcyon fired with civilians all around her. ${sim ? 'Fleet Training Command ended the exercise there.' : 'Nobody will forget it.'}`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('left-below', 'Left in the Clouds', `Time ran out over ${PLANET}, with ${people(onHabitat(s))} still aboard ${HABITAT}.`, false);
  void v;
  return null;
}
