import { describe, expect, it } from 'vitest';
import { REGULATIONS, regulation } from '../../src/evaluation/regulations';
import { article, ARTICLES } from '../../src/handbook';

/** The v0.7 catalogue, verbatim (copied from src/evaluation/regulations.ts at v0.7.1). Must never change. */
const V07: { id: string; title: string; text: string }[] = [
  { id: 'reg-7.1', title: 'Reg. 7.1, Refusing a directive', text: 'A mandatory directive may be refused only formally and with a stated reason; a refusal without one is a breach.' },
  { id: 'reg-7.2', title: 'Reg. 7.2, Fitness for duty', text: 'A directive may be declined when the ship is not fit for the duty it requires.' },
  { id: 'reg-7.3', title: 'Reg. 7.3, Lifesaving precedence', text: 'An existing lifesaving commitment takes precedence over a later directive.' },
  { id: 'reg-7.4', title: 'Reg. 7.4, Treaty law', text: 'A directive that would breach treaty law may be refused.' },
  { id: 'reg-12', title: 'Reg. 12, Lawful directives', text: 'A captain carries out a lawful directive. Failure is mitigated where the captain was saving life.' },
  { id: 'border-accords-4', title: 'Border Accords, Art. 4', text: 'Humanitarian rescue in disputed space is not a hostile act and may not be treated as one by either signatory.' },
  { id: 'roe-1', title: 'Rules of Engagement §1, Non-combatants', text: 'ISA weapons are never used against non-combatants who pose no threat.' },
  { id: 'roe-2', title: 'Rules of Engagement §2, Proportion and escalation', text: 'Force is a last resort. An ISA ship does not fire first, lock weapons as a threat, or escalate a dispute while other means remain.' },
  { id: 'roe-3', title: 'Rules of Engagement §3, Protection of the ship', text: 'A captain does not expose the ship and crew to avoidable risk; shields stay up while under a hostile weapons lock.' },
  { id: 'care-1', title: 'Duty of Care §1, Civilians', text: 'The safety of civilians in the ship’s care comes first among a captain’s duties.' },
  { id: 'care-2', title: 'Duty of Care §2, Crew', text: 'Crew are not sent into avoidable danger; known hazards are contained before a team is sent.' },
  { id: 'quarantine-1', title: 'Colonial Quarantine Accord §1', text: 'A colony’s quarantine is lawful and respected; an ISA ship may contest it only with evidence, never by force.' },
  { id: 'quarantine-2', title: 'Colonial Quarantine Accord §2', text: 'Contagion is never knowingly carried into a settlement or aboard an ISA ship without isolation.' },
  { id: 'honesty-1', title: 'Code of Conduct §4, Honesty', text: 'An ISA officer does not deceive the parties to a dispute about facts on which lives depend, and keeps commitments made on the record.' },
  { id: 'asylum-1', title: 'Code of Conduct §9, Asylum', text: 'A person seeking the ISA’s protection is not handed to a power that would harm them.' },
];

describe('v0.8.0 regulations compatibility layer', () => {
  it('keeps the 15 v0.7 ids, order, titles and texts byte-identical', () => {
    expect(REGULATIONS.map((r) => ({ ...r }))).toEqual(V07);
    for (const r of V07) expect(regulation(r.id)).toEqual(r);
    expect(regulation('no-such-reg')).toBeUndefined();
  });
  it('every v0.7 id is a handbook article whose revision 0 is the v0.7 wording', () => {
    for (const r of V07) {
      const a = article(r.id)!;
      expect(a, r.id).toBeDefined();
      expect(a.revisions[0]).toMatchObject({ rev: 0, title: r.title, text: r.text });
      expect(a.revision).toBe(a.revisions.at(-1)!.rev);
      expect(a.formerly).toBe(r.title);
    }
  });
  it('new articles have no revision 0', () => {
    const v07 = new Set(V07.map((r) => r.id));
    for (const a of ARTICLES.filter((x) => !v07.has(x.id))) expect(a.revisions.map((r) => r.rev)).toEqual([1]);
  });
});
