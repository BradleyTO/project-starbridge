import { describe, expect, it } from 'vitest';
import { validate } from '../../src/engine/validate';
import { ProposedActionSchema } from '../../src/engine/schema';
import type { ProposedActionInput } from '../../src/engine/schema';
import { patchShip, patchSystem, revealFact, setFlag } from '../../src/engine/state';
import { range } from '../../src/engine/rules';
import { checkInvariants } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { act, lastId, start, textSince } from '../helpers';

const P = (a: ProposedActionInput) => ProposedActionSchema.parse(a);
const v = (s: WorldState, a: ProposedActionInput) => validate(s, P(a));

/** Place the Halcyon a given distance from the Kestrel (same bearing as the start). */
function at(s: WorldState, km: number): WorldState {
  const k = s.ships.kestrel.position;
  const d = Math.hypot(k.x, k.y);
  return patchShip(s, 'halcyon', { position: { x: k.x - (k.x / d) * km, y: k.y - (k.y / d) * km } });
}

describe('schema', () => {
  it('fills defaults and rejects malformed actions', () => {
    expect(P({ type: 'power', to: 'shields' })).toMatchObject({ amount: 25 });
    expect(P({ type: 'weapons', mode: 'fire', target: 'cruiser' })).toMatchObject({ weapon: 'beams', warning: false });
    expect(ProposedActionSchema.safeParse({ type: 'teleportPlanet' }).success).toBe(false);
    expect(ProposedActionSchema.safeParse({ type: 'move', mode: 'range', rangeKm: -5 }).success).toBe(false);
    expect(ProposedActionSchema.safeParse({ type: 'power', to: 'shields', amount: 9999 }).success).toBe(false);
  });
});

describe('validator', () => {
  const s0 = start(42);

  it('rejects transport out of range or through shields', () => {
    expect(v(s0, { type: 'transport', payload: 'crew' }).status).toBe('rejected');
    const near = at(s0, 3000);
    expect(v(near, { type: 'transport', payload: 'crew' }).status).toBe('accepted');
    const shielded = patchShip(near, 'halcyon', { shields: { raised: true, strength: 100 } });
    expect(v(shielded, { type: 'transport', payload: 'crew' }).status).toBe('rejected');
  });

  it('refuses to fire on a crewed civilian ship', () => {
    const r = v(at(s0, 3000), { type: 'weapons', mode: 'fire', target: 'kestrel' });
    expect(r.status).toBe('rejected');
  });

  it('adjusts beams to torpedoes beyond beam range, and rejects beyond torpedo range', () => {
    const cruiserFar = s0;
    const d = range(cruiserFar, 'halcyon', 'cruiser');
    expect(d).toBeGreaterThan(120000);
    expect(v(cruiserFar, { type: 'weapons', mode: 'fire', target: 'cruiser' }).status).toBe('rejected');
    const mid = patchShip(s0, 'cruiser', { position: { x: 0, y: 80000 } });
    const r = v(mid, { type: 'weapons', mode: 'fire', target: 'cruiser' });
    expect(r.status).toBe('partial');
    expect(r.action).toMatchObject({ weapon: 'torpedoes' });
  });

  it('blocks systems that are destroyed', () => {
    const broken = patchSystem(at(s0, 3000), 'halcyon', 'transporter', { health: 0 });
    expect(v(broken, { type: 'transport', payload: 'crew' }).status).toBe('rejected');
    const noShields = patchSystem(s0, 'halcyon', 'shields', { health: 0 });
    expect(v(noShields, { type: 'shields', raise: true }).status).toBe('rejected');
    const noWeapons = patchSystem(s0, 'halcyon', 'weapons', { health: 0 });
    expect(v(noWeapons, { type: 'weapons', mode: 'arm' }).status).toBe('rejected');
    const noEngines = patchSystem(s0, 'halcyon', 'engines', { health: 0 });
    expect(v(noEngines, { type: 'move', mode: 'approach', target: 'kestrel' }).status).toBe('rejected');
  });

  it('turns an uncharged jump into a withdrawal', () => {
    const r = v(s0, { type: 'jump', mode: 'engage' });
    expect(r.status).toBe('partial');
    expect(r.action).toMatchObject({ mode: 'withdraw' });
  });

  it('clamps power transfers and refuses the reactor', () => {
    expect(v(s0, { type: 'power', to: 'reactor' }).status).toBe('rejected');
    const r = v(s0, { type: 'power', to: 'sensors', amount: 100 });
    expect(r.status).toBe('partial');
    expect(r.action).toMatchObject({ amount: 50 });
  });

  it('cannot act on hidden information', () => {
    expect(v(s0, { type: 'scan', target: 'compartment' }).status).toBe('rejected');
    expect(v(s0, { type: 'communicate', target: 'passenger', intent: 'open' }).status).toBe('rejected');
    expect(v(s0, { type: 'communicate', target: 'cruiser', intent: 'trade', offer: 'passenger' }).status).toBe('rejected');
    expect(v(at(s0, 3000), { type: 'transport', payload: 'passenger' }).status).toBe('rejected');
  });

  it('compartment transport needs the shield codes (or Arden\'s trust)', () => {
    let s = revealFact(at(s0, 3000), 'compartment_exists');
    expect(v(s, { type: 'transport', payload: 'passenger' }).status).toBe('rejected');
    s = setFlag(s, 'compartmentOpen');
    expect(v(s, { type: 'transport', payload: 'passenger' }).status).toBe('accepted');
  });

  it('rejects everything once the simulation has ended', () => {
    const ended = { ...s0, outcome: { id: 'x', title: 'X', summary: 'x', success: false } };
    expect(v(ended, { type: 'wait' }).status).toBe('rejected');
  });
});

