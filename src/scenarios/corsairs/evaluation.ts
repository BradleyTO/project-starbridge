/**
 * v0.7 after-action evaluation descriptor for Training Simulation 015, Corsairs of the Veyl Shoals.
 * Command challenge (roadmap): tactical cunning (primary): beating an ambush on ground the
 * corsairs chose by reading their pattern (Lt. Cmdr. Rask) and the ground (the beacon's charts, a
 * probe or an active sweep), and breaking the pattern with terrain and deception, not by trading
 * blows; bluffing (secondary): a lawful ruse about the ship's own strength, timed to a captain whose
 * nerve has been read, never a false surrender or false distress. Pivotal officer: Lt. Cmdr. Rask
 * (Tactical). Judged on what was known at the time (ISA-COM-001 §1.4).
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: roe-2 (§3.1), roe-1 (§3.3), roe-3 (§3.9), honesty-1 (§6.1) and asylum-1 (§7.1). The handbook
 * also links this simulation, as a hidden training reference, from roe-4 (§3.5) and conduct-1
 * (§6.2, lawful ruses), without changing what the evaluator cites. No exercise objective and no
 * new regulation: §3.1–3.5, §6.2 and §7.1 already cover it.
 *
 * The reckless/responsible pair: the same partial ending (Won the Hard Way: the Hagfish beaten with
 * the guns) reached by waiting for her to open fire, shields up, and answering it (responsible:
 * returned fire), against the same ending reached by opening fire first on a ship that had only made
 * demands (reckless: fired first, ISA-COM-001 §3.1).
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const corsairsEvaluation: EvaluationDescriptor = {
  version: 'corsairs-eval-1',
  objectives: { ship: 'primary', force: 'primary', read: 'secondary', lawful: 'secondary' },
  endings: {
    'struck-colours': { tier: 'success', note: 'The corsair flagship struck her colours, and her captain came into ISA custody.' },
    'creditors-due': { tier: 'success', note: 'The corsair captain was kept in ISA custody when her creditor asked for her.' },
    'into-the-dust': { tier: 'success', note: 'The corsairs\u2019 plan was broken on their own ground, and the ship left without firing a shot.' },
    'called-off': { tier: 'success', note: 'A lawful bluff made the corsairs call off their attack.' },
    pyrrhic: { tier: 'partial', note: 'The corsairs were beaten with the guns, and the ship took heavy damage.' },
    'ran-for-it': { tier: 'partial', note: 'The ship got out with her cargo, but the corsairs\u2019 plan was never broken.' },
    boarded: { tier: 'failure', note: 'The corsairs boarded the ship.' },
    plundered: { tier: 'failure', note: 'The ship gave the corsairs her cargo.' },
    'no-quarter': { tier: 'failure', note: 'The ship fired on a corsair that had stopped fighting.' },
    'handed-over': { tier: 'failure', note: 'A person in ISA custody was handed to her creditor.' },
    pinned: { tier: 'failure', note: 'Time ran out with the ship still pinned in the shoal.' },
  },
  markers: [
    { id: 'read-the-pattern', judgment: 'decisive', competencies: ['tactical', 'crew'], text: "Asked Lt. Cmdr. Rask to read the corsairs' pattern, and committed the ship only once it was read.", flag: 'raskRead', when: (s) => !!s.flags.raskRead && !s.flags.committedBlind },
    { id: 'learned-the-ground', judgment: 'responsible', competencies: ['analysis', 'tactical'], text: "Learned the shoal's ground from the beacon's charts or a probe, without lighting the ship up.", flag: 'chartsIn', when: (s) => (!!s.flags.chartsIn || !!s.flags.probed) && !s.flags.pinged },
    { id: 'broke-the-plan', judgment: 'decisive', competencies: ['tactical'], text: "Broke the corsairs' plan with the ground, not the guns.", flag: 'planBroken', regulation: 'roe-2', when: (s) => !!s.flags.planBroken && !!s.flags.brokeWithoutGuns },
    { id: 'hidden-by-the-anvil', judgment: 'decisive', competencies: ['tactical', 'engineering'], text: "Ran dark in the iron rock's shadow, where the corsairs could not see the ship.", flag: 'wentDark', when: (s) => !!s.flags.planBroken && !!s.flags.wentDark && s.variant.extra?.anvil === 'iron' },
    { id: 'heard-the-warning', judgment: 'responsible', competencies: ['crew', 'tactical'], text: 'Heard the helm out when he said the obvious way out was a trap, and did not take it.', flag: 'adeyemiWarned', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.adeyemiWarned && !s.flags.inSump },
    { id: 'lawful-bluff', judgment: 'decisive', competencies: ['communications', 'tactical'], text: "Bluffed the corsairs about the ship's own strength, a lawful ruse, and made them call it off.", flag: 'bluffed', when: (s) => !!s.flags.bluffed && !s.flags.falseRuse },
    { id: 'refused-false-ruse', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Accepted the communications officer\u2019s refusal to send a false distress or surrender signal, and found a lawful way instead.', flag: 'szaboRefusedRuse', when: (s) => !!s.flags.szaboRefusedRuse && !s.flags.falseRuse && !s.flags.endPlundered && !s.flags.endBoarded },
    { id: 'offered-protection', judgment: 'principled', competencies: ['ethics', 'diplomacy'], text: 'Found out what the corsair captain was running from, and offered her ISA custody instead of a fight.', flag: 'protectionAccepted', regulation: 'asylum-1', when: (s) => !!s.flags.protectionAccepted && !s.flags.handedOver },
    { id: 'kept-her-safe', judgment: 'principled', competencies: ['ethics'], text: 'Refused to hand a person in ISA custody to the creditor who had come for her.', flag: 'refusedHandover', regulation: 'asylum-1', when: (s) => !!s.flags.refusedHandover },
    { id: 'answered-fire', judgment: 'responsible', competencies: ['tactical'], text: 'Held fire until the corsairs opened fire, with shields up, and only then answered it.', flag: 'firedOnHer', regulation: 'roe-2', safety: 'crew', when: (s) => !!s.flags.firedOnHer && !s.flags.firedFirst && !s.flags.firedOnBeaten },
    { id: 'fired-first-in-the-rocks', judgment: 'reckless', competencies: ['tactical'], text: 'Opened fire on a corsair that had only made demands, and started the fight in the rocks.', flag: 'firedFirst', regulation: 'roe-2', when: (s) => !!s.flags.firedFirst },
    { id: 'fired-on-the-beaten', judgment: 'reckless', competencies: ['tactical', 'ethics'], text: 'Fired on the corsairs after they had stopped fighting.', flag: 'firedOnBeaten', regulation: 'roe-2', when: (s) => !!s.flags.firedOnBeaten },
    { id: 'committed-blind', judgment: 'reckless', competencies: ['tactical', 'analysis'], text: "Committed the ship to the rocks on a guess, before anyone had read the corsairs' pattern, and the ship paid for it.", flag: 'committedBlind', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.committedBlind && ((s.counters.damageTaken ?? 0) >= 15 || !!s.flags.endBoarded) },
    { id: 'into-the-sump', judgment: 'reckless', competencies: ['tactical', 'crew'], text: 'Took the obvious way out after the helm had warned it was a dead end.', flag: 'intoSump', regulation: 'roe-3', safety: 'crew', when: (s) => !!s.flags.inSump },
    { id: 'false-ruse', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Feigned distress, surrender or a humanitarian purpose to the corsairs, which no lawful ruse allows.', flag: 'falseRuse', when: (s) => !!s.flags.falseRuse },
    { id: 'gave-the-cargo', judgment: 'reckless', competencies: ['tactical', 'resources'], text: 'Gave the corsairs the cargo the ship was carrying for others.', flag: 'cargoGiven', when: (s) => !!s.flags.cargoGiven },
    { id: 'handed-her-over', judgment: 'reckless', competencies: ['ethics'], text: "Handed a person in ISA custody to a creditor's gunship.", flag: 'handedOver', regulation: 'asylum-1', when: (s) => !!s.flags.handedOver },
    { id: 'broke-faith', judgment: 'reckless', competencies: ['ethics', 'communications'], text: 'Fired on the corsairs after telling them the ship surrendered.', flag: 'yielded', regulation: 'honesty-1', when: (s) => !!s.flags.yielded && !!s.flags.firedOnHer && !s.flags.cargoGiven },
  ],
  regulations: ['roe-2', 'roe-1', 'roe-3', 'honesty-1', 'asylum-1'],
  competencies: ['tactical', 'analysis', 'communications', 'ethics'],
  recommend: {
    tactical: "reading an enemy's pattern before choosing ground to fight on",
    analysis: 'learning the ground before committing the ship to it',
    communications: "a lawful ruse about the ship's own strength, timed to an opponent whose nerve has been read",
    ethics: 'what a ruse may never do, and who may never be handed over',
  },
};
