/**
 * Training Simulation 011 — catalogue entry, launch by voice or typed command, the Mission
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
import { COLDWATER_SIM, INSPECT, RECORD, logText, playC, startC, waits } from './helpers';

const C = COLDWATER_SIM;
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
  it('Coldwater is simulation #11 and is registered', () => {
    const x = SIMULATIONS[10];
    expect(x).toMatchObject({ number: 11, trainingId: 'TRN-coldwater', scenarioId: 'coldwater', name: 'Coldwater' });
    expect(x.title).toBe('Training Simulation 011: Coldwater');
    expect(scenarioFor('coldwater')).toBe(C);
    expect(C.title).toBe(x.title);
    expect(TRAINING_SCENARIOS.coldwater).toBe(C);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(11);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['coldwater', 'TRN-coldwater'], ['cold water', 'TRN-coldwater'], ['011', 'TRN-coldwater'], ['11', 'TRN-coldwater'], ['number eleven', 'TRN-coldwater'], ['eleventh', 'TRN-coldwater'],
      ['the gardener', 'TRN-gardener'], ['10', 'TRN-gardener'], ['the long picket', 'TRN-picket'], ['the lantern drift', 'TRN-lantern'], ['1', 'TRN-kestrel'], ['ghost ledger', 'TRN-ledger'], ['reactor night', 'TRN-reactor'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Coldwater simulation" asks for simulation #11', () => {
    for (const line of ['Computer, begin the Coldwater simulation.', 'computer begin the coldwater simulation', 'Computer, run simulation eleven', 'begin Coldwater', 'Computer, start simulation 11'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-coldwater' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('Coldwater');
  });

  it('inside Coldwater, beginning another simulation is refused and ending it asks to return', () => {
    let s = playC(startC(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playC(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = C.voices?.(C.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['corley', 'hadley', 'penhale', 'tennant', 'toller']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
    const firsts = Object.values(v).map((x) => x.candidates?.[0]);
    expect(new Set(firsts).size).toBe(firsts.length);
  });

  it("uses the captain's rank and name in the brief", () => {
    expect(logText(startC(1))).toMatch(/There's a rumour going round below decks, Captain/);
    expect(C.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links Coldwater to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 11));
    expect(linked.map((r) => r.id).sort()).toEqual(['care-2', 'conduct-2', 'orders-1', 'service-3']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 11)!;
      expect(t.title).toBe('Coldwater');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Tennant|Penhale|Corley|Strand|Toller|Hadley|Plumb/i);
      const nums = r.internal.training.map((x) => x.simulation);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });

  it('every regulation the evaluation cites exists in the handbook', () => {
    const ids = new Set(ARTICLES.map((r) => r.id));
    for (const id of C.evaluation!.regulations) expect(ids.has(id), id).toBe(true);
    for (const m of C.evaluation!.markers) if (m.regulation) expect(ids.has(m.regulation), m.id).toBe(true);
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-30T23:00:00Z');

  it('the archive lists it, and a run is filed under #11 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-coldwater');
    const sess = u.startTraining('TRN-coldwater', 31);
    expect(sess.state.scenarioId).toBe('coldwater');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-coldwater', missionId: null });
    const end = playC(completeIntro(sess.state, C), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-coldwater'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-investigation and resumes as the same scenario', () => {
    const s = playC(startC(12), [RECORD, INSPECT, 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(C);
    expect(playC(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-coldwater', 8);
    const s = playC(completeIntro(sess.state, C), ['Rask, have security remove the strikers', 'Rask, have security remove the strikers', 'Chief, restart the reactor', 'Chief, restart the reactor', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
