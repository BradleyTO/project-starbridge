/**
 * v0.4 interpreter + standing-order regressions (explicit M3 targets, not held-out).
 */
import { describe, expect, it } from 'vitest';
import { submit } from '../../src/engine/game';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';
import { patchShip } from '../../src/engine/state';
import { K, start } from '../helpers';
import { expandAliases, learnFromCommand } from '../../src/universe/familiarity';
import { defaultFamiliarity } from '../../src/universe/repository';
import type { WorldState } from '../../src/engine/types';

const A = 'Bring us in, activate shields, do not power up weapons, and hail the ship.';
const B = 'No matter what, keep us between the Kestrel and the cruiser. If the Kestrel arms its weapons, raise our shields, but not until then.';
const parse = (t: string, s = start(42)) => interpretSync(t, contextFrom(s));
const acts = (t: string, s?: WorldState) => {
  const r = parse(t, s);
  return r.kind === 'unrecognised' ? [] : (r.actions as Record<string, unknown>[]);
};
const armsWeapons = (a: Record<string, unknown>) => a.type === 'weapons' && a.mode !== 'safe';
const textSince = (s: WorldState, id: number) => s.log.filter((l) => l.id > id).map((l) => `${l.speaker}: ${l.text}`).join('\n');
const lastId = (s: WorldState) => s.log[s.log.length - 1]?.id ?? 0;

describe('critical regression (a): stacked orders with a negation', () => {
  it('parses into approach the Kestrel, shields up, weapons kept down, hail — and never arms', () => {
    const r = parse(A);
    expect(r.kind).toBe('actions');
    const a = acts(A);
    expect(a).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'maneuver', intent: 'approach', target: 'kestrel' }),
      expect.objectContaining({ type: 'shields', raise: true }),
      expect.objectContaining({ type: 'restrict', subject: 'armWeapons' }),
      expect.objectContaining({ type: 'communicate', target: 'kestrel', intent: 'open' }),
    ]));
    expect(a.some(armsWeapons)).toBe(false);
    expect(r.unparsed).toEqual([]);
  });

  it('in play: closes on the Kestrel with shields raised and weapons safe, opens comms, and keeps weapons safe', () => {
    const s0 = start(42);
    let s = submit(K, s0, A);
    const said = textSince(s, lastId(s0));
    expect(s.ships.halcyon.nav).toMatchObject({ intent: 'approach', target: 'kestrel' });
    expect(s.ships.halcyon.shields.raised).toBe(true);
    expect(s.ships.halcyon.weapons.state).toBe('safe');
    expect(s.restrictions.map((r) => r.subject)).toContain('armWeapons');
    expect(said).toMatch(/Arden|Kestrel/);
    expect(said).not.toMatch(/weapons (are )?armed|Weapons armed/i);
    for (let i = 0; i < 6 && !s.outcome; i++) {
      s = submit(K, s, i === 2 ? 'red alert' : 'wait');
      expect(s.ships.halcyon.weapons.state).toBe('safe');
    }
  });

  it('a later explicit order lifts the hold, with a report', () => {
    const s0 = submit(K, start(42), A);
    const s = submit(K, s0, 'arm weapons');
    expect(s.ships.halcyon.weapons.state).toBe('armed');
    expect(s.restrictions.some((r) => r.subject === 'armWeapons')).toBe(false);
    expect(textSince(s, lastId(s0))).toMatch(/Lifting your earlier hold/);
  });
});

describe('critical regression (b): persistent interpose + conditional standing order', () => {
  it('parses into a persistent interpose, a standing order on the Kestrel arming, and a hold until then', () => {
    const r = parse(B);
    expect(r.kind).toBe('actions');
    const a = acts(B);
    expect(a).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'maneuver', intent: 'interpose', target: 'kestrel', second: 'cruiser', persistent: true }),
      expect.objectContaining({ type: 'standing', trigger: { kind: 'weapons', ship: 'kestrel', state: 'armed' }, actions: [expect.objectContaining({ type: 'shields', raise: true })] }),
      expect.objectContaining({ type: 'restrict', subject: 'raiseShields', until: { kind: 'weapons', ship: 'kestrel', state: 'armed' } }),
    ]));
    expect(a.some((x) => x.type === 'shields')).toBe(false); // nothing raises shields now
    expect(a.some(armsWeapons)).toBe(false);
  });

  it('BEFORE the trigger: shields stay down, even through red alert; the interpose holds', () => {
    let s = submit(K, start(1), B); // seed 1: Arden never arms within the window
    expect(s.ships.halcyon.shields.raised).toBe(false);
    expect(s.orders.list.some((o) => o.persistent && /no matter what/.test(o.label))).toBe(true);
    const before = lastId(s);
    s = submit(K, s, 'red alert');
    expect(s.ships.halcyon.shields.raised).toBe(false);
    expect(textSince(s, before)).toMatch(/Shields held down per your order/);
    for (let i = 0; i < 8 && !s.outcome; i++) {
      s = submit(K, s, 'wait');
      expect(s.ships.kestrel.weapons.state).toBe('safe');
      expect(s.ships.halcyon.shields.raised).toBe(false);
      expect(s.ships.halcyon.weapons.state).toBe('safe');
      expect(s.ships.halcyon.nav?.intent).toBe('interpose');
    }
  });

  it('AFTER the trigger (Arden arms on his own as the cruiser closes): shields go up that same minute, never before', () => {
    let s = submit(K, start(4), B);
    let armedTurn = -1;
    for (let i = 0; i < 20 && !s.outcome && armedTurn < 0; i++) {
      const prev = s;
      s = submit(K, s, 'wait');
      if (s.ships.kestrel.weapons.state !== 'safe') armedTurn = s.turn;
      else expect(s.ships.halcyon.shields.raised).toBe(false);
      if (armedTurn > 0) {
        expect(prev.ships.halcyon.shields.raised).toBe(false);
        expect(s.ships.halcyon.shields.raised).toBe(true);
        expect(textSince(s, lastId(prev))).toMatch(/Standing order: Kestrel arms weapons/);
      }
    }
    expect(armedTurn).toBeGreaterThan(0);
    expect(s.restrictions.some((r) => r.subject === 'raiseShields')).toBe(false); // the hold ended with its condition
    expect(s.ships.halcyon.weapons.state).toBe('safe'); // and no player weapons, ever
  });

  it('AFTER the trigger (provoked): the Kestrel arming at any point fires the order on the next tick', () => {
    let s = submit(K, start(1), B);
    s = patchShip(s, 'kestrel', { weapons: { state: 'armed', target: 'cruiser' } });
    s = submit(K, s, 'wait');
    expect(s.ships.halcyon.shields.raised).toBe(true);
    expect(s.standing.find((x) => x.trigger.kind === 'weapons')?.status).toBe('fired');
    // The cruiser locking on to the Kestrel provokes Arden too (his own behaviour, not a script).
    // (Our own tactical officer refuses to lock on a ship with civilians aboard.)
    let p = submit(K, start(1), B);
    p = patchShip(p, 'cruiser', { weapons: { state: 'locked', target: 'kestrel' } });
    p = submit(K, p, 'wait');
    expect(p.ships.kestrel.weapons.state).toBe('armed');
    expect(p.ships.halcyon.shields.raised).toBe(true);
  });
});

