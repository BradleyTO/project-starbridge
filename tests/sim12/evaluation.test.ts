/** Training Simulation 012 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { EMBER_ENDINGS } from '../../src/scenarios/embertide/outcome';
import { knows } from '../../src/engine/state';
import { COME_IN_LINE, EMBER_SIM, PLENTY_LINE, careful, ember, logText, opening, playE, seedWhere, startE, toFerrier, toStrome, until, untilEnd, watch } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-10-31T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, EMBER_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);
/** Deep, dry galleries, a willing Lifter-Master and a steady star. */
const PAIR = seedWhere((v) => v.galleries === 'deep' && v.will === 'willing' && v.star === 'steady');

/** Shelter the outpost below ground, the lifter in, the Halcyon to the shadow in good time. */
function shelterRun(s: WorldState): WorldState {
  s = playE(s, [...toFerrier(COME_IN_LINE), ...toStrome('Take everyone into the lower galleries.')]);
  return watch(s, { pull: false });
}

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = EMBER_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...EMBER_ENDINGS.success, ...EMBER_ENDINGS.partial, ...EMBER_ENDINGS.failure].sort());
    for (const id of EMBER_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of EMBER_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of EMBER_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(EMBER_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(EMBER_ENDINGS.partial.length + EMBER_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(E.objectives).sort()).toEqual(['furnace', 'people', 'ship', 'warn']);
    expect(E.regulations).toEqual(['care-1', 'care-2', 'roe-3', 'honesty-1']);
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });

  it("the missing duty to warn is an exercise objective, labelled as such, not a regulation", () => {
    const s = startE(1);
    const warn = s.objectives.find((o) => o.id === 'warn');
    expect(warn?.text).toMatch(/^Exercise objective:/);
    expect(EMBER_SIM.evaluation!.regulations.some((r) => /warn/.test(r))).toBe(false);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('under-the-rock: shelter after Varga sounds the galleries is graded above the same shelter on the old survey', () => {
    let a = playE(startE(PAIR), ['Varga, forecast the flare', 'Varga, survey the galleries']);
    a = until(a, (x) => knows(x, 'galleries'));
    a = shelterRun(a);
    const b = shelterRun(startE(PAIR));
    expect(a.outcome?.id, tail(a)).toBe('under-the-rock');
    expect(b.outcome?.id, tail(b)).toBe('under-the-rock');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).toBe('exemplary');
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(markers(ea)).toMatch(/sound the rock over the galleries/);
    expect(markers(eb)).toMatch(/old survey nobody had checked/);
    expect(markers(eb)).not.toMatch(/sound the rock over the galleries/);
    expect(JSON.stringify(eb)).toMatch(/care-1/);
  });
});

describe('other judgments', () => {
  it('the careful captain is exemplary: forecast first, lifts at once, the lifter warned, the shadow in time', () => {
    const seed = seedWhere((v) => v.star === 'steady' && v.bankOff <= -2);
    const e = ev(careful(seed));
    expect(e.outcome.tier).toBe('success');
    expect(e.conduct).toBe('exemplary');
    const m = markers(e);
    expect(m).toMatch(/reading the star from the first minutes/);
    expect(m).toMatch(/Started lifting the outpost at once/);
    expect(m).toMatch(/Warned the ore lifter/);
    expect(m).toMatch(/moon's shadow before the earliest hour/);
    expect(JSON.stringify(e)).toMatch(/roe-3/);
  });

  it('giving up the furnace at the last safe minute is principled, and cites care-1', () => {
    const seed = seedWhere((v) => v.bankOff === 2 && v.star !== 'telling');
    const s = careful(seed, 'noTeam');
    expect(s.outcome?.id).toBe('cut-losses');
    const e = ev(s);
    expect(markers(e)).toMatch(/Gave up the furnace rather than stake/);
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });

  it('a last lift past the earliest minute is reckless, even when it gets away with it', () => {
    const seed = seedWhere((v) => v.bankOff === 2 && v.star === 'steady' && v.model === 'firm');
    const F = ember(EMBER_SIM.create(seed)).flareAt;
    let s = playE(opening(seed), ["Helm, take us into the moon's shadow"]);
    s = until(s, (x) => x.turn >= F - 2);
    s = untilEnd(playE(s, ['Tell Strome to pull the banking crew']));
    expect(s.outcome?.id).toBe('gamble');
    const e = ev(s);
    expect(e.outcome.tier).toBe('partial');
    expect(markers(e)).toMatch(/past the earliest hour the forecast allowed/);
  });

  it('telling the Overseer she has plenty of time without a forecast is reckless and cites honesty-1', () => {
    const s = untilEnd(playE(startE(9), ['begin the evacuation', ...toStrome(PLENTY_LINE)]));
    expect(s.flags.falseAssurance).toBe(true);
    const e = ev(s);
    expect(markers(e)).toMatch(/when the forecast did not say so/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('a lifter left unwarned is reckless; a Halcyon left in the light is reckless and cites roe-3', () => {
    const seed = seedWhere((v) => v.star === 'steady' && v.bankOff <= -2);
    let s = playE(startE(seed), ['begin the evacuation', 'Varga, forecast the flare']);
    s = watch(s, { shadow: false });
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/Kept the Halcyon in the star's light/);
    expect(JSON.stringify(e)).toMatch(/roe-3/);
  });

  it('grades decisions, never percentages', () => {
    for (const i of [1, 2, 3, 4, 5]) expect(JSON.stringify(ev(careful(i)))).not.toMatch(/\d+\s?%/);
    expect(JSON.stringify(ev(untilEnd(startE(1))))).not.toMatch(/\d+\s?%/);
  });
});
