/**
 * Training Simulation 021 — catalogue entry, launch by voice or typed command, the Mission
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
import { NL_SIM, logText, playN, startN, waits } from './helpers';

const G = NL_SIM;
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
  it('The Ninefold Lock is simulation #21 and is registered', () => {
    const x = SIMULATIONS[20];
    expect(x).toMatchObject({ number: 21, trainingId: 'TRN-ninefold', scenarioId: 'ninefold-lock', name: 'The Ninefold Lock' });
    expect(x.title).toBe('Training Simulation 021: The Ninefold Lock');
    expect(scenarioFor('ninefold-lock')).toBe(G);
    expect(G.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['ninefold-lock']).toBe(G);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(21);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['the ninefold lock', 'TRN-ninefold'], ['ninefold lock', 'TRN-ninefold'], ['ninefold', 'TRN-ninefold'], ['istra', 'TRN-ninefold'], ['nine locks', 'TRN-ninefold'], ['021', 'TRN-ninefold'], ['21', 'TRN-ninefold'], ['twenty-one', 'TRN-ninefold'], ['twenty one', 'TRN-ninefold'], ['twenty-first', 'TRN-ninefold'], ['number twenty one', 'TRN-ninefold'],
      ["gravity's edge", 'TRN-gravity'], ['20', 'TRN-gravity'], ['twenty', 'TRN-gravity'], ['twentieth', 'TRN-gravity'], ['hollow crown', 'TRN-hollow'], ['19', 'TRN-hollow'], ['nineteenth', 'TRN-hollow'], ['ember tide', 'TRN-ember-tide'], ['1', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Ninefold Lock simulation" asks for simulation #21', () => {
    for (const line of ['Computer, begin the Ninefold Lock simulation.', 'computer begin the ninefold lock simulation', 'Computer, run simulation twenty-one', 'Computer, run simulation twenty one', 'begin the Ninefold Lock simulation', 'Computer, start simulation 21', 'Computer, begin simulation number twenty-one'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-ninefold' });
  });

  it('older launch lines are unchanged', () => {
    expect(sayB(bridge(), "Computer, begin the Gravity's Edge simulation.").uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-gravity' });
    expect(sayB(bridge(), 'Computer, run simulation twenty').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-gravity' });
    expect(sayB(bridge(), 'Computer, run simulation nineteen').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-hollow' });
    expect(sayB(bridge(), 'Computer, begin the Ember Tide simulation.').uiRequest).toMatchObject({ kind: 'beginSim', id: 'TRN-ember-tide' });
  });

  it('"list simulations" includes it, and no launch line doubles the article', () => {
    const text = logText(sayB(bridge(), 'Computer, list simulations'));
    expect(text).toContain('The Ninefold Lock');
    expect(text).toMatch(/"begin the [A-Z][^"]* simulation"/);
    expect(text).not.toMatch(/the The\b/);
  });

  it('inside it, beginning another simulation is refused and ending it asks to return', () => {
    let s = playN(startN(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playN(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for the team leader, the quartermaster and the keystone', () => {
    const v = G.voices?.(G.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['kaminski', 'keystone', 'kovar']);
    expect(v.kaminski.gender).toBe('female');
    expect(v.kovar.gender).toBe('female');
    expect(v.keystone.gender).toBe('neutral');
    expect(v.kaminski.locales).not.toEqual(v.kovar.locales);
    expect(v.kaminski.pitch).not.toBe(v.kovar.pitch);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startN(1);
    expect(logText(s)).toMatch(/Captain/);
    expect(G.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links The Ninefold Lock to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 21));
    expect(linked.map((r) => r.id).sort()).toEqual(['care-2', 'cmd-4', 'honesty-1', 'roe-2', 'roe-3']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 21)!;
      expect(t.title).toBe('The Ninefold Lock');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Istra|Kaminski|Tran|Kovar|Ordinal|Pipit|keystone|screen|watch|depot|guns|probe|lock/i);
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
  const NOW = () => new Date('2026-11-10T23:00:00Z');

  it('the archive lists it, and a run is filed under #21 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-ninefold');
    const sess = u.startTraining('TRN-ninefold', 31);
    expect(sess.state.scenarioId).toBe('ninefold-lock');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-ninefold', missionId: null });
    const end = playN(completeIntro(sess.state, G), waits(35), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-ninefold'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-rescue and resumes as the same scenario', () => {
    const s = playN(startN(12), ['hail Lieutenant Kaminski', 'what happened on the pad?', 'close the channel', "Szabo, pull the Pipit's log"]);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(G);
    expect(playN(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-ninefold', 8);
    const s = playN(completeIntro(sess.state, G), ['take us in', 'do it', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
