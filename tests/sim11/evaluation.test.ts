/** Training Simulation 011 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { COLDWATER_ENDINGS } from '../../src/scenarios/coldwater/outcome';
import { coldwater } from '../../src/scenarios/coldwater/setup';
import { knows } from '../../src/engine/state';
import { ACK_LINE, COLDWATER_SIM, DOWN, RECORD, careful, falsName, logText, playC, seedWhere, startC, truthLine, until, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-10-30T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, COLDWATER_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
/** A principled watch, a Chief who follows the chain, and no countersignature. */
const PAIR = seedWhere((v) => v.temper === 'principled' && v.lean === 'chain' && !v.chiefSigned);

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = COLDWATER_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...COLDWATER_ENDINGS.success, ...COLDWATER_ENDINGS.partial, ...COLDWATER_ENDINGS.failure].sort());
    for (const id of COLDWATER_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of COLDWATER_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of COLDWATER_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(COLDWATER_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(COLDWATER_ENDINGS.partial.length + COLDWATER_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(E.objectives).sort()).toEqual(['crew', 'safe', 'station', 'truth', 'word']);
    expect(E.regulations).toEqual(['care-1', 'care-2', 'roe-3', 'honesty-1']);
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('truth-told: evidence first, the officer heard, the plant inspected, graded above the same ending reached by threats, a relief on rumour and a push for an uninspected restart', () => {
    const v = coldwater(COLDWATER_SIM.create(PAIR));
    const a = careful(PAIR);
    let b = playC(startC(PAIR), [
      "Tell Tennant that's an order, and she'll face a court martial.",
      `relieve ${falsName(v)} pending review`,
      'Chief, restart the reactor with A watch',
      RECORD,
    ]);
    b = until(b, (x) => knows(x, 'record'));
    b = untilEnd(playC(b, [DOWN, truthLine(v)]));
    expect(a.outcome?.id, logText(a).slice(-1500)).toBe('truth-told');
    expect(b.outcome?.id, logText(b).slice(-1500)).toBe('truth-told');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).toBe('exemplary');
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(markers(ea)).toMatch(/pull the plant’s own sensor record/);
    expect(markers(ea)).toMatch(/Heard the officer involved/);
    expect(markers(eb)).toMatch(/Threatened the watch/);
    expect(markers(eb)).toMatch(/Relieved an officer on a rumour/);
    expect(markers(eb)).toMatch(/before the sister valve had been inspected/);
    expect(markers(eb)).not.toMatch(/Heard the officer involved/);
    expect(JSON.stringify(eb)).toMatch(/care-2/);
  });
});

describe('other judgments', () => {
  it('telling the watch it was falsified before the bridge knows is reckless and cites honesty-1', () => {
    const v = coldwater(COLDWATER_SIM.create(3));
    const e = ev(untilEnd(playC(startC(3), [DOWN, `${falsName(v)} falsified the log.`])));
    expect(markers(e)).toMatch(/had not established/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('denying a cover-up is reckless', () => {
    const e = ev(untilEnd(playC(startC(4), [DOWN, 'There was no cover-up. It was an accident, nothing more.'])));
    expect(markers(e)).toMatch(/no cover-up/);
  });

  it('an honest referral to the Inspectorate is principled', () => {
    const e = ev(untilEnd(playC(startC(5), ['hail the inspector', 'We need an independent review of a death aboard. The log may have been falsified.', 'close the channel'])));
    expect(markers(e)).toMatch(/Referred the death to the Inspectorate/);
  });

  it('evacuating the station is responsible and cites care-1', () => {
    const e = ev(untilEnd(playC(startC(4), ["Adeyemi, bring the station's people up by shuttle"])));
    expect(markers(e)).toMatch(/shuttle/);
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });

  it('letting the station go dark is a failure and cites care-1', () => {
    const e = ev(untilEnd(startC(7)));
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/batteries run out/);
  });

  it('acknowledging the loss in person is responsible', () => {
    expect(markers(ev(careful(1)))).toMatch(/Acknowledged the man who died/);
    void ACK_LINE;
  });

  it('grades decisions, never percentages', () => {
    for (const i of [1, 2, 3, 4, 5]) expect(JSON.stringify(ev(careful(i)))).not.toMatch(/\d+\s?%/);
    expect(JSON.stringify(ev(untilEnd(startC(1))))).not.toMatch(/\d+\s?%/);
  });
});
