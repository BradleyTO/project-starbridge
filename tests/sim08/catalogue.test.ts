/**
 * Training Simulation 008 — catalogue entry, launch by voice or typed command, the Mission
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
import { LANTERN, logText, playD, startD, waits } from './helpers';

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
  it('The Lantern Drift is simulation #8 and is registered', () => {
    const x = SIMULATIONS[7];
    expect(x).toMatchObject({ number: 8, trainingId: 'TRN-lantern', scenarioId: 'lantern-drift', name: 'The Lantern Drift' });
    expect(x.title).toBe('Training Simulation 008: The Lantern Drift');
    expect(scenarioFor('lantern-drift')).toBe(LANTERN);
    expect(LANTERN.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['lantern-drift']).toBe(LANTERN);
    expect(SIMULATIONS.length).toBe(8);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['the lantern drift', 'TRN-lantern'], ['lantern drift', 'TRN-lantern'], ['lantern', 'TRN-lantern'], ['008', 'TRN-lantern'], ['8', 'TRN-lantern'], ['number eight', 'TRN-lantern'], ['eighth', 'TRN-lantern'],
      ['ghost ledger', 'TRN-ledger'], ['7', 'TRN-ledger'], ['ion season', 'TRN-ion'], ['6', 'TRN-ion'], ['the saltglass accord', 'TRN-saltglass'], ['reactor night', 'TRN-reactor'], ['the quiet signal', 'TRN-quiet'], ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Lantern Drift simulation" asks for simulation #8', () => {
    for (const line of ['Computer, begin the Lantern Drift simulation.', 'computer begin the lantern drift simulation', 'Computer, begin the Lantern simulation', 'Computer, run simulation eight', 'begin The Lantern Drift', 'Computer, start simulation 8'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-lantern' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('The Lantern Drift');
  });

  it('inside The Lantern Drift, beginning another simulation is refused and ending it asks to return', () => {
    let s = playD(startD(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playD(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = LANTERN.voices?.(LANTERN.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['orrey', 'vollan', 'wick']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });
});

describe('handbook cross-references', () => {
  it('links The Lantern Drift to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 8));
    expect(linked.map((r) => r.id).sort()).toEqual(['care-1', 'care-2', 'cmd-4', 'health-2', 'honesty-1']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 8)!;
      expect(t.title).toBe('The Lantern Drift');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Eventide|Wick|Vollan|Orrey|Kittiwake|bank [a-f]\b/i);
      const nums = r.internal.training.map((x) => x.simulation);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });

  it('every regulation the evaluation cites exists in the handbook', () => {
    const ids = new Set(ARTICLES.map((r) => r.id));
    for (const id of LANTERN.evaluation!.regulations) expect(ids.has(id), id).toBe(true);
    for (const m of LANTERN.evaluation!.markers) if (m.regulation) expect(ids.has(m.regulation), m.id).toBe(true);
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-27T23:00:00Z');

  it('the archive lists it, and a run is filed under #8 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-lantern');
    const sess = u.startTraining('TRN-lantern', 31);
    expect(sess.state.scenarioId).toBe('lantern-drift');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-lantern', missionId: null });
    const end = playD(completeIntro(sess.state, LANTERN), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-lantern'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-rescue and resumes as the same scenario', () => {
    const s = playD(startD(12), ['Varga, scan the cryo banks', 'hail the Eventide', 'May we come aboard?', 'close the channel', 'Doctor, assess the sleepers', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(LANTERN);
    expect(playD(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-lantern', 8);
    const s = playD(completeIntro(sess.state, LANTERN), ['Varga, scan the cryo banks', 'Chief, override the custodian', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
