import { expect } from 'vitest';
import { quietScenario } from '../../src/scenarios/quiet';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { ANSWERS, quiet, type QuietVariant } from '../../src/scenarios/quiet/setup';

export const QS = quietScenario;

export function startQ(seed: number | string): WorldState {
  return completeIntro(QS.create(seed), QS);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playQ(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    s = submit(QS, s, c);
    if (check) expect(checkInvariants(s), `after "${c}"`).toEqual([]);
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

/** First seed whose variant matches. */
export function seedWhere(pred: (v: QuietVariant) => boolean, limit = 3000): number {
  for (let i = 1; i <= limit; i++) if (pred(quiet(QS.create(i)))) return i;
  throw new Error('no seed');
}

/** The right answer to question q (0 or 1) for this run. */
export const rightAnswer = (s: WorldState, q: 0 | 1) => ANSWERS[quiet(s).grammar][q];
export const decoyAnswer = (s: WorldState, q: 0 | 1) => ANSWERS[quiet(s).decoy][q];

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders that must never appear in this scenario's narration. */
export const LEAK = /\b(Kestrel|Vane|Arden|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Marr|Thornwake|Ilun)\b|\[[a-zA-Z_]+\]|undefined|NaN/;

/** Szabo works with the pulsar timing and the main dish: the fastest honest decode. */
export const DECODE = ['Szabo, work on the code', 'scan the pulsar', 'use the main dish as a receiver', 'wait', 'wait', 'wait'];
/** Answer both questions in the confirmed grammar. */
export const answerBoth = (s: WorldState): WorldState => playQ(s, [`Szabo, send them ${rightAnswer(s, 0)}`, `Szabo, send them ${rightAnswer(s, 1)}`]);

