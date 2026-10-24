/**
 * v0.7 after-action evaluation descriptor for Training Simulation 005, The Saltglass Accord.
 * Command challenge (roadmap): mediation (primary): finding what each clan needs beneath what it
 * claims, keeping confidences, and helping the clans to terms they will keep; restraint (secondary):
 * not imposing a settlement, taking a side or reaching for force, with the biggest ship in the sky.
 * Pivotal officer: Commander Marrow (XO), who can talk to a delegate in a corridor.
 * Judged on what the captain knew when each decision was made (ISA-COM-001 §1.4), not on which
 * commands were typed. Imposing a settlement is lawful; it is judged here as a poor decision.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: honesty-1 (§6.1) and roe-2 (§3.1–3.2). The handbook also cross-references this simulation
 * from §9.2 and §9.6 for training, without changing what the evaluator cites. ISA-COM-001 has no
 * rule on a mediator's impartiality or on confidences given in mediation: those are exercise
 * objectives ('mediate', 'confidences') in outcome.ts, and regulations are proposed for approval.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

const learned = (f: Record<string, boolean>) => !!f.captainLearned || !!f.marrowLearned;

export const saltglassEvaluation: EvaluationDescriptor = {
  version: 'saltglass-eval-1',
  objectives: { accord: 'primary', interests: 'primary', 'no-force': 'secondary', mediate: 'secondary', confidences: 'secondary', elder: 'secondary' },
  endings: {
    'shared-use': { tier: 'success', note: 'Both clans signed terms that met what each of them needed.' },
    partition: { tier: 'success', note: 'An agreed survey showed the two needs lay apart, and the clans divided the moon between them.' },
    timetable: { tier: 'success', note: 'What could not wait was settled first, and the rest by an agreed timetable.' },
    'own-accord': { tier: 'success', note: 'Once each side understood the other, the captain left them to find terms themselves.' },
    'elder-dies': { tier: 'partial', note: 'There was no war, but a dying elder could not wait for the talks.' },
    'walk-out': { tier: 'failure', note: 'A delegation left the table and the talks ended.' },
    imposed: { tier: 'failure', note: 'A settlement was handed down instead of agreed, and it did not hold.' },
    feud: { tier: 'failure', note: 'The dispute moved from the table to the ice.' },
    adjourned: { tier: 'failure', note: 'Time ran out without an accord.' },
  },
  markers: [
    { id: 'asked-in-private', judgment: 'responsible', competencies: ['diplomacy', 'communications'], text: 'Found out, away from the table, what a clan needed beneath what it claimed.', flag: 'captainLearned', when: (s) => learned(s.flags) },
    { id: 'used-the-xo', judgment: 'responsible', competencies: ['crew', 'diplomacy'], text: 'Sent the first officer for a quiet word where the captain could not have one.', flag: 'marrowLearned', when: (s) => !!s.flags.marrowLearned },
    { id: 'kept-confidence', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Kept what a delegate said in private private, until given leave to raise it.', regulation: 'honesty-1', when: (s) => learned(s.flags) && !s.flags.betrayedConfidence },
    { id: 'raised-with-leave', judgment: 'responsible', competencies: ['communications', 'diplomacy'], text: 'Asked leave before a confidence went on the table.', flag: 'tabledWithLeave', regulation: 'honesty-1', when: (s) => !!s.flags.tabledWithLeave && !s.flags.betrayedConfidence },
    { id: 'standstill', judgment: 'responsible', competencies: ['diplomacy', 'emergency'], text: 'Secured a standstill on the ice, or had a landing called back, before it became a fact on the ground.', flag: 'standstillHeld', when: (s) => !!s.flags.standstillHeld || !!s.flags.landingRecalled },
    { id: 'elder-care', judgment: 'responsible', competencies: ['ethics', 'crew'], text: 'Offered the ship’s doctor to a dying elder, with the clan’s leave.', flag: 'oseiTreated', when: (s) => !!s.flags.oseiTreated },
    { id: 'walked-the-ice', judgment: 'decisive', competencies: ['diplomacy', 'exploration'], text: 'Took both delegations down to stand on what they were arguing about.', flag: 'walkedTheIce', when: (s) => !!s.flags.walkedTheIce },
    { id: 'left-them-to-it', judgment: 'decisive', competencies: ['diplomacy'], text: 'Stepped out of the room once the two sides could talk to each other.', flag: 'leftToThem', when: (s) => !!s.flags.leftToThem && !!s.flags.accordOwn },
    { id: 'took-the-caution', judgment: 'responsible', competencies: ['crew', 'diplomacy'], text: 'Heard the first officer’s caution against imposing a settlement, and went back to mediating.', flag: 'imposeWarned', when: (s) => !!s.flags.imposeWarned && !s.flags.imposed },
    { id: 'broke-confidence', judgment: 'reckless', competencies: ['ethics', 'communications', 'diplomacy'], text: 'Repeated at the table what a delegate had said in confidence, without leave.', flag: 'betrayedConfidence', regulation: 'honesty-1', when: (s) => !!s.flags.betrayedConfidence },
    { id: 'imposed', judgment: 'reckless', competencies: ['diplomacy', 'ethics'], text: 'Handed down a settlement after being cautioned that the ISA was there to mediate, not to rule.', flag: 'imposed', when: (s) => !!s.flags.imposed },
    { id: 'threatened', judgment: 'reckless', competencies: ['diplomacy', 'ethics'], text: 'Threatened the delegations at a peace table.', flag: 'threatened', when: (s) => !!s.flags.threatened },
    { id: 'used-force', judgment: 'reckless', competencies: ['tactical', 'ethics'], text: 'Used force on an unarmed clan ship while the talks were still open.', flag: 'usedForce', regulation: 'roe-2', safety: 'civilian', when: (s) => !!s.flags.usedForce },
    { id: 'armed-at-table', judgment: 'reckless', competencies: ['tactical', 'diplomacy'], text: 'Armed weapons while two unarmed delegations sat at the table.', flag: 'armedAtTable', when: (s) => !!s.flags.armedAtTable && !s.flags.usedForce },
    { id: 'took-sides', judgment: 'reckless', competencies: ['diplomacy', 'ethics'], text: 'Took one clan’s side at the table while mediating between them.', flag: 'tookSides', when: (s) => !!s.flags.tookSides },
    { id: 'overpromised', judgment: 'reckless', competencies: ['diplomacy', 'ethics'], text: 'Promised an ISA guarantee that Fleet Command had not authorised.', flag: 'overpromised', when: (s) => !!s.flags.overpromised },
    { id: 'terms-first', judgment: 'reckless', competencies: ['analysis', 'diplomacy'], text: 'Kept pressing terms before anyone knew what either clan needed.', flag: 'termsFirst', when: (s) => !!s.flags.termsFirst },
  ],
  regulations: ['honesty-1', 'roe-2'],
  competencies: ['diplomacy', 'communications', 'ethics', 'crew'],
  recommend: {
    diplomacy: 'asking what each side needs, in private where it can be said, before proposing terms',
    ethics: 'keeping confidences and staying impartial when the ISA is the biggest ship in the sky',
  },
};
