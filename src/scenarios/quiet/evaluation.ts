/**
 * v0.7 after-action evaluation descriptor for Training Simulation 003, The Quiet Signal.
 * Command challenge (roadmap): the communications officer cracking a code (primary); patience
 * (secondary); Lt. Szabo. Judged on when the captain answered relative to what the crew knew,
 * not on which commands were typed.
 *
 * Regulations cited are existing ISA-COM-001 First Edition ids only. There is no regulation on
 * warning a rival vessel of a hazard: that is an exercise objective ('warn-all') in outcome.ts.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const quietEvaluation: EvaluationDescriptor = {
  version: 'quiet-eval-1',
  objectives: { understand: 'secondary', answer: 'primary', peaceful: 'primary', rival: 'secondary', 'warn-all': 'secondary' },
  endings: {
    'contact-established': { tier: 'success', note: 'The senders were answered correctly and greeted in return.' },
    'shared-vocabulary': { tier: 'success', note: 'The contact was made jointly with the Directorate.' },
    'polite-farewell': { tier: 'success', note: 'The senders’ farewell was understood and answered in kind.' },
    'warning-heeded': { tier: 'success', note: 'The senders’ warning was understood and every ship was clear in time.' },
    'directorate-first': { tier: 'partial', note: 'The contact was made, but by the Directorate alone.' },
    'warning-unshared': { tier: 'partial', note: 'The Halcyon was safe, but a ship in danger was not warned.' },
    'misread-threat': { tier: 'failure', note: 'The senders read the listeners as a threat.' },
    'fallen-silent': { tier: 'failure', note: 'The senders stopped waiting.' },
    'caught-in-glitch': { tier: 'failure', note: 'The Halcyon was caught by the hazard she had been warned of.' },
    'signal-incident': { tier: 'failure', note: 'Weapons were fired at a first contact.' },
    withdrew: { tier: 'failure', note: 'The Halcyon left before the conversation was finished.' },
    stalemate: { tier: 'failure', note: 'Time ran out without a resolution.' },
    'halcyon-lost': { tier: 'failure', note: 'The Halcyon was destroyed.' },
  },
  markers: [
    { id: 'waited-for-decode', judgment: 'responsible', competencies: ['communications', 'analysis'], text: 'Waited for the communications officer to finish the decode before answering.', flag: 'answeredConfirmed', when: (s) => !!s.flags.answeredConfirmed && !s.flags.answeredBlind && !s.flags.answeredOnLean },
    { id: 'trusted-the-lean', judgment: 'decisive', competencies: ['communications'], text: 'Acted on the communications officer’s partial reading when time was short, and it held.', flag: 'leanPaidOff', when: (s) => !!s.flags.leanPaidOff && !s.flags.answeredBlind },
    { id: 'answered-blind', judgment: 'reckless', competencies: ['analysis', 'communications'], text: 'Answered the senders before anyone aboard knew what they were asking.', flag: 'answeredBlind', when: (s) => !!s.flags.answeredBlind },
    { id: 'bought-time', judgment: 'decisive', competencies: ['communications'], text: 'Sent the senders’ own question back to buy time for the decode.', flag: 'echoed', when: (s) => !!s.flags.echoed },
    { id: 'better-data', judgment: 'decisive', competencies: ['analysis', 'engineering'], text: 'Gave the communications officer better data to work with.', when: (s) => !!s.flags.dishRigged || !!s.facts.pulsar_timing?.known },
    { id: 'blocked-the-beam', judgment: 'decisive', competencies: ['tactical', 'communications'], text: 'Put the Halcyon in the path of a rival transmission instead of firing on the rival.', flag: 'beamBlocked', when: (s) => !!s.flags.beamBlocked && !s.flags.shotsFired },
    { id: 'rival-held', judgment: 'responsible', competencies: ['diplomacy'], text: 'Persuaded the rival ship to hold its transmission instead of racing it.', flag: 'ledgerHolding', when: (s) => !!s.flags.ledgerHolding },
    { id: 'shared-in-good-faith', judgment: 'principled', competencies: ['diplomacy', 'ethics'], text: 'Offered to share the decode with the Directorate rather than race them to first contact.', flag: 'jointOffered', when: (s) => !!s.flags.jointOffered && !s.flags.shotsFired },
    { id: 'warned-rival', judgment: 'principled', competencies: ['ethics', 'diplomacy'], text: 'Warned the Directorate ship of the danger as well as the Halcyon.', flag: 'warnedLedger', when: (s) => !!s.flags.warnedLedger },
    { id: 'rival-left-in-danger', judgment: 'reckless', competencies: ['ethics'], text: 'Left a ship in danger without warning it.', safety: 'civilian', when: (s) => s.outcome?.id === 'warning-unshared' && !s.flags.warnedLedger },
  ],
  regulations: ['roe-1', 'roe-2', 'honesty-1'],
  competencies: ['communications', 'analysis', 'diplomacy'],
  recommend: { communications: 'giving the communications officer the time and data to finish a decode before acting on it' },
};
