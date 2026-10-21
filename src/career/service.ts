/**
 * v0.7 Service Record foundations (canonical, written only through the commit gate).
 *
 * Stored on CanonicalState.service (optional: careers from v0.6.1 and earlier read as the
 * default record, so nothing needs rewriting on load). v0.7 uses it for rank-aware address and
 * canonical after-action evaluations; promotions, transfers and boards of inquiry come later.
 */
import type { ArchivedEvaluation, Evaluation, Qualification } from '../evaluation/types';
import { archivedOf } from '../evaluation/record';
import type { RankId } from './ranks';

export const SERVICE_EVALUATIONS_KEPT = 40;

/**
 * A temporary effect of a disciplinary finding. It may delay promotion review or limit specific
 * sensitive assignments for a stated period of canonical time, and it can be appealed. It never
 * locks simulations, ends the career, removes the captain from their ship, costs credits or
 * hides content. (Data model only in v0.7.)
 */
export interface DisciplinaryRestriction {
  id: string;
  caseId: string;
  affects: 'promotion-review' | 'assignment';
  /** For 'assignment': which postings (e.g. 'sensitive-diplomatic'). */
  scope: string;
  reason: string;
  from: number;
  /** Canonical minute it lapses. */
  until: number;
  appeal: { status: 'none' | 'lodged' | 'upheld' | 'overturned'; statement?: string; at?: number; finding?: string };
}

/**
 * v0.7 model only (no flow yet): losing the Halcyon on Active Duty convenes a board of inquiry.
 * The captain survives and continues on another vessel, keeping history and qualifications.
 */
export interface BoardOfInquiry {
  missionId: string;
  convenedAt: number;
  status: 'convened' | 'cleared' | 'censured';
  finding?: string;
  /** The vessel the captain continues on. */
  nextCommand?: string;
}

export interface ServiceRecord {
  rank: RankId;
  rankHistory: { rank: RankId; at: number; atIso: string; reason: string }[];
  assignment: { ship: string; shipClass: string; position: string; since: number };
  qualifications: Qualification[];
  commendations: { id: string; title: string; citation: string; missionId: string | null }[];
  restrictions: DisciplinaryRestriction[];
  inquiries: BoardOfInquiry[];
  /** After-action evaluations of canonical missions (Active Duty). */
  evaluations: Evaluation[];
  archivedEvaluations: ArchivedEvaluation[];
}

export function defaultService(since = 0): ServiceRecord {
  return {
    rank: 'captain',
    rankHistory: [],
    assignment: { ship: 'ISV Halcyon', shipClass: 'Halcyon-class survey cruiser', position: 'Commanding officer', since },
    qualifications: [],
    commendations: [],
    restrictions: [],
    inquiries: [],
    evaluations: [],
    archivedEvaluations: [],
  };
}

/** The service record of a canonical career (the default for careers that predate v0.7). */
export function serviceOf(c: { service?: ServiceRecord; commission?: { at: number } } | null): ServiceRecord {
  if (!c) return defaultService();
  return c.service ?? defaultService(c.commission?.at ?? 0);
}

/** File a canonical evaluation (idempotent), compressing the oldest into the archive. */
export function fileServiceEvaluation(svc: ServiceRecord, e: Evaluation): ServiceRecord {
  if (svc.evaluations.some((x) => x.id === e.id) || svc.archivedEvaluations.some((x) => x.id === e.id)) return svc;
  const all = [...svc.evaluations, e];
  const overflow = all.length - SERVICE_EVALUATIONS_KEPT;
  return overflow > 0 ? { ...svc, evaluations: all.slice(overflow), archivedEvaluations: [...svc.archivedEvaluations, ...all.slice(0, overflow).map(archivedOf)] } : { ...svc, evaluations: all };
}

/** Restrictions in force at canonical minute `clock` (lapsed and overturned ones excluded). */
export function activeRestrictions(svc: ServiceRecord, clock: number): DisciplinaryRestriction[] {
  return svc.restrictions.filter((r) => clock < r.until && r.appeal.status !== 'overturned');
}

export const DAY = 24 * 60;

/** What a disciplinary finding means for the record (reprimand: promotion review delayed 30 days). */
export function restrictionFor(caseId: string, finding: 'pending' | 'no-action' | 'reprimand', at: number, rule: string): DisciplinaryRestriction | null {
  if (finding !== 'reprimand') return null;
  return { id: `R-${caseId}`, caseId, affects: 'promotion-review', scope: 'all', reason: rule, from: at, until: at + 30 * DAY, appeal: { status: 'none' } };
}

export function lodgeAppeal(r: DisciplinaryRestriction, statement: string, at: number): DisciplinaryRestriction {
  if (r.appeal.status !== 'none') return r;
  return { ...r, appeal: { status: 'lodged', statement: statement.slice(0, 600), at } };
}

export function decideAppeal(r: DisciplinaryRestriction, overturned: boolean, finding: string): DisciplinaryRestriction {
  if (r.appeal.status !== 'lodged') return r;
  return { ...r, appeal: { ...r.appeal, status: overturned ? 'overturned' : 'upheld', finding } };
}

/** Eligibility check used by later phases (promotion offers, postings). */
export function eligibleFor(svc: ServiceRecord, clock: number, what: 'promotion-review' | { assignment: string }): { ok: true } | { ok: false; until: number; reason: string } {
  const r = activeRestrictions(svc, clock).find((x) => (what === 'promotion-review' ? x.affects === 'promotion-review' : x.affects === 'assignment' && (x.scope === 'all' || x.scope === what.assignment)));
  return r ? { ok: false, until: r.until, reason: r.reason } : { ok: true };
}
