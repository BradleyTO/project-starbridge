/**
 * Training Simulation 006 — catalogue entry, launch by voice or typed command, the Mission
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
import { ION, logText, playI, startI, waits } from './helpers';

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
  it('Ion Season is simulation #6 and is registered', () => {
    const x = SIMULATIONS[5];
    expect(x).toMatchObject({ number: 6, trainingId: 'TRN-ion', scenarioId: 'ion-season', name: 'Ion Season' });
    expect(x.title).toBe('Training Simulation 006: Ion Season');
    expect(scenarioFor('ion-season')).toBe(ION);
    expect(ION.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['ion-season']).toBe(ION);
    expect(SIMULATIONS.length).toBe(6);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['ion season', 'TRN-ion'], ['the ion season', 'TRN-ion'], ['ion storm', 'TRN-ion'], ['006', 'TRN-ion'], ['6', 'TRN-ion'], ['number six', 'TRN-ion'], ['sixth', 'TRN-ion'],
      ['the saltglass accord', 'TRN-saltglass'], ['5', 'TRN-saltglass'], ['reactor night', 'TRN-reactor'], ['4', 'TRN-reactor'], ['the quiet signal', 'TRN-quiet'], ['3', 'TRN-quiet'], ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Ion Season simulation" asks for simulation #6', () => {
    for (const line of ['Computer, begin the Ion Season simulation.', 'computer begin the ion season simulation', 'Computer, run simulation six', 'begin Ion Season', 'Computer, start simulation 6'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-ion' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('Ion Season');
  });

  it('inside Ion Season, beginning another simulation is refused and ending it asks to return', () => {
    let s = playI(startI(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playI(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = ION.voices?.(ION.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['brack', 'teague']);
    expect(JSON.stringify(v.brack)).not.toBe(JSON.stringify(v.teague));
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-25T23:00:00Z');

  it('the archive lists it, and a run is filed under #6 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-ion');
    const sess = u.startTraining('TRN-ion', 31);
    expect(sess.state.scenarioId).toBe('ion-season');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-ion', missionId: null });
    const end = playI(completeIntro(sess.state, ION), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-ion'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-crossing and resumes as the same scenario', () => {
    const s = playI(startI(12), ['hail Captain Brack', 'Doctor, how does Brack sound?', 'close the channel', 'Varga, what does the model say?', 'send a probe down the high channel', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(ION);
    expect(playI(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-ion', 8);
    const s = playI(completeIntro(sess.state, ION), ['Adeyemi, what does your gut say?', 'take us through the high channel', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
