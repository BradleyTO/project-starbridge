import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ARTICLES,
  CHAPTERS,
  ENFORCEMENT_LABEL,
  FRONT_MATTER,
  HANDBOOK,
  LEGAL_LABEL,
  article,
  chapter,
  chapterArticles,
  chapterLabel,
  enforcementNoteVisible,
  resolve,
  search,
  visibleTraining,
  type ChapterId,
  type HandbookArticle,
} from '../../handbook';

/** v0.8.0: what the Captain's Handbook is showing. Kept by the app so a bridge command can open it anywhere. */
export type HandbookView =
  | { kind: 'contents' }
  | { kind: 'front'; id: string }
  | { kind: 'chapter'; id: ChapterId }
  | { kind: 'article'; id: string }
  | { kind: 'search'; query: string };

interface Props {
  view: HandbookView;
  onView(v: HandbookView): void;
  /** Scenario ids the Training Record shows were run (after-played training references stay hidden otherwise). */
  played: Set<string>;
  scenarioOf(simulation: number): string | undefined;
}

type Go = (v: HandbookView) => void;

/** Inline Markdown subset (**bold**, *italic*, `code`) with article numbers ("Article B.4") linked. */
function Inline({ text, go }: { text: string; go: Go }) {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\b(?:[A-I]|T)\.\d{1,2}\b)/g;
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(re)) {
    const tok = m[0];
    if (m.index! > last) out.push(text.slice(last, m.index));
    if (tok.startsWith('**')) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k++}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('*')) out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    else {
      const a = resolve(tok);
      out.push(a ? <ArticleLink key={k++} a={a} go={go} label={tok} /> : tok);
    }
    last = m.index! + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** Block Markdown subset: paragraphs, "- " and "1. " lists. */
function Prose({ md, go }: { md: string; go: Go }) {
  const blocks = md.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^- /.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}><Inline text={l.slice(2)} go={go} /></li>)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\d+\. /, '')} go={go} /></li>)}</ol>;
        if (lines.every((l) => /^> ?/.test(l))) return <blockquote key={i}><Inline text={lines.map((l) => l.replace(/^> ?/, '')).join(' ')} go={go} /></blockquote>;
        return <p key={i}><Inline text={b.replace(/\n/g, ' ')} go={go} /></p>;
      })}
    </>
  );
}

function ArticleLink({ a, go, label }: { a: HandbookArticle; go: Go; label?: string }) {
  return (
    <a
      href={`#handbook/${a.id}`}
      className="hb-link"
      data-article={a.id}
      title={`Art. ${a.number}, ${a.title}`}
      onClick={(e) => {
        e.preventDefault();
        go({ kind: 'article', id: a.id });
      }}
    >
      {label ?? `Art. ${a.number}, ${a.title}`}
    </a>
  );
}

function Masthead() {
  return (
    <header className="hb-masthead">
      <p className="hb-issuer">{HANDBOOK.issuer}</p>
      <h2 className="hb-code">{HANDBOOK.code}</h2>
      <p className="hb-title">{HANDBOOK.title}</p>
      <p className="hb-edition" data-testid="handbook-edition">{HANDBOOK.edition}</p>
    </header>
  );
}

