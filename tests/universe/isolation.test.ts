/**
 * Timeline isolation: simulation replays can never change canonical data.
 */
import { describe, expect, it } from 'vitest';
import { K } from '../helpers';
import { beginBridgeMission, canonicalSession, completeBridgeMission, newCanon, recordProgress } from '../../src/universe/canon';
import { TimelineViolation, openCanonicalContext, simulationContext, type CanonicalContext } from '../../src/universe/gate';
import { KEYS, defaultSims, localRepository, memoryStorage } from '../../src/universe/repository';
import { replaySnapshot, replayVariation, startTraining, type SimulationSession } from '../../src/universe/sessions';
import { defaultLedger } from '../../src/universe/credits';
import { SCENARIO_VERSION } from '../../src/scenarios/kestrel/setup';
import { CANON_SEED, PEACEFUL_RUN, WITHDRAW_RUN, playOut } from './fixtures';

function canonicalWorld() {
  const storage = memoryStorage();
  const repo = localRepository(storage, defaultLedger);
  const ctx = openCanonicalContext({ livingUniverse: true });
  repo.canon.initialise(ctx, newCanon({ profileId: 'p-test', seed: 99, appVersion: 'test' }));
  let missionId = '';
  repo.canon.commit(ctx, (d) => {
    const r = beginBridgeMission(d, { offerId: 'OF-1', title: 'The Kestrel Incident', classification: 'directive', scenario: K, scenarioVersion: SCENARIO_VERSION, seed: CANON_SEED, startedAtIso: '2026-10-19T12:00:00Z', appVersion: 'test', eventId: 'EV-x' });
    missionId = r.missionId;
    return r.canon;
  });
  // Play it canonically to an ending and commit the outcome.
  const session = canonicalSession(repo.canon.read()!, missionId);
  const final = { ...session, state: playOut(session.state, PEACEFUL_RUN) };
  repo.canon.commit(ctx, (d) => completeBridgeMission(d, final));
  return { storage, repo, ctx, missionId };
}

