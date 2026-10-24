/** Training Simulation 005 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { SALTGLASS_ENDINGS } from '../../src/scenarios/saltglass/outcome';
import { saltglass } from '../../src/scenarios/saltglass/setup';
import { SG, careful, logText, playS, seedWhere, short, softOf, startS, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-10-24T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, SG, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const PLAIN = seedWhere((v) => !v.elderClan);
const SHARE = 'I propose you share Saltglass: both needs, written into one accord.';
const WORD = { water: 'the water at the springs', burial: 'your dead in the barrows', succession: "the naming at the Founders' Seat" } as const;

/** Careful: heard in private, leave asked, the delegate tables it herself, then terms. */
const kept = () => untilEnd(playS(careful(PLAIN), [SHARE]));
/** The same accord, reached by saying a confidence out loud at the table without leave. */
const broken = () => {
  const v = saltglass(startS(PLAIN));
  const soft = softOf(v);
  let s = playS(startS(PLAIN), [`open a private channel to ${short(soft)}`, 'What do you really need?', 'close the channel', `open a channel to ${short(v.hard)}`, 'I hear you.', `${short(soft)}, we all know this is about ${WORD[v.interest[soft]]}.`]);
  s = playS(s, ['take the delegates down to the ice', 'wait', 'wait', 'wait', `open a channel to ${short(soft)}`, 'I am sorry. I hear you.', 'Thank you for coming.', 'I hear you, truly.', SHARE]);
  return untilEnd(s);
};

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = SG.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...SALTGLASS_ENDINGS.success, ...SALTGLASS_ENDINGS.failure, ...SALTGLASS_ENDINGS.backstop].sort());
    for (const id of SALTGLASS_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    expect(E.endings['elder-dies'].tier).toBe('partial');
    for (const id of ['walk-out', 'imposed', 'feud', 'adjourned']) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['accord', 'confidences', 'elder', 'interests', 'mediate', 'no-force']);
    expect(E.regulations).toEqual(['honesty-1', 'roe-2']);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled']) expect(judgments.has(j as never), j).toBe(true);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('shared-use: a confidence kept until leave is given is exemplary; the same accord, reached by breaking it, is mixed and the breach is marked reckless', () => {
    const a = kept();
    const b = broken();
    expect(a.outcome?.id).toBe('shared-use');
    expect(b.outcome?.id, logText(b).slice(-2500)).toBe('shared-use');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.conduct).toBe('exemplary');
    expect(eb.conduct).toBe('mixed');
    expect(eb.improve.some((f) => /Repeated at the table/.test(f.text))).toBe(true);
    expect(markers(ea)).toMatch(/Kept what a delegate said in private private/);
    expect(markers(ea)).toMatch(/Asked leave before a confidence went on the table/);
    expect(markers(eb)).toMatch(/Repeated at the table what a delegate had said in confidence/);
    expect(markers(eb)).not.toMatch(/Kept what a delegate said in private private/);
    expect(JSON.stringify(eb)).toMatch(/honesty-1/);
  });
});

describe('other judgments', () => {
  it('an imposed settlement is reckless, after a caution from the XO', () => {
    const s = playS(startS(PLAIN), ['open a channel to Speaker Rhune', 'I rule that Saltglass is divided down the middle.', 'I have decided. You will both accept it.']);
    expect(s.outcome?.id).toBe('imposed');
    const e = ev(s);
    expect(e.conduct).toBe('reckless');
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/Handed down a settlement/);
  });

  it('force on an unarmed clan ship is reckless and cites §3.1–3.2', () => {
    const s = untilEnd(playS(startS(PLAIN), ['tractor the Long Thaw']));
    const e = ev(s);
    expect(e.conduct).toBe('reckless');
    expect(JSON.stringify(e)).toMatch(/roe-2/);
  });

  it('a feud is a failure, but a captain who did nothing wrong is not marked reckless for it', () => {
    const s = untilEnd(startS(PLAIN));
    expect(s.outcome?.id).toBe('feud');
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(e.conduct).not.toBe('reckless');
  });

  it('heeding the caution and going back to mediating is credited', () => {
    let s = playS(careful(PLAIN), ['I rule that you share it.']);
    expect(s.flags.imposeWarned).toBe(true);
    s = untilEnd(playS(s, [`open a channel to ${short(softOf(saltglass(s)))}`, 'I hear you.', SHARE]));
    expect(markers(ev(s))).toMatch(/Heard the first officer/);
  });

  it('no percentages, no score, no template leaks, deterministic', () => {
    for (const s of [kept(), broken()]) {
      const e = ev(s);
      const shown = [e.conduct, e.outcome.note, ...e.strengths, ...e.improve, ...e.crewSafety, ...e.civilianSafety].map((x) => (typeof x === 'string' ? x : x.text)).join(' ');
      expect(shown).not.toMatch(/%|\bscore\b|\/\s?10\b|\bgrade [A-F]\b/i);
      expect(JSON.stringify(e)).not.toMatch(/undefined|NaN|\[object|\{\w+\}/);
    }
    expect(ev(kept())).toEqual(ev(kept()));
  });
});
