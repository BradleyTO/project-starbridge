/** Training Simulation 017 — scenario invariants, seed sweep, fuzz, never touches canon. */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { TR_SIM, LEAK, carefulAcquittal, logText, playT, seedWhere, startT, tribunal, untilEnd, waits } from './helpers';
import { SCENARIO_TITLE } from '../../src/scenarios/tribunal/setup';
import { settled } from '../../src/scenarios/tribunal/agents';

describe('scenario shape', () => {
  it('title matches catalogue form and create is deterministic', () => {
    expect(TR_SIM.title).toBe(SCENARIO_TITLE);
    expect(TR_SIM.title).toMatch(/^Training Simulation 017: /);
    const a = TR_SIM.create(42);
    const b = TR_SIM.create(42);
    expect(a).toEqual(b);
    expect(a.scenarioId).toBe('tribunal');
    expect(a.provenance.timeline).toBe('simulation');
  });

  it('seed sweep: truth, bench and pilgrim vary', () => {
    const truths = new Set<string>();
    const benches = new Set<string>();
    const pilgrims = new Set<string>();
    for (let i = 1; i <= 80; i++) {
      const v = tribunal(TR_SIM.create(i));
      truths.add(v.truth);
      benches.add(v.bench);
      pilgrims.add(v.pilgrim);
    }
    expect(truths.size).toBeGreaterThanOrEqual(3);
    expect(benches.size).toBeGreaterThanOrEqual(3);
    expect(pilgrims.size).toBeGreaterThanOrEqual(2);
  });

  it('Osei is pivotal: without the brief, acquittal does not land on a rescue seed', () => {
    const seed = seedWhere((v) => v.truth === 'rescue' && v.bench === 'open');
    let s = startT(seed);
    s = playT(s, ['hail Askel', 'Tell me what happened, in your own words.', 'hail the tribunal', 'present the medical brief to the magister']);
    expect(s.outcome?.id ?? null, logText(s).slice(-800)).not.toBe('acquitted');
  });

  it('crew refuse armed extraction while peaceful alternatives remain', () => {
    const s = playT(startT(1), ['extract Askel by force']);
    expect(s.outcome).toBeNull();
    expect(s.counters.extractWarned ?? 0).toBeGreaterThan(0);
    expect(logText(s)).toMatch(/Peaceful alternatives|will not send|refuse/i);
  });

  it('fuzzed playthroughs never leak other simulations\' names or missing keys', () => {
    const seeds = [1, 7, 19, 31, 44, 55, 66, 77, 88, 99];
    const cmds = [
      ['hail Askel', 'Tell me what happened', 'Osei, prepare a medical brief', 'wait', 'wait', 'hail the tribunal', 'present the medical brief'],
      ['extract Askel by force', 'extract Askel by force'],
      ['hand Askel over to the tribunal'],
      ['ask Keeper Dorn about custom', 'hail the tribunal', 'negotiate a commutation'],
      waits(20),
    ];
    for (const seed of seeds) {
      for (const c of cmds) {
        const s = untilEnd(playT(startT(seed), c, false), false);
        const text = logText(s);
        expect(text, `seed ${seed}`).not.toMatch(LEAK);
        expect(text).not.toMatch(/\[missing/);
        expect(checkInvariants(s)).toEqual([]);
        if (s.outcome) expect(settled(s) || s.turn >= 30).toBeTruthy();
      }
    }
  });

  it('a careful run reaches a success ending', () => {
    const s = carefulAcquittal(seedWhere((v) => v.truth === 'rescue' && v.bench !== 'strict'));
    expect(s.outcome?.success).toBe(true);
  });
});
