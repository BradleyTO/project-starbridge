/**
 * v0.5 crew autonomy: Rask's refusals come from world conditions (civilian hull, life signs,
 * threat, surrender) — not from ship names — and "why?" is answered from the recorded reasons.
 */
import { describe, expect, it } from 'vitest';
import { act, lastId, play, start, textSince } from '../helpers';
import { assessFire } from '../../src/engine/roe';
import { patchShip } from '../../src/engine/state';
import type { WorldState } from '../../src/engine/types';

const SEED = 14;
const near = () => play(start(SEED), ['approach the kestrel', 'wait', 'wait', 'arm weapons']);
const lockedOn = (s: WorldState, id: 'kestrel' | 'cruiser') => s.ships.halcyon.weapons.state === 'locked' && s.ships.halcyon.weapons.target === id;

describe('rules of engagement', () => {
  it('Rask refuses to fire on the Kestrel with people aboard (preserved)', () => {
    const s0 = near();
    const at = lastId(s0);
    const s = play(s0, ['fire on the kestrel']);
    expect(textSince(s, at)).toMatch(/Rask: Captain, the Kestrel has \d+ people aboard\. I won't fire on her\./);
    expect(s.flags.shotsFired).toBeFalsy();
    expect(s.refusals?.at(-1)?.officer).toBe('tactical');
  });

  it('is not name-based: a renamed civilian freighter is refused the same way', () => {
    const s0 = { ...near() };
    const renamed = { ...s0, ships: { ...s0.ships, kestrel: { ...s0.ships.kestrel, name: 'Mariner' } } };
    const at = lastId(renamed);
    const s = play(renamed, ['lock on the kestrel']);
    expect(textSince(s, at)).toMatch(/the Mariner has \d+ people aboard/);
    expect(lockedOn(s, 'kestrel')).toBe(false);
  });

  it('applies to any ship that meets the conditions — a warship that has surrendered', () => {
    const s0 = near();
    expect(assessFire(s0, 'cruiser').refuse).toBe(false);
    const surrendered = { ...s0, flags: { ...s0.flags, cruiserSurrendered: true } };
    const v = assessFire(surrendered, 'cruiser');
    expect(v.refuse).toBe(true);
    expect(v.codes).toEqual(expect.arrayContaining(['surrendered', 'lifeSigns', 'noThreat']));
    const s = play(surrendered, ['lock on the cruiser']);
    expect(lockedOn(s, 'cruiser')).toBe(false);
  });

  it('a civilian hull of any name with no life signs aboard may be engaged', () => {
    const empty = patchShip(near(), 'kestrel', { souls: 0, disposition: 'evacuated' });
    // The passenger in stasis is still a life sign aboard.
    expect(assessFire(empty, 'kestrel').refuse).toBe(true);
    const s0 = { ...empty, characters: { ...empty.characters, passenger: { ...empty.characters.passenger, ship: 'halcyon' as const, status: 'active' as const } } };
    expect(assessFire(s0, 'kestrel').refuse).toBe(false);
    const s = play(s0, ['lock on the kestrel']);
    expect(lockedOn(s, 'kestrel')).toBe(true);
  });

  it('a civilian ship that has opened fire is a threat and may be engaged', () => {
    const s0 = near();
    const hostile = { ...s0, flags: { ...s0.flags, kestrelFired: true } };
    expect(assessFire(hostile, 'kestrel').refuse).toBe(false);
    expect(lockedOn(play(hostile, ['lock on the kestrel']), 'kestrel')).toBe(true);
  });

  it('a warning shot is not refused', () => {
    expect(assessFire(near(), 'kestrel', { warning: true }).refuse).toBe(false);
  });

  it('does not refuse the warship that is threatening the rescue', () => {
    const s = play(near(), ['lock on the cruiser']);
    expect(lockedOn(s, 'cruiser')).toBe(true);
  });
});

describe('"why?" is answered from the recorded reasons', () => {
  it('bare "why?" after a refusal, and "Rask, why did you refuse?"', () => {
    let s = play(near(), ['fire on the kestrel']);
    const reasons = s.refusals!.at(-1)!.reasons;
    expect(reasons.join(' ')).toMatch(/civilian/);
    expect(reasons.join(' ')).toMatch(/life signs/);
    let at = lastId(s);
    s = play(s, ['why?']);
    let log = textSince(s, at);
    expect(log).toMatch(/Rask: You ordered me to fire on the Kestrel\. I refused because .*civilian.*life signs.*rules of engagement/);
    at = lastId(s);
    s = play(s, ['Rask, why did you refuse?']);
    log = textSince(s, at);
    expect(log).toMatch(/Rask: You ordered me to fire on the Kestrel/);
  });

  it('the explanation follows the actual reasons (surrender, not civilian status)', () => {
    const s0 = near();
    let s = play({ ...s0, flags: { ...s0.flags, cruiserSurrendered: true } }, ['lock on the cruiser']);
    const at = lastId(s);
    s = play(s, ['why?']);
    const log = textSince(s, at);
    expect(log).toMatch(/has surrendered/);
    expect(log).not.toMatch(/civilian/);
  });

  it('with nothing refused, the question is answered honestly; "why" costs no time', () => {
    const s0 = start(SEED);
    const s = play(s0, ['why?']);
    expect(textSince(s, lastId(s0))).toMatch(/Nobody has refused an order/);
    expect(s.time).toBe(s0.time);
  });

  it('typed actions go through the same check (standing orders cannot bypass it)', () => {
    const s = act(near(), { type: 'weapons', mode: 'fire', target: 'kestrel', weapon: 'beams', warning: false } as never);
    expect(s.flags.shotsFired).toBeFalsy();
    expect(s.refusals?.length).toBe(1);
  });
});
