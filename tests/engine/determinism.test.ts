import { describe, expect, it } from 'vitest';
import { createRng, normaliseSeed } from '../../src/engine/rng';
import { K, play, start } from '../helpers';

const SCRIPT = [
  'scan the kestrel and hail the cruiser',
  'approach the kestrel',
  'tell the prefect this is a humanitarian rescue',
  'wait', // v0.5: messages cost seconds, not a minute; keeps the v0.4 timeline
  'wait',
  'lower shields and evacuate the crew',
  'raise shields and arm weapons',
  'lock on the cruiser',
  'fire torpedoes',
  'withdraw',
  'jump',
];

describe('seeded RNG', () => {
  it('reproduces the same sequence for the same seed', () => {
    const a = createRng(123);
    const b = createRng(123);
    const xs = Array.from({ length: 50 }, () => a.next());
    const ys = Array.from({ length: 50 }, () => b.next());
    expect(xs).toEqual(ys);
    xs.forEach((x) => expect(x).toBeGreaterThanOrEqual(0));
    xs.forEach((x) => expect(x).toBeLessThan(1));
  });
  it('differs between seeds and accepts string seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
    expect(normaliseSeed('kestrel')).toBe(normaliseSeed('kestrel'));
    expect(normaliseSeed('kestrel')).not.toBe(normaliseSeed('halcyon'));
  });
  it('int and pick stay in bounds', () => {
    const r = createRng(9);
    for (let i = 0; i < 200; i++) {
      const n = r.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      expect(['a', 'b']).toContain(r.pick(['a', 'b']));
    }
  });
});

describe('determinism', () => {
  it('same seed + same orders → identical world state and log', () => {
    for (const seed of [1, 42, 777, 'starbridge']) {
      const a = play(start(seed), SCRIPT, false);
      const b = play(start(seed), SCRIPT, false);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it('state survives a JSON round-trip mid-run and continues identically', () => {
    const half = play(start(99), SCRIPT.slice(0, 5), false);
    const copy = JSON.parse(JSON.stringify(half));
    const a = play(half, SCRIPT.slice(5), false);
    const b = play(copy, SCRIPT.slice(5), false);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('different seeds produce meaningfully different scenarios', () => {
    const variants = new Set<string>();
    const passengers = new Set<string>();
    const temperaments = new Set<string>();
    const complications = new Set<string>();
    const crews = new Set<number>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = K.create(seed);
      variants.add(JSON.stringify(s.variant));
      passengers.add(s.variant.passenger);
      temperaments.add(s.variant.temperament);
      complications.add(s.variant.complication);
      crews.add(s.ships.kestrel.souls);
    }
    expect(passengers.size).toBe(3);
    expect(temperaments.size).toBe(3);
    expect(complications.size).toBe(4);
    expect(crews.size).toBeGreaterThan(4);
    expect(variants.size).toBeGreaterThan(30);
  });

  it('the same orders lead to different outcomes across seeds', () => {
    const endings = new Set<string>();
    const logs = new Set<string>();
    for (let seed = 1; seed <= 25; seed++) {
      const s = play(start(seed), [...SCRIPT, 'wait', 'wait', 'jump'], false);
      endings.add(s.outcome?.id ?? `ongoing@${s.turn}`);
      logs.add(s.log.map((e) => e.text).join('|'));
    }
    expect(logs.size).toBeGreaterThan(20);
    expect(endings.size, [...endings].join(',')).toBeGreaterThan(1);
  });
});

describe('seed normalisation', () => {
  it('treats numeric strings (e.g. from ?seed=42) like numbers', () => {
    expect(normaliseSeed('42')).toBe(42);
    expect(JSON.stringify(K.create('42'))).toBe(JSON.stringify(K.create(42)));
  });
});
