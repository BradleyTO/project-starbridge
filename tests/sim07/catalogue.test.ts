/**
 * Training Simulation 007 — catalogue entry, launch by voice or typed command, the Mission
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
import { ARTICLES } from '../../src/handbook/articles';
import { LEDGER, logText, playL, startL, waits } from './helpers';

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
  it('Ghost Ledger is simulation #7 and is registered', () => {
    const x = SIMULATIONS[6];
    expect(x).toMatchObject({ number: 7, trainingId: 'TRN-ledger', scenarioId: 'ghost-ledger', name: 'Ghost Ledger' });
    expect(x.title).toBe('Training Simulation 007: Ghost Ledger');
    expect(scenarioFor('ghost-ledger')).toBe(LEDGER);
    expect(LEDGER.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['ghost-ledger']).toBe(LEDGER);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(7);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['ghost ledger', 'TRN-ledger'], ['the ghost ledger', 'TRN-ledger'], ['007', 'TRN-ledger'], ['7', 'TRN-ledger'], ['number seven', 'TRN-ledger'], ['seventh', 'TRN-ledger'],
      ['ion season', 'TRN-ion'], ['6', 'TRN-ion'], ['the saltglass accord', 'TRN-saltglass'], ['5', 'TRN-saltglass'], ['reactor night', 'TRN-reactor'], ['the quiet signal', 'TRN-quiet'], ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Ghost Ledger simulation" asks for simulation #7', () => {
    for (const line of ['Computer, begin the Ghost Ledger simulation.', 'computer begin the ghost ledger simulation', 'Computer, run simulation seven', 'begin Ghost Ledger', 'Computer, start simulation 7'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-ledger' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('Ghost Ledger');
  });

  it('inside Ghost Ledger, beginning another simulation is refused and ending it asks to return', () => {
    let s = playL(startL(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playL(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = LEDGER.voices?.(LEDGER.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['fosse', 'krenn', 'moll', 'sallow', 'thorne', 'vesk']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });
});

describe('handbook cross-references', () => {
  it('links Ghost Ledger to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 7));
    expect(linked.map((r) => r.id).sort()).toEqual(['asylum-2', 'care-1', 'cmd-4', 'conduct-1', 'conduct-2']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 7)!;
      expect(t.title).toBe('Ghost Ledger');
      expect(t.planned).toBeFalsy();
      const nums = r.internal.training.map((x) => x.simulation);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-26T23:00:00Z');

  it('the archive lists it, and a run is filed under #7 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-ledger');
    const sess = u.startTraining('TRN-ledger', 31);
    expect(sess.state.scenarioId).toBe('ghost-ledger');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-ledger', missionId: null });
    const end = playL(completeIntro(sess.state, LEDGER), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-ledger'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-investigation and resumes as the same scenario', () => {
    const s = playL(startL(12), ['Rask, pull the door logs', 'interview Ms Sallow', 'your badge says you left', 'check her story', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(LEDGER);
    expect(playL(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-ledger', 8);
    const s = playL(completeIntro(sess.state, LEDGER), ['Rask, pull the door logs', 'detain Mr Vesk', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
