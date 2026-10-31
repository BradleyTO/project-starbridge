/**
 * v0.7 after-action evaluation descriptor for Training Simulation 012, Ember Tide.
 * Command challenge (roadmap): timing and patience (primary): starting the lifts at once, but
 * holding the banking crew at the furnace, and the Halcyon over the outpost, exactly as long as
 * the forecast allows and no longer, and not flinching at a false dawn; relying on the science
 * officer's forecast (secondary): letting Lt. Varga narrow the window a reading at a time, giving
 * her the means to do it (power, a probe), and acting on what she can actually say rather than on a
 * guess about the minute. Pivotal officer: Lt. Varga (Science). Judged on what the forecast showed
 * when each decision was made (ISA-COM-001 §1.4), not on the minute the star happened to choose.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: care-1 (§4.1), care-2 (§4.2), roe-3 (§3.9) and honesty-1 (§6.1). The handbook also links this
 * simulation, as a hidden training reference, from cmd-4 (§1.4) and care-4 (§4.5–4.7), without changing
 * what the evaluator cites. ISA-COM-001 has no rule requiring a ship to warn other vessels of a hazard
 * in their path: that is an exercise objective ('warn') in outcome.ts, and it is the duty-to-warn
 * proposal already awaiting approval from Training Simulation 003, not a new one.
 *
 * The reckless/responsible pair: the same shelter in the same deep galleries (Under the Rock), ordered
 * after Lt. Varga has sounded the rock over them and with the forecast running (responsible), against
 * the same shelter ordered on the outpost's old survey alone and with nobody reading the star
 * (reckless). Same ending, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

const early = (s: { counters: Record<string, number> }, k: string) => (s.counters[k] ?? 0) > 0 && (s.counters[k] ?? 0) <= 3;

export const emberEvaluation: EvaluationDescriptor = {
  version: 'ember-tide-eval-1',
  objectives: { people: 'primary', ship: 'primary', furnace: 'secondary', warn: 'secondary' },
  endings: {
    'banked-clear': { tier: 'success', note: 'The furnace was banked and the last lift left as late as the forecast allowed, and no later.' },
    'on-the-tell': { tier: 'success', note: "The science officer caught the flare's precursor, and the last lift went on her minute." },
    'under-the-rock': { tier: 'success', note: 'The outpost sheltered below ground, under enough rock, and nobody was in the open.' },
    'cut-losses': { tier: 'success', note: 'The forecast never gave the furnace its time; the crew came off it, and everyone lived.' },
    'too-early': { tier: 'partial', note: 'Everyone lived, but the furnace was abandoned when it could have been banked in time.' },
    gamble: { tier: 'partial', note: 'Everyone lived, but the last lift left later than the forecast could justify.' },
    'tide-caught': { tier: 'failure', note: 'People were still on the near face, or climbing away from it, when the flare came.' },
    'lifter-lost': { tier: 'failure', note: 'The ore lifter was still flying in the open, unwarned, when the flare came.' },
    shallows: { tier: 'failure', note: 'The outpost sheltered in galleries with too little rock over them.' },
    'halcyon-caught': { tier: 'failure', note: "The Halcyon was still in the star's light when the flare came." },
    abandoned: { tier: 'failure', note: 'The Halcyon left with people still on the near face.' },
    'shots-fired': { tier: 'failure', note: 'Weapons were fired with civilians all around.' },
  },
  markers: [
    { id: 'forecast-first', judgment: 'responsible', competencies: ['scientific', 'analysis'], text: 'Had the science officer reading the star from the first minutes, before the hard decisions came.', flag: 'forecasting', when: (s) => early(s, 'forecastAt') },
    { id: 'lifts-at-once', judgment: 'responsible', competencies: ['emergency', 'resources'], text: 'Started lifting the outpost at once, while the hour of the flare was still uncertain.', flag: 'evacOn', regulation: 'care-1', when: (s) => early(s, 'evacAt') },
    { id: 'gave-her-the-means', judgment: 'decisive', competencies: ['scientific', 'resources'], text: 'Gave the science officer what she needed to narrow the forecast: more power, or a probe in close to the star.', flag: 'probeIn', when: (s) => !!s.flags.probeIn || (!!s.flags.boosted && !!s.flags.forecasting) },
    { id: 'held-on-evidence', judgment: 'decisive', competencies: ['analysis', 'emergency'], text: 'Kept the banking crew at the furnace only as long as the forecast allowed, and lifted them in time.', flag: 'banked', regulation: 'care-1', when: (s) => !!s.flags.banked && !!s.flags.lifted && !s.flags.gamble },
    { id: 'lift-on-the-tell', judgment: 'decisive', competencies: ['scientific', 'emergency'], text: "Sent the last lift on the science officer's minute when the star showed its precursor.", flag: 'liftOnTell', when: (s) => !!s.flags.liftOnTell && !s.flags.gamble },
    { id: 'patience-at-false-dawn', judgment: 'decisive', competencies: ['analysis', 'crew'], text: "Held steady through a false dawn on the science officer's reading, and kept the Overseer steady too.", flag: 'falseDawnCalled', when: (s) => !!s.flags.falseDawnCalled && !s.flags.stromePanicked && !s.flags.pulledAtFalseDawn },
    { id: 'no-gamble', judgment: 'principled', competencies: ['ethics', 'analysis'], text: "Gave up the furnace rather than stake the banking crew's lives on a forecast that could not promise the time.", flag: 'noGamble', regulation: 'care-1', when: (s) => !!s.flags.noGamble },
    { id: 'shadow-in-time', judgment: 'responsible', competencies: ['tactical', 'analysis'], text: "Took the Halcyon into the moon's shadow before the earliest hour the forecast allowed.", flag: 'shadowInTime', regulation: 'roe-3', when: (s) => !!s.flags.shadowInTime && !!s.flags.inShadow },
    { id: 'forecast-shared', judgment: 'responsible', competencies: ['communications', 'ethics'], text: 'Told the Overseer what the forecast actually showed, and let her plan on it.', flag: 'forecastShared', regulation: 'honesty-1', when: (s) => !!s.flags.forecastShared && !s.flags.falseAssurance },
    { id: 'warned-the-lifter', judgment: 'responsible', competencies: ['communications', 'emergency'], text: 'Warned the ore lifter of the flare and brought her in out of the light.', flag: 'warnedLifter', regulation: 'care-1', when: (s) => !!s.flags.warnedLifter && !s.flags.lifterLost },
    { id: 'shelter-verified', judgment: 'responsible', competencies: ['scientific', 'emergency'], text: 'Had the science officer sound the rock over the galleries before sending anyone below.', flag: 'shelterVerified', regulation: 'care-1', when: (s) => !!s.flags.shelterOrdered && !!s.flags.shelterVerified },
    { id: 'gambled-the-lift', judgment: 'reckless', competencies: ['analysis', 'emergency'], text: 'Kept people on the near face past the earliest hour the forecast allowed.', flag: 'gamble', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.gamble },
    { id: 'shelter-unverified', judgment: 'reckless', competencies: ['analysis', 'scientific'], text: "Sent the outpost below ground on an old survey nobody had checked.", flag: 'shelterOrdered', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.shelterOrdered && !s.flags.shelterVerified && !s.flags.shelterKnownShallow },
    { id: 'shelter-known-shallow', judgment: 'reckless', competencies: ['scientific', 'emergency'], text: 'Sent the outpost below ground after the science officer had found too little rock over the galleries.', flag: 'shelterKnownShallow', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.shelterKnownShallow },
    { id: 'false-assurance', judgment: 'reckless', competencies: ['communications', 'ethics'], text: 'Told the Overseer her people had time, or that the flare was not coming, when the forecast did not say so.', flag: 'falseAssurance', regulation: 'honesty-1', when: (s) => !!s.flags.falseAssurance },
    { id: 'halcyon-exposed', judgment: 'reckless', competencies: ['tactical', 'analysis'], text: "Kept the Halcyon in the star's light until the flare reached her.", flag: 'halcyonCaught', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.halcyonCaught },
    { id: 'team-caught', judgment: 'reckless', competencies: ['crew', 'emergency'], text: "Left the ship's own people on the near face, or in flight from it, when the flare came.", flag: 'deadCrew', regulation: 'care-2', safety: 'crew', when: (s) => (s.counters.deadCrew ?? 0) > 0 },
    { id: 'lifter-unwarned', judgment: 'reckless', competencies: ['communications', 'emergency'], text: 'Left the ore lifter flying in the open without making sure her master knew what was coming.', flag: 'lifterLost', regulation: 'care-1', when: (s) => !!s.flags.lifterLost },
    { id: 'left-them', judgment: 'reckless', competencies: ['emergency', 'ethics'], text: 'Left the moon with people still on the near face.', flag: 'endLeft', regulation: 'care-1', when: (s) => !!s.flags.endLeft },
  ],
  regulations: ['care-1', 'care-2', 'roe-3', 'honesty-1'],
  competencies: ['analysis', 'scientific', 'emergency', 'communications'],
  recommend: {
    analysis: 'acting on what the forecast can actually say, at the moment it can say it',
    scientific: "giving the science officer the time and the means to narrow the window",
    emergency: 'starting the lifts early and sending the last one in time',
    communications: 'telling the outpost and the lifter the truth about the hour',
  },
};
