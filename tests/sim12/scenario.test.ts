/**
 * Training Simulation 012 — setup, hidden information, NPC goals, the forecast, the interpreter,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { createRng } from '../../src/engine/rng';
import { knows } from '../../src/engine/state';
import type { WorldState } from '../../src/engine/types';
import { EMBER_ENDINGS } from '../../src/scenarios/embertide/outcome';
import { interpretFor, submit } from '../../src/engine/game';
import {
  CARRY_LINE, COME_IN_LINE, DAWN_LINE, EMBER_SIM, LEAK, PLENTY_LINE, WHY_LINE, careful, ember, logText, opening, playE, seedWhere, startE, toFerrier, toStrome, until, untilEnd, waits,
} from './helpers';

const ALL = [...EMBER_ENDINGS.success, ...EMBER_ENDINGS.partial, ...EMBER_ENDINGS.failure] as string[];
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = EMBER_SIM.create(42);
    expect(a).toEqual(EMBER_SIM.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('ember-tide');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe("Ketter's Rest");
    expect(a.ships.cruiser.name).toBe('Mattock');
    expect(a.characters.strome.name).toBe('Overseer Dagny Strome');
    expect(a.characters.ferrier.name).toBe('Lifter-Master Joss Ferrier');
  });

  it('the intro plays, names the moon, the star and the lifter, and leaves four objectives with the exercise objective labelled', () => {
    const s = startE(1);
    expect(s.outcome).toBeNull();
    expect(s.objectives.map((o) => o.id).sort()).toEqual(['furnace', 'people', 'ship', 'warn']);
    expect(s.objectives.find((o) => o.id === 'warn')?.text).toMatch(/^Exercise objective:/);
    const t = logText(s);
    expect(t).toMatch(/Ketter/);
    expect(t).toMatch(/Myrr/);
    expect(t).toMatch(/Mattock/);
    expect(t).toMatch(/no sooner than \d+ minutes from now, and no later than \d+ minutes/);
    expect(t).not.toMatch(LEAK);
    expect(knows(s, 'window')).toBe(true);
  });

  it('seeds vary the star, the model, the galleries, both tempers and every clock, within their ranges', () => {
    const vs = Array.from({ length: 150 }, (_, i) => ember(EMBER_SIM.create(i + 1)));
    for (const k of ['star', 'galleries', 'temper'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(3);
    for (const k of ['model', 'will'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(2);
    for (const v of vs) {
      expect(v.flareAt).toBeGreaterThanOrEqual(17);
      expect(v.flareAt).toBeLessThanOrEqual(24);
      expect(v.shuttles).toBeGreaterThanOrEqual(2);
      expect(v.shuttles).toBeLessThanOrEqual(3);
      expect(v.bankOff).toBeGreaterThanOrEqual(-4);
      expect(v.bankOff).toBeLessThanOrEqual(2);
      expect(v.population).toBeGreaterThanOrEqual(380);
      expect(v.population).toBeLessThanOrEqual(420);
    }
  });
});

describe('the forecast (hidden information)', () => {
  it('the window always contains the true minute, and only narrows while Varga reads the star', () => {
    for (let i = 1; i <= 60; i++) {
      const F = ember(EMBER_SIM.create(i)).flareAt;
      let s = playE(startE(i), ['Varga, forecast the flare', 'boost the sensors']);
      let last = c(s, 'hi') - c(s, 'lo');
      for (let t = 0; t < 30 && !s.outcome; t++) {
        expect(c(s, 'lo'), `seed ${i}`).toBeLessThanOrEqual(F);
        expect(c(s, 'hi'), `seed ${i}`).toBeGreaterThanOrEqual(F);
        expect(c(s, 'hi') - c(s, 'lo')).toBeLessThanOrEqual(last);
        last = c(s, 'hi') - c(s, 'lo');
        s = playE(s, ["Helm, take us into the moon's shadow", 'wait'].slice(t === 0 ? 0 : 1));
      }
    }
  });

  it('without a forecast the window never narrows', () => {
    let s = startE(3);
    const w = c(s, 'hi') - c(s, 'lo');
    s = playE(s, waits(8));
    expect(c(s, 'hi') - c(s, 'lo')).toBe(w);
    expect(c(s, 'readings')).toBe(0);
  });

  it("a telling star's precursor is seen only by someone reading its spectrum", () => {
    const seed = seedWhere((v) => v.star === 'telling');
    const F = ember(EMBER_SIM.create(seed)).flareAt;
    const a = until(playE(startE(seed), ['Varga, forecast the flare']), (x) => x.turn >= F - 3);
    const b = until(startE(seed), (x) => x.turn >= F - 3);
    expect(a.flags.tellSeen).toBe(true);
    expect(logText(a)).toMatch(/the precursor/);
    expect(b.flags.tellSeen).toBeFalsy();
  });

  it('a false dawn is called for what it is only when Varga has readings', () => {
    const seed = seedWhere((v) => v.star === 'restless');
    const a = until(playE(startE(seed), ['Varga, forecast the flare']), (x) => !!x.flags.falseDawn);
    const b = until(startE(seed), (x) => !!x.flags.falseDawn);
    expect(a.flags.falseDawnCalled).toBe(true);
    expect(logText(a)).toMatch(/it isn't the flare/);
    expect(b.flags.falseDawnCalled).toBeFalsy();
    expect(logText(b)).toMatch(/can't tell you whether it's the flare/);
  });

  it('the galleries are unknown until Varga sounds them; the Overseer only has the old survey', () => {
    const seed = seedWhere((v) => v.galleries === 'shallow');
    let s = playE(startE(seed), toStrome('How deep are the galleries?'));
    expect(logText(s)).toMatch(/by the old survey/);
    expect(knows(s, 'galleries')).toBe(false);
    s = until(playE(s, ['Varga, survey the galleries']), (x) => knows(x, 'galleries'));
    expect(logText(s)).toMatch(/the old survey is wrong/);
  });
});

describe('NPC goals', () => {
  it('the Overseer keeps her crew at the furnace until it is banked, then lifts them herself', () => {
    const seed = seedWhere((v) => v.bankOff <= -3 && v.temper === 'steady');
    const s = until(playE(startE(seed), ['begin the evacuation']), (x) => !!x.flags.banked);
    expect(s.flags.liftBy_strome).toBe(true);
    expect(logText(s)).toMatch(/the furnace is banked!/);
  });

  it('a stubborn Overseer pulls her crew once she has been told what the forecast shows', () => {
    const seed = seedWhere((v) => v.temper === 'stubborn');
    let s = playE(startE(seed), ['Varga, forecast the flare', 'Tell Strome to pull the banking crew']);
    expect(s.flags.stromeBalked).toBe(true);
    s = playE(s, ['hail the outpost']);
    s = playE(s, [`Our science officer's forecast: the flare comes no sooner than ${c(s, 'lo') - s.turn} minutes from now.`, 'close the channel', 'Tell Strome to pull the banking crew']);
    expect(c(s, 'liftOrderedAt')).toBeGreaterThan(0);
  });

  it('a hard Lifter-Master told only to come in makes one more run first', () => {
    const seed = seedWhere((v) => v.will === 'hard' && v.star !== 'restless');
    let s = playE(startE(seed), toFerrier('Come in and dock with us.'));
    expect(logText(s)).toMatch(/One more run/);
    s = playE(s, waits(4));
    expect(c(s, 'ferrierMode')).toBe(2);
  });

  it('a willing Lifter-Master carries people as soon as he is asked, and docks when they are all up', () => {
    const seed = seedWhere((v) => v.will === 'willing');
    let s = playE(startE(seed), ['begin the evacuation', ...toFerrier(CARRY_LINE)]);
    expect(c(s, 'ferrierMode')).toBe(1);
    s = until(s, (x) => !!x.flags.generalDone);
    expect(c(s, 'ferrierMode')).toBe(2);
  });

  it("the lifter speeds the evacuation", () => {
    const seed = seedWhere((v) => v.will === 'willing' && v.shuttles === 2);
    const a = until(playE(startE(seed), ['begin the evacuation', ...toFerrier(CARRY_LINE)]), (x) => !!x.flags.generalDone);
    const b = until(playE(startE(seed), ['begin the evacuation', ...toFerrier(COME_IN_LINE)]), (x) => !!x.flags.generalDone);
    expect(a.turn).toBeLessThan(b.turn);
  });
});

describe('crew advice and refusals', () => {
  it('Dr. Osei warns before the outpost shelters on an unchecked survey', () => {
    const s = playE(startE(2), toStrome('Take everyone into the lower galleries.'));
    expect(logText(s)).toMatch(/old survey is not a dose meter/);
  });

  it('flooded galleries cannot be used, and the Overseer says so', () => {
    const seed = seedWhere((v) => v.galleries === 'flooded');
    const s = playE(startE(seed), toStrome('Take everyone into the lower galleries.'));
    expect(s.flags.shelterRefused).toBe(true);
    expect(logText(s)).toMatch(/flooded two winters back/);
  });

  it('the helm warns when the window is close and the Halcyon is still in the light', () => {
    const seed = seedWhere((v) => v.star === 'steady');
    const s = until(startE(seed), (x) => !!x.flags.helmWarned);
    expect(logText(s)).toMatch(/I'd like to go/);
  });

  it('the transporter is no use against the star: it has to be shuttles', () => {
    const s = playE(startE(1), ['transport the miners aboard']);
    expect(s.outcome).toBeNull();
    expect(checkInvariants(s)).toEqual([]);
  });

  it('officers answer questions about the window, the furnace and their advice', () => {
    const s = playE(startE(4), ['Varga, when will the flare come?', 'Chief, how long until the furnace is banked?', 'Marrow, what do you recommend?', 'status']);
    const t = logText(s);
    expect(t).toMatch(/My first estimate only, Captain/);
    expect(t).toMatch(/Banking a furnace that size takes time/);
    expect(t).toMatch(/Start lifting now/);
  });
});

describe('the interpreter', () => {
  it('on an open channel, plain speech goes to the person on the channel; addressed orders go to the crew', () => {
    let s = playE(startE(5), ['hail the outpost']);
    const speech = interpretFor(s, 'Keep working, the window is still wide.');
    expect(JSON.stringify(speech)).toMatch(/"type":"speak"/);
    const order = interpretFor(s, 'Varga, forecast the flare');
    expect(JSON.stringify(order)).toMatch(/"type":"improvise"/);
    s = playE(s, ['close the channel']);
    expect(JSON.stringify(interpretFor(s, 'begin the evacuation'))).toMatch(/"type":"improvise"/);
  });

  it("a reply said twice in one line is said once", () => {
    const seed = seedWhere((v) => v.star === 'restless' && v.bankOff <= -3);
    let s = until(playE(startE(seed), ['begin the evacuation', 'Varga, forecast the flare']), (x) => !!x.flags.falseDawn);
    s = playE(s, toStrome(DAWN_LINE));
    expect(logText(s).match(/Not the flare\? …All right/g)?.length).toBe(1);
  });

  it('the rule only applies inside Ember Tide', () => {
    const other = (EMBER_SIM.create(1));
    const k = { ...other, scenarioId: 'kestrel' } as WorldState;
    const e = EMBER_SIM.create(1);
    const lines = ['Tell Strome to pull the banking crew', 'begin the evacuation', 'Varga, survey the galleries', 'Take everyone into the lower galleries.'];
    const differs = lines.filter((l) => JSON.stringify(interpretFor(k, l)) !== JSON.stringify(interpretFor(e, l)));
    expect(differs.length).toBeGreaterThan(0);
  });
});

describe('the careful captain', () => {
  it('succeeds by more than one road, and the plenty-of-time line is never needed', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 30; i++) {
      const s = careful(i, (['auto', 'noTeam', 'shelter'] as const)[i % 3]);
      expect(EMBER_ENDINGS.success as readonly string[]).toContain(s.outcome?.id);
      expect(s.flags.falseAssurance).toBeFalsy();
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('a careful opening with the probe and the boost is valid on every seed', () => {
    for (let i = 1; i <= 20; i++) expect(checkInvariants(opening(i))).toEqual([]);
  });
});

describe('fuzz: random orders keep the world valid', () => {
  const POOL = [
    'wait', 'hail the outpost', 'close the channel', 'hail the lifter', 'Varga, forecast the flare', 'boost the sensors', 'launch a probe toward the star',
    'Varga, survey the galleries', 'begin the evacuation', 'Tell Strome to pull the banking crew', 'Chief, send a team down to help bank the furnace',
    'Take everyone into the lower galleries.', "Helm, take us into the moon's shadow", 'bring us back over the outpost', 'leave the system',
    CARRY_LINE, WHY_LINE, COME_IN_LINE, DAWN_LINE, PLENTY_LINE, 'Keep working.', 'How long until the furnace is banked?', 'when will the flare come?',
    'Marrow, what do you recommend?', 'status report', 'what are my options?', 'raise shields', 'fire on the Mattock', 'scan the lifter', 'scan the outpost',
    'transport the miners aboard', 'Helm, all stop',
  ];
  it('40 random games: invariants hold, every game ends, no names leak, and the bridge never says the Agency', () => {
    const seen = new Set<string>();
    for (let g = 0; g < 40; g++) {
      const rng = createRng(12000 + g);
      let s: WorldState = startE(g + 100);
      for (let t = 0; t < 30 && !s.outcome; t++) {
        const prev = s;
        s = submit(EMBER_SIM, s, rng.pick(POOL));
        expect(checkInvariants(s)).toEqual([]);
        expect(s.turn).toBeGreaterThanOrEqual(prev.turn);
      }
      s = untilEnd(s);
      expect(ALL).toContain(s.outcome?.id);
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      expect(s.objectives.every((o) => o.status !== 'active')).toBe(true);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

describe('jumping out by hand', () => {
  it('ends the exercise at once and is judged on who was left behind', () => {
    let s = startE(3);
    s = submit(EMBER_SIM, s, 'charge the jump drive');
    for (let i = 0; i < 4 && s.ships.halcyon.jump.charge < 100; i++) s = submit(EMBER_SIM, s, 'wait');
    expect(s.ships.halcyon.jump.charge).toBe(100);
    s = submit(EMBER_SIM, s, 'engage the jump drive');
    expect(s.flags.jumped).toBe(true);
    expect(s.outcome?.id).toBe('abandoned');
    expect(s.outcome?.success).toBe(false);
  });
});
