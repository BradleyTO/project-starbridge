/**
 * v0.7 after-action evaluation descriptor for Training Simulation 016, The Glass Nebula.
 * Command challenge (roadmap): relying on the science officer (primary): letting Lt. Varga build a
 * model of a nebula that bends sensors and stretches time, so the captain knows which of two
 * contradictory messages is real and where the shuttle actually is; a gut call (secondary): which
 * message to believe, once (and only once) the model is in. Pivotal officer: Lt. Varga (Science).
 * Judged on what was known at the time (ISA-COM-001 §1.4).
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue
 * (src/evaluation/regulations) only: care-1 (§4.1), care-2 (§4.2), roe-3 (§3.9) and honesty-1 (§6.1).
 * The handbook also links this simulation, as a hidden training reference, from care-4 (§4.5) and
 * cmd-4 (§1.4), without changing what the evaluator cites. Committing the ship deep before the model is ready is
 * an exercise objective ('model') in outcome.ts, not a new regulation: §4.2 and §3.9 already cover
 * avoidable risk to crew, and §1.4 covers judgment on the information then available.
 *
 * The reckless/responsible pair: the same success ending (Brought Home) reached by waiting for
 * Varga's model and then going to the true locus (responsible), against a run that plunged on the
 * help signal first, took damage in a ghost locus, then still recovered after the model caught up
 * (reckless: committed blind). Same (or similar) ending shape, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const glassEvaluation: EvaluationDescriptor = {
  version: 'glass-eval-1',
  objectives: { shuttle: 'primary', ship: 'primary', model: 'secondary', truth: 'secondary' },
  endings: {
    'brought-home': { tier: 'success', note: 'The shuttle crew were recovered at the locus the science officer mapped.' },
    'through-shear': { tier: 'success', note: 'The ship used the time-shear as a path once the model showed it was one.' },
    'probe-chain': { tier: 'success', note: 'A probe relay recovered the crew without committing the ship deep.' },
    'turned-back': { tier: 'success', note: 'The help signal was recognised as an echo, and the ship held where the real message pointed.' },
    'too-late': { tier: 'partial', note: 'The true locus was reached, but by the shuttle\u2019s clock the crew were already gone.' },
    'ghost-chase': { tier: 'failure', note: 'The ship followed a false help signal into a locus that was never there.' },
    stranded: { tier: 'failure', note: 'The ship went deep without a model and could not find her way out.' },
    abandoned: { tier: 'failure', note: 'The ship left the nebula with the shuttle still unanswered.' },
    'shuttle-lost': { tier: 'failure', note: 'The shuttle went silent and was not recovered.' },
    shattered: { tier: 'failure', note: 'Force through the nebula destroyed the shuttle.' },
    'time-up': { tier: 'failure', note: 'Time ran out with nothing decided.' },
  },
  markers: [
    { id: 'modelled-first', judgment: 'responsible', competencies: ['scientific', 'crew'], text: 'Had the science officer build a model of the nebula before committing the ship deep.', flag: 'studiedFirst', when: (s) => !!s.flags.studiedFirst && !s.flags.committedBlind },
    { id: 'trusted-the-model', judgment: 'decisive', competencies: ['scientific', 'analysis'], text: 'Acted on the science officer\u2019s model of which message was real and where the shuttle was.', flag: 'rescuedOnEvidence', when: (s) => !!(s.flags.rescuedOnEvidence || s.flags.probeOnEvidence || s.flags.shearOnEvidence || s.flags.turnedOnEvidence) },
    { id: 'turned-on-evidence', judgment: 'decisive', competencies: ['scientific', 'analysis'], text: 'Turned back from the help signal once the science officer showed it was an echo.', flag: 'turnedOnEvidence', when: (s) => !!s.flags.turnedOnEvidence },
    { id: 'shear-on-evidence', judgment: 'decisive', competencies: ['scientific', 'engineering'], text: 'Took the time-shear as a path only after the model showed it was one.', flag: 'shearOnEvidence', when: (s) => !!s.flags.shearOnEvidence },
    { id: 'probe-not-plunge', judgment: 'responsible', competencies: ['engineering', 'crew'], text: 'Recovered the crew by probe relay instead of committing the ship deep.', flag: 'probeOnEvidence', regulation: 'care-2', when: (s) => !!s.flags.probeOnEvidence },
    { id: 'held-the-rim', judgment: 'responsible', competencies: ['tactical', 'scientific'], text: 'Held the ship at the Rim rather than plunging after an unproven signal.', flag: 'heldRim', regulation: 'roe-3', when: (s) => !!s.flags.heldRim && !s.flags.plunged },
    { id: 'heard-the-helm', judgment: 'responsible', competencies: ['crew', 'tactical'], text: 'Heard the helm out when he warned that the Fold was not a path yet.', flag: 'adeyemiWarned', regulation: 'roe-3', when: (s) => !!s.flags.adeyemiWarned && !s.flags.plunged },
    { id: 'plunged-blind', judgment: 'reckless', competencies: ['scientific', 'crew'], text: 'Committed the ship deep into the nebula before the science officer had a working model.', flag: 'committedBlind', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.committedBlind },
    { id: 'chased-the-ghost', judgment: 'reckless', competencies: ['scientific', 'analysis'], text: 'Followed the help signal into a locus the nebula had invented.', flag: 'ghostChase', regulation: 'roe-3', when: (s) => !!s.flags.ghostChase },
    { id: 'forced-a-way', judgment: 'reckless', competencies: ['tactical', 'ethics'], text: 'Tried to force a way through the nebula with weapons or raw power.', flag: 'forced', regulation: 'care-1', when: (s) => !!s.flags.forced },
    { id: 'left-them', judgment: 'reckless', competencies: ['ethics', 'emergency'], text: 'Left the nebula with a shuttle crew still unanswered when help was real.', flag: 'endLeft', regulation: 'care-1', when: (s) => !!s.flags.endLeft && s.variant.extra?.echo === 'stay-false' },
    { id: 'shattered-them', judgment: 'reckless', competencies: ['ethics', 'tactical'], text: 'Destroyed the shuttle forcing a path through the nebula.', flag: 'endShatter', regulation: 'care-1', when: (s) => !!s.flags.endShatter },
  ],
  regulations: ['care-1', 'care-2', 'roe-3', 'honesty-1'],
  competencies: ['scientific', 'analysis', 'crew', 'ethics'],
  recommend: {
    scientific: 'letting the science officer model an environment that lies before choosing which signal to believe',
    analysis: 'separating a real distress from an echo when the stamps on the messages cannot be trusted',
    crew: 'keeping the ship out of a nebula until there is a map',
    ethics: 'not abandoning a crew the evidence still says can be reached',
  },
};
