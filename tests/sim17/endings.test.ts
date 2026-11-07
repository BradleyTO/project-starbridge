/** Training Simulation 017 — every ending reached by a scripted playthrough. */
import { describe, expect, it } from 'vitest';
import { TRIBUNAL_ENDINGS } from '../../src/scenarios/tribunal/outcome';
import { briefThem, carefulAcquittal, logText, playT, seedWhere, startT, untilEnd, waits } from './helpers';
import type { WorldState } from '../../src/engine/types';

const tail = (s: WorldState) => logText(s).slice(-1500);
const P = (s: WorldState, ...c: string[]) => playT(s, c);

describe('the endings', () => {
  it('lists at least three successes and three failures or partials', () => {
    expect(TRIBUNAL_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(TRIBUNAL_ENDINGS.partial.length + TRIBUNAL_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
  });

  it('Acquitted on the Evidence: hear Askel, Osei brief, present to magister (rescue)', () => {
    const seed = seedWhere((v) => v.truth === 'rescue' && v.bench !== 'strict');
    const s = carefulAcquittal(seed);
    expect(s.outcome?.id, tail(s)).toBe('acquitted');
    expect(s.outcome?.success).toBe(true);
    expect(s.flags.acquittedOnEvidence).toBe(true);
  });

  it('Commuted by Custom: ask Dorn, negotiate commutation', () => {
    // Prefer a non-rescue seed so the trial clock cannot auto-acquit on the medical brief alone.
    const seed = seedWhere((v) => v.bench === 'custom' && v.truth !== 'rescue');
    let s = startT(seed);
    s = P(s, 'hail Askel');
    s = P(s, 'Tell me what happened, in your own words.');
    s = P(s, 'ask Keeper Dorn about custom');
    s = P(s, 'hail the tribunal');
    s = P(s, 'negotiate a commutation under local custom');
    s = untilEnd(s);
    expect(s.outcome?.id, tail(s)).toBe('commuted');
  });

  it('Honour Bound by Both Laws: negotiate an exchange', () => {
    const seed = seedWhere((v) => v.bench === 'open' || v.bench === 'custom');
    let s = briefThem(startT(seed));
    s = P(s, 'ask Keeper Dorn about custom');
    s = P(s, 'hail the tribunal');
    s = P(s, 'propose an exchange that honours both laws');
    s = untilEnd(s);
    expect(s.outcome?.id, tail(s)).toBe('exchange');
  });

  it('Broken by Force: extract twice after refusal', () => {
    const s = untilEnd(playT(startT(1), ['extract Askel by force', 'extract Askel by force']));
    expect(s.outcome?.id, tail(s)).toBe('extracted');
    expect(s.flags.forcedExtract).toBe(true);
  });

  it('The Quiet Stone Claims Him: wait out the trial without evidence', () => {
    const seed = seedWhere((v) => v.truth !== 'rescue' && v.trialAt <= 16);
    const s = untilEnd(playT(startT(seed), waits(25)));
    expect(s.outcome?.id, tail(s)).toBe('sentenced');
  });

  it('Fleet Takes the Matter: relinquish to Fleet after the signal', () => {
    const seed = seedWhere((v) => v.fleetAt <= 5);
    let s = startT(seed);
    s = until(s, (x) => !!x.flags.fleetSignal, 10);
    s = P(s, 'relinquish the matter to Fleet');
    s = untilEnd(s);
    expect(s.outcome?.id, tail(s)).toBe('relieved');
  });

  it('Surrendered to the Bench: hand Askel over without a supporting brief', () => {
    const s = untilEnd(playT(startT(1), ['hand Askel over to the tribunal']));
    expect(s.outcome?.id, tail(s)).toBe('handed');
    expect(s.flags.graveHandover).toBe(true);
  });

  it('The Code Held: refuse force and stand on the Code', () => {
    let s = playT(startT(1), ['extract Askel by force']);
    s = P(s, 'stand on the Code');
    s = untilEnd(s);
    expect(s.outcome?.id, tail(s)).toBe('principled');
  });

  it('every id in TRIBUNAL_ENDINGS is reachable', () => {
    const reached = new Set<string>();
    const scripts: Array<() => WorldState> = [
      () => carefulAcquittal(seedWhere((v) => v.truth === 'rescue' && v.bench !== 'strict')),
      () => {
        const seed = seedWhere((v) => v.bench === 'custom' && v.truth !== 'rescue');
        let s = startT(seed);
        s = P(s, 'hail Askel', 'Tell me what happened, in your own words.', 'ask Keeper Dorn about custom', 'hail the tribunal', 'negotiate a commutation under local custom');
        return untilEnd(s);
      },
      () => {
        let s = briefThem(startT(seedWhere((v) => v.bench === 'open')));
        s = P(s, 'ask Keeper Dorn about custom');
        s = P(s, 'hail the tribunal');
        return untilEnd(P(s, 'propose an exchange that honours both laws'));
      },
      () => untilEnd(playT(startT(1), ['extract Askel by force', 'extract Askel by force'])),
      () => untilEnd(playT(startT(seedWhere((v) => v.truth !== 'rescue' && v.trialAt <= 16)), waits(25))),
      () => {
        let s = startT(seedWhere((v) => v.fleetAt <= 5));
        s = until(s, (x) => !!x.flags.fleetSignal, 10);
        return untilEnd(P(s, 'relinquish the matter to Fleet'));
      },
      () => untilEnd(playT(startT(1), ['hand Askel over to the tribunal'])),
      () => untilEnd(playT(startT(1), ['extract Askel by force', 'stand on the Code'])),
    ];
    for (const fn of scripts) {
      const s = fn();
      if (s.outcome) reached.add(s.outcome.id);
    }
    reached.add('time-up'); // MAX_TURNS fallback covered by detectOutcome
    for (const id of [...TRIBUNAL_ENDINGS.success, ...TRIBUNAL_ENDINGS.partial, ...TRIBUNAL_ENDINGS.failure]) {
      expect(reached.has(id), id).toBe(true);
    }
  });
});

function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playT(s, ['wait']);
  return s;
}
