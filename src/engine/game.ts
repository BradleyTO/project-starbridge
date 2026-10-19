/** Convenience facade used by the UI and tests. */
import type { ScenarioModule } from './scenario';
import type { WorldState } from './types';
import type { Interpretation } from './schema';
import { completeIntro, playIntroBeat, processOrders } from './turn';
import { contextFrom } from '../interpreter/types';
import { interpretSync } from '../interpreter/parser';

export function newGame(scenario: ScenarioModule, seed: number | string): WorldState {
  return scenario.create(seed);
}

export function interpretFor(state: WorldState, text: string): Interpretation {
  return interpretSync(text, contextFrom(state));
}

/** Synchronous offline path: parse with the offline interpreter and process the turn. */
export function submit(scenario: ScenarioModule, state: WorldState, text: string): WorldState {
  const s = completeIntro(state, scenario);
  return processOrders(s, text, interpretFor(s, text), scenario).state;
}

export { completeIntro, playIntroBeat, processOrders };
