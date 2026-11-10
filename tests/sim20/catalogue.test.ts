/**
 * Training Simulation 020 — catalogue entry, launch by voice or typed command, the Mission
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
import { GE_SIM, logText, playG, startG, waits } from './helpers';

const G = GE_SIM;
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
  it("Gravity's Edge is simulation #20 and is registered", () => {
    const x = SIMULATIONS[19];
    expect(x).toMatchObject({ number: 20, trainingId: 'TRN-gravity', scenarioId: 'gravitys-edge', name: "Gravity's Edge" });
    expect(x.title).toBe("Training Simulation 020: Gravity's Edge");
    expect(scenarioFor('gravitys-edge')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['gravitys-edge']).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(20);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ["gravity's edge", 'TRN-gravity'], ['gravitys edge', 'TRN-gravity'], ['the vagrant', 'TRN-gravity'], ['corriden', 'TRN-gravity'], ['neutron star', 'TRN-gravity'], ['020', 'TRN-gravity'], ['20', 'TRN-gravity'], ['number twenty', 'TRN-gravity'], ['twentieth', 'TRN-gravity'],
      ['hollow crown', 'TRN-hollow'], ['19', 'TRN-hollow'], ['nineteenth', 'TRN-hollow'], ['the weather engine', 'TRN-weather'], ['18', 'TRN-weather'], ['ember tide', 'TRN-ember-tide'], ['1', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Gravity\'s Edge simulation" asks for simulation #20', () => {
    for (const line of ["Computer, begin the Gravity's Edge simulation.", 'computer begin the gravitys edge simulation', 'Computer, run simulation twenty', "begin the Gravity's Edge simulation", 'Computer, start simulation 20', 'Computer, begin simulation number twenty'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-gravity' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), 'Computer, begin the Hollow Crown simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-hollow' });
    expect(sayB(bridge(), 'Computer, run simulation nineteen').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-hollow' });
    expect(sayB(bridge(), 'Computer, begin the Ember Tide simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-ember-tide' });
  });

  it('"list simulations" includes it, and no launch line doubles the article', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain("Gravity's Edge");
    expect(text).toMatch(/"begin the [A-Z][^"]* simulation"/);
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside it, beginning another simulation is refused and ending it asks to return', () => {
    let s = playG(startG(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playG(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares a voice hint for the one character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['aalto']);
    expect(v.aalto.gender).toBe('male');
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startG(1);
    expect(logText(s)).toMatch(/Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it("links Gravity's Edge to existing regulations, hidden from the player, without changing their wording", () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 20));
    expect(linked.map((r) => r.id).sort()).toEqual(['care-2', 'cmd-1', 'cmd-4', 'honesty-1', 'roe-3']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 20)!;
      expect(t.title).toBe("Gravity's Edge");
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Vagrant|Corriden|Lisle|Aalto|Lodestar|Okafor|neutron|probe|gauge|glitch|frame|tide/i);
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
  const NOW = () => new Date('2026-11-09T23:00:00Z');

  it('the archive lists it, and a run is filed under #20 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-gravity');
    const sess = u.startTraining('TRN-gravity', 31);
    expect(sess.state.scenarioId).toBe('gravitys-edge');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-gravity', missionId: null });
    const end = playG(completeIntro(sess.state, G), waits(35), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-gravity'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-pass and resumes as the same scenario', () => {
    const s = playG(startG(12), ['Szabo, relay our data to the observatory', 'Chief, listen to the frame', 'take us deeper']);
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
    const sess = u.startTraining('TRN-gravity', 8);
    const s = playG(completeIntro(sess.state, G), ['take us deeper', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
