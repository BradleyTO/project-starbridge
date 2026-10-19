/**
 * Report-only evaluation of the held-out order set (tests/eval/heldout.ts).
 * This never fails on the success rate: it measures, it does not tune.
 * Results are written to tests/eval/RESULTS.md.
 */
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import { start } from '../helpers';
import { HELD_OUT, type Expect } from './heldout';

const matches = (a: Record<string, unknown>, e: Record<string, unknown>) => Object.entries(e).every(([k, v]) => a[k] === v);

export function evaluate() {
  const ctx = contextFrom(start(42));
  return HELD_OUT.map(({ order, expect: want }) => {
    const r = interpretSync(order, ctx);
    const actions = (r.kind === 'unrecognised' ? [] : r.actions) as Record<string, unknown>[];
    const missing = want.filter((w: Expect) => !(Array.isArray(w) ? w : [w]).some((alt) => actions.some((a) => matches(a, alt))));
    const reasons: string[] = [];
    if (r.kind !== 'actions') reasons.push(`kind=${r.kind}${r.kind === 'clarify' ? ` ("${r.clarification.question}")` : ''}`);
    if (missing.length) reasons.push(`missing ${JSON.stringify(missing)}`);
    if (r.unparsed.length) reasons.push(`unparsed ${JSON.stringify(r.unparsed)}`);
    return { order, pass: reasons.length === 0, reasons, got: actions };
  });
}

describe('held-out evaluation (report only)', () => {
  it('measures the parse success rate and writes RESULTS.md', () => {
    const res = evaluate();
    const passed = res.filter((r) => r.pass).length;
    const pct = ((100 * passed) / res.length).toFixed(1);
    const lines = [
      '# Held-out interpreter evaluation',
      '',
      `Set: tests/eval/heldout.ts (${res.length} orders, committed before v0.3 interpreter tuning in b561633).`,
      `Context: seed 42 after the intro (both contacts visible, no prior target).`,
      '',
      `**Result: ${passed}/${res.length} passed (${pct}%).**`,
      '',
      '## Failures',
      '',
      ...res.filter((r) => !r.pass).map((r) => `- \`${r.order}\` — ${r.reasons.join('; ')}\n  - got: \`${JSON.stringify(r.got)}\``),
      '',
      '## Passes',
      '',
      ...res.filter((r) => r.pass).map((r) => `- \`${r.order}\``),
      '',
    ];
    writeFileSync(new URL('./RESULTS.md', import.meta.url), lines.join('\n'));
    expect(res.length).toBe(HELD_OUT.length);
  });
});
