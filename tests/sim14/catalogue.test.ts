/**
 * Training Simulation 014 — catalogue entry, launch by voice or typed command, the Mission
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
import { STAR_SIM, logText, playS, startS, waits } from './helpers';

const G = STAR_SIM;
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
  it('Starfall is simulation #14 and is registered', () => {
    const x = SIMULATIONS[13];
    expect(x).toMatchObject({ number: 14, trainingId: 'TRN-starfall', scenarioId: 'starfall', name: 'Starfall' });
    expect(x.title).toBe('Training Simulation 014: Starfall');
    expect(scenarioFor('starfall')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS.starfall).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(14);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['starfall', 'TRN-starfall'], ['star fall', 'TRN-starfall'], ['thistledown', 'TRN-starfall'], ['caradoc', 'TRN-starfall'], ['014', 'TRN-starfall'], ['14', 'TRN-starfall'], ['number fourteen', 'TRN-starfall'], ['fourteenth', 'TRN-starfall'],
      ['the seventh bell', 'TRN-seventh-bell'], ['13', 'TRN-seventh-bell'], ['thirteenth', 'TRN-seventh-bell'], ['seventh', 'TRN-ledger'], ['4', 'TRN-reactor'],
      ['ember tide', 'TRN-ember-tide'], ['flare', 'TRN-ember-tide'], ['12', 'TRN-ember-tide'], ['coldwater', 'TRN-coldwater'], ['the long picket', 'TRN-picket'], ['1', 'TRN-kestrel'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Starfall simulation" asks for simulation #14', () => {
    for (const line of ['Computer, begin the Starfall simulation.', 'computer begin the starfall simulation', 'Computer, run simulation fourteen', 'begin Starfall', 'Computer, start simulation 14', 'Computer, run the star fall simulation'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-starfall' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), 'Computer, begin the Seventh Bell simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-seventh-bell' });
    expect(sayB(bridge(), 'Computer, run simulation thirteen').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-seventh-bell' });
    expect(sayB(bridge(), 'Computer, begin the Ember Tide simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-ember-tide' });
  });

  it('"list simulations" includes it, and its example launch line does not double the article', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain('Starfall');
    // v0.8.16: the example launch line now names the newest simulation (Corsairs of the Veyl Shoals); see tests/sim15.
    expect(text).toContain('Starfall');
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside Starfall, beginning another simulation is refused and ending it asks to return', () => {
    let s = playS(startS(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playS(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['kemble', 'quell']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startS(1);
    expect(logText(s)).toMatch(/Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links Starfall to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 14));
    expect(linked.map((r) => r.id).sort()).toEqual(['care-4', 'cmd-3']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 14)!;
      expect(t.title).toBe('Starfall');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Adeyemi|Duarte|Kemble|Quell|Thistledown|Caradoc|Dividend|habitat|storm|scoop|gas giant/i);
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
  const NOW = () => new Date('2026-11-03T23:00:00Z');

  it('the archive lists it, and a run is filed under #14 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-starfall');
    const sess = u.startTraining('TRN-starfall', 31);
    expect(sess.state.scenarioId).toBe('starfall');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-starfall', missionId: null });
    const end = playS(completeIntro(sess.state, G), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-starfall'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-descent and resumes as the same scenario', () => {
    const s = playS(startS(12), ['Chief, how much can the hull take?', 'Adeyemi, the helm is yours. Take us down.', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(G);
    expect(playS(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-starfall', 8);
    const s = playS(completeIntro(sess.state, G), ['Adeyemi, the helm is yours. Take us down.', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
