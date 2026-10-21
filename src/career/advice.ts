/**
 * v0.7.1: training advice from the Training Record. Words, never numbers: what the evidence says
 * about the captain's competencies, and which catalogue simulations exercise what needs work.
 * Pure: the caller supplies the record and the catalogue (with each simulation's evaluated
 * competencies from its evaluation descriptor).
 */
import type { CompetencyId, TrainingRecord } from '../evaluation/types';
import { BAND_LABEL, COMPETENCIES, competencyLabel } from '../evaluation/competencies';
import { competencyViews } from '../evaluation/record';

export interface CatalogueEntry {
  trainingId: string;
  /** "Training Simulation 002: Quarantine at Tallis Gate" */
  title: string;
  /** Short spoken name ("Quarantine at Tallis Gate"). */
  name: string;
  competencies: CompetencyId[];
}

/** What the bridge knows about the captain's training (display data stamped by the app; never parsed). */
export interface CareerBrief {
  /** Evaluations on file (full and archived). */
  assessed: number;
  strengths: string[];
  concerns: string[];
  /** "Diplomacy: Developing" lines for assessed competencies. */
  bands: string[];
  /** One evidence sentence for the leading concern / strength. */
  evidence: string[];
  latest: { title: string; outcome: string; conduct: string } | null;
  /** Recommended simulations with a reason, best first (at most 3). */
  recommend: { name: string; why: string }[];
  /** Training recommended by the most recent report. */
  training: string[];
}

const join = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export function trainingAdvice(r: TrainingRecord, catalogue: CatalogueEntry[]): CareerBrief {
  const views = competencyViews(r);
  const assessed = r.evaluations.length + r.archived.length;
  const ledger = (id: CompetencyId) => r.competencies[id];
  const concernIds = COMPETENCIES.map((c) => c.id).filter((id) => {
    const l = ledger(id);
    return !!l && l.concern > 0 && l.concern >= l.strength;
  });
  const strengthIds = COMPETENCIES.map((c) => c.id).filter((id) => {
    const l = ledger(id);
    return !!l && l.strength > 0 && l.strength > l.concern;
  });
  const ranTitle = new Set([...r.evaluations.map((e) => e.title), ...r.archived.map((a) => a.title)]);
  const untested = new Set(COMPETENCIES.map((c) => c.id).filter((id) => !ledger(id) || ledger(id)!.evaluations === 0));
  const scored = catalogue.map((sim, order) => {
    const work = sim.competencies.filter((c) => concernIds.includes(c));
    const fresh = sim.competencies.filter((c) => untested.has(c));
    const ran = ranTitle.has(sim.title);
    const score = work.length * 4 + fresh.length * 2 + (ran ? 0 : 1);
    const why = work.length
      ? `it exercises ${join(work.map((c) => competencyLabel(c).toLowerCase()))}, where your record shows concern`
      : fresh.length
        ? `it assesses ${join(fresh.map((c) => competencyLabel(c).toLowerCase()))}, which your record has not yet assessed`
        : ran
          ? `a rerun builds evidence in ${join(sim.competencies.map((c) => competencyLabel(c).toLowerCase()))}`
          : `it assesses ${join(sim.competencies.map((c) => competencyLabel(c).toLowerCase()))}`;
    return { name: sim.name, why, score, order };
  });
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  const lastFull = r.evaluations[r.evaluations.length - 1];
  const byId = new Map(views.map((v) => [v.id, v]));
  const evidence = [concernIds[0], strengthIds[0]]
    .filter(Boolean)
    .map((id) => byId.get(id as CompetencyId)?.evidence[0])
    .filter((x): x is string => !!x);
  return {
    assessed,
    strengths: strengthIds.map(competencyLabel),
    concerns: concernIds.map(competencyLabel),
    bands: views.filter((v) => v.band !== 'unassessed').map((v) => `${v.label}: ${BAND_LABEL[v.band]}`),
    evidence,
    latest: lastFull ? { title: lastFull.title.replace(/^Training Simulation \d+: /, ''), outcome: lastFull.outcome.title, conduct: lastFull.conduct } : null,
    recommend: scored.slice(0, 3).map(({ name, why }) => ({ name, why })),
    training: lastFull?.recommended.slice(0, 2) ?? [],
  };
}

export const EMPTY_BRIEF: CareerBrief = { assessed: 0, strengths: [], concerns: [], bands: [], evidence: [], latest: null, recommend: [], training: [] };
