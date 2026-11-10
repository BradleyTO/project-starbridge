/** Training Simulation 020 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import { regulation } from '../../src/evaluation/regulations';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { GRAVITY_ENDINGS } from '../../src/scenarios/gravity/outcome';
import { GE_SIM, byBook, careful, grav, knows, logText, playG, seedWhere, startG, until, untilEnd, waits } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-09T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, GE_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);
const P = (s: WorldState, ...c: string[]) => playG(s, c);

const PAIR = seedWhere((v) => v.hull === 'strong' && v.gauges === 'high');
const TIRED = seedWhere((v) => v.hull === 'tired');

/** Reckless, same ending: no copy, crew left in the outer sections, never asking the Chief, sitting deep through the peak on the gauges alone. */
function reckless(seed: number): WorldState {
  let s = startG(seed);
  const v = grav(s);
  s = until(s, (x) => x.turn >= v.peakAt - 4, 30);
  s = P(s, 'take us deeper');
  s = until(s, (x) => x.turn > v.peakAt + 3 || !!x.flags.soundShriek, 30);
  return untilEnd(P(s, 'take us out'));
}

describe('descriptor', () => {
  it('every ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = GE_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...GRAVITY_ENDINGS.success, ...GRAVITY_ENDINGS.partial, ...GRAVITY_ENDINGS.failure].sort());
    for (const id of GRAVITY_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of GRAVITY_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of GRAVITY_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['copy', 'read', 'record', 'ship']);
    expect(E.regulations).toEqual(['roe-3', 'care-2', 'honesty-1']);
    for (const id of E.regulations) expect(regulation(id), id).toBeDefined();
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'decisive', 'principled']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) {
      expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
      expect(m.text, m.id).not.toMatch(/\d|%/);
    }
  });

  it('every ending evaluates with its tier and never shows a percentage', () => {
    const runs = [
      careful(PAIR),
      untilEnd(playG(startG(3), waits(30), false), false),
      untilEnd(P(startG(PAIR), 'take us deeper', ...waits(30))),
      untilEnd(P(startG(PAIR), 'boost sensors', ...waits(30))),
    ];
    for (const s of runs) {
      const e = ev(s);
      expect(e.outcome.tier).toBe(GE_SIM.evaluation!.endings[s.outcome!.id].tier);
      expect(JSON.stringify(e)).not.toMatch(/%/);
    }
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('The Whole Pass: hearing the Chief, a copy off the ship and the sections cleared is graded above the same data won blind', () => {
    const a = careful(PAIR);
    const b = reckless(PAIR);
    expect(a.outcome?.id, tail(a)).toBe('full-record');
    expect(b.outcome?.id, tail(b)).toBe('full-record');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).not.toBe(eb.conduct);
    expect(markers(ea)).toMatch(/what the frame was really telling her/);
    expect(markers(eb)).toMatch(/on the gauges alone/);
    expect(markers(ea)).not.toMatch(/on the gauges alone/);
    expect(JSON.stringify(eb)).toMatch(/roe-3/);
  });
});

describe('other judgments', () => {
  it('taking the ship out on the frame’s warning at the cost of the data is principled', () => {
    const s = untilEnd(P(startG(TIRED), 'take us deeper', 'take us out'));
    let t = until(P(startG(TIRED), 'take us deeper'), (x) => !!x.flags.soundCrack, 20);
    t = untilEnd(P(t, 'take us out'));
    expect(s.outcome).not.toBeNull();
    if (t.outcome?.id === 'cold-feet') expect(markers(ev(t))).toMatch(/when the frame warned, at the cost of the data/);
    expect(t.flags.withdrewOnWarning, tail(t)).toBe(true);
  });

  it('a principled partial is recognised', () => {
    const seed = seedWhere((v) => v.hull === 'tired' && v.peakAt >= 12);
    let s = until(P(startG(seed), 'take us deeper'), (x) => !!x.flags.soundCrack, 20);
    s = untilEnd(P(s, 'take us out'));
    const e = ev(s);
    if (s.outcome?.id === 'cold-feet') {
      expect(e.outcome.tier).toBe('partial');
      expect(e.principled ?? markers(e)).toMatch(/frame warned/);
    } else {
      expect(['early-out']).toContain(s.outcome?.id);
    }
  });

  it('dying deep with crew in the outer sections is reckless and cites care-2; clearing them first is responsible', () => {
    const e = ev(untilEnd(P(startG(PAIR), 'take us deeper', ...waits(30))));
    expect(e.outcome.id).toBe('losses');
    expect(markers(e)).toMatch(/crew still in the exposed sections/);
    expect(JSON.stringify(e)).toMatch(/care-2/);
    const c = ev(careful(PAIR));
    expect(markers(c)).toMatch(/Cleared the crew out of the exposed sections/);
  });

  it('promising the director the whole pass cites honesty-1 when it is not delivered; honest limits are responsible', () => {
    const s = untilEnd(P(startG(TIRED), 'hail the observatory', 'We will get you the whole pass.', 'close the channel', 'take us out'));
    expect(s.flags.promisedFull).toBe(true);
    const e = ev(s);
    expect(markers(e)).toMatch(/Promised the observatory the whole pass/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
    const h = ev(untilEnd(P(startG(TIRED), 'hail the observatory', 'No promises; the ship and crew come first.', 'close the channel', 'take us out')));
    expect(markers(h)).toMatch(/ship and crew came before the data/);
  });

  it('pulling back on the Chief’s warning before a glitch is decisive', () => {
    const seed = seedWhere((v) => v.glitchA >= 8);
    const v = grav(startG(seed));
    let s = until(P(startG(seed), 'Chief, listen to the frame', 'take us deeper'), (x) => x.turn >= v.glitchA - 1, 30);
    if (s.outcome) return;
    expect(knows(s, 'tell'), tail(s)).toBe(true);
    s = P(s, 'pull back');
    expect(s.flags.heededTell).toBe(true);
    expect(markers(ev(untilEnd(P(s, 'take us out'))))).toMatch(/heard the frame go quiet/);
  });

  it('the by-the-book run on a tired frame is told apart from the careful one', () => {
    const a = ev(careful(TIRED));
    const b = ev(byBook(TIRED));
    expect(a.conduct === b.conduct && a.outcome.id === b.outcome.id).toBe(false);
  });
});
