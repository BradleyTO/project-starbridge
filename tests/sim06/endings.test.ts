/** Training Simulation 006 — Ion Season: a scripted playthrough to every ending. */
import { afterAll, describe, expect, it } from 'vitest';
import type { WorldState } from '../../src/engine/types';
import { ION_ENDINGS } from '../../src/scenarios/ion/outcome';
import { adrift } from '../../src/scenarios/ion/agents';
import { ion } from '../../src/scenarios/ion/setup';
import { LEAK, calmOf, logText, playI, roughOf, seedWhere, startI, waits } from './helpers';

const reached = new Set<string>();
function ending(s: WorldState, id: string) {
  expect(s.outcome?.id, logText(s).slice(-2500)).toBe(id);
  expect(logText(s)).not.toMatch(LEAK);
  expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
  reached.add(id);
  return s;
}

/** A settled season, both masters fit, and a patient Teague. */
const PLAIN = seedWhere((v) => v.season === 'settled' && v.unfit === 'none' && v.patience === 5);
const SPATE = seedWhere((v) => v.season === 'spate' && v.unfit === 'none' && v.patience > v.lullAt + 1);
const UNFIT = seedWhere((v) => v.season === 'settled' && v.unfit === 'mule' && v.patience === 5);
const through = (_b: number, ch: string) => `take us through the ${ch} channel`;
const calmRun = (seed: number) => {
  const v = ion(startI(seed));
  return [0, 1, 2].map((b) => through(b, calmOf(v, b)));
};

describe('success endings', () => {
  it('clear-water: three calm channels, both haulers in company', () => {
    ending(playI(startI(PLAIN), calmRun(PLAIN)), 'clear-water');
  });

  it('the-lull: a spate in the Maw; hold at the edge until it goes slack, then go', () => {
    const v = ion(startI(SPATE));
    let s = playI(startI(SPATE), [through(0, calmOf(v, 0)), through(1, calmOf(v, 1))]);
    expect(s.flags.spateTold).toBe(true);
    s = playI(s, waits(v.lullAt));
    ending(playI(s, [through(2, calmOf(v, 2))]), 'the-lull');
  });

  it('steady-hand: the doctor hears the tremor, the master owns it, and his mate flies the Maw', () => {
    const v = ion(startI(UNFIT));
    const s = playI(startI(UNFIT), ['hail Captain Brack', 'Doctor, how does Brack sound?', 'Captain, are you fit to fly the Maw?', 'Will you hand the helm to your mate?', 'close the channel', ...[0, 1, 2].map((b) => through(b, calmOf(v, b)))]);
    expect(s.flags.foundUnfit && s.flags.steadyAtMaw).toBe(true);
    ending(s, 'steady-hand');
    expect(s.objectives.find((o) => o.id === 'fitness')?.status).toBe('complete');
  });

  it('weathered: everyone through, but one band the hard way', () => {
    const v = ion(startI(PLAIN));
    ending(playI(startI(PLAIN), [through(0, roughOf(v, 0)), through(1, calmOf(v, 1)), through(2, calmOf(v, 2))]), 'weathered');
  });

  it('weathered: dark hulls at the far edge, and their crews taken off before the air runs out', () => {
    const v = ion(startI(PLAIN));
    let s = playI(startI(PLAIN), [0, 1, 2].map((b) => through(b, roughOf(v, b))));
    if (!s.outcome) {
      expect(s.flags.anyAdrift).toBe(true);
      expect(s.outcome).toBeNull();
      s = playI(s, ['take the crew off']);
    }
    ending(s, 'weathered');
  });
});

describe('partial endings', () => {
  it('long-way-round: the captain turns the convoy back with every ship and crew', () => {
    const v = ion(startI(PLAIN));
    ending(playI(startI(PLAIN), [through(0, calmOf(v, 0)), 'Turn the convoy back.']), 'long-way-round');
  });

  it('crew-saved: a hauler goes dark at the edge, her crew is taken off, and the hull is left', () => {
    const v = ion(startI(PLAIN));
    let s = playI(startI(PLAIN), [through(0, roughOf(v, 0)), through(1, roughOf(v, 1))]);
    for (let i = 0; i < 10 && !['mule', 'gannet'].some((h) => adrift(s, h as 'mule')); i++) s = playI(s, ['wait']);
    expect(s.flags.anyAdrift, logText(s).slice(-1500)).toBe(true);
    s = playI(s, ['Take the crew off.']);
    expect(s.flags.tookCrewOff).toBe(true);
    s = playI(s, [through(2, calmOf(v, 2))]);
    // The other hauler, near the limit herself, may go dark on the way out: take that crew off too.
    if (!s.outcome) s = playI(s, ['Take the crew off.']);
    ending(s, 'crew-saved');
  });
});

describe('failure endings', () => {
  it('hauler-lost: the convoy comes out of the Maw with dark hulls behind, and nobody takes the crews off', () => {
    const v = ion(startI(PLAIN));
    ending(playI(startI(PLAIN), [...[0, 1, 2].map((b) => through(b, roughOf(v, b))), ...waits(6)]), 'hauler-lost');
  });

  it('dead-in-storm: shields over both haulers, every discharge through our own hull, then rough water', () => {
    const v = ion(startI(PLAIN));
    ending(playI(startI(PLAIN), ['spread our shields over the haulers', 'Chief, bleed the charge off the haulers', 'bleed the charge', 'bleed the charge', ...[0, 1, 2].map((b) => through(b, roughOf(v, b)))]), 'dead-in-storm');
  });

  it('left-in-storm: the XO checks once; told again, the Halcyon leaves the convoy behind', () => {
    let s = playI(startI(PLAIN), ['get us out of here']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/say it again/);
    s = playI(s, ['get us out of here', 'wait']);
    ending(s, 'left-in-storm');
  });

  it('held-in-season (backstop): half an hour at the edge, Teague in tow and the charge bled off', () => {
    const s = playI(startI(PLAIN), ["tractor beam on Gannet's Luck", ...waits(8), 'Chief, bleed the charge off the haulers', ...waits(8), 'bleed the charge', ...waits(8), 'bleed the charge', ...waits(10)]);
    ending(s, 'held-in-season');
  });
});

afterAll(() => {
  const all = [...ION_ENDINGS.success, ...ION_ENDINGS.partial, ...ION_ENDINGS.failure, ...ION_ENDINGS.backstop];
  for (const id of all) expect(reached.has(id), `ending ${id} reached by a scripted playthrough`).toBe(true);
});
