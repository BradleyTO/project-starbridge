/** Training Simulation 014 — scripted playthroughs reaching every ending, plus a seed sweep. */
import { describe, expect, it } from 'vitest';
import { STARFALL_ENDINGS, computeObjectives } from '../../src/scenarios/starfall/outcome';
import type { WorldState } from '../../src/engine/types';
import {
  LEAK, STAR_SIM, TELL_SCOOP, blind, careful, carefulWatch, cutAndTow, fromTheChair, logText, playS, seedWhere, starfall, startS, toKemble, untilEnd,
} from './helpers';

const SUCCESS = new Set<string>(STARFALL_ENDINGS.success);
const ALL = [...STARFALL_ENDINGS.success, ...STARFALL_ENDINGS.partial, ...STARFALL_ENDINGS.failure] as string[];
const end = (s: WorldState) => s.outcome?.id;
const tail = (s: WorldState) => logText(s).slice(-1800);
const reached = new Set<string>();
const note = (s: WorldState) => {
  if (s.outcome) reached.add(s.outcome.id);
  expect(logText(s)).not.toMatch(LEAK);
  return s;
};
const firstSeed = (f: (seed: number) => boolean, limit = 400) => {
  for (let i = 1; i <= limit; i++) if (f(i)) return i;
  throw new Error('no seed');
};

describe('success endings', () => {
  it("ensigns-line: the helm handed to Adeyemi, his read asked for, his own line flown, inside the Chief's limit", () => {
    const s = note(careful(seedWhere((v) => v.storm === 'shear' && v.count === 'defensive')));
    expect(end(s), tail(s)).toBe('ensigns-line');
    expect(s.flags.flewLine).toBe(true);
    expect(s.flags.delegated).toBe(true);
    expect(s.flags.crossedInformed || s.flags.crossedBlind).toBeFalsy();
    expect(computeObjectives(s, true).every((o) => o.status === 'complete')).toBe(true);
  });

  it('every-soul: by the book, with the senior pilot, in a squall the book can handle', () => {
    const seed = firstSeed((i) => starfall(STAR_SIM.create(i)).storm === 'squall' && careful(i, 'duarte').outcome?.id === 'every-soul');
    const s = note(careful(seed, 'duarte'));
    expect(end(s), tail(s)).toBe('every-soul');
    expect(s.flags.flewLine).toBeFalsy();
    expect(s.flags.duarteFlew).toBe(true);
  });

  it('under-tow: the scoop works cut away (with a reason the Factor can give the company), and the habitat towed out whole', () => {
    const seed = seedWhere((v) => v.agent === 'company' && v.count === 'defensive');
    const s = note(cutAndTow(seed));
    expect(end(s), tail(s)).toBe('under-tow');
    expect(s.flags.cutLoose).toBe(true);
    expect(s.flags.confessedAtCut).toBe(true);
    expect(s.counters.deadCiv ?? 0).toBe(0);
  });
});

describe('partial endings', () => {
  it("scarred: everyone lives, but the hull goes past the Chief's limit", () => {
    const seed = firstSeed((i) => careful(i, 'plain').outcome?.id === 'scarred');
    const s = note(careful(seed, 'plain'));
    expect(end(s), tail(s)).toBe('scarred');
    expect(s.flags.crossedInformed).toBe(true);
    expect(s.counters.deadCiv ?? 0).toBe(0);
  });
});

