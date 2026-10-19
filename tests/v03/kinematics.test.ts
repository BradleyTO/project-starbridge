/**
 * v0.3 spatial simulation: 2D kinematics, guidance behaviours for every
 * spatial intent, order lifecycle, time passing in sub-steps while NPCs react,
 * physical limits and determinism.
 */
import { describe, expect, it } from 'vitest';
import { act, lastId, play, start, textSince } from '../helpers';
import { range, bearingFrom, distance } from '../../src/engine/rules';
import { patchShip, patchSystem } from '../../src/engine/state';
import { destroyShip } from '../../src/engine/combat';
import { angleDiff, effectivePerf, guidanceFor, headingVec, isBetween, len, stepShip } from '../../src/engine/kinematics';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { ProposedActionInput } from '../../src/engine/schema';
import type { WorldState } from '../../src/engine/types';
import { USER_ORDER } from './fixtures';

const M = (intent: string, extra: Record<string, unknown> = {}) => ({ type: 'maneuver', intent, ...extra }) as ProposedActionInput;
const speed = (s: WorldState, id: 'halcyon' | 'cruiser' = 'halcyon') => len(s.ships[id].velocity);
const helmOrders = (s: WorldState) => s.orders.list.filter((o) => o.dept === 'helm' && !o.label.startsWith('Charge'));
const lastHelm = (s: WorldState) => helmOrders(s).at(-1)!;
function waitTurns(s: WorldState, n: number, each?: (s: WorldState, prev: WorldState) => void): WorldState {
  for (let i = 0; i < n && !s.outcome; i++) {
    const prev = s;
    s = act(s, { type: 'wait' });
    expect(checkInvariants(s)).toEqual([]);
    expect(checkTransition(prev, s)).toEqual([]);
    each?.(s, prev);
  }
  return s;
}

