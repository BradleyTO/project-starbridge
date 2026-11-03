/**
 * v0.7 after-action evaluation descriptor for Training Simulation 013, The Seventh Bell.
 * Command challenge (roadmap): accountability (primary): finding out what really happened when an ISA
 * cutter fired on a Directorate courier, hearing the cutter's captain before any finding against him,
 * and saying the truth to the Directorate and to Fleet Command even when it is inconvenient (or when
 * it clears the ISA, which the Directorate does not want to hear either); deduction from the evidence
 * (secondary): a hedged first read, a beacon's recorder, the courier's damage and the dead, weighed
 * for what each can and cannot show. Pivotal officer: Lt. Cmdr. Rask (Tactical), who reads the
 * cutter's fire-control record and knows its captain. Judged on what the captain knew when each
 * decision was made (ISA-COM-001 §1.4), not on which commands were typed.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: honesty-1 (§6.1), reg-7.1 (§5.4), reg-7.4 (§5.7) and roe-2 (§3.1). The handbook also links
 * this simulation, as a hidden training reference, from cmd-4 (§1.4), roe-4 (§3.5), conduct-2 (§6.4),
 * custody-1 (§7.5) and service-3 (§10.2, §10.7), without changing what the evaluator cites.
 * ISA-COM-001 has no rule requiring the ISA to give another power an honest account of how its
 * people died at ISA hands: that is an exercise objective ('account') in outcome.ts, and a regulation
 * is proposed for approval.
 *
 * The reckless/responsible pair: the same ending (The Bell Rings True), reached by hearing Stavely,
 * having Rask read the record cold and gathering independent evidence before the finding
 * (responsible), against accusing Stavely before hearing him and conceding fault to the examiner
 * before any evidence was in, then doing the same (reckless). Same ending, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const seventhBellEvaluation: EvaluationDescriptor = {
  version: 'seventh-bell-eval-1',
  objectives: { inquiry: 'primary', finding: 'primary', peace: 'primary', heard: 'secondary', account: 'secondary', record: 'secondary' },
  endings: {
    'independent-review': { tier: 'success', note: "A directive to find self-defence in advance was refused on the record and referred for independent review, and the true finding went out." },
    'own-words': { tier: 'success', note: "The cutter's captain was heard, shown the evidence, and gave the true account himself." },
    'joint-finding': { tier: 'success', note: 'The evidence was examined openly with the Directorate, and the finding was one both sides could accept.' },
    cleared: { tier: 'success', note: "The evidence showed the cutter fired lawfully, and the finding said so plainly." },
    'honest-finding': { tier: 'success', note: "What happened was established and said plainly, the ISA's own fault included." },
    premature: { tier: 'partial', note: 'The finding was right, but it was made before the evidence was in.' },
    unaccepted: { tier: 'partial', note: 'The finding was true, but the Directorate was given no reason to accept it.' },
    adjourned: { tier: 'partial', note: 'The inquiry ran out of time with no finding made.' },
    whitewash: { tier: 'failure', note: 'The finding said self-defence when it was not, and nothing survived to contradict it.' },
    exposed: { tier: 'failure', note: "The finding said self-defence when it was not, and the beacon's own record proved it false." },
    scapegoat: { tier: 'failure', note: "The cutter's captain was found against for a lawful shot." },
    'wrong-finding': { tier: 'failure', note: 'The finding was not what the evidence showed.' },
    'fleet-finding': { tier: 'failure', note: "Fleet Command filed its own finding over the inquiry's head, with no objection on the record." },
    'war-footing': { tier: 'failure', note: 'The Directorate was driven off the channel, and the incident became a border crisis.' },
    abandoned: { tier: 'failure', note: 'The Halcyon left with the inquiry unheld.' },
    'shots-fired': { tier: 'failure', note: 'Weapons were fired at an inquiry into a shooting.' },
  },
  markers: [
    { id: 'heard-stavely', judgment: 'responsible', competencies: ['ethics', 'crew'], text: 'Heard the cutter’s captain in his own words before making any finding.', flag: 'heardStavely', when: (s) => !!s.flags.heardStavely && !s.flags.accusedUnheard },
    { id: 'heard-vory', judgment: 'responsible', competencies: ['diplomacy', 'communications'], text: 'Asked the Directorate examiner for her account, and listened to it.', flag: 'heardVory', when: (s) => !!s.flags.heardVory },
    { id: 'rask-cold', judgment: 'responsible', competencies: ['crew', 'analysis'], text: 'Asked the tactical officer about his tie to the cutter’s captain, and had the record read straight.', flag: 'raskCold', when: (s) => !!s.flags.raskCold && (s.flags.raskHedged === true || s.facts.firing?.known === true || (s.counters.firingAt ?? 0) > 0) },
    { id: 'evidence-complete', judgment: 'responsible', competencies: ['analysis', 'scientific'], text: 'Tested the cutter’s own record against evidence that did not come from the cutter.', flag: 'findingComplete', when: (s) => !!s.flags.findingComplete },
    { id: 'offered-aid', judgment: 'responsible', competencies: ['diplomacy', 'emergency'], text: 'Offered the disabled courier help before asking anything of her.', flag: 'offeredAid', when: (s) => !!s.flags.offeredAid },
    { id: 'recovered-bell', judgment: 'decisive', competencies: ['engineering', 'resources'], text: 'Sent a team to recover the beacon’s damaged recorder rather than do without it.', flag: 'bellRecovered', when: (s) => !!s.flags.bellRecovered },
    { id: 'regret', judgment: 'principled', competencies: ['diplomacy', 'ethics'], text: 'Expressed the ISA’s regret for the courier’s dead without waiting for a finding.', flag: 'regret', when: (s) => !!s.flags.regret },
    { id: 'shared', judgment: 'principled', competencies: ['diplomacy', 'communications'], text: 'Opened the evidence to the Directorate for examination.', flag: 'shared', when: (s) => !!s.flags.shared },
    { id: 'refused-formally', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Refused, formally and with reasons, to make a finding in advance of the evidence.', flag: 'refusedFormally', regulation: 'reg-7.4', when: (s) => !!s.flags.refusedFormally || !!s.flags.objected },
    { id: 'referred', judgment: 'principled', competencies: ['ethics'], text: 'Referred Fleet Command’s directive for independent review.', flag: 'referred', when: (s) => !!s.flags.referred },
    { id: 'declined-quiet', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Declined Fleet Command’s informal wish for a convenient finding.', flag: 'declinedQuiet', when: (s) => !!s.flags.declinedQuiet },
    { id: 'honest-finding', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Found against the ISA’s own cutter when the evidence said so.', flag: 'honestFinding', regulation: 'honesty-1', when: (s) => !!s.flags.honestFinding },
    { id: 'accused-unheard', judgment: 'reckless', competencies: ['ethics', 'crew'], text: 'Found against the cutter’s captain before hearing him.', flag: 'accusedUnheard', when: (s) => !!s.flags.accusedUnheard },
    { id: 'premature-finding', judgment: 'reckless', competencies: ['analysis', 'ethics'], text: 'Made a finding before the evidence was in.', flag: 'findingPremature', when: (s) => !!s.flags.findingPremature },
    { id: 'conceded', judgment: 'reckless', competencies: ['diplomacy', 'ethics'], text: 'Admitted fault to the Directorate before anything had been established.', flag: 'conceded', regulation: 'honesty-1', when: (s) => !!s.flags.conceded },
    { id: 'false-finding', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Made a finding the evidence does not support.', flag: 'falseFinding', regulation: 'honesty-1', when: (s) => !!s.flags.falseFinding },
    { id: 'threatened-examiner', judgment: 'reckless', competencies: ['diplomacy'], text: 'Threatened or abused the examiner of a disabled courier.', flag: 'threatenedVory', when: (s) => !!s.flags.threatenedVory && !s.flags.lockWalk },
    { id: 'locked-on-courier', judgment: 'reckless', competencies: ['tactical', 'diplomacy'], text: 'Locked weapons on a disabled, unarmed courier.', flag: 'lockWalk', regulation: 'roe-2', safety: 'civilian', when: (s) => !!s.flags.lockWalk },
    { id: 'refused-bare', judgment: 'reckless', competencies: ['communications'], text: 'Refused Fleet Command’s directive without stating a reason.', flag: 'refusedBare', regulation: 'reg-7.1', when: (s) => !!s.flags.refusedBare && !s.flags.refusedFormally },
    { id: 'complied-early', judgment: 'reckless', competencies: ['ethics'], text: 'Undertook to deliver the finding Fleet Command wanted before the evidence was in.', flag: 'complied', when: (s) => !!s.flags.complied },
    { id: 'fleet-filed', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Let Fleet Command close the inquiry with no objection on the record.', flag: 'endFleet', when: (s) => !!s.flags.endFleet },
    { id: 'left', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Left the Seventh Bell with the inquiry unheld.', flag: 'endLeft', when: (s) => !!s.flags.endLeft || !!s.flags.jumped },
  ],
  regulations: ['honesty-1', 'reg-7.1', 'reg-7.4', 'roe-2'],
  competencies: ['ethics', 'analysis', 'diplomacy', 'communications'],
  recommend: {
    ethics: 'hearing the people involved, and following the evidence wherever it leads, before making any finding',
    analysis: 'testing a record against evidence that does not come from the same source',
    diplomacy: 'treating the other side’s dead with respect while the facts are still being found',
    communications: 'saying the true finding plainly, to the other power and to one’s own command',
  },
};
