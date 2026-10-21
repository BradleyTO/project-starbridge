/**
 * Phase D: world events, offers without the player, discipline and crew memory.
 */
import { describe, expect, it } from 'vitest';
import { K } from '../helpers';
import { submit } from '../../src/engine/game';
import { completeIntro } from '../../src/engine/turn';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { localRepository, memoryStorage } from '../../src/universe/repository';
import { haulerParams, haulerTimeline, simulateEvent } from '../../src/universe/models';
import { ALLOWED_RESPONSES, reviewFinding } from '../../src/universe/world';
import { withFamiliarity } from '../../src/universe/sessions';
import { TRAINING } from '../../src/universe/archive';
import { PEACEFUL_RUN, playToEnd } from './fixtures';
import type { CanonicalSession } from '../../src/universe/sessions';

function universe(storage = memoryStorage()) {
  const now = new Date(2026, 9, 19, 10, 0);
  const u = new Universe({ repo: localRepository(storage, () => defaultLedger(now)), appVersion: 'test', scenarios: { [K.id]: K }, now: () => now });
  u.setLivingUniverse(true);
  u.ensureCanon();
  return { u, storage };
}
const offerOf = (u: Universe, cls: string) => u.offers().find((o) => o.classification === cls && (o.status === 'open' || o.status === 'questioned'))!;
const eventOf = (u: Universe, id: string) => u.canon()!.events.find((e) => e.id === id)!;

function playCanonical(u: Universe, offerId: string, mutate?: (s: CanonicalSession['state']) => void) {
  const r = u.startCanonical(offerId);
  if (!r.ok || !r.session) throw new Error('start failed');
  const final = playToEnd(r.session.state, PEACEFUL_RUN);
  mutate?.(final);
  u.finishCanonical({ ...r.session, state: final });
  return r.missionId;
}
/** Let canonical time pass until the predicate holds. */
function advanceUntil(u: Universe, pred: () => boolean, maxHours = 72) {
  for (let h = 0; h < maxHours && !pred(); h += 6) expect(u.advanceTime(6).ok).toBe(true);
  expect(pred()).toBe(true);
}

describe('offer classifications', () => {
  it('represents voluntary, distress and mandatory offers with the right authority and allowed responses', () => {
    const { u } = universe();
    const d = offerOf(u, 'directive'), x = offerOf(u, 'distress'), v = offerOf(u, 'voluntary');
    expect([d.authority, x.authority, v.authority]).toEqual(['fleet-command', 'civilian', 'local-government']);
    expect(d.expiresAt).not.toBeNull();
    expect(x.expiresAt).toBeNull();
    expect(eventOf(u, d.eventId).classification).toBe('directive');
    expect(eventOf(u, x.eventId).classification).toBe('distress');
    expect(eventOf(u, v.eventId).classification).toBe('assignment');
    expect(ALLOWED_RESPONSES.voluntary).toEqual(['decline']);
    expect(ALLOWED_RESPONSES.distress).toEqual(['ignore']);
    expect(ALLOWED_RESPONSES.directive).toEqual(['question', 'refuse', 'disobey']);
    expect(() => u.respond(d.id, 'decline')).toThrow();
    expect(() => u.respond(v.id, 'refuse')).toThrow();
    expect(() => u.respond(x.id, 'decline')).toThrow();
  });

  it('declining a voluntary offer carries no discipline; the Lantern goes alone and the outcome is reported', () => {
    const { u } = universe();
    const v = offerOf(u, 'voluntary');
    u.respond(v.id, 'decline');
    expect(u.canon()!.discipline).toHaveLength(0);
    expect(u.canon()!.captain.career).toHaveLength(0);
    advanceUntil(u, () => eventOf(u, v.eventId).status !== 'active', 24);
    const ev = eventOf(u, v.eventId);
    expect(ev.consequences.join(' ')).toMatch(/Lantern went alone/);
    expect(u.canon()!.events.some((e) => e.classification === 'bulletin' && e.links.includes(ev.id))).toBe(true);
  });
});

