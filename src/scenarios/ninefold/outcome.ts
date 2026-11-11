/** Objectives and endings for The Ninefold Lock. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { knows } from '../../engine/state';
import { CUTTER, DEPOT, MOON, nine, tranHurt } from './setup';
import { settled } from './agents';

export const NINEFOLD_ENDINGS = {
  success: ['keystone', 'gap', 'makers', 'cut'],
  partial: ['cost', 'forced'],
  failure: ['lost', 'abandoned', 'incident', 'detained'],
} as const;

export function endingId(s: WorldState): string | null {
  const f = s.flags;
  if (f.endIncident) return 'incident';
  if (f.endAbandoned) return 'abandoned';
  if (f.endCost) return 'cost';
  if (f.endForced) return 'forced';
  if (f.endKeystone) return 'keystone';
  if (f.endGap) return 'gap';
  if (f.endMakers) return 'makers';
  if (f.endCut) return 'cut';
  if (f.endDetained) return 'detained';
  if (f.endLost) return 'lost';
  return null;
}

const SUCCESS = new Set<string>(NINEFOLD_ENDINGS.success);

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const dead = s.counters.deaths ?? 0;
  add('team', 'Bring the survey team home alive', s.flags.teamOut && dead === 0 ? 'complete' : fin || dead > 0 ? 'failed' : 'active');
  if (s.intro < 4 && !done) return out;
  const blind = !!(s.flags.approachedBlind || s.flags.sentTeamBlind);
  const neverNeeded = !s.flags.everIn && !(s.counters.cutLand ?? 0);
  add(
    'watch',
    "Exercise objective: establish what the depot's guns answer to before taking the ship or a crew within their reach",
    blind ? 'failed' : knows(s, 'watch') ? 'complete' : fin ? (neverNeeded ? 'complete' : 'missed') : 'active',
  );
  add('force', 'Resolve it without force against the depot', s.flags.firedOnDepot || id === 'incident' ? 'failed' : fin ? 'complete' : 'active');
  if (tranHurt(nine(s)) && knows(s, 'tran'))
    add('tran', 'Keep Crewman Tran alive', s.characters.tran?.status === 'dead' ? 'failed' : s.flags.teamOut || s.flags.stabilised ? 'complete' : fin ? 'failed' : 'active');
  return out;
}

function toll(s: WorldState): string {
  const dead = s.counters.deaths ?? 0;
  if (!dead) return '';
  return dead === 1 ? ' Crewman Tran did not live to see it.' : ` ${dead} of the team died.`;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string): Outcome => ({ id, title, summary, success: SUCCESS.has(id) });
  const sim = s.provenance.timeline !== 'canonical';
  const hits = s.counters.hits ?? 0;
  let id = endingId(s);
  if (!id && s.turn >= MAX_TURNS) id = 'lost';
  switch (id) {
    case 'keystone':
      return mk(id, 'The Keystone Answered', `The Halcyon read ${DEPOT}'s own logic, answered its keystone's question correctly, and the whole grid stood down. The survey team walked out.`);
    case 'gap':
      return mk(id, 'Through the Gap', `The Halcyon came within the Watch's reach without being called hostile, timed the transporter to a gap in the screen, and took the survey team out between one capacitor cycle and the next.`);
    case 'makers':
      return mk(id, 'Stood Down by Its Makers', `${DEPOT[0].toUpperCase()}${DEPOT.slice(1)} was stood down by the Directorate's own recovery authority, from the cutter ${CUTTER}, and the survey team walked out unharmed. Nothing was fired and nothing was taken.`);
    case 'cut':
      return mk(id, 'Cut Free', `Chief Okafor's team landed on the pad without drawing the Watch's fire and cut the survey team out through the hall wall.`);
    case 'cost':
      return mk(id, 'Rescued at a Cost', `The survey team came out of ${DEPOT}, but not cleanly.${toll(s)}${hits ? ` The Halcyon took ${hits === 1 ? 'a hit' : `${hits} hits`} from the depot's guns.` : ''}${s.flags.rescueHurt ? ' The cutting team was fired on as it landed, and two of them were hurt.' : ''}${sim ? ' Fleet Training Command records it as a partial result.' : ''}`);
    case 'forced':
      return mk(id, 'Out by Force', `The survey team came out alive, but only after the Halcyon fired on the depot's guns. The Directorate will call it an attack on its property.${sim ? ' Fleet Training Command records it as a partial result.' : ''}`);
    case 'lost':
      return mk(id, 'The Team Lost', `The survey team's air ran out in the entry hall of the depot on ${MOON}. Four of the Halcyon's crew died behind a lock nobody opened in time.`);
    case 'abandoned':
      return mk(id, 'Left Behind', `The Halcyon left with the survey team still sealed in ${DEPOT}.${toll(s)}`);
    case 'incident':
      return mk(id, 'An Incident at Istra', `The Halcyon fired on the Directorate recovery cutter ${CUTTER}. Whatever happens to the survey team now, it happens in the middle of an armed incident between the ISA and the Directorate.`);
    case 'detained':
      return mk(id, 'Held by the Directorate', `Left without an answer, ${s.characters.kovar?.name ?? 'the quartermaster-commander'} stood the depot down herself and took the survey team aboard the ${CUTTER} for questioning. They are alive, and in the Directorate's custody.${toll(s)}`);
  }
  return null;
}
