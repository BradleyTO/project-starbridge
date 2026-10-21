/** v0.7 Training Record + Service Record: separate stores, persistence, canon isolation, compression. */
import { describe, expect, it } from 'vitest';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { KEYS, localRepository, memoryStorage } from '../../src/universe/repository';
import { K, KESTREL, TALLIS, TS } from './fixtures';
import { competencyViews, defaultTraining, fileEvaluation, FULL_EVALUATIONS_KEPT } from '../../src/evaluation/record';
import { bandOf } from '../../src/evaluation/competencies';
import { evaluate } from '../../src/evaluation/evaluate';
import { activeRestrictions, decideAppeal, defaultService, eligibleFor, lodgeAppeal, restrictionFor, serviceOf, DAY } from '../../src/career/service';
import type { WorldState } from '../../src/engine/types';
import { playT } from '../sim02/helpers';
import { play } from '../helpers';

const NOW = new Date(2026, 9, 21, 10, 0);
const make = (storage = memoryStorage()) => new Universe({ repo: localRepository(storage, () => defaultLedger(NOW)), appVersion: 'test', scenarios: { [K.id]: K, [TS.id]: TS }, now: () => NOW });

/** Replay a fixture's orders inside a Universe training session (so the session is real). */
function finishTraining(u: Universe, id: string, final: WorldState) {
  const sess = u.startTraining(id, final.seed as number);
  return u.finishSimulation(sess, final);
}

describe('the Training Record', () => {
  it('a finished simulation files an evaluation; canonical storage is untouched (byte-identical), even with a career', () => {
    const storage = memoryStorage();
    const u = make(storage);
    u.setActiveDuty(true);
    u.acceptCommission();
    const canonBefore = storage.getItem(KEYS.canon);
    const e1 = finishTraining(u, 'TRN-kestrel', KESTREL.pyrrhic());
    const e2 = finishTraining(u, 'TRN-tallis', TALLIS.heldFire());
    expect(e1?.outcome.id).toBe('cruiser-destroyed');
    expect(e2?.outcome.id).toBe('liner-destroyed');
    expect(storage.getItem(KEYS.canon)).toBe(canonBefore);
    expect(u.training().evaluations.map((e) => e.outcome.id)).toEqual(['cruiser-destroyed', 'liner-destroyed']);
    expect(u.service().evaluations).toEqual([]);
    const run = u.repo.sims.read().runs.find((r) => r.outcome?.id === 'liner-destroyed');
    expect(run?.evaluationId).toBe(e2?.id);
  });

  it('competencies persist across reload and across reserve status and back', () => {
    const storage = memoryStorage();
    const u = make(storage);
    finishTraining(u, 'TRN-tallis', TALLIS.lifted());
    finishTraining(u, 'TRN-kestrel', KESTREL.corridor());
    const views = competencyViews(make(storage).training());
    expect(views.find((v) => v.id === 'diplomacy')?.band).not.toBe('unassessed');
    u.setActiveDuty(true);
    u.acceptCommission();
    u.setActiveDuty(false);
    u.setActiveDuty(true);
    expect(competencyViews(make(storage).training())).toEqual(views);
  });

  it('competency views show words and evidence, never numbers', () => {
    const u = make();
    finishTraining(u, 'TRN-tallis', TALLIS.wardFirst());
    const views = competencyViews(u.training());
    expect(views).toHaveLength(11);
    for (const v of views) {
      expect(['unassessed', 'developing', 'competent', 'proficient', 'distinguished']).toContain(v.band);
      for (const line of v.evidence) expect(line).not.toMatch(/\d+\s?%|\bscore\b/i);
    }
    expect(views.find((v) => v.id === 'crew')?.evidence[0]).toMatch(/^Strength in Training Simulation 002: Quarantine at Tallis Gate/);
  });

  it('bands need evidence from several evaluations; concerns weigh against strengths', () => {
    expect(bandOf(undefined)).toBe('unassessed');
    expect(bandOf({ strength: 20, concern: 0, evaluations: 1, recent: [] })).toBe('developing');
    expect(bandOf({ strength: 9, concern: 0, evaluations: 3, recent: [] })).toBe('proficient');
    expect(bandOf({ strength: 9, concern: 6, evaluations: 3, recent: [] })).toBe('competent');
    expect(bandOf({ strength: 30, concern: 2, evaluations: 6, recent: [] })).toBe('distinguished');
  });

  it('filing is idempotent; old evaluations are compressed into the archive, never erased, and their evidence stays', () => {
    const base = evaluate(TALLIS.lifted(), TS, { id: 'E0', source: 'simulation', refId: 'R', atIso: NOW.toISOString() });
    let r = defaultTraining();
    r = fileEvaluation(r, base);
    expect(fileEvaluation(r, base)).toBe(r);
    for (let i = 1; i <= FULL_EVALUATIONS_KEPT + 5; i++) r = fileEvaluation(r, { ...base, id: `E${i}` });
    expect(r.evaluations).toHaveLength(FULL_EVALUATIONS_KEPT);
    expect(r.archived).toHaveLength(6);
    expect(r.archived[0]).toMatchObject({ id: 'E0', outcome: 'Line Lifted', tier: 'success' });
    expect(r.competencies.scientific?.evaluations).toBe(FULL_EVALUATIONS_KEPT + 6);
  });

  it('a corrupt Training Record is backed up, not lost, and the game carries on', () => {
    const storage = memoryStorage();
    storage.setItem(KEYS.training, '{"schema":"starbridge.training","version":1,"evaluations":"oops"}');
    const u = make(storage);
    expect(u.training().evaluations).toEqual([]);
    expect(storage.getItem(`${KEYS.training}.corrupt-backup`)).toMatch(/oops/);
  });
});

