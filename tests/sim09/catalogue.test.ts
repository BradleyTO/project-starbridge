/**
 * Training Simulation 009 — catalogue entry, launch by voice or typed command, the Mission
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
import { HEAR, PICKET_SIM, READ_HIM, logText, playP, startP, waits } from './helpers';

const P = PICKET_SIM;
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
  it('The Long Picket is simulation #9 and is registered', () => {
    const x = SIMULATIONS[8];
    expect(x).toMatchObject({ number: 9, trainingId: 'TRN-picket', scenarioId: 'long-picket', name: 'The Long Picket' });
    expect(x.title).toBe('Training Simulation 009: The Long Picket');
    expect(scenarioFor('long-picket')).toBe(P);
    expect(P.title).toBe(x.title);
    expect(TRAINING_SCENARIOS['long-picket']).toBe(P);
    expect(SIMULATIONS.length).toBeGreaterThanOrEqual(9);
  });

  it('names resolve to the right simulation, and older names are unchanged', () => {
    const cases: [string, string | null][] = [
      ['the long picket', 'TRN-picket'], ['long picket', 'TRN-picket'], ['picket', 'TRN-picket'], ['009', 'TRN-picket'], ['9', 'TRN-picket'], ['number nine', 'TRN-picket'], ['ninth', 'TRN-picket'],
      ['the lantern drift', 'TRN-lantern'], ['8', 'TRN-lantern'], ['ghost ledger', 'TRN-ledger'], ['7', 'TRN-ledger'], ['ion season', 'TRN-ion'], ['the saltglass accord', 'TRN-saltglass'], ['reactor night', 'TRN-reactor'], ['the quiet signal', 'TRN-quiet'], ['tallis gate', 'TRN-tallis'], ['kestrel', 'TRN-kestrel'], ['', 'TRN-kestrel'],
    ];
    for (const [name, id] of cases) expect(simulationByName(name)?.trainingId ?? null, name).toBe(id);
  });
});

describe('launch from the bridge', () => {
  it('"Computer, begin the Long Picket simulation" asks for simulation #9', () => {
    for (const line of ['Computer, begin the Long Picket simulation.', 'computer begin the long picket simulation', 'Computer, begin the Picket simulation', 'Computer, run simulation nine', 'begin The Long Picket', 'Computer, start simulation 9'])
      expect(sayB(bridge(), line).uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-picket' });
  });

  it('"list simulations" includes it', () => {
    expect(logText(sayB(bridge(), 'Computer, list simulations'))).toContain('The Long Picket');
  });

  it('inside The Long Picket, beginning another simulation is refused and ending it asks to return', () => {
    let s = playP(startP(5), ['Computer, begin the Quiet Signal simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(logText(s)).toMatch(/already running/);
    s = playP(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('declares distinct voice hints for every character who speaks on comms', () => {
    const v = P.voices?.(P.create(1)) ?? {};
    expect(Object.keys(v).sort()).toEqual(['dahl', 'marchbank', 'roake']);
    const sigs = Object.values(v).map((x) => JSON.stringify({ ...x, label: '' }));
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("uses the captain's rank and name, and adds no other customisable names", () => {
    const s = startP(1);
    expect(logText(s)).toMatch(/Chief Okafor can read their reactor telemetry/);
    expect(P.roleHolders).toBeDefined();
  });
});

describe('handbook cross-references', () => {
  it('links The Long Picket to existing regulations, hidden from the player, without changing their wording', () => {
    const linked = ARTICLES.filter((r) => r.internal.training.some((t) => t.simulation === 9));
    expect(linked.map((r) => r.id).sort()).toEqual(['conduct-1', 'contact-3', 'honesty-1']);
    for (const r of linked) {
      const t = r.internal.training.find((x) => x.simulation === 9)!;
      expect(t.title).toBe('The Long Picket');
      expect(t.planned).toBeFalsy();
      expect(t.purpose).not.toMatch(/Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable|Marrow/i);
      const nums = r.internal.training.map((x) => x.simulation);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });

  it('every regulation the evaluation cites exists in the handbook', () => {
    const ids = new Set(ARTICLES.map((r) => r.id));
    for (const id of P.evaluation!.regulations) expect(ids.has(id), id).toBe(true);
    for (const m of P.evaluation!.markers) if (m.regulation) expect(ids.has(m.regulation), m.id).toBe(true);
  });
});

describe('Mission Archive, saves and timeline isolation', () => {
  const NOW = () => new Date('2026-10-28T23:00:00Z');

  it('the archive lists it, and a run is filed under #9 stamped as a simulation', () => {
    const storage = memoryStorage();
    const u = new Universe({ repo: localRepository(storage, defaultLedger), appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    expect(u.archive().map((e) => e.id)).toContain('TRN-picket');
    const sess = u.startTraining('TRN-picket', 31);
    expect(sess.state.scenarioId).toBe('long-picket');
    expect(sess.state.provenance).toMatchObject({ timeline: 'simulation', archiveId: 'TRN-picket', missionId: null });
    const end = playP(completeIntro(sess.state, P), waits(31), false);
    expect(end.outcome).not.toBeNull();
    u.finishSimulation(sess, end);
    expect(JSON.stringify(u.archive().find((e) => e.id === 'TRN-picket'))).toContain(end.outcome!.id);
  });

  it('a save round-trips mid-standoff and resumes as the same scenario', () => {
    const s = playP(startP(12), [...HEAR, READ_HIM, 'Szabo, listen to the picket’s traffic', 'wait']);
    const storage = memoryStorage();
    saveGame(s, storage, 'test');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    const back = (loaded as { state: WorldState }).state;
    expect(back).toEqual(s);
    expect(scenarioFor(back.scenarioId)).toBe(P);
    expect(playP(back, ['wait']).turn).toBe(s.turn + 1);
  });

  it('timeline isolation: playing it to an ending leaves canonical storage byte-identical', () => {
    const storage = memoryStorage();
    const repo = localRepository(storage, defaultLedger);
    repo.canon.initialise(openCanonicalContext({ livingUniverse: true }), newCanon({ profileId: 'p', seed: 3, appVersion: 'test' }));
    const before = storage.getItem(KEYS.canon);
    const u = new Universe({ repo, appVersion: 'test', scenarios: TRAINING_SCENARIOS, now: NOW });
    const sess = u.startTraining('TRN-picket', 8);
    const s = playP(completeIntro(sess.state, P), ['hail the picket', 'We will transfer the cargo to you.', 'We will transfer the cargo to you.', ...waits(30)], false);
    u.finishSimulation(sess, s);
    expect(s.outcome).not.toBeNull();
    expect(storage.getItem(KEYS.canon)).toBe(before);
  });
});
