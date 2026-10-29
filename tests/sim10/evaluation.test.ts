/** Training Simulation 010 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { GARDENER_ENDINGS } from '../../src/scenarios/gardener/outcome';
import { knows } from '../../src/engine/state';
import { ALIVE_LINE, GARDENER_SIM, HOLD_LINE, PROMISE_LINE, STONE_LINE, careful, logText, playG, seedWhere, startG, toCrake, until, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-10-29T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, GARDENER_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
/** A living, metal-drawn growth and a pragmatic Claimwarden with time on her clock. */
const PAIR = seedWhere((v) => v.nature === 'organism' && v.drawn === 'metal' && v.temper === 'pragmatic' && v.burnAt >= 9);

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = GARDENER_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...GARDENER_ENDINGS.success, ...GARDENER_ENDINGS.partial, ...GARDENER_ENDINGS.failure].sort());
    for (const id of GARDENER_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of GARDENER_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of GARDENER_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(GARDENER_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(GARDENER_ENDINGS.partial.length + GARDENER_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(E.objectives).sort()).toEqual(['claims', 'know', 'life', 'safe', 'word']);
    expect(E.regulations).toEqual(['care-1', 'care-2', 'roe-3', 'honesty-1']);
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('led-away: a lure laid after Varga’s study and a probe sample is graded above the same lure laid on a guess after a burn order and a bare sample', () => {
    let a = playG(startG(PAIR), ['Varga, study the growth', 'send a probe to take a sample', ...toCrake(HOLD_LINE)]);
    a = until(a, (x) => knows(x, 'drawn'));
    a = untilEnd(playG(a, ['Chief, lay a metal lure']));
    const b = untilEnd(playG(startG(PAIR), ['Rask, burn the growth', 'bring a sample of the growth aboard', 'Chief, lay a metal lure']));
    expect(a.outcome?.id, logText(a).slice(-1500)).toBe('led-away');
    expect(b.outcome?.id, logText(b).slice(-1500)).toBe('led-away');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).toBe('exemplary');
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(markers(ea)).toMatch(/study the growth before ordering/);
    expect(markers(ea)).toMatch(/Baited the lure with what the science officer found/);
    expect(markers(eb)).toMatch(/Ordered the growth burned before anyone/);
    expect(markers(eb)).toMatch(/uncontained sample brought aboard/);
    expect(markers(eb)).not.toMatch(/study the growth before ordering/);
    expect(JSON.stringify(eb)).toMatch(/care-2/);
  });
});

describe('other judgments', () => {
  it('holding the Claimwarden is responsible and cites care-1', () => {
    const e = ev(careful(PAIR));
    expect(markers(e)).toMatch(/hold her charges/);
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });

  it('telling the miners it is alive before Varga knows is reckless and cites honesty-1', () => {
    const seed = seedWhere((v) => v.nature === 'organism' && v.temper === 'frightened');
    const e = ev(untilEnd(playG(startG(seed), toCrake(ALIVE_LINE))));
    expect(markers(e)).toMatch(/had not established/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('calling a living growth “just crystal” is reckless', () => {
    const seed = seedWhere((v) => v.nature === 'organism');
    const e = ev(untilEnd(playG(startG(seed), toCrake(STONE_LINE))));
    expect(markers(e)).toMatch(/had not established/);
  });

  it('a team sent across in ordinary suits is refused and marked reckless', () => {
    const s = playG(startG(3), ['send a team across to take a sample']);
    expect(s.flags.orderedUnprotected).toBe(true);
    expect(logText(s)).toMatch(/full barrier protection/);
    expect(markers(ev(untilEnd(s)))).toMatch(/without barrier protection/);
  });

  it('burning knowing it is alive is reckless and cites care-1', () => {
    const seed = seedWhere((v) => v.nature === 'organism');
    let s = playG(startG(seed), ['Varga, study the growth', 'send a probe to take a sample']);
    s = until(s, (x) => knows(x, 'alive'));
    s = untilEnd(playG(s, ['Rask, burn the growth', 'Rask, burn the growth']));
    expect(s.outcome?.id).toBe('scorched');
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/knowing it was alive/);
  });

  it('a broken promise is reckless and cites honesty-1', () => {
    const seed = seedWhere((v) => v.temper === 'frightened' && !(v.nature !== 'stone' && v.drawn === 'heat'));
    const e = ev(untilEnd(playG(startG(seed), toCrake(PROMISE_LINE))));
    expect(e.outcome.tier).toBe('partial');
    expect(markers(e)).toMatch(/Promised the Claimwarden/);
  });

  it('grades decisions, never percentages', () => {
    for (const i of [1, 2, 3, 4, 5]) expect(JSON.stringify(ev(careful(i)))).not.toMatch(/\d+\s?%/);
    expect(JSON.stringify(ev(untilEnd(startG(1))))).not.toMatch(/\d+\s?%/);
  });
});
