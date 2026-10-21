/** Competencies and their bands (words, never numbers on screen). */
import type { Band, CompetencyId, CompetencyLedger } from './types';

export const COMPETENCIES: readonly { id: CompetencyId; label: string }[] = [
  { id: 'diplomacy', label: 'Diplomacy' },
  { id: 'tactical', label: 'Tactical judgment' },
  { id: 'scientific', label: 'Scientific reasoning' },
  { id: 'engineering', label: 'Engineering coordination' },
  { id: 'emergency', label: 'Emergency leadership' },
  { id: 'ethics', label: 'Ethical judgment' },
  { id: 'crew', label: 'Crew management' },
  { id: 'exploration', label: 'Exploration' },
  { id: 'resources', label: 'Resource management' },
  { id: 'communications', label: 'Communications' },
  { id: 'analysis', label: 'Analysis' },
];

export const BAND_LABEL: Record<Band, string> = {
  unassessed: 'Not yet assessed',
  developing: 'Developing',
  competent: 'Competent',
  proficient: 'Proficient',
  distinguished: 'Distinguished',
};

export const BAND_ORDER: readonly Band[] = ['unassessed', 'developing', 'competent', 'proficient', 'distinguished'];

export const competencyLabel = (id: CompetencyId) => COMPETENCIES.find((c) => c.id === id)?.label ?? id;

/**
 * Deterministic band from the ledger. Concerns weigh against strengths; higher bands need
 * evidence from several evaluations, so one lucky run cannot make anyone Distinguished.
 */
export function bandOf(l: CompetencyLedger | undefined): Band {
  if (!l || l.evaluations === 0) return 'unassessed';
  const net = l.strength - l.concern;
  if (net >= 14 && l.evaluations >= 5 && l.concern * 3 <= l.strength) return 'distinguished';
  if (net >= 7 && l.evaluations >= 3) return 'proficient';
  if (net >= 3 && l.evaluations >= 2) return 'competent';
  return 'developing';
}
