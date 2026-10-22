/**
 * The ISA-COM-001 regulation database API (v0.8.2: First Edition). Pure data and functions: no state, no side effects.
 *
 * The player reads the code: the preamble, Articles 1–11 with their numbered subsections, and the Annex (code.ts).
 * Every regulation the game cites has a permanent id (articles.ts) that maps to one or more subsections; ids and
 * the internal notes (commentary, training references, enforcement) are never shown to the player.
 */
import { ARTICLES, INTERNAL_FRONT_MATTER } from './articles';
import { ANNEX, ANNEX_NOTE, ANNEX_TITLE, CODE, PREAMBLE } from './code';
import type { AnnexProvision, CodeSubsection, HandbookArticle, TrainingRef } from './types';

export { ANNEX, ANNEX_NOTE, ANNEX_TITLE, ARTICLES, CODE, INTERNAL_FRONT_MATTER, PREAMBLE };
export type * from './types';

export const HANDBOOK = {
  code: 'ISA-COM-001',
  title: "Captain's Code and Operational Regulations",
  issuer: 'Intergalactic Space Agency (ISA)',
  issuedBy: 'Issued by ISA Fleet Command to commanding officers of ISA vessels',
  edition: 'First Edition',
  revision: 1,
} as const;

/** What the Captain's Handbook shows: the contents, one article of the code (optionally at a subsection), or search results. */
export type HandbookView = { kind: 'contents' } | { kind: 'part'; part: string; section?: string } | { kind: 'search'; query: string };

/** A subsection of the code or a provision of the Annex, as the reader shows it. */
export interface Section {
  number: string;
  text: string;
  /** Internal. */
  id: string;
  /** "3" for Article 3, "T" for the Annex. */
  part: string;
  partTitle: string;
  annex?: AnnexProvision;
}

export const SECTIONS: readonly Section[] = [
  ...CODE.flatMap((a) => a.subsections.map((s: CodeSubsection) => ({ number: s.number, text: s.text, id: s.id, part: String(a.number), partTitle: a.title }))),
  ...ANNEX.map((x) => ({ number: x.number, text: x.text, id: x.id, part: 'T', partTitle: ANNEX_TITLE, annex: x })),
];
export const PARTS: readonly { part: string; label: string; title: string; first: string; last: string }[] = [
  ...CODE.map((a) => ({ part: String(a.number), label: `Article ${a.number}`, title: a.title, first: a.subsections[0].number, last: a.subsections.at(-1)!.number })),
  { part: 'T', label: 'Annex', title: ANNEX_TITLE, first: ANNEX[0].number, last: ANNEX.at(-1)!.number },
];

const BY_ID = new Map(ARTICLES.map((a) => [a.id, a]));
const BY_NUMBER = new Map(SECTIONS.map((s) => [s.number, s]));

