import type { WorldState } from './types';

/** Save format v3: the full authoritative WorldState (including seed, RNG state and kinematics). */
export const SAVE_KEY = 'starbridge.save.v3';
/** Saves from earlier versions (v0.1 / v0.2) are recognised but cannot be loaded. */
export const LEGACY_SAVE_KEYS = ['starbridge.save.v2', 'starbridge.save.v1'];
export const LEGACY_SAVE_KEY = LEGACY_SAVE_KEYS[0];
export const SAVE_FORMAT_VERSION = 3;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveMeta {
  format: number;
  savedAt: string;
  scenarioId: string;
  seed: number;
  turn: number;
  appVersion: string;
}

interface SaveFile {
  meta: SaveMeta;
  state: WorldState;
}

export type LoadResult = { ok: true; meta: SaveMeta; state: WorldState } | { ok: false; reason: 'none' | 'corrupt' | 'legacy' | 'version' };

export function isWorldState(v: unknown): v is WorldState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<WorldState>;
  return (
    s.version === 3 &&
    typeof s.scenarioId === 'string' &&
    typeof s.seed === 'number' &&
    typeof s.rng === 'number' &&
    typeof s.turn === 'number' &&
    !!s.ships && !!s.ships.halcyon && !!s.ships.kestrel && !!s.ships.cruiser &&
    !!s.characters && !!s.facts && Array.isArray(s.log) && Array.isArray(s.pending) && !!s.orders &&
    Array.isArray(s.orders.list) &&
    !!s.posture &&
    typeof s.ships.halcyon.heading === 'number' &&
    !!s.ships.halcyon.velocity
  );
}

export function saveGame(state: WorldState, storage: StorageLike, appVersion: string, now = new Date()): SaveMeta {
  const meta: SaveMeta = { format: SAVE_FORMAT_VERSION, savedAt: now.toISOString(), scenarioId: state.scenarioId, seed: state.seed, turn: state.turn, appVersion };
  storage.setItem(SAVE_KEY, JSON.stringify({ meta, state } satisfies SaveFile));
  return meta;
}

export function loadGame(storage: StorageLike): LoadResult {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return { ok: false, reason: LEGACY_SAVE_KEYS.some((k) => storage.getItem(k)) ? 'legacy' : 'none' };
  try {
    const parsed = JSON.parse(raw) as Partial<SaveFile>;
    if (!parsed.meta || parsed.meta.format !== SAVE_FORMAT_VERSION) return { ok: false, reason: 'version' };
    if (!isWorldState(parsed.state)) return { ok: false, reason: 'corrupt' };
    return { ok: true, meta: parsed.meta, state: parsed.state };
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
}

export function peekSave(storage: StorageLike): SaveMeta | null {
  const r = loadGame(storage);
  return r.ok ? r.meta : null;
}
