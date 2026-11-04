/**
 * v0.7 after-action evaluation descriptor for Training Simulation 014, Starfall.
 * Command challenge (roadmap): trusting a junior officer (primary): handing the descent to the
 * pilot with the hands for it, Ens. Adeyemi, steadying him if he needs it, asking for his read once
 * he has felt the storm and letting him fly his own line, instead of taking the senior pilot by
 * default or flying the ship from the chair; triage of the ship's margin (secondary): knowing how
 * many more descents the hull can take, from the Chief, not from an eager ensign, and deciding with
 * that number. Pivotal officer: Ens. Adeyemi (Helm). Judged on what was known at the time
 * (ISA-COM-001 §1.4); delegating does not hand off the captain's accountability (§2.5).
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: care-1 (§4.1), care-2 (§4.2), roe-3 (§3.9) and honesty-1 (§6.1). The handbook also links this
 * simulation, as a hidden training reference, from cmd-3 (§2.5) and care-4 (§4.5–4.7), without
 * changing what the evaluator cites. No exercise objective and no new regulation: §2.5 already covers
 * delegation.
 *
 * The reckless/responsible pair: the same partial ending (Scarred in the Clouds: everyone lived, the
 * hull past the Chief's limit), reached after asking the Chief, hearing her limit and choosing to go
 * past it for the people still aboard (responsible: sound), against the same ending reached by
 * sending the ship down again and again without asking, and flying it from the chair (reckless).
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const starfallEvaluation: EvaluationDescriptor = {
  version: 'starfall-eval-1',
  objectives: { people: 'primary', ship: 'primary', count: 'secondary', helm: 'secondary' },
  endings: {
    'every-soul': { tier: 'success', note: 'Everyone aboard the habitat came up, and the hull stayed within the Chief\u2019s limit.' },
    'ensigns-line': { tier: 'success', note: 'The junior pilot flew his own line through the storm, and everyone came up within the hull\u2019s limit.' },
    'under-tow': { tier: 'success', note: 'The habitat was lightened and towed clear of the storm with everyone aboard.' },
    scarred: { tier: 'partial', note: 'Everyone lived, but the hull went past the strain the Chief would sign for.' },
    'left-below': { tier: 'failure', note: 'The habitat reached the crush line with people on the manifest still aboard.' },
    uncounted: { tier: 'failure', note: 'People nobody had counted were left aboard the habitat when it went down.' },
    'dragged-down': { tier: 'failure', note: 'The Halcyon\u2019s frame gave way in the storm.' },
    abandoned: { tier: 'failure', note: 'The Halcyon left with people still aboard the sinking habitat.' },
    'shots-fired': { tier: 'failure', note: 'The Halcyon fired with civilians all around her.' },
  },
  markers: [
    { id: 'trusted-the-helm', judgment: 'decisive', competencies: ['crew', 'emergency'], text: 'Gave the descent to the pilot with the hands for it, and let him fly it.', flag: 'delegated', when: (s) => !!s.flags.adeyemiFlew && !!s.flags.delegated && (s.counters.overrides ?? 0) === 0 },
    { id: 'steadied-him', judgment: 'responsible', competencies: ['crew'], text: 'Steadied a shaken junior officer before asking him to fly into the storm.', flag: 'backedEarly', when: (s) => s.variant.extra?.nerve === 'shaken' && !!s.flags.backedEarly && !s.flags.lostBacking && !!s.flags.adeyemiFlew },
    { id: 'heard-his-line', judgment: 'decisive', competencies: ['crew', 'analysis'], text: 'Asked the pilot for his read of the storm once he had flown it, and let him fly his own line.', flag: 'flewLine', when: (s) => !!s.flags.flewLine },
    { id: 'asked-the-chief', judgment: 'responsible', competencies: ['engineering', 'analysis'], text: 'Asked the Chief what the hull could take before the descents ran out of margin.', flag: 'hullAsked', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.hullAsked && !s.flags.crossedBlind },
    { id: 'set-a-limit', judgment: 'responsible', competencies: ['crew', 'engineering'], text: 'Gave the pilot a standing limit: break off when the Chief says the hull has had enough.', flag: 'limitSet', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.limitSet },
    { id: 'counted-the-living', judgment: 'responsible', competencies: ['analysis', 'emergency'], text: 'Counted the people aboard the habitat instead of trusting the manifest.', flag: 'countKnown', regulation: 'care-1', safety: 'civilian', when: (s) => (!!s.flags.countKnown || !!s.flags.kembleOwned) && !s.flags.leftHidden },
    { id: 'cut-the-works', judgment: 'decisive', competencies: ['engineering', 'resources'], text: "Cut the habitat's scoop works away to stop it sinking, with everyone brought up out of them first.", flag: 'cutLoose', regulation: 'care-1', when: (s) => !!s.flags.cutLoose && !s.flags.leftHidden },
    { id: 'pressed-on-knowingly', judgment: 'decisive', competencies: ['emergency', 'engineering'], text: "Went past the Chief's limit knowingly, as a decision, because people were still aboard the habitat.", flag: 'crossedInformed', when: (s) => !!s.flags.crossedInformed && !s.flags.eagerPushed && !s.flags.endDragged },
    { id: 'told-the-company-straight', judgment: 'principled', competencies: ['communications', 'ethics'], text: "Told the company's agent plainly that people came before the plant.", flag: 'toldQuellTruth', regulation: 'honesty-1', when: (s) => !!s.flags.toldQuellTruth && !s.flags.falsePromise },
    { id: 'flew-it-from-the-chair', judgment: 'reckless', competencies: ['crew'], text: "Took the flying out of the pilot's hands in the middle of a descent, more than once, and the hull paid for it.", flag: 'overrides', regulation: 'roe-3', safety: 'crew', when: (s) => (s.counters.overrides ?? 0) >= 2 },
    { id: 'blind-past-the-limit', judgment: 'reckless', competencies: ['engineering', 'analysis'], text: 'Kept sending the ship down without asking the Chief what the hull could take, and went past her limit without knowing it.', flag: 'crossedBlind', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.crossedBlind },
    { id: 'let-him-push', judgment: 'reckless', competencies: ['crew', 'engineering'], text: "Let an eager junior officer take the ship past the Chief's limit on his own judgment of the hull.", flag: 'eagerPushed', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.eagerPushed },
    { id: 'frame-gave-way', judgment: 'reckless', competencies: ['engineering', 'emergency'], text: 'Took the Halcyon past the point where her frame could hold.', flag: 'endDragged', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.endDragged },
    { id: 'trusted-the-manifest', judgment: 'reckless', competencies: ['analysis', 'emergency'], text: "Took the manifest's word for who was aboard, and left people nobody had counted.", flag: 'leftHidden', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.leftHidden || (!!s.flags.endLost && !s.flags.lostUpper && (s.counters.deadCiv ?? 0) > 0) },
    { id: 'left-them', judgment: 'reckless', competencies: ['emergency', 'ethics'], text: 'Left the habitat with people still aboard.', flag: 'endLeft', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.endLeft },
    { id: 'false-promise', judgment: 'reckless', competencies: ['communications', 'ethics'], text: 'Promised the habitat, or its plant, would be saved when nothing showed it could be.', flag: 'falsePromise', regulation: 'honesty-1', when: (s) => !!s.flags.falsePromise },
  ],
  regulations: ['care-1', 'care-2', 'roe-3', 'honesty-1'],
  competencies: ['crew', 'engineering', 'analysis', 'emergency'],
  recommend: {
    crew: 'handing a task to the officer best able to do it, and then letting them do it',
    engineering: "asking the Chief what the ship can take before it is too late to ask",
    analysis: 'counting the people, not the names on a list',
    emergency: 'keeping the rescue moving while the margin lasts',
  },
};