function Contents({ go }: { go: Go }) {
  return (
    <div data-testid="handbook-contents">
      <Masthead />
      <p className="hb-issued">{HANDBOOK.issuedBy}. Revision {HANDBOOK.revision}.</p>
      <h3 className="hb-h">Contents</h3>
      <ol className="hb-toc">
        {FRONT_MATTER.map((f) => (
          <li key={f.id} className="hb-toc-front">
            <a href={`#handbook/${f.id}`} className="hb-link" onClick={(e) => { e.preventDefault(); go({ kind: 'front', id: f.id }); }}>{f.title}</a>
          </li>
        ))}
        {CHAPTERS.map((c) => (
          <li key={c.id} className="hb-toc-chapter" data-chapter={c.id}>
            <a href={`#handbook/ch-${c.id}`} className="hb-link hb-toc-ch" onClick={(e) => { e.preventDefault(); go({ kind: 'chapter', id: c.id }); }} data-testid={`handbook-chapter-link-${c.id}`}>{chapterLabel(c)}</a>
            <ol className="hb-toc-articles">
              {chapterArticles(c.id).map((a) => (
                <li key={a.id}>
                  <span className="hb-num">{a.number}</span> <ArticleLink a={a} go={go} label={a.title} />
                  {a.legalStatus === 'provisional' && <span className="hb-badge">Provisional</span>}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Chapter({ id, go }: { id: ChapterId; go: Go }) {
  const c = chapter(id)!;
  return (
    <div data-testid="handbook-chapter" data-chapter={id}>
      <p className="hb-crumb"><a href="#handbook" className="hb-link" onClick={(e) => { e.preventDefault(); go({ kind: 'contents' }); }}>{HANDBOOK.code}</a></p>
      <h2 className="hb-chapter-title">{chapterLabel(c)}</h2>
      <p className="hb-lede">{c.summary}</p>
      <ol className="hb-chapter-list">
        {chapterArticles(id).map((a) => (
          <li key={a.id}>
            <p className="hb-chapter-art"><span className="hb-num">Art. {a.number}</span> <ArticleLink a={a} go={go} label={a.title} />{a.legalStatus === 'provisional' && <span className="hb-badge">Provisional</span>}</p>
            <p className="hb-chapter-text">{a.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ArticleView({ a, go, played, scenarioOf }: { a: HandbookArticle; go: Go; played: Set<string>; scenarioOf: Props['scenarioOf'] }) {
  const c = chapter(a.chapter)!;
  const i = ARTICLES.indexOf(a);
  const prev = ARTICLES[i - 1];
  const next = ARTICLES[i + 1];
  const refs = visibleTraining(a, played, scenarioOf);
  const noteShown = enforcementNoteVisible(a, played, scenarioOf);
  const related = a.related.map((r) => article(r)).filter((x): x is HandbookArticle => !!x);
  return (
    <article className="hb-article" data-testid="handbook-article" data-article={a.id}>
      <p className="hb-crumb">
        <a href="#handbook" className="hb-link" onClick={(e) => { e.preventDefault(); go({ kind: 'contents' }); }}>{HANDBOOK.code}</a>
        <span aria-hidden="true"> › </span>
        <a href={`#handbook/ch-${c.id}`} className="hb-link" onClick={(e) => { e.preventDefault(); go({ kind: 'chapter', id: c.id }); }}>{chapterLabel(c)}</a>
      </p>
      <header>
        <p className="hb-artno">{a.chapter === 'T' ? `Annex ${a.number}` : `Article ${a.number}`}</p>
        <h2 className="hb-article-title">{a.title}</h2>
        <p className="hb-meta">
          {a.citation} · Id <code>{a.id}</code> · Revision {a.revision}
          {a.formerly && <> · formerly <em>{a.formerly}</em></>}
        </p>
      </header>
      <section className="hb-text" aria-label="Authoritative text" data-testid="handbook-text">
        <p className="hb-text-label">Authoritative text</p>
        <p className="hb-text-body">{a.text}</p>
      </section>
      <p className="hb-status" data-testid="handbook-status">
        <span><strong>Legal status:</strong> {LEGAL_LABEL[a.legalStatus]}</span>
        <span><strong>Enforcement status:</strong> {ENFORCEMENT_LABEL[a.enforcement.status]}</span>
        {noteShown ? (
          <span className="hb-status-note" data-testid="handbook-enforcement-note">{a.enforcement.note}</span>
        ) : (
          <span className="hb-status-note" data-testid="handbook-enforcement-withheld">How this article is checked is described once you have run the training simulations that exercise it.</span>
        )}
      </p>
      <section className="hb-commentary" aria-label="Commentary">
        <p className="hb-commentary-label">Commentary</p>
        <h4>Explanation</h4>
        <Prose md={a.explanation} go={go} />
        <h4>When it applies</h4>
        <Prose md={a.appliesWhen} go={go} />
        <h4>Exceptions</h4>
        <Prose md={a.exceptions} go={go} />
        <h4>Examples</h4>
        <div className="hb-examples">
          <div><p className="hb-ex-label">Proper</p><Prose md={a.examples.proper} go={go} /></div>
          <div><p className="hb-ex-label">Improper</p><Prose md={a.examples.improper} go={go} /></div>
        </div>
        {related.length > 0 && (
          <>
            <h4>Related articles</h4>
            <ul className="hb-related" data-testid="handbook-related">
              {related.map((r) => <li key={r.id}><span className="hb-num">{r.number}</span> <ArticleLink a={r} go={go} label={r.title} /></li>)}
            </ul>
          </>
        )}
        {refs.length > 0 && (
          <>
            <h4>Training references</h4>
            <ul className="hb-training" data-testid="handbook-training">
              {refs.map((t) => (
                <li key={t.simulation} data-sim={t.simulation}>
                  <em>Training Simulation {String(t.simulation).padStart(3, '0')}: {t.title}</em>{t.planned && <span className="hb-badge">Planned</span>}. {t.purpose}
                </li>
              ))}
            </ul>
          </>
        )}
        {a.revisions.length > 1 && (
          <details className="hb-revisions">
            <summary>Revision history</summary>
            <ol>
              {a.revisions.map((r) => (
                <li key={r.rev}><strong>Revision {r.rev}</strong> ({r.edition}). <em>{r.title}.</em> {r.text}</li>
              ))}
            </ol>
          </details>
        )}
      </section>
      <nav className="hb-pager" aria-label="Articles">
        {prev ? <ArticleLink a={prev} go={go} label={`‹ ${prev.number} ${prev.title}`} /> : <span />}
        {next ? <ArticleLink a={next} go={go} label={`${next.number} ${next.title} ›`} /> : <span />}
      </nav>
    </article>
  );
}

function Results({ query, go }: { query: string; go: Go }) {
  const hits = search(query);
  return (
    <div data-testid="handbook-results" data-query={query}>
      <p className="hb-crumb"><a href="#handbook" className="hb-link" onClick={(e) => { e.preventDefault(); go({ kind: 'contents' }); }}>{HANDBOOK.code}</a></p>
      <h2 className="hb-chapter-title">Search: “{query}”</h2>
      {hits.length === 0 ? (
        <p className="hb-lede">No article matches. Try an article number such as B.1, or a subject such as “asylum”.</p>
      ) : (
        <ol className="hb-results">
          {hits.map((h) => (
            <li key={h.article.id} data-article={h.article.id}>
              <p className="hb-chapter-art"><span className="hb-num">Art. {h.article.number}</span> <ArticleLink a={h.article} go={go} label={h.article.title} /></p>
              <p className="hb-chapter-text">{h.article.text}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * v0.8.0: the Captain's Handbook (ISA-COM-001), read like an official publication. Display only: it
 * reads the regulation database and the Training Record, and changes nothing.
 */
export function HandbookPanel({ view, onView, played, scenarioOf }: Props) {
  const [q, setQ] = useState(view.kind === 'search' ? view.query : '');
  const top = useRef<HTMLDivElement>(null);
  // Each view mounts afresh (the app keys the panel on it): bring the top of the page into view.
  useEffect(() => {
    top.current?.scrollIntoView?.({ block: 'start' });
  }, []);
  const go: Go = (v) => onView(v);
  const submit = () => {
    const t = q.trim();
    if (!t) return go({ kind: 'contents' });
    const exact = resolve(t);
    go(exact ? { kind: 'article', id: exact.id } : { kind: 'search', query: t });
  };
  const a = view.kind === 'article' ? article(view.id) : undefined;
  const f = view.kind === 'front' ? FRONT_MATTER.find((x) => x.id === view.id) : undefined;
  return (
    <div className="handbook" data-testid="handbook" data-view={view.kind} ref={top}>
      <form className="hb-search" role="search" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <button type="button" className="btn ghost hb-home" onClick={() => go({ kind: 'contents' })} data-testid="handbook-home">Contents</button>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Article number or subject (B.1, asylum, warning shot)" aria-label="Search the handbook" data-testid="handbook-search" />
        <button type="submit" className="btn" data-testid="handbook-search-go">Search</button>
      </form>
      <div className="hb-paper">
        {view.kind === 'contents' && <Contents go={go} />}
        {view.kind === 'chapter' && <Chapter id={view.id} go={go} />}
        {view.kind === 'search' && <Results query={view.query} go={go} />}
        {a && <ArticleView a={a} go={go} played={played} scenarioOf={scenarioOf} />}
        {view.kind === 'article' && !a && <p className="hb-lede">No article has the identifier “{view.id}”.</p>}
        {f && (
          <div data-testid="handbook-front" data-section={f.id}>
            <p className="hb-crumb"><a href="#handbook" className="hb-link" onClick={(e) => { e.preventDefault(); go({ kind: 'contents' }); }}>{HANDBOOK.code}</a></p>
            <h2 className="hb-chapter-title">{f.title}</h2>
            <div className="hb-prose"><Prose md={f.body} go={go} /></div>
          </div>
        )}
      </div>
    </div>
  );
}

/** A regulation citation that opens its handbook article (reports and the Service Record). */
export function CitationLink({ id, children, onOpen }: { id: string | undefined; children: ReactNode; onOpen?(id: string): void }) {
  if (!id || !onOpen || !article(id)) return <Fragment>{children}</Fragment>;
  return (
    <a href={`#handbook/${id}`} className="hb-cite" data-testid="citation-link" data-article={id} onClick={(e) => { e.preventDefault(); onOpen(id); }} title="Open this article in the Captain's Handbook">
      {children}
    </a>
  );
}
