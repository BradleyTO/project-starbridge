/**
 * v0.7 after-action evaluation descriptor for Training Simulation 020, Gravity's Edge.
 * Command challenge (roadmap): a gut call, judging risk against reward with no clear line (primary);
 * the engineer's readings (secondary). Pivotal officer: Chief Okafor (Engineering), whose gauges may
 * be wrong but whose ear for the frame is not. Judged on what was known at the time (ISA-COM-001 §1.4,
 * cmd-4): pushing on and getting away with it is not good judgment, and pulling out on a fair warning
 * is not timidity, whatever the data turned out to be.
 *
 * Regulations cited are existing ISA-COM-001 ids only, and only ones the evaluator carries:
 * roe-3 (§3.9, the captain shall not expose the ship and crew to avoidable risk), care-2 (§4.2, crew
 * shall not be sent into avoidable danger) and honesty-1 (§6.1, commitments made on the record are
 * kept). The handbook also links this simulation, as hidden training references only, to cmd-1
 * (§2.1, the captain's responsibility for the ship and crew) and cmd-4 (§1.4, judged on the
 * information available at the time). The exercise objective "hear Chief Okafor's own read of the
 * frame before taking the ship past her rated limit" is a training goal, not law (§1.8, service-1).
 * No new regulation is proposed.
 *
 * The reckless/responsible pair: the same success ending (The Whole Pass) reached by hearing the
 * Chief's read before going past the rated limit, with a copy of the data off the ship and the outer
 * sections cleared before going deep (responsible), against a run that drove past the rated limit on
 * the gauges alone and sat deep through a stutter (reckless: risk taken blind that happened to pay).
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

const ended = (s: { flags: Record<string, boolean | undefined> }) => !!(s.flags.endFull || s.flags.endProbe || s.flags.endEarly);

export const gravityEvaluation: EvaluationDescriptor = {
  version: 'gravity-eval-1',
  objectives: { record: 'primary', ship: 'primary', read: 'secondary', copy: 'secondary' },
  endings: {
    'full-record': { tier: 'success', note: 'The whole pass was recorded and the ship came out intact.' },
    'probe-record': { tier: 'success', note: 'The probe was sent where the ship could not go, and what it saw was brought home.' },
    'early-out': { tier: 'success', note: 'The ship came out intact with enough of the pass to advance the science.' },
    'cold-feet': { tier: 'partial', note: 'The ship came out unharmed with too little of the pass to be of use.' },
    crippled: { tier: 'failure', note: 'The ship was held in the tide past what her frame could take, and she was crippled.' },
    losses: { tier: 'failure', note: 'The frame failed deep in the tide with crew in the exposed sections, and people died.' },
    'data-lost': { tier: 'failure', note: 'The sensor array burned in a glitch with the only copy of the recording in it.' },
  },
  markers: [
    { id: 'asked-the-chief', judgment: 'responsible', competencies: ['engineering', 'crew'], text: 'Asked the chief engineer what the frame was really telling her, not only what the gauges said.', flag: 'feelKnown', when: (s) => !!s.facts.feel?.known && !s.flags.pastBookBlind },
    { id: 'past-the-book-blind', judgment: 'reckless', competencies: ['engineering', 'crew'], text: 'Took the ship past her rated limit on the gauges alone, without hearing the chief engineer’s read of the frame.', flag: 'pastBookBlind', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.pastBookBlind },
    { id: 'trusted-the-read', judgment: 'decisive', competencies: ['engineering', 'emergency'], text: 'Trusted the chief engineer’s read of the frame over the gauges and took the ship as far as she could really go.', flag: 'pastBook', when: (s) => !!s.flags.pastBook && !s.flags.pastBookBlind && !s.flags.endCrippled && !s.flags.endLosses },
    { id: 'overrode-chief', judgment: 'reckless', competencies: ['crew', 'engineering'], text: 'Overrode the chief engineer’s warning and took the ship deeper.', flag: 'overrodeChief', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.overrodeChief },
    { id: 'heeded-the-tell', judgment: 'decisive', competencies: ['engineering', 'emergency'], text: 'Pulled back the moment the chief engineer heard the frame go quiet, before the star glitched.', flag: 'heededTell', regulation: 'roe-3', when: (s) => !!s.flags.heededTell },
    { id: 'deep-through-warning', judgment: 'reckless', competencies: ['emergency', 'scientific'], text: 'Stayed in the deep band after a warning that the star might glitch.', flag: 'deepThroughCue', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.deepThroughCue },
    { id: 'ignored-the-keel', judgment: 'reckless', competencies: ['crew', 'engineering'], text: 'Kept the ship in the tide after the keel had given its final warning.', flag: 'ignoredShriek', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.ignoredShriek },
    { id: 'cleared-sections', judgment: 'responsible', competencies: ['crew', 'emergency'], text: 'Cleared the crew out of the exposed sections before taking the ship deep.', flag: 'clearedFirst', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.clearedFirst },
    { id: 'crew-exposed', judgment: 'reckless', competencies: ['crew'], text: 'Took the ship to the edge of her limit deep in the tide with crew still in the exposed sections.', flag: 'endLosses', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.endLosses },
    { id: 'braced-first', judgment: 'responsible', competencies: ['engineering'], text: 'Had the frame braced before asking it to take the worst of the tide.', flag: 'reinforcedFirst', when: (s) => !!s.flags.reinforcedFirst && !!s.flags.wentDeep },
    { id: 'hedged', judgment: 'responsible', competencies: ['scientific', 'resources'], text: 'Got a copy of the data off the ship before taking the risks that could lose it.', flag: 'hedgedFirst', when: (s) => !!s.flags.hedgedFirst },
    { id: 'burned-array', judgment: 'reckless', competencies: ['scientific', 'resources'], text: 'Ran the sensors boosted in a tide that could glitch, with the only copy of the recording aboard.', flag: 'arrayBurned', when: (s) => !!s.flags.arrayBurned && !s.flags.relayActive },
    { id: 'sent-the-probe', judgment: 'decisive', competencies: ['scientific', 'resources'], text: 'Sent the probe where the ship could not safely go, and made sure someone would hear it.', flag: 'probeReleased', when: (s) => !!s.flags.probeReleased && !!s.flags.relayActive && (s.counters.probeData ?? 0) > 0 },
    { id: 'end-on', judgment: 'decisive', competencies: ['engineering', 'tactical'], text: 'Turned the ship end-on to the tide to spare the frame.', flag: 'endOn', when: (s) => !!s.flags.endOn },
    { id: 'promised-the-pass', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Promised the observatory the whole pass before knowing what the ship could take.', flag: 'promisedFull', regulation: 'honesty-1', when: (s) => !!s.flags.promisedFull && !s.flags.endFull },
    { id: 'honest-limits', judgment: 'responsible', competencies: ['ethics', 'communications'], text: 'Told the observatory honestly that the ship and crew came before the data.', flag: 'honestLimits', regulation: 'honesty-1', when: (s) => !!s.flags.honestLimits && !s.flags.promisedFull },
    { id: 'withdrew-on-warning', judgment: 'principled', competencies: ['crew', 'emergency'], text: 'Took the ship out when the frame warned, at the cost of the data.', flag: 'withdrewOnWarning', regulation: 'roe-3', when: (s) => !!s.flags.withdrewOnWarning && !ended(s) && !s.flags.endCrippled && !s.flags.endLosses },
    { id: 'jumped-deep', judgment: 'reckless', competencies: ['engineering', 'crew'], text: 'Jumped out of the tide instead of climbing, and sheared the frame.', flag: 'jumpedDeep', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.jumpedDeep },
  ],
  regulations: ['roe-3', 'care-2', 'honesty-1'],
  competencies: ['engineering', 'crew', 'emergency', 'scientific'],
  recommend: {
    engineering: 'hearing what the ship herself is saying when the instruments cannot be trusted',
    crew: 'trusting a senior officer’s judgement and keeping the crew out of risks the data does not need',
    emergency: 'acting on a warning that cannot be proved in time',
    scientific: 'protecting the data as well as gathering it',
  },
};
