/**
 * v0.8.0: the ISA-COM-001 regulation database API. Pure data and functions: no state, no side effects.
 * Every regulation cited anywhere in the game resolves here by its permanent id.
 */
import { ARTICLES, CHAPTERS, FRONT_MATTER } from './articles';
import type { ChapterId, HandbookArticle, HandbookChapter, TrainingRef } from './types';

export { ARTICLES, CHAPTERS, FRONT_MATTER };
export type * from './types';

export const HANDBOOK = {
  code: 'ISA-COM-001',
  title: "Captain's Code and Operational Regulations",
  issuer: 'Intergalactic Space Agency',
  issuedBy: 'Issued by ISA Fleet Command to commanding officers of ISA vessels',
  edition: 'First Edition, Draft 2, pending approval',
  revision: 1,
} as const;

export const ENFORCEMENT_LABEL = { evaluated: 'Evaluated', partial: 'Partially evaluated', 'not-yet': 'Not yet evaluated' } as const;
export const LEGAL_LABEL = { 'in-force': 'In force', provisional: 'Provisional' } as const;

const BY_ID = new Map(ARTICLES.map((a) => [a.id, a]));

export function article(id: string): HandbookArticle | undefined {
  return BY_ID.get(id);
}
export function chapter(id: string): HandbookChapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
export function chapterArticles(id: ChapterId): HandbookArticle[] {
  return ARTICLES.filter((a) => a.chapter === id);
}
export function chapterLabel(c: HandbookChapter): string {
  return c.id === 'T' ? c.title : `Chapter ${c.id}. ${c.title}`;
}
/** The text of an article as it stood at a revision (the latest revision at or before rev). */
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

/**
 * Resolve a citation to an article: an id ("roe-1"), an article number ("B.1", "Art. B.1", "Article T.4",
 * "Annex T.4"), or an earlier citation ("Reg. 7.2", "Regulation 12", "Rules of Engagement §1", "Border Accords Art. 4").
 */
export function resolve(raw: string): HandbookArticle | undefined {
  const q = raw.trim().replace(/[.?!:,;]+$/, '');
  if (!q) return undefined;
  const lower = q.toLowerCase().replace(/\s+/g, ' ');
  const byId = BY_ID.get(lower) ?? BY_ID.get(lower.replace(/\s+/g, '-'));
  if (byId) return byId;
  // Article number, with or without "Art." / "Article" / "Annex" / "ISA-COM-001".
  const num = lower.replace(/^(?:isa-com-001\s*)?(?:art(?:icle)?\.?\s*|annex\s*)?/, '').replace(/\s+/g, '');
  const m = /^([a-it])\.?(\d{1,2})$/.exec(num);
  if (m) {
    const n = `${m[1].toUpperCase()}.${Number(m[2])}`;
    const a = ARTICLES.find((x) => x.number === n);
    if (a) return a;
  }
  // Earlier citations ("Reg. 7.2", "Regulation 7.2", "Reg 12").
  const reg = /^reg(?:ulation)?\.?\s*(\d+(?:\.\d+)?)$/.exec(lower);
  if (reg) return BY_ID.get(`reg-${reg[1]}`);
  const roe = /^(?:roe|rules of engagement)\s*(?:§|s|section)?\s*(\d)$/.exec(lower);
  if (roe) return BY_ID.get(`roe-${roe[1]}`);
  const nq = norm(q);
  return ARTICLES.find((a) => a.formerly && (norm(a.formerly) === nq || norm(a.formerly.split(',')[0]) === nq || norm(a.formerly).startsWith(`${nq},`)));
}

/** The article a prose citation such as "Reg. 7.2: A directive may be declined …" refers to. */
export function citedArticle(prose: string): HandbookArticle | undefined {
  return resolve(prose.split(':')[0]);
}

