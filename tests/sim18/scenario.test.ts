/** Training Simulation 018 — scenario shape, seed sweep, fuzz and state invariants. */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { WE_SIM, LEAK, carefulKey, logText, playW, startW, untilEnd, waits, weather } from './helpers';
import { SCENARIO_TITLE } from '../../src/scenarios/weather/setup';
import { settled } from '../../src/scenarios/weather/agents';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';

describe('scenario shape', () => {
  it('title matches catalogue form and create is deterministic', () => {
    expect(WE_SIM.title).toBe(SCENARIO_TITLE);
    expect(WE_SIM.title).toMatch(/^Training Simulation 018: /);
    const a = WE_SIM.create(42);
    const b = WE_SIM.create(42);
    expect(a).toEqual(b);
    expect(a.scenarioId).toBe('weather-engine');
    expect(a.provenance.timeline).toBe('simulation');
  });

  it('seed sweep: the key, the grievance, the build and the clocks all vary', () => {
    const keys = new Set<string>();
    const griev = new Set<string>();
    const builds = new Set<string>();
    const tries = new Set<number>();
    const landfall = new Set<number>();
    for (let i = 1; i <= 60; i++) {
      const v = weather(WE_SIM.create(i));
      keys.add(v.key);
      griev.add(v.grievance);
      builds.add(v.engine);
      tries.add(v.tries);
      landfall.add(v.landfall);
    }
    expect(keys.size).toBe(3);
    expect(griev.size).toBe(3);
    expect(builds.size).toBe(2);
    expect(tries.size).toBe(2);
    expect(landfall.size).toBeGreaterThanOrEqual(4);
  });

  it('seed sweep: the same careful approach ends differently across seeds', () => {
    const ids = new Set<string>();
    for (let i = 1; i <= 60; i++) ids.add(carefulKey(i).outcome!.id);
    expect(ids.has('founders-key')).toBe(true);
    expect(ids.has('daughters-hand')).toBe(true);
    const mixed = new Set<string>();
    const scripts = [['enter the motto', 'enter the motto', 'enter the motto'], ['order the colony to shelter', 'order the colony to shelter, I insist'], waits(3)];
    for (let i = 1; i <= 20; i++) for (const c of scripts) mixed.add(untilEnd(playW(startW(i), c, false), false).outcome!.id);
    expect(mixed.size).toBeGreaterThanOrEqual(3);
  });

  it('speech reaches the people it is meant for', () => {
    let s = playW(startW(3), ['hail the Steward']);
    let ctx = contextFrom(s);
    expect(interpretSync('Tell me the truth about Elias Quarrie', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'speak', to: 'cruiser' }] });
    s = playW(s, ['close the channel', 'hail Marit']);
    ctx = contextFrom(s);
    const r = interpretSync('Why do you hate the Hall?', ctx);
    expect(r).toMatchObject({ kind: 'actions', actions: [{ type: 'bridge', op: 'chat' }] });
    s = playW(s, ['Why do you hate the Hall?']);
    expect(s.log[s.log.length - 1].speaker).toBe('Marit Quarrie');
  });

  it('fuzzed playthroughs never leak other simulations\' names or missing keys', () => {
    const seeds = [1, 5, 7, 10, 19, 31, 44, 55, 66, 77];
    const cmds = [
      ['Szabo, read the lock', 'hail Marit', 'Why do you hate the Hall?', 'hail the Steward', 'tell me the truth', 'what was his favourite poem?', 'close the channel', 'Szabo, work the cipher', 'wait', 'wait', 'wait', 'Szabo, verify the key', 'Szabo, enter the key'],
      ['enter the motto', 'enter the poem', 'enter the key', 'enter the motto'],
      ['Okafor, override the lock through the trunk', 'do it anyway', 'do it anyway'],
      ['fire on the station', 'fire on Meridian Hall', 'burn out the core', 'do it', 'beam the technicians aboard', 'burn out the core'],
      ['hail Lowe', 'Lowe, read me the plate', 'Szabo, read the lock', 'order the colony to shelter', 'launch shuttles to carry people to the cellars', 'Varga, forecast'],
      ['tell Marit the Hall has pledged to keep his name', 'ask Marit for the journal', 'Marit, enter the key yourself', 'status', 'options', 'objectives'],
      ['go ahead', 'raise shields', 'red alert', 'helm, take us out', 'engage the jump drive'],
      waits(20),
    ];
    for (const seed of seeds) {
      for (const c of cmds) {
        const s = untilEnd(playW(startW(seed), c, false), false);
        const text = logText(s);
        expect(text, `seed ${seed}`).not.toMatch(LEAK);
        expect(text).not.toMatch(/\[missing/);
        expect(checkInvariants(s)).toEqual([]);
        expect(s.outcome, `seed ${seed} ${c[0]}`).not.toBeNull();
        expect(settled(s) || s.turn >= 30).toBeTruthy();
        for (const k of Object.keys(s.counters)) expect(Number.isInteger(s.counters[k]), k).toBe(true);
        expect(s.objectives.filter((o) => o.status === 'active')).toEqual([]);
      }
    }
  });

  it('the civilian station and the Hall cannot be fired on while people are aboard', () => {
    const s = playW(startW(4), ['fire on the station', 'fire on Meridian Hall']);
    expect(s.outcome).toBeNull();
    expect(s.ships.kestrel.souls).toBe(2);
    expect(s.flags.firedOnEngine ?? false).toBe(false);
  });
});
