/**
 * Report-only evaluation of the v0.4 held-out set (tests/eval/heldout-v04.ts).
 * Never fails on the success rate. Results: tests/eval/RESULTS-v04.md.
 */
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import { start } from '../helpers';
import { HELD_OUT_V04 } from './heldout-v04';

/** Deep partial match: every key in `e` matches `a`; arrays in `e` must each be matched by some element of `a`. */
export function deepMatch(a: unknown, e: unknown): boolean {
  if (Array.isArray(e)) return Array.isArray(a) && e.every((x) => a.some((y) => deepMatch(y, x)));
  if (e && typeof e === 'object') return !!a && typeof a === 'object' && Object.entries(e).every(([k, v]) => deepMatch((a as Record<string, unknown>)[k], v));
  return a === e;
}

export function evaluateV04() {
  return HELD_OUT_V04.map((item) => {
    const s = start(42);
    const ctx = contextFrom(item.lastTarget ? { ...s, lastTarget: item.lastTarget } : s);
    const r = interpretSync(item.order, ctx);
    const actions = (r.kind === 'unrecognised' ? [] : r.actions) as unknown[];
    const reasons: string[] = [];
    if (item.ask) {
      if (r.kind === 'actions') reasons.push('acted instead of asking');
    } else {
      if (r.kind !== 'actions') reasons.push(`kind=${r.kind}${r.kind === 'clarify' ? ` ("${r.clarification.question}")` : ''}`);
      const missing = (item.expect ?? []).filter((w) => !(Array.isArray(w) ? w : [w]).some((alt) => actions.some((x) => deepMatch(x, alt))));
      if (missing.length) reasons.push(`missing ${JSON.stringify(missing)}`);
      if (r.unparsed.length) reasons.push(`unparsed ${JSON.stringify(r.unparsed)}`);
    }
    const forbidden = (item.forbid ?? []).filter((f) => actions.some((x) => deepMatch(x, f)));
    if (forbidden.length) reasons.push(`FORBIDDEN ${JSON.stringify(forbidden)}`);
    return { order: item.order, pass: reasons.length === 0, unsafe: forbidden.length > 0 || (item.ask && r.kind === 'actions'), reasons, got: actions };
  });
}

describe('v0.4 held-out evaluation (report only)', () => {
  it('measures the parse success rate and writes RESULTS-v04.md', () => {
    const res = evaluateV04();
    const passed = res.filter((r) => r.pass).length;
    const unsafe = res.filter((r) => r.unsafe).length;
    const lines = [
      '# Held-out interpreter evaluation (v0.4 set)',
      '',
      `Set: tests/eval/heldout-v04.ts (${res.length} orders, committed before any v0.4 interpreter work).`,
      'Context: seed 42 after the intro (both contacts visible); some items set a previous target.',
      '',
      `**Result: ${passed}/${res.length} passed (${((100 * passed) / res.length).toFixed(1)}%). Unsafe (forbidden action taken, or acted instead of asking): ${unsafe}.**`,
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
    writeFileSync(new URL('./RESULTS-v04.md', import.meta.url), lines.join('\n'));
    expect(res.length).toBe(HELD_OUT_V04.length);
  });
});
