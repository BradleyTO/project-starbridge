/**
 * After-action evaluation descriptor for Training Simulation 006, Ion Season.
 * Command challenge (roadmap): a judgment call on incomplete information (primary): choosing a
 * channel through each band when the model, the helmsman's feel, a probe and a hauler master's lore
 * are each partial; crew and civilian welfare (secondary): noticing that a master under escort is
 * unfit to fly the Maw, and doing something about it without humiliating them.
 * Pivotal officer: Ensign Adeyemi (Helm), whose feel for the water is right more often than the
 * model, and who will not always say so unless his captain asks.
 * Judged on what the captain knew when each decision was made (ISA-COM-001 §1.4), not on which
 * commands were typed or on luck: a blind crossing that happens to find calm water is still blind.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue only: care-1 (§4.1)
 * and roe-3 (§3.9). The handbook also cross-references this simulation from §1.4 and §4.5 for
 * training, without changing what the evaluator cites. ISA-COM-001 has no rule on acting when a
 * civilian master under escort is unfit to command in a hazard: that is the exercise objective
 * 'fitness' in outcome.ts, and a regulation is proposed for approval.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const ionEvaluation: EvaluationDescriptor = {
  version: 'ion-eval-1',
  objectives: { convoy: 'primary', crews: 'primary', halcyon: 'secondary', fitness: 'secondary' },
  endings: {
    'clear-water': { tier: 'success', note: 'Every band crossed in calm water, with both haulers in company.' },
    'the-lull': { tier: 'success', note: 'The convoy crossed the Maw in a lull the instruments could not see.' },
    'steady-hand': { tier: 'success', note: 'An unfit master was relieved or helped before the Maw, and the convoy came through together.' },
    weathered: { tier: 'success', note: 'Everyone came through, the hard way.' },
    'long-way-round': { tier: 'partial', note: 'The convoy turned back with every ship and crew; the station goes short.' },
    'crew-saved': { tier: 'partial', note: 'Every crew lived, but a hauler was left in the storm.' },
    'hauler-lost': { tier: 'failure', note: 'A hauler crew died in the storm.' },
    'dead-in-storm': { tier: 'failure', note: 'The Halcyon took on more charge than she could carry and went dark.' },
    'left-in-storm': { tier: 'failure', note: 'The Halcyon left the storm without the convoy.' },
    'held-in-season': { tier: 'failure', note: 'Time ran out at the edge of the storm.' },
  },
  markers: [
    { id: 'asked-the-helm', judgment: 'responsible', competencies: ['crew', 'analysis'], text: 'Asked the helmsman for his own read of the water, not only the model’s line.', flag: 'backedHelm', when: (s) => !!s.flags.backedHelm && !!s.flags.askedHelm },
    { id: 'heard-the-model', judgment: 'responsible', competencies: ['analysis'], text: 'Asked what the storm model showed, and how firm it was, before choosing a channel.', flag: 'askedModel', when: (s) => !!s.flags.askedModel },
    { id: 'tested-the-channel', judgment: 'responsible', competencies: ['analysis', 'exploration'], text: 'Sent something down a channel to find out, where the time could be spared.', flag: 'probed', when: (s) => !!s.flags.probed },
    { id: 'found-the-unfit', judgment: 'responsible', competencies: ['crew', 'emergency'], text: 'Found out that a master under escort was not fit to fly the Maw.', flag: 'foundUnfit', regulation: 'care-1', when: (s) => !!s.flags.foundUnfit },
    { id: 'steadied', judgment: 'responsible', competencies: ['crew', 'communications'], text: 'Saw that an unfit master did not have to fly the Maw: relieved by the mate, flown from the Halcyon or taken in tow.', flag: 'steadyAtMaw', regulation: 'care-1', when: (s) => !!s.flags.steadyAtMaw },
    { id: 'took-crew-off', judgment: 'responsible', competencies: ['emergency'], text: 'Took a crew off a hauler that had gone dark, before their air ran out.', flag: 'tookCrewOff', regulation: 'care-1', when: (s) => !!s.flags.tookCrewOff },
    { id: 'shielded-them', judgment: 'responsible', competencies: ['emergency'], text: 'Spread the Halcyon’s shields over the haulers for a crossing, and carried the charge herself.', flag: 'shieldedCrossing', when: (s) => !!s.flags.shieldedCrossing && !s.flags.halcyonDark },
    { id: 'kept-teague', judgment: 'responsible', competencies: ['communications'], text: 'Kept an impatient master with the convoy by talking to her.', flag: 'steadiedTeague', when: (s) => !!s.flags.steadiedTeague && !s.flags.teagueAlone },
    { id: 'bled-the-charge', judgment: 'responsible', competencies: ['crew', 'emergency'], text: 'Had the chief engineer run charge off the haulers through the Halcyon’s hull.', flag: 'discharged', when: (s) => !!s.flags.discharged && !s.flags.halcyonDark },
    { id: 'backed-the-helm', judgment: 'decisive', competencies: ['crew', 'analysis'], text: 'Crossed on the helmsman’s read where it disagreed with the model.', flag: 'wentWithGut', when: (s) => !!s.flags.wentWithGut },
    { id: 'waited-for-lull', judgment: 'decisive', competencies: ['analysis', 'emergency'], text: 'Held at the edge of a spate until the Maw went slack, then went.', flag: 'lullCrossed', when: (s) => !!s.flags.lullCrossed },
    { id: 'turned-back', judgment: 'principled', competencies: ['ethics', 'emergency'], text: 'Turned the convoy back with every crew alive rather than gamble them on the Maw.', flag: 'turnedBack', when: (s) => !!s.flags.turnedBack && !s.flags.crewLostAny },
    { id: 'blind-crossing', judgment: 'reckless', competencies: ['analysis'], text: 'Led the convoy across more than one band without asking anyone what lay in it.', when: (s) => (s.counters.blindCrossings ?? 0) >= 2 },
    { id: 'left-convoy', judgment: 'reckless', competencies: ['ethics', 'emergency'], text: 'Took the Halcyon out of the storm and left the convoy in it.', flag: 'leftStorm', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.leftStorm },
    { id: 'pushed-unfit', judgment: 'reckless', competencies: ['crew', 'ethics'], text: 'Knew a master was unfit to fly the Maw and led them into it anyway.', flag: 'pushedUnfit', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.pushedUnfit },
    { id: 'left-the-crew', judgment: 'reckless', competencies: ['emergency', 'ethics'], text: 'Moved on with a crew still aboard a hauler that had gone dark.', flag: 'leftTheCrew', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.leftTheCrew },
    { id: 'overcharged', judgment: 'reckless', competencies: ['emergency', 'crew'], text: 'Loaded the Halcyon with more charge than she could carry, and she went dark.', flag: 'halcyonDark', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.halcyonDark },
  ],
  regulations: ['care-1', 'roe-3'],
  competencies: ['analysis', 'crew', 'emergency', 'communications'],
  recommend: {
    analysis: 'asking every source what it knows, and how sure it is, before choosing; and knowing when a probe is worth the minute',
    crew: 'asking a quiet officer for his own read, and backing him when he gives it',
  },
};
