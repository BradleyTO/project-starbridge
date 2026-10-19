/**
 * Universe: the application service the UI (and integration tests) drive.
 * It owns no game rules; it routes sessions to the right store and enforces
 * the product rules (entitlements, credits) around the canonical commit gate.
 */
import type { ScenarioModule } from '../engine/scenario';
import type { TurnResult } from '../engine/turn';
import type { Timeline, WorldState } from '../engine/types';
import { buildArchive, TRAINING, type ArchiveEntry } from './archive';
import type { DeepReadonly } from './freeze';
import type { UniverseRepository } from './repository';
import { replaySnapshot, replayVariation, startTraining, type SimulationSession } from './sessions';
import type { CanonicalState, FamiliarityMemory, SimRunRecord } from './types';
import { learnFromCommand, recordSimulationEnd } from './familiarity';

export interface UniverseOptions {
  repo: UniverseRepository;
  appVersion: string;
  scenarios: Record<string, ScenarioModule>;
  now?: () => Date;
}

export class Universe {
  readonly repo: UniverseRepository;
  readonly appVersion: string;
  readonly scenarios: Record<string, ScenarioModule>;
  readonly now: () => Date;

  constructor(o: UniverseOptions) {
    this.repo = o.repo;
    this.appVersion = o.appVersion;
    this.scenarios = o.scenarios;
    this.now = o.now ?? (() => new Date());
  }

  canon(): DeepReadonly<CanonicalState> | null {
    return this.repo.canon.read();
  }
  familiarity(): FamiliarityMemory {
    return this.repo.familiarity.read();
  }
  archive(): ArchiveEntry[] {
    return buildArchive(this.canon(), this.repo.sims.read());
  }

  private scenario(id: string): ScenarioModule {
    const s = this.scenarios[id];
    if (!s) throw new Error(`Unknown scenario ${id}`);
    return s;
  }

  private newRun(archiveId: string, seed: number, conditions: SimRunRecord['conditions']): string {
    let id = '';
    this.repo.sims.update((v) => {
      id = `SIM-${String(v.nextSeq).padStart(4, '0')}`;
      return { ...v, nextSeq: v.nextSeq + 1, runs: [...v.runs, { id, archiveId, startedAtIso: this.now().toISOString(), seed, conditions, outcome: null }].slice(-200) };
    });
    return id;
  }

  // ------------------------------------------------------------ simulation --

  startTraining(trainingId: string, seed: number | string): SimulationSession {
    const t = TRAINING.find((x) => x.id === trainingId);
    if (!t) throw new Error(`Unknown training mission ${trainingId}`);
    const sc = this.scenario(t.scenarioId);
    const probe = sc.create(seed);
    const runId = this.newRun(trainingId, probe.seed, 'training');
    return startTraining(sc, seed, runId, trainingId, this.familiarity().training.drilled);
  }

  /** Replay a canonical mission's exact original conditions as a simulation. */
  replayOriginal(missionId: string): SimulationSession {
    const m = this.canon()?.missions[missionId];
    if (!m) throw new Error(`No canonical mission ${missionId}`);
    if (m.mission.kind !== 'bridge') throw new Error('Event missions replay through the event model.');
    const runId = this.newRun(missionId, m.snapshot.seed, 'original');
    return replaySnapshot(m.snapshot, runId, this.familiarity().training.drilled);
  }

  /** A new randomised variation of an archived mission (training or canonical). */
  replayVariation(archiveId: string, seed: number): SimulationSession {
    const m = this.canon()?.missions[archiveId];
    const t = TRAINING.find((x) => x.id === archiveId);
    const scenarioId = m ? (m.mission.kind === 'bridge' ? m.mission.scenarioId : null) : t?.scenarioId;
    if (!scenarioId) throw new Error(`Cannot vary ${archiveId}`);
    const runId = this.newRun(archiveId, seed, 'variation');
    return replayVariation(this.scenario(scenarioId), archiveId, seed, runId, this.familiarity().training.drilled);
  }

  /** Learn from a command in any mode (terminology, comms preferences, sim drills). */
  noteCommand(timeline: Timeline, text: string, results: TurnResult['results']): FamiliarityMemory {
    return this.repo.familiarity.update((f) => learnFromCommand(f, timeline, text, results));
  }

  /** A simulation ended: store its outcome in simulation history and training stats only. */
  finishSimulation(session: SimulationSession, final: WorldState): void {
    if (!final.outcome) return;
    const outcome = { ...final.outcome, turn: final.turn };
    this.repo.sims.update((v) => ({ ...v, runs: v.runs.map((r) => (r.id === session.runId && !r.outcome ? { ...r, outcome } : r)) }));
    this.repo.familiarity.update((f) => recordSimulationEnd(f, final));
  }
}
