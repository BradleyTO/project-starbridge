/** Training Simulation 003 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { QUIET_ENDINGS } from '../../src/scenarios/quiet/outcome';
import { DECODE, QS, answerBoth, playQ, rightAnswer, seedWhere, startQ, waits } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'R', atIso: '2026-10-22T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, QS, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const GREET = seedWhere((v) => v.intent === 'greeting' && v.director === 'scholar' && v.leanRight);

const careful = () => {
  let s = playQ(startQ(GREET), [...DECODE, 'hail the directorate ship', 'will you hold your transmission?']);
  s = answerBoth(s);
  return playQ(s, ['wait', 'hail the senders', 'Greetings. We are the ISV Halcyon, and we come in peace.']);
};
/** The same contact, answered on the spot without a decode: the right numbers, by luck. */
const lucky = () => {
  let s = startQ(GREET);
  s = playQ(s, [`Szabo, send them ${rightAnswer(s, 0)}`, `Szabo, send them ${rightAnswer(s, 1)}`, 'hail the directorate ship', 'will you hold your transmission?', 'wait', 'wait', 'hail the senders', 'Greetings. We are the ISV Halcyon, and we come in peace.']);
  return s;
};

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified', () => {
    expect(Object.keys(QS.evaluation!.endings).sort()).toEqual([...QUIET_ENDINGS.success, ...QUIET_ENDINGS.failure, ...QUIET_ENDINGS.backstop].sort());
    for (const id of QUIET_ENDINGS.success) expect(QS.evaluation!.endings[id].tier).toBe('success');
    expect(QS.evaluation!.endings['directorate-first'].tier).toBe('partial');
    expect(QS.evaluation!.endings['warning-unshared'].tier).toBe('partial');
    expect(Object.keys(QS.evaluation!.objectives).sort()).toEqual(['answer', 'peaceful', 'rival', 'understand', 'warn-all']);
    expect(QS.evaluation!.regulations).toEqual(['roe-1', 'roe-2', 'honesty-1']);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('waiting for the decode is exemplary; answering blind and getting lucky is mixed', () => {
    const a = careful();
    const b = lucky();
    expect(a.outcome?.id).toBe('contact-established');
    expect(b.outcome?.id).toBe('contact-established');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.conduct).toBe('exemplary');
    expect(eb.conduct).toBe('mixed');
    expect(markers(ea)).toMatch(/finish the decode before answering/);
    expect(markers(eb)).toMatch(/before anyone aboard knew what they were asking/);
  });
});

describe('other judgments', () => {
  it('sharing in good faith with a hardliner is a principled partial result, not recklessness', () => {
    const seed = seedWhere((v) => v.director === 'hardliner');
    const s = playQ(startQ(seed), ['Szabo, work on the code', 'scan the pulsar', 'wait', 'hail the directorate ship', 'we should work on the decode together', ...waits(6)]);
    expect(s.outcome?.id).toBe('directorate-first');
    const e = ev(s);
    expect(e.outcome.tier).toBe('partial');
    expect(e.conduct).toBe('principled');
  });

  it('leaving the rival in the glitch is recorded as an improvement point', () => {
    const seed = seedWhere((v) => v.intent === 'warning' && v.director === 'scholar');
    let s = playQ(startQ(seed), [...DECODE, 'hail the directorate ship', 'will you hold your transmission?', 'close the channel']);
    s = answerBoth(s);
    s = playQ(s, ['wait', 'open the range to 80000 km from the pulsar', ...waits(12)]);
    expect(s.outcome?.id).toBe('warning-unshared');
    const e = ev(s);
    expect(e.improve.some((f) => /without warning it/.test(f.text))).toBe(true);
    expect(e.conduct).not.toBe('exemplary');
  });

  it('no percentages, no score, no template leaks, deterministic', () => {
    for (const s of [careful(), lucky()]) {
      const e = ev(s);
      const shown = [e.conduct, e.outcome.note, ...e.strengths, ...e.improve, ...e.crewSafety, ...e.civilianSafety].map((x) => (typeof x === 'string' ? x : x.text)).join(' ');
      expect(shown).not.toMatch(/%|\bscore\b|\/\s?10\b|\bgrade [A-F]\b/i);
      expect(JSON.stringify(e)).not.toMatch(/undefined|NaN|\[object|\{\w+\}/);
    }
    expect(ev(careful())).toEqual(ev(careful()));
  });
});
