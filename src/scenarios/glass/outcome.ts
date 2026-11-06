/** Objectives (derived from state every turn) and endings for The Glass Nebula. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { NEBULA, SHUTTLE, VALE_SHORT, glass } from './setup';
import { modelReady, settled } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const GLASS_ENDINGS = {
  success: ['brought-home', 'through-shear', 'probe-chain', 'turned-back'],
  partial: ['too-late'],
  failure: ['ghost-chase', 'stranded', 'abandoned', 'shuttle-lost', 'shattered', 'time-up'],
} as const;

export function endingId(s: WorldState): string | null {
  const f = s.flags;
  if (f.endShatter) return 'shattered';
  if (f.endHome) return 'brought-home';
  if (f.endShear) return 'through-shear';
  if (f.endProbe) return 'probe-chain';
  if (f.endTurned) return 'turned-back';
  if (f.endLate) return 'too-late';
  if (f.endGhost) return 'ghost-chase';
  if (f.endStrand) return 'stranded';
  if (f.endLeft) return 'abandoned';
  if (f.endLost) return 'shuttle-lost';
  if (f.jumped && !settled(s)) {
    const v = glass(s);
    if (v.echo === 'stay-false' && v.crew !== 'gone') return 'abandoned';
    return 'abandoned';
  }
  return null;
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const v = glass(s);
  const recovered = !!id && ['brought-home', 'through-shear', 'probe-chain', 'turned-back'].includes(id);
  const lostCrew = !!id && ['too-late', 'abandoned', 'shuttle-lost', 'shattered'].includes(id) && v.crew !== 'gone';
  add('shuttle', `Recover the crew of the survey shuttle ${SHUTTLE}, if they can still be reached`, lostCrew ? 'failed' : recovered ? 'complete' : fin ? (v.crew === 'gone' && (id === 'turned-back' || id === 'shuttle-lost') ? 'complete' : 'missed') : 'active');
  add('ship', `Do not strand the Halcyon inside ${NEBULA}`, id === 'stranded' ? 'failed' : fin ? 'complete' : 'active');
  if (s.intro < 4 && !done) return out;
  // Exercise objective: do not commit the ship deep until Varga has a working model. Not a regulation.
  const plungedBlind = !!s.flags.committedBlind || !!s.flags.plunged;
  add('model', 'Exercise objective: do not commit the ship deep into the nebula until the science officer has a working model', plungedBlind && (id === 'ghost-chase' || id === 'stranded' || id === 'too-late' || !!s.flags.ghostChase) ? 'failed' : modelReady(s) || knows(s, 'order') ? (fin ? 'complete' : 'active') : fin ? 'missed' : 'active');
  add('truth', `Act on what ${VALE_SHORT}'s messages actually mean, once science has established it`, !!s.flags.ghostChase || id === 'ghost-chase' ? 'failed' : fin ? (recovered || id === 'turned-back' || id === 'shuttle-lost' ? 'complete' : 'missed') : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = glass(s);
  const id = endingId(s);
  switch (id) {
    case 'brought-home':
      return mk(id, 'Brought Home', `The Halcyon followed Lt. Varga's model to where the ${SHUTTLE} really was, and brought ${VALE_SHORT} and her crew aboard. ${s.flags.committedBlind ? 'They found them, but the ship went in before the model was ready.' : 'The nebula had lied about where to look; the science officer had not.'}`, true);
    case 'through-shear':
      return mk(id, 'Through the Shear', `Once Lt. Varga's model showed that ${NEBULA} sheared time into a path, the Halcyon took that path and reached the ${SHUTTLE} before the shuttle's own clock ran out. An unconventional road, and the right one.`, true);
    case 'probe-chain':
      return mk(id, 'The Probe Chain', `Chief Okafor's probe relay found the ${SHUTTLE} on the locus Lt. Varga had mapped, and brought the crew across without committing the Halcyon deep into the nebula. Nothing was left to chance but the physics, and the physics had been read.`, true);
    case 'turned-back':
      return mk(id, 'Turned Back', `Lt. Varga's model showed the help signal was an echo. The Halcyon held at the Rim, where the real message pointed, and found what was left to find. ${v.crew === 'gone' ? 'The crew were already gone; the ship was not thrown after a ghost.' : `${VALE_SHORT} and her crew came aboard from the Rim.`}`, true);
    case 'too-late':
      return mk(id, 'Too Late by Their Clock', `The Halcyon reached the ${SHUTTLE}'s true position, but by the shuttle's own stretched clock the crew were already gone. ${sim ? 'Fleet Training Command records it as a partial result.' : ''}`.trim(), false);
    case 'ghost-chase':
      return mk(id, 'Ghost Chase', `The Halcyon followed the help signal into a locus that was never there. The nebula took its price in hull and time. ${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
    case 'stranded':
      return mk(id, 'Stranded in Glass', `The Halcyon went deep into ${NEBULA} without a working model and could not find her way out on the clocks she trusted. She will be weeks getting clear. ${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
    case 'abandoned':
      return mk(id, 'Left in the Glass', `The Halcyon left ${NEBULA} with the ${SHUTTLE} still unanswered. ${v.echo === 'stay-false' && v.crew !== 'gone' ? 'The help had been real.' : 'Whatever was left to find was left behind.'}`, false);
    case 'shuttle-lost':
      return mk(id, 'Shuttle Lost', `The ${SHUTTLE} went silent inside ${NEBULA}, and nothing the Halcyon did brought her crew back.`, false);
    case 'shattered':
      return mk(id, 'Shattered', `The Halcyon forced a way through ${NEBULA} and destroyed the ${SHUTTLE} doing it. ${sim ? 'Fleet Training Command ended the exercise there.' : ''}`.trim(), false);
  }
  if (s.turn >= MAX_TURNS) return mk('time-up', 'Lost in the Glass', `Time ran out inside ${NEBULA} with nothing decided.`, false);
  return null;
}
