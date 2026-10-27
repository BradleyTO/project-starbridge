/**
 * v0.7 after-action evaluation descriptor for Training Simulation 008, The Lantern Drift.
 * Command challenge (roadmap): triage and sacrifice (primary): deciding, on the medical officer's
 * assessment, which cryo banks are woken and in what order when not every failing bank can be
 * reached in time, and which sound banks are left asleep; ethics (secondary): the sleepers cannot
 * consent, so leave comes from their custodian or their charter's Speaker, and is not taken by force
 * or bought with a comforting lie. Pivotal officer: Dr. Osei (Medical).
 * Judged on what the captain knew when each decision was made (ISA-COM-001 §1.4), not on which
 * commands were typed or in what order.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: care-1 (§4.1), care-2 (§4.2) and honesty-1 (§6.1). The handbook also links this simulation, as a
 * hidden training reference, from cmd-4 (§1.4) and health-2 (§8.3), without changing what the evaluator cites.
 * ISA-COM-001 has no triage rule and no rule that a ship with living people aboard is not salvage:
 * those are exercise objectives ('triage', 'hulk') in outcome.ts, and regulations are proposed for approval.
 *
 * The reckless/responsible pair: the same salvage deal with the Drover tender, struck after the
 * salvor's licence was checked with the Registry (responsible) against struck unchecked (reckless).
 * Same ending, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';
import { needless } from './agents';

export const lanternEvaluation: EvaluationDescriptor = {
  version: 'lantern-eval-1',
  objectives: { sleepers: 'primary', hulk: 'primary', custodian: 'secondary', team: 'secondary', triage: 'secondary' },
  endings: {
    'keepers-rest': { tier: 'success', note: 'Every failing bank was reached in time on the doctor’s triage, with the custodian’s leave.' },
    'speakers-choice': { tier: 'success', note: 'The sleepers’ own Speaker decided for them, and every failing bank was reached.' },
    'salvage-deal': { tier: 'success', note: 'A second revival line from the salvor’s tender reached every failing bank.' },
    'borrowed-light': { tier: 'success', note: 'The Halcyon’s own power held the failing-feed banks while the sickbay woke the rest.' },
    'hard-count': { tier: 'partial', note: 'Most were saved, but a bank was lost or a sound bank was woken.' },
    'wrong-banks': { tier: 'failure', note: 'A sound bank was woken on a corrupt manifest while a failing bank paid for it.' },
    lockdown: { tier: 'failure', note: 'Overriding the custodian sealed the cryo deck to everyone.' },
    salvaged: { tier: 'failure', note: 'The salvor towed the ship off with her sleepers aboard.' },
    'dark-lantern': { tier: 'failure', note: 'Too many banks failed, or too many sleepers were woken blind.' },
    'left-adrift': { tier: 'failure', note: 'The Halcyon left with the banks still failing.' },
  },
  markers: [
    { id: 'scanned-first', judgment: 'responsible', competencies: ['scientific', 'crew'], text: 'Had the cryo deck scanned before sending the medical team across.', flag: 'scanBeforeBoard', regulation: 'care-2', when: (s) => !!s.flags.scanBeforeBoard },
    { id: 'team-into-hazard', judgment: 'reckless', competencies: ['crew', 'scientific'], text: 'Sent the medical team onto an unscanned cryo deck, where a cryogen leak hurt one of them.', flag: 'teamHurt', regulation: 'care-2', safety: 'crew', when: (s) => !!s.flags.teamHurt },
    { id: 'assessed-first', judgment: 'responsible', competencies: ['analysis', 'ethics'], text: 'Had the medical officer assess the sleepers before anyone was woken, instead of trusting a corrupt manifest.', flag: 'assessedBeforeWake', regulation: 'care-1', when: (s) => !!s.flags.assessedBeforeWake },
    { id: 'woke-blind', judgment: 'reckless', competencies: ['analysis', 'ethics'], text: 'Began waking sleepers before the medical officer had seen them, on the custodian’s manifest alone.', flag: 'wokeBlind', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.wokeBlind && (s.counters.deaths ?? 0) > 100 },
    { id: 'woke-sound-bank', judgment: 'reckless', competencies: ['ethics', 'crew'], text: 'Woke a sound bank after the medical officer had said it would hold and that waking it would kill some for nothing.', flag: 'wokeAgainstAdvice', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.wokeAgainstAdvice && needless(s).length > 0 },
    { id: 'honest-with-custodian', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Told the custodian the truth about the cost: that not every sleeper would live.', flag: 'honest', regulation: 'honesty-1', when: (s) => !!s.flags.honest && !s.flags.lied },
    { id: 'lied-to-custodian', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Promised the custodian that every sleeper would live, when that could not be true, to get its leave.', flag: 'lied', regulation: 'honesty-1', when: (s) => !!s.flags.lied },
    { id: 'asked-leave', judgment: 'responsible', competencies: ['diplomacy', 'ethics'], text: 'Asked the custodian’s leave before sending anyone aboard or waking anyone.', flag: 'leave', when: (s) => !!s.flags.leave && !s.flags.overrode },
    { id: 'speaker', judgment: 'principled', competencies: ['ethics', 'diplomacy'], text: 'Had the sleepers’ own Speaker woken under their charter, so that someone of theirs could decide for them.', flag: 'speakerConsent', when: (s) => !!s.flags.speakerConsent },
    { id: 'override', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Ordered the custodian cut out of its own ship after being warned what it might do.', flag: 'overrode', when: (s) => !!s.flags.overrode },
    { id: 'power-line', judgment: 'decisive', competencies: ['engineering', 'resources'], text: 'Had the chief engineer hold the failing-feed banks asleep on the Halcyon’s own power, freeing the sickbay for the banks that could not wait.', flag: 'powerHeld', when: (s) => !!s.flags.powerHeld },
    { id: 'licence-checked', judgment: 'responsible', competencies: ['analysis', 'diplomacy'], text: 'Checked the salvor’s licence with the Registry before doing business with him.', flag: 'licenceChecked', when: (s) => !!s.flags.licenceChecked && !s.flags.dealUnchecked },
    { id: 'unchecked-deal', judgment: 'reckless', competencies: ['diplomacy', 'resources'], text: 'Promised the hull to a salvor whose licence nobody had checked, with nine hundred people aboard it.', flag: 'dealUnchecked', when: (s) => !!s.flags.dealUnchecked },
    { id: 'held-the-ship', judgment: 'decisive', competencies: ['tactical', 'resources'], text: 'Held the generation ship against the tow without firing on anyone.', flag: 'heldFast', when: (s) => !!(s.flags.heldFast || s.flags.interposed) && !!s.flags.cutDone },
    { id: 'left-them', judgment: 'reckless', competencies: ['ethics', 'emergency'], text: 'Left the Lantern Drift with the sleepers’ banks still failing.', flag: 'endLeft', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.endLeft },
  ],
  regulations: ['care-1', 'care-2', 'honesty-1'],
  competencies: ['ethics', 'analysis', 'crew', 'engineering'],
  recommend: {
    ethics: 'deciding who is woken on the medical officer’s assessment, and getting leave honestly from those who can give it for the sleepers',
    analysis: 'checking a manifest against the sleepers themselves before acting on it',
  },
};
