/**
 * v0.7 after-action evaluation descriptor for Training Simulation 007, Ghost Ledger.
 * Command challenge (roadmap): deduction (primary): working out from the ship's own record, not
 * from anyone's manner, which of four guests copied the navigation keys; bluffing (secondary):
 * feeding the thief false keys, or a quiet word with the handler, once the case is made.
 * Pivotal officer: Lieutenant Commander Rask (Tactical), who keeps the case board and has a hunch.
 * Judged on what the captain knew when each decision was made (ISA-COM-001 §1.4), not on which
 * commands were typed. Acting on Rask's hunch is lawful; it is judged here as a poor decision.
 *
 * Regulations cited are existing ISA-COM-001 ids from the evaluator's catalogue (src/evaluation/regulations)
 * only: care-1 (§4.1–4.2) and roe-2 (§3.1–3.2). The handbook also cross-references this simulation
 * from §1.4, §6.2, §6.4 and §7.4 for training, without changing what the evaluator cites.
 * ISA-COM-001 has no rule on accusing or detaining a person aboard only on evidence: that is an
 * exercise objective ('evidence') in outcome.ts, and a regulation is proposed for approval.
 *
 * The reckless/responsible pair: a quiet word with the handler, put on the record (responsible)
 * against the same arrangement kept off the record (reckless). Same ending, different conduct.
 */
import type { EvaluationDescriptor } from '../../evaluation/types';

export const ledgerEvaluation: EvaluationDescriptor = {
  version: 'ledger-eval-1',
  objectives: { keys: 'primary', thief: 'primary', guests: 'secondary', evidence: 'secondary' },
  endings: {
    unmasked: { tier: 'success', note: 'The evidence pointed to one guest alone, and the captain made the case.' },
    'counter-feed': { tier: 'success', note: 'The thief was identified and allowed to leave with false keys.' },
    'quiet-word': { tier: 'success', note: 'With the evidence in hand, the copy came back through the handler, without a detention.' },
    'caught-in-the-act': { tier: 'success', note: 'The burst carrying the keys was caught on the array before it left the ship.' },
    'locks-changed': { tier: 'partial', note: 'The keys were protected by rekeying, but the thief was never identified.' },
    'hunch-without-proof': { tier: 'partial', note: 'The right guest was detained, but before the evidence could show it.' },
    'wrong-guest': { tier: 'failure', note: 'An innocent guest was accused, and the thief left with the copy.' },
    'keys-gone': { tier: 'failure', note: 'The copied keys left the ship.' },
    'guest-harmed': { tier: 'failure', note: 'A guest was hurt under the captain’s orders.' },
    'diplomatic-incident': { tier: 'failure', note: 'Force was used on a ship alongside at a peaceful waypoint.' },
  },
  markers: [
    { id: 'timed-the-copy', judgment: 'responsible', competencies: ['analysis', 'scientific'], text: 'Established when the keys were copied before asking who.', when: (s) => !!s.facts.copyTime?.known },
    { id: 'pulled-the-logs', judgment: 'responsible', competencies: ['analysis', 'crew'], text: 'Had the badge logs pulled, so the guests’ movements were facts and not impressions.', when: (s) => !!s.facts.doors?.known },
    { id: 'traced-the-device', judgment: 'responsible', competencies: ['analysis', 'scientific'], text: 'Had the console’s port traced to find what kind of device took the copy.', when: (s) => !!s.facts.device?.known },
    { id: 'checked-stories', judgment: 'responsible', competencies: ['analysis', 'crew'], text: 'Checked what the guests said against the ship’s own record, instead of judging who seemed honest.', flag: 'checkedStory', when: (s) => (s.counters.checks ?? 0) >= 2 },
    { id: 'asked-consent', judgment: 'principled', competencies: ['ethics', 'communications'], text: 'Asked a guest’s consent before searching them.', flag: 'searchedWithConsent', when: (s) => !!s.flags.searchedWithConsent },
    { id: 'evidence-first', judgment: 'principled', competencies: ['ethics', 'analysis'], text: 'Accused no one until the evidence pointed to one guest alone.', flag: 'accusedWithProof', when: (s) => !!s.flags.accusedWithProof },
    { id: 'took-the-caution', judgment: 'responsible', competencies: ['crew', 'ethics'], text: 'Heard Rask’s caution that the evidence did not yet point to one guest, and went back to the evidence.', flag: 'accuseWarned', when: (s) => !!s.flags.accuseWarned && !s.flags.accusedUnproven },
    { id: 'watched-traffic', judgment: 'responsible', competencies: ['communications', 'tactical'], text: 'Had outbound traffic watched, in case the copy was sent rather than carried.', flag: 'watching', when: (s) => !!s.flags.watching },
    { id: 'rekeyed', judgment: 'responsible', competencies: ['engineering', 'resources'], text: 'Had the navigation keys changed, so the copy would be worthless whoever had it.', flag: 'rekeyed', when: (s) => !!s.flags.rekeyed },
    { id: 'false-keys', judgment: 'decisive', competencies: ['tactical', 'engineering'], text: 'Let a proven thief leave with false keys, so the Directorate would learn nothing true.', flag: 'counterFed', when: (s) => !!s.flags.counterFed },
    { id: 'on-the-record', judgment: 'responsible', competencies: ['diplomacy', 'ethics'], text: 'Settled the theft quietly with the handler, and put the arrangement on the record for Fleet Command.', flag: 'quietDeal', when: (s) => !!s.flags.quietDeal && !s.flags.offRecord },
    { id: 'off-the-record', judgment: 'reckless', competencies: ['ethics', 'diplomacy'], text: 'Settled the theft with the handler and promised to keep it off the record, from Fleet Command too.', flag: 'offRecord', when: (s) => !!s.flags.offRecord },
    { id: 'accused-on-a-hunch', judgment: 'reckless', competencies: ['analysis', 'ethics'], text: 'Accused a guest after being told the evidence did not yet point to them alone.', flag: 'accusedUnproven', when: (s) => !!s.flags.accusedUnproven },
    { id: 'force-on-a-guest', judgment: 'reckless', competencies: ['ethics', 'crew'], text: 'Ordered force on a guest aboard after Rask refused to treat it as a way of getting answers.', flag: 'harmedGuest', regulation: 'care-1', safety: 'civilian', when: (s) => !!s.flags.harmedGuest },
    { id: 'force-on-a-ship', judgment: 'reckless', competencies: ['tactical', 'diplomacy'], text: 'Used force on an unarmed ship alongside at a peaceful waypoint.', flag: 'usedForce', regulation: 'roe-2', safety: 'civilian', when: (s) => !!s.flags.usedForce },
    { id: 'accused-the-courier', judgment: 'reckless', competencies: ['diplomacy', 'communications'], text: 'Accused the Directorate courier of espionage with no evidence to show.', flag: 'accusedCourier', when: (s) => !!s.flags.accusedCourier },
  ],
  regulations: ['care-1', 'roe-2'],
  competencies: ['analysis', 'ethics', 'crew', 'communications'],
  recommend: {
    analysis: 'establishing the time, the movements and the device before asking who, and checking every story against the ship’s own record',
    ethics: 'accusing no one until the evidence points to them alone, and treating every guest as innocent until it does',
  },
};
