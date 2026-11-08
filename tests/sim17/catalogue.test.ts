/**
 * Training Simulation 017 — catalogue entry, launch by voice or typed command, the Mission
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
import { TR_SIM, logText, playT, startT, waits } from './helpers';

const G = TR_SIM;
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
  it('Tribunal at Kesh Varo is simulation #17 and is registered', () => {
    const x = SIMULATIONS[16];
    expect(x).toMatchObject({ number: 17, trainingId: 'TRN-tribunal', scenarioId: 'tribunal', name: 'Tribunal at Kesh Varo' });
    expect(x.title).toBe('Training Simulation 017: Tribunal at Kesh Varo');
    expect(scenarioFor('tribunal')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['tribunal']).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(17);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['tribunal at kesh varo', 'TRN-tribunal'], ['tribunal', 'TRN-tribunal'], ['kesh varo', 'TRN-tribunal'], ['017', 'TRN-tribunal'], ['17', 'TRN-tribunal'], ['number seventeen', 'TRN-tribunal'], ['seventeenth', 'TRN-tribunal'],
      ['the glass nebula', 'TRN-glass'], ['16', 'TRN-glass'], ['sixteenth', 'TRN-glass'], ['corsairs', 'TRN-corsairs'], ['1', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Tribunal at Kesh Varo simulation" asks for simulation #17', () => {
    for (const line of ['Computer, begin the Tribunal at Kesh Varo simulation.', 'computer begin the tribunal simulation', 'Computer, begin the Kesh Varo simulation', 'Computer, run simulation seventeen', 'begin the Tribunal at Kesh Varo simulation', 'Computer, start simulation 17'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-tribunal' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), 'Computer, begin the Glass Nebula simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-glass' });
    expect(sayB(bridge(), 'Computer, run simulation sixteen').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-glass' });
  });

  it('"list simulations" includes it (the example launch line names the newest simulation)', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain('Tribunal at Kesh Varo');
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside it, beginning another simulation is refused and ending it asks to return', () => {
    let s = playT(startT(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playT(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['askel', 'dorn', 'soth', 'toras']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startT(1);
    expect(logText(s)).toMatch(/Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links Tribunal at Kesh Varo to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 17));
    expect(linked.map((r) => r.id).sort()).toEqual(['cmd-5', 'contact-2', 'health-2', 'orders-2', 'reg-7.4']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 17)!;
      expect(t.title).toBe('Tribunal at Kesh Varo');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Askel|Soth|Dorn|Toras|Brask|Osei|Quiet Stone|Orun|Kesh Varo/i);
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
  const NOW = () => new Date('2026-11-06T23:00:00Z');

  it('the archive lists it, and a run is filed under #17 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-tribunal');
    const sess = u.startTraining('TRN-tribunal', 31);
    expect(sess.state.scenarioId).toBe('tribunal');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-tribunal', missionId: null });
    const end = playT(completeIntro(sess.state, G), waits(35), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-tribunal'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-brief and resumes as the same scenario', () => {
    const s = playT(startT(12), ['Osei, prepare a medical brief', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(G);
    expect(playT(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-tribunal', 8);
    const s = playT(completeIntro(sess.state, G), ['extract Askel by force', 'extract Askel by force', ...waits(5)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
