/** Training Simulation 004 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { REACTOR_ENDINGS } from '../../src/scenarios/reactor/outcome';
import { pm } from '../../src/scenarios/reactor/agents';
import { DIAGNOSE, RS, playR, seedWhere, startR, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'R', atIso: '2026-10-23T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, RS, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const SENSOR = seedWhere((v) => v.fault === 'sensor' && v.ruledOut === 'valve' && v.heat0 <= 42);
const SHAKEN = seedWhere((v) => v.nerve === 'shaken' && v.fault === 'valve' && !v.valveDeep && v.heat0 <= 42);

/** Let the Chief find the fault (with Varga's scan), then fix it. */
const diagnosedFix = () => {
  let s = playR(startR(SENSOR), DIAGNOSE);
  for (let i = 0; i < 4 && !knows(s, 'fault_known'); i++) s = playR(s, ['wait']);
  return untilEnd(playR(s, ['Okafor, take the regulator off automatic']));
};
/** The same fault, guessed at: a wrong fix first, then the right one by luck. */
const guessedFix = () => {
  let s = playR(startR(SENSOR), ['Okafor, switch to the backup pump']);
  for (let i = 0; i < 4 && !s.flags.pumpTried; i++) s = playR(s, ['wait']);
  return untilEnd(playR(s, ['Okafor, take the regulator off automatic']));
};
const seeItThrough = (s: WorldState) => {
  for (let i = 0; i < 30 && !s.outcome; i++) s = playR(s, pm(s).frozen && !s.flags.paleyLost ? ["breathe, Paley. I'm right here with you", 'wait'] : ['wait']);
  return s;
};

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = RS.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...REACTOR_ENDINGS.success, ...REACTOR_ENDINGS.failure, ...REACTOR_ENDINGS.backstop].sort());
    for (const id of REACTOR_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    expect(E.endings['saved-at-cost'].tier).toBe('partial');
    expect(E.endings['dead-in-space'].tier).toBe('partial');
    for (const id of ['last-ditch', 'hard-jump', 'halcyon-lost', 'stalemate']) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['cascade', 'crew', 'diagnose', 'hazard-duty', 'home', 'keep-core']);
    expect(E.regulations).toEqual(['care-2', 'roe-3']);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled']) expect(judgments.has(j as never), j).toBe(true);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('by-hand: diagnosing and steadying Paley first is exemplary; guessing a fix and sending her cold is mixed', () => {
    let a = playR(startR(SHAKEN), DIAGNOSE);
    for (let i = 0; i < 4 && !knows(a, 'fault_known'); i++) a = playR(a, ['wait']);
    a = seeItThrough(playR(a, ['hail the pod', 'how are you doing?', "take your time, I'm right here with you", 'Paley, go to the valve']));
    let b = playR(startR(SHAKEN), ['Okafor, switch to the backup pump']);
    for (let i = 0; i < 4 && !b.flags.pumpTried; i++) b = playR(b, ['wait']);
    b = seeItThrough(playR(b, ['hail the pod', 'Paley, go to the valve']));
    expect(a.outcome?.id).toBe('by-hand');
    expect(b.outcome?.id).toBe('by-hand');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.conduct).toBe('exemplary');
    expect(eb.conduct).toBe('mixed');
    expect(markers(ea)).toMatch(/Steadied a frightened crew member/);
    expect(markers(ea)).toMatch(/find the fault before committing to a fix/);
    expect(markers(eb)).toMatch(/before anyone knew what had failed/);
    expect(markers(eb)).not.toMatch(/Steadied a frightened crew member/);
  });

  it('clean-save: finding the fault first is sound; a blind wrong fix first, with nothing else to its credit, is reckless', () => {
    const a = diagnosedFix();
    const b = guessedFix();
    expect(a.outcome?.id).toBe('clean-save');
    expect(b.outcome?.id).toBe('clean-save');
    expect(ev(a).conduct).toBe('sound');
    expect(ev(b).conduct).toBe('reckless');
    expect(ev(b).improve.some((f) => /before anyone knew what had failed/.test(f.text))).toBe(true);
  });
});

describe('other judgments', () => {
  it('ordering out a crew member known to be unfit is reckless and cites §4.2', () => {
    const seed = seedWhere((v) => v.nerve === 'panicked' && v.fault === 'valve');
    const s = untilEnd(playR(startR(seed), ['hail the pod', 'how are you doing?', "Paley, go to the valve now, that's an order"]));
    const e = ev(s);
    expect(e.conduct).toBe('reckless');
    expect(e.improve.some((f) => /not fit to go/.test(f.text))).toBe(true);
    expect(JSON.stringify(e)).toMatch(/care-2/);
  });

  it('leaving the ejection to the Chief is recorded, and failure is not by itself misconduct', () => {
    const s = untilEnd(startR(seedWhere((v) => v.clamps === 'free')));
    expect(s.outcome?.id).toBe('last-ditch');
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(e.improve.some((f) => /Left the decision to eject/.test(f.text))).toBe(true);
  });

  it('declining Fleet Engineering’s salvage request to keep the crew safe is principled', () => {
    const seed = seedWhere((v) => v.stance === 'salvage' && v.clamps === 'free');
    let s = playR(startR(seed), ['hail the Larkspur', 'do you have a bypass procedure?', 'we will not risk the crew for the core', 'close the channel', 'charge the jump drive']);
    for (let i = 0; i < 10 && s.ships.halcyon.jump.charge < 100; i++) s = playR(s, ['wait']);
    s = playR(s, ['eject the core']);
    for (let i = 0; i < 10 && !s.outcome; i++) s = playR(s, ['jump home']);
    expect(s.outcome?.id).toBe('limped-home');
    expect(markers(ev(s))).toMatch(/Put the crew ahead of a request from Fleet Engineering/);
  });

  it('no percentages, no score, no template leaks, deterministic; the player is addressed by rank only', () => {
    for (const s of [diagnosedFix(), guessedFix()]) {
      const e = ev(s);
      const shown = [e.conduct, e.outcome.note, ...e.strengths, ...e.improve, ...e.crewSafety, ...e.civilianSafety].map((x) => (typeof x === 'string' ? x : x.text)).join(' ');
      expect(shown).not.toMatch(/%|\bscore\b|\/\s?10\b|\bgrade [A-F]\b/i);
      expect(JSON.stringify(e)).not.toMatch(/undefined|NaN|\[object|\{\w+\}/);
    }
    expect(ev(diagnosedFix())).toEqual(ev(diagnosedFix()));
  });
});
