/** The Kestrel Incident's ending ids, read from the source so the test notices any new ending. */
import { readFileSync } from 'node:fs';

export const KESTREL_ENDINGS_FOR_TEST = [...new Set([...readFileSync('src/scenarios/kestrel/outcome.ts', 'utf8').matchAll(/mk\('([a-z-]+)'/g)].map((m) => m[1]))];
