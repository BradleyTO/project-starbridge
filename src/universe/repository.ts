/**
 * Storage adapters. Each concern has its own key and schema version, so a
 * simulation can never overwrite canonical data by accident, and a future
 * cloud / account backend can implement the same interfaces.
 *
 *   starbridge.canon.v1         canonical timeline (commit gate only)
 *   starbridge.sim.v1           simulation run history (training / replays)
 *   starbridge.familiarity.v1   learned terminology, preferences, drills
 *   starbridge.credits.v1       daily canonical-start allowance (local, NOT tamper-proof)
 *   starbridge.entitlements.v1  dev entitlement toggles (no real payments)
 *   starbridge.save.v4          simulation save slot (engine/persistence.ts)
 */
import type { StorageLike } from '../engine/persistence';
import { migrateWorldState } from '../engine/persistence';
import type { WorldState } from '../engine/types';
import { clone, deepFreeze, type DeepReadonly } from './freeze';
import { TimelineViolation, assertCanonical, type CanonicalContext } from './gate';
import type { CanonicalState, CreditLedger, Entitlements, FamiliarityMemory, SimulationStoreState } from './types';
import { UNIVERSE_SCHEMA_VERSION } from './types';

export const KEYS = {
  canon: 'starbridge.canon.v1',
  sim: 'starbridge.sim.v1',
  familiarity: 'starbridge.familiarity.v1',
  credits: 'starbridge.credits.v1',
  entitlements: 'starbridge.entitlements.v1',
} as const;

export type LoadStatus = 'ok' | 'none' | 'corrupt-backed-up' | 'newer-version';

/** In-memory StorageLike (tests, private browsing, SSR). */
export function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

/**
 * A versioned JSON document under one key. Unknown newer versions are left
 * untouched (never overwritten); unreadable data is copied to a backup key
 * before anything replaces it, so saves are not silently lost.
 */
class VersionedDoc<T extends { version: number }> {
  status: LoadStatus = 'none';
  private storage: StorageLike;
  private key: string;
  private schema: string;
  private migrations: Record<number, Migration>;
  private validate: (v: unknown) => boolean;
  constructor(storage: StorageLike, key: string, schema: string, migrations: Record<number, Migration> = {}, validate: (v: unknown) => boolean = () => true) {
    this.storage = storage;
    this.key = key;
    this.schema = schema;
    this.migrations = migrations;
    this.validate = validate;
  }

  read(): T | null {
    const raw = this.storage.getItem(this.key);
    if (!raw) {
      this.status = 'none';
      return null;
    }
    try {
      let doc = JSON.parse(raw) as Record<string, unknown> & { version?: number; schema?: string };
      if (doc.schema !== this.schema || typeof doc.version !== 'number') throw new Error('schema');
      if (doc.version > UNIVERSE_SCHEMA_VERSION) {
        this.status = 'newer-version';
        return null;
      }
      while ((doc.version as number) < UNIVERSE_SCHEMA_VERSION) {
        const m = this.migrations[doc.version as number];
        if (!m) throw new Error('no migration');
        doc = m(doc) as typeof doc;
      }
      if (!this.validate(doc)) throw new Error('invalid');
      this.status = 'ok';
      return doc as unknown as T;
    } catch {
      this.storage.setItem(`${this.key}.corrupt-backup`, raw);
      this.storage.removeItem(this.key);
      this.status = 'corrupt-backed-up';
      return null;
    }
  }

  write(v: T): void {
    if (this.status === 'newer-version') throw new Error(`${this.key} was written by a newer version; refusing to overwrite it.`);
    this.storage.setItem(this.key, JSON.stringify(v));
  }
}

function isCanon(v: unknown): boolean {
  const c = v as Partial<CanonicalState>;
  return !!c && typeof c.profileId === 'string' && typeof c.revision === 'number' && Array.isArray(c.events) && !!c.missions && Array.isArray(c.offers);
}

/** Upgrade any WorldStates embedded in canonical records (e.g. v0.3-era progress) to the current engine version. */
function upgradeEmbeddedStates(c: CanonicalState): CanonicalState {
  for (const m of Object.values(c.missions)) {
    if (m.progress) m.progress = migrateWorldState(m.progress)?.state ?? null;
    if (m.snapshot.initial) m.snapshot.initial = migrateWorldState(m.snapshot.initial)?.state ?? null;
  }
  return c;
}

