import { describe, expect, it } from 'vitest';
import { SAVE_KEY, loadGame, saveGame } from './persistence';
import type { StorageLike } from './persistence';
import { createInitialState } from '../scenarios/kestrel/initialState';
import { applyCommand } from '../scenarios/kestrel/demoScript';

function memStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe('persistence', () => {
  it('round-trips world state', () => {
    const st = memStorage();
    const s = applyCommand(createInitialState(), 'scan the kestrel');
    saveGame(s, st);
    expect(loadGame(st)?.state).toEqual(s);
  });
  it('rejects corrupt or foreign saves', () => {
    const st = memStorage();
    expect(loadGame(st)).toBeNull();
    st.setItem(SAVE_KEY, '{not json');
    expect(loadGame(st)).toBeNull();
    st.setItem(SAVE_KEY, JSON.stringify({ meta: {}, state: { version: 2 } }));
    expect(loadGame(st)).toBeNull();
  });
});
