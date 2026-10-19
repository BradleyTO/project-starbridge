/** Deep copies and deep freezing: snapshots handed out by stores can never be mutated in place. */

export type DeepReadonly<T> = T extends (infer U)[] ? readonly DeepReadonly<U>[] : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

export function clone<T>(v: T): T {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v)) as T;
}

export function deepFreeze<T>(v: T): DeepReadonly<T> {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const k of Object.keys(v as object)) deepFreeze((v as Record<string, unknown>)[k]);
  }
  return v as DeepReadonly<T>;
}

/** A mutable deep copy of a (possibly frozen) value. */
export function thaw<T>(v: DeepReadonly<T> | T): T {
  return clone(v) as T;
}
