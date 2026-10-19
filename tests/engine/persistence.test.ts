import { describe, expect, it } from 'vitest';
import { LEGACY_SAVE_KEY, SAVE_KEY, loadGame, peekSave, saveGame } from '../../src/engine/persistence';
import type { StorageLike } from '../../src/engine/persistence';
import { play, start } from '../helpers';

function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe('persistence v3', () => {
  it('round-trips the full world state including seed and RNG', () => {
    const st = memory();
    const s = play(start('save-test'), ['scan the kestrel', 'approach the kestrel', 'hail the cruiser']);
    const meta = saveGame(s, st, '0.3.0', new Date('2026-10-18T12:00:00Z'));
    expect(meta).toMatchObject({ format: 3, seed: s.seed, turn: s.turn, scenarioId: s.scenarioId, appVersion: '0.3.0' });
    const r = loadGame(st);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state).toEqual(s);
    expect(r.state.rng).toBe(s.rng);
    // A loaded game continues exactly like the original would.
    expect(JSON.stringify(play(r.state, ['wait', 'evacuate the crew'], false))).toBe(JSON.stringify(play(s, ['wait', 'evacuate the crew'], false)));
    expect(peekSave(st)?.turn).toBe(s.turn);
  });

  it('reports missing, corrupt, legacy and wrong-version saves without throwing', () => {
    const st = memory();
    expect(loadGame(st)).toEqual({ ok: false, reason: 'none' });
    st.setItem(LEGACY_SAVE_KEY, '{"old":true}');
    expect(loadGame(st)).toEqual({ ok: false, reason: 'legacy' });
    st.removeItem(LEGACY_SAVE_KEY);
    st.setItem('starbridge.save.v1', '{"old":true}');
    expect(loadGame(st)).toEqual({ ok: false, reason: 'legacy' });
    st.setItem(SAVE_KEY, 'not json{');
    expect(loadGame(st)).toEqual({ ok: false, reason: 'corrupt' });
    st.setItem(SAVE_KEY, JSON.stringify({ meta: { format: 1 }, state: {} }));
    expect(loadGame(st)).toEqual({ ok: false, reason: 'version' });
    st.setItem(SAVE_KEY, JSON.stringify({ meta: { format: 2 }, state: { version: 2 } }));
    expect(loadGame(st)).toEqual({ ok: false, reason: 'version' });
    st.setItem(SAVE_KEY, JSON.stringify({ meta: { format: 3 }, state: { version: 2 } }));
    expect(loadGame(st)).toEqual({ ok: false, reason: 'corrupt' });
    expect(peekSave(st)).toBeNull();
  });
});
