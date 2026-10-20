/**
 * End-to-end: the captain's order from user testing, played through the real
 * interpreter, kinematics and NPC agents. Interposing with shields down and a
 * declared non-hostile posture changes how Prefect Vane behaves compared with
 * an otherwise similar approach with shields raised.
 */
import { describe, expect, it } from 'vitest';
import { lastId, play, start, textSince } from '../helpers';
import { isBetween } from '../../src/engine/kinematics';
import { USER_ORDER } from './fixtures';

const SEED = 14; // pragmatic Prefect
const WAITS = (n: number) => Array(n).fill('wait');

describe('e2e: a peaceful interposition influences Vane', () => {
  it('the exact order plays out: lifecycle reports, Halcyon between the ships, Vane holds fire, rescue corridor', () => {
    const s0 = start(SEED);
    expect(s0.variant.temperament).toBe('pragmatic');
    let s = play(s0, [USER_ORDER]);
    let log = textSince(s, lastId(s0));
    expect(log).toMatch(/Plotting an interpose course between the Kestrel and the Ashen Covenant/);
    expect(log).toMatch(/Hailing both ships\. Putting them on screen/);
    expect(log).toMatch(/Underway\. Heading/);
    expect(log).not.toMatch(/didn't (follow|understand)/);
    const before = lastId(s);
    s = play(s, WAITS(3));
    log = textSince(s, before);
    expect(log).toMatch(/We're in position between them, Captain/);
    expect(log).toMatch(/between my guns and that freighter with your shields down/);
    expect(isBetween(s.ships.halcyon.position, s.ships.kestrel.position, s.ships.cruiser.position)).toBe(true);
    expect(s.characters.vane.memory.patience).toBeGreaterThanOrEqual(6);
    expect(s.characters.vane.memory.lockedOn ?? 0).toBe(0);
    s = play(s, ['evacuate the crew', 'tell the prefect this is a humanitarian rescue']);
    expect(s.outcome?.id).toBe('rescue-corridor');
  });

  it('control: approaching with shields up erodes his patience until he locks on', () => {
    const s = play(start(SEED), ['raise shields', 'approach the kestrel', 'hail them', ...WAITS(7)] /* v0.5: the hail costs 15 s, not a minute */);
    expect(s.characters.vane.memory.patience ?? 0).toBeLessThanOrEqual(0);
    expect(s.characters.vane.memory.lockedOn).toBe(1);
  });

  it('across 30 seeds, the peaceful interposition never draws fire in the first minutes; the shields-up approach often does', () => {
    let peacefulFired = 0;
    let controlFired = 0;
    let peacefulLocks = 0;
    let controlLocks = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const a = play(start(seed), [USER_ORDER, ...WAITS(6)]);
      const b = play(start(seed), ['raise shields', 'approach the kestrel', 'hail them', ...WAITS(7)] /* v0.5: the hail costs 15 s, not a minute */);
      peacefulFired += a.flags.cruiserFired ? 1 : 0;
      controlFired += b.flags.cruiserFired ? 1 : 0;
      peacefulLocks += a.characters.vane.memory.lockedOn ? 1 : 0;
      controlLocks += b.characters.vane.memory.lockedOn ? 1 : 0;
    }
    expect(peacefulFired).toBe(0);
    expect(controlFired).toBeGreaterThan(5);
    expect(peacefulLocks).toBeLessThan(controlLocks);
  });
});
