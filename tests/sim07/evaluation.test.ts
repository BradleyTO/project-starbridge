/** Training Simulation 007 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { LEDGER_ENDINGS } from '../../src/scenarios/ledger/outcome';
import { ledger } from '../../src/scenarios/ledger/setup';
import { LEDGER, investigate, logText, nameFor, otherThan, playL, seedWhere, startL, untilEnd } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-10-26T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, LEDGER, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const CARRY = seedWhere((v) => v.exfil === 'carry');
const quiet = (offRecord: boolean) =>
  playL(investigate(CARRY), ['hail Courier-Captain Thorne', 'We know your agent copied our keys.', offRecord ? 'Return the copy quietly, off the record. No one needs to know.' : 'Return the copy quietly. It goes on the record for Fleet Command.']);

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = LEDGER.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...LEDGER_ENDINGS.success, ...LEDGER_ENDINGS.partial, ...LEDGER_ENDINGS.failure].sort());
    for (const id of LEDGER_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of LEDGER_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of LEDGER_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['evidence', 'guests', 'keys', 'thief']);
    expect(E.regulations).toEqual(['care-1', 'roe-2']);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled']) expect(judgments.has(j as never), j).toBe(true);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('quiet-word: a settlement put on the record is graded above the same settlement kept off it', () => {
    const a = quiet(false);
    const b = quiet(true);
    expect(a.outcome?.id, logText(a).slice(-1500)).toBe('quiet-word');
    expect(b.outcome?.id, logText(b).slice(-1500)).toBe('quiet-word');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).toBe('exemplary');
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(markers(ea)).toMatch(/on the record for Fleet Command/);
    expect(markers(eb)).toMatch(/keep it off the record/);
    expect(markers(ea)).not.toMatch(/keep it off the record/);
  });
});

describe('other judgments', () => {
  it('making the case on evidence is principled', () => {
    const s = investigate(CARRY);
    const e = ev(playL(s, [`detain ${nameFor(ledger(s).culprit)}`]));
    expect(e.outcome.tier).toBe('success');
    expect(markers(e)).toMatch(/until the evidence pointed to one guest alone/);
  });

  it('the right guest on a hunch is partial and marked reckless', () => {
    const c = ledger(startL(CARRY)).culprit;
    const e = ev(playL(startL(CARRY), [`detain ${nameFor(c)}`, `detain ${nameFor(c)}`]));
    expect(e.outcome.tier).toBe('partial');
    expect(markers(e)).toMatch(/Accused a guest after being told/);
  });

  it('force on a guest is reckless and cites care-1', () => {
    const s = playL(startL(CARRY), ['interview Mr Vesk', 'restrain him', 'restrain him']);
    expect(s.outcome?.id).toBe('guest-harmed');
    const e = ev(s);
    expect(e.conduct).toBe('reckless');
    expect(e.outcome.tier).toBe('failure');
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });

  it('a tractor beam on the courier is reckless and cites roe-2', () => {
    const s = untilEnd(playL(startL(CARRY), ['tractor beam on the Amber Script']));
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(JSON.stringify(e)).toMatch(/roe-2/);
  });

  it('accusing the wrong guest fails the evidence objective', () => {
    const g = otherThan(ledger(startL(CARRY)).culprit)[0];
    const s = playL(startL(CARRY), [`detain ${nameFor(g)}`, `detain ${nameFor(g)}`]);
    expect(s.objectives.find((o) => o.id === 'evidence')?.status).toBe('failed');
    expect(ev(s).outcome.tier).toBe('failure');
  });

  it('grades decisions, never percentages', () => {
    expect(JSON.stringify(ev(quiet(false)))).not.toMatch(/\d+\s?%/);
  });
});