describe('reducer (via processOrders)', () => {
  it('free actions do not advance time; time-costing ones advance exactly one turn per order', () => {
    const s0 = start(42);
    const a = act(s0, { type: 'shields', raise: true }, { type: 'power', to: 'shields', from: 'tractor', amount: 25 });
    expect(a.turn).toBe(s0.turn);
    expect(a.ships.halcyon.shields.raised).toBe(true);
    expect(a.ships.halcyon.systems.shields.power).toBe(125);
    expect(a.ships.halcyon.systems.tractor.power).toBe(75);
    const b = act(a, { type: 'scan', target: 'kestrel' }, { type: 'scan', target: 'cruiser' });
    expect(b.turn).toBe(s0.turn + 1);
  });

  it('a helm order persists across turns until arrival', () => {
    let s = act(start(42), { type: 'move', mode: 'approach', target: 'kestrel' });
    const d1 = range(s, 'halcyon', 'kestrel');
    s = act(s, { type: 'wait' });
    expect(range(s, 'halcyon', 'kestrel')).toBeLessThan(d1);
    for (let i = 0; i < 4; i++) s = act(s, { type: 'wait' });
    expect(range(s, 'halcyon', 'kestrel')).toBeLessThanOrEqual(1600);
    expect(s.orders.helm).toBeNull();
  });

  it('evacuation empties the Kestrel and marks it evacuated (not distressed)', () => {
    let s = at(start(42), 2000);
    s = act(s, { type: 'transport', payload: 'crew' });
    const k = s.ships.kestrel;
    if (k.souls > 0) s = act(s, { type: 'transport', payload: 'crew' });
    expect(s.ships.kestrel.souls).toBe(0);
    expect(s.ships.kestrel.disposition).toBe('evacuated');
    expect(s.characters.arden.ship).toBe('halcyon');
    expect(s.counters.rescued).toBeGreaterThan(0);
    expect(checkInvariants(s)).toEqual([]);
  });

  it('power reallocation never produces values outside 0–150', () => {
    let s = start(42);
    for (let i = 0; i < 8; i++) s = act(s, { type: 'power', to: 'shields', from: 'jumpDrive', amount: 50 });
    expect(s.ships.halcyon.systems.shields.power).toBeLessThanOrEqual(150);
    expect(s.ships.halcyon.systems.jumpDrive.power).toBeGreaterThanOrEqual(0);
    expect(checkInvariants(s)).toEqual([]);
  });

  it('logs rejection reasons in character instead of changing state', () => {
    const s0 = start(42);
    const from = lastId(s0);
    const s = act(s0, { type: 'transport', payload: 'crew' });
    expect(s.ships.kestrel.souls).toBe(s0.ships.kestrel.souls);
    expect(s.turn).toBe(s0.turn);
    expect(textSince(s, from)).toMatch(/transporters reach/i);
  });

  it('unconventional: ejecting the Kestrel core can stabilise it (or fail plausibly)', () => {
    const outcomes = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      let s = at(start(seed), 2000);
      s = act(s, { type: 'improvise', method: 'ejectCore', target: 'kestrel', description: 'eject the core' });
      outcomes.add(s.flags.kestrelStable ? 'stable' : 'failed');
      expect(checkInvariants(s)).toEqual([]);
    }
    expect(outcomes.has('stable')).toBe(true);
  });

  it('unconventional: an impossible improvisation changes nothing but costs a turn', () => {
    const s0 = start(42);
    const s = act(s0, { type: 'improvise', method: 'other', description: 'sing to the cruiser' });
    expect(s.turn).toBe(s0.turn + 1);
    expect(s.ships.halcyon.position).toEqual(s0.ships.halcyon.position);
    expect(textSince(s, lastId(s0))).toMatch(/can't find a way|unorthodox/i);
  });
});
