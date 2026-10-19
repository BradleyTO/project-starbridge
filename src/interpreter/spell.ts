/**
 * Spelling tolerance for the offline interpreter.
 *
 *  1. A small dictionary of frequent typos and run-togethers ("inbetween", "sheilds").
 *  2. Run-together splitting: an unknown token that splits cleanly into a short
 *     function word plus a vocabulary word, or two vocabulary words, is split.
 *  3. Fuzzy correction: an unknown token of 5+ letters within Damerau–Levenshtein
 *     distance 1 (2 for 8+ letters) of exactly one best vocabulary word, sharing its
 *     first letter, is replaced. Common English words are never "corrected".
 *
 * The vocabulary is derived from the parser's own patterns, so new rules
 * automatically become typo-tolerant.
 */

export const TYPOS: Record<string, string> = {
  inbetween: 'in between',
  inbetwen: 'in between',
  inbewteen: 'in between',
  'in-between': 'in between',
  betwen: 'between',
  bewteen: 'between',
  beetween: 'between',
  betweeen: 'between',
  sheild: 'shield',
  sheilds: 'shields',
  shiled: 'shield',
  shileds: 'shields',
  weapns: 'weapons',
  wepons: 'weapons',
  weopons: 'weapons',
  hial: 'hail',
  hale: 'hail',
  hailng: 'hailing',
  chanel: 'channel',
  chanell: 'channel',
  frieghter: 'freighter',
  freigter: 'freighter',
  fraighter: 'freighter',
  kestral: 'kestrel',
  kestrell: 'kestrel',
  crusier: 'cruiser',
  cruser: 'cruiser',
  crusir: 'cruiser',
  warshp: 'warship',
  postion: 'position',
  posistion: 'position',
  sensers: 'sensors',
  transpoter: 'transporter',
  tracter: 'tractor',
  intercpet: 'intercept',
  manuver: 'maneuver',
  manouver: 'maneuver',
  agressive: 'aggressive',
  hostle: 'hostile',
  hostil: 'hostile',
  threatning: 'threatening',
  'non-hostile': 'nonhostile',
  'non hostile': 'nonhostile',
  ur: 'your',
  u: 'you',
  r: 'are',
  pls: 'please',
  plz: 'please',
  thx: '',
  em: 'them',
  "'em": 'them',
};

/** Function words that may prefix a run-together ("inbetween", "upto"). */
const SHORT = new Set(['in', 'on', 'to', 'up', 'at', 'of', 'us', 'go', 'be', 'by', 'an', 'a', 'so', 'we']);

/** Common English words that must never be corrected to a nearby vocabulary word. */
export const COMMON = new Set(
  (
    'about above after again against along already also always among another answer anyone anything appear around asked away back because become been before behind being below beside best better between both bring brought call came cannot captain care carry case cause certain change clear close come could course crew dead deal does doing done down during each early either else enemy enough even ever every exactly fact fall feel find fine first follow found friend from front full gave give given going gone good great hand happen hard have having head hear heard help here high hold home hope hour however idea into itself just keep kept kind knew know known large last later least leave left less like line little live long look looks lose loss made make many matter maybe mean means meant might mind more most move much must myself name near need needs never next night none nothing notice once only open order other others ours over part people perhaps place plan play point power quite rather ready really reason right said same saying seem seems seen sense several shall short should show shown side since small some something soon sorry speak start state still stop such sure take taken talk tell than thank that their them then there these they thing think this those though thought three through time today together told took toward towards trying turn under until upon very wait want wanted wants watch water well went were what when where whether which while whole whose will with within without word words work would write wrong yeah year years your yours zero quarry signs sight stand stays still those ships vessels both board aboard ahead'
  ).split(' '),
);

/** Optimal-string-alignment Damerau–Levenshtein distance. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

/** Extract plain words (3+ letters) from regex sources to form a vocabulary. */
export function vocabularyFrom(sources: (RegExp | string)[]): Set<string> {
  const out = new Set<string>();
  for (const src of sources) {
    const text = (typeof src === 'string' ? src : src.source).replace(/\\[a-zA-Z]/g, ' ').toLowerCase();
    for (const w of text.match(/[a-z]{3,}/g) ?? []) out.add(w);
  }
  return out;
}

export class SpellCorrector {
  private readonly vocab: Set<string>;
  private readonly sorted: string[];
  constructor(vocab: Iterable<string>) {
    this.vocab = new Set(vocab);
    this.sorted = [...this.vocab].sort();
  }

  known(w: string): boolean {
    return this.vocab.has(w) || COMMON.has(w);
  }

  /** Correct a single lower-case token; returns it unchanged when unsure. */
  correctToken(w: string, protectedWords: Set<string>): string {
    if (w in TYPOS) return TYPOS[w];
    if (w.length < 4 || /[^a-z]/.test(w) || this.known(w) || protectedWords.has(w)) return w;
    // A known stem plus an inflection ("evacuate" for "evacuat", "scanning") is fine.
    if (this.sorted.some((v) => v.length >= 4 && w.startsWith(v) && w.length - v.length <= 4)) return w;
    // Run-togethers.
    for (let i = 1; i < w.length - 2; i++) {
      const l = w.slice(0, i);
      const r = w.slice(i);
      if ((SHORT.has(l) || (l.length >= 3 && this.known(l))) && r.length >= 3 && this.vocab.has(r)) return `${l} ${r}`;
    }
    if (w.length < 5) return w;
    const maxD = w.length >= 8 ? 2 : 1;
    let best: string | null = null;
    let bestD = Infinity;
    let tie = false;
    for (const v of this.sorted) {
      if (v[0] !== w[0] || Math.abs(v.length - w.length) > maxD || v.length < 4) continue;
      const dd = editDistance(w, v);
      if (dd < bestD) {
        best = v;
        bestD = dd;
        tie = false;
      } else if (dd === bestD) tie = true;
    }
    return best && bestD <= maxD && !tie ? best : w;
  }

  correct(text: string, protectedWords: Set<string> = new Set()): string {
    // Hyphenated run-togethers ("in-between", "non-hostile") first.
    let t = text.replace(/\bin-between\b/g, 'in between').replace(/\bnon[- ]hostile\b/g, 'nonhostile');
    t = t.replace(/[a-z']+/g, (w) => this.correctToken(w, protectedWords));
    return t;
  }
}
