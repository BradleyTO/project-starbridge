/**
 * v0.7 after-action evaluation descriptor for Training Simulation 018, The Weather Engine.
 * Command challenge (roadmap): the comms officer cracking a code (primary): trusting Lt. Szabo's
 * reading of a dead man's lock over the colony's certainty, winning the papers it needs, and never
 * spending one of its few answers on a guess; timing (secondary): the storm's landfall, and getting
 * the colony under cover while the work goes on. Pivotal officer: Lt. Szabo (Comms). Judged on what
 * was known at the time (ISA-COM-001 §1.4).
 *
 * Regulations cited are existing ISA-COM-001 ids only, and only ones the evaluator carries:
 * care-1 (§4.1), care-2 (§4.2) and honesty-1 (§6.1). The handbook also links this simulation, as a
 * hidden training reference, from general-1 (§1.5), cmd-3 (§2.5), honesty-1 (§6.1) and
 * contact-2 (§9.3); contact-2 is not in the evaluator's catalogue, so the no-leave marker carries
 * no regulation.
 * Having the communications officer read the lock and vouch for a key before anything is entered
 * is an exercise objective ('cipher') in outcome.ts, not a regulation: no First Edition subsection
 * speaks to it, and §1.8 says exercise objectives are not law. No new regulation is proposed.
 *
 * The reckless/responsible pair: the same success ending (The Founder's Key) reached by having
 * Szabo read the lock, winning the right papers and entering only the key she vouches for, with the
 * colony told to shelter early (responsible), against a run that entered the Steward's motto before
 * the lock was read and never told anyone to take cover (reckless: a wrong answer spent on a guess,
 * and civilians left in the open on the hope that the lock would open).
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const weatherEvaluation: EvaluationDescriptor = {
  version: 'weather-eval-1',
  objectives: { storm: 'primary', engine: 'primary', cipher: 'secondary', shelter: 'secondary' },
  endings: {
    'founders-key': { tier: 'success', note: 'The communications officer rebuilt the founder’s key and the storm was broken before landfall.' },
    'daughters-hand': { tier: 'success', note: 'The founder’s daughter gave what only she knew, and the storm was broken before landfall.' },
    override: { tier: 'success', note: 'Engineering overrode the lock around a failsafe the communications officer had mapped, in time to break the storm.' },
    'half-storm': { tier: 'partial', note: 'The Engine was opened too late to break the storm, only to blunt it.' },
    sheltered: { tier: 'partial', note: 'The Engine never turned, but every colonist was under cover at landfall.' },
    'sealed-for-good': { tier: 'failure', note: 'Too many wrong answers sealed the Engine for good, and the storm made landfall.' },
    failsafe: { tier: 'failure', note: 'An override cut through the founder’s failsafe and killed the Engine.' },
    greywall: { tier: 'failure', note: 'The storm made landfall with colonists still in the open.' },
    scar: { tier: 'failure', note: 'The Engine’s core was burned out; the storm broke and the valley was poisoned for years.' },
    abandoned: { tier: 'failure', note: 'The Halcyon left the colony with the storm still building.' },
  },
  markers: [
    { id: 'read-first', judgment: 'responsible', competencies: ['communications', 'analysis'], text: 'Had the communications officer read the lock before any answer was given to it.', flag: 'lockRead', when: (s) => !!s.flags.lockRead && (!s.flags.anyEntry || !!s.flags.lockReadBeforeEntry) && !s.flags.blindOverride },
    { id: 'trusted-szabo', judgment: 'decisive', competencies: ['communications', 'crew'], text: 'Entered only the key the communications officer would stand behind, and it opened the Engine.', flag: 'enteredVouched', when: (s) => !!s.flags.enteredVouched && !s.flags.guessedKey },
    { id: 'heard-the-colony-out', judgment: 'responsible', competencies: ['communications', 'diplomacy'], text: 'Weighed the colony’s certainty about the key against the officer’s reading, and told the Steward why.', flag: 'tullAcceptsSzabo', when: (s) => !!s.flags.tullAcceptsSzabo },
    { id: 'guessed', judgment: 'reckless', competencies: ['communications', 'analysis'], text: 'Spent one of the lock’s few answers on a key nobody could vouch for.', flag: 'guessedKey', regulation: 'care-1', when: (s) => !!s.flags.guessedKey && !(s.flags.gambledLine && !s.flags.enteredMotto && !s.flags.enteredUnvouched && !s.flags.gambledLastTry) },
    { id: 'gambled-last', judgment: 'reckless', competencies: ['analysis'], text: 'Gambled the lock’s last answer on one of two lines when the officer could have narrowed it.', flag: 'gambledLastTry', regulation: 'care-1', when: (s) => !!s.flags.gambledLastTry && !s.flags.askedToVerify },
    { id: 'overrode-officer', judgment: 'reckless', competencies: ['communications', 'crew'], text: 'Overrode the communications officer’s reading of which papers the key was built from.', flag: 'wrongSourceInsisted', when: (s) => !!s.flags.wrongSourceInsisted },
    { id: 'sheltered-early', judgment: 'responsible', competencies: ['emergency', 'resources'], text: 'Put the colony under cover early, while the work on the lock went on.', flag: 'shelterEarly', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.shelterEarly },
    { id: 'no-shelter', judgment: 'reckless', competencies: ['emergency'], text: 'Left the colonists in the open on the hope that the lock would open in time.', flag: 'shelterOrdered', regulation: 'care-1', safety: 'civilian', when: (s) => !s.flags.shelterOrdered && !s.flags.shuttles && !s.flags.endAbandoned && !s.flags.endScar && (!s.flags.engineRunning || (s.counters.runAt ?? 0) > Number(s.variant.extra?.landfall ?? 99) - 6) },
    { id: 'honest-with-daughter', judgment: 'responsible', competencies: ['diplomacy', 'ethics'], text: 'Won the founder’s daughter over with the truth rather than with promises.', flag: 'maritPersuaded', regulation: 'honesty-1', when: (s) => !!s.flags.maritPersuaded && !s.flags.falsePromise },
    { id: 'false-word', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Told the founder’s daughter the colony had said or promised something it had not.', flag: 'falsePromise', regulation: 'honesty-1', when: (s) => !!s.flags.falsePromise },
    { id: 'mapped-override', judgment: 'decisive', competencies: ['engineering', 'communications'], text: 'Sent Engineering into the control trunk only once the failsafe had been mapped.', flag: 'overrideStarted', when: (s) => !!s.flags.overrideStarted },
    { id: 'blind-override', judgment: 'reckless', competencies: ['engineering'], text: 'Ordered a blind override through a known failsafe against the Chief Engineer’s warning.', flag: 'blindOverride', regulation: 'care-2', when: (s) => !!s.flags.blindOverride },
    { id: 'no-leave', judgment: 'reckless', competencies: ['diplomacy', 'ethics'], text: 'Cut into or destroyed the colony’s Engine without the colony’s leave.', flag: 'noLeave', when: (s) => !!s.flags.noLeave },
    { id: 'would-not-burn', judgment: 'principled', competencies: ['ethics', 'emergency'], text: 'Refused to burn out the Engine while people were still inside it, even with the storm coming.', flag: 'declinedBurn', regulation: 'care-1', when: (s) => !!s.flags.declinedBurnOccupied && !s.flags.burned },
    { id: 'burn-with-people', judgment: 'reckless', competencies: ['ethics', 'emergency'], text: 'Ordered the Engine burned out while people were still inside it.', flag: 'burnRefusedOccupied', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.burnRefusedOccupied },
  ],
  regulations: ['care-1', 'care-2', 'honesty-1'],
  competencies: ['communications', 'analysis', 'emergency', 'diplomacy'],
  recommend: {
    communications: 'trusting the communications officer’s reading of a code over the certainty of the people around it',
    analysis: 'treating a lock that counts wrong answers as a resource, not a guessing game',
    emergency: 'putting civilians under cover while a better solution is still being worked',
    diplomacy: 'winning help from someone with a grievance by dealing honestly with it',
  },
};
