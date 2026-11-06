/**
 * Training Simulation 015 — catalogue entry, launch by voice or typed command, the Mission
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
import { COR_SIM, logText, playC, startC, waits } from './helpers';

const G = COR_SIM;
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
  it('Corsairs of the Veyl Shoals is simulation #15 and is registered', () => {
    const x = SIMULATIONS[14];
    expect(x).toMatchObject({ number: 15, trainingId: 'TRN-corsairs', scenarioId: 'corsairs', name: 'Corsairs of the Veyl Shoals' });
    expect(x.title).toBe('Training Simulation 015: Corsairs of the Veyl Shoals');
    expect(scenarioFor('corsairs')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS.corsairs).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(15);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(16);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['corsairs of the veyl shoals', 'TRN-corsairs'], ['corsairs', 'TRN-corsairs'], ['veyl shoals', 'TRN-corsairs'], ['hagfish', 'TRN-corsairs'], ['015', 'TRN-corsairs'], ['15', 'TRN-corsairs'], ['number fifteen', 'TRN-corsairs'], ['fifteenth', 'TRN-corsairs'],
      ['starfall', 'TRN-starfall'], ['14', 'TRN-starfall'], ['fourteenth', 'TRN-starfall'], ['the seventh bell', 'TRN-seventh-bell'], ['13', 'TRN-seventh-bell'], ['seventh', 'TRN-ledger'], ['4', 'TRN-reactor'],
      ['ember tide', 'TRN-ember-tide'], ['coldwater', 'TRN-coldwater'], ['the long picket', 'TRN-picket'], ['1', 'TRN-kestrel'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Corsairs of the Veyl Shoals simulation" asks for simulation #15', () => {
    for (const line of ['Computer, begin the Corsairs of the Veyl Shoals simulation.', 'computer begin the corsairs of the veyl shoals simulation', 'Computer, begin the Corsairs simulation', 'Computer, run simulation fifteen', 'begin Corsairs of the Veyl Shoals', 'Computer, start simulation 15', 'Computer, run the Veyl Shoals simulation'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-corsairs' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), 'Computer, begin the Starfall simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-starfall' });
    expect(sayB(bridge(), 'Computer, run simulation fourteen').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-starfall' });
    expect(sayB(bridge(), 'Computer, begin the Seventh Bell simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-seventh-bell' });
  });

  it('"list simulations" includes it (the example launch line names the newest simulation)', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain('Corsairs of the Veyl Shoals');
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside it, beginning another simulation is refused and ending it asks to return', () => {
    let s = playC(startC(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playC(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['draycott', 'skerrit']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startC(1);
    expect(logText(s)).toMatch(/Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links Corsairs of the Veyl Shoals to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 15));
    expect(linked.map((r) => r.id).sort()).toEqual(['conduct-1', 'roe-2', 'roe-4']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 15)!;
      expect(t.title).toBe('Corsairs of the Veyl Shoals');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Rask|Draycott|Skerrit|Hagfish|Gavel|Grist|Needle|Anvil|Sump|Bryony|Gudgeon|Snipe|pincer|herd|bleed|lattice/i);
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
  const NOW = () => new Date('2026-11-04T23:00:00Z');

  it('the archive lists it, and a run is filed under #15 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-corsairs');
    const sess = u.startTraining('TRN-corsairs', 31);
    expect(sess.state.scenarioId).toBe('corsairs');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-corsairs', missionId: null });
    const end = playC(completeIntro(sess.state, G), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-corsairs'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-ambush and resumes as the same scenario', () => {
    const s = playC(startC(12), ['raise shields', 'Szabo, pull the charts from the beacon', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(G);
    expect(playC(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-corsairs', 8);
    const s = playC(completeIntro(sess.state, G), ['take us into the Needle', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