describe('a distress call continues without the player', () => {
  it('the model is deterministic and always reaches an outcome', () => {
    for (const seed of [1, 2, 3, 99, 12345]) {
      const p = haulerParams(seed, 480, 20);
      const a = haulerTimeline(p, null), b = haulerTimeline(p, null);
      expect(a).toEqual(b);
      expect(a[a.length - 1].final).toBe(true);
      expect(['rescued-other', 'self-repaired', 'lost']).toContain(a[a.length - 1].kind);
      // Responding at once always gets there first (3 h transit vs at least 8 h for anyone else).
      expect(haulerTimeline(p, 480).at(-1)!.kind).toBe('rescued-halcyon');
    }
    // Border tension keeps other traffic away.
    expect(haulerParams(7, 0, 80).otherShipAt - haulerParams(7, 0, 20).otherShipAt).toBe(12 * 60);
  });

  it('an ignored mayday reaches a persistent consequence, and the evidence appears in a later canonical mission', () => {
    const { u, storage } = universe();
    const x = offerOf(u, 'distress');
    const d = offerOf(u, 'directive');
    u.respond(x.id, 'ignore');
    expect(eventOf(u, x.eventId).status).toBe('active'); // ignoring does not end the emergency
    playCanonical(u, d.id); // the Kestrel directive, played canonically
    advanceUntil(u, () => eventOf(u, x.eventId).status !== 'active');
    const ev = eventOf(u, x.eventId);
    const final = haulerTimeline(x.model!.params as never, null).at(-1)!;
    expect(ev.status).toBe(final.kind === 'lost' ? 'expired' : 'resolved');
    expect(ev.consequences).toContain(final.text);
    const bulletin = u.canon()!.events.find((e) => e.classification === 'bulletin' && e.links.includes(x.eventId))!;
    expect(bulletin.summary).toBe(final.text);
    expect(ev.links).toContain(bulletin.id);

    // Persisted: a fresh Universe over the same storage sees the same history.
    const again = new Universe({ repo: localRepository(storage, () => defaultLedger(new Date(2026, 9, 19, 10))), appVersion: 'test', scenarios: { [K.id]: K }, now: () => new Date(2026, 9, 19, 10) });
    expect(again.canon()!.events.find((e) => e.id === x.eventId)!.consequences).toContain(final.text);

    // Evidence in a later canonical event: the next bridge mission opens with the bulletin.
    const patrol = again.offers().find((o) => o.title.startsWith('Voluntary: Reach patrol') && o.status === 'open')!;
    const r = again.startCanonical(patrol.id);
    if (!r.ok || !r.session) throw new Error();
    expect(r.session.state.log.some((l) => l.speaker === 'Sector bulletin' && l.text === final.text)).toBe(true);
    const m = again.canon()!.missions[r.missionId];
    expect(m.snapshot.initial!.log.some((l) => l.text === final.text)).toBe(true); // replays see it too
    expect(again.canon()!.news.find((n) => n.eventId === bulletin.id)!.deliveredTo).toBe(r.missionId);
  });

  it('responding sends the Halcyon; the mission is archived and replays with other choices only as simulations', () => {
    const { u } = universe();
    const x = offerOf(u, 'distress');
    const r = u.startCanonical(x.id);
    if (!r.ok) throw new Error();
    const m = u.canon()!.missions[r.missionId];
    expect(m.outcome!.id).toBe('rescued-halcyon');
    expect(eventOf(u, x.eventId).status).toBe('resolved');
    const entry = u.archive().find((e) => e.id === r.missionId)!;
    expect(entry.replay).toBe('event');
    const rev = u.canon()!.revision;
    const run = u.simulateEventMission(r.missionId, 'ignore');
    expect(run.outcome!.id).not.toBe('rescued-halcyon');
    expect(run.outcome!.summary).toBe(simulateEvent('hauler-distress', m.snapshot.eventParams!, 'ignore').text);
    expect(u.canon()!.revision).toBe(rev); // the canonical store was not written
    expect(u.canon()!.missions[r.missionId].outcome!.id).toBe('rescued-halcyon');
    expect(u.archive().find((e) => e.id === r.missionId)!.simRuns.at(-1)!.outcome!.id).toBe(run.outcome!.id);
  });
});