const STOP = new Set('a an the of on in to for and or is are what which who whom how do does about regarding regulation regulations rule rules article articles handbook law laws me show tell say our my we us any there that this it be with by from when can may i'.split(' '));
const stem = (w: string) => w.replace(/'s$/, '').replace(/(?:ies)$/, 'y').replace(/(?:ing|ed|es|s)$/, '') || w;
const words = (s: string) => norm(s).split(/[ \-.]+/).filter((w) => w && !STOP.has(w)).map(stem);

export interface SearchHit {
  article: HandbookArticle;
  score: number;
  /** Why it matched: 'number' (exact citation), 'topic', or 'text'. */
  match: 'number' | 'topic' | 'text';
}

/**
 * Ranked search. An exact citation (number, id or earlier citation) comes first, then topic aliases
 * (whole-phrase matches outrank single words), then title, authoritative text and commentary.
 */
export function search(query: string, limit = 12): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const exact = resolve(q);
  // A citation names one article: nothing else is a match for "B.1" or "Reg. 7.2".
  if (exact) return [{ article: exact, score: 1000, match: 'number' }];
  const nq = norm(q);
  const qw = words(q);
  const hits: SearchHit[] = [];
  for (const a of ARTICLES) {
    let score = 0;
    let topic = false;
    for (const t of a.topics) {
      const nt = norm(t);
      if (nt === nq) { score += 60; topic = true; }
      else if (nt.length > 3 && ` ${nq} `.includes(` ${nt} `)) { score += 25 + nt.split(' ').length * 5; topic = true; }
    }
    if (qw.length) {
      const tw = new Set(a.topics.flatMap(words));
      const ti = new Set(words(a.title));
      const tx = new Set(words(a.text));
      const cm = new Set(words(`${a.explanation} ${a.appliesWhen} ${a.exceptions}`));
      let all = true;
      for (const w of qw) {
        let s = 0;
        if (ti.has(w)) s += 12;
        if (tw.has(w)) { s += 8; topic = true; }
        if (tx.has(w)) s += 4;
        if (cm.has(w)) s += 1;
        if (!s) all = false;
        score += s;
      }
      if (all && qw.length > 1) score += 10;
    }
    if (score > 0) hits.push({ article: a, score, match: topic ? 'topic' : 'text' });
  }
  return hits.sort((x, y) => y.score - x.score || ARTICLES.indexOf(x.article) - ARTICLES.indexOf(y.article)).slice(0, limit);
}

/** Scenario ids whose simulation the captain has run, from the Training Record. */
export function playedScenarios(training: { evaluations: { scenarioId: string }[]; archived: { scenarioId: string }[] } | null | undefined): Set<string> {
  const s = new Set<string>();
  for (const e of training?.evaluations ?? []) s.add(e.scenarioId);
  for (const e of training?.archived ?? []) s.add(e.scenarioId);
  return s;
}

/**
 * Training references a captain may see: an after-played reference stays hidden until the Training
 * Record shows its simulation was run. scenarioOf maps a catalogue number to its scenario id.
 */
export function visibleTraining(a: HandbookArticle, played: Set<string>, scenarioOf: (n: number) => string | undefined): TrainingRef[] {
  return a.training.filter((t) => !t.afterPlayed || (scenarioOf(t.simulation) !== undefined && played.has(scenarioOf(t.simulation)!)));
}
/** True while any of an article's references is still hidden (its enforcement note may hint at the same simulation). */
export function hasHiddenTraining(a: HandbookArticle, played: Set<string>, scenarioOf: (n: number) => string | undefined): boolean {
  return visibleTraining(a, played, scenarioOf).length < a.training.length;
}
/**
 * May the enforcement note be shown? Not while it names a simulation the captain has not run, or while
 * any of the article's training references is still hidden (the note may hint at the same simulation).
 */
export function enforcementNoteVisible(a: HandbookArticle, played: Set<string>, scenarioOf: (n: number) => string | undefined): boolean {
  if (hasHiddenTraining(a, played, scenarioOf)) return false;
  return (a.enforcement.noteSimulations ?? []).every((n) => {
    const id = scenarioOf(n);
    return id !== undefined && played.has(id);
  });
}
