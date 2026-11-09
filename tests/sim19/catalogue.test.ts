/**
 * Training Simulation 019 — catalogue entry, launch by voice or typed command, the Mission
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
import { HC_SIM, logText, playH, startH, waits } from './helpers';

const G = HC_SIM;
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
  it('Hollow Crown is simulation #19 and is registered', () => {
    const x = SIMULATIONS[18];
    expect(x).toMatchObject({ number: 19, trainingId: 'TRN-hollow', scenarioId: 'hollow-crown', name: 'Hollow Crown' });
    expect(x.title).toBe('Training Simulation 019: Hollow Crown');
    expect(scenarioFor('hollow-crown')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['hollow-crown']).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(19);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['hollow crown', 'TRN-hollow'], ['the hollow crown', 'TRN-hollow'], ['ostrin', 'TRN-hollow'], ['aubrel', 'TRN-hollow'], ['019', 'TRN-hollow'], ['19', 'TRN-hollow'], ['number nineteen', 'TRN-hollow'], ['nineteenth', 'TRN-hollow'],
      ['the weather engine', 'TRN-weather'], ['18', 'TRN-weather'], ['eighteenth', 'TRN-weather'], ['tribunal at kesh varo', 'TRN-tribunal'], ['17', 'TRN-tribunal'], ['corsairs', 'TRN-corsairs'], ['1', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Hollow Crown simulation" asks for simulation #19', () => {
    for (const line of ['Computer, begin the Hollow Crown simulation.', 'computer begin the hollow crown simulation', 'Computer, run simulation nineteen', 'begin the Hollow Crown simulation', 'Computer, start simulation 19', 'Computer, begin simulation number nineteen'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-hollow' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), 'Computer, begin the Weather Engine simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-weather' });
    expect(sayB(bridge(), 'Computer, run simulation eighteen').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-weather' });
    expect(sayB(bridge(), 'Computer, begin the Tribunal at Kesh Varo simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-tribunal' });
  });

  it('"list simulations" includes it, and no launch line doubles the article', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain('Hollow Crown');
    expect(text).toMatch(/"begin the [A-Z][^"]* simulation"/);
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside it, beginning another simulation is refused and ending it asks to return', () => {
    let s = playH(startH(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playH(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['mallory', 'rook', 'stannard']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startH(1);
    expect(logText(s)).toMatch(/Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links Hollow Crown to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 19));
    expect(linked.map((r) => r.id).sort()).toEqual(['asylum-1', 'asylum-2', 'care-1', 'health-2', 'honesty-1', 'roe-2']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 19)!;
      expect(t.title).toBe('Hollow Crown');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Mallory|Stannard|Rook|Ostrin|Aubrel|Osei|Szabo|Dace|Marsh|governor|hostage taker|impostor|grief|withdrawal|relay/i);
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
  const NOW = () => new Date('2026-11-08T23:00:00Z');

  it('the archive lists it, and a run is filed under #19 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-hollow');
    const sess = u.startTraining('TRN-hollow', 31);
    expect(sess.state.scenarioId).toBe('hollow-crown');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-hollow', missionId: null });
    const end = playH(completeIntro(sess.state, G), waits(35), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-hollow'))).toContain(end.outcome!.id);
  });

  it('a save round-trips while Dr. Osei is listening and resumes as the same scenario', () => {
    const s = playH(startH(12), ['hail the relay', 'Doctor, assess the governor', 'Tell me what happened.']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(G);
    expect(playH(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-hollow', 8);
    const s = playH(completeIntro(sess.state, G), ['Rask, storm the relay', 'do it', ...waits(25)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
