/** Report-only evaluation of the Phase D duty-bridge held-out set. Results: tests/eval/RESULTS-duty.md. */
import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import { completeIntro } from '../../src/engine/turn';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';
import type { WorldState } from '../../src/engine/types';
import { DUTY_ITEMS, DUTY_ITEMS_2, type DutyItem } from './heldout-duty';

function stateFor(ctx: DutyItem['ctx']): WorldState {
  const s = completeIntro(createBridge(5), bridgeScenario);
  const systems = (s.survey?.systems ?? []).map((x, i) => ({ ...x, name: ['Merrow', 'Teshra', 'Ostrava', 'Hadrian', 'Orelle'][i] ?? x.name }));
  const incoming = ctx === 'directive' || ctx === 'distress' || ctx === 'voluntary' ? { offerId: 'OF-1', channel: 'hail' as const, classification: ctx, from: 'Fleet Command', title: 't', briefing: 'b' } : null;
  let out: WorldState = { ...s, survey: { systems, course: null, live: true }, duty: { live: true, location: 'station', incoming, contact: null } };
  if (ctx === 'channel') out = { ...out, ships: { ...out.ships, kestrel: { ...out.ships.kestrel, detected: true } }, comms: { channels: [{ party: 'kestrel', state: 'open', private: false, openedTurn: 0 } as never], active: 'kestrel', history: [], topic: null, declared: [], promises: [], commitments: [], pending: null, repeats: {}, suggestions: [] } as never };
  return out;
}

function label(text: string, ctx: DutyItem['ctx']): string {
  const r = interpretSync(text, contextFrom(stateFor(ctx)));
  if (r.kind !== 'actions') return r.kind;
  const b = r.actions.find((a) => a.type === 'bridge') as { op: string; scenario?: string } | undefined;
  if (!b) return 'not-bridge';
  return b.op === 'respond' ? `respond:${(b.scenario ?? '').split(':')[0]}` : b.op;
}

describe('held-out duty-bridge phrasings (report only)', () => {
  it('measures set 1 and writes RESULTS-duty.md', () => report(DUTY_ITEMS, process.env.DUTY_OUT ?? './RESULTS-duty.md', '# Held-out duty-bridge evaluation (Phase D, written before its first run)'));
  it('measures set 2 and writes RESULTS-duty-2.md', () => report(DUTY_ITEMS_2, process.env.DUTY2_OUT ?? './RESULTS-duty-2.md', '# Held-out duty-bridge evaluation — set 2 (written after set 1 was tuned, before its own first run)'));
});

function report(items: DutyItem[], file: string, title: string) {
  {
    const rows = items.map((it) => {
      const got = label(it.text, it.ctx);
      const ok = got === it.expect;
      const unsafe = !ok && (it.unsafe ?? []).includes(got);
      return { ...it, got, ok, unsafe };
    });
    const pass = rows.filter((r) => r.ok).length;
    const unsafe = rows.filter((r) => r.unsafe).length;
    const lines = [
      title,
      '',
      `**Result: ${pass}/${rows.length} passed (${((100 * pass) / rows.length).toFixed(1)}%). Unsafe (a call answered the wrong way, or speech taken as a duty order): ${unsafe}.**`,
      '',
      '| # | context | line | expected | got | |',
      '|---|---|---|---|---|---|',
      ...rows.map((r, i) => `| ${i + 1} | ${r.ctx} | ${r.text} | ${r.expect} | ${r.got} | ${r.ok ? 'ok' : r.unsafe ? '**UNSAFE**' : 'miss'} |`),
    ];
    writeFileSync(new URL(file, import.meta.url), lines.join('\n') + '\n');
  }
}
