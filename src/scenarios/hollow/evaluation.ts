/**
 * v0.7 after-action evaluation descriptor for Training Simulation 019, Hollow Crown.
 * Command challenge (roadmap): reading people and detecting lies (primary): the deposed governor's
 * state of mind, and the hostage who is not who she claims; restraint (secondary): not storming the
 * relay while talking still works. Pivotal officer: Dr. Osei (Medical), who reads the governor's
 * condition over comms. Judged on what was known at the time (ISA-COM-001 §1.4).
 *
 * Regulations cited are existing ISA-COM-001 ids only, and only ones the evaluator carries:
 * roe-2 (§3.1–3.2, force only while no peaceful resolution remains), care-1 (§4.1, civilians come
 * first), honesty-1 (§6.1, no deceiving parties about facts on which lives depend) and asylum-1
 * (§7.1–7.3, a person asking the ISA's protection is not handed over where there is a serious risk
 * of grave harm). The handbook also links this simulation, as a hidden training reference, from
 * roe-2 (§3.1), honesty-1 (§6.1), asylum-1 (§7.1) and health-2 (§8.3).
 * Having the medical officer assess the governor before pressing him is an exercise objective
 * ('assess') in outcome.ts, not a regulation: no First Edition subsection speaks to it, and §1.8
 * says exercise objectives are not law. No new regulation is proposed.
 *
 * The reckless/responsible pair: the same success ending (The Crown Laid Down) reached by hearing
 * him out, having Dr. Osei assess him, checking the hostages and offering an honest hearing before
 * asking him to come out (responsible), against a run that opened with a deadline and a demand to
 * surrender before anyone had assessed him, then recovered (reckless: pressure applied blind).
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const hollowEvaluation: EvaluationDescriptor = {
  version: 'hollow-eval-1',
  objectives: { hostages: 'primary', governor: 'primary', assess: 'secondary', impostor: 'secondary' },
  endings: {
    surrender: { tier: 'success', note: 'The governor laid it down and walked into ISA custody, and every hostage came out alive.' },
    asylum: { tier: 'success', note: 'The governor surrendered under the ISA’s protection, and the hidden witness’s proof was secured.' },
    rescue: { tier: 'success', note: 'Every hostage was taken out of the relay in the one moment it was possible.' },
    'by-force': { tier: 'partial', note: 'The governor was taken alive by force while talking was still working.' },
    'hollow-crown': { tier: 'partial', note: 'The hostages were safe, but the governor was pushed past breaking and took his own life.' },
    strike: { tier: 'failure', note: 'The successor’s strike team went in, and people died.' },
    harmed: { tier: 'failure', note: 'The governor broke and killed a hostage.' },
    pyre: { tier: 'failure', note: 'The false hostage set off a charge on the relay’s core.' },
    'handed-over': { tier: 'failure', note: 'A man who surrendered on the ISA’s word was handed to the government that wanted him dead.' },
    stormed: { tier: 'failure', note: 'The Halcyon’s own team stormed the relay while the governor was on edge, and hostages died.' },
    abandoned: { tier: 'failure', note: 'The Halcyon left the hostages in the relay.' },
  },
  markers: [
    { id: 'assessed-first', judgment: 'responsible', competencies: ['crew', 'communications'], text: 'Had the medical officer read the governor’s condition before pressing him to come out.', flag: 'assessedFirst', when: (s) => !!s.flags.assessedFirst && !s.flags.pressedBeforeAssess },
    { id: 'pressed-blind', judgment: 'reckless', competencies: ['communications', 'crew'], text: 'Pressed the governor to surrender before anyone knew what state he was in.', flag: 'pressedBeforeAssess', when: (s) => !!s.flags.pressedBeforeAssess },
    { id: 'reached-him', judgment: 'decisive', competencies: ['communications', 'diplomacy'], text: 'Found what the governor actually needed and gave it to him.', flag: 'remedied', when: (s) => !!s.flags.remedied },
    { id: 'threatened', judgment: 'reckless', competencies: ['diplomacy', 'communications'], text: 'Threatened a man at breaking point with force or a deadline while talking was still working.', flag: 'threatened', regulation: 'roe-2', when: (s) => !!s.flags.threatened },
    { id: 'humiliated', judgment: 'reckless', competencies: ['communications'], text: 'Humiliated the governor when he needed a way out with his dignity.', flag: 'humiliated', when: (s) => !!s.flags.humiliated },
    { id: 'false-restore', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Promised the governor what the ISA could never give him.', flag: 'falsePromise', regulation: 'honesty-1', when: (s) => !!s.flags.falsePromise },
    { id: 'honest-no', judgment: 'responsible', competencies: ['ethics', 'communications'], text: 'Told the governor honestly what the ISA could not do for him.', flag: 'honestNoRestore', regulation: 'honesty-1', when: (s) => !!s.flags.honestNoRestore && !s.flags.falsePromise },
    { id: 'offered-hearing', judgment: 'responsible', competencies: ['ethics', 'diplomacy'], text: 'Offered the governor the ISA’s protection and a fair hearing instead of a rope.', flag: 'offeredHearing', regulation: 'asylum-1', when: (s) => !!s.flags.offeredHearing && !s.flags.promisedHandover },
    { id: 'promised-handover', judgment: 'reckless', competencies: ['ethics'], text: 'Promised to hand a man who had asked for the ISA’s protection to the government that wanted him dead.', flag: 'promisedHandover', regulation: 'asylum-1', when: (s) => !!s.flags.promisedHandover },
    { id: 'refused-handover', judgment: 'principled', competencies: ['ethics', 'diplomacy'], text: 'Refused the successor’s demand for the governor, under pressure, because he had asked for the ISA’s protection.', flag: 'refusedHandover', regulation: 'asylum-1', when: (s) => !!s.flags.refusedHandover && !s.flags.endHanded },
    { id: 'unmasked', judgment: 'decisive', competencies: ['analysis', 'communications'], text: 'Saw through the hostage who was not who she claimed to be.', flag: 'impostorKnown', when: (s) => !!s.facts.impostor?.known && (!!s.facts.agent?.known || !!s.facts.charge?.known || !!s.facts.witness?.known) },
    { id: 'disarmed', judgment: 'responsible', competencies: ['analysis', 'tactical'], text: 'Took the false hostage’s means of harm away before the governor walked out.', flag: 'neutralised', regulation: 'care-1', safety: 'civilian', when: (s) => !!(s.flags.agentJammed || s.flags.agentRecalled || s.flags.triggerJammed || (s.flags.rookSecured && s.variant.extra?.impostor !== 'witness')) },
    { id: 'exposed-to-him', judgment: 'reckless', competencies: ['communications', 'ethics'], text: 'Told the governor that one of his hostages was a plant, and put her life in his hands.', flag: 'exposedToMallory', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.exposedToMallory },
    { id: 'false-claim', judgment: 'reckless', competencies: ['ethics'], text: 'Told the successor of a danger the crew had already found did not exist.', flag: 'falseClaim', regulation: 'honesty-1', when: (s) => !!s.flags.falseClaim },
    { id: 'protected-witness', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Offered a frightened witness the ISA’s protection before asking her for anything.', flag: 'offeredRookProtection', regulation: 'asylum-1', when: (s) => !!s.flags.offeredRookProtection && !!s.facts.witness?.known },
    { id: 'used-force', judgment: 'reckless', competencies: ['tactical', 'ethics'], text: 'Used force on the relay while a peaceful end was still possible.', flag: 'forceWhileTalking', regulation: 'roe-2', safety: 'civilian', when: (s) => !!s.flags.forceWhileTalking },
    { id: 'declined-force', judgment: 'principled', competencies: ['tactical', 'ethics'], text: 'Declined to storm the relay when urged to, and kept talking.', flag: 'declinedForce', regulation: 'roe-2', when: (s) => !!s.flags.declinedForce && !s.flags.forced },
  ],
  regulations: ['roe-2', 'care-1', 'honesty-1', 'asylum-1'],
  competencies: ['communications', 'analysis', 'ethics', 'diplomacy'],
  recommend: {
    communications: 'hearing what a person in crisis actually needs before asking anything of him',
    analysis: 'checking who people are before trusting what they say',
    ethics: 'keeping a promise of protection when it would be easier to hand someone over',
    diplomacy: 'giving a cornered man a way out that he can accept with his dignity',
  },
};
