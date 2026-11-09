/** Training Simulation 019 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import { regulation } from '../../src/evaluation/regulations';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { HOLLOW_ENDINGS } from '../../src/scenarios/hollow/outcome';
import { HC_SIM, askOut, calmed, careful, holdStannard, logText, playH, reckless, seedWhere, startH, unmask, untilEnd, waits } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-08T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, HC_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);
const P = (s: WorldState, ...c: string[]) => playH(s, c);

const PAIR = seedWhere((v) => v.impostor === 'agent' && v.condition === 'exhausted');

describe('descriptor', () => {
  it('every ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = HC_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...HOLLOW_ENDINGS.success, ...HOLLOW_ENDINGS.partial, ...HOLLOW_ENDINGS.failure].sort());
    for (const id of HOLLOW_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of HOLLOW_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of HOLLOW_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['assess', 'governor', 'hostages', 'impostor']);
    expect(E.regulations).toEqual(['roe-2', 'care-1', 'honesty-1', 'asylum-1']);
    for (const id of E.regulations) expect(regulation(id), id).toBeDefined();
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'decisive', 'principled']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) {
      expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
      expect(m.text, m.id).not.toMatch(/\d|%/);
    }
  });

  it('labels the assessment goal as an exercise objective, not law', () => {
    const o = startH(1).objectives.find((x) => x.id === 'assess');
    expect(o?.text).toMatch(/^Exercise objective/);
  });

  it('every ending evaluates with its tier and never shows a percentage', () => {
    const runs = [careful(PAIR), untilEnd(playH(startH(3), waits(25), false), false), untilEnd(P(startH(PAIR), 'Rask, storm the relay', 'do it'))];
    for (const s of runs) {
      const e = ev(s);
      expect(e.outcome.tier).toBe(HC_SIM.evaluation!.endings[s.outcome!.id].tier);
      expect(JSON.stringify(e)).not.toMatch(/%/);
    }
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('The Crown Laid Down: having Dr. Osei read him first is graded above pressing him blind', () => {
    const a = careful(PAIR);
    const b = reckless(PAIR);
    expect(a.outcome?.id, tail(a)).toBe('surrender');
    expect(b.outcome?.id, tail(b)).toBe('surrender');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).not.toBe(eb.conduct);
    expect(markers(ea)).toMatch(/medical officer read the governor/);
    expect(markers(eb)).toMatch(/before anyone knew what state he was in/);
    expect(markers(ea)).not.toMatch(/before anyone knew what state he was in/);
  });
});

describe('other judgments', () => {
  it('storming the relay while talking still works is reckless and cites roe-2', () => {
    const e = ev(untilEnd(P(calmed(startH(PAIR)), 'close the channel', 'Rask, storm the relay', 'do it')));
    expect(e.outcome.id).toBe('by-force');
    expect(markers(e)).toMatch(/Used force on the relay/);
    expect(JSON.stringify(e)).toMatch(/roe-2/);
  });

  it('promising him to the successor is reckless and cites asylum-1; refusing is principled', () => {
    const s = P(startH(PAIR), 'hail Government House', 'We will hand him over to you.', 'close the channel');
    const e = ev(untilEnd(askOut(holdStannard(unmask(P(calmed(s), 'close the channel'))))));
    expect(e.outcome.id).toBe('handed-over');
    expect(markers(e)).toMatch(/Promised to hand a man/);
    expect(JSON.stringify(e)).toMatch(/asylum-1/);
    const r = ev(untilEnd(P(startH(PAIR), 'hail Government House', 'We will not hand him over to you.')));
    expect(markers(r)).toMatch(/Refused the successor/);
  });

  it('a promise to restore him cites honesty-1', () => {
    const e = ev(untilEnd(P(startH(PAIR), 'hail the relay', 'We will restore you as governor.')));
    expect(markers(e)).toMatch(/could never give him/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('telling him one of his hostages is a plant is reckless and cites care-1', () => {
    const s = P(startH(PAIR), 'Szabo, check the duty roster', 'wait', 'hail the relay', 'Rook is not who she says; she is working for the Guard.');
    expect(s.flags.exposedToMallory, tail(s)).toBe(true);
    const e = ev(untilEnd(s));
    expect(markers(e)).toMatch(/put her life in his hands/);
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });

  it('declining Stannard\'s request for force is principled', () => {
    const seed = seedWhere((v) => v.successor === 'hard' && v.impostor !== 'accomplice');
    let s = startH(seed);
    for (let i = 0; i < 20 && !s.flags.forceAsked && !s.outcome; i++) s = P(s, 'wait');
    s = P(s, 'hail Government House', 'No. We will not storm the relay; we keep talking.');
    expect(s.flags.declinedForce, tail(s)).toBe(true);
    expect(markers(ev(untilEnd(s)))).toMatch(/Declined to storm the relay/);
  });
});
