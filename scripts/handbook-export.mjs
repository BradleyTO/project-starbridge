// v0.8.0: npm run handbook:export [-- --out <file>] [-- --all]
// Writes ISA-COM-001 as Markdown from the game's regulation database (src/handbook). Spoiler-safe unless --all.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : 'handbook-export/ISA-COM-001.md';
const all = args.includes('--all');
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { exportMarkdown } = await server.ssrLoadModule('/src/handbook/export.ts');
  const md = exportMarkdown({ all });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, md + '\n');
  console.log(`Wrote ${out} (${md.split('\n').length} lines${all ? ', including after-played references' : ', spoiler-safe'})`);
} finally {
  await server.close();
}
