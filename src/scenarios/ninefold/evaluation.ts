/**
 * v0.7 after-action evaluation descriptor for Training Simulation 021, The Ninefold Lock.
 * Command challenge (roadmap): deduction and reasoning from incomplete evidence (primary); timing,
 * against the survey team's air (secondary). Pivotal officer: Lt. Cmdr. Rask (Tactical), who reads
 * Directorate doctrine and glyphs and says how far the evidence goes. Judged on what was known at the
 * time (ISA-COM-001 §1.4, cmd-4): a guess that happened to be right is still a guess.
 *
 * Regulations cited are existing ISA-COM-001 ids only, and only ones the evaluator carries:
 * care-2 (§4.2, crew shall not be sent into avoidable danger), roe-2 (§3.1, force only while
 * reasonable peaceful alternatives are not available), roe-3 (§3.9, the ship and crew are not exposed
 * to avoidable risk) and honesty-1 (§6.1, honest dealing on the record). The handbook also links this
 * simulation, as a hidden training reference only, to cmd-4 (§1.4).
 *
 * Exercise objectives, training goals and not law (§1.8, service-1): "establish what the depot's guns
 * answer to before taking the ship or a crew within their reach" and "resolve it without force against
 * the depot". No existing regulation covers damage to another power's property; a regulation is
 * proposed in the report, not added here.
 *
 * The reckless/responsible pair: the same success ending (Through the Gap) reached by establishing
 * what the Watch answers to from the team's account and the shuttle's log, approaching accordingly,
 * watching the screen and timing the transporter to a gap (responsible), against a run that took the
 * ship in blind on a standard approach and hammered the screen once before timing the beam (reckless:
 * it worked because the seed allowed it, not because anyone knew it would).
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

const won = (s: { flags: Record<string, boolean | undefined> }) => !!(s.flags.endKeystone || s.flags.endGap || s.flags.endMakers || s.flags.endCut);

export const ninefoldEvaluation: EvaluationDescriptor = {
  version: 'ninefold-eval-1',
  objectives: { team: 'primary', watch: 'primary', force: 'secondary', tran: 'secondary' },
  endings: {
    keystone: { tier: 'success', note: "The keystone's question was answered from the depot's own evidence and the whole lock stood down." },
    gap: { tier: 'success', note: "The transporter was timed to a gap in the screen that had been observed, not guessed." },
    makers: { tier: 'success', note: "The lock was stood down by the power that built it, and nothing was fired or taken." },
    cut: { tier: 'success', note: "A cutting team was landed in a way the guns did not answer to, and cut the team out." },
    cost: { tier: 'partial', note: 'The team came out, but lives, the ship or the rescuers paid for what was not known in time.' },
    forced: { tier: 'partial', note: "The team came out after the ship fired on another power's installation." },
    lost: { tier: 'failure', note: "The team's air ran out before the lock was opened." },
    abandoned: { tier: 'failure', note: 'The ship left with the team still sealed inside.' },
    incident: { tier: 'failure', note: "The ship fired on another power's vessel." },
    detained: { tier: 'failure', note: "The team ended in another power's custody because the ship never dealt with it." },
  },
  markers: [
    { id: 'established-watch', judgment: 'responsible', competencies: ['analysis', 'crew'], text: 'Established what the guns answered to before taking the ship within their reach.', flag: 'approachedKnown', regulation: 'roe-3', when: (s) => !!s.flags.approachedKnown },
    { id: 'probed-first', judgment: 'responsible', competencies: ['analysis', 'scientific'], text: 'Sent a probe to test the guns before risking the ship or a crew.', flag: 'probedFirst', when: (s) => !!s.flags.probedFirst },
    { id: 'approached-blind', judgment: 'reckless', competencies: ['analysis', 'tactical'], text: 'Took the ship inside the guns’ reach under power without knowing what they answered to.', flag: 'approachedBlind', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.approachedBlind },
    { id: 'under-guns', judgment: 'reckless', competencies: ['tactical', 'crew'], text: 'Kept the ship within reach of guns that were firing on her.', flag: 'underGuns', regulation: 'roe-3', safety: 'crew', when: (s) => (s.counters.hits ?? 0) >= 2 },
    { id: 'hammered-screen', judgment: 'reckless', competencies: ['analysis', 'engineering'], text: 'Forced the transporter against the screen instead of waiting to learn its cycle.', flag: 'hammered', when: (s) => !!s.flags.hammered },
    { id: 'timed-on-evidence', judgment: 'decisive', competencies: ['analysis', 'emergency'], text: 'Timed the transporter to a gap in the screen that had been observed.', flag: 'timedOnEvidence', when: (s) => !!s.flags.timedOnEvidence && !!s.flags.gapBeam },
    { id: 'answered-on-evidence', judgment: 'decisive', competencies: ['analysis', 'exploration'], text: "Answered the keystone's question from what the depot itself showed.", flag: 'answeredOnEvidence', when: (s) => !!s.flags.answeredOnEvidence },
    { id: 'guessed-keystone', judgment: 'reckless', competencies: ['analysis'], text: "Answered the keystone's question without the evidence to answer it.", flag: 'guessedKeystone', when: (s) => !!s.flags.guessedKeystone },
    { id: 'sent-team-blind', judgment: 'reckless', competencies: ['crew', 'analysis'], text: 'Sent a cutting team onto the pad without knowing what the guns answered to.', flag: 'sentTeamBlind', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.sentTeamBlind },
    { id: 'overrode-cut-warning', judgment: 'reckless', competencies: ['crew'], text: 'Sent the cutting team in a way the guns were known to fire on.', flag: 'overrodeCutWarning', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.overrodeCutWarning && !!s.flags.rescueHurt },
    { id: 'stabilised', judgment: 'responsible', competencies: ['crew', 'emergency'], text: 'Had the doctor talk the team through treating their wounded while the rescue was worked out.', flag: 'stabilised', when: (s) => !!s.flags.stabilised },
    { id: 'fired-on-depot', judgment: 'reckless', competencies: ['ethics', 'tactical'], text: "Fired on another power's installation while peaceful alternatives remained.", flag: 'firedOnDepot', regulation: 'roe-2', when: (s) => !!s.flags.firedOnDepot },
    { id: 'asked-the-makers', judgment: 'decisive', competencies: ['diplomacy', 'communications'], text: 'Asked the power that built the lock to stand it down.', flag: 'askedMakers', when: (s) => !!s.flags.askedMakers && !s.flags.liedKovar },
    { id: 'honest-account', judgment: 'responsible', competencies: ['ethics', 'diplomacy'], text: 'Gave the Directorate an honest account of what the team had been doing.', flag: 'honestKovar', regulation: 'honesty-1', when: (s) => !!s.flags.honestKovar && !s.flags.liedKovar },
    { id: 'lied-to-directorate', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Lied to the Directorate about what the team had been doing.', flag: 'liedKovar', regulation: 'honesty-1', when: (s) => !!s.flags.liedKovar },
    { id: 'held-fire', judgment: 'principled', competencies: ['ethics', 'crew'], text: 'Kept force out of it and sent nobody in blind, even when the team could not be reached in time.', flag: 'endLost', regulation: 'roe-2', when: (s) => !!s.flags.endLost && !s.flags.firedOnDepot && !s.flags.sentTeamBlind && !s.flags.approachedBlind && !won(s) },
  ],
  regulations: ['care-2', 'roe-2', 'roe-3', 'honesty-1'],
  competencies: ['analysis', 'crew', 'emergency', 'diplomacy'],
  recommend: {
    analysis: 'reasoning from what the evidence shows and saying how far it goes before acting',
    crew: 'establishing a hazard’s rules before sending anyone into it',
    emergency: 'working against a clock without trading certainty for speed',
    diplomacy: 'dealing honestly with another power whose help is needed',
  },
};
