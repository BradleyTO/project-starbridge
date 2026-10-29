/**
 * Training Simulation 010 — catalogue entry, launch by voice or typed command, the Mission
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
import { GARDENER_SIM, HOLD_LINE, logText, playG, startG, toCrake, waits } from './helpers';

const G = GARDENER_SIM;
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
  it('The Gardener is simulation #10 and is registered', () => {
    const x = SIMULATIONS[9];
    expect(x).toMatchObject({ number: 10, trainingId: 'TRN-gardener', scenarioId: 'gardener', name: 'The Gardener' });
    expect(x.title).toBe('Training Simulation 010: The Gardener');
    expect(scenarioFor('gardener')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS.gardener).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['the gardener', 'TRN-gardener'], ['gardener', 'TRN-gardener'], ['cobble field', 'TRN-gardener'], ['010', 'TRN-gardener'], ['10', 'TRN-gardener'], ['number ten', 'TRN-gardener'], ['tenth', 'TRN-gardener'],
      ['the long picket', 'TRN-picket'], ['9', 'TRN-picket'], ['the lantern drift', 'TRN-lantern'], ['1', 'TRN-kestrel'], ['ghost ledger', 'TRN-ledger'], ['ion season', 'TRN-ion'], ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Gardener simulation" asks for simulation #10', () => {
    for (const line of ['Computer, begin the Gardener simulation.', 'computer begin the gardener simulation', 'Computer, run simulation ten', 'begin The Gardener', 'Computer, start simulation 10'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-gardener' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('The Gardener');
  });

  it('inside The Gardener, beginning another simulation is refused and ending it asks to return', () => {
    let s = playG(startG(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playG(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['crake', 'haskett']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startG(1);
    expect(logText(s)).toMatch(/Lt\. Varga can study it, Chief Okafor can build things/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links The Gardener to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 10));
    expect(linked.map((r) => r.id).sort()).toEqual(['care-2', 'cmd-4', 'health-1']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 10)!;
      expect(t.title).toBe('The Gardener');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Crake|Haskett|Hobnail|Spindle|Cobble|Varga/i);
      const nums = r.internal.training.map((x) => x.simulation);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });

  it('every regulation the evaluation cites exists in the handbook', () => {
    const ids = new Set(ARTICLES.map((r) => r.id));
    for (const id of G.evaluation!.regulations) expect(ids.has(id), id).toBe(true);
    for (const m of G.evaluation!.markers) if (m.regulation) expect(ids.has(m.regulation), m.id).toBe(true);
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-29T23:00:00Z');

  it('the archive lists it, and a run is filed under #10 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-gardener');
    const sess = u.startTraining('TRN-gardener', 31);
    expect(sess.state.scenarioId).toBe('gardener');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-gardener', missionId: null });
    const end = playG(completeIntro(sess.state, G), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-gardener'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-study and resumes as the same scenario', () => {
    const s = playG(startG(12), ['Varga, study the growth', 'send a probe to take a sample', ...toCrake(HOLD_LINE), 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(G);
    expect(playG(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-gardener', 8);
    const s = playG(completeIntro(sess.state, G), ['Varga, study the growth', 'Rask, burn the growth', 'burn the growth', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
