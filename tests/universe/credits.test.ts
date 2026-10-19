/**
 * Daily canonical credits: consumed only by NEW canonical starts; never by
 * viewing, declining, ignoring, saving, resuming, finishing or simulations.
 */
import { describe, expect, it } from 'vitest';
import { K } from '../helpers';
import { Universe } from '../../src/universe/controller';
import { charge, configure, defaultLedger, msUntilReset, refresh, remaining, resetNow } from '../../src/universe/credits';
import { KEYS, localRepository, memoryStorage } from '../../src/universe/repository';
import { TRAINING } from '../../src/universe/archive';
import { PEACEFUL_RUN, WITHDRAW_RUN, playOut, playToEnd } from './fixtures';

function universe(start = new Date(2026, 9, 19, 10, 0)) {
  let now = start;
  const storage = memoryStorage();
  const u = new Universe({ repo: localRepository(storage, () => defaultLedger(now)), appVersion: 'test', scenarios: { [K.id]: K }, now: () => now });
  return { u, storage, setNow: (d: Date) => (now = d) };
}
const openOffers = (u: Universe) => u.offers().filter((o) => o.status === 'open');

describe('credit ledger', () => {
  it('defaults to 10 per day and refuses the 11th new start', () => {
    const now = new Date(2026, 9, 19, 9);
    let l = defaultLedger(now);
    expect(remaining(l, now)).toBe(10);
    for (let i = 0; i < 10; i++) {
      const r = charge(l, `m${i}`, now);
      expect(r.ok).toBe(true);
      l = r.ledger;
    }
    expect(remaining(l, now)).toBe(0);
    expect(charge(l, 'm10', now).ok).toBe(false);
  });

  it('never charges the same mission twice', () => {
    const now = new Date(2026, 9, 19, 9);
    const a = charge(defaultLedger(now), 'm1', now);
    if (!a.ok) throw new Error();
    const b = charge(a.ledger, 'm1', now);
    expect(b.ok && !b.charged).toBe(true);
    expect(remaining(b.ledger, now)).toBe(9);
  });

  it('resets at local midnight (or a configured hour)', () => {
    const late = new Date(2026, 9, 19, 23, 30);
    let l = defaultLedger(late);
    for (let i = 0; i < 10; i++) l = (charge(l, `m${i}`, late) as { ledger: typeof l }).ledger;
    expect(remaining(l, late)).toBe(0);
    expect(msUntilReset(l, late)).toBe(30 * 60 * 1000);
    expect(remaining(l, new Date(2026, 9, 20, 0, 5))).toBe(10);
    const four = configure(l, { policy: { kind: 'local-midnight', hour: 4 } }, late);
    expect(remaining(four, new Date(2026, 9, 20, 3, 0))).toBe(10 - four.used);
    expect(refresh(four, new Date(2026, 9, 20, 4, 1)).used).toBe(0);
  });

  it('supports a rolling 24-hour window and a configurable limit', () => {
    const t0 = new Date(2026, 9, 19, 15, 0);
    let l = configure(defaultLedger(t0), { policy: { kind: 'rolling-24h' }, dailyLimit: 2 }, t0);
    l = (charge(l, 'a', t0) as { ledger: typeof l }).ledger;
    l = (charge(l, 'b', t0) as { ledger: typeof l }).ledger;
    expect(remaining(l, new Date(2026, 9, 20, 14, 0))).toBe(0);
    expect(remaining(l, new Date(2026, 9, 20, 15, 1))).toBe(2);
    expect(remaining(resetNow(l, t0), t0)).toBe(2);
  });
});

