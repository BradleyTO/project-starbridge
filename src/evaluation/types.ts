/**
 * v0.7 Evaluation & Records Foundation: types.
 *
 * An Evaluation is the ISA's after-action assessment of one run. It judges outcomes and
 * judgment (objectives, decisions, safety, regulations), never command sequences, and it
 * carries no numeric score: competencies are shown as words backed by evidence.
 */
import type { WorldState } from '../engine/types';

export type CompetencyId =
  | 'diplomacy'
  | 'tactical'
  | 'scientific'
  | 'engineering'
  | 'emergency'
  | 'ethics'
  | 'crew'
  | 'exploration'
  | 'resources'
  | 'communications'
  | 'analysis';

export type Band = 'unassessed' | 'developing' | 'competent' | 'proficient' | 'distinguished';
export type Tier = 'success' | 'partial' | 'failure';
export type Judgment = 'responsible' | 'reckless' | 'principled' | 'decisive';
/** Overall conduct in words (no score). */
export type Conduct = 'exemplary' | 'sound' | 'insufficient' | 'mixed' | 'reckless' | 'principled';

export interface Finding {
  text: string;
  /** What in the run supports it (a turn, a fact, an order). */
  evidence?: string;
}

export interface CompetencyEvidence {
  id: CompetencyId;
  sign: 'strength' | 'concern';
  /** Internal weight (1–3). Never shown. */
  weight: 1 | 2 | 3;
  why: string;
}

export interface Evaluation {
  id: string;
  source: 'simulation' | 'canonical';
  /** Simulation run id or canonical mission id. */
  refId: string;
  scenarioId: string;
  title: string;
  seed: number | string;
  atIso: string;
  turns: number;
  outcome: { id: string; title: string; summary: string; tier: Tier; note: string };
  conduct: Conduct;
  objectives: { id: string; text: string; priority: 'primary' | 'secondary'; result: 'achieved' | 'missed' | 'failed' }[];
  decisions: { turn: number; order: string; effect: string; judgment?: Judgment }[];
  crewSafety: Finding[];
  civilianSafety: Finding[];
  regulations: { id: string; title: string; applied: string }[];
  strengths: Finding[];
  improve: Finding[];
  recommended: string[];
  competencies: CompetencyEvidence[];
  /** A defensible ethical "failure": recorded as a principled decision. */
  principled?: string;
  /** Descriptor version the evaluation was made with ('none' = shared signals only). */
  basis: string;
}

/** A scenario-declared judgment marker (true on the final state when the behaviour happened). */
export interface Marker {
  id: string;
  when: (s: WorldState) => boolean;
  judgment: Judgment;
  competencies: CompetencyId[];
  text: string;
  /** Regulation id this marker relates to (from the catalogue). */
  regulation?: string;
  /** Which safety section it belongs in, if any. */
  safety?: 'crew' | 'civilian';
  /** Flag whose first appearance identifies the decision this marker judges. */
  flag?: string;
}

/**
 * v0.7: optional evaluation descriptor on a ScenarioModule. Plain data plus small predicates
 * over the final WorldState. Endings and objectives are NOT changed by it.
 */
export interface EvaluationDescriptor {
  version: string;
  objectives: Record<string, 'primary' | 'secondary'>;
  endings: Record<string, { tier: Tier; note: string }>;
  markers: Marker[];
  /** Regulations that frame this exercise (ids from the catalogue). */
  regulations: string[];
  /** Competencies this exercise mainly tests (from the roadmap's Command challenge). */
  competencies: CompetencyId[];
  /** Training to recommend when a competency shows concern. */
  recommend?: Partial<Record<CompetencyId, string>>;
}

// --------------------------------------------------------- training record --

export interface EvidenceItem {
  evaluationId: string;
  title: string;
  outcome: string;
  sign: 'strength' | 'concern';
  why: string;
  atIso: string;
}

export interface CompetencyLedger {
  /** Internal tallies (never shown): weighted strengths, concerns, and evaluations that touched it. */
  strength: number;
  concern: number;
  evaluations: number;
  /** Most recent evidence (older evidence stays in the tallies). */
  recent: EvidenceItem[];
}

/** An evaluation compressed for the long-term record (never silently erased). */
export interface ArchivedEvaluation {
  id: string;
  scenarioId: string;
  title: string;
  outcome: string;
  tier: Tier;
  conduct: Conduct;
  atIso: string;
}

export interface Qualification {
  id: string;
  title: string;
  awardedAtIso: string;
  basis: string[];
}

/** starbridge.training.v1: the Training Record. Never canon. */
export interface TrainingRecord {
  schema: 'starbridge.training';
  version: 1;
  evaluations: Evaluation[];
  archived: ArchivedEvaluation[];
  competencies: Partial<Record<CompetencyId, CompetencyLedger>>;
  qualifications: Qualification[];
}
