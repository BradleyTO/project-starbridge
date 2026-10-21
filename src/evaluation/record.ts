/**
 * v0.7 Training Record (starbridge.training.v1): after-action evaluations of simulations and the
 * competency ledgers they feed. Never canon. Old evaluations are compressed into the archive
 * (title, outcome, conduct, date) and their evidence stays in the tallies: nothing meaningful is
 * silently erased.
 */
import { BAND_ORDER, COMPETENCIES, bandOf } from './competencies';
import type { ArchivedEvaluation, Band, CompetencyId, CompetencyLedger, Evaluation, EvidenceItem, TrainingRecord } from './types';

export const FULL_EVALUATIONS_KEPT = 60;
export const ARCHIVE_KEPT = 2000;
export const RECENT_EVIDENCE = 6;

export const defaultTraining = (): TrainingRecord => ({ schema: 'starbridge.training', version: 1, evaluations: [], archived: [], competencies: {}, qualifications: [] });

export function isTraining(v: unknown): boolean {
  const t = v as Partial<TrainingRecord>;
  return !!t && Array.isArray(t.evaluations) && Array.isArray(t.archived) && !!t.competencies && typeof t.competencies === 'object' && Array.isArray(t.qualifications);
}

export const archivedOf = (e: Evaluation): ArchivedEvaluation => ({ id: e.id, scenarioId: e.scenarioId, title: e.title, outcome: e.outcome.title, tier: e.outcome.tier, conduct: e.conduct, atIso: e.atIso });

/** File an evaluation (idempotent by id): keep it in full, fold its evidence into the ledgers. */
export function fileEvaluation(r: TrainingRecord, e: Evaluation): TrainingRecord {
  if (r.evaluations.some((x) => x.id === e.id) || r.archived.some((x) => x.id === e.id)) return r;
  const competencies = { ...r.competencies };
  const touched = new Set<CompetencyId>();
  for (const ev of e.competencies) {
    const prev: CompetencyLedger = competencies[ev.id] ?? { strength: 0, concern: 0, evaluations: 0, recent: [] };
    const item: EvidenceItem = { evaluationId: e.id, title: e.title, outcome: e.outcome.title, sign: ev.sign, why: ev.why, atIso: e.atIso };
    competencies[ev.id] = {
      strength: prev.strength + (ev.sign === 'strength' ? ev.weight : 0),
      concern: prev.concern + (ev.sign === 'concern' ? ev.weight : 0),
      evaluations: prev.evaluations + (touched.has(ev.id) ? 0 : 1),
      recent: [...prev.recent, item].slice(-RECENT_EVIDENCE),
    };
    touched.add(ev.id);
  }
  const all = [...r.evaluations, e];
  const overflow = all.length - FULL_EVALUATIONS_KEPT;
  const evaluations = overflow > 0 ? all.slice(overflow) : all;
  const archived = overflow > 0 ? [...r.archived, ...all.slice(0, overflow).map(archivedOf)].slice(-ARCHIVE_KEPT) : r.archived;
  return { ...r, evaluations, archived, competencies };
}

export interface CompetencyView {
  id: CompetencyId;
  label: string;
  band: Band;
  /** Evidence in words (most recent first): no numbers. */
  evidence: string[];
}

export function competencyViews(r: TrainingRecord): CompetencyView[] {
  return COMPETENCIES.map((c) => {
    const l = r.competencies[c.id];
    const evidence = (l?.recent ?? [])
      .slice()
      .reverse()
      .slice(0, 3)
      .map((x) => `${x.sign === 'strength' ? 'Strength' : 'Concern'} in ${x.title}, ${x.outcome}: ${x.why}`);
    return { id: c.id, label: c.label, band: bandOf(l), evidence };
  });
}

export const bandRank = (b: Band) => BAND_ORDER.indexOf(b);
