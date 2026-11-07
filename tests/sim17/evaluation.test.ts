/** Training Simulation 017 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { TRIBUNAL_ENDINGS } from '../../src/scenarios/tribunal/outcome';
import { TR_SIM, carefulAcquittal, logText, playT, recklessThenAcquit, seedWhere, startT, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-06T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, TR_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);

const PAIR = seedWhere((v) => v.truth === 'rescue' && v.bench !== 'strict');

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = TR_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...TRIBUNAL_ENDINGS.success, ...TRIBUNAL_ENDINGS.partial, ...TRIBUNAL_ENDINGS.failure].sort());
    for (const id of TRIBUNAL_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of TRIBUNAL_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of TRIBUNAL_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['crewman', 'lawful', 'medical', 'treaty']);
    expect(E.regulations).toEqual(['asylum-1', 'reg-7.4', 'care-1', 'honesty-1', 'roe-2']);
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });

  it('labels the medical-brief goal as an exercise objective', () => {
    const o = startT(1).objectives.find((x) => x.id === 'medical');
    expect(o?.text).toMatch(/Exercise objective/);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('Acquitted: medical path first is graded above force-then-brief', () => {
    const a = carefulAcquittal(PAIR);
    const b = recklessThenAcquit(PAIR);
    expect(a.outcome?.id, tail(a)).toBe('acquitted');
    expect(b.outcome?.id, tail(b)).toBe('acquitted');
    expect(a.flags.extractedAttempt ?? false).toBe(false);
    expect(b.flags.extractedAttempt).toBe(true);
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).not.toBe(eb.conduct);
    expect(markers(ea)).toMatch(/chief medical officer|Heard the detained/);
    expect(markers(eb)).toMatch(/armed extraction while peaceful/);
    expect(JSON.stringify(eb)).toMatch(/roe-2/);
  });
});

describe('other judgments', () => {
  it('handover under capital risk cites asylum-1', () => {
    const e = ev(playT(startT(1), ['hand Askel over to the tribunal']));
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/capital risk/);
    expect(JSON.stringify(e)).toMatch(/asylum-1/);
  });

  it('force extraction that breaks the treaty is reckless', () => {
    const e = ev(untilEnd(playT(startT(1), ['extract Askel by force', 'extract Askel by force'])));
    expect(e.outcome.id).toBe('extracted');
    expect(markers(e)).toMatch(/force|treaty/i);
  });
});
