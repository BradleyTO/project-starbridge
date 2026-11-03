/**
 * Training Simulation 013 — catalogue entry, launch by voice or typed command, the Mission
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
import { BELL_SIM, HEAR_LINE, logText, playB, startB, toStavely, waits } from './helpers';

const G = BELL_SIM;
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
  it('The Seventh Bell is simulation #13 and is registered', () => {
    const x = SIMULATIONS[12];
    expect(x).toMatchObject({ number: 13, trainingId: 'TRN-seventh-bell', scenarioId: 'seventh-bell', name: 'The Seventh Bell' });
    expect(x.title).toBe('Training Simulation 013: The Seventh Bell');
    expect(scenarioFor('seventh-bell')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['seventh-bell']).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(13);
  });

  it('names resolve to the right simulation, and older names are unchanged ("seventh bell" is #13, "seventh" alone is still #7)', () => {
    const cases: [string, string | null][] = [
      ['the seventh bell', 'TRN-seventh-bell'], ['seventh bell', 'TRN-seventh-bell'], ['harrow lane', 'TRN-seventh-bell'], ['013', 'TRN-seventh-bell'], ['13', 'TRN-seventh-bell'], ['number thirteen', 'TRN-seventh-bell'], ['thirteenth', 'TRN-seventh-bell'],
      ['seventh', 'TRN-ledger'], ['7', 'TRN-ledger'], ['ember tide', 'TRN-ember-tide'], ['12', 'TRN-ember-tide'], ['twelfth', 'TRN-ember-tide'],
      ['coldwater', 'TRN-coldwater'], ['11', 'TRN-coldwater'], ['the gardener', 'TRN-gardener'], ['10', 'TRN-gardener'], ['the long picket', 'TRN-picket'], ['9', 'TRN-picket'], ['the lantern drift', 'TRN-lantern'], ['1', 'TRN-kestrel'], ['ghost ledger', 'TRN-ledger'], ['ion season', 'TRN-ion'], ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Seventh Bell simulation" asks for simulation #13', () => {
    for (const line of ['Computer, begin the Seventh Bell simulation.', 'computer begin the seventh bell simulation', 'Computer, run simulation thirteen', 'begin The Seventh Bell', 'Computer, start simulation 13'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-seventh-bell' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), 'Computer, begin the Ember Tide simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-ember-tide' });
    expect(sayB(bridge(), 'Computer, run simulation seven').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-ledger' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('The Seventh Bell');
  });

  it('the list\'s example launch line does not double the article ("begin the Seventh Bell simulation")', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain('"begin the Seventh Bell simulation"');
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside The Seventh Bell, beginning another simulation is refused and ending it asks to return', () => {
    let s = playB(startB(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playB(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['stavely', 'vory']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startB(1);
    expect(logText(s)).toMatch(/Nothing is burning, Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links The Seventh Bell to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 13));
    expect(linked.map((r) => r.id).sort()).toEqual(['cmd-4', 'conduct-2', 'custody-1', 'roe-4', 'service-3']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 13)!;
      expect(t.title).toBe('The Seventh Bell');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Stavely|Vory|Tamber|Seraphine|Calderon|Bell|courier|cutter|volley|Rask|lidar|Directorate/i);
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
  const NOW = () => new Date('2026-11-01T23:00:00Z');

  it('the archive lists it, and a run is filed under #13 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-seventh-bell');
    const sess = u.startTraining('TRN-seventh-bell', 31);
    expect(sess.state.scenarioId).toBe('seventh-bell');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-seventh-bell', missionId: null });
    const end = playB(completeIntro(sess.state, G), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-seventh-bell'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-inquiry and resumes as the same scenario', () => {
    const s = playB(startB(12), ["Rask, read the Tamber's fire-control record", ...toStavely(HEAR_LINE), 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(G);
    expect(playB(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-seventh-bell', 8);
    const s = playB(completeIntro(sess.state, G), ["Rask, read the Tamber's fire-control record", ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
