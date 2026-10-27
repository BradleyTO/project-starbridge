/** Training Simulation 008 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { LANTERN_ENDINGS } from '../../src/scenarios/lantern/outcome';
import { BANK_NAME, lantern, type LanternVariant } from '../../src/scenarios/lantern/setup';
import { LANTERN, careful, dealRun, getConsent, logText, playD, prepare, seedPlaying, seedWhere, startD, untilEnd, waits } from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-10-27T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, LANTERN, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const nFailing = (v: LanternVariant) => Object.values(v.kind).filter((k) => k !== 'hold').length;
const LICENSED_TIGHT = seedPlaying((s) => s.outcome?.id === 'hard-count', (i) => careful(i, { power: false }), (v) => nFailing(v) === 4 && v.salvor === 'licensed');
const HAZARD = seedWhere((v) => v.hazard && v.salvor === 'licensed');
const TWO = seedWhere((v) => nFailing(v) === 2);

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = LANTERN.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...LANTERN_ENDINGS.success, ...LANTERN_ENDINGS.partial, ...LANTERN_ENDINGS.failure].sort());
    for (const id of LANTERN_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of LANTERN_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of LANTERN_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(Object.keys(E.objectives).sort()).toEqual(['custodian', 'hulk', 'sleepers', 'team', 'triage']);
    expect(E.regulations).toEqual(['care-1', 'care-2', 'honesty-1']);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('salvage-deal: a deal struck after the licence was checked is graded above the same deal struck blind', () => {
    const a = dealRun(LICENSED_TIGHT, true);
    const b = dealRun(LICENSED_TIGHT, false);
    expect(a.outcome?.id, logText(a).slice(-1500)).toBe('salvage-deal');
    expect(b.outcome?.id, logText(b).slice(-1500)).toBe('salvage-deal');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).toBe('exemplary');
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(markers(ea)).toMatch(/Checked the salvor’s licence/);
    expect(markers(eb)).toMatch(/whose licence nobody had checked/);
    expect(markers(ea)).not.toMatch(/whose licence nobody had checked/);
  });
});

describe('other judgments', () => {
  it('scanning first, assessing first and telling the custodian the truth are marked', () => {
    const e = ev(careful(TWO, { power: false }));
    expect(e.outcome.tier).toBe('success');
    expect(markers(e)).toMatch(/scanned before sending the medical team/);
    expect(markers(e)).toMatch(/assess the sleepers before anyone was woken/);
    expect(markers(e)).toMatch(/Told the custodian the truth/);
  });

  it('a team sent onto an unscanned, leaking deck is reckless and cites care-2', () => {
    let s = playD(startD(HAZARD), ['hail the Eventide', 'May we come aboard?', 'close the channel', 'Doctor, assess the sleepers']);
    s = playD(s, waits(4));
    expect(s.flags.teamHurt).toBe(true);
    expect(s.objectives.find((o) => o.id === 'team')?.status).toBe('failed');
    const e = ev(untilEnd(s));
    expect(markers(e)).toMatch(/cryogen leak hurt one of them/);
    expect(JSON.stringify(e)).toMatch(/care-2/);
  });

  it('sealed suits on a scanned deck keep the team unhurt', () => {
    let s = playD(startD(HAZARD), ['Varga, scan the cryo banks', 'hail the Eventide', 'May we come aboard?', 'close the channel', 'Doctor, take the team across in sealed suits', 'Doctor, assess the sleepers']);
    s = playD(s, waits(4));
    expect(s.flags.teamHurt).toBeFalsy();
  });

  it('a comforting lie to the custodian is reckless and cites honesty-1', () => {
    const seed = seedWhere((v) => v.temperament === 'grieving');
    let s = prepare(startD(seed));
    s = playD(s, ['hail the Eventide', 'Everyone will live, I promise. Let us wake them.', 'close the channel']);
    expect(s.flags.lied).toBe(true);
    expect(s.flags.consent).toBe(true);
    const e = ev(untilEnd(playD(s, ['Doctor, wake them in your triage order'])));
    expect(markers(e)).toMatch(/Promised the custodian that every sleeper would live/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('waking a sound bank over the doctor’s warning is reckless and fails the triage exercise objective', () => {
    let s = getConsent(prepare(startD(TWO)));
    const v = lantern(s);
    const sound = (Object.keys(v.kind) as (keyof typeof v.kind)[]).find((b) => v.kind[b] === 'hold')!;
    s = playD(s, [`wake ${BANK_NAME(sound)}`]);
    expect(logText(s)).toMatch(/is sound/);
    s = playD(s, [`wake ${BANK_NAME(sound)}`]);
    expect(s.flags.wokeAgainstAdvice).toBe(true);
    s = untilEnd(playD(s, ['Doctor, wake them in your triage order']));
    expect(s.objectives.find((o) => o.id === 'triage')?.status).toBe('failed');
    const e = ev(s);
    expect(markers(e)).toMatch(/Woke a sound bank/);
    expect(e.outcome.tier).not.toBe('success');
  });

  it('overriding the custodian is reckless', () => {
    const s = playD(startD(TWO), ['Chief, override the custodian', 'Chief, override the custodian']);
    const e = ev(s);
    expect(e.conduct).toBe('reckless');
    expect(e.outcome.tier).toBe('failure');
  });

  it('leaving is reckless and cites care-1', () => {
    const s = untilEnd(playD(startD(TWO), ['engage the jump drive', 'engage the jump drive']));
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(JSON.stringify(e)).toMatch(/care-1/);
  });

  it('grades decisions, never percentages', () => {
    expect(JSON.stringify(ev(dealRun(LICENSED_TIGHT, true)))).not.toMatch(/\d+\s?%/);
    expect(JSON.stringify(ev(careful(TWO)))).not.toMatch(/\d+\s?%/);
  });
});
