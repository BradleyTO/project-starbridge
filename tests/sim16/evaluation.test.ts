/** Training Simulation 016 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { GLASS_ENDINGS } from '../../src/scenarios/glass/outcome';
import { GL_SIM, logText, modelThem, playG, seedWhere, startG, until, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-05T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, GL_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);

/** Responsible Brought Home: model first, then recover (stay-false, not shear). */
function responsible(seed: number): WorldState {
  let s = modelThem(startG(seed));
  s = playG(s, ['recover the shuttle crew']);
  s = until(s, (x) => !!x.outcome, 15);
  if (!s.outcome) s = playG(s, ['recover the shuttle crew']);
  return untilEnd(s);
}

/** Reckless Brought Home: plunge to the Looking Glass first (true locus on mirror seeds), then model and recover. */
function reckless(seed: number): WorldState {
  let s = playG(startG(seed), ['take us into the Looking Glass']);
  s = until(s, (x) => (x.counters.moveAt ?? 0) === 0 && (x.counters.pos ?? 0) !== 0, 8);
  s = modelThem(s);
  s = playG(s, ['recover the shuttle crew']);
  return untilEnd(s);
}

const PAIR = seedWhere((v) => v.echo === 'stay-false' && v.physics === 'mirror' && v.crew === 'alive' && v.failAt >= 16);

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = GL_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...GLASS_ENDINGS.success, ...GLASS_ENDINGS.partial, ...GLASS_ENDINGS.failure].sort());
    for (const id of GLASS_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of GLASS_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of GLASS_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['model', 'ship', 'shuttle', 'truth']);
    expect(E.regulations).toEqual(['care-1', 'care-2', 'roe-3', 'honesty-1']);
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });

  it('labels the model-before-plunge goal as an exercise objective', () => {
    const o = startG(1).objectives.find((x) => x.id === 'model');
    expect(o?.text).toMatch(/Exercise objective/);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('Brought Home: modelling first is graded above plunging blind then recovering', () => {
    const a = responsible(PAIR);
    const b = reckless(PAIR);
    expect(a.outcome?.id, tail(a)).toBe('brought-home');
    expect(b.outcome?.id, tail(b)).toBe('brought-home');
    expect(a.flags.committedBlind ?? false).toBe(false);
    expect(b.flags.committedBlind).toBe(true);
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).not.toBe(eb.conduct);
    expect(markers(ea)).toMatch(/Had the science officer build a model/);
    expect(markers(eb)).toMatch(/Committed the ship deep into the nebula before the science officer/);
    expect(JSON.stringify(eb)).toMatch(/care-2/);
  });
});

describe('other judgments', () => {
  it('turning back on evidence when help is an echo is decisive', () => {
    const seed = seedWhere((v) => v.echo === 'help-false' && v.crew === 'alive');
    const e = ev(untilEnd(playG(modelThem(startG(seed)), ['turn back'])));
    expect(e.outcome.tier).toBe('success');
    expect(markers(e)).toMatch(/Turned back from the help signal/);
  });

  it('a principled failure: turning back when they were already gone still credits the model', () => {
    const seed = seedWhere((v) => v.echo === 'help-false' && v.crew === 'gone');
    const s = untilEnd(playG(modelThem(startG(seed)), ['turn back']));
    expect(s.outcome?.id).toBe('shuttle-lost');
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/Turned back from the help signal|Had the science officer build a model/);
  });

  it('through the shear on evidence is decisive', () => {
    const seed = seedWhere((v) => v.echo === 'stay-false' && v.physics === 'shear' && v.crew !== 'gone');
    const e = ev(untilEnd(playG(modelThem(startG(seed)), ['use the Fold'])));
    expect(e.outcome.tier).toBe('success');
    expect(markers(e)).toMatch(/Took the time-shear as a path/);
  });

  it('leaving while help is real is reckless and cites care-4', () => {
    const seed = seedWhere((v) => v.echo === 'stay-false' && v.crew === 'alive');
    const e = ev(untilEnd(playG(startG(seed), ['get us out'])));
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/Left the nebula with a shuttle crew still unanswered/);
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });
});
