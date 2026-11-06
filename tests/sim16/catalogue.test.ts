/**
 * Training Simulation 016 — catalogue entry, launch by voice or typed command, the Mission
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
import { GL_SIM, logText, playG, startG, waits } from './helpers';

const G = GL_SIM;
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
  it('The Glass Nebula is simulation #16 and is registered', () => {
    const x = SIMULATIONS[15];
    expect(x).toMatchObject({ number: 16, trainingId: 'TRN-glass', scenarioId: 'glass-nebula', name: 'The Glass Nebula' });
    expect(x.title).toBe('Training Simulation 016: The Glass Nebula');
    expect(scenarioFor('glass-nebula')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['glass-nebula']).toBe(G);
    expect(SIMULATIONS.length).toBe(16);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['the glass nebula', 'TRN-glass'], ['glass nebula', 'TRN-glass'], ['glass', 'TRN-glass'], ['citrine', 'TRN-glass'], ['016', 'TRN-glass'], ['16', 'TRN-glass'], ['number sixteen', 'TRN-glass'], ['sixteenth', 'TRN-glass'],
      ['corsairs', 'TRN-corsairs'], ['15', 'TRN-corsairs'], ['fifteenth', 'TRN-corsairs'], ['starfall', 'TRN-starfall'], ['14', 'TRN-starfall'], ['the seventh bell', 'TRN-seventh-bell'], ['1', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Glass Nebula simulation" asks for simulation #16', () => {
    for (const line of ['Computer, begin the Glass Nebula simulation.', 'computer begin the glass nebula simulation', 'Computer, begin the Glass simulation', 'Computer, run simulation sixteen', 'begin The Glass Nebula', 'Computer, start simulation 16', 'Computer, run the Citrine simulation'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-glass' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), 'Computer, begin the Corsairs of the Veyl Shoals simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-corsairs' });
    expect(sayB(bridge(), 'Computer, run simulation fifteen').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-corsairs' });
    expect(sayB(bridge(), 'Computer, begin the Starfall simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-starfall' });
  });

  it('"list simulations" includes it, and its example launch line does not double the article', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain('The Glass Nebula');
    expect(text).toContain('"begin the Glass Nebula simulation"');
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside it, beginning another simulation is refused and ending it asks to return', () => {
    let s = playG(startG(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playG(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['prism', 'vale']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startG(1);
    expect(logText(s)).toMatch(/Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links The Glass Nebula to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 16));
    expect(linked.map((r) => r.id).sort()).toEqual(['care-1', 'care-2', 'care-4', 'cmd-4', 'honesty-1', 'roe-3']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 16)!;
      expect(t.title).toBe('The Glass Nebula');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Varga|Vale|Citrine|Prism|Fold|Looking Glass|Rim|Nessa|shear|echo|stamp/i);
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
  const NOW = () => new Date('2026-11-05T23:00:00Z');

  it('the archive lists it, and a run is filed under #16 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-glass');
    const sess = u.startTraining('TRN-glass', 31);
    expect(sess.state.scenarioId).toBe('glass-nebula');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-glass', missionId: null });
    const end = playG(completeIntro(sess.state, G), waits(35), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-glass'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-model and resumes as the same scenario', () => {
    const s = playG(startG(12), ['Varga, model the nebula', 'wait']);
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
    const sess = u.startTraining('TRN-glass', 8);
    const s = playG(completeIntro(sess.state, G), ['go deep after them', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
