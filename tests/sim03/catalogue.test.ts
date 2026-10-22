/**
 * Training Simulation 003 — catalogue entry, launch by voice or typed command, the Mission
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
import { QS, logText, playQ, rightAnswer, startQ, waits } from './helpers';

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
  it('The Quiet Signal is simulation #3 and is registered', () => {
    const x = SIMULATIONS[2];
    expect(x).toMatchObject({ number: 3, trainingId: 'TRN-quiet', scenarioId: 'quiet-signal', name: 'The Quiet Signal' });
    expect(x.title).toBe('Training Simulation 003: The Quiet Signal');
    expect(scenarioFor('quiet-signal')).toBe(QS);
    expect(QS.title).toBe(x.title);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['the quiet signal', 'TRN-quiet'], ['quiet signal', 'TRN-quiet'], ['teyma pulsar', 'TRN-quiet'], ['003', 'TRN-quiet'], ['3', 'TRN-quiet'], ['number three', 'TRN-quiet'], ['third', 'TRN-quiet'],
      ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Quiet Signal simulation" asks for simulation #3', () => {
    for (const line of ['Computer, begin the Quiet Signal simulation.', 'computer begin the quiet signal simulation', 'Computer, run simulation three', 'begin the Quiet Signal', 'Computer, start the Teyma pulsar simulation'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-quiet' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('The Quiet Signal');
  });

  it('inside the Quiet Signal, beginning another simulation is refused and ending it asks to return', () => {
    let s = playQ(startQ(5), ['Computer, begin the Kestrel Incident simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playQ(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares voice hints for every character who speaks on comms', () => {
    expect(Object.keys(QS.voices?.(QS.create(1)) ?? {}).sort()).toEqual(['brenn', 'senders']);
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-22T23:00:00Z');

  it('the archive lists it, and a run is filed under #3 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-quiet');
    const sess = u.startTraining('TRN-quiet', 31);
    expect(sess.state.scenarioId).toBe('quiet-signal');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-quiet', missionId: null });
    const end = playQ(completeIntro(sess.state, QS), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-quiet'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-decode and resumes as the same scenario', () => {
    const s = playQ(startQ(12), ['Szabo, work on the code', 'scan the pulsar', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(QS);
    expect(playQ(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-quiet', 8);
    let s = playQ(completeIntro(sess.state, QS), ['Szabo, work on the code', 'scan the pulsar', 'use the main dish as a receiver', ...waits(3)], false);
    s = playQ(s, [`Szabo, send them ${rightAnswer(s, 0)}`, `Szabo, send them ${rightAnswer(s, 1)}`, ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
