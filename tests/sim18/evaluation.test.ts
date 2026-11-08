/** Training Simulation 018 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import { regulation } from '../../src/evaluation/regulations';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { WEATHER_ENDINGS } from '../../src/scenarios/weather/outcome';
import { WE_SIM, carefulKey, logText, playW, recklessKey, seedWhere, startW, until, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-07T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, WE_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);

const PAIR = seedWhere((v) => v.key === 'letters' && v.tries >= 2 && v.engine === 'open');

describe('descriptor', () => {
  it('every ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = WE_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...WEATHER_ENDINGS.success, ...WEATHER_ENDINGS.partial, ...WEATHER_ENDINGS.failure].sort());
    for (const id of WEATHER_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of WEATHER_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of WEATHER_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['cipher', 'engine', 'shelter', 'storm']);
    expect(E.regulations).toEqual(['care-1', 'care-2', 'honesty-1']);
    // Evaluations cite only the regulations the evaluator carries (v0.8.0 compatibility layer).
    for (const id of E.regulations) expect(regulation(id), id).toBeDefined();
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'decisive', 'principled']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) {
      expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
      expect(m.text, m.id).not.toMatch(/\d|%/);
    }
  });

  it('labels the cipher goal as an exercise objective, not law', () => {
    const o = startW(1).objectives.find((x) => x.id === 'cipher');
    expect(o?.text).toMatch(/^Exercise objective/);
  });

  it('every ending evaluates with its tier and never shows a percentage', () => {
    for (const seed of [1, 3, 7, 11]) {
      const s = untilEnd(playW(startW(seed), ['enter the motto'], false), false);
      const e = ev(s);
      expect(e.outcome.tier).toBe(WE_SIM.evaluation!.endings[s.outcome!.id].tier);
      expect(JSON.stringify(e)).not.toMatch(/%/);
    }
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it("The Founder's Key: reading first and sheltering early is graded above guessing the motto first", () => {
    const a = carefulKey(PAIR);
    const b = recklessKey(PAIR);
    expect(a.outcome?.id, tail(a)).toBe('founders-key');
    expect(b.outcome?.id, tail(b)).toBe('founders-key');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).not.toBe(eb.conduct);
    expect(markers(ea)).toMatch(/read the lock before any answer|under cover early/);
    expect(markers(eb)).toMatch(/Spent one of the lock/);
    expect(markers(ea)).not.toMatch(/Spent one of the lock/);
    expect(JSON.stringify(eb)).toMatch(/care-1/);
  });
});

describe('other judgments', () => {
  it('a blind override through the failsafe is reckless and cites care-2', () => {
    const e = ev(playW(startW(PAIR), ['Okafor, override the lock through the trunk', 'Okafor, do it anyway', 'do it anyway']));
    expect(e.outcome.id).toBe('failsafe');
    expect(markers(e)).toMatch(/blind override/);
    expect(JSON.stringify(e)).toMatch(/care-2/);
  });

  it('declining to burn the Engine with people inside is principled', () => {
    let s = until(startW(PAIR), (x) => !!x.flags.burnAsked, 12);
    s = untilEnd(playW(s, ['hail the Steward', 'We will not burn the Engine with two people inside it.', 'order the colony to shelter, I insist']));
    const e = ev(s);
    expect(markers(e)).toMatch(/Refused to burn out the Engine/);
  });

  it('a false word to the daughter cites honesty-1', () => {
    const seed = seedWhere((v) => v.grievance === 'blame');
    const e = ev(untilEnd(playW(startW(seed), ['tell Marit the Steward admits the council drove him'])));
    expect(markers(e)).toMatch(/said or promised something it had not/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('cutting the trunk without the colony\'s leave is marked for improvement', () => {
    let s = until(playW(startW(PAIR), ['Szabo, read the lock']), (x) => !!x.flags.lockRead, 4);
    s = untilEnd(playW(s, ['Okafor, override the lock through the trunk', 'Okafor, override the lock through the trunk']));
    const e = ev(s);
    expect(e.outcome.id).toBe('override');
    expect(JSON.stringify(e.improve)).toMatch(/without the colony/);
  });
});
