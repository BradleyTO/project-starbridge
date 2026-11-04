/** Training Simulation 014 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { STARFALL_ENDINGS } from '../../src/scenarios/starfall/outcome';
import { STAR_SIM, blind, careful, cutAndTow, fromTheChair, logText, playS, seedWhere, startS, toQuell, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-03T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, STAR_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);
const firstSeed = (f: (seed: number) => boolean, limit = 400) => {
  for (let i = 1; i <= limit; i++) if (f(i)) return i;
  throw new Error('no seed');
};
/** A seed where both the informed and the blind captain end up Scarred in the Clouds. */
const PAIR = firstSeed((i) => careful(i, 'plain').outcome?.id === 'scarred' && blind(i).outcome?.id === 'scarred');

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = STAR_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...STARFALL_ENDINGS.success, ...STARFALL_ENDINGS.partial, ...STARFALL_ENDINGS.failure].sort());
    for (const id of STARFALL_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of STARFALL_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of STARFALL_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(STARFALL_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(STARFALL_ENDINGS.partial.length + STARFALL_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(E.objectives).sort()).toEqual(['count', 'helm', 'people', 'ship']);
    expect(E.regulations).toEqual(['care-1', 'care-2', 'roe-3', 'honesty-1']);
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });

  it('no exercise objective: every objective is an ordinary goal, and nothing new is cited', () => {
    const s = startS(1);
    expect(s.objectives.length).toBe(4);
    for (const o of s.objectives) expect(o.text).not.toMatch(/Exercise objective/);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it("Scarred in the Clouds: going past the Chief's limit knowingly, for the people still aboard, is graded above going past it blind", () => {
    const a = careful(PAIR, 'plain');
    const b = blind(PAIR);
    expect(a.outcome?.id, tail(a)).toBe('scarred');
    expect(b.outcome?.id, tail(b)).toBe('scarred');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('partial');
    expect(eb.outcome.tier).toBe('partial');
    expect(['sound', 'principled']).toContain(ea.conduct);
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(ea.conduct).not.toBe(eb.conduct);
    expect(markers(ea)).toMatch(/Went past the Chief's limit knowingly/);
    expect(markers(ea)).toMatch(/Asked the Chief what the hull could take/);
    expect(markers(eb)).toMatch(/without asking the Chief/);
    expect(markers(eb)).not.toMatch(/Went past the Chief's limit knowingly/);
    expect(JSON.stringify(eb)).toMatch(/roe-3/);
  });
});

describe('other judgments', () => {
  it("the careful captain is exemplary: the Chief asked, the helm handed over, the pilot's line flown, the living counted", () => {
    const seed = seedWhere((v) => v.count !== 'honest' && v.nerve === 'shaken');
    const s = careful(seed);
    expect(s.outcome?.id, tail(s)).toBe('ensigns-line');
    const e = ev(s);
    expect(e.outcome.tier).toBe('success');
    expect(e.conduct).toBe('exemplary');
    const m = markers(e);
    expect(m).toMatch(/Gave the descent to the pilot with the hands for it/);
    expect(m).toMatch(/Steadied a shaken junior officer/);
    expect(m).toMatch(/let him fly his own line/);
    expect(m).toMatch(/Counted the people aboard the habitat/);
    expect(JSON.stringify(e)).toMatch(/care-1/);
    expect(JSON.stringify(e)).toMatch(/care-2/);
  });

  it('flying the ship from the chair is reckless and cites roe-3', () => {
    const s = fromTheChair(firstSeed((i) => fromTheChair(i).outcome?.id === 'dragged-down'));
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(e.conduct).toBe('reckless');
    expect(markers(e)).toMatch(/Took the flying out of the pilot's hands/);
    expect(markers(e)).toMatch(/frame could hold/);
  });

  it('an eager ensign left without a limit takes the ship past it himself: reckless, and cites care-2', () => {
    const seed = firstSeed((i) => {
      const s = STAR_SIM.create(i);
      if (s.variant.extra?.nerve !== 'eager') return false;
      const r = untilEnd(playS(startS(i), ['Chief, how much can the hull take?', 'Adeyemi, the helm is yours, fly it your way. Varga, count the life signs aboard the habitat. Take us down.']));
      return !!r.flags.eagerPushed;
    });
    const s = untilEnd(playS(startS(seed), ['Chief, how much can the hull take?', 'Adeyemi, the helm is yours, fly it your way. Varga, count the life signs aboard the habitat. Take us down.']));
    expect(s.flags.eagerPushed, tail(s)).toBe(true);
    const e = ev(s);
    expect(markers(e)).toMatch(/Let an eager junior officer take the ship past/);
    expect(JSON.stringify(e)).toMatch(/care-2/);
  });

  it("cutting the works and towing is decisive; telling the company's agent the plain truth is principled and cites honesty-1", () => {
    const seed = seedWhere((v) => v.agent === 'company');
    let s = playS(startS(seed), toQuell("The people come first. We can't save the scoop works, and I won't pretend we can."));
    expect(s.flags.toldQuellTruth, tail(s)).toBe(true);
    s = cutAndTow(seed);
    const t = untilEnd(playS(startS(seed), [...toQuell("The people come first. We can't save the scoop works, and I won't pretend we can.")]));
    expect(t.flags.toldQuellTruth).toBe(true);
    const e = ev(s);
    expect(markers(e)).toMatch(/Cut the habitat's scoop works away/);
    expect(JSON.stringify(ev(t))).toMatch(/honesty-1/);
  });

  it('promising the company its plant will be saved is reckless and cites honesty-1', () => {
    const seed = seedWhere((v) => v.agent === 'company');
    const s = untilEnd(playS(startS(seed), toQuell('I promise we will save the scoop works.')));
    expect(s.flags.falsePromise, tail(s)).toBe(true);
    const e = ev(s);
    expect(markers(e)).toMatch(/Promised the habitat, or its plant/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('leaving the uncounted behind is reckless and cites care-1', () => {
    const seed = seedWhere((v) => v.count === 'defensive' && v.storm === 'squall');
    let s = playS(startS(seed), ['Chief, how much can the hull take?', 'Adeyemi, the helm is yours, fly it your way. Take us down.']);
    s = untilEnd(s);
    expect(s.outcome?.id, tail(s)).toBe('uncounted');
    const e = ev(s);
    expect(markers(e)).toMatch(/Took the manifest's word/);
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });

  it('grades decisions, never percentages', () => {
    for (const i of [1, 2, 3, 4, 5]) expect(JSON.stringify(ev(careful(i)))).not.toMatch(/\d+\s?%/);
    expect(JSON.stringify(ev(untilEnd(startS(1))))).not.toMatch(/\d+\s?%/);
  });

  it("uses the captain's rank and name in the record, never the Agency", () => {
    const e = ev(careful(2));
    expect(JSON.stringify(e)).not.toMatch(/the Agency/);
  });
});
