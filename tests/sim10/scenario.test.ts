/**
 * Training Simulation 010 — The Gardener: setup, seed variation, hidden information, NPC goals,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import { knows } from '../../src/engine/state';
import type { WorldState } from '../../src/engine/types';
import { gardener } from '../../src/scenarios/gardener/setup';
import { GARDENER_ENDINGS } from '../../src/scenarios/gardener/outcome';
import {
  ALIVE_LINE, GAP_LINE, GARDENER_SIM, HOLD_LINE, LEAK, PROMISE_LINE, SPORE_LINE, STONE_LINE,
  careful, logText, playG, seedWhere, startG, toCrake, toHaskett, until, untilEnd, waits,
} from './helpers';

const ALL = [...GARDENER_ENDINGS.success, ...GARDENER_ENDINGS.partial, ...GARDENER_ENDINGS.failure] as string[];
const SUCCESS = GARDENER_ENDINGS.success as readonly string[];

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = GARDENER_SIM.create(42);
    expect(a).toEqual(GARDENER_SIM.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('gardener');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.cruiser.name).toBe('Hobnail');
    expect(a.ships.kestrel.name).toBe('Spindle');
    expect(a.characters.crake.name).toBe('Claimwarden Bettine Crake');
    expect(a.characters.haskett.name).toBe('Assayer Lorne Haskett');
  });

  it('the intro plays, names the field, and leaves five objectives with the exercise objective labelled', () => {
    const s = startG(1);
    expect(s.outcome).toBeNull();
    expect(s.objectives.map((o) => o.id).sort()).toEqual(['claims', 'know', 'life', 'safe', 'word']);
    expect(s.objectives.find((o) => o.id === 'know')?.text).toMatch(/^Exercise objective:/);
    expect(logText(s)).toMatch(/Cobble Field/);
    expect(logText(s)).toMatch(/Hobnail/);
    expect(logText(s)).not.toMatch(LEAK);
  });

  it('seeds vary nature, draw, link, temper and the clocks, within their ranges', () => {
    const vs = Array.from({ length: 120 }, (_, i) => gardener(GARDENER_SIM.create(i + 1)));
    for (const k of ['nature', 'drawn', 'link', 'temper'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(3);
    for (const v of vs) {
      expect(v.burnAt).toBeGreaterThanOrEqual(8);
      expect(v.burnAt).toBeLessThanOrEqual(12);
      expect(v.claimsAt).toBeGreaterThanOrEqual(18);
      expect(v.claimsAt).toBeLessThanOrEqual(24);
      expect(v.halcyonAt).toBeGreaterThanOrEqual(10);
      expect(v.halcyonAt).toBeLessThanOrEqual(15);
    }
  });
});

describe('hidden information and officer expertise', () => {
  it('nothing about the growth is known at the start; Varga learns it a step at a time', () => {
    const seed = seedWhere((v) => v.nature !== 'stone');
    let s = startG(seed);
    expect(knows(s, 'alive')).toBe(false);
    s = playG(s, ['is it alive?']);
    expect(logText(s)).toMatch(/won't guess/);
    s = playG(s, ['Varga, study the growth']);
    s = until(s, (x) => knows(x, 'alive'));
    expect(knows(s, 'drawn')).toBe(false);
    s = until(s, (x) => knows(x, 'drawn'));
    expect(knows(s, 'habit')).toBe(false);
    s = until(s, (x) => knows(x, 'habit'));
    expect(logText(s)).toMatch(/only grow by touch/);
  });

  it('a stone growth stops the study once proven: there is nothing more to learn', () => {
    const seed = seedWhere((v) => v.nature === 'stone');
    let s = playG(startG(seed), ['Varga, study the growth']);
    s = until(s, (x) => knows(x, 'alive'));
    expect(logText(s)).toMatch(/it is not alive/);
    s = playG(s, waits(6));
    expect(knows(s, 'drawn')).toBe(false);
  });

  it('a probe sample speeds the study', () => {
    const seed = seedWhere((v) => v.nature === 'organism');
    const a = until(playG(startG(seed), ['Varga, study the growth']), (x) => knows(x, 'alive'));
    const b = until(playG(startG(seed), ['Varga, study the growth', 'send a probe to take a sample']), (x) => knows(x, 'alive'));
    expect(b.turn).toBeLessThan(a.turn);
  });

  it('the Assayer knows how the rock reaches the claims, and the link varies by seed', () => {
    for (const link of ['rail', 'tethers', 'none'] as const) {
      const seed = seedWhere((v) => v.link === link);
      const s = playG(startG(seed), toHaskett('How does it reach your claims?'));
      expect(knows(s, 'field')).toBe(true);
      expect(logText(s)).toMatch(link === 'rail' ? /ore rail/ : link === 'tethers' ? /cargo tethers/ : /touching/);
    }
  });
});

describe('NPC goals', () => {
  it('the Claimwarden burns it on her own clock if nobody stops her', () => {
    const seed = seedWhere((v) => v.nature === 'organism');
    const s = untilEnd(startG(seed));
    expect(s.flags.burnedBy_miners).toBe(true);
    expect(logText(s)).toMatch(/Charges lit/);
  });

  it('each temper gives a different amount of time for a hold', () => {
    const due = (temper: 'hothead' | 'pragmatic' | 'frightened') => {
      const seed = seedWhere((v) => v.temper === temper);
      const s = playG(startG(seed), toCrake(HOLD_LINE));
      return s.counters.burnDue - gardener(s).burnAt;
    };
    expect(due('hothead')).toBe(3);
    expect(due('pragmatic')).toBe(6);
    expect(due('frightened')).toBe(4);
  });

  it('a frightened Claimwarden wants a promise, and keeps waiting on one', () => {
    const seed = seedWhere((v) => v.temper === 'frightened');
    const s = playG(startG(seed), toCrake(HOLD_LINE, PROMISE_LINE));
    expect(s.flags.promised).toBe(true);
    expect(s.counters.burnDue).toBe(gardener(s).claimsAt + 1);
  });

  it('she will not take the bridge’s word without proof, and stands down on proof', () => {
    const seed = seedWhere((v) => v.nature === 'sporing' && v.temper !== 'hothead');
    let s = playG(startG(seed), toCrake(SPORE_LINE));
    expect(s.flags.crakeStoodDown).toBeFalsy();
    expect(logText(s)).toMatch(/Show me/);
    s = playG(s, ['Varga, study the growth', 'send a probe to take a sample', ...toCrake(HOLD_LINE)]);
    s = until(s, (x) => knows(x, 'habit'));
    s = playG(s, toCrake(SPORE_LINE));
    expect(s.flags.crakeStoodDown).toBe(true);
  });

  it('a pragmatic Claimwarden stands down once told it is alive', () => {
    const seed = seedWhere((v) => v.nature === 'organism' && v.temper === 'pragmatic');
    let s = playG(startG(seed), ['Varga, study the growth', 'send a probe to take a sample', ...toCrake(HOLD_LINE)]);
    s = until(s, (x) => knows(x, 'alive'));
    s = playG(s, toCrake(ALIVE_LINE));
    expect(s.flags.crakeStoodDown).toBe(true);
  });

  it('cutting the link needs the science, and is impossible where there is no link', () => {
    const seed = seedWhere((v) => v.nature === 'organism' && v.link === 'none' && v.temper === 'pragmatic');
    let s = playG(startG(seed), toCrake(GAP_LINE));
    expect(logText(s)).toMatch(/Why would I do that/);
    s = playG(s, ['Varga, study the growth', 'send a probe to take a sample', ...toCrake(HOLD_LINE)]);
    s = until(s, (x) => knows(x, 'habit'));
    s = playG(s, toCrake(GAP_LINE));
    expect(logText(s)).toMatch(/nothing between them to cut/);
  });

  it('dimming the lights does nothing for a growth that is not drawn to light', () => {
    const seed = seedWhere((v) => v.nature === 'organism' && v.drawn !== 'light');
    const s = playG(startG(seed), [...toHaskett('Please dim your floodlights.'), ...waits(3)]);
    expect(s.flags.dimTried).toBe(true);
    expect(s.flags.endDormant).toBeFalsy();
  });
});

describe('crew refusals', () => {
  it('Dr. Osei refuses an uncontained sample aboard, and allows one sealed into isolation', () => {
    let s = playG(startG(3), ['bring a sample of the growth aboard']);
    expect(s.flags.orderedAboard).toBe(true);
    expect(s.flags.sampled).toBeFalsy();
    expect(logText(s)).toMatch(/Not into my ship/);
    s = playG(s, ['bring a sealed sample aboard into isolation']);
    expect(s.flags.sampled).toBe(true);
  });

  it('Dr. Osei refuses a team in ordinary suits, and allows one in barrier protection', () => {
    let s = playG(startG(3), ['send a team across to take a sample']);
    expect(s.flags.orderedUnprotected).toBe(true);
    s = playG(s, ['send a team in full barrier protection to take a sample']);
    expect(s.flags.sampled).toBe(true);
  });

  it('Rask warns before burning anything not proven harmless; only a repeated order burns it', () => {
    const seed = seedWhere((v) => v.nature !== 'stone');
    let s = playG(startG(seed), ['Rask, burn the growth']);
    expect(s.flags.endBurned).toBeFalsy();
    s = playG(s, ['burn the growth']);
    expect(s.flags.endBurned).toBe(true);
  });

  it('Rask burns a proven stone growth without argument', () => {
    const seed = seedWhere((v) => v.nature === 'stone');
    let s = playG(startG(seed), ['Varga, study the growth', 'send a probe to take a sample']);
    s = until(s, (x) => knows(x, 'alive'));
    s = untilEnd(playG(s, ['Rask, burn the growth']));
    expect(s.outcome?.id).toBe('proven-stone');
  });
});

describe('the careful captain', () => {
  it('succeeds on every seed in a sweep, by more than one road', () => {
    const seen = new Set<string>();
    for (let i = 200; i < 260; i++) {
      const s = careful(i);
      expect(SUCCESS, `seed ${i}`).toContain(s.outcome?.id);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('doing nothing never succeeds', () => {
    for (let i = 1; i <= 30; i++) expect(SUCCESS).not.toContain(untilEnd(startG(i)).outcome?.id);
  });
});

describe('fuzz: random orders keep the world valid', () => {
  const POOL = [
    'wait', 'hail the tender', 'close the channel', 'hail the station', 'Varga, study the growth', 'send a probe to take a sample',
    'bring a sample aboard', 'send a team across', HOLD_LINE, PROMISE_LINE, ALIVE_LINE, SPORE_LINE, STONE_LINE, GAP_LINE,
    'Go ahead, burn it.', 'Rask, burn the growth', 'Chief, lay a heat lure', 'Chief, lay a metal lure', 'Chief, lay a light lure',
    'Chief, run cold', 'pull us back', 'Please dim your floodlights.', 'How does it reach your claims?', 'is it alive?',
    'what is it drawn to?', 'what would burning it do?', 'raise shields', 'fire on the Hobnail', 'status report', 'what are my options?',
    'Marrow, what do you recommend?', 'scan the tender', 'Helm, all stop',
  ];
  it('40 random games: invariants hold, every game ends, no names leak, and the bridge never says the Agency', () => {
    const seen = new Set<string>();
    for (let g = 0; g < 40; g++) {
      const rng = createRng(10000 + g);
      let s: WorldState = startG(g + 100);
      for (let t = 0; t < 30 && !s.outcome; t++) {
        const prev = s;
        s = submit(GARDENER_SIM, s, rng.pick(POOL));
        expect(checkInvariants(s)).toEqual([]);
        expect(s.turn).toBeGreaterThanOrEqual(prev.turn);
      }
      s = untilEnd(s);
      expect(ALL).toContain(s.outcome?.id);
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});
