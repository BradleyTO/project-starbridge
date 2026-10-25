/** Training Simulation 006 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { ION_ENDINGS } from '../../src/scenarios/ion/outcome';
import { ion } from '../../src/scenarios/ion/setup';
import { ION, calmOf, careful, logText, playI, seedWhere, startI, untilEnd, waits } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-10-25T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, ION, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const PLAIN = seedWhere((v) => v.season === 'settled' && v.unfit === 'none' && v.patience === 5);
const through = (ch: string) => `take us through the ${ch} channel`;

/** Calm water three times, by luck: nobody was asked anything. */
const blind = () => {
  const v = ion(startI(PLAIN));
  return playI(startI(PLAIN), [through(calmOf(v, 0)), through(calmOf(v, 1)), through(calmOf(v, 2))]);
};

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = ION.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...ION_ENDINGS.success, ...ION_ENDINGS.partial, ...ION_ENDINGS.failure, ...ION_ENDINGS.backstop].sort());
    for (const id of ION_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of ION_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of ION_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['convoy', 'crews', 'fitness', 'halcyon']);
    expect(E.regulations).toEqual(['care-1', 'roe-3']);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled']) expect(judgments.has(j as never), j).toBe(true);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('clear-water: crossings made after asking the helm and the model are exemplary; the same calm water found blind is marked reckless', () => {
    const a = careful(PLAIN);
    const b = blind();
    expect(a.outcome?.id, logText(a).slice(-1500)).toBe('clear-water');
    expect(b.outcome?.id, logText(b).slice(-1500)).toBe('clear-water');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.conduct).toBe('exemplary');
    expect(eb.conduct).not.toBe('exemplary');
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(markers(ea)).toMatch(/Asked the helmsman for his own read/);
    expect(markers(eb)).toMatch(/without asking anyone what lay in it/);
    expect(markers(ea)).not.toMatch(/without asking anyone what lay in it/);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
  });
});

describe('other judgments', () => {
  it('leaving the convoy is reckless and cites care-1 (§4.1)', () => {
    const s = untilEnd(playI(startI(PLAIN), ['get us out of here', 'get us out of here']));
    expect(s.outcome?.id).toBe('left-in-storm');
    const e = ev(s);
    expect(e.conduct).toBe('reckless');
    expect(e.outcome.tier).toBe('failure');
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });

  it('overloading the Halcyon until she goes dark cites roe-3 (§3.9)', () => {
    const v = ion(startI(PLAIN));
    const r = (b: number) => (calmOf(v, b) === 'high' ? 'low' : 'high');
    const s = untilEnd(playI(startI(PLAIN), ['spread our shields over the haulers', 'Chief, bleed the charge off the haulers', 'Chief, bleed the charge off the haulers', 'Chief, bleed the charge off the haulers', through(r(0)), through(r(1)), through(r(2))]));
    expect(s.outcome?.id).toBe('dead-in-storm');
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(JSON.stringify(e)).toMatch(/roe-3/);
  });

  it('turning back with every crew alive is principled, not reckless', () => {
    const v = ion(startI(PLAIN));
    const s = untilEnd(playI(startI(PLAIN), [through(calmOf(v, 0)), 'Turn the convoy back.']));
    expect(s.outcome?.id).toBe('long-way-round');
    const e = ev(s);
    expect(e.outcome.tier).toBe('partial');
    expect(e.conduct).not.toBe('reckless');
    expect(markers(e)).toMatch(/Turned the convoy back with every crew alive/);
  });

  it('a captain who waited too long fails, but is not marked reckless for it', () => {
    const s = untilEnd(playI(startI(PLAIN), ['tractor beam on the Saffron Mule', ...waits(2)]));
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(e.conduct).not.toBe('reckless');
  });

  it('no percentages, no score, no template leaks, deterministic', () => {
    for (const s of [careful(PLAIN), blind()]) {
      const e = ev(s);
      const shown = [e.conduct, e.outcome.note, ...e.strengths, ...e.improve, ...e.crewSafety, ...e.civilianSafety].map((x) => (typeof x === 'string' ? x : x.text)).join(' ');
      expect(shown).not.toMatch(/%|\bscore\b|\/\s?10\b|\bgrade [A-F]\b/i);
      expect(JSON.stringify(e)).not.toMatch(/undefined|NaN|\[object|\{\w+\}/);
    }
    expect(ev(careful(PLAIN))).toEqual(ev(careful(PLAIN)));
  });
});