export function article(id: string): HandbookArticle | undefined {
  return BY_ID.get(id);
}
export function section(number: string): Section | undefined {
  return BY_NUMBER.get(number);
}
export function part(p: string) {
  return PARTS.find((x) => x.part === p);
}
export function partSections(p: string): Section[] {
  return SECTIONS.filter((s) => s.part === p);
}
/** The player-facing label of a subsection: "§3.3 Use of Force", "Annex T.2, Border Accords, Art. 4". */
export function sectionLabel(number: string): string | undefined {
  const s = BY_NUMBER.get(number);
  if (!s) return undefined;
  return s.annex ? `Annex ${s.number}, ${s.annex.instrument}` : `§${s.number} ${s.partTitle}`;
}
/** How a citation of a regulation id is shown in reports and the Service Record (never the id itself). */
export function citationLabel(id: string | undefined): string | undefined {
  const a = id ? BY_ID.get(id) : undefined;
  return a && sectionLabel(a.number);
}
/** The view that opens a regulation id at its subsection. */
export function viewOf(id: string): HandbookView | undefined {
  const a = BY_ID.get(id);
  const s = a && BY_NUMBER.get(a.number);
  return s && { kind: 'part', part: s.part, section: s.number };
}
/** The text of a regulation as it stood at a revision (the latest revision at or before rev). */
export function textAt(id: string, rev: number): { title: string; text: string } | undefined {
  const a = BY_ID.get(id);
  const r = a?.revisions.filter((x) => x.rev <= rev).at(-1);
  return r && { title: r.title, text: r.text };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/§/g, ' s ')
    .replace(/[^a-z0-9.'\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** A regulation by id or earlier citation ("roe-1", "Reg. 7.2", "Regulation 12", "Rules of Engagement §1", "Border Accords, Art. 4", "B.1"). */
function byCitation(lower: string, q: string): HandbookArticle | undefined {
  const byId = BY_ID.get(lower) ?? BY_ID.get(lower.replace(/\s+/g, '-'));
  if (byId) return byId;
  const reg = /^reg(?:ulation)?\.?\s*(\d+(?:\.\d+)?)$/.exec(lower);
  if (reg) return BY_ID.get(`reg-${reg[1]}`);
  const roe = /^(?:roe|rules of engagement)\s*(?:§|s|section)?\s*(\d)$/.exec(lower);
  if (roe) return BY_ID.get(`roe-${roe[1]}`);
  const nq = norm(q);
  // "Rules of Engagement §1" names roe-1; a bare instrument name ("Border Accords") is a search, not a citation.
  return ARTICLES.find((a) => a.formerly && (norm(a.formerly) === nq || (/\d/.test(nq) && norm(a.formerly.split(',')[0]) === nq)));
}

/**
 * Resolve a citation to a place in the code: a subsection ("3.3", "§3.3", "section 3.3", "Art. 3.3"), an article
 * ("Art. 3", "Article 3", "§3", "the Annex"), an Annex provision ("T.2", "Annex T.2"), a permanent id ("roe-1"),
 * an earlier citation ("Reg. 7.2", "Rules of Engagement §1", "Code of Conduct §9") or a draft number ("B.1").
 */
export function resolve(raw: string): { part: string; section?: string } | undefined {
  const q = raw.trim().replace(/[?!:,;]+$/, '').replace(/\.$/, '');
  if (!q) return undefined;
  const lower = q.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  const cited = byCitation(lower, q);
  if (cited) return { part: BY_NUMBER.get(cited.number)!.part, section: cited.number };
  const num = lower
    .replace(/^isa-com-001\s*,?\s*/, '')
    .replace(/^(?:the\s+)?(?:art(?:icle)?\.?|section|sec\.?|subsection|para(?:graph)?\.?|§|s\.)\s*/, '')
    .replace(/^§\s*/, '')
    .replace(/\s+/g, '');
  if (/^(?:the)?annex(?:t)?$/.test(num)) return { part: 'T' };
  let m = /^(\d{1,2})\.(\d{1,2})$/.exec(num);
  if (m && BY_NUMBER.has(`${Number(m[1])}.${Number(m[2])}`)) return { part: String(Number(m[1])), section: `${Number(m[1])}.${Number(m[2])}` };
  m = /^(\d{1,2})$/.exec(num);
  if (m && part(String(Number(m[1])))) return { part: String(Number(m[1])) };
  m = /^(?:annex)?t\.?(\d)$/.exec(num);
  if (m && BY_NUMBER.has(`T.${m[1]}`)) return { part: 'T', section: `T.${m[1]}` };
  // Draft numbers ("B.1", "Art. D.7"): aliases for the regulation, now at its First Edition subsection.
  m = /^([a-i])\.?(\d{1,2})$/.exec(num);
  if (m) {
    const d = `${m[1].toUpperCase()}.${Number(m[2])}`;
    const a = ARTICLES.find((x) => x.internal.draftNumber === d);
    if (a) return { part: BY_NUMBER.get(a.number)!.part, section: a.number };
  }
  return undefined;
}

/** The regulation a citation names (id, earlier citation, draft number or subsection number). */
export function resolveArticle(raw: string): HandbookArticle | undefined {
  const r = resolve(raw);
  return r?.section ? BY_ID.get(BY_NUMBER.get(r.section)!.id) : undefined;
}
/** The regulation a prose citation such as "Reg. 7.2: A directive may be declined …" refers to. */
export function citedArticle(prose: string): HandbookArticle | undefined {
  return resolveArticle(prose.split(':')[0]);
}

const STOP = new Set('a an the of on in to for and or is are what which who whom how do does about regarding regulation regulations rule rules article articles handbook law laws me show tell say our my we us any there that this it be with by from when can may i shall not'.split(' '));
const stem = (w: string) => w.replace(/'s$/, '').replace(/(?:ies)$/, 'y').replace(/(?:ing|ed|es|s)$/, '') || w;
const words = (s: string) => norm(s).split(/[ \-.]+/).filter((w) => w && !STOP.has(w)).map(stem);

export interface SearchHit {
  section: Section;
  score: number;
  /** Why it matched: 'number' (a citation), 'topic', or 'text'. */
  match: 'number' | 'topic' | 'text';
}

const RECORD_WORDS = new Map(
  ARTICLES.map((a) => [a.id, { topics: new Set(a.topics.flatMap(words)), title: new Set(words(a.title)), text: new Set(words(a.text)), notes: new Set(words(`${a.internal.explanation} ${a.internal.appliesWhen} ${a.internal.exceptions}`)) }]),
);
const SECTION_WORDS = new Map(SECTIONS.map((s) => [s.number, { text: new Set(words(s.text)), part: new Set(words(s.partTitle)) }]));

/**
 * Ranked search over the code. A citation (subsection or article number, id, earlier citation) names its
 * subsection or article and nothing else; otherwise regulations are scored on their topic aliases, title, text
 * and internal notes, and each of their subsections on its own text and its article's title.
 */
export function search(query: string, limit = 12): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const exact = resolve(q);
  if (exact) return (exact.section ? [BY_NUMBER.get(exact.section)!] : partSections(exact.part)).map((s) => ({ section: s, score: 1000, match: 'number' as const }));
  const nq = norm(q);
  const qw = words(q);
  const recScore = new Map<string, { score: number; topic: boolean }>();
  for (const a of ARTICLES) {
    let score = 0;
    let topic = false;
    for (const t of a.topics) {
      const nt = norm(t);
      if (nt === nq) { score += 60; topic = true; }
      else if (nt.length > 3 && ` ${nq} `.includes(` ${nt} `)) { score += 25 + nt.split(' ').length * 5; topic = true; }
    }
    const w = RECORD_WORDS.get(a.id)!;
    let all = qw.length > 0;
    for (const x of qw) {
      let s = 0;
      if (w.title.has(x)) s += 12;
      if (w.topics.has(x)) { s += 8; topic = true; }
      if (w.text.has(x)) s += 4;
      if (w.notes.has(x)) s += 1;
      if (!s) all = false;
      score += s;
    }
    if (all && qw.length > 1) score += 10;
    recScore.set(a.id, { score, topic });
  }
  const hits: SearchHit[] = [];
  for (const s of SECTIONS) {
    const r = recScore.get(s.id)!;
    const w = SECTION_WORDS.get(s.number)!;
    let own = 0;
    for (const x of qw) {
      if (w.text.has(x)) own += 3;
      if (w.part.has(x)) own += 2;
    }
    const score = r.score + own;
    if (score > 0 && (r.score > 0 || own >= 3)) hits.push({ section: s, score, match: r.topic ? 'topic' : 'text' });
  }
  return hits.sort((x, y) => y.score - x.score || SECTIONS.indexOf(x.section) - SECTIONS.indexOf(y.section)).slice(0, limit);
}

/** Scenario ids whose simulation the captain has run, from the Training Record. */
export function playedScenarios(training: { evaluations: { scenarioId: string }[]; archived: { scenarioId: string }[] } | null | undefined): Set<string> {
  const s = new Set<string>();
  for (const e of training?.evaluations ?? []) s.add(e.scenarioId);
  for (const e of training?.archived ?? []) s.add(e.scenarioId);
  return s;
}

/**
 * Internal (future crew knowledge): the training references a crew member may mention to this captain. An
 * after-played reference stays withheld until the Training Record shows its simulation was run. Never shown in
 * the handbook.
 */
export function visibleTraining(a: HandbookArticle, played: Set<string>, scenarioOf: (n: number) => string | undefined): TrainingRef[] {
  return a.internal.training.filter((t) => !t.afterPlayed || (scenarioOf(t.simulation) !== undefined && played.has(scenarioOf(t.simulation)!)));
}
/** Internal: may the enforcement note be used with this captain (it may name a simulation not yet run)? */
export function enforcementNoteVisible(a: HandbookArticle, played: Set<string>, scenarioOf: (n: number) => string | undefined): boolean {
  if (visibleTraining(a, played, scenarioOf).length < a.internal.training.length) return false;
  return (a.internal.enforcement.noteSimulations ?? []).every((n) => {
    const id = scenarioOf(n);
    return id !== undefined && played.has(id);
  });
}
