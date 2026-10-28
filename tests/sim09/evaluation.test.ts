/** Training Simulation 009 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { PICKET_ENDINGS } from '../../src/scenarios/picket/outcome';
import { ESCORT_LINE, HEAR, PICKET_SIM, READ_HIM, TOKEN, careful, logText, playP, seedWhere, startP, toPicket, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-10-28T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, PICKET_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
/** A commander who believes an escort bluff and is not provoked by a weapons lock. */
const PAIR = seedWhere((v) => v.temperament === 'weary' && v.intel === 'nothing' && v.sweepAt >= 7 && v.history !== 'rivals');

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = PICKET_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...PICKET_ENDINGS.success, ...PICKET_ENDINGS.partial, ...PICKET_ENDINGS.failure].sort());
    for (const id of PICKET_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of PICKET_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of PICKET_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(PICKET_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(PICKET_ENDINGS.partial.length + PICKET_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(E.objectives).sort()).toEqual(['claim', 'deliver', 'line', 'ruse', 'word']);
    expect(E.regulations).toEqual(['honesty-1', 'roe-2']);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('bluffed-pass: the escort bluff after Marrow’s read is graded above the same bluff made blind with weapons locked on the picket', () => {
    const a = untilEnd(playP(startP(PAIR), [...HEAR, READ_HIM, ...toPicket(ESCORT_LINE)]));
    const b = untilEnd(playP(startP(PAIR), ['lock weapons on the picket', ...toPicket(ESCORT_LINE)]));
    expect(a.outcome?.id, logText(a).slice(-1500)).toBe('bluffed-pass');
    expect(b.outcome?.id, logText(b).slice(-1500)).toBe('bluffed-pass');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).toBe('exemplary');
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(markers(ea)).toMatch(/Asked the first officer for her read/);
    expect(markers(eb)).toMatch(/Locked weapons on the other ship/);
    expect(markers(eb)).not.toMatch(/Asked the first officer for her read/);
    expect(JSON.stringify(eb)).toMatch(/roe-2/);
  });
});

describe('other judgments', () => {
  it('listening in, checking the clock and a kept bargain are marked', () => {
    const seed = seedWhere((v) => v.orders === 'probe');
    const s = untilEnd(playP(startP(seed), ['Szabo, listen to the picket’s traffic', 'Chief, read Wrenmoor’s reactor telemetry', ...toPicket(TOKEN)]));
    const e = ev(s);
    expect(e.outcome.tier).toBe('success');
    expect(markers(e)).toMatch(/picket’s own traffic/);
    expect(markers(e)).toMatch(/real deadline/);
    expect(markers(e)).toMatch(/bargain he could log/);
  });

  it('a feigned mercy run is reckless and cites honesty-1, even though the Halcyon gets through', () => {
    const seed = seedWhere((v) => v.intel !== 'cargo');
    const e = ev(untilEnd(playP(startP(seed), toPicket('This is a mercy mission carrying medical supplies.'))));
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/Claimed a mercy run/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('telling the picket people will die, after the Chief showed they would not, is reckless', () => {
    const e = ev(untilEnd(playP(startP(2), ['Chief, read Wrenmoor’s reactor telemetry', ...toPicket('People will die if you stop us.')])));
    expect(markers(e)).toMatch(/people would die/);
  });

  it('running the line is reckless and cites roe-2', () => {
    const seed = seedWhere((v) => v.temperament !== 'proud');
    const e = ev(untilEnd(playP(startP(seed), ['run the blockade', 'run the blockade'])));
    expect(e.outcome.tier).toBe('partial');
    expect(markers(e)).toMatch(/Ran another power’s picket line/);
    expect(JSON.stringify(e)).toMatch(/roe-2/);
  });

  it('ordering the manifest altered is reckless even though Szabo refuses', () => {
    const e = ev(untilEnd(playP(startP(2), ['Szabo, alter the manifest to say medical supplies'])));
    expect(markers(e)).toMatch(/records altered/);
  });

  it('grades decisions, never percentages', () => {
    for (const i of [1, 2, 3, 4, 5]) expect(JSON.stringify(ev(careful(i)))).not.toMatch(/\d+\s?%/);
    expect(JSON.stringify(ev(untilEnd(startP(1))))).not.toMatch(/\d+\s?%/);
  });
});
