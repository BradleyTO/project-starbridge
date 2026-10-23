/**
 * v0.7 after-action evaluation descriptor for Training Simulation 004, Reactor Night.
 * Command challenge (roadmap): the engineer improvising (primary): Chief Okafor; leadership of a
 * frightened crew member (secondary): Crewman Paley, with Dr. Osei reading her fitness.
 * Judged on what the captain knew when each decision was made (ISA-COM-001 §1.4), not on which
 * commands were typed; a failed save is not by itself misconduct (§1.3).
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: care-2 (§4.2) and roe-3 (§3.9). The handbook also cross-references this simulation from §2.5
 * and §8.3 for training, without changing what the evaluator cites. There is no regulation on
 * choosing and recalling a crew member sent into unavoidable danger aboard ship: that is an
 * exercise objective ('hazard-duty') in outcome.ts, and a regulation is proposed for approval.
 * Fleet Engineering's request to keep the core is an exercise objective ('keep-core'), not a rule.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const reactorEvaluation: EvaluationDescriptor = {
  version: 'reactor-eval-1',
  objectives: { cascade: 'primary', crew: 'primary', diagnose: 'secondary', home: 'secondary', 'hazard-duty': 'secondary', 'keep-core': 'secondary' },
  endings: {
    'clean-save': { tier: 'success', note: 'The fault was found and fixed from inside the hull.' },
    'by-hand': { tier: 'success', note: 'A frightened crew member did the job on the spine and came home.' },
    'cold-bypass': { tier: 'success', note: 'The chief engineer improvised a way around the failure.' },
    'limped-home': { tier: 'success', note: 'The core was ejected with a jump stored, and the ship got home.' },
    'saved-at-cost': { tier: 'partial', note: 'The ship was saved, but crew were lost.' },
    'dead-in-space': { tier: 'partial', note: 'Everyone survived, but the ship was left with no way home.' },
    'last-ditch': { tier: 'failure', note: 'The core was ejected by the chief engineer on her own authority, at the last moment.' },
    'hard-jump': { tier: 'failure', note: 'The ship jumped with the cascade still running.' },
    stalemate: { tier: 'failure', note: 'Time ran out with the cascade slowed but not stopped.' },
    'halcyon-lost': { tier: 'failure', note: 'The core breached and the Halcyon was lost.' },
  },
  markers: [
    { id: 'diagnosed-first', judgment: 'responsible', competencies: ['engineering', 'analysis'], text: 'Let the chief engineer find the fault before committing to a fix.', flag: 'diagnosedBeforeFix', when: (s) => !!s.flags.diagnosedBeforeFix && !s.flags.wrongFixBlind },
    { id: 'fixed-blind', judgment: 'reckless', competencies: ['analysis', 'engineering'], text: 'Spent minutes on a fix before anyone knew what had failed, and it was the wrong one.', flag: 'wrongFixBlind', when: (s) => !!s.flags.wrongFixBlind },
    { id: 'improvised', judgment: 'decisive', competencies: ['engineering', 'resources'], text: 'Used the ship’s own systems in a way they were never meant to be used to buy time or stop the cascade.', flag: 'improvised', when: (s) => !!s.flags.improvised },
    { id: 'stored-a-jump', judgment: 'decisive', competencies: ['engineering', 'resources'], text: 'Charged the jump drive before ejecting the core, so the ship could still get home.', flag: 'storedJump', when: (s) => !!s.flags.storedJump || (!!s.flags.ejected && !!s.flags.jumped) },
    { id: 'steadied-first', judgment: 'responsible', competencies: ['crew'], text: 'Steadied a frightened crew member before sending her into danger.', flag: 'steadiedFirst', regulation: 'care-2', when: (s) => !!s.flags.steadiedFirst && !s.flags.pushedUnfit },
    { id: 'talked-through', judgment: 'responsible', competencies: ['crew', 'communications'], text: 'Talked a frozen crew member through it instead of abandoning her or the task.', flag: 'talkedThrough', when: (s) => !!s.flags.talkedThrough },
    { id: 'pushed-unfit', judgment: 'reckless', competencies: ['crew', 'ethics'], text: 'Ordered a crew member into danger after learning she was not fit to go.', flag: 'pushedUnfit', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.pushedUnfit },
    { id: 'ordered-panicked', judgment: 'reckless', competencies: ['crew'], text: 'Ordered a crew member out who had asked not to be sent, without finding out why.', flag: 'orderedPanicked', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.orderedPanicked && !s.flags.pushedUnfit },
    { id: 'brought-her-back', judgment: 'responsible', competencies: ['crew', 'emergency'], text: 'Brought a crew member back from the spine when staying out was costing more than the task was worth.', flag: 'paleyRecalled', regulation: 'care-2', when: (s) => !!s.flags.paleyRecalled || !!s.flags.paleyRelieved },
    { id: 'asked-the-doctor', judgment: 'responsible', competencies: ['crew', 'analysis'], text: 'Asked the medical officer whether a crew member was fit before relying on her.', flag: 'oseiAssessed', when: (s) => !!s.flags.oseiAssessed && !s.flags.pushedUnfit },
    { id: 'crew-before-core', judgment: 'principled', competencies: ['ethics', 'crew'], text: 'Put the crew ahead of a request from Fleet Engineering to keep the core.', flag: 'ejectedDespitePressure', when: (s) => (!!s.flags.ejectedDespitePressure || !!s.flags.declinedSalvage) && !s.flags.lastDitch },
    { id: 'pod-crew-lost', judgment: 'reckless', competencies: ['crew', 'emergency'], text: 'A crew member sent out on the reactor spine did not come back.', safety: 'crew', regulation: 'roe-3', when: (s) => !!s.flags.paleyLost },
    { id: 'left-to-the-chief', judgment: 'reckless', competencies: ['emergency'], text: 'Left the decision to eject to the chief engineer, seconds from breach.', safety: 'crew', regulation: 'roe-3', when: (s) => !!s.flags.lastDitch || (!!s.flags.breach && !s.flags.ejectOrdered) },
    { id: 'jumped-hot', judgment: 'reckless', competencies: ['engineering', 'emergency'], text: 'Jumped with the core still running away.', safety: 'crew', regulation: 'roe-3', when: (s) => s.outcome?.id === 'hard-jump' },
  ],
  regulations: ['care-2', 'roe-3'],
  competencies: ['engineering', 'crew', 'emergency', 'analysis'],
  recommend: {
    engineering: 'giving the chief engineer the time and the information to find a fault before acting on a guess',
    crew: 'finding out how a crew member is before sending her into danger, and bringing her back when it stops being worth it',
  },
};
