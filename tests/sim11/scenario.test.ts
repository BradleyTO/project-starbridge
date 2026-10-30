/**
 * Training Simulation 011 — Coldwater: setup, seed variation, hidden information, NPC goals,
 * officer expertise, crew refusals, and fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import { knows } from '../../src/engine/state';
import type { WorldState } from '../../src/engine/types';
import { coldwater } from '../../src/scenarios/coldwater/setup';
import { COLDWATER_ENDINGS } from '../../src/scenarios/coldwater/outcome';
import { ACK_LINE, COLDWATER_SIM, DOWN, INSPECT, LEAK, RECORD, careful, logText, playC, seedWhere, startC, until, untilEnd } from './helpers';

const ALL = [...COLDWATER_ENDINGS.success, ...COLDWATER_ENDINGS.partial, ...COLDWATER_ENDINGS.failure] as string[];
const flagOrCount = (s: WorldState, k: string) => !!s.flags[k] || (s.counters[k] ?? 0) > 0;

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = COLDWATER_SIM.create(42);
    expect(a).toEqual(COLDWATER_SIM.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('coldwater');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe('Coldwater Station');
    expect(a.ships.cruiser.name).toBe('ISV Plumb Line');
  });

  it('the intro plays and leaves five objectives with the exercise objective labelled', () => {
    const s = startC(1);
    expect(s.outcome).toBeNull();
    expect(s.objectives.map((o) => o.id).sort()).toEqual(['crew', 'safe', 'station', 'truth', 'word']);
    expect(s.objectives.find((o) => o.id === 'truth')?.text).toMatch(/^Exercise objective:/);
    expect(logText(s)).toMatch(/B watch has stopped work/);
    expect(logText(s)).not.toMatch(LEAK);
  });

  it('seeds vary the falsifier, method, valve, temper, lean, signature and clocks, within their ranges', () => {
    const vs = Array.from({ length: 160 }, (_, i) => coldwater(COLDWATER_SIM.create(i + 1)));
    for (const k of ['falsifier', 'method', 'sister', 'lean', 'chiefSigned'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(2);
    expect(new Set(vs.map((v) => v.temper)).size).toBe(3);
    for (const v of vs) {
      expect(v.stationAt).toBeGreaterThanOrEqual(20);
      expect(v.stationAt).toBeLessThanOrEqual(26);
      expect(v.lockAt).toBeGreaterThanOrEqual(6);
      expect(v.lockAt).toBeLessThanOrEqual(9);
    }
  });
});

describe('hidden information and officer expertise', () => {
  it('nothing about the log or the sister valve is known at the start; the Chief finds them out', () => {
    let s = startC(9);
    expect(knows(s, 'record')).toBe(false);
    expect(knows(s, 'sister')).toBe(false);
    s = playC(s, [RECORD, INSPECT]);
    s = until(s, (x) => knows(x, 'record') && knows(x, 'sister'));
    expect(knows(s, 'record')).toBe(true);
    expect(knows(s, 'sister')).toBe(true);
  });

  it('the same careful play reaches a success on many seeds', () => {
    const ok = Array.from({ length: 30 }, (_, i) => careful(i + 1).outcome?.id);
    for (const id of ok) expect(ALL).toContain(id);
    expect(ok.filter((id) => (COLDWATER_ENDINGS.success as readonly string[]).includes(id!)).length).toBeGreaterThanOrEqual(20);
  });
});

describe('NPC goals and crew refusals', () => {
  it('the station director calls on her own', () => {
    expect(logText(playC(startC(2), ['wait', 'wait']))).toMatch(/Toller/);
  });

  it('a hothead watch locks the plant if nobody goes down to them', () => {
    const seed = seedWhere((v) => v.temper === 'hothead');
    const v = coldwater(COLDWATER_SIM.create(seed));
    const s = until(startC(seed), (x) => !!x.flags.lockedOut, v.lockAt + 2);
    expect(s.flags.lockedOut).toBe(true);
  });

  it('Rask questions an order to remove the strikers by force before carrying it out', () => {
    const s = playC(startC(3), ['Rask, have security remove the strikers']);
    expect(flagOrCount(s, 'forceWarned')).toBe(true);
    expect(s.flags.forced).toBeFalsy();
  });

  it('the Chief warns before restarting with the sister valve unchecked', () => {
    const seed = seedWhere((v) => v.lean === 'chain');
    const s = playC(startC(seed), ['Chief, restart the reactor with A watch']);
    expect(flagOrCount(s, 'restartWarned')).toBe(true);
    expect(s.flags.restartUninspected).toBeFalsy();
  });

  it('Rask refuses to fire on the station or the courier, so the Shots Fired ending stays a guard', () => {
    const s = playC(startC(3), ['raise shields', 'fire on the Plumb Line', 'fire on the Plumb Line', 'fire on the station']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/I won't fire on it/);
  });

  it('going down and acknowledging the loss is recorded as in person', () => {
    expect(playC(startC(4), [DOWN, ACK_LINE]).flags.ackInPerson).toBe(true);
  });
});

describe('fuzz: random orders keep the world valid', () => {
  const POOL = [
    'wait', 'status report', 'what are my options?', 'Marrow, what do you recommend?', RECORD, INSPECT, DOWN, ACK_LINE,
    'Doctor, what killed him?', 'question Penhale', 'question Corley', 'relieve Penhale pending review', 'relieve Corley pending review',
    'Chief, restart the reactor', 'Chief, restart the reactor with A watch', 'Rask, have security remove the strikers',
    "Tell Tennant that's an order, and she'll face a court martial.", 'There was no cover-up.', 'Penhale falsified the log.',
    'hail the inspector', 'We need an independent review of a death aboard. The log may have been falsified.', 'close the channel',
    'hail the station', 'We will have your power back soon.', "Adeyemi, bring the station's people up by shuttle",
    'No charges for the strike, and the sister valve is inspected before anyone goes back in.', 'raise shields', 'Helm, all stop',
  ];
  it('40 random games: invariants hold, every game ends, no names leak, and nobody says the Agency', () => {
    const seen = new Set<string>();
    for (let g = 0; g < 40; g++) {
      const rng = createRng(11000 + g);
      let s: WorldState = startC(g + 200);
      for (let t = 0; t < 30 && !s.outcome; t++) {
        const prev = s;
        s = submit(COLDWATER_SIM, s, rng.pick(POOL));
        expect(checkInvariants(s)).toEqual([]);
        expect(s.turn).toBeGreaterThanOrEqual(prev.turn);
      }
      s = untilEnd(s);
      expect(ALL).toContain(s.outcome?.id);
      const leak = logText(s).match(LEAK);
      expect(leak ? logText(s).slice(Math.max(0, leak.index! - 200), leak.index! + 60) : null).toBeNull();
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});
