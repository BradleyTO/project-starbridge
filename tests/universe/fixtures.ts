import { submit } from '../../src/engine/game';
import type { WorldState } from '../../src/engine/types';
import { completeIntro } from '../../src/engine/turn';
import { K } from '../helpers';
import { USER_ORDER } from '../v03/fixtures';

/** Seed 14 (pragmatic Prefect): a peaceful interposition then evacuation ends in "Rescue Corridor". */
export const CANON_SEED = 14;
export const PEACEFUL_RUN = [USER_ORDER, 'wait', 'wait', 'wait', 'evacuate the crew', 'tell the prefect this is a humanitarian rescue'];
/** A different set of choices from the same start: an immediate withdrawal. */
export const WITHDRAW_RUN = ['withdraw', 'wait', 'jump', 'jump', 'jump'];

/** Play orders until the run ends (or the list runs out). */
export function playOut(s: WorldState, orders: string[]): WorldState {
  s = completeIntro(s, K);
  for (const o of orders) {
    if (s.outcome) break;
    s = submit(K, s, o);
  }
  return s;
}

/** Play the orders, then keep waiting until the run reaches an outcome. */
export function playToEnd(s: WorldState, orders: string[], maxWaits = 40): WorldState {
  s = playOut(s, orders);
  for (let i = 0; i < maxWaits && !s.outcome; i++) s = submit(K, s, 'wait');
  if (!s.outcome) throw new Error('run did not end');
  return s;
}
