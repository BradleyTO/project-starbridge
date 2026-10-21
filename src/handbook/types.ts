/** ISA-COM-001 regulation database types (v0.8.0). */
export type ChapterId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'T';
export type LegalStatus = 'in-force' | 'provisional';
export type EnforcementStatus = 'evaluated' | 'partial' | 'not-yet';

export interface HandbookChapter {
  id: ChapterId;
  title: string;
  summary: string;
}

export interface HandbookSection {
  id: string;
  title: string;
  /** Markdown subset: paragraphs, lists, **bold**, *italic*, `code`. */
  body: string;
}

export interface TrainingRef {
  /** Training simulation catalogue number. */
  simulation: number;
  title: string;
  /** Spoiler-safe training purpose. */
  purpose: string;
  /** A simulation that is planned and not yet in the archive. */
  planned?: boolean;
  /** Even the purpose would hint at the simulation; shown only after the captain has run it. */
  afterPlayed?: boolean;
}

export interface Revision {
  rev: number;
  edition: string;
  title: string;
  text: string;
}

export interface HandbookArticle {
  /** Permanent identifier (never changes, never reused). */
  id: string;
  chapter: ChapterId;
  /** Article number in this edition ("B.1", "T.4"). */
  number: string;
  citation: string;
  /** Earlier citation, for articles that predate the First Edition. */
  formerly?: string;
  /** Treaty the article reproduces (Annex T). */
  instrument?: string;
  title: string;
  origin: 'existing-unchanged' | 'existing-reworded' | 'new';
  /** Authoritative text: only this is the regulation. */
  text: string;
  explanation: string;
  appliesWhen: string;
  exceptions: string;
  examples: { proper: string; improper: string };
  related: string[];
  training: TrainingRef[];
  /** Current revision number (the last entry of revisions). */
  revision: number;
  revisions: Revision[];
  legalStatus: LegalStatus;
  /** How far the game checks the article. The note may describe a simulation: noteSimulations lists those it names. */
  enforcement: { status: EnforcementStatus; note: string; noteSimulations?: number[] };
  /** Search aliases. */
  topics: string[];
}
