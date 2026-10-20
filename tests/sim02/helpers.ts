import { expect } from 'vitest';
import { tallisScenario } from '../../src/scenarios/tallis';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { tallis, type TallisVariant } from '../../src/scenarios/tallis/setup';

export const TS = tallisScenario;

export function startT(seed: number | string): WorldState {
  return completeIntro(TS.create(seed), TS);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playT(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    s = submit(TS, s, c);
    if (check) expect(checkInvariants(s), `after "${c}"`).toEqual([]);
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

/** First seed whose variant matches. */
export function seedWhere(pred: (v: TallisVariant) => boolean, limit = 2000): number {
  for (let i = 1; i <= limit; i++) if (pred(tallis(TS.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders that must never appear in this scenario's narration. */
export const LEAK = /\b(Kestrel|Vane|Arden|Ashen Covenant|Prefect|Directorate|freighter|compartment|isotopes?|Calloway|Reach)\b|\[[a-zA-Z_]+\]/;
