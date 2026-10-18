import type { WorldState } from '../engine/types';
import { createInitialState } from '../scenarios/kestrel/initialState';
import { advanceOpening, applyCommand, completeOpening } from '../scenarios/kestrel/demoScript';

export type GameAction =
  | { type: 'beat' }
  | { type: 'skipIntro' }
  | { type: 'command'; text: string }
  | { type: 'load'; state: WorldState }
  | { type: 'restart' };

export function gameReducer(state: WorldState, action: GameAction): WorldState {
  switch (action.type) {
    case 'beat':
      return advanceOpening(state);
    case 'skipIntro':
      return completeOpening(state);
    case 'command':
      return applyCommand(state, action.text);
    case 'load':
      return action.state;
    case 'restart':
      return createInitialState();
  }
}