describe('plan safety', () => {
  it('a contradictory command asks and changes nothing', () => {
    const s0 = start(42);
    const r = parse('raise shields and lower shields', s0);
    expect(r.kind).toBe('clarify');
    const s = submit(K, s0, 'raise shields and lower shields');
    expect(s.ships.halcyon.shields).toEqual(s0.ships.halcyon.shields);
    expect(s.turn).toBe(s0.turn);
    expect(parse("don't arm weapons and fire on the cruiser").kind).toBe('clarify');
  });

  it('an unresolved "it" asks instead of picking a target', () => {
    const r = parse('target it');
    expect(r.kind).toBe('clarify');
    expect(acts('target it').some((a) => a.type === 'weapons')).toBe(false);
  });

  it('an unrecognisable condition asks rather than acting', () => {
    const r = parse('if the moon turns blue, fire on the cruiser');
    expect(r.kind).toBe('clarify');
    expect(acts('if the moon turns blue, fire on the cruiser').some(armsWeapons)).toBe(false);
  });

  it('the engine re-checks the plan even if an interpreter does not (defence in depth)', () => {
    const s0 = start(42);
    const bad = { kind: 'actions' as const, actions: [{ type: 'shields' as const, raise: true }, { type: 'shields' as const, raise: false }], unparsed: [], notes: [], source: 'test' };
    const { state } = submitInterp(s0, bad);
    expect(state.ships.halcyon.shields).toEqual(s0.ships.halcyon.shields);
  });
});

describe('sequencing, prohibitions with exits, and teaching', () => {
  it('"…, then beam the crew aboard" waits for the helm to arrive', () => {
    let s = submit(K, start(42), 'Take us to 3,000 km of the Kestrel, then beam the crew aboard');
    expect(s.standing.some((x) => x.trigger.kind === 'helmDone' && x.status === 'armed')).toBe(true);
    expect(s.counters.rescued ?? 0).toBe(0);
    for (let i = 0; i < 30 && !s.outcome && s.standing.some((x) => x.status === 'armed'); i++) s = submit(K, s, 'wait');
    expect(s.standing.find((x) => x.trigger.kind === 'helmDone')?.status).toBe('fired');
    expect(s.log.some((l) => /Standing order: the helm order is complete/.test(l.text))).toBe(true);
  });

  it('"don\'t fire unless fired upon" holds fire until the cruiser fires', () => {
    const a = acts("Don't fire unless fired upon");
    expect(a).toEqual([expect.objectContaining({ type: 'restrict', subject: 'fireWeapons', until: { kind: 'weapons', ship: 'cruiser', state: 'fired' } })]);
    let s = submit(K, start(42), "Don't fire unless fired upon");
    expect(s.restrictions[0]?.subject).toBe('fireWeapons');
    s = { ...s, counters: { ...s.counters, firedTurn_cruiser: s.turn + 1 } };
    s = submit(K, s, 'wait');
    expect(s.restrictions.some((r) => r.subject === 'fireWeapons')).toBe(false);
  });

  it('teaching a phrase stores familiarity (not world state) and later expands it', () => {
    const a = acts("When I say 'button up', I mean raise shields and go to red alert");
    expect(a).toEqual([expect.objectContaining({ type: 'learn', phrase: 'button up', meaning: 'raise shields and go to red alert' })]);
    const s0 = start(42);
    const s = submit(K, s0, "When I say 'button up', I mean raise shields and go to red alert");
    expect(s.ships.halcyon.shields.raised).toBe(s0.ships.halcyon.shields.raised);
    const f = learnFromCommand(defaultFamiliarity(), 'canonical', 'x', [{ action: a[0] as never, status: 'accepted' }]);
    expect(f.aliases['button up']).toBe('raise shields and go to red alert');
    expect(expandAliases('Button up!', f.aliases).text).toMatch(/raise shields and go to red alert/);
  });
});

import { processOrders } from '../../src/engine/turn';
import { completeIntro } from '../../src/engine/turn';
function submitInterp(s: WorldState, interp: Parameters<typeof processOrders>[2]) {
  return processOrders(completeIntro(s, K), 'test', interp, K);
}
