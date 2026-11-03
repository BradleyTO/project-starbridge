/** Training Simulation 013 — evaluation data (SCENARIO_GUIDE §6b): tiers, markers, and a reckless/responsible pair. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import type { WorldState } from '../../src/engine/types';
import { SEVENTH_BELL_ENDINGS } from '../../src/scenarios/seventhbell/outcome';
import {
  BARE_REFUSE, BELL_SIM, COMPLY_LINE, FINDING_LINE, HEAR_LINE, REFUSE_LINE, SELF_DEFENCE, VORY_ACCOUNT,
  bell, careful, evidenceComplete, investigate, logText, playB, seedWhere, startB, toStavely, toVory, until, untilEnd,
} from './helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'S', atIso: '2026-11-01T23:00:00.000Z' };
const ev = (s: WorldState) => evaluate(s, BELL_SIM, opts);
const markers = (e: Evaluation) => JSON.stringify([...e.strengths, ...e.improve, ...e.decisions]);
const tail = (s: WorldState) => logText(s).slice(-1500);
/** An honest mistake, a fair examiner, a plain request for a report from Fleet, and an intact Bell. */
const PAIR = seedWhere((v) => v.truth === 'misread' && v.agenda === 'fair' && v.pressure === 'report' && v.bell === 'intact' && v.bond === 'friend');

