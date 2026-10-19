import type { WorldState } from './types';

/**
 * Simulation save slot (format v4): the full authoritative WorldState (seed, RNG
 * state, kinematics, standing orders). Canonical Living Universe data is stored
 * separately by src/universe/repository.ts and never through this slot.
 */
export const SAVE_KEY = 'starbridge.save.v4';
/** v0.3 saves: migrated forward on load. */
export const MIGRATABLE_SAVE_KEYS = ['starbridge.save.v3'];
/** Saves from v0.1 / v0.2 are recognised but cannot be loaded (different world model). */
export const LEGACY_SAVE_KEYS = ['starbridge.save.v2', 'starbridge.save.v1'];
export const LEGACY_SAVE_KEY = LEGACY_SAVE_KEYS[0];
export const SAVE_FORMAT_VERSION = 4;
export const WORLD_STATE_VERSION = 4;

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
  /** Set when the save was upgraded from an older format on load. */
  migratedFrom?: number;
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
    s.version === WORLD_STATE_VERSION &&
    typeof s.scenarioId === 'string' &&
    typeof s.seed === 'number' &&
    typeof s.rng === 'number' &&
    typeof s.turn === 'number' &&
    !!s.ships && !!s.ships.halcyon && !!s.ships.kestrel && !!s.ships.cruiser &&
    !!s.characters && !!s.facts && Array.isArray(s.log) && Array.isArray(s.pending) && !!s.orders &&
    Array.isArray(s.orders.list) &&
    !!s.posture &&
    typeof s.ships.halcyon.heading === 'number' &&
    !!s.ships.halcyon.velocity &&
    !!s.provenance && (s.provenance.timeline === 'simulation' || s.provenance.timeline === 'canonical') &&
    Array.isArray(s.standing) && Array.isArray(s.restrictions) && !!s.familiarity
  );
}

/**
 * Upgrade a stored WorldState to the current version. v3 (v0.3.x) → v4 adds
 * provenance (always 'simulation': v0.3 had no canonical timeline), standing
 * orders, restrictions and familiarity. Returns null if it cannot be upgraded.
 */
export function migrateWorldState(raw: unknown): { state: WorldState; from: number } | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown> & { version?: number };
  if (r.version === WORLD_STATE_VERSION) return isWorldState(r) ? { state: r as unknown as WorldState, from: 4 } : null;
  if (r.version === 3) {
    const up = {
      ...r,
      version: 4,
      provenance: { timeline: 'simulation', missionId: null, archiveId: null, scenarioVersion: 'pre-1.1 (migrated from v0.3)' },
      standing: [],
      restrictions: [],
      familiarity: { drilled: {} },
    };
    return isWorldState(up) ? { state: up as unknown as WorldState, from: 3 } : null;
  }
  return null;
}

export function saveGame(state: WorldState, storage: StorageLike, appVersion: string, now = new Date()): SaveMeta {
  const meta: SaveMeta = { format: SAVE_FORMAT_VERSION, savedAt: now.toISOString(), scenarioId: state.scenarioId, seed: state.seed, turn: state.turn, appVersion };
  storage.setItem(SAVE_KEY, JSON.stringify({ meta, state } satisfies SaveFile));
  return meta;
}

function parseSave(raw: string, expectFormat: number): LoadResult {
  try {
    const parsed = JSON.parse(raw) as Partial<SaveFile>;
    if (!parsed.meta || parsed.meta.format !== expectFormat) return { ok: false, reason: 'version' };
    const m = migrateWorldState(parsed.state);
    if (!m) return { ok: false, reason: 'corrupt' };
    const meta: SaveMeta = m.from !== WORLD_STATE_VERSION ? { ...parsed.meta, format: SAVE_FORMAT_VERSION, migratedFrom: m.from } : parsed.meta;
    return { ok: true, meta, state: m.state };
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
}

export function loadGame(storage: StorageLike): LoadResult {
  const raw = storage.getItem(SAVE_KEY);
  if (raw) return parseSave(raw, SAVE_FORMAT_VERSION);
  const old = storage.getItem(MIGRATABLE_SAVE_KEYS[0]);
  if (old) return parseSave(old, 3);
  return { ok: false, reason: LEGACY_SAVE_KEYS.some((k) => storage.getItem(k)) ? 'legacy' : 'none' };
}

export function peekSave(storage: StorageLike): SaveMeta | null {
  const r = loadGame(storage);
  return r.ok ? r.meta : null;
}