describe('credits in the Living Universe', () => {
  it('Living Universe needs the entitlement; Simulation Mode does not', () => {
    const { u } = universe();
    expect(u.ensureCanon()).toBeNull();
    expect(u.startCanonical('OF-0001')).toEqual({ ok: false, reason: 'not-entitled' });
    expect(() => u.startTraining(TRAINING[0].id, 1)).not.toThrow();
  });

  it('only starting a new canonical mission costs a credit', () => {
    const { u } = universe();
    u.setLivingUniverse(true);
    u.ensureCanon();
    expect(u.creditsRemaining()).toBe(10);
    const [directive, distress, voluntary] = [...openOffers(u)].sort((a, b) => a.id.localeCompare(b.id));
    expect([directive.classification, distress.classification, voluntary.classification]).toEqual(['directive', 'distress', 'voluntary']);

    // Viewing, questioning, declining and ignoring are free.
    u.archive();
    u.respond(directive.id, 'question');
    u.respond(voluntary.id, 'decline');
    u.respond(distress.id, 'ignore');
    expect(u.creditsRemaining()).toBe(10);

    // Accepting the (questioned) directive starts a canonical mission: one credit.
    const started = u.startCanonical(directive.id);
    expect(started.ok).toBe(true);
    if (!started.ok || !started.session) throw new Error('no session');
    expect(u.creditsRemaining()).toBe(9);

    // Saving, resuming and finishing it are free.
    u.saveCanonical({ ...started.session, state: playOut(started.session.state, ['scan the kestrel']) });
    const resumed = u.resumeCanonical(started.missionId);
    expect(resumed.state.turn).toBeGreaterThan(0);
    const final = playToEnd(resumed.state, PEACEFUL_RUN);
    u.finishCanonical({ ...resumed, state: final });
    expect(u.creditsRemaining()).toBe(9);
    // Starting the same offer again is not possible (and would not charge).
    expect(u.startCanonical(directive.id)).toEqual({ ok: false, reason: 'not-open' });

    // Simulations, however many, are free.
    for (let i = 0; i < 12; i++) u.finishSimulation(u.replayOriginal(started.missionId), playOut(u.replayOriginal(started.missionId).state, WITHDRAW_RUN));
    expect(u.creditsRemaining()).toBe(9);
  });

  it('at zero credits: no new canonical starts, simulations still play, history stays readable, canonical time pauses', () => {
    const { u } = universe();
    u.setLivingUniverse(true);
    u.ensureCanon();
    u.configureCredits({ dailyLimit: 1 });
    const directive = openOffers(u).find((o) => o.classification === 'directive')!;
    const r = u.startCanonical(directive.id);
    expect(r.ok).toBe(true);
    expect(u.creditsRemaining()).toBe(0);
    const before = u.canon()!.clock;
    const next = openOffers(u).find((o) => o.mission.kind === 'bridge' || o.classification !== 'directive')!;
    expect(u.startCanonical(next.id)).toEqual({ ok: false, reason: 'no-credits' });
    expect(u.advanceTime(6)).toEqual({ ok: false, reason: 'no-credits-paused' });
    expect(u.canon()!.clock).toBe(before);
    // Free actions still work, and the started mission can be resumed.
    expect(() => u.respond(next.id, next.classification === 'distress' ? 'ignore' : 'decline')).not.toThrow();
    if (!r.ok) throw new Error();
    expect(u.resumeCanonical(r.missionId).timeline).toBe('canonical');
    // Simulation Mode is unaffected.
    const t = u.startTraining(TRAINING[0].id, 5);
    expect(playOut(t.state, WITHDRAW_RUN).outcome).not.toBeNull();
    const v = u.replayVariation(r.missionId, 4242);
    expect(v.timeline).toBe('simulation');
    expect(u.archive().some((e) => e.id === r.missionId)).toBe(true);
  });

  it('credits reset with the period and the next canonical start is allowed again', () => {
    const { u, setNow } = universe(new Date(2026, 9, 19, 22, 0));
    u.setLivingUniverse(true);
    u.ensureCanon();
    u.configureCredits({ dailyLimit: 1 });
    u.startCanonical(openOffers(u).find((o) => o.classification === 'directive')!.id);
    expect(u.creditsRemaining()).toBe(0);
    setNow(new Date(2026, 9, 20, 0, 1));
    expect(u.creditsRemaining()).toBe(1);
    const nextOffer = openOffers(u)[0];
    expect(u.startCanonical(nextOffer.id).ok).toBe(true);
  });

  it('the credit ledger is a separate store from the canonical record', () => {
    const { u, storage } = universe();
    u.setLivingUniverse(true);
    u.ensureCanon();
    u.startCanonical(openOffers(u)[0].id);
    expect(JSON.parse(storage.getItem(KEYS.credits)!).used).toBe(1);
    expect(storage.getItem(KEYS.canon)).not.toContain('"used"');
  });
});
