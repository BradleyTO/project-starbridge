/**
 * v0.7 after-action evaluation descriptor for Training Simulation 011, Coldwater.
 * Command challenge (roadmap): crew conflict and leadership (primary): bringing back a watch that has
 * stopped work after a death it believes was covered up, without forcing it, splitting the crew or
 * buying it off with a name; accountability (secondary): finding out what was really done to the
 * valve, hearing the people involved before any finding, and telling the crew and the ISA the
 * truth, including the uncomfortable part. Pivotal officer: Chief Okafor (Engineering), whose plant
 * record is the proof and who is torn between her people and the chain of command. Judged on what
 * the captain knew when each decision was made (ISA-COM-001 §1.4), not on which commands were typed.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: care-1 (§4.1), care-2 (§4.2), roe-3 (§3.9) and honesty-1 (§6.1). The handbook also links this
 * simulation, as a hidden training reference, from orders-1 (§5.8–5.10), conduct-2 (§6.4) and
 * service-3 (§10.2), without changing what the evaluator cites. ISA-COM-001 has no rule requiring a
 * death aboard to be investigated and its findings shared with the crew: that is an exercise
 * objective ('truth') in outcome.ts, and a regulation is proposed for approval.
 *
 * The reckless/responsible pair: the same ending (The Whole Truth), reached by pulling the plant
 * record, inspecting first, hearing the supervisor and telling the watch (responsible), against
 * threatening the watch, relieving the right person on a rumour without hearing him, and pressing
 * for an uninspected restart before doing the same (reckless). Same ending, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const coldwaterEvaluation: EvaluationDescriptor = {
  version: 'coldwater-eval-1',
  objectives: { station: 'primary', crew: 'primary', truth: 'secondary', safe: 'secondary', word: 'secondary' },
  endings: {
    'truth-told': { tier: 'success', note: 'The facts were established, the people involved were heard, and the watch was told all of it.' },
    'open-inquiry': { tier: 'success', note: 'The death went to an independent review on an honest account, and the watch went back to work while it runs.' },
    'terms-kept': { tier: 'success', note: 'Terms the watch could hold the bridge to were offered and kept.' },
    'captains-watch': { tier: 'success', note: 'Once the plant was proved safe, the captain led the watch back into it in person.' },
    divided: { tier: 'partial', note: 'The plant was restarted without the striking watch: the station was saved and the crew was split.' },
    stalemate: { tier: 'partial', note: 'The station’s people were safe, but nothing between the bridge and the watch was settled.' },
    'put-down': { tier: 'failure', note: 'The watch was removed by force rather than led back.' },
    'second-death': { tier: 'failure', note: 'The plant was restarted before the sister valve was inspected, and it failed the same way.' },
    whitewash: { tier: 'failure', note: 'The matter was closed on a falsified log.' },
    scapegoat: { tier: 'failure', note: 'The watch was brought back by blaming someone who did not do it.' },
    'station-dark': { tier: 'failure', note: 'The station’s batteries ran out with its people still on it.' },
    'left-orbit': { tier: 'failure', note: 'The Halcyon left with the station on batteries and the crew divided.' },
    'shots-fired': { tier: 'failure', note: 'Weapons were fired with no threat present.' },
  },
  markers: [
    { id: 'pulled-record', judgment: 'responsible', competencies: ['analysis', 'engineering'], text: 'Had the Chief pull the plant’s own sensor record instead of arguing over the log.', flag: 'pulledRecord', when: (s) => !!s.flags.pulledRecord },
    { id: 'inspected-first', judgment: 'responsible', competencies: ['crew', 'engineering'], text: 'Had the sister valve inspected before anyone went back into the plant.', flag: 'inspectionOrdered', regulation: 'care-2', when: (s) => !!s.facts.sister?.known && !s.flags.restartUninspected },
    { id: 'went-down', judgment: 'responsible', competencies: ['crew', 'emergency'], text: 'Went down to engineering and faced the watch in person.', flag: 'wentDown', when: (s) => !!s.flags.wentDown },
    { id: 'acknowledged', judgment: 'responsible', competencies: ['crew'], text: 'Acknowledged the man who died, and the watch’s grief, face to face.', flag: 'ackInPerson', when: (s) => !!s.flags.ackInPerson },
    { id: 'heard-first', judgment: 'responsible', competencies: ['crew', 'ethics'], text: 'Heard the officer involved, with the evidence in hand, before relieving him.', flag: 'relieved', when: (s) => (!!s.flags.relieved_penhale || !!s.flags.relieved_corley) && !s.flags.relievedUnheard && !s.flags.relievedOnRumour && !s.flags.relievedWrong },
    { id: 'told-truth', judgment: 'principled', competencies: ['communications', 'ethics'], text: 'Told the watch what the record showed, and no more.', flag: 'toldTruth', regulation: 'honesty-1', when: (s) => !!s.flags.toldTruth && !s.flags.overstated && !s.flags.namedWrong },
    { id: 'told-chief', judgment: 'principled', competencies: ['ethics', 'crew'], text: 'Told the watch that the Chief’s own signature was on the entry, and why.', flag: 'toldChief', when: (s) => !!s.flags.toldChief },
    { id: 'honest-referral', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Referred the death to the Inspectorate with the suspicion about the log laid out.', flag: 'disclosed', when: (s) => !!s.flags.disclosed },
    { id: 'station-safe', judgment: 'responsible', competencies: ['emergency', 'resources'], text: 'Brought the station’s people up by shuttle rather than gamble them on the strike.', flag: 'evacOrdered', regulation: 'care-1', when: (s) => !!s.flags.evacOrdered },
    { id: 'terms-kept', judgment: 'responsible', competencies: ['diplomacy', 'crew'], text: 'Offered the watch terms on the record, and kept them.', flag: 'route_terms', regulation: 'honesty-1', when: (s) => !!s.flags.route_terms && !!s.flags.endOnline && !s.flags.termsBroken },
    { id: 'restart-half', judgment: 'decisive', competencies: ['engineering', 'emergency'], text: 'Restarted the plant with the half of engineering still working, after the inspection.', flag: 'restartedWithout', when: (s) => !!s.flags.restartedWithout && !s.flags.restartUninspected },
    { id: 'threatened', judgment: 'reckless', competencies: ['crew', 'diplomacy'], text: 'Threatened the watch with charges before finding out why it had stopped.', flag: 'threatened', when: (s) => !!s.flags.threatened },
    { id: 'pressed-uninspected', judgment: 'reckless', competencies: ['crew', 'engineering'], text: 'Ordered the plant restarted before the sister valve had been inspected.', flag: 'restartWarned', regulation: 'care-2', when: (s) => (s.counters.restartWarned ?? 0) > 0 },
    { id: 'restart-uninspected', judgment: 'reckless', competencies: ['crew', 'engineering'], text: 'Insisted on lighting the plant over the Chief’s warning, with the sister valve unchecked.', flag: 'restartUninspected', regulation: 'care-2', when: (s) => !!s.flags.restartUninspected },
    { id: 'second-death', judgment: 'reckless', competencies: ['crew', 'emergency'], text: 'Exposed the crew to the same failure that had already killed one of them.', flag: 'endSecond', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.endSecond },
    { id: 'forced', judgment: 'reckless', competencies: ['crew', 'ethics'], text: 'Had security remove crew who were refusing to work, not threatening anyone.', flag: 'forced', when: (s) => !!s.flags.forced },
    { id: 'denied', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Told the watch there had been no cover-up.', flag: 'denied', regulation: 'honesty-1', when: (s) => !!s.flags.denied },
    { id: 'clean-to-inspector', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Told the Inspectorate the log was sound.', flag: 'toldHadleyClean', when: (s) => !!s.flags.toldHadleyClean },
    { id: 'overstated', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Told the watch something about the log the bridge had not established.', flag: 'overstated', regulation: 'honesty-1', when: (s) => !!s.flags.overstated },
    { id: 'relieved-on-rumour', judgment: 'reckless', competencies: ['ethics', 'crew'], text: 'Relieved an officer on a rumour, before the record was read.', flag: 'relievedOnRumour', when: (s) => !!s.flags.relievedOnRumour },
    { id: 'relieved-unheard', judgment: 'reckless', competencies: ['ethics', 'crew'], text: 'Relieved an officer without hearing him first.', flag: 'relievedUnheard', when: (s) => !!s.flags.relievedUnheard },
    { id: 'named-wrong', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Named the wrong person to the watch as the one who falsified the log.', flag: 'namedWrong', regulation: 'honesty-1', when: (s) => !!s.flags.namedWrong },
    { id: 'terms-broken', judgment: 'reckless', competencies: ['diplomacy', 'ethics'], text: 'Broke the terms the watch came back on.', flag: 'termsBroken', regulation: 'honesty-1', when: (s) => !!s.flags.termsBroken },
    { id: 'promise-broken', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Promised the station its power, and did not deliver it.', flag: 'promiseBroken', regulation: 'honesty-1', when: (s) => !!s.flags.promiseBroken && !s.flags.termsBroken },
    { id: 'station-dark', judgment: 'reckless', competencies: ['emergency', 'resources'], text: 'Let the station’s batteries run out with its people still on it.', flag: 'endCold', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.endCold },
    { id: 'closed-on-log', judgment: 'reckless', competencies: ['ethics'], text: 'Closed the matter on the maintenance log as written.', flag: 'closedOnLog', when: (s) => !!s.flags.closedOnLog },
    { id: 'left', judgment: 'reckless', competencies: ['emergency', 'ethics'], text: 'Left orbit with the station on batteries.', flag: 'endLeft', regulation: 'care-1', when: (s) => !!s.flags.endLeft },
  ],
  regulations: ['care-1', 'care-2', 'roe-3', 'honesty-1'],
  competencies: ['crew', 'ethics', 'communications', 'engineering'],
  recommend: {
    crew: 'leading a watch back to work rather than ordering or forcing it back',
    ethics: 'finding out what happened, and hearing the people involved, before deciding who is to blame',
    communications: 'telling the crew the truth, including the parts that reflect badly on the ship',
    engineering: 'proving a plant safe before anyone goes back into it',
  },
};