describe('mandatory directives and the disciplinary review', () => {
  it('questioning records Fleet’s reply, keeps the directive open and costs nothing', () => {
    const { u } = universe();
    const d = offerOf(u, 'directive');
    const left = u.creditsRemaining();
    u.respond(d.id, 'question');
    const o = u.offers().find((x) => x.id === d.id)!;
    expect(o.status).toBe('questioned');
    expect(o.responses[0].detail).toMatch(/Directive stands/);
    expect(u.canon()!.discipline).toHaveLength(0);
    expect(u.creditsRemaining()).toBe(left);
    expect(u.startCanonical(d.id).ok).toBe(true); // can still comply
  });

  it('refusal without a valid reason → reprimand after review; the Kestrel situation continues without the Halcyon', () => {
    const { u } = universe();
    const d = offerOf(u, 'directive');
    u.respond(d.id, 'refuse', 'none');
    const dc = u.canon()!.discipline[0];
    expect(dc.finding).toBe('pending');
    expect(dc.trigger).toBe('refused');
    advanceUntil(u, () => u.canon()!.discipline[0].finding !== 'pending', 24);
    expect(u.canon()!.discipline[0].finding).toBe('reprimand');
    expect(u.canon()!.captain.career.some((c) => /reprimand/.test(c.text))).toBe(true);
    const ev = eventOf(u, d.eventId);
    expect(ev.consequences.join(' ')).toMatch(/no ISA ship in the Reach/);
    expect(u.canon()!.events.some((e) => e.classification === 'bulletin' && e.links.includes(d.eventId))).toBe(true);
  });

  it('the finding follows the evidence: "unfit" with a sound hull is a reprimand; a lifesaving commitment is no action', () => {
    const a = universe().u;
    a.respond(offerOf(a, 'directive').id, 'refuse', 'unfit');
    expect(a.canon()!.discipline[0].evidence[0]).toMatch(/hull at 100%/);
    advanceUntil(a, () => a.canon()!.discipline[0].finding !== 'pending', 24);
    expect(a.canon()!.discipline[0].finding).toBe('reprimand');

    const b = universe().u;
    b.startCanonical(offerOf(b, 'distress').id); // respond to the mayday first
    b.respond(offerOf(b, 'directive').id, 'refuse', 'prior-rescue');
    advanceUntil(b, () => b.canon()!.discipline[0].finding !== 'pending', 24);
    expect(b.canon()!.discipline[0].finding).toBe('no-action');

    // Deterministic: same evidence, same finding; never a reward for obedience or automatic punishment.
    const dc = b.canon()!.discipline[0];
    expect(reviewFinding(dc)).toEqual(reviewFinding(structuredClone(dc)));
    expect(reviewFinding({ trigger: 'refused', reason: 'unfit', evidence: ['Halcyon hull at 41% when the directive was refused.', 'No lifesaving response under way.'] }).finding).toBe('no-action');
  });

  it('letting a directive lapse counts as non-compliance and opens a review; declining voluntary work never does', () => {
    const { u } = universe();
    const v = offerOf(u, 'voluntary');
    advanceUntil(u, () => u.canon()!.discipline.length > 0, 12);
    const dc = u.canon()!.discipline[0];
    expect(dc.trigger).toBe('disobeyed');
    expect(u.offers().find((o) => o.classification === 'directive')!.status).toBe('lapsed');
    u.advanceTime(6); // 12 h: the escort request expires too
    // The voluntary escort also lapsed unanswered with no review of its own.
    expect(u.offers().find((o) => o.id === v.id)!.status).toBe('lapsed');
    expect(u.canon()!.discipline).toHaveLength(1);
  });
});

describe('crew memory: canonical experience vs simulator familiarity', () => {
  it('a canonical death carries forward (relief officer); a simulated death never does', () => {
    const { u } = universe();
    // Simulator: the helm officer "dies" in training.
    const sim = u.startTraining(TRAINING[0].id, 14);
    const simFinal = playToEnd(sim.state, PEACEFUL_RUN);
    simFinal.characters.adeyemi.status = 'dead';
    u.finishSimulation(sim, simFinal);
    expect(u.familiarity().training.simulatedCasualties).toBe(1);
    expect(u.canon()!.crew.adeyemi).toBeUndefined();

    // Canonical: the officer serves (and survives) the Kestrel directive.
    playCanonical(u, offerOf(u, 'directive').id);
    expect(u.canon()!.crew.adeyemi.status).toBe('active');
    expect(u.canon()!.crew.adeyemi.experiences.join(' ')).not.toMatch(/Killed/);

    // A real loss on a later canonical mission persists into the next one.
    const patrol = () => u.offers().find((o) => o.title.startsWith('Voluntary: Reach patrol') && o.status === 'open')!;
    playCanonical(u, patrol().id, (s) => {
      s.characters.adeyemi.status = 'dead';
      s.characters.adeyemi.memory.deathTurn = s.turn;
    });
    expect(u.canon()!.crew.adeyemi.status).toBe('dead');
    const r = u.startCanonical(patrol().id);
    if (!r.ok || !r.session) throw new Error();
    expect(r.session.state.characters.adeyemi.status).toBe('dead');
    expect(r.session.state.log.some((l) => l.speaker === 'Duty roster' && /Adeyemi|adeyemi/i.test(l.text))).toBe(true);
    // …while the training simulator still has the full crew.
    expect(u.startTraining(TRAINING[0].id, 14).state.characters.adeyemi.status).toBe('active');
  });

  it('drilled manoeuvres colour crew lines without being treated as real events', () => {
    const base = completeIntro(K.create(14), K);
    const drilled = { interpose: 4, approach: 4, holdStation: 4 };
    const sim = submit(K, withFamiliarity(base, drilled), 'keep us between the kestrel and the cruiser');
    expect(sim.log.some((l) => /that's 4 times in the simulator/.test(l.text))).toBe(true);
    const canon = submit(K, withFamiliarity({ ...base, provenance: { ...base.provenance, timeline: 'canonical' } }, drilled), 'keep us between the kestrel and the cruiser');
    expect(canon.log.some((l) => /in the simulator, Captain. This time it's for real/.test(l.text))).toBe(true);
    // Without drills nothing changes (v0.3 behaviour preserved).
    expect(submit(K, base, 'keep us between the kestrel and the cruiser').log.some((l) => /simulator/.test(l.text))).toBe(false);
  });
});
