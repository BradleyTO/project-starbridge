import { Fragment, useEffect, useRef, useState } from 'react';
import {
  ANNEX_NOTE,
  HANDBOOK,
  PARTS,
  PREAMBLE,
  article,
  citationLabel,
  part as partOf,
  partSections,
  resolve,
  search,
  type HandbookView,
  type Section,
} from '../../handbook';

export type { HandbookView };

interface Props {
  view: HandbookView;
  onView(v: HandbookView): void;
}

type Go = (v: HandbookView) => void;
const anchor = (n: string) => `hb-${n.replace('.', '-')}`;

function Crumb({ go }: { go: Go }) {
  return (
    <p className="hb-crumb">
      <a href="#handbook" className="hb-link" onClick={(e) => { e.preventDefault(); go({ kind: 'contents' }); }}>{HANDBOOK.code} · Contents</a>
    </p>
  );
}

function Contents({ go }: { go: Go }) {
  return (
    <div data-testid="handbook-contents">
      <header className="hb-masthead">
        <p className="hb-issuer">{HANDBOOK.issuer}</p>
        <h2 className="hb-code">{HANDBOOK.code}</h2>
        <p className="hb-title">{HANDBOOK.title}</p>
        <p className="hb-edition" data-testid="handbook-edition">{HANDBOOK.edition}</p>
        <p className="hb-issued">{HANDBOOK.issuedBy}</p>
      </header>
      <h3 className="hb-h">Preamble</h3>
      <p className="hb-preamble" data-testid="handbook-preamble">{PREAMBLE}</p>
      <h3 className="hb-h">Contents</h3>
      <ol className="hb-toc">
        {PARTS.map((p) => (
          <li key={p.part} data-part={p.part}>
            <a href={`#handbook/${p.part === 'T' ? 'annex' : `article-${p.part}`}`} className="hb-link hb-toc-ch" data-testid={`handbook-part-link-${p.part}`} onClick={(e) => { e.preventDefault(); go({ kind: 'part', part: p.part }); }}>
              {p.part === 'T' ? 'Annex' : p.label}. {p.title}
            </a>
            <span className="hb-toc-range">{p.part === 'T' ? `${p.first}–${p.last}` : `§${p.first}–${p.last}`}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Rule({ s, focus }: { s: Section; focus?: boolean }) {
  return (
    <li id={anchor(s.number)} className={focus ? 'hb-rule hb-focus' : 'hb-rule'} data-section={s.number} aria-current={focus ? 'true' : undefined}>
      <span className="hb-rule-no">{s.number}</span>
      <span className="hb-rule-text">
        {s.annex && <strong>{s.annex.instrument}. {s.annex.title}. </strong>}
        {s.annex?.provisional && <span className="hb-badge">Provisional</span>}
        {s.annex?.provisional && ' '}
        {s.text}
      </span>
    </li>
  );
}

function Part({ p, section, go }: { p: string; section?: string; go: Go }) {
  const info = partOf(p)!;
  const i = PARTS.indexOf(info);
  const prev = PARTS[i - 1];
  const next = PARTS[i + 1];
  const link = (x: typeof info, label: string) => (
    <a href={`#handbook/${x.part}`} className="hb-link" data-testid="handbook-pager" onClick={(e) => { e.preventDefault(); go({ kind: 'part', part: x.part }); }}>{label}</a>
  );
  return (
    <article className="hb-article" data-testid="handbook-article" data-part={p} data-focus={section ?? ''}>
      <Crumb go={go} />
      <header>
        <p className="hb-artno">{p === 'T' ? 'Annex' : info.label}</p>
        <h2 className="hb-article-title">{info.title}</h2>
      </header>
      {p === 'T' && <p className="hb-lede">{ANNEX_NOTE}</p>}
      <ol className="hb-rules" data-testid="handbook-text">
        {partSections(p).map((s) => <Rule key={s.number} s={s} focus={s.number === section} />)}
      </ol>
      <nav className="hb-pager" aria-label="Articles">
        {prev ? link(prev, `‹ ${prev.part === 'T' ? 'Annex' : prev.label}. ${prev.title}`) : <span />}
        {next ? link(next, `${next.part === 'T' ? 'Annex' : next.label}. ${next.title} ›`) : <span />}
      </nav>
    </article>
  );
}

function Results({ query, go }: { query: string; go: Go }) {
  const hits = search(query);
  return (
    <div data-testid="handbook-results" data-query={query}>
      <Crumb go={go} />
      <h2 className="hb-chapter-title">Search: “{query}”</h2>
      {hits.length === 0 ? (
        <p className="hb-lede">Nothing matches. Try a number such as 3.3 or Article 5, or a subject such as “asylum”.</p>
      ) : (
        <ol className="hb-results">
          {hits.map(({ section: s }) => (
            <li key={s.number} data-section={s.number}>
              <p className="hb-chapter-art">
                <a href={`#handbook/${s.number}`} className="hb-link" onClick={(e) => { e.preventDefault(); go({ kind: 'part', part: s.part, section: s.number }); }}>
                  {s.annex ? `Annex ${s.number}, ${s.annex.instrument}` : `§${s.number} ${s.partTitle}`}
                </a>
              </p>
              <p className="hb-chapter-text">{s.text}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * v0.8.0: the Captain's Handbook (ISA-COM-001), read like an official publication. v0.8.2: the First Edition code
 * only (title block, preamble, contents, Articles 1–11 and the Annex). Display only: it changes nothing.
 */
export function HandbookPanel({ view, onView }: Props) {
  const [q, setQ] = useState(view.kind === 'search' ? view.query : '');
  const top = useRef<HTMLDivElement>(null);
  const focus = view.kind === 'part' ? view.section : undefined;
  // Each view mounts afresh (the app keys the panel on it): bring the top of the page, or the cited subsection, into view.
  useEffect(() => {
    const el = focus ? document.getElementById(anchor(focus)) : null;
    if (el) el.scrollIntoView?.({ block: 'center' });
    else top.current?.scrollIntoView?.({ block: 'start' });
  }, [focus]);
  const go: Go = (v) => onView(v);
  const submit = () => {
    const t = q.trim();
    if (!t) return go({ kind: 'contents' });
    const exact = resolve(t);
    go(exact ? { kind: 'part', ...exact } : { kind: 'search', query: t });
  };
  const known = view.kind === 'part' && partOf(view.part);
  return (
    <div className="handbook" data-testid="handbook" data-view={view.kind} ref={top}>
      <form className="hb-search" role="search" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <button type="button" className="btn ghost hb-home" onClick={() => go({ kind: 'contents' })} data-testid="handbook-home">Contents</button>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number or subject (3.3, Article 5, asylum)" aria-label="Search the handbook" data-testid="handbook-search" />
        <button type="submit" className="btn" data-testid="handbook-search-go">Search</button>
      </form>
      <div className="hb-paper">
        {view.kind === 'contents' && <Contents go={go} />}
        {view.kind === 'search' && <Results query={view.query} go={go} />}
        {known && <Part p={view.part} section={view.section} go={go} />}
        {view.kind === 'part' && !known && <p className="hb-lede">The code has no Article {view.part}.</p>}
      </div>
    </div>
  );
}

/**
 * A regulation citation in a report or the Service Record: shown as its First Edition subsection
 * ("§3.3 Use of Force", never the internal id) and, where it can, a link that opens that subsection.
 * `fallback` (the stored citation) is shown only for a citation the handbook does not know.
 */
export function CitationLink({ id, fallback, onOpen }: { id: string | undefined; fallback: string; onOpen?(id: string): void }) {
  const label = citationLabel(id) ?? fallback;
  const a = id ? article(id) : undefined;
  if (!a || !onOpen) return <Fragment><strong>{label}</strong></Fragment>;
  return (
    <a href={`#handbook/${a.number}`} className="hb-cite" data-testid="citation-link" data-section={a.number} onClick={(e) => { e.preventDefault(); onOpen(a.id); }} title={`Open ${label} in the Captain's Handbook`}>
      <strong>{label}</strong>
    </a>
  );
}
