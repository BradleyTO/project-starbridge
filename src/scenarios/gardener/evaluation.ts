/**
 * v0.7 after-action evaluation descriptor for Training Simulation 010, The Gardener.
 * Command challenge (roadmap): restraint (primary): not destroying an unknown growth that has
 * hurt no one, and holding a frightened Claimwarden's charges back until the facts are in;
 * relying on the science officer (secondary): letting Lt. Varga establish, step by step, whether
 * it is alive, what draws it and what fire would do, and acting on what she finds rather than on a
 * guess. Pivotal officer: Lt. Varga (Science). Judged on what the captain knew when each decision
 * was made (ISA-COM-001 §1.4), not on which commands were typed or in what order.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: care-1 (§4.1), care-2 (§4.2), roe-3 (§3.9) and honesty-1 (§6.1). The handbook also links this
 * simulation, as a hidden training reference, from health-1 (§8.1) and cmd-4 (§1.4), without changing
 * what the evaluator cites. ISA-COM-001 has no rule against destroying an unknown, possibly living
 * growth before it is understood: that is an exercise objective ('know') in outcome.ts, and a
 * regulation is proposed for approval.
 *
 * The reckless/responsible pair: the same lure that leads the growth away, laid after Varga's
 * study and a probe sample with the Claimwarden held (responsible), against the same lure laid on
 * a guess after ordering the growth burned and a bare sample brought aboard (reckless). Same
 * ending, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const gardenerEvaluation: EvaluationDescriptor = {
  version: 'gardener-eval-1',
  objectives: { claims: 'primary', life: 'primary', know: 'secondary', safe: 'secondary', word: 'secondary' },
  endings: {
    'led-away': { tier: 'success', note: 'A lure matched to what draws the growth led it away from the claims, and nothing died.' },
    'a-line': { tier: 'success', note: 'Knowing the growth spreads only by touch, the link to the claims was cut instead of the growth.' },
    'proven-stone': { tier: 'success', note: 'The science officer proved the growth was not alive before it was cut out.' },
    dormant: { tier: 'success', note: 'Darkening the claims sent a light-drawn growth dormant without harming it.' },
    'right-by-luck': { tier: 'partial', note: 'The growth was burned blind; it happened to be only crystal.' },
    overrun: { tier: 'partial', note: 'Nothing was harmed, but the growth reached the claims while nothing was decided.' },
    scorched: { tier: 'failure', note: 'The Halcyon destroyed a living organism that had harmed no one.' },
    'miners-burn': { tier: 'failure', note: 'The miners burned a living organism the Halcyon could have saved.' },
    seeded: { tier: 'failure', note: 'Burning a sporing growth scattered it across the whole field.' },
    'hull-grown': { tier: 'failure', note: 'The growth reached the Halcyon itself after a warning was ignored.' },
    'left-field': { tier: 'failure', note: 'The Halcyon left the miners alone with an unknown hazard.' },
    'field-incident': { tier: 'failure', note: 'Weapons were fired in a field full of civilians.' },
  },
  markers: [
    { id: 'studied-first', judgment: 'responsible', competencies: ['scientific', 'crew'], text: 'Had the science officer study the growth before ordering anything done to it.', flag: 'studiedFirst', when: (s) => !!s.flags.studiedFirst },
    { id: 'held-the-charges', judgment: 'responsible', competencies: ['diplomacy', 'emergency'], text: 'Persuaded the Claimwarden to hold her charges while the growth was studied.', flag: 'crakeHeld', regulation: 'care-1', when: (s) => !!s.flags.crakeHeld },
    { id: 'shared-the-evidence', judgment: 'principled', competencies: ['communications', 'ethics'], text: 'Told the miners what the science officer had actually established, and no more.', flag: 'evidenceShared', regulation: 'honesty-1', when: (s) => !!s.flags.evidenceShared && !s.flags.overstated && !s.flags.claimedBlind },
    { id: 'safe-sample', judgment: 'responsible', competencies: ['scientific', 'crew'], text: 'Took a sample by probe, in barrier protection or into isolation, never bare.', flag: 'sampled', regulation: 'care-2', when: (s) => !!s.flags.sampled },
    { id: 'lure-on-evidence', judgment: 'decisive', competencies: ['engineering', 'scientific'], text: 'Baited the lure with what the science officer found the growth was drawn to.', flag: 'lureOnEvidence', when: (s) => !!s.flags.lureOnEvidence },
    { id: 'dim-on-evidence', judgment: 'decisive', competencies: ['scientific', 'resources'], text: 'Had the station put its lights out once the growth was known to grow toward light.', flag: 'dimOnEvidence', when: (s) => !!s.flags.dimOnEvidence },
    { id: 'heeded-the-reach', judgment: 'responsible', competencies: ['tactical', 'scientific'], text: 'Moved the Halcyon out of the growth’s reach when the science officer warned it was coming.', flag: 'reachEased', regulation: 'roe-3', when: (s) => !!s.flags.reachEased },
    { id: 'burn-before-study', judgment: 'reckless', competencies: ['ethics', 'scientific'], text: 'Ordered the growth burned before anyone had begun to find out what it was.', flag: 'burnBeforeStudy', when: (s) => !!s.flags.burnBeforeStudy },
    { id: 'burned-blind', judgment: 'reckless', competencies: ['ethics', 'scientific'], text: 'Destroyed the growth without knowing whether it was alive.', flag: 'burnedBlind', when: (s) => !!s.flags.burnedBlind },
    { id: 'burned-alive', judgment: 'reckless', competencies: ['ethics', 'exploration'], text: 'Destroyed the growth knowing it was alive and had harmed no one.', flag: 'burnedKnowingAlive', regulation: 'care-1', when: (s) => !!s.flags.burnedKnowingAlive },
    { id: 'permitted-burn', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Told the miners to go ahead and burn it.', flag: 'permittedBurn', when: (s) => !!s.flags.permittedBurn },
    { id: 'bare-sample', judgment: 'reckless', competencies: ['crew', 'scientific'], text: 'Ordered an uncontained sample brought aboard.', flag: 'orderedAboard', regulation: 'care-2', when: (s) => !!s.flags.orderedAboard },
    { id: 'unprotected-team', judgment: 'reckless', competencies: ['crew', 'emergency'], text: 'Ordered a team across to the growth without barrier protection.', flag: 'orderedUnprotected', regulation: 'care-2', when: (s) => !!s.flags.orderedUnprotected },
    { id: 'hull-reached', judgment: 'reckless', competencies: ['tactical', 'scientific'], text: 'Kept the Halcyon in the growth’s path after being warned it was reaching for her.', flag: 'endHull', regulation: 'roe-3', when: (s) => !!s.flags.endHull },
    { id: 'overstated', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Told the miners something about the growth the science officer had not established.', flag: 'overstated', regulation: 'honesty-1', when: (s) => !!s.flags.overstated || !!s.flags.claimedBlind },
    { id: 'promise-broken', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Promised the Claimwarden her claims would be kept, and did not keep them.', flag: 'promiseBroken', regulation: 'honesty-1', when: (s) => !!s.flags.promiseBroken },
    { id: 'left-them', judgment: 'reckless', competencies: ['emergency', 'ethics'], text: 'Left the field with the miners still facing the growth alone.', flag: 'endLeft', when: (s) => !!s.flags.endLeft },
  ],
  regulations: ['care-1', 'care-2', 'roe-3', 'honesty-1'],
  competencies: ['scientific', 'ethics', 'diplomacy', 'crew'],
  recommend: {
    scientific: 'letting the science officer establish what a thing is before deciding what to do about it',
    ethics: 'holding back from destroying what has harmed no one while the facts are still coming in',
    diplomacy: 'keeping frightened civilians from acting before the bridge does',
    crew: 'keeping the crew out of a hazard nobody yet understands',
  },
};
