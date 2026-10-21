/**
 * v0.7.1 held-out paraphrases (tests/v071/heldout.ts), written before the routing was built and
 * not used to tune it. First run (2026-10-21): Fleet 12/12, career 10/10, negatives 7/7 not captured.
 * Caveat: the same author wrote the list and then the classifier, so this shows generality only
 * as far as one author's paraphrases go.
 */
import { describe, expect, it } from 'vitest';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import { completeIntro } from '../../src/engine/turn';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';
import { HELDOUT_CAREER, HELDOUT_FLEET, HELDOUT_NEGATIVE } from './heldout';

const ctx = contextFrom(completeIntro(createBridge(7), bridgeScenario));
const op = (c: string) => {
  const r = interpretSync(c, ctx);
  return r.kind === 'actions' ? r.actions.map((a) => (a as { op?: string }).op).find(Boolean) ?? null : null;
};

describe('held-out paraphrases', () => {
  it('Fleet Command addressees', () => {
    const hits = HELDOUT_FLEET.filter((c) => op(c) === 'fleet');
    expect(hits).toEqual(HELDOUT_FLEET);
  });
  it('career and training questions', () => {
    const hits = HELDOUT_CAREER.filter((c) => op(c) === 'career');
    expect(hits).toEqual(HELDOUT_CAREER);
  });
  it('orders that are neither are left alone', () => {
    const wrong = HELDOUT_NEGATIVE.filter((c) => op(c) === 'fleet' || op(c) === 'career');
    expect(wrong).toEqual([]);
  });
});
