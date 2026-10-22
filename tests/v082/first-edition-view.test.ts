/**
 * v0.8.2: what the player sees of ISA-COM-001. The Captain's Handbook shows only the code (title block, preamble,
 * contents, Articles 1–11, Annex); reports and the Service Record cite "§3.3 Use of Force". No internal id, note,
 * training reference or enforcement text reaches the screen. Display only: evaluations are unchanged.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ARTICLES, PARTS, SECTIONS, type HandbookView } from '../../src/handbook';
import { CitationLink, HandbookPanel } from '../../src/ui/components/HandbookPanel';
import { AfterActionReport } from '../../src/ui/components/AfterActionReport';
import { evaluate } from '../../src/evaluation/evaluate';
import { regulation } from '../../src/evaluation/regulations';
import { K, KESTREL, TALLIS, TS } from '../v07/fixtures';

const OPTS = { id: 'E', source: 'simulation' as const, refId: 'R', atIso: '2026-10-21T12:00:00.000Z' };
const panel = (view: HandbookView) => renderToStaticMarkup(createElement(HandbookPanel, { view, onView: () => {} }));
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const ID_RE = new RegExp(`(?<![\\w-])(${ARTICLES.map((a) => a.id.replace('.', '\\.')).join('|')})(?![\\w-])`, 'g');
const idsIn = (html: string) => [...html.matchAll(ID_RE)].map((m) => m[1]);
const VIEWS: HandbookView[] = [
  { kind: 'contents' },
  ...PARTS.map((p) => ({ kind: 'part' as const, part: p.part })),
  { kind: 'part', part: '3', section: '3.3' },
  ...['asylum', 'quarantine', 'warning shot', 'unlawful order', 'rules of engagement', 'Reg. 7.2', 'xyzzy'].map((query) => ({ kind: 'search' as const, query })),
];

describe('the Captain\'s Handbook shows only the code', () => {
  it('contents: title block, preamble and the 11 articles and the Annex', () => {
    const t = text(panel({ kind: 'contents' }));
    for (const s of ['INTERGALACTIC SPACE AGENCY (ISA)', 'ISA-COM-001', "Captain's Code and Operational Regulations", 'First Edition', 'Preamble', 'Contents']) expect(t.toUpperCase()).toContain(s.toUpperCase());
    for (const p of PARTS) expect(t).toContain(p.title);
    expect(t).toContain('Article 11. Records, Duty and Rank');
    expect(t).toContain('§3.1–3.9');
    expect(t).not.toMatch(/Draft|pending approval/);
  });
  it('an article lists its subsections; a cited subsection is marked', () => {
    const h = panel({ kind: 'part', part: '3', section: '3.3' });
    expect(h.match(/class="hb-rule[ "]/g)).toHaveLength(9);
    expect(h).toContain('data-focus="3.3"');
    expect(h).toMatch(/class="hb-rule hb-focus" data-section="3.3"/);
    const annex = panel({ kind: 'part', part: 'T' });
    expect(annex.match(/>Provisional</g)).toHaveLength(2);
    // Every subsection appears in its article view, verbatim.
    for (const p of PARTS) {
      const t = text(panel({ kind: 'part', part: p.part }));
      for (const s of SECTIONS.filter((x) => x.part === p.part)) expect(t, s.number).toContain(s.text);
    }
  });
  it('no view shows an internal id, note, training reference, enforcement line or revision', () => {
    for (const v of VIEWS) {
      const h = panel(v);
      expect(idsIn(h), JSON.stringify(v)).toEqual([]);
      expect(text(h), JSON.stringify(v)).not.toMatch(/Training Simulation|Enforcement|Legal status|Commentary|Explanation|When it applies|Examples|Revision|formerly|Related articles/);
      for (const a of ARTICLES) {
        expect(h).not.toContain(a.internal.explanation.slice(0, 60));
        expect(h).not.toContain(a.internal.enforcement.note);
        for (const t of a.internal.training) expect(h).not.toContain(t.purpose);
      }
    }
  });
});

describe('report and Service Record citations', () => {
  const runs = [evaluate(KESTREL.pyrrhic(), K, OPTS), evaluate(KESTREL.handover(), K, OPTS), evaluate(TALLIS.orderedFireOnLiner(), TS, OPTS), evaluate(TALLIS.incident(), TS, OPTS)];
  it('reports cite "§n Title" with no internal ids, linked to the subsection; the findings are unchanged', () => {
    for (const e of runs) {
      const h = renderToStaticMarkup(createElement(AfterActionReport, { e, captain: 'Rowan Ashby', onCite: () => {} }));
      const regs = h.slice(h.indexOf('data-testid="aar-regulations"'));
      const list = regs.slice(0, regs.indexOf('</ul>'));
      expect(idsIn(list), e.title).toEqual([]);
      for (const r of e.regulations) {
        const a = ARTICLES.find((x) => x.id === r.id)!;
        expect(list, r.id).toContain(`data-section="${a.number}"`);
        expect(text(list), r.id).toContain(`${a.citation} : ${r.applied}`.replace(/'/g, "'"));
        // The stored citation is the v0.7 title, unchanged; only the label shown differs.
        expect(r.title).toBe(regulation(r.id)!.title);
      }
    }
    const tallis = runs[2].regulations.find((r) => r.id === 'roe-1')!;
    expect(tallis.applied).toMatch(/^Breached: /);
  });
  it('disciplinary review citations show the subsection', () => {
    const cite = (rule: string, id: string) => text(renderToStaticMarkup(createElement(CitationLink, { id, fallback: rule.split(':')[0], onOpen: () => {} }))).trim();
    expect(cite('Reg. 7.2: a directive may be declined when the ship is not fit for duty (hull below 60%).', 'reg-7.2')).toBe('§5.5 Orders and Directives');
    expect(cite('Reg. 12: failure to carry out a lawful directive.', 'reg-12')).toBe('§5.1 Orders and Directives');
    expect(cite('Reg. 7.4: a directive that would breach treaty law may be refused.', 'reg-7.4')).toBe('§5.7 Orders and Directives');
    // A citation the handbook does not know keeps its stored label (and is not a link).
    expect(renderToStaticMarkup(createElement(CitationLink, { id: undefined, fallback: 'Standing Order 3' }))).toBe('<strong>Standing Order 3</strong>');
  });
});
