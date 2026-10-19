/**
 * Mission Archive and replay: canonical missions become replayable entries,
 * replays reproduce the original conditions exactly, and simulated outcomes
 * are filed as simulations alongside (never over) the canonical outcome.
 */
import { describe, expect, it } from 'vitest';
import { K } from '../helpers';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { localRepository, memoryStorage, KEYS } from '../../src/universe/repository';
import { openCanonicalContext } from '../../src/universe/gate';
import { beginBridgeMission, canonicalSession, completeBridgeMission, newCanon } from '../../src/universe/canon';
import { TRAINING } from '../../src/universe/archive';
import { SCENARIO_VERSION } from '../../src/scenarios/kestrel/setup';
import { CANON_SEED, PEACEFUL_RUN, WITHDRAW_RUN, playOut } from './fixtures';

function setup() {
  const storage = memoryStorage();
  const repo = localRepository(storage, defaultLedger);
  const u = new Universe({ repo, appVersion: 'test', scenarios: { [K.id]: K }, now: () => new Date('2026-10-19T15:00:00Z') });
  const ctx = openCanonicalContext({ livingUniverse: true });
  repo.canon.initialise(ctx, newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
  let missionId = '';
  repo.canon.commit(ctx, (d) => {
    const r = beginBridgeMission(d, { offerId: 'OF', title: 'The Kestrel Incident', classification: 'directive', scenario: K, scenarioVersion: SCENARIO_VERSION, seed: CANON_SEED, startedAtIso: 'x', appVersion: 'test', eventId: 'EV' });
    missionId = r.missionId;
    return r.canon;
  });
  return { storage, repo, u, ctx, missionId };
}

describe('mission archive', () => {
  it('lists built-in training missions with no canonical history', () => {
    const u = new Universe({ repo: localRepository(memoryStorage(), defaultLedger), appVersion: 't', scenarios: { [K.id]: K } });
    const a = u.archive();
    expect(a.map((e) => e.id)).toEqual(TRAINING.map((t) => t.id));
    expect(a[0].source).toBe('training');
  });

  it('a started canonical mission is an archive entry immediately, and keeps its outcome once finished', () => {
    const { repo, u, ctx, missionId } = setup();
    let entry = u.archive().find((e) => e.id === missionId)!;
    expect(entry).toMatchObject({ source: 'canonical', status: 'active', classification: 'directive', seed: CANON_SEED, scenarioVersion: SCENARIO_VERSION, replay: 'bridge' });
    const sess = canonicalSession(repo.canon.read()!, missionId);
    repo.canon.commit(ctx, (d) => completeBridgeMission(d, { ...sess, state: playOut(sess.state, PEACEFUL_RUN) }));
    entry = u.archive().find((e) => e.id === missionId)!;
    expect(entry.status).toBe('completed');
    expect(entry.canonicalOutcome?.title).toBe('Rescue Corridor');
  });

  it('replaying original conditions reproduces the canonical start exactly (apart from the timeline stamp)', () => {
    const { repo, u, missionId } = setup();
    const canonStart = canonicalSession(repo.canon.read()!, missionId).state;
    const a = u.replayOriginal(missionId);
    const b = u.replayOriginal(missionId);
    const strip = (s: typeof canonStart) => ({ ...s, provenance: null, familiarity: null });
    expect(strip(a.state)).toEqual(strip(canonStart));
    expect(a.state).toEqual(b.state);
    // Identical orders on identical conditions give identical results (reliable replays).
    expect(JSON.stringify(playOut(a.state, PEACEFUL_RUN))).toBe(JSON.stringify(playOut(b.state, PEACEFUL_RUN)));
  });

  it('full flow: canonical outcome, replay with different choices, different simulated outcome, canon unchanged', () => {
    const { storage, repo, u, ctx, missionId } = setup();
    const sess = canonicalSession(repo.canon.read()!, missionId);
    repo.canon.commit(ctx, (d) => completeBridgeMission(d, { ...sess, state: playOut(sess.state, PEACEFUL_RUN) }));
    const canonBytes = storage.getItem(KEYS.canon);

    const sim = u.replayOriginal(missionId);
    const end = playOut(sim.state, WITHDRAW_RUN);
    u.finishSimulation(sim, end);

    const entry = u.archive().find((e) => e.id === missionId)!;
    expect(entry.canonicalOutcome?.title).toBe('Rescue Corridor');
    const filed = entry.simRuns.find((r) => r.id === sim.runId)!;
    expect(filed.conditions).toBe('original');
    expect(filed.outcome?.id).toBe(end.outcome!.id);
    expect(filed.outcome?.id).not.toBe('rescue-corridor');
    expect(storage.getItem(KEYS.canon)).toBe(canonBytes);
  });

  it('a new variation uses a new seed and is labelled as a variation', () => {
    const { u, missionId } = setup();
    const v = u.replayVariation(missionId, 777);
    expect(v.state.seed).toBe(777);
    expect(v.conditions).toBe('variation');
    expect(v.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: missionId });
    expect(u.archive().find((e) => e.id === missionId)!.simRuns.some((r) => r.id === v.runId && r.conditions === 'variation')).toBe(true);
  });

  it('training runs are unlimited and recorded only in simulation history', () => {
    const { storage, u } = setup();
    const canonBytes = storage.getItem(KEYS.canon);
    for (let i = 0; i < 25; i++) {
      const t = u.startTraining(TRAINING[0].id, i + 1);
      u.finishSimulation(t, playOut(t.state, WITHDRAW_RUN));
    }
    const runs = u.archive().find((e) => e.id === TRAINING[0].id)!.simRuns;
    expect(runs.filter((r) => r.outcome).length).toBe(25);
    expect(u.familiarity().training.simRuns).toBe(25);
    expect(storage.getItem(KEYS.canon)).toBe(canonBytes);
  });
});