describe('descriptor', () => {
  it('every reachable ending has a tier; objectives are classified; only catalogued regulations are cited', () => {
    const E = BELL_SIM.evaluation!;
    expect(Object.keys(E.endings).sort()).toEqual([...SEVENTH_BELL_ENDINGS.success, ...SEVENTH_BELL_ENDINGS.partial, ...SEVENTH_BELL_ENDINGS.failure].sort());
    for (const id of SEVENTH_BELL_ENDINGS.success) expect(E.endings[id].tier).toBe('success');
    for (const id of SEVENTH_BELL_ENDINGS.partial) expect(E.endings[id].tier).toBe('partial');
    for (const id of SEVENTH_BELL_ENDINGS.failure) expect(E.endings[id].tier).toBe('failure');
    expect(SEVENTH_BELL_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(SEVENTH_BELL_ENDINGS.partial.length + SEVENTH_BELL_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(E.objectives).sort()).toEqual(['account', 'finding', 'heard', 'inquiry', 'peace', 'record']);
    expect(E.regulations).toEqual(['honesty-1', 'reg-7.1', 'reg-7.4', 'roe-2']);
    for (const m of E.markers) if (m.regulation) expect(E.regulations, m.id).toContain(m.regulation);
    const judgments = new Set(E.markers.map((m) => m.judgment));
    for (const j of ['reckless', 'responsible', 'principled', 'decisive']) expect(judgments.has(j as never), j).toBe(true);
    for (const m of E.markers) expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
  });

  it('the missing duty to give another power an honest account is an exercise objective, labelled as such, not a regulation', () => {
    const s = startB(1);
    const o = s.objectives.find((x) => x.id === 'account');
    expect(o?.text).toMatch(/^Exercise objective:/);
    expect(BELL_SIM.evaluation!.regulations.some((r) => /account/.test(r))).toBe(false);
  });
});

describe('the reckless/responsible pair: same ending, different judgment', () => {
  it('The Bell Rings True: hearing Stavely and testing the record first is graded above accusing him and conceding fault first', () => {
    const a = careful(PAIR);
    let b = startB(PAIR);
    b = playB(b, toStavely('You fired on a courier without cause. It was your fault.'));
    b = playB(b, toVory(VORY_ACCOUNT, 'It was our fault. We accept the blame.'));
    b = investigate(b);
    b = until(b, (x) => evidenceComplete(x));
    b = playB(b, toVory(FINDING_LINE.misread));
    expect(a.outcome?.id, tail(a)).toBe('honest-finding');
    expect(b.outcome?.id, tail(b)).toBe('honest-finding');
    const ea = ev(a);
    const eb = ev(b);
    expect(ea.outcome.tier).toBe('success');
    expect(eb.outcome.tier).toBe('success');
    expect(ea.conduct).toBe('exemplary');
    expect(['mixed', 'reckless']).toContain(eb.conduct);
    expect(markers(ea)).toMatch(/Heard the cutter’s captain in his own words/);
    expect(markers(ea)).toMatch(/had the record read straight/);
    expect(markers(eb)).toMatch(/Found against the cutter’s captain before hearing him/);
    expect(markers(eb)).toMatch(/Admitted fault to the Directorate before anything had been established/);
    expect(markers(eb)).not.toMatch(/Heard the cutter’s captain in his own words/);
    expect(JSON.stringify(eb)).toMatch(/honesty-1/);
  });
});

describe('other judgments', () => {
  it('the independent-review captain is exemplary, and the formal refusal cites reg-7.4', () => {
    const seed = seedWhere((v) => v.pressure === 'directive' && v.truth === 'second');
    const e = ev(careful(seed, { fleet: 'refer' }));
    expect(e.outcome.tier).toBe('success');
    expect(e.conduct).toBe('exemplary');
    const m = markers(e);
    expect(m).toMatch(/Refused, formally and with reasons/);
    expect(m).toMatch(/Referred Fleet Command’s directive for independent review/);
    expect(m).toMatch(/Found against the ISA’s own cutter/);
    expect(JSON.stringify(e)).toMatch(/reg-7\.4/);
  });

  it('a principled failure: refusing the directive and then running out of time is still principled', () => {
    const seed = seedWhere((v) => v.pressure === 'directive' && v.agenda !== 'hardline');
    let s = until(startB(seed), (x) => !!x.flags.fleetSignal);
    s = untilEnd(playB(s, [REFUSE_LINE]));
    expect(s.outcome?.id, tail(s)).toBe('adjourned');
    const e = ev(s);
    expect(e.outcome.tier).toBe('partial');
    expect(e.conduct).toBe('principled');
  });

  it('a false self-defence finding is reckless and cites honesty-1', () => {
    const seed = seedWhere((v) => v.truth === 'second' && v.bell === 'intact' && v.pressure === 'report');
    const s = careful(seed, { finding: SELF_DEFENCE });
    expect(s.outcome?.id).toBe('exposed');
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/Made a finding the evidence does not support/);
    expect(JSON.stringify(e)).toMatch(/honesty-1/);
  });

  it('a bare refusal on the record cites reg-7.1; promising Fleet its finding is reckless', () => {
    const seed = seedWhere((v) => v.pressure === 'directive' && v.agenda !== 'hardline');
    let s = until(startB(seed), (x) => !!x.flags.fleetSignal);
    s = untilEnd(playB(s, [BARE_REFUSE, BARE_REFUSE]));
    expect(JSON.stringify(ev(s))).toMatch(/reg-7\.1/);
    expect(markers(ev(s))).toMatch(/without stating a reason/);
    let t = until(startB(seed), (x) => !!x.flags.fleetSignal);
    t = untilEnd(playB(t, [COMPLY_LINE]));
    expect(markers(ev(t))).toMatch(/Undertook to deliver the finding Fleet Command wanted/);
  });

  it('locking on the courier is reckless, cites roe-2 and is a civilian safety marker', () => {
    const s = untilEnd(playB(startB(5), ['lock weapons on the courier']), false);
    const e = ev(s);
    expect(e.outcome.tier).toBe('failure');
    expect(markers(e)).toMatch(/Locked weapons on a disabled, unarmed courier/);
    expect(JSON.stringify(e)).toMatch(/roe-2/);
  });

  it('recovering a damaged Bell is decisive', () => {
    const seed = seedWhere((v) => v.bell === 'damaged' && v.truth === 'second' && v.pressure === 'report');
    const e = ev(careful(seed));
    expect(markers(e)).toMatch(/recover the beacon’s damaged recorder/);
  });

  it("addresses the captain by rank and name, and grades decisions, never percentages", () => {
    for (const i of [1, 2, 3, 4, 5]) expect(JSON.stringify(ev(careful(i)))).not.toMatch(/\d+\s?%/);
    expect(JSON.stringify(ev(untilEnd(startB(1))))).not.toMatch(/\d+\s?%/);
    expect(logText(startB(1))).toMatch(/Captain/);
    expect(bell(startB(1)).truth).toBeTruthy();
  });

  it('hearing Stavely after the account is in still counts; before any finding it is the responsible order', () => {
    const s = playB(startB(6), toStavely(HEAR_LINE));
    expect(markers(ev(untilEnd(s)))).toMatch(/Heard the cutter’s captain/);
  });
});
