/** Report-only evaluation of the v0.4b held-out set. Results: tests/eval/RESULTS-v04b.md. */
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import { start } from '../helpers';
import { deepMatch } from './heldout-v04.test';
import { HELD_OUT_V04B } from './heldout-v04b';

describe('v0.4b held-out evaluation (report only)', () => {
  it('measures and writes RESULTS-v04b.md', () => {
    const res = HELD_OUT_V04B.map((item) => {
      const s = start(42);
      const r = interpretSync(item.order, contextFrom(item.lastTarget ? { ...s, lastTarget: item.lastTarget } : s));
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
      return { order: item.order, pass: reasons.length === 0, unsafe: forbidden.length > 0 || (!!item.ask && r.kind === 'actions'), reasons, got: actions };
    });
    const passed = res.filter((r) => r.pass).length;
    const unsafe = res.filter((r) => r.unsafe).length;
    writeFileSync(new URL('./RESULTS-v04b.md', import.meta.url), [
      '# Held-out interpreter evaluation (v0.4b set: written after v0.4 parser work, never tuned against)',
      '',
      `**Result: ${passed}/${res.length} passed (${((100 * passed) / res.length).toFixed(1)}%). Unsafe: ${unsafe}.**`,
      '',
      '## Failures',
      '',
      ...res.filter((r) => !r.pass).map((r) => `- \`${r.order}\` — ${r.reasons.join('; ')}${r.unsafe ? ' **(UNSAFE)**' : ''}\n  - got: \`${JSON.stringify(r.got)}\``),
      '',
      '## Passes',
      '',
      ...res.filter((r) => r.pass).map((r) => `- \`${r.order}\``),
      '',
    ].join('\n'));
    expect(res.length).toBe(HELD_OUT_V04B.length);
  });
});
