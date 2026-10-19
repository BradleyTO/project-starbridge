/**
 * Mission Archive: built-in training missions plus every canonical mission the
 * captain has begun. Archive entries are read-only views; replays always run
 * as simulations.
 */
import type { DeepReadonly } from './freeze';
import type { CanonicalState, OfferClass, SimRunRecord, SimulationStoreState } from './types';

export interface TrainingMission {
  id: string;
  title: string;
  scenarioId: string;
  blurb: string;
}

export const TRAINING: TrainingMission[] = [
  {
    id: 'TRN-kestrel',
    title: 'Training Simulation 001: The Kestrel Incident',
    scenarioId: 'kestrel-incident',
    blurb: 'A crippled freighter, a Directorate cruiser and a hidden passenger. Seeded: every run can differ.',
  },
];

export interface ArchiveEntry {
  id: string;
  title: string;
  source: 'training' | 'canonical';
  classification: OfferClass | null;
  /** 'bridge' replays on the bridge; 'event' replays through the event model. */
  replay: 'bridge' | 'event';
  scenarioId: string;
  seed: number | null;
  scenarioVersion: string | null;
  status: 'training' | 'active' | 'completed';
  /** The canonical outcome, exactly as recorded (never changed by replays). */
  canonicalOutcome: { title: string; summary: string; success: boolean } | null;
  blurb: string;
  simRuns: SimRunRecord[];
}

export function buildArchive(canon: DeepReadonly<CanonicalState> | null, sims: SimulationStoreState): ArchiveEntry[] {
  const runsFor = (id: string) => sims.runs.filter((r) => r.archiveId === id);
  const training: ArchiveEntry[] = TRAINING.map((t) => ({
    id: t.id,
    title: t.title,
    source: 'training',
    classification: null,
    replay: 'bridge',
    scenarioId: t.scenarioId,
    seed: null,
    scenarioVersion: null,
    status: 'training',
    canonicalOutcome: null,
    blurb: t.blurb,
    simRuns: runsFor(t.id),
  }));
  const canonical: ArchiveEntry[] = canon
    ? Object.values(canon.missions)
        .slice()
        .sort((a, b) => b.startedAt - a.startedAt)
        .map((m) => ({
          id: m.id,
          title: m.title,
          source: 'canonical' as const,
          classification: m.classification,
          replay: m.mission.kind,
          scenarioId: m.snapshot.scenarioId,
          seed: m.snapshot.seed,
          scenarioVersion: m.snapshot.scenarioVersion,
          status: m.status,
          canonicalOutcome: m.outcome ? { title: m.outcome.title, summary: m.outcome.summary, success: m.outcome.success } : null,
          blurb: m.status === 'active' ? 'In progress in the canonical universe.' : `Canonical record. Started ${clockLabel(m.startedAt)}.`,
          simRuns: runsFor(m.id),
        }))
    : [];
  return [...canonical, ...training];
}

/** "Day 2, 14:05" from canonical minutes. */
export function clockLabel(min: number): string {
  const day = Math.floor(min / 1440) + 1;
  const m = min % 1440;
  return `Day ${day}, ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
