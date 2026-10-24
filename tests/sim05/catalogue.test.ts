/**
 * Training Simulation 005 — catalogue entry, launch by voice or typed command, the Mission
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
import { SG, logText, playS, startS, waits } from './helpers';

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
  it('The Saltglass Accord is simulation #5 and is registered', () => {
    const x = SIMULATIONS[4];
    expect(x).toMatchObject({ number: 5, trainingId: 'TRN-saltglass', scenarioId: 'saltglass-accord', name: 'The Saltglass Accord' });
    expect(x.title).toBe('Training Simulation 005: The Saltglass Accord');
    expect(scenarioFor('saltglass-accord')).toBe(SG);
    expect(SG.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['saltglass-accord']).toBe(SG);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['the saltglass accord', 'TRN-saltglass'], ['saltglass accord', 'TRN-saltglass'], ['saltglass', 'TRN-saltglass'], ['005', 'TRN-saltglass'], ['5', 'TRN-saltglass'], ['number five', 'TRN-saltglass'], ['fifth', 'TRN-saltglass'],
      ['reactor night', 'TRN-reactor'], ['4', 'TRN-reactor'], ['the quiet signal', 'TRN-quiet'], ['3', 'TRN-quiet'], ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Saltglass Accord simulation" asks for simulation #5', () => {
    for (const line of ['Computer, begin the Saltglass Accord simulation.', 'computer begin the saltglass accord simulation', 'Computer, begin the Saltglass simulation', 'Computer, run simulation five', 'begin The Saltglass Accord', 'Computer, start simulation 5'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-saltglass' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('The Saltglass Accord');
  });

  it('inside the Saltglass Accord, beginning another simulation is refused and ending it asks to return', () => {
    let s = playS(startS(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playS(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = SG.voices?.(SG.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['caius', 'edda']);
    expect(JSON.stringify(v.edda)).not.toBe(JSON.stringify(v.caius));
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-23T23:00:00Z');

  it('the archive lists it, and a run is filed under #5 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-saltglass');
    const sess = u.startTraining('TRN-saltglass', 31);
    expect(sess.state.scenarioId).toBe('saltglass-accord');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-saltglass', missionId: null });
    const end = playS(completeIntro(sess.state, SG), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-saltglass'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-talks and resumes as the same scenario', () => {
    const s = playS(startS(12), ['Szabo, how do they sound?', 'open a private channel to Holder Tarvo', 'What do you really need?', 'close the channel', 'Marrow, have a quiet word with Speaker Rhune', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(SG);
    expect(playS(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-saltglass', 8);
    const s = playS(completeIntro(sess.state, SG), ['open a channel to Speaker Rhune', 'I hear you.', 'take the delegates down to the ice', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
