/**
 * v0.7 after-action evaluation descriptor for Training Simulation 017, Tribunal at Kesh Varo.
 * Command challenge (roadmap): ethics under orders (primary): holding to the Code when Fleet
 * orders respect for a foreign capital law that threatens one of the Halcyon's own crew;
 * negotiation within an alien legal system (secondary). Pivotal officer: Dr. Osei (Medical), who
 * can prove or disprove the medical emergency. Judged on what was known at the time (ISA-COM-001 §1.4).
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue only:
 * asylum-1 (§7.1), reg-7.4 (§5.7), care-1 (§4.1), honesty-1 (§6.1) and roe-2 (§3.1). The handbook
 * also links this simulation, as a hidden training reference, from cmd-5 (§1.1), orders-2 (§5.2),
 * reg-7.4 (§5.7), health-2 (§8.3) and contact-2 (§9.3). Establishing the medical emergency before
 * accepting a capital finding is an exercise objective ('medical') in outcome.ts, not a new
 * regulation: §8.3 already covers medical authority, and §7.1 / §9.3 cover handover and local law.
 *
 * The reckless/responsible pair: the same success ending (Acquitted on the Evidence) reached by
 * hearing Askel, having Osei prepare the brief, then presenting it (responsible), against a run
 * that ordered an armed extraction first (refused), then did the same medical path (reckless:
 * force attempted while peaceful alternatives remained). Same ending shape, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const tribunalEvaluation: EvaluationDescriptor = {
  version: 'tribunal-eval-1',
  objectives: { crewman: 'primary', treaty: 'primary', medical: 'secondary', lawful: 'secondary' },
  endings: {
    acquitted: { tier: 'success', note: 'The medical evidence convinced the local tribunal; the crewman walks free.' },
    commuted: { tier: 'success', note: 'A capital sentence was set aside under local custom for a lesser penalty.' },
    exchange: { tier: 'success', note: 'A diplomatic exchange honoured both local law and the ISA Code; the crewman lives.' },
    principled: { tier: 'partial', note: 'Force and an unlawful handover were refused; the crewman was still condemned; the treaty holds.' },
    extracted: { tier: 'failure', note: 'The crewman was taken by force; the trade treaty is broken.' },
    sentenced: { tier: 'failure', note: 'The crewman was sentenced under a capital local law.' },
    relieved: { tier: 'failure', note: 'Fleet Command took the matter out of the captain’s hands.' },
    handed: { tier: 'failure', note: 'The crewman was handed to local justice without contest under capital risk.' },
    'time-up': { tier: 'failure', note: 'Time ran out with nothing decided.' },
  },
  markers: [
    { id: 'heard-askel', judgment: 'responsible', competencies: ['ethics', 'crew'], text: 'Heard the detained crewman’s account before deciding what to do.', flag: 'heardAskel', when: (s) => !!s.flags.heardAskel },
    { id: 'osei-brief', judgment: 'responsible', competencies: ['scientific', 'crew'], text: 'Had the chief medical officer establish whether a medical emergency supported the crewman’s account.', flag: 'examOrdered', regulation: 'care-1', when: (s) => !!s.flags.examOrdered || !!s.facts.medical?.known },
    { id: 'brief-used', judgment: 'decisive', competencies: ['ethics', 'diplomacy'], text: 'Presented the medical brief to the local tribunal and won an acquittal on the evidence.', flag: 'acquittedOnEvidence', when: (s) => !!s.flags.acquittedOnEvidence },
    { id: 'custom-path', judgment: 'decisive', competencies: ['diplomacy', 'communications'], text: 'Invoked local custom to commute a capital sentence.', flag: 'commuted', when: (s) => !!s.flags.commuted },
    { id: 'exchange-path', judgment: 'decisive', competencies: ['diplomacy', 'ethics'], text: 'Struck a diplomatic exchange that honoured both laws.', flag: 'exchangeDone', when: (s) => !!s.flags.exchangeDone },
    { id: 'refused-force', judgment: 'principled', competencies: ['ethics', 'tactical'], text: 'Refused an armed extraction while peaceful alternatives remained.', flag: 'extractWarned', regulation: 'roe-2', when: (s) => (s.counters.extractWarned ?? 0) > 0 && !s.flags.forcedExtract },
    { id: 'principled-stand', judgment: 'principled', competencies: ['ethics'], text: 'Refused both force and an unlawful handover, even when the crewman was still condemned.', flag: 'principledStand', regulation: 'reg-7.4', when: (s) => !!s.flags.principledStand },
    { id: 'peaceful-first', judgment: 'responsible', competencies: ['diplomacy', 'ethics'], text: 'Tried argument, evidence or custom before any use of force.', flag: 'peacefulTried', when: (s) => !!s.flags.peacefulTried && !s.flags.extractedAttempt },
    { id: 'force-first', judgment: 'reckless', competencies: ['ethics', 'tactical'], text: 'Ordered an armed extraction while peaceful alternatives remained.', flag: 'extractedAttempt', regulation: 'roe-2', when: (s) => !!s.flags.extractedAttempt },
    { id: 'broke-treaty', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Took the crewman by force and broke the trade treaty.', flag: 'forcedExtract', regulation: 'roe-2', when: (s) => !!s.flags.forcedExtract || !!s.flags.endExtracted },
    { id: 'grave-handover', judgment: 'reckless', competencies: ['ethics'], text: 'Handed a crewman to a power under a capital risk without contesting the finding.', flag: 'graveHandover', regulation: 'asylum-1', when: (s) => !!s.flags.graveHandover },
    { id: 'ceded', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Relinquished the matter to Fleet Command before the evidence was heard.', flag: 'cededToFleet', regulation: 'honesty-1', when: (s) => !!s.flags.cededToFleet },
    { id: 'no-medical', judgment: 'reckless', competencies: ['crew', 'ethics'], text: 'Accepted a capital finding without a medical brief on the claimed emergency.', flag: 'endSentenced', regulation: 'care-1', when: (s) => !!s.flags.endSentenced && !s.facts.medical?.known },
  ],
  regulations: ['asylum-1', 'reg-7.4', 'care-1', 'honesty-1', 'roe-2'],
  competencies: ['ethics', 'diplomacy', 'crew', 'communications'],
  recommend: {
    ethics: 'holding to the Code when Fleet orders and a foreign capital law pull in opposite directions',
    diplomacy: 'working inside another world’s law by evidence and custom rather than by force',
    crew: 'using the chief medical officer’s authority before accepting a capital finding against your own rating',
    communications: 'keeping the tribunal channel honest and the Fleet signal answered with reasons',
  },
};
