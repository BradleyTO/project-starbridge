/**
 * v0.7 after-action evaluation descriptor for Training Simulation 009, The Long Picket.
 * Command challenge (roadmap): bluffing and negotiation under a clock (primary): getting a cargo
 * through another power's picket in disputed space with words alone, choosing a lawful ruse (the
 * Halcyon's strength, company or intentions) that this commander will believe, or a face-saving
 * bargain he can put in his log; honesty (secondary): knowing where a bluff must stop (no feigned
 * mercy run, no false records, no lie about lives) and keeping the word given. Pivotal officer:
 * Cmdr. Marrow (First Officer), who knew the picket's commander at the Academy and can read him.
 * Judged on what the captain knew when each decision was made (ISA-COM-001 §1.4), not on which
 * commands were typed or in what order.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: honesty-1 (§6.1) and roe-2 (§3.1). The handbook also links this simulation, as a hidden training
 * reference, from conduct-1 (§6.2/§6.3) and contact-3 (§9.6), without changing what the evaluator cites.
 * ISA-COM-001 has no rule on running another power's picket line in disputed space: that is an
 * exercise objective ('line') in outcome.ts, and a regulation is proposed for approval.
 *
 * The reckless/responsible pair: the same escort bluff that gets the Halcyon through, made after
 * Cmdr. Marrow's read of the commander (responsible), against the same bluff made blind with the
 * Halcyon's weapons locked on the picket (reckless). Same ending, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const picketEvaluation: EvaluationDescriptor = {
  version: 'picket-eval-1',
  objectives: { deliver: 'primary', claim: 'primary', line: 'secondary', ruse: 'secondary', word: 'secondary' },
  endings: {
    'bluffed-pass': { tier: 'success', note: 'A lawful bluff about the Halcyon’s company or resolve moved the picket aside.' },
    'face-saved': { tier: 'success', note: 'A bargain the picket commander could put in his log got the Halcyon through, and both sides kept their word.' },
    'old-acquaintance': { tier: 'success', note: 'The first officer’s old standing with the picket commander opened the line.' },
    inspected: { tier: 'success', note: 'An inspection or plain proof of the cargo cleared the Halcyon without conceding the claim.' },
    'broken-blockade': { tier: 'partial', note: 'The assemblies arrived, but the Halcyon ran another power’s line to deliver them.' },
    'false-flag': { tier: 'failure', note: 'The Halcyon passed by feigning a humanitarian purpose, a ruse the Code forbids.' },
    incident: { tier: 'failure', note: 'Shots or a collision in disputed space ended the exercise.' },
    impounded: { tier: 'failure', note: 'The cargo was handed into the picket’s custody.' },
    'colony-dark': { tier: 'failure', note: 'The colony had to shut its reactor down before the Halcyon got through.' },
    'turned-back': { tier: 'failure', note: 'The Halcyon left the Narrows with the cargo still aboard.' },
  },
  markers: [
    { id: 'read-first', judgment: 'responsible', competencies: ['analysis', 'crew'], text: 'Asked the first officer for her read of the picket commander before trying a bluff on him.', flag: 'readFirst', when: (s) => !!s.flags.readFirst },
    { id: 'lawful-bluff', judgment: 'decisive', competencies: ['diplomacy', 'communications'], text: 'Got through with a lawful ruse about the Halcyon’s own company or intentions.', flag: 'pass_bluff', when: (s) => !!s.flags.pass_bluff },
    { id: 'face-saving-deal', judgment: 'decisive', competencies: ['diplomacy', 'resources'], text: 'Offered the picket commander a bargain he could log, and kept to it.', flag: 'pass_deal', when: (s) => !!s.flags.pass_deal && !s.flags.dealBroken },
    { id: 'courtesy-inspection', judgment: 'responsible', competencies: ['diplomacy', 'ethics'], text: 'Allowed an inspection as a courtesy, without conceding the claim to the Narrows.', flag: 'courtesy', when: (s) => !!s.flags.courtesy && !!s.flags.inspectionAllowed },
    { id: 'listened-in', judgment: 'responsible', competencies: ['analysis', 'communications'], text: 'Had the picket’s own traffic read to learn what his orders really were.', flag: 'intercepted', when: (s) => !!s.flags.intercepted },
    { id: 'checked-the-clock', judgment: 'responsible', competencies: ['analysis', 'engineering'], text: 'Had the chief engineer check the colony’s real deadline against its reactor telemetry.', flag: 'telemetryRead', when: (s) => !!s.flags.telemetryRead },
    { id: 'told-the-truth', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Told the picket commander plainly what the cargo was and who it was for.', flag: 'toldTruth', regulation: 'honesty-1', when: (s) => !!s.flags.toldTruth && !s.flags.falseFlag && !s.flags.overstated },
    { id: 'kept-word', judgment: 'principled', competencies: ['ethics', 'diplomacy'], text: 'Kept the promise made to the picket to the last minute, even when the colony’s time ran out.', flag: 'keptWordToTheEnd', regulation: 'honesty-1', when: (s) => !!s.flags.keptWordToTheEnd },
    { id: 'false-mercy', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Claimed a mercy run the Halcyon was not on, a ruse the Code forbids.', flag: 'falseFlag', regulation: 'honesty-1', when: (s) => !!s.flags.falseFlag },
    { id: 'overstated-lives', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Told the picket that people would die, after learning that the colony could survive a shutdown.', flag: 'overstated', regulation: 'honesty-1', when: (s) => !!s.flags.overstated },
    { id: 'false-records', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Ordered the ship’s records altered or false traffic sent to the ISA’s own people.', flag: 'orderedRuse', regulation: 'honesty-1', when: (s) => !!s.flags.forgeOrdered || (!!s.flags.orderedRuse && !s.flags.falseFlag) },
    { id: 'broke-deal', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Ran the line while an agreement with the picket was still in force.', flag: 'dealBroken', regulation: 'honesty-1', when: (s) => !!s.flags.dealBroken },
    { id: 'ran-the-line', judgment: 'reckless', competencies: ['tactical', 'diplomacy'], text: 'Ran another power’s picket line in disputed space while a peaceful way through remained.', flag: 'ran', regulation: 'roe-2', when: (s) => !!s.flags.ran },
    { id: 'tractored-picket', judgment: 'reckless', competencies: ['tactical', 'diplomacy'], text: 'Put a tractor beam on the picket ship.', flag: 'tractoredPicket', regulation: 'roe-2', when: (s) => !!s.flags.tractoredPicket },
    { id: 'turned-back', judgment: 'reckless', competencies: ['emergency', 'ethics'], text: 'Turned back from the Narrows with the colony’s reactor assemblies still aboard.', flag: 'endTurned', when: (s) => !!s.flags.endTurned },
  ],
  regulations: ['honesty-1', 'roe-2'],
  competencies: ['diplomacy', 'communications', 'analysis', 'ethics'],
  recommend: {
    diplomacy: 'reading the commander across the line and offering him something he can accept',
    communications: 'choosing which officer delivers which message, and when',
    analysis: 'finding out what the other side knows and what his orders really say before bluffing',
    ethics: 'knowing which ruses the Code allows, and keeping the word given',
  },
};
