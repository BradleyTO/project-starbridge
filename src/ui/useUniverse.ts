import { useCallback, useMemo, useState } from 'react';
import type { StorageLike } from '../engine/persistence';
import { kestrelScenario } from '../scenarios/kestrel';
import { Universe } from '../universe/controller';
import { defaultLedger } from '../universe/credits';
import { localRepository, memoryStorage } from '../universe/repository';

function storage(): StorageLike {
  try {
    const s = window.localStorage;
    const k = '__starbridge_probe__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return memoryStorage();
  }
}

/** One Universe service per page, plus a revision counter so views re-read the stores after changes. */
export function useUniverse(appVersion: string): { universe: Universe; rev: number; touch: () => void } {
  const universe = useMemo(() => new Universe({ repo: localRepository(storage(), () => defaultLedger()), appVersion, scenarios: { [kestrelScenario.id]: kestrelScenario } }), [appVersion]);
  const [rev, setRev] = useState(0);
  const touch = useCallback(() => setRev((n) => n + 1), []);
  return { universe, rev, touch };
}
