// v0.8.0: npm run handbook:export [-- --out <file>]
// v0.8.2: writes the ISA-COM-001 First Edition (the code only) as Markdown from the game's regulation database (src/handbook).
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : 'handbook-export/ISA-COM-001.md';
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { exportMarkdown } = await server.ssrLoadModule('/src/handbook/export.ts');
  const md = exportMarkdown();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, md + '\n');
  console.log(`Wrote ${out} (${md.split('\n').length} lines, First Edition)`);
} finally {
  await server.close();
}
