import { expect } from 'vitest';
import { kestrelScenario } from '../src/scenarios/kestrel';
import { completeIntro, processOrders } from '../src/engine/turn';
import { submit } from '../src/engine/game';
import { checkInvariants } from '../src/engine/invariants';
import type { ProposedActionInput } from '../src/engine/schema';
import type { ScenarioVariant, WorldState } from '../src/engine/types';

export const K = kestrelScenario;

export function start(seed: number | string = 42): WorldState {
  return completeIntro(K.create(seed), K);
}

/** Play natural-language orders through the offline interpreter, checking invariants after each. */
export function play(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    s = submit(K, s, c);
    if (check) expect(checkInvariants(s), `after "${c}"`).toEqual([]);
  }
  return s;
}

/** Apply typed ProposedActions directly (bypassing the parser). */
export function act(s: WorldState, ...actions: ProposedActionInput[]): WorldState {
  return processOrders(s, '(test)', { kind: 'actions', actions: actions as never, unparsed: [], source: 'test' }, K).state;
}

export function textSince(s: WorldState, fromId = 0): string {
  return s.log.filter((e) => e.id > fromId).map((e) => `${e.speaker}: ${e.text}`).join('\n');
}

export function lastId(s: WorldState): number {
  return s.nextLogId - 1;
}

/** First seed (from 1) whose generated variant satisfies the predicate. */
export function findSeed(pred: (v: ScenarioVariant) => boolean, limit = 5000): number {
  for (let i = 1; i <= limit; i++) if (pred(K.create(i).variant)) return i;
  throw new Error('no seed found');
}
