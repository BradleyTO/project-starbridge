/**
 * Training Simulation 004 — catalogue entry, launch by voice or typed command, the Mission
 * Archive listing, voice hints, saves, and timeline isolation (canon untouched).
 */
import { describe, expect, it } from 'vitest';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import { completeIntro } from '../../src/engine/turn';
import type { WorldState } from '../../src/engine/types';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';
import { SIMULATIONS, simulationByName } from '../../src/scenarios/catalogue';
import { TRAINING_SCENARIOS, scenarioFor } from '../../src/scenarios/registry';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { KEYS, localRepository, memoryStorage } from '../../src/universe/repository';
import { openCanonicalContext } from '../../src/universe/gate';
import { newCanon } from '../../src/universe/canon';
import { loadGame, saveGame } from '../../src/engine/persistence';
import { RS, logText, playR, startR, waits } from './helpers';

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
  it('Reactor Night is simulation #4 and is registered', () => {
    const x = SIMULATIONS[3];
    expect(x).toMatchObject({ number: 4, trainingId: 'TRN-reactor', scenarioId: 'reactor-night', name: 'Reactor Night' });
    expect(x.title).toBe('Training Simulation 004: Reactor Night');
    expect(scenarioFor('reactor-night')).toBe(RS);
    expect(RS.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['reactor-night']).toBe(RS);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['reactor night', 'TRN-reactor'], ['the reactor night', 'TRN-reactor'], ['004', 'TRN-reactor'], ['4', 'TRN-reactor'], ['number four', 'TRN-reactor'], ['fourth', 'TRN-reactor'],
      ['the quiet signal', 'TRN-quiet'], ['3', 'TRN-quiet'], ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Reactor Night simulation" asks for simulation #4', () => {
    for (const line of ['Computer, begin the Reactor Night simulation.', 'computer begin the reactor night simulation', 'Computer, run simulation four', 'begin Reactor Night', 'Computer, start simulation 4'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-reactor' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('Reactor Night');
  });

  it('inside Reactor Night, beginning another simulation is refused and ending it asks to return', () => {
    let s = playR(startR(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playR(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = RS.voices?.(RS.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['basant', 'paley']);
    expect(JSON.stringify(v.paley)).not.toBe(JSON.stringify(v.basant));
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-23T23:00:00Z');

  it('the archive lists it, and a run is filed under #4 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-reactor');
    const sess = u.startTraining('TRN-reactor', 31);
    expect(sess.state.scenarioId).toBe('reactor-night');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-reactor', missionId: null });
    const end = playR(completeIntro(sess.state, RS), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-reactor'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-cascade and resumes as the same scenario', () => {
    const s = playR(startR(12), ["Okafor, what's failing?", 'scan our ship', 'hail the pod', 'how are you doing?', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(RS);
    expect(playR(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-reactor', 8);
    const s = playR(completeIntro(sess.state, RS), ['use the shield emitters as radiators', 'Okafor, rig the cold bypass', 'hail the pod', 'Paley, go to the manifold', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
