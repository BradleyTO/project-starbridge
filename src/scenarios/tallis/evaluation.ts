/**
 * v0.7 after-action evaluation descriptor for Training Simulation 002, Quarantine at Tallis Gate.
 * Command challenge (roadmap): relying on the science officer, evidence before action; Lt. Varga.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';
import { factTurn, flagTurn } from '../../evaluation/evaluate';

const before = (a: number | null, b: number | null) => a !== null && (b === null || a <= b);

export const tallisEvaluation: EvaluationDescriptor = {
  version: 'tallis-eval-1',
  objectives: { diagnose: 'secondary', pilgrims: 'primary', line: 'primary', contain: 'primary' },
  endings: {
    'quarantine-lifted': { tier: 'success', note: 'Evidence persuaded the Warden to lift the quarantine.' },
    'cure-delivered': { tier: 'success', note: 'The fever was treated where the liner lay.' },
    'agency-care': { tier: 'success', note: 'The pilgrims were towed to an Agency hospital.' },
    'long-road': { tier: 'partial', note: 'The pilgrims reached care, but the fever took its toll on the way.' },
    'gate-run': { tier: 'partial', note: 'Nobody was fired on, but the colony’s quarantine was forced.' },
    'liner-destroyed': { tier: 'failure', note: 'The liner was destroyed at the quarantine line.' },
    'colony-outbreak': { tier: 'failure', note: 'The fever reached the colony.' },
    'halcyon-quarantined': { tier: 'failure', note: 'The fever broke out aboard the Halcyon.' },
    'gate-incident': { tier: 'failure', note: 'The Halcyon fired on a lawful colony picket.' },
    abandoned: { tier: 'failure', note: 'The Halcyon left the pilgrims behind.' },
    stalemate: { tier: 'failure', note: 'Time ran out without a resolution.' },
    'halcyon-lost': { tier: 'failure', note: 'The Halcyon was destroyed.' },
  },
  markers: [
    { id: 'diagnosed-first', judgment: 'responsible', competencies: ['scientific', 'analysis'], text: 'Established the cause before sending anyone across.', when: (s) => before(factTurn(s, 'cause_known'), flagTurn(s, 'medicalSent')) },
    { id: 'ward-first', judgment: 'responsible', competencies: ['crew', 'emergency'], text: 'Set up an isolation ward before the medical team crossed.', regulation: 'care-2', safety: 'crew', flag: 'isolationWard', when: (s) => !!s.flags.medicalSent && before(flagTurn(s, 'isolationWard'), flagTurn(s, 'medicalSent')) },
    { id: 'team-exposed', judgment: 'reckless', competencies: ['crew', 'scientific'], text: 'Sent a medical team across unprotected before anyone knew whether it was contagious.', regulation: 'care-2', safety: 'crew', flag: 'exposed', when: (s) => !!s.flags.exposed },
    { id: 'contained-late', judgment: 'responsible', competencies: ['emergency'], text: 'Contained the exposure in time once it happened.', safety: 'crew', flag: 'exposureContained', when: (s) => !!s.flags.exposureContained },
    { id: 'carried-contagion', judgment: 'reckless', competencies: ['scientific', 'ethics'], text: 'Let the contagion through without isolation.', regulation: 'quarantine-2', safety: 'civilian', when: (s) => !!s.flags.halcyonOutbreak || !!s.flags.colonyOutbreak },
    { id: 'evidence-to-warden', judgment: 'decisive', competencies: ['communications', 'diplomacy'], text: 'Persuaded the Warden with evidence, within the colony’s law.', regulation: 'quarantine-1', when: (s) => s.outcome?.id === 'quarantine-lifted' },
    { id: 'colony-stockpile', judgment: 'decisive', competencies: ['diplomacy', 'resources'], text: "Asked the colony for its own antiviral stockpile.", flag: 'colonyDoses', when: (s) => !!s.flags.colonyDoses },
    { id: 'fixed-recycler', judgment: 'decisive', competencies: ['engineering'], text: 'Had engineering fix the liner’s poisoned water.', flag: 'recyclerFixed', when: (s) => !!s.flags.recyclerFixed },
    { id: 'screened-transporter', judgment: 'decisive', competencies: ['engineering', 'scientific'], text: 'Screened the transporter so patients could come aboard safely.', flag: 'transporterFilter', when: (s) => !!s.flags.transporterFilter },
    { id: 'towed-to-care', judgment: 'decisive', competencies: ['resources', 'emergency'], text: 'Took the liner under tow to Agency care.', flag: 'kestrelTowedOut', when: (s) => !!s.flags.kestrelTowedOut },
    { id: 'abandoned', judgment: 'reckless', competencies: ['ethics'], text: 'Left the pilgrims without help.', regulation: 'care-1', safety: 'civilian', flag: 'jumped', when: (s) => s.outcome?.id === 'abandoned' },
    {
      id: 'principled-restraint',
      judgment: 'principled',
      competencies: ['ethics', 'tactical'],
      text: 'Held fire on the colony picket rather than fight a lawful quarantine.',
      regulation: 'quarantine-1',
      when: (s) => ['liner-destroyed', 'gate-run', 'stalemate'].includes(s.outcome?.id ?? '') && !s.flags.shotsFired && (!!s.flags.interposing || (s.comms?.history?.length ?? 0) > 0),
    },
  ],
  regulations: ['quarantine-1', 'quarantine-2', 'care-1', 'care-2', 'roe-1'],
  competencies: ['scientific', 'analysis', 'diplomacy'],
  recommend: { scientific: 'working with the science officer to establish the cause before acting' },
};
