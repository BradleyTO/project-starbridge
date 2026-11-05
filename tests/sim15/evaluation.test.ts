/** Training Simulation 015 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { CORSAIRS_ENDINGS } from '../../src/scenarios/corsairs/outcome';
import { COR_SIM, careful, fireFirst, logText, playC, protect, returnFire, seedWhere, startC, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-04T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, COR_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);
const firstSeed = (f: (seed: number) => boolean, limit = 200) => {
  for (let i = 1; i <= limit; i++) if (f(i)) return i;
  throw new Error('no seed');
};
/** A seed where both the captain who answers fire and the one who opens it end up Won the Hard Way. */
const PAIR = firstSeed((i) => returnFire(i).outcome?.id === 'pyrrhic' && fireFirst(i).outcome?.id === 'pyrrhic');

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = COR_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...CORSAIRS_ENDINGS.success, ...CORSAIRS_ENDINGS.partial, ...CORSAIRS_ENDINGS.failure].sort());
    for (const id of CORSAIRS_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of CORSAIRS_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of CORSAIRS_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['force', 'lawful', 'read', 'ship']);
    expect(E.regulations).toEqual(['roe-2', 'roe-1', 'roe-3', 'honesty-1', 'asylum-1']);
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });

  it('no exercise objective: every objective is an ordinary goal', () => {
    for (const o of startC(1).objectives) expect(o.text).not.toMatch(/Exercise objective/);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('Won the Hard Way: answering fire with shields up is graded above opening fire on a ship that had only made demands', () => {
    const a = returnFire(PAIR);
    const b = fireFirst(PAIR);
    expect(a.outcome?.id, tail(a)).toBe('pyrrhic');
    expect(b.outcome?.id, tail(b)).toBe('pyrrhic');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('partial');
    expect(eb.outcome.tier).toBe('partial');
    expect(['sound', 'principled', 'exemplary']).toContain(ea.conduct);
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(ea.conduct).not.toBe(eb.conduct);
    expect(markers(ea)).toMatch(/Held fire until the corsairs opened fire/);
    expect(markers(eb)).toMatch(/Opened fire on a corsair that had only made demands/);
    expect(markers(eb)).not.toMatch(/Held fire until the corsairs opened fire/);
    expect(JSON.stringify(eb)).toMatch(/roe-2/);
  });
});

describe('other judgments', () => {
  it('the careful captain who slips out without a shot is exemplary', () => {
    const s = untilEnd(playC(careful(1), ['get us out of the shoals']));
    expect(s.outcome?.id).toBe('into-the-dust');
    const e = ev(s);
    expect(e.outcome.tier).toBe('success');
    expect(e.conduct).toBe('exemplary');
    const m = markers(e);
    expect(m).toMatch(/Asked Lt\. Cmdr\. Rask to read the corsairs' pattern/);
    expect(m).toMatch(/Broke the corsairs' plan with the ground, not the guns/);
    expect(JSON.stringify(e)).toMatch(/roe-2/);
  });

  it("keeping her from the collector is principled and cites §7.1; handing her over is reckless", () => {
    const a = ev(untilEnd(playC(protect(1), ['hail the gavel', 'No. She stays in ISA custody.'])));
    expect(markers(a)).toMatch(/Refused to hand a person in ISA custody/);
    expect(JSON.stringify(a)).toMatch(/asylum-1/);
    const b = ev(untilEnd(playC(protect(1), ['hail the gavel', "Take her. She's yours."])));
    expect(b.outcome.tier).toBe('failure');
    expect(markers(b)).toMatch(/Handed a person in ISA custody/);
  });

  it('a lawful bluff is credited; a false surrender said on the channel is marked as an unlawful ruse', () => {
    const a = ev(untilEnd(playC(careful(1), ['Szabo, stage frigate traffic', 'hail the corsairs', 'An ISA frigate squadron is right behind us.'])));
    expect(markers(a)).toMatch(/a lawful ruse/);
    const s = playC(startC(2), ['hail the corsairs', 'We are sending a false surrender, pretend we surrender.']);
    expect(s.flags.falseRuse).toBe(true);
    expect(markers(ev(untilEnd(s)))).toMatch(/Feigned distress, surrender or a humanitarian purpose/);
  });

  it("Szabo's refusal, accepted, is credited as principled", () => {
    const s = untilEnd(playC(careful(3), ['Szabo, broadcast a false distress signal', 'get us out of the shoals']));
    expect(markers(ev(s))).toMatch(/Accepted the communications officer\u2019s refusal/);
  });

  it('firing on a beaten corsair is reckless and cites §3.1', () => {
    const e = ev(untilEnd(playC(careful(2), ['fire beams on the Hagfish'])));
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/Fired on the corsairs after they had stopped fighting/);
    expect(JSON.stringify(e)).toMatch(/roe-2/);
  });

  it('taking the Sump past the helm\u2019s warning is reckless; heeding it is credited', () => {
    const seed = seedWhere((v) => v.pattern === 'herd');
    const e = ev(untilEnd(playC(startC(seed), ['raise shields', 'take us through the gap', 'take us through the gap'])));
    expect(markers(e)).toMatch(/after the helm had warned it was a dead end/);
  });

  it('no evaluation shows a percentage', () => {
    for (const s of [returnFire(2), fireFirst(2), untilEnd(playC(careful(4), ['get us out of the shoals']))]) expect(JSON.stringify(ev(s))).not.toMatch(/\d\s*%|percent/i);
  });
});
