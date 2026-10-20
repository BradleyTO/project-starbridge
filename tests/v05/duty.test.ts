/** v0.5 (M3.1) Active Duty: rename + migration, commission, reserve status, reactivation. */
import { describe, expect, it } from 'vitest';
import { K } from '../helpers';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { localRepository, memoryStorage } from '../../src/universe/repository';
import { PEACEFUL_RUN, playToEnd } from '../universe/fixtures';
import { UNIVERSE_SCHEMA_VERSION } from '../../src/universe/types';

const NOW = new Date(2026, 9, 19, 10, 0);
const make = (storage = memoryStorage()) => ({
  u: new Universe({ repo: localRepository(storage, () => defaultLedger(NOW)), appVersion: 'test', scenarios: { [K.id]: K }, now: () => NOW }),
  storage,
});

describe('entitlement migration (Living Universe → Active Duty)', () => {
  it('a v0.4 entitlement stored as livingUniverse reads as activeDuty and keeps the career', () => {
    const storage = memoryStorage();
    const old = make(storage).u;
    // What v0.4 wrote.
    localRepository(storage, () => defaultLedger(NOW)).entitlements.write({ schema: 'starbridge.entitlements', version: UNIVERSE_SCHEMA_VERSION, simulation: true, livingUniverse: true, source: 'dev-toggle' } as never);
    old.ensureCanon();
    const before = old.canon()!.profileId;
    const { u } = make(storage);
    expect(u.entitlements().activeDuty).toBe(true);
    expect(u.dutyStatus()).toBe('active'); // a pre-v0.5 career counts as commissioned: no ceremony forced
    expect(u.canon()!.profileId).toBe(before);
    u.setActiveDuty(false);
    expect(u.entitlements().activeDuty).toBe(false);
    expect(u.dutyStatus()).toBe('reserve');
  });
  it('the deprecated setter still works', () => {
    const { u } = make();
    u.setLivingUniverse(true);
    expect(u.entitlements().activeDuty).toBe(true);
  });
});

describe('commission', () => {
  it('first activation waits for the captain to accept; accepting starts the career', () => {
    const { u } = make();
    expect(u.dutyStatus()).toBe('simulation');
    u.setActiveDuty(true);
    expect(u.dutyStatus()).toBe('pending');
    expect(u.canon()).toBeNull();
    const c = u.acceptCommission()!;
    expect(u.dutyStatus()).toBe('active');
    expect(c.commission?.ship).toBe('ISV Halcyon');
    expect(c.captain.career.map((e) => e.text).join(' ')).toMatch(/Commissioned to active duty/);
    // Idempotent.
    expect(u.acceptCommission()!.captain.career.filter((e) => /Commissioned/.test(e.text)).length).toBe(1);
  });
  it('cannot be accepted without the subscription', () => {
    const { u } = make();
    expect(u.acceptCommission()).toBeNull();
    expect(u.canon()).toBeNull();
  });
});

describe('reserve status (subscription inactive)', () => {
  function served() {
    const env = make();
    env.u.setActiveDuty(true);
    env.u.acceptCommission();
    const offer = env.u.offers().find((o) => o.mission.kind === 'bridge' && o.status === 'open')!;
    const r = env.u.startCanonical(offer.id);
    if (!r.ok || !r.session) throw new Error('start failed');
    env.u.finishCanonical({ ...r.session, state: playToEnd(r.session.state, PEACEFUL_RUN) });
    return { ...env, missionId: r.missionId };
  }

  it('preserves history, ship, crew and archive, and freezes the canonical timeline', () => {
    const { u, missionId } = served();
    const snapshot = JSON.stringify(u.canon());
    u.setActiveDuty(false);
    expect(u.dutyStatus()).toBe('reserve');
    // Everything readable, nothing changed.
    expect(JSON.stringify(u.canon())).toBe(snapshot);
    expect(u.canon()!.missions[missionId].status).toBe('completed');
    expect(u.archive().some((e) => e.id === missionId)).toBe(true);
    // Frozen: no time passes, no missions start, no responses are recorded.
    expect(u.advanceTime(24)).toEqual({ ok: false, reason: 'not-entitled' });
    const open = u.canon()!.offers.find((o) => o.status === 'open');
    if (open) {
      expect(u.startCanonical(open.id).ok).toBe(false);
      expect(() => u.respond(open.id, 'decline')).toThrow(/reserve/);
    }
    expect(JSON.stringify(u.canon())).toBe(snapshot);
    // Simulations stay unlimited.
    for (let i = 0; i < 5; i++) expect(u.startTraining('TRN-kestrel', i + 1).timeline).toBe('simulation');
  });

  it('is never treated as misconduct', () => {
    const { u } = served();
    const before = u.canon()!.discipline.length;
    u.setActiveDuty(false);
    u.setActiveDuty(true);
    expect(u.canon()!.discipline.length).toBe(before);
    expect(u.canon()!.captain.career.map((e) => e.text).join(' ')).not.toMatch(/refus|desert|absent|misconduct/i);
  });

  it('reactivation restores the same career, without a second ceremony', () => {
    const { u } = served();
    const profile = u.canon()!.profileId;
    const career = u.canon()!.captain.career.length;
    u.setActiveDuty(false);
    u.setActiveDuty(true);
    expect(u.dutyStatus()).toBe('active');
    expect(u.canon()!.profileId).toBe(profile);
    expect(u.canon()!.captain.career.length).toBe(career);
    expect(u.advanceTime(6).ok).toBe(true); // the timeline runs again
  });
});