describe('guidance behaviours (every spatial intent)', () => {
  it('interpose: ends up on the line between the Kestrel and the cruiser and stays there as the cruiser moves', () => {
    let s = act(start(7), M('interpose', { target: 'kestrel', second: 'cruiser' }));
    s = waitTurns(s, 3);
    expect(isBetween(s.ships.halcyon.position, s.ships.kestrel.position, s.ships.cruiser.position)).toBe(true);
    expect(s.flags.interposing).toBe(true);
    const cruiserBefore = s.ships.cruiser.position;
    s = waitTurns(s, 2);
    expect(distance(cruiserBefore, s.ships.cruiser.position)).toBeGreaterThan(10000); // the cruiser kept moving…
    expect(isBetween(s.ships.halcyon.position, s.ships.kestrel.position, s.ships.cruiser.position)).toBe(true); // …and we kept station on the line
    expect(lastHelm(s)).toMatchObject({ status: 'completed', maintaining: true });
  });

  it('approach: closes to the default standoff and matches the target', () => {
    let s = act(start(7), M('approach', { target: 'kestrel' }));
    s = waitTurns(s, 3);
    expect(range(s, 'halcyon', 'kestrel')).toBeLessThan(2200);
    expect(speed(s)).toBeLessThan(20);
  });

  it('approach with an explicit range holds that range', () => {
    let s = act(start(7), M('approach', { target: 'kestrel', rangeKm: 12000 }));
    s = waitTurns(s, 3);
    expect(Math.abs(range(s, 'halcyon', 'kestrel') - 12000)).toBeLessThan(800);
  });

  it('standoff: holds 45,000 km from the cruiser even as she closes', () => {
    let s = act(start(7), M('standoff', { target: 'cruiser', rangeKm: 45000 }));
    s = waitTurns(s, 7);
    expect(Math.abs(range(s, 'halcyon', 'cruiser') - 45000)).toBeLessThan(3000);
  });

  it('intercept: leads the target and closes to within a few thousand km', () => {
    let s = act(start(7), M('intercept', { target: 'cruiser' }));
    let closest = Infinity;
    s = waitTurns(s, 5, (x) => (closest = Math.min(closest, range(x, 'halcyon', 'cruiser'))));
    expect(closest).toBeLessThan(5000);
    expect(helmOrders(s).some((o) => o.status === 'completed')).toBe(true);
  });

  it('follow: falls in behind the target at the requested distance', () => {
    let s = act(start(7), M('follow', { target: 'cruiser', rangeKm: 20000 }));
    s = waitTurns(s, 6);
    expect(Math.abs(range(s, 'halcyon', 'cruiser') - 20000)).toBeLessThan(3000);
  });

  it('escort: takes station alongside the Kestrel', () => {
    let s = act(start(7), M('escort', { target: 'kestrel' }));
    s = waitTurns(s, 3);
    expect(Math.abs(range(s, 'halcyon', 'kestrel') - 3000)).toBeLessThan(700);
    expect(lastHelm(s)).toMatchObject({ status: 'completed', maintaining: true });
  });

  it('block: gets ahead of the cruiser on her line of travel', () => {
    let s = act(start(7), M('block', { target: 'cruiser' }));
    s = waitTurns(s, 6);
    expect(lastHelm(s).status).toBe('completed');
  });

  it('retreat: opens the range from the threat every turn', () => {
    let s = act(start(7), M('retreat', { target: 'cruiser' }));
    let d = range(s, 'halcyon', 'cruiser');
    // The cruiser is closing on the Kestrel, so measure our own motion away from her.
    s = waitTurns(s, 3, (x, prev) => {
      const away = distance(x.ships.halcyon.position, prev.ships.cruiser.position) - distance(prev.ships.halcyon.position, prev.ships.cruiser.position);
      expect(away).toBeGreaterThan(10000);
      d = range(x, 'halcyon', 'cruiser');
    });
    expect(d).toBeGreaterThan(0);
  });

  it('flee: runs for the Concord border and crossing it ends the run as leaving the Reach', () => {
    let s = act(start(9), { type: 'transport', payload: 'crew' });
    s = act(s, M('flee'));
    const y0 = s.ships.halcyon.position.y;
    s = waitTurns(s, 12);
    expect(s.ships.halcyon.position.y).toBeLessThan(y0);
    expect(s.flags.leftReach || s.outcome).toBeTruthy();
  });

  it('orbit: circles the Kestrel at the requested radius', () => {
    let s = act(start(7), M('orbit', { target: 'kestrel', rangeKm: 3000 }));
    s = waitTurns(s, 3);
    const b1 = bearingFrom(s.ships.kestrel.position, s.ships.halcyon.position);
    s = waitTurns(s, 1);
    const b2 = bearingFrom(s.ships.kestrel.position, s.ships.halcyon.position);
    expect(Math.abs(range(s, 'halcyon', 'kestrel') - 3000)).toBeLessThan(500);
    expect(Math.abs(angleDiff(b1, b2))).toBeGreaterThan(20);
  });

  it('holdStation on a target keeps the offset; all stop brings us to rest', () => {
    let s = act(start(7), M('approach', { target: 'kestrel', rangeKm: 10000 }));
    s = act(s, M('allStop'));
    s = waitTurns(s, 2);
    expect(speed(s)).toBeLessThan(1);
    const off = { x: s.ships.halcyon.position.x - s.ships.kestrel.position.x, y: s.ships.halcyon.position.y - s.ships.kestrel.position.y };
    s = act(s, M('holdStation', { target: 'kestrel' }));
    s = waitTurns(s, 2);
    expect(distance(s.ships.halcyon.position, { x: s.ships.kestrel.position.x + off.x, y: s.ships.kestrel.position.y + off.y })).toBeLessThan(700);
  });

  it('face: comes about to point the bow at the cruiser', () => {
    let s = act(start(7), M('face', { target: 'cruiser' }));
    s = waitTurns(s, 1);
    expect(Math.abs(angleDiff(s.ships.halcyon.heading, bearingFrom(s.ships.halcyon.position, s.ships.cruiser.position)))).toBeLessThan(5);
  });

  it('evasive: marks the ship as manoeuvring evasively for combat', () => {
    const s = act(start(7), M('evasive'));
    expect(s.counters.evasive_halcyon).toBeGreaterThanOrEqual(s.turn);
  });

  it('no coordinates needed, but explicit numbers work', () => {
    const s = play(start(7), ['take us to 8,000 km of the kestrel', 'wait', 'wait', 'wait']);
    expect(Math.abs(range(s, 'halcyon', 'kestrel') - 8000)).toBeLessThan(800);
  });
});