/** Every WorldState inside a canonical record must itself be canonical. */
function assertNoSimulationData(c: CanonicalState): void {
  const states: (WorldState | null)[] = Object.values(c.missions).flatMap((m) => [m.progress, m.snapshot.initial]);
  for (const s of states) {
    if (s && s.provenance.timeline !== 'canonical') throw new TimelineViolation('Simulation state cannot be written into the canonical record.');
  }
}

export class CanonStore {
  private doc: VersionedDoc<CanonicalState>;
  private cache: DeepReadonly<CanonicalState> | null | undefined;
  constructor(storage: StorageLike) {
    this.doc = new VersionedDoc<CanonicalState>(storage, KEYS.canon, 'starbridge.canon', {}, isCanon);
  }
  get status(): LoadStatus {
    return this.doc.status;
  }
  /** A deep-frozen view; mutating it throws in strict mode and never reaches storage. */
  read(): DeepReadonly<CanonicalState> | null {
    if (this.cache === undefined) {
      const c = this.doc.read();
      this.cache = c ? deepFreeze(upgradeEmbeddedStates(c)) : null;
    }
    return this.cache;
  }
  /**
   * THE commit gate. `update` receives a mutable deep copy and returns the next
   * canonical state; the result is checked and written atomically.
   */
  commit(ctx: CanonicalContext, update: (draft: CanonicalState) => CanonicalState): DeepReadonly<CanonicalState> {
    assertCanonical(ctx);
    const cur = this.read();
    const draft = cur ? (clone(cur) as CanonicalState) : null;
    if (!draft) throw new Error('No canonical profile yet: call initialise() first.');
    const next = update(draft);
    if (next.revision !== draft.revision) throw new Error('Commit must not change the revision itself.');
    assertNoSimulationData(next);
    const stored = { ...next, revision: draft.revision + 1 };
    this.doc.write(stored);
    this.cache = deepFreeze(clone(stored));
    return this.cache;
  }
  /** Create the canonical profile (once). */
  initialise(ctx: CanonicalContext, initial: CanonicalState): DeepReadonly<CanonicalState> {
    assertCanonical(ctx);
    if (this.read()) throw new Error('Canonical profile already exists.');
    assertNoSimulationData(initial);
    this.doc.write(initial);
    this.cache = deepFreeze(clone(initial));
    return this.cache;
  }
}

/** Simple last-writer-wins store for the non-canonical documents. */
export class PlainStore<T extends { version: number }> {
  private doc: VersionedDoc<T>;
  private fallback: () => T;
  constructor(storage: StorageLike, key: string, schema: string, fallback: () => T, validate?: (v: unknown) => boolean) {
    this.fallback = fallback;
    this.doc = new VersionedDoc<T>(storage, key, schema, {}, validate);
  }
  get status(): LoadStatus {
    return this.doc.status;
  }
  read(): T {
    return this.doc.read() ?? this.fallback();
  }
  write(v: T): void {
    this.doc.write(v);
  }
  update(fn: (v: T) => T): T {
    const next = fn(clone(this.read()));
    this.write(next);
    return next;
  }
}

export const defaultFamiliarity = (): FamiliarityMemory => ({
  schema: 'starbridge.familiarity',
  version: UNIVERSE_SCHEMA_VERSION,
  aliases: {},
  terms: {},
  comms: { onScreen: 0, offScreen: 0 },
  training: { simRuns: 0, drilled: {}, outcomes: {}, simulatedCasualties: 0 },
});
export const defaultSims = (): SimulationStoreState => ({ schema: 'starbridge.sim', version: UNIVERSE_SCHEMA_VERSION, runs: [], nextSeq: 1 });
export const defaultEntitlements = (): Entitlements => ({ schema: 'starbridge.entitlements', version: UNIVERSE_SCHEMA_VERSION, simulation: true, livingUniverse: false, source: 'default' });

export interface UniverseRepository {
  canon: CanonStore;
  sims: PlainStore<SimulationStoreState>;
  familiarity: PlainStore<FamiliarityMemory>;
  credits: PlainStore<CreditLedger>;
  entitlements: PlainStore<Entitlements>;
}

export function localRepository(storage: StorageLike, defaultLedger: () => CreditLedger): UniverseRepository {
  return {
    canon: new CanonStore(storage),
    sims: new PlainStore(storage, KEYS.sim, 'starbridge.sim', defaultSims),
    familiarity: new PlainStore(storage, KEYS.familiarity, 'starbridge.familiarity', defaultFamiliarity),
    credits: new PlainStore(storage, KEYS.credits, 'starbridge.credits', defaultLedger),
    entitlements: new PlainStore(storage, KEYS.entitlements, 'starbridge.entitlements', defaultEntitlements),
  };
}