describe('the Service Record (canonical)', () => {
  it('careers from before v0.7 read as Captain of the ISV Halcyon without rewriting the stored record', () => {
    const storage = memoryStorage();
    const u = make(storage);
    u.setActiveDuty(true);
    u.acceptCommission();
    const raw = storage.getItem(KEYS.canon)!;
    expect(raw).not.toMatch(/"service"/);
    const svc = make(storage).service();
    expect(svc.rank).toBe('captain');
    expect(svc.assignment.ship).toBe('ISV Halcyon');
    expect(storage.getItem(KEYS.canon)).toBe(raw);
  });
  it('a finished canonical mission files its evaluation on the Service Record, not the Training Record', () => {
    const u = make();
    u.setActiveDuty(true);
    u.acceptCommission();
    const offer = u.canon()!.offers.find((o) => o.status === 'open' && o.mission.kind === 'bridge');
    expect(offer, 'the seeded board offers a bridge mission').toBeTruthy();
    if (!offer) return;
    const r = u.startCanonical(offer.id);
    expect(r.ok).toBe(true);
    if (!r.ok || !r.session) return;
    const final = play(r.session.state, ['charge the jump drive', 'wait', 'wait', 'jump'], false);
    u.finishCanonical({ ...r.session, state: final });
    expect(u.service().evaluations).toHaveLength(1);
    expect(u.service().evaluations[0].source).toBe('canonical');
    expect(u.training().evaluations).toHaveLength(0);
  });
  it('discipline: a reprimand delays promotion review for a stated period; appeal can overturn it; it never touches anything else', () => {
    const r = restrictionFor('D-1', 'reprimand', 1000, 'Reg. 7.1: a directive refused without a stated reason.')!;
    expect(restrictionFor('D-2', 'no-action', 1000, '')).toBeNull();
    const svc = { ...defaultService(), restrictions: [r] };
    expect(eligibleFor(svc, 1000 + DAY, 'promotion-review').ok).toBe(false);
    expect(eligibleFor(svc, 1000 + DAY, { assignment: 'sensitive-diplomatic' }).ok).toBe(true);
    expect(eligibleFor(svc, 1000 + 31 * DAY, 'promotion-review').ok).toBe(true);
    const lodged = lodgeAppeal(r, 'I was saving lives.', 2000);
    expect(lodged.appeal.status).toBe('lodged');
    const won = decideAppeal(lodged, true, 'Mitigated: lifesaving response under way.');
    expect(activeRestrictions({ ...svc, restrictions: [won] }, 1000 + DAY)).toEqual([]);
    expect(serviceOf(null).rank).toBe('captain');
  });
});

void playT;
