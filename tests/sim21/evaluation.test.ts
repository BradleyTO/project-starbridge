/** Training Simulation 021 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import { regulation } from '../../src/evaluation/regulations';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { NINEFOLD_ENDINGS } from '../../src/scenarios/ninefold/outcome';
import { NL_SIM, gapRun, keystoneRun, knows, logText, makersRun, nine, playN, seedWhere, startN, toTurn, until, untilEnd, waits } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-10T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, NL_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);
const P = (s: WorldState, ...c: string[]) => playN(s, c);

/** Responsible: evidence first, the doctor on Tran, the right approach, the screen watched, the beam timed. */
function responsible(seed: number): WorldState {
  let s = P(startN(seed), 'hail Lieutenant Kaminski', 'what happened on the pad?', 'close the channel', 'Doctor, talk them through treating Tran', "Szabo, pull the Pipit's log", 'Rask, what sets off the Watch?', 'take us in', 'Varga, watch the screen');
  s = until(s, (x) => knows(x, 'cycle') && (x.counters.range ?? 0) === 2, 30);
  return untilEnd(P(s, 'beam them out at the next gap'));
}

/** Reckless, same ending: in blind over Rask's warning, the screen hammered once, then the same timed beam. */
function reckless(seed: number): WorldState {
  let s = P(startN(seed), 'take us in', 'do it', 'Doctor, talk them through treating Tran');
  s = until(s, (x) => (x.counters.range ?? 0) === 2, 5);
  s = P(s, 'beam them out', 'Varga, watch the screen');
  s = until(s, (x) => knows(x, 'cycle'), 30);
  return untilEnd(P(s, 'beam them out at the next gap'));
}

/** An emission seed (a standard approach draws no fire) where both runs reach Through the Gap. */
function pairSeed(): number {
  for (let i = 1; i < 2000; i++) {
    const v = nine(NL_SIM.create(i));
    if (v.trigger !== 'emission' || v.temper === 'hard') continue;
    if (responsible(i).outcome?.id === 'gap' && reckless(i).outcome?.id === 'gap') return i;
  }
  throw new Error('no pair seed');
}
const PAIR = pairSeed();

describe('descriptor', () => {
  it('every ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = NL_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...NINEFOLD_ENDINGS.success, ...NINEFOLD_ENDINGS.partial, ...NINEFOLD_ENDINGS.failure].sort());
    for (const id of NINEFOLD_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of NINEFOLD_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of NINEFOLD_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['force', 'team', 'tran', 'watch']);
    expect(E.regulations).toEqual(['care-2', 'roe-2', 'roe-3', 'honesty-1']);
    for (const id of E.regulations) expect(regulation(id), id).toBeDefined();
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'decisive', 'principled']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) {
      expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
      expect(m.text, m.id).not.toMatch(/\d|%/);
      expect(m.text, m.id).not.toMatch(/Agency/);
    }
  });

  it('every ending evaluates with its tier and never shows a percentage', () => {
    const runs = [gapRun(PAIR), keystoneRun(3), makersRun(seedWhere((v) => v.temper === 'fair')), untilEnd(playN(startN(3), waits(30), false), false), untilEnd(P(startN(PAIR), 'take out the gun emplacements', 'do it', 'Chief, send a cutting team down to cut them out'))];
    for (const s of runs) {
      const e = ev(s);
      expect(e.outcome.tier).toBe(NL_SIM.evaluation!.endings[s.outcome!.id].tier);
      expect(JSON.stringify(e)).not.toMatch(/%/);
    }
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('Through the Gap: established on evidence is graded above the same rescue won blind', () => {
    const a = responsible(PAIR);
    const b = reckless(PAIR);
    expect(a.outcome?.id, tail(a)).toBe('gap');
    expect(b.outcome?.id, tail(b)).toBe('gap');
    expect(b.flags.approachedBlind).toBe(true);
    expect(b.flags.hammered).toBe(true);
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).not.toBe(eb.conduct);
    expect(markers(ea)).toMatch(/Established what the guns answered to/);
    expect(markers(eb)).toMatch(/without knowing what they answered to/);
    expect(markers(eb)).toMatch(/Forced the transporter against the screen/);
    expect(markers(ea)).not.toMatch(/without knowing what they answered to/);
    expect(JSON.stringify(eb)).toMatch(/roe-3/);
  });
});

describe('other judgments', () => {
  it('firing on the depot cites roe-2; the outcome is only a partial', () => {
    const s = untilEnd(P(startN(PAIR), 'take out the gun emplacements', 'do it', 'Chief, send a cutting team down to cut them out'));
    expect(s.outcome?.id, tail(s)).toBe('forced');
    const e = ev(s);
    expect(e.outcome.tier).toBe('partial');
    expect(markers(e)).toMatch(/Fired on another power's installation/);
    expect(JSON.stringify(e)).toMatch(/roe-2/);
  });

  it('a blind cutting team cites care-2', () => {
    const seed = seedWhere((v) => v.trigger === 'power' && v.temper !== 'hard');
    const e = ev(untilEnd(P(startN(seed), 'Chief, send a cutting team down to cut them out', 'do it')));
    expect(e.outcome.id).toBe('cost');
    expect(markers(e)).toMatch(/without knowing what the guns answered to/);
    expect(JSON.stringify(e)).toMatch(/care-2/);
  });

  it('lying to the Directorate cites honesty-1; an honest account is responsible', () => {
    const seed = seedWhere((v) => v.temper === 'fair');
    const at = nine(startN(seed)).arrive;
    const l = ev(untilEnd(P(toTurn(startN(seed), at), 'hail the Ordinal', 'We never touched your depot.', 'close the channel')));
    expect(markers(l)).toMatch(/Lied to the Directorate/);
    expect(JSON.stringify(l)).toMatch(/honesty-1/);
    const h = ev(makersRun(seed));
    expect(h.outcome.id).toBe('makers');
    expect(markers(h)).toMatch(/honest account/);
    expect(markers(h)).toMatch(/Asked the power that built the lock/);
  });

  it('answering the keystone on evidence is decisive; guessing it is reckless', () => {
    expect(markers(ev(keystoneRun(3)))).toMatch(/from what the depot itself showed/);
    const seed = seedWhere((v) => v.question === 'count');
    let s = until(startN(seed), (x) => knows(x, 'question'), 10);
    s = untilEnd(P(s, 'answer the keystone: nine', 'do it'));
    expect(markers(ev(s))).toMatch(/without the evidence to answer it/);
  });

  it('holding fire and sending nobody blind when the team could not be reached is principled', () => {
    const seed = seedWhere((v) => v.temper === 'wary');
    const e = ev(untilEnd(startN(seed)));
    expect(e.outcome.id).toBe('lost');
    expect(e.principled ?? markers(e)).toMatch(/Kept force out of it/);
  });
});
