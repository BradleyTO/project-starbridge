/**
 * v0.8.0 print export; v0.8.2: the First Edition. Renders ISA-COM-001 as Markdown from the same database the game
 * reads: the title block, the preamble, the contents, Articles 1–11 with their subsections, and the Annex. Only the
 * code is exported: internal ids and notes stay in the database.
 */
import { ANNEX, ANNEX_NOTE, ANNEX_TITLE, CODE, HANDBOOK, PARTS, PREAMBLE } from './index';

export function exportMarkdown(): string {
  const out: string[] = [];
  const w = (s = '') => out.push(s);
  w(`**${HANDBOOK.issuer.toUpperCase()}**`);
  w();
  w(`# ${HANDBOOK.code}`);
  w();
  w(`## ${HANDBOOK.title}`);
  w();
  w(`*${HANDBOOK.edition}*`);
  w();
  w(`${HANDBOOK.issuedBy}.`);
  w();
  w('## Preamble');
  w();
  w(PREAMBLE);
  w();
  w('## Contents');
  w();
  for (const p of PARTS) w(p.part === 'T' ? `- [Annex. ${p.title}](#annex) (${p.first}–${p.last})` : `- [${p.label}. ${p.title}](#article-${p.part}) (§${p.first}–${p.last})`);
  w();
  for (const a of CODE) {
    w(`<a id="article-${a.number}"></a>`);
    w();
    w(`## Article ${a.number}. ${a.title}`);
    w();
    for (const s of a.subsections) w(`**${s.number}** ${s.text}  `);
    w();
  }
  w('<a id="annex"></a>');
  w();
  w(`## Annex. ${ANNEX_TITLE}`);
  w();
  w(`*${ANNEX_NOTE}*`);
  w();
  for (const x of ANNEX) {
    w(`**${x.number} ${x.instrument}. ${x.title}.**${x.provisional ? ' *(Provisional)*' : ''} ${x.text}`);
    w();
  }
  return out.join('\n').trimEnd();
}
