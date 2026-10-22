/** ISA-COM-001 regulation database types (v0.8.2: First Edition). */
export type LegalStatus = 'in-force' | 'provisional';
export type EnforcementStatus = 'evaluated' | 'partial' | 'not-yet';

/** One numbered subsection of the code ("3.3"): a single rule. */
export interface CodeSubsection {
  number: string;
  text: string;
  /** Permanent id of the regulation the subsection belongs to (internal; never shown). */
  id: string;
  /** Other ids whose substance the subsection also carries (internal). */
  also: string[];
}

/** One of the code's articles (Article 1 to 11). */
export interface CodeArticle {
  number: number;
  title: string;
  subsections: CodeSubsection[];
}

/** One treaty provision reproduced in the Annex ("T.2"). */
export interface AnnexProvision {
  number: string;
  /** Permanent id (internal). */
  id: string;
  instrument: string;
  title: string;
  text: string;
  provisional: boolean;
}

export interface HandbookSection {
  id: string;
  title: string;
  /** Markdown subset. */
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
  /** Even the purpose would hint at the simulation: usable only after the captain has run it. */
  afterPlayed?: boolean;
}

export interface Revision {
  rev: number;
  edition: string;
  title: string;
  text: string;
}

/** Hidden internal data: for the evaluator and future crew knowledge. Never shown to the player. */
export interface InternalNotes {
  /** Draft 3 number ("B.1"): a search alias only. */
  draftNumber?: string;
  /** Draft 3 wording (never issued; not a revision). */
  draftText?: string;
  explanation: string;
  appliesWhen: string;
  exceptions: string;
  examples: { proper: string; improper: string };
  related: string[];
  training: TrainingRef[];
  /** How far the game checks the regulation. The note may describe a simulation: noteSimulations lists those it names. */
  enforcement: { status: EnforcementStatus; note: string; noteSimulations?: number[] };
}

/** A permanent regulation record. The player sees only its subsections' text, never the record. */
export interface HandbookArticle {
  /** Permanent identifier (never changes, never reused). */
  id: string;
  /** Display subsection ("3.3", "T.2"): the first of `sections`. */
  number: string;
  /** Subsections whose primary id this is, in order. */
  sections: string[];
  /** Player-facing citation ("§3.3 Use of Force", "Annex T.2, Border Accords, Art. 4"). */
  citation: string;
  /** Pre-edition citation (v0.7), for the 15 ids that predate the First Edition. */
  formerly?: string;
  /** Treaty the record reproduces (Annex). */
  instrument?: string;
  /** Internal short title. */
  title: string;
  origin: 'existing-unchanged' | 'existing-reworded' | 'new';
  /** Revision 1: the First Edition text of its subsections, joined. */
  text: string;
  revision: number;
  revisions: Revision[];
  legalStatus: LegalStatus;
  /** Search aliases. */
  topics: string[];
  internal: InternalNotes;
}
