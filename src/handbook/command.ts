/**
 * v0.8.0: bridge commands that open the Captain's Handbook ("computer, open the handbook", "show me
 * article B.1", "show me the regulation on first contact", "what are the quarantine regulations").
 *
 * Recognised before the interpreter runs, so a handbook request never reaches the engine: it issues no
 * order, takes no time and changes no state, on the idle bridge, in a simulation or on Active Duty.
 * The computer only opens the matching article or search results; no crew member recites or advises.
 */
import { resolve, search } from './index';

export type HandbookRequest = { kind: 'contents' } | { kind: 'article'; id: string } | { kind: 'search'; query: string };

const BOOK = String.raw`(?:(?:isa\s+)?(?:captain'?s\s+)?handbook|captain'?s\s+code|isa-com-001|(?:the\s+)?(?:isa\s+)?regulations|(?:the\s+)?(?:isa\s+)?rule\s*book)`;
const SHOW = String.raw`(?:open|show(?:\s+me)?|display|bring\s+up|pull\s+up|put\s+up|call\s+up|let\s+me\s+see|i\s+(?:want|would\s+like|'d\s+like)\s+to\s+see|can\s+i\s+see|read\s+me|look\s+up|find(?:\s+me)?|get(?:\s+me)?)`;
const ABOUT = String.raw`(?:on|about|regarding|concerning|covering|for|governing|dealing\s+with|that\s+(?:covers?|governs?|deals?\s+with))`;
const RULEWORD = String.raw`(?:regulations?|rules?|articles?|regs?)`;
const plural = (w: string) => /s$/.test(w);

const clean = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^\s*(?:(?:hey|ok|okay)\s+)?computer\s*[,:]?\s*/, '')
    .replace(/^\s*(?:please|kindly)\s+/, '')
    .replace(/^\s*(?:can|could|would|will)\s+you\s+(?:please\s+)?/, '')
    .replace(/\s*(?:,?\s*please)?\s*[.?!]*\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

const topic = (q: string) =>
  q
    .replace(/^(?:the|our|isa)\s+/, '')
    .replace(/\s+(?:in|from)\s+the\s+(?:handbook|regulations|captain'?s\s+code)$/, '')
    .trim();

function toRequest(query: string, single = true): HandbookRequest | null {
  const q = topic(query);
  if (!q || /^(?:the|our|isa|all|all the|ship's|every|current)$/.test(q)) return { kind: 'contents' };
  const exact = resolve(q);
  if (exact) return { kind: 'article', id: exact.id };
  // One clearly best match opens its article; otherwise the ranked results.
  const hits = search(q);
  if (single && hits.length && (hits.length === 1 || hits[0].score >= 2 * hits[1].score)) return { kind: 'article', id: hits[0].article.id };
  return { kind: 'search', query: q };
}

/** A handbook request, or null when the text is not one (it then goes to the interpreter as usual). */
export function handbookRequest(text: string): HandbookRequest | null {
  const t = clean(text);
  if (!t) return null;
  let m: RegExpExecArray | null;
  // "open the handbook", "show me the regulations", "handbook".
  if (new RegExp(String.raw`^(?:${SHOW}\s+)?(?:the\s+|my\s+|our\s+)?${BOOK}(?:\s+contents|\s+table\s+of\s+contents)?$`).test(t)) return { kind: 'contents' };
  // "show me article B.1", "open Art. B.1", "show me reg 7.2", "show me roe-1", "article B.1".
  if ((m = new RegExp(String.raw`^(?:${SHOW}\s+)?(?:the\s+)?((?:article|art\.?|annex|reg(?:ulation)?\.?|rules?\s+of\s+engagement)\s*\S+(?:\s*\S+)?)$`).exec(t))) {
    const a = resolve(m[1]);
    if (a) return { kind: 'article', id: a.id };
  }
  if ((m = new RegExp(String.raw`^${SHOW}\s+(?:the\s+)?([a-z][a-z0-9.\-]*\d)$`).exec(t))) {
    const a = resolve(m[1]);
    if (a) return { kind: 'article', id: a.id };
  }
  // "show me the regulation on first contact", "find the rules about asylum".
  if ((m = new RegExp(String.raw`^(?:${SHOW}\s+)?(?:the\s+|our\s+|any\s+)?(?:isa\s+)?(${RULEWORD})\s+${ABOUT}\s+(.+)$`).exec(t))) return toRequest(m[2], !plural(m[1]));
  // "show me the quarantine regulations", "what are the quarantine regulations", "what are our rules of engagement".
  if ((m = new RegExp(String.raw`^(?:${SHOW}|what\s+are|what's|whats|what\s+is|list)\s+(?:the\s+|our\s+|isa\s+)?(.+?)\s+(${RULEWORD})$`).exec(t))) return toRequest(m[1], !plural(m[2]));
  if ((m = /^(?:what\s+are|what's|whats|what\s+is|show(?:\s+me)?|open|explain)\s+(?:the\s+|our\s+)?(rules\s+of\s+engagement)$/.exec(t))) return { kind: 'search', query: m[1] };
  // "what does the handbook say about asylum", "what do the regulations say on warning shots".
  if ((m = new RegExp(String.raw`^what\s+(?:does|do)\s+(?:the\s+)?${BOOK}\s+say\s+${ABOUT}\s+(.+)$`).exec(t))) return toRequest(m[1]);
  // "search the handbook for asylum", "look up quarantine in the handbook".
  if ((m = new RegExp(String.raw`^(?:search|check|consult)\s+(?:the\s+)?${BOOK}\s+(?:for|on|about)\s+(.+)$`).exec(t))) return toRequest(m[1]);
  if ((m = new RegExp(String.raw`^(?:look\s+up|find|search\s+for)\s+(.+?)\s+in\s+the\s+${BOOK}$`).exec(t))) return toRequest(m[1]);
  if ((m = new RegExp(String.raw`^${SHOW}\s+(?:the\s+)?${BOOK}\s+(?:${ABOUT}|entry\s+(?:on|for))\s+(.+)$`).exec(t))) return toRequest(m[1]);
  return null;
}