describe('order lifecycle', () => {
  it('acknowledged → underway → completed, each reported in character with an ETA', () => {
    const s0 = start(7);
    let s = play(s0, ['put us between the two ships']);
    const t = textSince(s, lastId(s0));
    expect(t).toMatch(/Adeyemi: Aye, Captain\. Plotting an interpose course between the Kestrel and the .+ ETA about \d/);
    expect(t).toMatch(/Underway\. Heading \d{3}/);
    expect(lastHelm(s).status).toBe('underway');
    expect(lastHelm(s).etaSeconds).toBeGreaterThan(0);
    const before = lastId(s);
    s = play(s, ['wait', 'wait', 'wait']);
    expect(textSince(s, before)).toMatch(/We're in position between them, Captain/);
    expect(lastHelm(s)).toMatchObject({ status: 'completed', maintaining: true });
  });

  it('a new helm order supersedes the previous one', () => {
    let s = play(start(7), ['approach the kestrel']);
    const first = lastHelm(s).id;
    const before = lastId(s);
    s = play(s, ['all stop']);
    expect(s.orders.list.find((o) => o.id === first)?.status).toBe('superseded');
    expect(textSince(s, before)).toMatch(/Belaying the previous order/);
  });

  it('fails when the impulse engines are lost under way', () => {
    let s = play(start(7), ['approach the kestrel']);
    s = patchSystem(s, 'halcyon', 'engines', { health: 0 });
    const before = lastId(s);
    s = play(s, ['wait']);
    expect(lastHelm(s).status).toBe('failed');
    expect(textSince(s, before)).toMatch(/Impulse is down/);
  });

  it('fails when the reference ship is destroyed', () => {
    let s = play(start(7), ['escort the kestrel']);
    s = destroyShip(s, 'kestrel', [], { quiet: true });
    s = act(s, { type: 'wait' });
    expect(lastHelm(s).status).toBe('failed');
  });

  it('is impossible when the engines are already destroyed (validator)', () => {
    const s = play(patchSystem(start(7), 'halcyon', 'engines', { health: 0 }), ['intercept the cruiser']);
    expect(s.orders.list.at(-1)).toMatchObject({ status: 'impossible', dept: 'helm' });
  });

  it('instant orders complete immediately; an already-satisfied order is confirmed, not rejected', () => {
    const s0 = start(7);
    const s = play(s0, ['keep the shields down and weapons safe']);
    expect(s.orders.list.map((o) => o.status)).toEqual(['completed', 'completed']);
    expect(textSince(s, lastId(s0))).toMatch(/Shields are already down/);
  });
});

describe('time: manoeuvres take time while NPCs act', () => {
  it('one order is one minute of simulated motion, limited by top speed', () => {
    const s0 = start(7);
    const s = act(s0, M('interpose', { target: 'kestrel', second: 'cruiser' }));
    expect(s.time - s0.time).toBe(60);
    expect(distance(s0.ships.halcyon.position, s.ships.halcyon.position)).toBeLessThanOrEqual(235 * 60 + 1);
    expect(lastHelm(s).status).toBe('underway'); // ~38,000 km cannot be covered in a minute
  });

  it('"wait" and "continue" let time pass and the cruiser keeps closing', () => {
    let s = act(start(7), M('allStop'));
    const d0 = range(s, 'cruiser', 'kestrel');
    s = play(s, ['continue', 'wait']);
    expect(range(s, 'cruiser', 'kestrel')).toBeLessThan(d0 - 40000);
  });

  it('Vane reads closing at speed as a threat', () => {
    let s = play(start(7), ['raise shields', 'intercept the cruiser']);
    let threat = false;
    for (let i = 0; i < 5 && !s.outcome; i++) {
      const before = lastId(s);
      s = play(s, ['wait']);
      if (/closing on my ship at speed|Raised shields, armed weapons/.test(textSince(s, before))) threat = true;
    }
    expect(threat).toBe(true);
  });
});

describe('physical limits', () => {
  it('turn rate limits how fast the bow swings; a ship slows while turning away', () => {
    const s = start(7);
    const h = { ...s.ships.halcyon, velocity: { x: 0, y: 200 }, heading: 0 };
    const perf = effectivePerf(s, 'halcyon');
    const g = { point: null, match: { x: 0, y: 0 }, velocity: { x: 0, y: -200 }, reached: false, lost: false };
    const after = stepShip(h, g, perf, 1, 5);
    expect(Math.abs(angleDiff(0, after.heading))).toBeLessThanOrEqual(perf.turnRate * 5 + 1e-9);
    expect(len(after.velocity)).toBeLessThan(200);
  });

  it('acceleration is limited: from rest the ship cannot reach top speed in one sub-step', () => {
    const s = start(7);
    const h = s.ships.halcyon;
    const g = guidanceFor(s, 'halcyon', { intent: 'approach', target: 'kestrel', second: null, rangeKm: null, speedFactor: 1, offset: null, orderId: null, reached: false, startedTurn: 0 });
    const after = stepShip(h, g, effectivePerf(s, 'halcyon'), 1, 5);
    expect(len(after.velocity)).toBeLessThanOrEqual(12 * 5 + 1e-9);
  });

  it('impulse damage reduces speed and lengthens the ETA', () => {
    const healthy = act(start(7), M('approach', { target: 'kestrel' }));
    const hurt = act(patchSystem(start(7), 'halcyon', 'engines', { health: 40 }), M('approach', { target: 'kestrel' }));
    const dh = distance(start(7).ships.halcyon.position, healthy.ships.halcyon.position);
    const dd = distance(start(7).ships.halcyon.position, hurt.ships.halcyon.position);
    expect(dd).toBeLessThan(dh * 0.6);
    expect(lastHelm(hurt).etaSeconds!).toBeGreaterThan(lastHelm(healthy).etaSeconds!);
  });

  it('towing the Kestrel halves performance and drags her along', () => {
    let s = play(start(7), ['take us to 4,000 km of the kestrel', 'wait', 'wait', 'wait']);
    s = play(s, ['tractor the kestrel']);
    expect(effectivePerf(s, 'halcyon').maxSpeed).toBeCloseTo(235 / 2, 0);
    const k0 = s.ships.kestrel.position;
    s = play(s, ['retreat from the cruiser', 'wait']);
    expect(distance(k0, s.ships.kestrel.position)).toBeGreaterThan(3000);
    expect(range(s, 'halcyon', 'kestrel')).toBeLessThan(6000);
  });

  it('a non-hostile posture caps closing speed on the warship', () => {
    const base = start(7);
    const near = patchShip(base, 'halcyon', { position: { x: base.ships.cruiser.position.x - 40000, y: base.ships.cruiser.position.y - 40000 } });
    const pointed = patchShip(near, 'halcyon', { heading: bearingFrom(near.ships.halcyon.position, near.ships.cruiser.position) });
    const fast = act(pointed, M('approach', { target: 'cruiser' }));
    const slow = act(act(pointed, { type: 'posture', stance: 'nonHostile' }), M('approach', { target: 'cruiser' }));
    expect(speed(slow)).toBeLessThan(speed(fast) * 0.75);
  });

  it('headings are unit vectors with 0 = north, clockwise', () => {
    expect(headingVec(0).y).toBeCloseTo(1);
    expect(headingVec(90).x).toBeCloseTo(1);
  });
});

describe('determinism and kinematic invariants', () => {
  it('same seed + same orders → identical world, including positions and velocities', () => {
    const orders = [USER_ORDER, 'wait', 'intercept the cruiser', 'wait', 'evasive manoeuvres', 'wait'];
    const a = play(start(11), orders);
    const b = play(start(11), orders);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(play(start(12), orders).ships)).not.toBe(JSON.stringify(a.ships));
  });

  it('no NaN, no speeding, no teleporting across many seeds and manoeuvres', () => {
    const cmds = [USER_ORDER, 'wait', 'intercept the cruiser', 'wait', 'orbit the kestrel', 'wait', 'run for the border', 'wait', 'come about', 'evasive', 'wait', 'escort the kestrel', 'wait'];
    for (let seed = 1; seed <= 25; seed++) {
      let s = start(seed);
      for (const c of cmds) {
        if (s.outcome) break;
        const prev = s;
        s = play(s, [c]);
        expect(checkTransition(prev, s), `seed ${seed} "${c}"`).toEqual([]);
      }
    }
  });
});
