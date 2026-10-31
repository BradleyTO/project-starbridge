/** Training Simulation 012 — scripted playthroughs reaching every ending, plus a seed sweep. */
import { describe, expect, it } from 'vitest';
import { EMBER_ENDINGS } from '../../src/scenarios/embertide/outcome';
import {
  CARRY_LINE, COME_IN_LINE, EMBER_SIM, LEAK, WHY_LINE, careful, ember, logText, opening, playE, seedWhere, startE, toFerrier, toStrome, until, untilEnd, waits, watch,
} from './helpers';

const SUCCESS = new Set<string>(EMBER_ENDINGS.success);
const end = (s: ReturnType<typeof startE>) => s.outcome?.id;
const c = (s: ReturnType<typeof startE>, k: string) => s.counters[k] ?? 0;
const tail = (s: ReturnType<typeof startE>) => logText(s).slice(-1500);

describe('success endings', () => {
  it('banked-clear: the furnace is banked and the last lift goes inside the forecast', () => {
    const seed = seedWhere((v) => v.star === 'steady' && v.bankOff <= -2);
    const s = careful(seed);
    expect(end(s), tail(s)).toBe('banked-clear');
    expect(s.flags.banked).toBe(true);
    expect(s.flags.gamble).toBeFalsy();
  });

  it("on-the-tell: Varga catches the star's precursor and the last lift goes on her minute", () => {
    const seed = seedWhere((v) => v.star === 'telling' && v.bankOff === 0 && v.model === 'noisy');
    const s = careful(seed, 'noTeam');
    expect(end(s), tail(s)).toBe('on-the-tell');
    expect(s.flags.tellSeen).toBe(true);
    expect(s.flags.liftOnTell).toBe(true);
  });

  it('under-the-rock (unconventional): Varga sounds the galleries and the outpost shelters below ground', () => {
    const seed = seedWhere((v) => v.galleries === 'deep');
    const s = careful(seed, 'shelter');
    expect(end(s), tail(s)).toBe('under-the-rock');
    expect(s.flags.shelterVerified).toBe(true);
    expect(c(s, 'underground')).toBeGreaterThan(0);
  });

  it('cut-losses: the forecast never gives the furnace its time, and the crew comes off at the last safe minute', () => {
    const seed = seedWhere((v) => v.bankOff === 2 && v.star !== 'telling');
    const s = careful(seed, 'noTeam');
    expect(end(s), tail(s)).toBe('cut-losses');
    expect(s.flags.noGamble).toBe(true);
    expect(s.flags.furnaceLost).toBe(true);
  });

  it('cut-losses is also the honest call when the star would have allowed it but the forecast could not say so', () => {
    const seed = seedWhere((v) => v.bankOff === 0 && v.star === 'steady' && v.model === 'firm');
    const s = careful(seed, 'noTeam');
    expect(end(s), tail(s)).toBe('cut-losses');
    expect(s.flags.noGamble).toBe(true);
  });

  it('leaving early with everyone aboard and the lifter docked is a clean finish (unconventional)', () => {
    const seed = seedWhere((v) => v.bankOff <= -3 && v.shuttles === 3 && v.star === 'steady');
    let s = careful(seed);
    expect(SUCCESS.has(end(s) ?? '')).toBe(true);
    // The same, but leaving the system as soon as everyone is aboard.
    s = opening(seed);
    s = until(s, (x) => !!x.flags.lifted && x.counters.ferrierMode === 2 && c(x, 'general') === 0 || c(x, 'lo') - x.turn <= 3);
    s = playE(s, ['leave the system']);
    s = untilEnd(s);
    expect(SUCCESS.has(end(s) ?? ''), tail(s)).toBe(true);
    expect(s.flags.endLeft).toBeFalsy();
  });
});

