/**
 * v0.8.0: print export. Renders ISA-COM-001 as Markdown from the same database the game reads, with the
 * authoritative text set apart (a quoted block) from the commentary. Spoiler-safe by default: after-played
 * training references and enforcement notes that describe a simulation are left out unless `all` is set.
 */
import { ARTICLES, CHAPTERS, ENFORCEMENT_LABEL, FRONT_MATTER, HANDBOOK, LEGAL_LABEL, article, chapterLabel } from './index';
import type { HandbookArticle } from './types';

const pad = (n: number) => String(n).padStart(3, '0');
const anchor = (a: HandbookArticle) => `art-${a.number.toLowerCase().replace('.', '-')}`;

export function exportMarkdown(opts: { all?: boolean } = {}): string {
  const out: string[] = [];
  const w = (s = '') => out.push(s);
  w(`**${HANDBOOK.issuer.toUpperCase()}**`);
  w();
  w(`# ${HANDBOOK.code}`);
  w();
  w(`## ${HANDBOOK.title}`);
  w();
  w(`*${HANDBOOK.edition}. Revision ${HANDBOOK.revision}.*`);
  w();
  w(`${HANDBOOK.issuedBy}.`);
  w();
  w('## Contents');
  w();
  for (const f of FRONT_MATTER) w(`- [${f.title}](#${f.id})`);
  for (const c of CHAPTERS) {
    w(`- [${chapterLabel(c)}](#ch-${c.id.toLowerCase()})`);
    for (const a of ARTICLES.filter((x) => x.chapter === c.id)) w(`    - [${a.number} ${a.title}](#${anchor(a)})`);
  }
  w();
  for (const f of FRONT_MATTER) {
    w(`<a id="${f.id}"></a>`);
    w();
    w(`## ${f.title}`);
    w();
    w(f.body);
    w();
  }
  for (const c of CHAPTERS) {
    w('---');
    w();
    w(`<a id="ch-${c.id.toLowerCase()}"></a>`);
    w();
    w(`## ${chapterLabel(c)}`);
    w();
    w(`*${c.summary}*`);
    w();
    for (const a of ARTICLES.filter((x) => x.chapter === c.id)) {
      w(`<a id="${anchor(a)}"></a>`);
      w();
      w(`### ${c.id === 'T' ? 'Annex' : 'Article'} ${a.number}. ${a.title}`);
      w();
      const meta = [a.citation, `Id \`${a.id}\``, `Revision ${a.revision}`];
      if (a.formerly) meta.push(`formerly *${a.formerly}*`);
      w(meta.join(' · '));
      w();
      w('**AUTHORITATIVE TEXT**');
      w();
      w(`> ${a.text}`);
      w();
      const spoiler = !!a.enforcement.noteSimulations?.length || a.training.some((t) => t.afterPlayed);
      w(`*Legal status:* ${LEGAL_LABEL[a.legalStatus]}. *Enforcement status:* ${ENFORCEMENT_LABEL[a.enforcement.status]}.${opts.all || !spoiler ? ` ${a.enforcement.note}` : ''}`);
      w();
      w('**COMMENTARY**');
      w();
      w(`**Explanation.** ${a.explanation}`);
      w();
      w(`**When it applies.** ${a.appliesWhen}`);
      w();
      w(`**Exceptions.** ${a.exceptions}`);
      w();
      w(`**Proper.** ${a.examples.proper}`);
      w();
      w(`**Improper.** ${a.examples.improper}`);
      w();
      const rel = a.related.map((r) => article(r)).filter((x): x is HandbookArticle => !!x);
      if (rel.length) {
        w(`**Related articles.** ${rel.map((r) => `[${r.number} ${r.title}](#${anchor(r)})`).join('; ')}.`);
        w();
      }
      const refs = a.training.filter((t) => opts.all || !t.afterPlayed);
      if (refs.length) {
        w('**Training references.**');
        w();
        for (const t of refs) w(`- *Training Simulation ${pad(t.simulation)}: ${t.title}*${t.planned ? ' (planned)' : ''}. ${t.purpose}${t.afterPlayed ? ' *(shown in game only after this simulation has been run)*' : ''}`);
        w();
      }
      if (a.revisions.length > 1) {
        w('**Revision history.**');
        w();
        for (const r of a.revisions) w(`- Revision ${r.rev} (${r.edition}): *${r.title}.* ${r.text}`);
        w();
      }
    }
  }
  return out.join('\n');
}
