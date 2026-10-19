/** Report-only evaluation of the v0.5 held-out dialogue set. Results: tests/eval/RESULTS-dialogue.md. */
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { interpretFor, submit } from '../../src/engine/game';
import { K, start } from '../helpers';
import { deepMatch } from './heldout-v04.test';
import { HELD_OUT_DIALOGUE } from './heldout-dialogue';

const SPEECH = new Set(['speak', 'communicate', 'channel']);
const BENIGN = new Set(['posture', 'query', 'wait', 'learn']);
const isShip = (a: { type: string }) => !SPEECH.has(a.type) && !BENIGN.has(a.type);

export function evaluateDialogue() {
  return HELD_OUT_DIALOGUE.map((item) => {
    let s = start(42);
    for (const c of item.setup) s = submit(K, s, c);
    const r = interpretFor(s, item.line);
    const actions = (r.kind === 'unrecognised' ? [] : r.actions) as { type: string; [k: string]: unknown }[];
    const speech = actions.filter((a) => a.type === 'speak');
    const ship = actions.filter(isShip);
    const reasons: string[] = [];
    let unsafe = false;
    const clarified = r.kind === 'clarify' && !!item.allowClarify;
    const want = (item.expect ?? []).filter((w) => !(Array.isArray(w) ? w : [w]).some((alt) => actions.some((x) => deepMatch(x, alt))));
    const speechOk = () => speech.some((a) => (!item.to || a.to === item.to) && (!item.intents || item.intents.some((i) => (a.intents as string[] | undefined)?.includes(i))));
    switch (item.kind) {
      case 'dialogue':
        if (ship.length) { unsafe = true; reasons.push(`UNSAFE: dialogue line caused ship action ${JSON.stringify(ship)}`); }
        if (!clarified && !speechOk()) reasons.push(`no matching speech (kind=${r.kind})`);
        break;
      case 'command':
        if (!ship.length && speech.length) { unsafe = true; reasons.push('UNSAFE: crew command sent as speech'); }
        if (want.length) reasons.push(`missing ${JSON.stringify(want)}`);
        if (speech.length) reasons.push('extra speech');
        break;
      case 'channel':
        if (ship.length) { unsafe = true; reasons.push(`UNSAFE: channel order caused ship action ${JSON.stringify(ship)}`); }
        if (want.length) reasons.push(`missing ${JSON.stringify(want)}`);
        break;
      case 'mixed': {
        const allowedShip = ship.filter((a) => !(item.expect ?? []).flat().some((e) => deepMatch(a, e)));
        if (allowedShip.length) { unsafe = true; reasons.push(`UNSAFE: unexpected ship action ${JSON.stringify(allowedShip)}`); }
        if (!clarified) {
          if (want.length) reasons.push(`missing ${JSON.stringify(want)}`);
          if (!speechOk()) reasons.push('no matching speech');
        }
        break;
      }
      case 'noChannel':
        if (ship.length) { unsafe = true; reasons.push(`UNSAFE: ship action ${JSON.stringify(ship)}`); }
        if (!clarified && want.length) reasons.push(`missing ${JSON.stringify(want)}`);
        break;
    }
    return { line: item.line, setup: item.setup.join('; ') || '(none)', pass: reasons.length === 0, unsafe, reasons, got: r.kind === 'clarify' ? { clarify: r.clarification.question, actions } : actions };
  });
}

describe('v0.5 held-out dialogue evaluation (report only)', () => {
  it('measures and writes RESULTS-dialogue.md', () => {
    const res = evaluateDialogue();
    const passed = res.filter((r) => r.pass).length;
    const unsafe = res.filter((r) => r.unsafe).length;
    writeFileSync(
      new URL('./RESULTS-dialogue.md', import.meta.url),
      [
        '# Held-out dialogue evaluation (v0.5 set, committed before any v0.5 comms work)',
        '',
        `**Result: ${passed}/${res.length} passed (${((100 * passed) / res.length).toFixed(1)}%). Unsafe (dialogue → ship action, or command → speech): ${unsafe}.**`,
        '',
        '## Failures',
        '',
        ...res.filter((r) => !r.pass).map((r) => `- [${r.setup}] \`${r.line}\` — ${r.reasons.join('; ')}${r.unsafe ? ' **(UNSAFE)**' : ''}\n  - got: \`${JSON.stringify(r.got)}\``),
        '',
        '## Passing',
        '',
        ...res.filter((r) => r.pass).map((r) => `- [${r.setup}] \`${r.line}\``),
        '',
      ].join('\n'),
    );
    expect(res.length).toBeGreaterThanOrEqual(30);
  });
});
