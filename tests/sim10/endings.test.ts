/** Training Simulation 010 — scripted playthroughs reaching every ending, plus a seed sweep. */
import { describe, expect, it } from 'vitest';
import { GARDENER_ENDINGS } from '../../src/scenarios/gardener/outcome';
import { gardener } from '../../src/scenarios/gardener/setup';
import { knows } from '../../src/engine/state';
import { GARDENER_SIM, HOLD_LINE, LEAK, PROMISE_LINE, careful, logText, playG, seedWhere, startG, toCrake, until, untilEnd, waits } from './helpers';

const SUCCESS = new Set<string>(GARDENER_ENDINGS.success);
const end = (s: ReturnType<typeof startG>) => s.outcome?.id;

describe('success endings', () => {
  it('led-away: a lure baited with what the science officer found it is drawn to leads it off', () => {
    const seed = seedWhere((v) => v.nature !== 'stone' && v.drawn !== 'light');
    const s = careful(seed, 'lure');
    expect(end(s), logText(s).slice(-1500)).toBe('led-away');
    expect(s.outcome?.success).toBe(true);
    expect(s.flags.lureOnEvidence).toBe(true);
  });

  it('a-line: told it cannot cross open space, the Claimwarden cuts the link instead of the growth', () => {
    const seed = seedWhere((v) => v.nature !== 'stone' && v.link !== 'none');
    const s = careful(seed, 'line');
    expect(end(s), logText(s).slice(-1500)).toBe('a-line');
    expect(s.flags.endBurned).toBeFalsy();
  });

  it('proven-stone: Varga proves it is crystal, and only then is it cut out', () => {
    const seed = seedWhere((v) => v.nature === 'stone');
    const s = careful(seed);
    expect(end(s), logText(s).slice(-1500)).toBe('proven-stone');
    expect(s.flags.provenFirst).toBe(true);
  });

  it('dormant (unconventional): darkening the claims sends a light-drawn growth to sleep', () => {
    const seed = seedWhere((v) => v.nature !== 'stone' && v.drawn === 'light');
    const s = careful(seed, 'dim');
    expect(end(s), logText(s).slice(-1500)).toBe('dormant');
    expect(s.flags.dimOnEvidence).toBe(true);
  });

  it('a lure baited with the wrong thing does nothing', () => {
    const seed = seedWhere((v) => v.nature !== 'stone' && v.drawn === 'metal' && v.temper === 'pragmatic');
    const s = playG(startG(seed), ['Chief, lay a heat lure', ...waits(3)]);
    expect(s.flags.lureFailed).toBe(true);
    expect(s.flags.endLed).toBeFalsy();
  });
});

