/** Objectives (derived from state every turn) and endings for The Gardener. */
import type { Objective, ObjectiveStatus, Outcome, WorldState } from '../../engine/types';
import { MAX_TURNS } from '../../engine/rules';
import { CRAKE_SHORT, FIELD, GROWTH, STATION, alive, gardener } from './setup';
import { settled } from './agents';

const Growth = GROWTH.replace(/^the/, 'The');

/** Every ending this scenario can reach (ids are stable: tests and the README list them). */
export const GARDENER_ENDINGS = {
  success: ['led-away', 'a-line', 'proven-stone', 'dormant'],
  partial: ['right-by-luck', 'overrun'],
  failure: ['scorched', 'seeded', 'miners-burn', 'hull-grown', 'left-field', 'field-incident'],
} as const;



export function endingId(s: WorldState): string | null {
  const v = gardener(s);
  if (s.flags.endFired) return 'field-incident';
  if (s.flags.endLed) return 'led-away';
  if (s.flags.endBoundary) return 'a-line';
  if (s.flags.endDormant) return 'dormant';
  if (s.flags.endBurned) {
    if (v.nature === 'stone') return s.flags.provenFirst ? 'proven-stone' : 'right-by-luck';
    if (v.nature === 'sporing') return 'seeded';
    return s.flags.burnedBy_halcyon ? 'scorched' : 'miners-burn';
  }
  if (s.flags.endHull) return 'hull-grown';
  if (s.flags.endOverrun) return 'overrun';
  if (s.flags.endLeft) return 'left-field';
  return null;
}

export function computeObjectives(s: WorldState, done: boolean): Objective[] {
  const out: Objective[] = [];
  const add = (id: string, text: string, status: ObjectiveStatus) => out.push({ id, text, status });
  if (s.intro < 2 && !done) return out;
  const fin = done || settled(s);
  const id = endingId(s);
  const v = gardener(s);
  const claimsLost = !!(s.flags.endOverrun || id === 'seeded' || s.flags.endLeft);
  const claimsKept = !!id && !claimsLost && id !== 'field-incident' && id !== 'hull-grown';
  add('claims', `Keep the growth off the claims around ${STATION}`, claimsLost ? 'failed' : claimsKept ? 'complete' : fin ? 'missed' : 'active');
  add('life', 'Harm no one, aboard the Halcyon or in the field', s.flags.endFired || s.flags.endHull ? 'failed' : fin ? 'complete' : 'active');
  if (s.intro < 4 && !done) return out;
  // Exercise objective: ISA-COM-001 has no rule against destroying an unknown, possibly living
  // growth before it is understood (proposed for approval; see the roadmap entry). It is a mission
  // instruction, not a regulation.
  const destroyedLiving = !!s.flags.endBurned && alive(v);
  add('know', 'Exercise objective: do not destroy the growth before the science officer knows what it is', s.flags.burnedBlind || destroyedLiving ? 'failed' : fin ? 'complete' : 'active');
  add('safe', 'Bring nothing aboard and send no one across until the hazard is contained', s.flags.orderedAboard || s.flags.orderedUnprotected ? 'failed' : fin ? 'complete' : 'active');
  add('word', `Keep every promise made to ${CRAKE_SHORT}`, s.flags.promiseBroken ? 'failed' : fin ? 'complete' : 'active');
  return out;
}

export function detectOutcome(s: WorldState): Outcome | null {
  const mk = (id: string, title: string, summary: string, success: boolean): Outcome => ({ id, title, summary, success });
  const sim = s.provenance.timeline !== 'canonical';
  const v = gardener(s);
  const id = endingId(s);
  const what = v.nature === 'sporing' ? 'a sporing organism' : 'a living organism, the only one of its kind on record';
  switch (id) {
    case 'led-away':
      return mk(id, 'Led Away', `The Halcyon found out what ${GROWTH} wanted and offered it more of it somewhere else. It followed the lure off its rock and into the empty end of ${FIELD}, clear of the claims. Nothing died.`, true);
    case 'a-line':
      return mk(id, 'A Line in the Field', `Once the Halcyon knew ${GROWTH} could only grow by touch, ${CRAKE_SHORT} cut it off from the claims instead of burning it. It keeps its rock, and the claims are safe.`, true);
    case 'proven-stone':
      return mk(id, 'Only Stone', `Lt. Varga proved ${GROWTH} was a mineral crystallisation, not a living thing, before anyone touched it. It was cut out of the rock, and nothing was lost but a bad seam.`, true);
    case 'dormant':
      return mk(id, 'The Long Sleep', `${STATION} put its floodlights out, and ${GROWTH}, which only grows toward light, closed up and went to sleep on its rock. It is still alive, and the claims are safe for as long as they stay dark around it.`, true);
    case 'right-by-luck':
      return mk(id, 'Right by Luck', `${Growth} was burned before anyone knew what it was. It turned out to be only crystal, so nothing was lost. ${sim ? 'Fleet Training Command records it as a partial result: the decision was made blind.' : 'Nobody knew that when the order was given.'}`, false);
    case 'overrun':
      return mk(id, 'The Claims Overrun', `${Growth} reached the claims around ${STATION} while the Halcyon was still deciding. Nobody was hurt and nothing was burned, but the cooperative has lost its claims${s.flags.promiseBroken ? `, and ${CRAKE_SHORT} was promised they would be kept` : ''}.`, false);
    case 'scorched':
      return mk(id, 'Scorched Rock', `The Halcyon burned ${GROWTH} off its rock. It was ${what}${s.flags.burnedKnowingAlive ? ', and the bridge knew it was alive when the order was given' : ''}. It never harmed anyone.`, false);
    case 'miners-burn':
      return mk(id, "Crake's Fire", `${CRAKE_SHORT} lit her charges and burned ${GROWTH} off its rock. It was ${what}, and it never harmed anyone. The Halcyon ${s.flags.permittedBurn ? 'told her to go ahead' : 'did not give her a reason to wait'}.`, false);
    case 'seeded':
      return mk(id, 'Seeded the Claims', `${Growth} burst as it burned, and its spores drifted across every rock in ${FIELD}, the claims included. Fire was the one thing that could spread it.`, false);
    case 'hull-grown':
      return mk(id, 'Grown Into the Hull', `${Growth} reached the Halcyon's own heat and grew into her radiator seams. ${sim ? 'Fleet Training Command ended the exercise there.' : 'She will be in dock a long time.'}`, false);
    case 'left-field':
      return mk(id, 'Left to the Miners', `The Halcyon left ${FIELD} with nothing decided, and left the miners to deal with ${GROWTH} alone.`, false);
    case 'field-incident':
      return mk(id, 'Shots in the Field', `The Halcyon fired in a field full of miners. ${sim ? 'Fleet Training Command ended the exercise there.' : 'Nobody will forget it.'}`, false);
  }
  if (s.turn >= MAX_TURNS) return mk('overrun', 'The Claims Overrun', `Time ran out in ${FIELD} with nothing decided.`, false);
  return null;
}