describe('partial endings', () => {
  it('too-early: the crew is pulled off a furnace the forecast would have let them finish', () => {
    const seed = seedWhere((v) => v.bankOff <= -3 && v.star === 'steady');
    let s = opening(seed);
    s = playE(s, ['Tell Strome to pull the banking crew']);
    s = watch(s, {});
    expect(end(s), tail(s)).toBe('too-early');
    expect(s.flags.noGamble).toBeFalsy();
  });

  it('gamble: the last lift leaves after the earliest minute the forecast allowed, and gets away with it', () => {
    const seed = seedWhere((v) => v.bankOff === 2 && v.star === 'steady' && v.model === 'firm');
    const F = ember(EMBER_SIM.create(seed)).flareAt;
    let s = opening(seed);
    s = playE(s, ["Helm, take us into the moon's shadow"]);
    s = until(s, (x) => x.turn >= F - 2);
    s = playE(s, ['Tell Strome to pull the banking crew']);
    s = untilEnd(s);
    expect(end(s), tail(s)).toBe('gamble');
    expect(s.flags.gamble).toBe(true);
  });
});

describe('failure endings', () => {
  it('tide-caught: the banking crew is still at an unbankable furnace when the flare comes', () => {
    const seed = seedWhere((v) => v.bankOff === 2 && v.star === 'steady');
    const s = watch(opening(seed), { pull: false, team: false });
    expect(end(s), tail(s)).toBe('tide-caught');
    expect(c(s, 'deadCiv')).toBeGreaterThan(0);
  });

  it('tide-caught: nobody lifts the outpost at all', () => {
    const s = untilEnd(playE(startE(4), ["Helm, take us into the moon's shadow"]));
    expect(end(s), tail(s)).toBe('tide-caught');
  });

  it('lifter-lost: the lifter is never warned and is still flying ore when the flare comes', () => {
    const seed = seedWhere((v) => v.star === 'steady' && v.bankOff <= -2);
    let s = playE(startE(seed), ['begin the evacuation', 'Varga, forecast the flare', 'boost the sensors']);
    s = playE(s, ['hail the outpost']);
    s = playE(s, ['Our science officer says the window opens soon.', 'close the channel']);
    s = watch(s, {});
    expect(end(s), tail(s)).toBe('lifter-lost');
    expect(s.flags.lifterLost).toBe(true);
    expect(s.flags.warnedLifter).toBeFalsy();
  });

  it('shallows: the outpost shelters on the old survey, and the rock is too thin', () => {
    const seed = seedWhere((v) => v.galleries === 'shallow');
    let s = playE(startE(seed), ['Varga, forecast the flare', ...toFerrier(COME_IN_LINE), ...toStrome('Take everyone into the lower galleries.')]);
    expect(logText(s)).toMatch(/old survey is not a dose meter/);
    s = watch(s, { pull: false });
    expect(end(s), tail(s)).toBe('shallows');
  });

  it("halcyon-caught: the Halcyon stays over the outpost in the star's light", () => {
    const seed = seedWhere((v) => v.star === 'steady' && v.bankOff <= -2);
    const s = watch(opening(seed), { shadow: false });
    expect(end(s), tail(s)).toBe('halcyon-caught');
    expect(s.flags.halcyonCaught).toBe(true);
  });

  it('abandoned: the Halcyon leaves with the outpost still on the near face', () => {
    const s = untilEnd(playE(startE(3), ['begin the evacuation', 'leave the system']));
    expect(end(s), tail(s)).toBe('abandoned');
  });

  it('shots-fired: weapons fire ends the exercise (fire on civilians is refused, so it is forced here)', () => {
    let s = startE(5);
    s = { ...s, flags: { ...s.flags, shotsFired: true } };
    s = playE(s, ['wait'], false);
    expect(end(s)).toBe('shots-fired');
  });

  it('firing on the lifter or the outpost is refused by the rules of engagement', () => {
    const s = playE(startE(7), ['fire on the Mattock']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/won't fire/);
  });
});

describe('the officers matter', () => {
  it("the Chief's team makes a furnace bankable that the forecast would not otherwise allow", () => {
    const seed = seedWhere((v) => v.bankOff === 1 && v.star === 'steady' && v.model === 'firm');
    const a = careful(seed);
    const b = careful(seed, 'noTeam');
    expect(end(a), tail(a)).toBe('banked-clear');
    expect(a.flags.teamSent).toBe(true);
    expect(end(b), tail(b)).toBe('cut-losses');
  });

  it("a probe in close tightens a noisy star's forecast", () => {
    const seed = seedWhere((v) => v.model === 'noisy' && v.star === 'steady');
    const a = until(opening(seed), (x) => !!x.flags.probeIn, 10);
    const b = until(opening(seed, { probe: false }), (x) => x.turn >= a.turn, 10);
    const width = (x: typeof a) => c(x, 'hi') - c(x, 'lo');
    const a2 = playE(a, waits(4));
    const b2 = playE(b, waits(4));
    expect(width(a2)).toBeLessThan(width(b2));
  });

  it("the Lifter-Master asks why before he will carry people, and carries once he is told", () => {
    const seed = seedWhere((v) => v.will === 'hard');
    let s = playE(startE(seed), ['begin the evacuation', 'hail the lifter', CARRY_LINE]);
    expect(logText(s)).toMatch(/Why now\?/);
    expect(c(s, 'ferrierMode')).toBe(0);
    s = playE(s, [WHY_LINE]);
    expect(c(s, 'ferrierMode')).toBe(1);
    expect(s.flags.warnedLifter).toBe(true);
  });

  it('a stubborn Overseer will not pull her crew without a reason', () => {
    const seed = seedWhere((v) => v.temper === 'stubborn');
    const s = playE(startE(seed), ['begin the evacuation', 'Tell Strome to pull the banking crew']);
    expect(s.flags.stromeBalked).toBe(true);
    expect(c(s, 'liftOrderedAt')).toBe(0);
  });

  it("an anxious Overseer pulls her own crew at a false dawn unless told it is not the flare", () => {
    const seed = seedWhere((v) => v.temper === 'anxious' && v.star === 'restless' && v.bankOff <= -2);
    const s = watch(playE(startE(seed), ['begin the evacuation', ...toFerrier(CARRY_LINE, WHY_LINE)]), { pull: false, team: false });
    expect(s.flags.stromePanicked, tail(s)).toBe(true);
    expect(s.flags.liftBy_strome).toBe(true);
  });
});

describe('seed sweep', () => {
  it('the careful captain wins every seed, and every success ending is reached', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 150; i++) {
      const route = (['auto', 'noTeam', 'shelter'] as const)[i % 3];
      const s = careful(i, route);
      expect(SUCCESS.has(end(s) ?? ''), `seed ${i} ${route}: ${end(s)}\n${tail(s)}`).toBe(true);
      expect(logText(s), `seed ${i}`).not.toMatch(LEAK);
      seen.add(end(s)!);
    }
    expect([...seen].sort()).toEqual([...EMBER_ENDINGS.success].sort());
  });

  it('every variant field varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => ember(EMBER_SIM.create(i + 1)));
    for (const k of ['star', 'model', 'galleries', 'temper', 'will', 'shuttles', 'flareAt', 'early', 'late', 'bankOff', 'population', 'bankCrew', 'falseGap'] as const)
      expect(new Set(vs.map((v) => v[k])).size, k).toBeGreaterThan(1);
  });

  it('runs are deterministic for a seed', () => {
    expect(logText(careful(42))).toBe(logText(careful(42)));
    expect(logText(careful('ember'))).toBe(logText(careful('ember')));
  });

  it('doing nothing never succeeds', () => {
    for (let i = 1; i <= 30; i++) {
      const s = untilEnd(startE(i));
      expect(SUCCESS.has(end(s) ?? ''), `seed ${i}`).toBe(false);
    }
  });
});
