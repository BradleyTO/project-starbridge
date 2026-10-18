import type { WorldState } from './types';

export const SAVE_KEY = 'starbridge.save.v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveMeta {
  savedAt: string;
  scenarioId: string;
  turn: number;
}

interface SaveFile {
  meta: SaveMeta;
  state: WorldState;
}

function isWorldState(v: unknown): v is WorldState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<WorldState>;
  return (
    s.version === 1 &&
    typeof s.scenarioId === 'string' &&
    typeof s.turn === 'number' &&
    Array.isArray(s.contacts) &&
    Array.isArray(s.objectives) &&
    Array.isArray(s.log) &&
    typeof s.ship === 'object'
  );
}

export function saveGame(state: WorldState, storage: StorageLike, now = new Date()): SaveMeta {
  const meta: SaveMeta = { savedAt: now.toISOString(), scenarioId: state.scenarioId, turn: state.turn };
  const file: SaveFile = { meta, state };
  storage.setItem(SAVE_KEY, JSON.stringify(file));
  return meta;
}

export function loadGame(storage: StorageLike): { meta: SaveMeta; state: WorldState } | null {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveFile>;
    if (!parsed.meta || !isWorldState(parsed.state)) return null;
    return { meta: parsed.meta, state: parsed.state };
  } catch {
    return null;
  }
}

export function peekSave(storage: StorageLike): SaveMeta | null {
  return loadGame(storage)?.meta ?? null;
}
