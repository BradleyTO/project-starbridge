/**
 * Training Simulation 018 — catalogue entry, launch by voice or typed command, the Mission
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
import { WE_SIM, logText, playW, startW, waits } from './helpers';

const G = WE_SIM;
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
  it('The Weather Engine is simulation #18 and is registered', () => {
    const x = SIMULATIONS[17];
    expect(x).toMatchObject({ number: 18, trainingId: 'TRN-weather', scenarioId: 'weather-engine', name: 'The Weather Engine' });
    expect(x.title).toBe('Training Simulation 018: The Weather Engine');
    expect(scenarioFor('weather-engine')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['weather-engine']).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(18);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['the weather engine', 'TRN-weather'], ['weather engine', 'TRN-weather'], ['weather', 'TRN-weather'], ['meridian', 'TRN-weather'], ['018', 'TRN-weather'], ['18', 'TRN-weather'], ['number eighteen', 'TRN-weather'], ['eighteenth', 'TRN-weather'],
      ['tribunal at kesh varo', 'TRN-tribunal'], ['17', 'TRN-tribunal'], ['seventeenth', 'TRN-tribunal'], ['the glass nebula', 'TRN-glass'], ['16', 'TRN-glass'], ['corsairs', 'TRN-corsairs'], ['1', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Weather Engine simulation" asks for simulation #18', () => {
    for (const line of ['Computer, begin the Weather Engine simulation.', 'Computer, begin the The Weather Engine simulation', 'computer begin the weather engine simulation', 'Computer, run simulation eighteen', 'begin the Weather Engine simulation', 'Computer, start simulation 18'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-weather' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), 'Computer, begin the Tribunal at Kesh Varo simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-tribunal' });
    expect(sayB(bridge(), 'Computer, run simulation seventeen').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-tribunal' });
    expect(sayB(bridge(), 'Computer, begin the Glass Nebula simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-glass' });
  });

  it('"list simulations" includes it, and its example launch line does not double the article', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain('The Weather Engine');
    expect(text).toMatch(/"begin the [A-Z][^"]* simulation"/);
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside it, beginning another simulation is refused and ending it asks to return', () => {
    let s = playW(startW(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playW(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['lowe', 'marit', 'tull']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startW(1);
    expect(logText(s)).toMatch(/Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links The Weather Engine to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 18));
    expect(linked.map((r) => r.id).sort()).toEqual(['cmd-3', 'contact-2', 'general-1', 'honesty-1']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 18)!;
      expect(t.title).toBe('The Weather Engine');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Quarrie|Marit|Tull|Lowe|Meridian|Greywall|Szabo|Okafor|motto|cipher|poem|journal|letter|storm|weather/i);
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
  const NOW = () => new Date('2026-11-07T23:00:00Z');

  it('the archive lists it, and a run is filed under #18 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-weather');
    const sess = u.startTraining('TRN-weather', 31);
    expect(sess.state.scenarioId).toBe('weather-engine');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-weather', missionId: null });
    const end = playW(completeIntro(sess.state, G), waits(35), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-weather'))).toContain(end.outcome!.id);
  });

  it('a save round-trips while the cipher is being worked and resumes as the same scenario', () => {
    const s = playW(startW(12), ['Szabo, read the lock', 'Szabo, get the poems from the colony archive', 'Szabo, work the cipher']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(G);
    expect(playW(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-weather', 8);
    const s = playW(completeIntro(sess.state, G), ['enter the motto', 'enter the motto', 'enter the motto', ...waits(25)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
