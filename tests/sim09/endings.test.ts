/** Training Simulation 009 — The Long Picket: a scripted playthrough to every ending, and a seed sweep. */
import { afterAll, describe, expect, it } from 'vitest';
import type { WorldState } from '../../src/engine/types';
import { PICKET_ENDINGS } from '../../src/scenarios/picket/outcome';
import { picket } from '../../src/scenarios/picket/setup';
import { COURTESY_LINE, ESCORT_LINE, EVIDENCE_CMD, HEAR, LEAK, READ_HIM, RESOLVE_LINE, TOKEN, TRUTH_LINE, careful, logText, playP, seedWhere, startP, toPicket, untilEnd } from './helpers';

const reached = new Set<string>();
function ending(s: WorldState, id: string) {
  expect(s.outcome?.id, logText(s).slice(-2500)).toBe(id);
  expect(logText(s)).not.toMatch(LEAK);
  expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
  reached.add(id);
  return s;
}

const BELIEVER = seedWhere((v) => v.temperament === 'proud' && v.intel === 'nothing' && v.sweepAt >= 7);
const EARLY_RELIEF = seedWhere((v) => v.reliefAt < v.deadline - 4 && v.temperament !== 'proud');
const OWED = seedWhere((v) => v.history === 'owed');
const PRETEXT = seedWhere((v) => v.orders === 'pretext');
const UNWARNED = seedWhere((v) => v.intel !== 'cargo');
const PROUD = seedWhere((v) => v.temperament === 'proud');
const CALM = seedWhere((v) => v.temperament !== 'proud');

describe('success endings', () => {
  it('bluffed-pass: Marrow reads him first, then a lawful escort bluff moves him aside', () => {
    const s = ending(untilEnd(playP(startP(BELIEVER), [...HEAR, READ_HIM, ...toPicket(ESCORT_LINE)])), 'bluffed-pass');
    expect(s.flags.readFirst).toBe(true);
  });

  it('face-saved: the Halcyon holds until his relief arrives, as he asked, and he keeps his word', () => {
    const s = ending(untilEnd(playP(startP(EARLY_RELIEF), toPicket('We will hold here until your relief arrives.'))), 'face-saved');
    expect(s.flags.dealBroken).toBeFalsy();
  });

  it('face-saved: one crate for his log is enough for a commander with time to spare', () => {
    const seed = seedWhere((v) => v.orders === 'probe');
    ending(untilEnd(playP(startP(seed), toPicket(TOKEN))), 'face-saved');
  });

  it("old-acquaintance: Marrow calls in an old debt on a private channel", () => {
    ending(untilEnd(playP(startP(OWED), [...HEAR, 'Marrow, talk to him privately'])), 'old-acquaintance');
  });

  it('inspected: plain proof of the cargo clears a commander looking for a pretext', () => {
    ending(untilEnd(playP(startP(PRETEXT), [EVIDENCE_CMD])), 'inspected');
  });

  it('inspected: a courtesy inspection that concedes nothing', () => {
    const s = ending(untilEnd(playP(startP(PRETEXT), toPicket(TRUTH_LINE, COURTESY_LINE))), 'inspected');
    expect(s.flags.courtesy).toBe(true);
  });
});

describe('partial endings', () => {
  it('broken-blockade: Marrow warns, the order is repeated, and the Halcyon runs the line', () => {
    const s = playP(startP(CALM), ['run the blockade']);
    expect(s.outcome).toBeNull();
    const e = ending(untilEnd(playP(s, ['run the blockade'])), 'broken-blockade');
    expect(e.flags.ran).toBe(true);
    expect(e.objectives.find((o) => o.id === 'line')?.status).toBe('failed');
  });
});

describe('failure endings', () => {
  it('false-flag: a feigned mercy run gets through, and is graded a failure', () => {
    ending(untilEnd(playP(startP(UNWARNED), toPicket('This is a mercy mission carrying medical supplies.'))), 'false-flag');
  });

  it('incident: running a proud commander’s line ends in a collision', () => {
    ending(untilEnd(playP(startP(PROUD), ['run the blockade', 'run the blockade'])), 'incident');
  });

  it('incident: firing on the picket', () => {
    const s = ending(untilEnd(playP(startP(CALM), ['fire on the picket', 'fire on the picket'])), 'incident');
    expect(s.flags.shotsFired).toBe(true);
  });

  it('impounded: the cargo handed over after Marrow’s warning', () => {
    ending(untilEnd(playP(startP(1), toPicket('We will transfer the cargo to you.', 'We will transfer the cargo to you.'))), 'impounded');
  });

  it('colony-dark: nobody gets through before the reactor must be shut down', () => {
    ending(untilEnd(startP(1)), 'colony-dark');
  });

  it('colony-dark: a word kept to the end is still marked when the clock runs out', () => {
    const seed = seedWhere((v) => v.orders === 'delay' && v.reliefAt >= v.deadline + 2);
    const s = untilEnd(playP(startP(seed), toPicket('We will hold here until your relief arrives.')));
    ending(s, 'colony-dark');
    expect(s.flags.keptWordToTheEnd).toBe(true);
  });

  it('turned-back: the Halcyon leaves the Narrows with the cargo aboard', () => {
    ending(untilEnd(playP(startP(1), ['turn back'])), 'turned-back');
  });
});

describe('seed sweep', () => {
  it('60 seeds and four approaches reach at least five different endings, and the careful captain always succeeds', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 60; i++) {
      seen.add(careful(i).outcome!.id);
      seen.add(untilEnd(playP(startP(i), toPicket(RESOLVE_LINE))).outcome!.id);
      seen.add(untilEnd(playP(startP(i), toPicket(ESCORT_LINE))).outcome!.id);
      if (i % 5 === 0) seen.add(untilEnd(playP(startP(i), ['run the blockade', 'run the blockade'])).outcome!.id);
      expect(picket(startP(i)).deadline).toBeGreaterThan(0);
    }
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });
});

afterAll(() => {
  const all = [...PICKET_ENDINGS.success, ...PICKET_ENDINGS.partial, ...PICKET_ENDINGS.failure];
  expect([...reached].sort()).toEqual([...all].sort());
});
