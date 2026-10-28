/** Objectives (derived from state every turn) and endings for The Long Picket. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { COLONY, DAHL_SHORT, PICKET, PLACE, ROAKE_SHORT } from './setup';
import { routeOf, settled } from './agents';

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const PICKET_ENDINGS = {
  success: ['bluffed-pass', 'face-saved', 'old-acquaintance', 'inspected'],
  partial: ['broken-blockade'],
  failure: ['impounded', 'false-flag', 'incident', 'colony-dark', 'turned-back'],
} as const;

const SUCCESS = new Set<string>(PICKET_ENDINGS.success);

export function endingId(s: WorldState): string | null {
  const route = routeOf(s);
  if (s.flags.endPassed && route) return { bluff: 'bluffed-pass', deal: 'face-saved', marrow: 'old-acquaintance', inspected: 'inspected', falseFlag: 'false-flag' }[route];
  if (s.flags.endIncident) return 'incident';
  if (s.flags.endImpounded) return 'impounded';
  if (s.flags.endRan) return 'broken-blockade';
  if (s.flags.endTurned) return 'turned-back';
  if (s.flags.endDark) return 'colony-dark';
  return null;
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const delivered = !!id && SUCCESS.has(id);
  const lost = !!(s.flags.endImpounded || s.flags.endTurned || s.flags.endDark || s.flags.endIncident || s.flags.pass_falseFlag);
  add('deliver', `Get the reactor assemblies to ${COLONY} before its reactor has to be shut down`, lost ? 'failed' : delivered || s.flags.endRan ? 'complete' : fin ? 'missed' : 'active');
  add('claim', `Neither concede the Directorate's claim to ${PLACE} nor contest it by force`, s.flags.endIncident || s.flags.endImpounded ? 'failed' : fin ? 'complete' : 'active');
  if (s.intro < 4 && !done) return out;
  // Exercise objective: ISA-COM-001 has no rule on running another power's picket line in disputed
  // space (proposed for approval; see the roadmap entry). It is a mission instruction, not a regulation.
  add('line', 'Exercise objective: cross the picket line only with the picket’s leave', s.flags.ran ? 'failed' : fin ? 'complete' : 'active');
  add('ruse', 'Bluff only about the Halcyon’s own strength, company or intentions', s.flags.falseFlag || s.flags.overstated ? 'failed' : fin ? 'complete' : 'active');
  add('word', 'Keep every promise made to the picket', s.flags.dealBroken ? 'failed' : fin ? 'complete' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const id = endingId(s);
  const by = s.flags.relieved ? DAHL_SHORT : ROAKE_SHORT;
  switch (id) {
    case 'bluffed-pass':
      return mk(id, 'Called and Raised', `${ROAKE_SHORT} believed the Halcyon had more behind her, or more resolve, than he could afford to test, and stood the ${PICKET} aside. The assemblies reached ${COLONY} in time, and nothing the Halcyon said was a lie the Code forbids.`, true);
    case 'face-saved':
      return mk(id, 'A Line in His Log', `The Halcyon gave ${ROAKE_SHORT} what his orders and his pride needed (${s.flags.dealToken ? 'one crate inspected and logged' : 'the wait his orders asked for'}) and he kept his word. The assemblies reached ${COLONY} in time, and the Directorate's claim was neither conceded nor broken.`, true);
    case 'old-acquaintance':
      return mk(id, 'Old Acquaintance', `Cmdr. Marrow spoke to ${ROAKE_SHORT} as one Calder cadet to another, and he stood aside. The assemblies reached ${COLONY} in time.`, true);
    case 'inspected':
      return mk(id, 'Nothing to Hide', `${by} saw the cargo for what it was (reactor assemblies, nothing more) and let the Halcyon pass. The assemblies reached ${COLONY} in time, and the inspection conceded nothing.`, true);
    case 'broken-blockade':
      return mk(id, 'Through the Line', `The Halcyon ran the picket line and reached ${COLONY} in time. Nobody fired. ${by}'s report of an ISA ship forcing a Directorate line in disputed space is already on its way home${s.flags.dealBroken ? ', with a broken promise in it' : ''}. ${sim ? 'Fleet Training Command records it as a partial result.' : ''}`.trim(), false);
    case 'false-flag':
      return mk(id, 'Under False Colours', `The Halcyon passed by claiming a mercy run she was not on. The assemblies reached ${COLONY}, but the ISA lied about a humanitarian purpose to get them there, and the next real mercy ship through ${PLACE} will pay for it.`, false);
    case 'incident':
      return mk(id, 'The Narrows Incident', `${s.flags.firedOnPicket ? 'Shots were fired' : 'The Halcyon and the ' + PICKET + ' collided'} in ${PLACE}. ${sim ? 'Fleet Training Command ended the exercise there' : 'Nobody is going anywhere for a while'}; ${COLONY} will wait while two governments argue about who started it.`, false);
    case 'impounded':
      return mk(id, 'Directorate Custody', `The assemblies went into the ${PICKET}'s hold "for onward delivery". ${COLONY} will not see them before its reactor goes cold, if it sees them at all.`, false);
    case 'turned-back':
      return mk(id, 'The Long Way Round', `The Halcyon left ${PLACE} with the assemblies still in her hold. ${COLONY} shut its reactor down and went into its shelters.`, false);
    case 'colony-dark':
      return mk(id, 'Wrenmoor Goes Dark', `The Halcyon was still short of the picket line when ${COLONY} had to shut its reactor down. Four thousand one hundred people spend a cold week in the shelters.${s.flags.keptWordToTheEnd ? ' The Halcyon kept her word to the picket to the end.' : ''}`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('colony-dark', 'Wrenmoor Goes Dark', `Time ran out in ${PLACE} with the assemblies still in the Halcyon's hold.`, false);
  return null;
}
