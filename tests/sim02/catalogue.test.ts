/**
 * v0.6 multi-scenario foundation: the catalogue, launch by name or number from the bridge,
 * "list simulations", the Mission Archive listing, saves, timeline isolation, and the
 * Kestrel Incident unchanged.
 */
import { describe, expect, it } from 'vitest';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import { completeIntro } from '../../src/engine/turn';
import type { WorldState } from '../../src/engine/types';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';
import { SIMULATIONS, simulationByName } from '../../src/scenarios/catalogue';
import { SCENARIOS, TRAINING_SCENARIOS, scenarioFor } from '../../src/scenarios/registry';
import { TRAINING } from '../../src/universe/archive';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { KEYS, localRepository, memoryStorage } from '../../src/universe/repository';
import { openCanonicalContext } from '../../src/universe/gate';
import { newCanon } from '../../src/universe/canon';
import { loadGame, saveGame } from '../../src/engine/persistence';
import { K } from '../helpers';
import { TS, logText, playT, startT } from './helpers';

const B = bridgeScenario;
const bridge = () => completeIntro(createBridge(7), B);
const sayB = (s: WorldState, ...cmds: string[]) => {
  for (const c of cmds) {
    s = submit(B, s, c);
    expect(checkInvariants(s), c).toEqual([]);
  }
  return s;
};

describe('catalogue and registry', () => {
  it('every catalogue entry has a registered module, unique ids and a numbered title', () => {
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(2);
    expect(new Set(SIMULATIONS.map((x) => x.trainingId)).size).toBe(SIMULATIONS.length);
    expect(new Set(SIMULATIONS.map((x) => x.scenarioId)).size).toBe(SIMULATIONS.length);
    SIMULATIONS.forEach((x, i) => {
      expect(x.number).toBe(i + 1);
      expect(TRAINING_SCENARIOS[x.scenarioId], x.scenarioId).toBeDefined();
      expect(scenarioFor(x.scenarioId).id).toBe(x.scenarioId);
      expect(x.title).toBe(`Training Simulation ${String(i + 1).padStart(3, '0')}: ${x.name}`);
      expect(scenarioFor(x.scenarioId).title).toBe(x.title);
    });
    expect(SCENARIOS.bridge).toBe(B);
    expect(scenarioFor(K.id)).toBe(K);
    expect(scenarioFor(TS.id)).toBe(TS);
  });

  it('names resolve to the right simulation', () => {
    const cases: [string, string | null][] = [
      ['', 'TRN-kestrel'], ['the kestrel incident', 'TRN-kestrel'], ['kestrel', 'TRN-kestrel'],
      ['tallis gate', 'TRN-tallis'], ['quarantine at tallis gate', 'TRN-tallis'], ['the quarantine', 'TRN-tallis'], ['002', 'TRN-tallis'], ['number two', 'TRN-tallis'], ['second', 'TRN-tallis'], ['1', 'TRN-kestrel'],
      ['battle of orion', null], ['99', null],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the <name> simulation" asks for that simulation', () => {
    const cases: [string, string][] = [
      ['Computer, begin the Quarantine at Tallis Gate simulation.', 'TRN-tallis'],
      ['computer begin the tallis gate simulation', 'TRN-tallis'],
      ['Computer, run simulation two', 'TRN-tallis'],
      ['begin Tallis Gate', 'TRN-tallis'],
      ['Computer, begin the Kestrel Incident simulation.', 'TRN-kestrel'],
      ['start a simulation', 'TRN-kestrel'],
    ];
    for (const [line, id] of cases) expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id });
  });

  it('"list simulations" / "what simulations are available" lists every simulation and starts nothing', () => {
    for (const line of ['Computer, list simulations', 'what simulations are available?', 'list the training simulations']) {
      const s0 = bridge();
      const s = sayB(s0, line);
      expect(s.uiRequest?.kind === 'beginSim', line).toBe(false);
      const text = logText(s);
      for (const x of SIMULATIONS) expect(text, line).toContain(x.name);
    }
  });

  it('an unknown simulation points the captain to the list', () => {
    const s = sayB(bridge(), 'Computer, run the Battle of Orion simulation');
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/list simulations/i);
  });

  it('inside Tallis Gate, beginning another simulation is refused and ending it asks to return', () => {
    let s = playT(startT(5), ['Computer, begin the Kestrel Incident simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playT(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });
});

describe('Mission Archive, sessions and saves', () => {
  const NOW = () => new Date('2026-10-19T15:00:00Z');
  const universe = (storage = memoryStorage()) => ({ storage, u: new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW }) });

  it('the archive lists every training simulation, in catalogue order', () => {
    const { u } = universe();
    const a = u.archive();
    expect(TRAINING.map((t) => t.id)).toEqual(SIMULATIONS.map((x) => x.trainingId));
    expect(a.map((e) => e.id)).toEqual(SIMULATIONS.map((x) => x.trainingId));
    expect(a.map((e) => e.title)).toEqual(SIMULATIONS.map((x) => x.title));
    expect(a.every((e) => e.source === 'training')).toBe(true);
  });

  it('startTraining(TRN-tallis) starts simulation #2 stamped as a simulation, and its run is filed under #2', () => {
    const { u } = universe();
    const sess = u.startTraining('TRN-tallis', 31);
    expect(sess.scenarioId).toBe('tallis-quarantine');
    expect(sess.state.scenarioId).toBe('tallis-quarantine');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-tallis', missionId: null });
    const end = playT(completeIntro(sess.state, TS), ['take us to 3,000 km of the liner', 'wait', 'wait', 'scan the liner', 'hail the picket', 'our scans show it is not contagious', ...Array(30).fill('wait')], false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    const entry = u.archive().find((e) => e.id === 'TRN-tallis')!;
    expect(JSON.stringify(entry)).toContain(end.outcome!.id);
  });

  it('a Tallis Gate save round-trips and resumes as the same scenario', () => {
    const s = playT(startT(12), ['take us to 3,000 km of the liner', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back.scenarioId).toBe('tallis-quarantine');
    expect(scenarioFor(back.scenarioId)).toBe(TS);
    expect(back).toEqual(s);
    const next = playT(back, ['wait']);
    expect(next.turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing simulation #2 to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    const ctx = openCanonicalContext({ livingUniverse: true });
    repo.canon.initialise(ctx, newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-tallis', 8);
    const end = playT(completeIntro(sess.state, TS), Array(31).fill('wait'), false);
    u.finishSimulation(sess, end);
    expect(end.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});

describe('the Kestrel Incident is unchanged by the foundation', () => {
  it('declares no slots, so the shared engine uses its historical cast', () => {
    const s = K.create(42);
    expect(s.slots).toBeUndefined();
    expect(s.ships.kestrel.aliases).toBeUndefined();
    expect(s.variant.extra).toBeUndefined();
  });
});