describe('failure endings', () => {
  it('left-below: nobody goes down', () => {
    const s = note(untilEnd(startS(3)));
    expect(end(s), tail(s)).toBe('left-below');
    expect(s.flags.lostUpper).toBe(true);
  });

  it('uncounted: the count shows people in the scoop works, and nobody tells the habitat', () => {
    const seed = seedWhere((v) => v.count === 'defensive' && v.storm === 'squall');
    let s = playS(startS(seed), ['Chief, how much can the hull take?', 'Adeyemi, the helm is yours, fly it your way. Varga, count the life signs aboard the habitat. Take us down.']);
    for (let i = 0; i < 40 && !s.outcome; i++) s = playS(s, [s.flags.lineOffered && !s.flags.lineApproved ? 'Fly your line.' : 'wait']);
    note(s);
    expect(end(s), tail(s)).toBe('uncounted');
    expect(s.flags.countFound).toBe(true);
    expect(s.flags.leftHidden).toBe(true);
    expect(logText(s)).toMatch(/off the books/);
  });

  it('dragged-down: flying the ship from the chair, past the limit, until the frame gives', () => {
    const seed = firstSeed((i) => fromTheChair(i).outcome?.id === 'dragged-down');
    const s = note(fromTheChair(seed));
    expect(end(s), tail(s)).toBe('dragged-down');
    expect(s.counters.overrides ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('abandoned: the Halcyon leaves with people aboard the habitat', () => {
    const s = note(untilEnd(playS(startS(3), ['leave the system'])));
    expect(end(s), tail(s)).toBe('abandoned');
    expect(s.flags.endLeft).toBe(true);
  });

  it('shots-fired: weapons fire ends the exercise (fire on civilians is refused, so it is forced here)', () => {
    let s = startS(4);
    s = { ...s, flags: { ...s.flags, shotsFired: true } };
    s = note(playS(s, ['wait']));
    expect(end(s)).toBe('shots-fired');
  });

  it('firing on the yacht is refused by tactical', () => {
    const s = playS(startS(7), ['fire on the Dividend']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/won't fire/);
  });

  it('every ending was reached', () => {
    for (const id of ALL) expect(reached.has(id), id).toBe(true);
  });
});

describe('the count and the Factor', () => {
  it("an ashamed Factor confesses when asked plainly; a defensive one denies it until he's shown the count", () => {
    const a = seedWhere((v) => v.count === 'ashamed');
    let s = playS(startS(a), toKemble('Is everyone aboard on your manifest?'));
    expect(s.flags.kembleOwned, tail(s)).toBe(true);
    expect(s.flags.scoopUp).toBe(true);
    const d = seedWhere((v) => v.count === 'defensive');
    s = playS(startS(d), toKemble('Is everyone aboard on your manifest?'));
    expect(s.flags.kembleLied, tail(s)).toBe(true);
    expect(s.flags.scoopUp).toBeFalsy();
  });

  it('Varga can only count heads at the ring; told what she found, the Factor brings them up', () => {
    const d = seedWhere((v) => v.count === 'defensive' && v.storm !== 'shear');
    let s = playS(startS(d), ['Varga, count the life signs aboard the habitat']);
    expect(s.flags.countKnown).toBeFalsy();
    expect(logText(s)).toMatch(/Not from up here/);
    s = playS(s, ['Adeyemi, the helm is yours, fly it your way. Take us down.']);
    for (let i = 0; i < 8 && !s.flags.countFound; i++) s = playS(s, ['wait']);
    expect(s.flags.countFound, tail(s)).toBe(true);
    s = playS(s, toKemble(TELL_SCOOP));
    expect(s.flags.scoopUp, tail(s)).toBe(true);
    s = note(carefulWatch(s));
    expect(SUCCESS.has(end(s) ?? ''), tail(s)).toBe(true);
  });

  it("a pragmatic company agent hands over her payroll, and the count with it", () => {
    const seed = seedWhere((v) => v.agent === 'pragmatic' && v.hidden > 0);
    const s = playS(startS(seed), ['hail the yacht', 'How many people work aboard the habitat? Who is on your payroll?', 'close the channel']);
    expect(s.flags.payroll, tail(s)).toBe(true);
    expect(s.flags.countKnown).toBe(true);
  });
});

describe('seed sweep', () => {
  it('the careful captain succeeds on every one of 150 seeds, with no leaked names', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 150; seed++) {
      const s = careful(seed);
      expect(SUCCESS.has(end(s) ?? ''), `seed ${seed}: ${end(s)}\n${tail(s)}`).toBe(true);
      expect(logText(s)).not.toMatch(LEAK);
      tally[end(s)!] = (tally[end(s)!] ?? 0) + 1;
    }
    expect(Object.keys(tally).length).toBeGreaterThanOrEqual(1);
  });

  it('one fixed plan (the senior pilot, by the book, pressing on whenever people wait) on 80 seeds gives at least three endings, including a success', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 80; seed++) {
      const s = careful(seed, 'duarte');
      if (s.outcome) tally[s.outcome.id] = (tally[s.outcome.id] ?? 0) + 1;
    }
    expect(Object.keys(tally).length, JSON.stringify(tally)).toBeGreaterThanOrEqual(3);
    expect(Object.keys(tally).some((id) => SUCCESS.has(id)), JSON.stringify(tally)).toBe(true);
  });

  it('never asking the Chief, on 80 seeds, gives more than one ending', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 80; seed++) {
      const s = blind(seed);
      expect(s.outcome, `seed ${seed}`).toBeTruthy();
      tally[s.outcome!.id] = (tally[s.outcome!.id] ?? 0) + 1;
    }
    expect(Object.keys(tally).length, JSON.stringify(tally)).toBeGreaterThanOrEqual(3);
  });

  it('doing nothing on 60 seeds always fails', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = untilEnd(startS(seed), false);
      expect(s.outcome, `seed ${seed}`).toBeTruthy();
      expect(SUCCESS.has(s.outcome!.id), `seed ${seed}`).toBe(false);
    }
  });

  it('seeds vary every hidden dimension', () => {
    const seen: Record<string, Set<string>> = {};
    for (let seed = 1; seed <= 200; seed++) {
      const v = starfall(STAR_SIM.create(seed));
      for (const [k, x] of Object.entries(v)) (seen[k] ??= new Set()).add(String(x));
    }
    for (const k of ['storm', 'nerve', 'count', 'agent', 'sink', 'depth0', 'manifest', 'hidden', 'ring', 'tolerance']) expect(seen[k].size, k).toBeGreaterThanOrEqual(2);
    expect(seen.storm.size).toBe(3);
    expect(seen.nerve.size).toBe(3);
    expect(seen.count.size).toBe(3);
  });
});
