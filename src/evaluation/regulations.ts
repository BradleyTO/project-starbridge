/**
 * v0.8.0: a thin compatibility layer over the ISA-COM-001 regulation database (src/handbook).
 *
 * The evaluator and stored reports cite regulations by permanent id with their pre-edition title and
 * text (revision 0, the v0.7 catalogue wording, verbatim). This layer keeps exactly that behaviour:
 * the same 15 ids, in the same order, with byte-identical titles and texts, so evaluation output is
 * unchanged. The First Edition wording (revision 1) is read from the handbook; evaluations move to it
 * only in a later release, after the final wording is approved.
 */
import { ARTICLES } from '../handbook';

export interface Regulation {
  id: string;
  title: string;
  text: string;
}

/** v0.7 catalogue order (preserved: some callers list regulations in this order). */
const V07_ORDER = ['reg-7.1', 'reg-7.2', 'reg-7.3', 'reg-7.4', 'reg-12', 'border-accords-4', 'roe-1', 'roe-2', 'roe-3', 'care-1', 'care-2', 'quarantine-1', 'quarantine-2', 'honesty-1', 'asylum-1'] as const;

export const REGULATIONS: readonly Regulation[] = V07_ORDER.map((id) => {
  const r0 = ARTICLES.find((a) => a.id === id)?.revisions.find((r) => r.rev === 0);
  if (!r0) throw new Error(`regulation ${id} has no revision 0 in the handbook`);
  return { id, title: r0.title, text: r0.text };
});

export function regulation(id: string): Regulation | undefined {
  return REGULATIONS.find((r) => r.id === id);
}