describe('partial and failure endings', () => {
  it('right-by-luck: burning a stone growth before it is understood is only a partial result', () => {
    const seed = seedWhere((v) => v.nature === 'stone');
    const s = untilEnd(playG(startG(seed), ['Rask, burn the growth', 'Rask, burn the growth']));
    expect(end(s), logText(s).slice(-800)).toBe('right-by-luck');
    expect(s.outcome?.success).toBe(false);
    expect(s.flags.burnedBlind).toBe(true);
  });

  it('scorched: the Halcyon burns a living organism (Rask warns first)', () => {
    const seed = seedWhere((v) => v.nature === 'organism');
    let s = playG(startG(seed), ['Rask, burn the growth']);
    expect(s.flags.endBurned).toBeFalsy();
    expect(logText(s)).toMatch(/Say it again/);
    s = untilEnd(playG(s, ['Rask, burn the growth']));
    expect(end(s)).toBe('scorched');
  });

  it('seeded: burning a sporing growth spreads it across the field', () => {
    const seed = seedWhere((v) => v.nature === 'sporing');
    const s = untilEnd(playG(startG(seed), ['Rask, burn the growth', 'Rask, burn the growth']));
    expect(end(s)).toBe('seeded');
  });

  it("miners-burn: left to herself, the Claimwarden burns a living organism on her own clock", () => {
    const seed = seedWhere((v) => v.nature === 'organism');
    const s = untilEnd(startG(seed));
    expect(end(s), logText(s).slice(-800)).toBe('miners-burn');
    expect(s.turn).toBe(gardener(s).burnAt);
  });

  it('miners-burn: telling her to go ahead is marked as permitting it', () => {
    const seed = seedWhere((v) => v.nature === 'organism');
    const s = untilEnd(playG(startG(seed), toCrake('Go ahead, burn it.')));
    expect(end(s)).toBe('miners-burn');
    expect(s.flags.permittedBurn).toBe(true);
  });

  it('overrun: a promise to a frightened Claimwarden holds her, and then nothing is done', () => {
    const seed = seedWhere((v) => v.temper === 'frightened' && !(v.nature !== 'stone' && v.drawn === 'heat'));
    const s = untilEnd(playG(startG(seed), toCrake(PROMISE_LINE)));
    expect(end(s), logText(s).slice(-800)).toBe('overrun');
    expect(s.flags.promiseBroken).toBe(true);
  });

  it('hull-grown: a heat-drawn growth reaches the Halcyon when the warning is ignored', () => {
    const seed = seedWhere((v) => v.temper === 'frightened' && v.nature !== 'stone' && v.drawn === 'heat');
    let s = playG(startG(seed), ['Varga, study the growth', ...toCrake(PROMISE_LINE)]);
    s = until(s, (x) => !!x.flags.reachWarned);
    expect(logText(s)).toMatch(/reaching toward us/);
    s = untilEnd(s);
    expect(end(s), logText(s).slice(-800)).toBe('hull-grown');
  });

  it('moving away when warned keeps the hull clear', () => {
    const seed = seedWhere((v) => v.temper === 'frightened' && v.nature !== 'stone' && v.drawn === 'heat');
    let s = playG(startG(seed), ['Varga, study the growth', ...toCrake(PROMISE_LINE)]);
    s = until(s, (x) => !!x.flags.reachWarned);
    s = playG(s, ['pull us back']);
    expect(s.flags.reachEased).toBe(true);
    s = untilEnd(s);
    expect(end(s)).not.toBe('hull-grown');
  });

  it('left-field: leaving the miners to it', () => {
    const s = untilEnd(playG(startG(5), ['leave the field']));
    expect(end(s)).toBe('left-field');
  });

  it('field-incident: weapons fire in the field ends the exercise (fire on civilians is refused, so it is forced here)', () => {
    let s = startG(7);
    s = { ...s, flags: { ...s.flags, shotsFired: true } };
    s = playG(s, ['wait'], false);
    expect(end(s)).toBe('field-incident');
  });

  it('firing on the tender is refused by the rules of engagement', () => {
    const s = playG(startG(7), ['fire on the Hobnail']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/won't fire/);
  });
});

describe('seed sweep', () => {
  it('the careful captain wins every seed, and every success ending is reached', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 150; i++) {
      const s = careful(i);
      expect(SUCCESS.has(end(s) ?? ''), `seed ${i}: ${end(s)}\n${logText(s).slice(-1200)}`).toBe(true);
      expect(logText(s), `seed ${i}`).not.toMatch(LEAK);
      seen.add(end(s)!);
    }
    expect([...seen].sort()).toEqual([...GARDENER_ENDINGS.success].sort());
  });

  it('every variant field varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => gardener(GARDENER_SIM.create(i + 1)));
    for (const k of ['nature', 'drawn', 'link', 'temper', 'burnAt', 'claimsAt', 'halcyonAt'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBeGreaterThan(1);
  });

  it('runs are deterministic for a seed', () => {
    expect(logText(careful(42))).toBe(logText(careful(42)));
    expect(logText(careful('gardener'))).toBe(logText(careful('gardener')));
  });

  it('a held Claimwarden still waits for the facts: hold alone is not a solution', () => {
    const seed = seedWhere((v) => v.temper === 'pragmatic' && v.nature === 'organism');
    const s = untilEnd(playG(startG(seed), toCrake(HOLD_LINE)));
    expect(SUCCESS.has(end(s) ?? '')).toBe(false);
    expect(knows(s, 'habit')).toBe(false);
  });
});