describe('timeline isolation', () => {
  it('a canonical mission is stamped canonical and its outcome is recorded', () => {
    const { repo, missionId } = canonicalWorld();
    const m = repo.canon.read()!.missions[missionId];
    expect(m.status).toBe('completed');
    expect(m.outcome?.id).toBe('rescue-corridor');
    expect(m.snapshot.initial?.provenance.timeline).toBe('canonical');
    expect(m.snapshot.seed).toBe(CANON_SEED);
    expect(m.snapshot.scenarioVersion).toBe(SCENARIO_VERSION);
  });

  it('replaying the original conditions as a simulation, with different choices, leaves canonical storage byte-identical', () => {
    const { storage, repo, missionId } = canonicalWorld();
    const before = storage.getItem(KEYS.canon);
    const snapshot = repo.canon.read()!.missions[missionId].snapshot;
    const sim = replaySnapshot(snapshot, 'SIM-1');
    expect(sim.state.provenance.timeline).toBe('simulation');
    // Same starting conditions as the canonical run…
    expect(sim.state.seed).toBe(CANON_SEED);
    expect(sim.state.ships).toEqual(snapshot.initial!.ships);
    // …different choices, different simulated outcome.
    const end = playOut(sim.state, WITHDRAW_RUN);
    expect(end.outcome).not.toBeNull();
    expect(end.outcome!.id).not.toBe('rescue-corridor');
    // Recording the sim run touches only the simulation store.
    repo.sims.update((v) => ({ ...v, runs: [...v.runs, { id: sim.runId, archiveId: missionId, startedAtIso: 'x', seed: sim.state.seed, conditions: 'original', outcome: { ...end.outcome!, turn: end.turn } }] }));
    expect(storage.getItem(KEYS.canon)).toBe(before);
    expect(repo.canon.read()!.missions[missionId].outcome?.id).toBe('rescue-corridor');
  });

  it('unlimited replays (50) never change the snapshot or the canonical outcome', () => {
    const { storage, repo, missionId } = canonicalWorld();
    const before = storage.getItem(KEYS.canon);
    const snap = repo.canon.read()!.missions[missionId].snapshot;
    const initialJson = JSON.stringify(snap.initial);
    for (let i = 0; i < 50; i++) {
      const sim = i % 2 ? replaySnapshot(snap, `SIM-${i}`) : replayVariation(K, missionId, 1000 + i, `SIM-${i}`);
      playOut(sim.state, i % 3 ? WITHDRAW_RUN : PEACEFUL_RUN);
    }
    expect(JSON.stringify(repo.canon.read()!.missions[missionId].snapshot.initial)).toBe(initialJson);
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });

  it('a simulation session is a deep copy: even mutating it in place cannot reach the snapshot', () => {
    const { repo, missionId } = canonicalWorld();
    const snap = repo.canon.read()!.missions[missionId].snapshot;
    const sim = replaySnapshot(snap, 'SIM-x');
    sim.state.ships.kestrel.souls = 0;
    sim.state.characters.marrow.status = 'dead';
    expect(snap.initial!.ships.kestrel.souls).toBeGreaterThan(0);
    expect(snap.initial!.characters.marrow.status).toBe('active');
  });

  it('canonical reads are deep-frozen', () => {
    const { repo, missionId } = canonicalWorld();
    const c = repo.canon.read()!;
    expect(() => {
      (c as unknown as { clock: number }).clock = 0;
    }).toThrow(TypeError);
    expect(() => {
      (c.missions[missionId].outcome as unknown as { id: string }).id = 'forged';
    }).toThrow(TypeError);
  });

  it('the commit gate rejects simulation contexts and forged contexts at run time', () => {
    const { repo } = canonicalWorld();
    const sim = simulationContext();
    expect(() => repo.canon.commit(sim as unknown as CanonicalContext, (d) => d)).toThrow(TimelineViolation);
    const forged = { timeline: 'canonical' } as unknown as CanonicalContext;
    expect(() => repo.canon.commit(forged, (d) => d)).toThrow(TimelineViolation);
    expect(() => openCanonicalContext({ livingUniverse: false })).toThrow(TimelineViolation);
  });

  it('the commit gate rejects simulation WorldStates smuggled into the canonical record', () => {
    const { repo, ctx, missionId } = canonicalWorld();
    const sim = replaySnapshot(repo.canon.read()!.missions[missionId].snapshot, 'SIM-y');
    expect(() =>
      repo.canon.commit(ctx, (d) => {
        d.missions[missionId].progress = sim.state;
        return d;
      }),
    ).toThrow(TimelineViolation);
  });

  it('simulation sessions cannot be passed where a canonical session is required (compile-time)', () => {
    const { repo, ctx } = canonicalWorld();
    const sim: SimulationSession = startTraining(K, 5, 'SIM-t', 'TRN-kestrel');
    expect(() =>
      repo.canon.commit(ctx, (d) =>
        // @ts-expect-error a SimulationSession is not a CanonicalSession
        recordProgress(d, sim),
      ),
    ).toThrow();
  });

  it('simulation history and canonical data live under separate storage keys', () => {
    const { storage, repo } = canonicalWorld();
    const canonBefore = storage.getItem(KEYS.canon);
    repo.sims.write({ ...defaultSims(), runs: [] });
    repo.familiarity.update((f) => ({ ...f, training: { ...f.training, simRuns: 9 } }));
    expect(storage.getItem(KEYS.sim)).not.toBeNull();
    expect(storage.getItem(KEYS.familiarity)).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(canonBefore);
  });

  it('canonical outcomes persist across a reload (new repository over the same storage)', () => {
    const { storage, missionId } = canonicalWorld();
    const again = localRepository(storage, defaultLedger);
    expect(again.canon.read()!.missions[missionId].outcome?.id).toBe('rescue-corridor');
    expect(again.canon.read()!.missions[missionId].snapshot.initial?.provenance.timeline).toBe('canonical');
  });

  it('corrupt canonical data is backed up rather than lost, and newer versions are never overwritten', () => {
    const storage = memoryStorage();
    storage.setItem(KEYS.canon, '{not json');
    const repo = localRepository(storage, defaultLedger);
    expect(repo.canon.read()).toBeNull();
    expect(repo.canon.status).toBe('corrupt-backed-up');
    expect(storage.getItem(`${KEYS.canon}.corrupt-backup`)).toBe('{not json');
    const s2 = memoryStorage();
    const future = JSON.stringify({ schema: 'starbridge.familiarity', version: 99, aliases: {} });
    s2.setItem(KEYS.familiarity, future);
    const r2 = localRepository(s2, defaultLedger);
    r2.familiarity.read();
    expect(r2.familiarity.status).toBe('newer-version');
    expect(() => r2.familiarity.write(r2.familiarity.read())).toThrow();
    expect(s2.getItem(KEYS.familiarity)).toBe(future);
  });
});
