// Headless smoke test for the Milestone 1 UI.
// Usage: npm run build && npx vite preview --port 4173 &  then  node scripts/smoke.mjs [url]
// Env: SHOTS_DIR (default ./smoke-shots)
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = process.argv[2] || process.env.SMOKE_URL || 'http://localhost:4173/';
const SHOTS = process.env.SHOTS_DIR || './smoke-shots';
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
};

const stubs = () => {
  window.__spoken = [];
  if ('speechSynthesis' in window) {
    window.speechSynthesis.speak = (u) => window.__spoken.push(u.text);
    window.speechSynthesis.cancel = () => {};
  }
  window.SpeechRecognition = window.webkitSpeechRecognition = class {
    start() { setTimeout(() => { this.onresult?.({ results: [[{ transcript: 'scan the cruiser' }]] }); this.onend?.(); }, 50); }
    stop() { this.onend?.(); }
  };
};

const browser = await chromium.launch();
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(stubs);
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

const narrative = () => page.locator('[data-testid=narrative]').innerText();
const send = async (cmd) => {
  await page.fill('[data-testid=command-input]', cmd);
  await page.press('[data-testid=command-input]', 'Enter');
  await page.waitForTimeout(150);
};


const overlaps = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const checkToast = async (label) => {
  await page.click('[data-testid=save]');
  await page.waitForTimeout(100);
  const toast = await page.locator('[data-testid=toast]').boundingBox();
  const badge = await page.locator('[data-testid=demo-badge]').boundingBox();
  const header = await page.locator('header.topbar').boundingBox();
  check(`${label}: toast does not overlap demo badge or header`, toast && !overlaps(toast, badge) && !overlaps(toast, header), JSON.stringify({ toast, badge }));
};

await page.goto(URL, { waitUntil: 'networkidle' });
check('title', (await page.title()).includes('Starbridge'), await page.title());
for (const id of ['viewscreen', 'ship-status', 'narrative', 'command', 'tactical', 'comms', 'objectives', 'save', 'load', 'restart']) {
  check(`panel visible: ${id}`, await page.locator(`[data-testid=${id}]`).isVisible());
}
await page.waitForTimeout(4500);
check('intro plays on timer', (await narrative()).includes('distress beacon'));
await page.screenshot({ path: `${SHOTS}/01-desktop-intro.png` });

await page.click('[data-testid=skip-intro]');
await page.waitForTimeout(200);
check('skip intro reveals cruiser', await page.locator('[data-testid=contact-cruiser]').isVisible());
check('four objectives', (await page.locator('[data-testid=objectives] li').count()) === 4);
check('yellow alert after intro', (await page.innerText('[data-testid=alert-level]')).includes('YELLOW'));
check('beacon in comms log', (await page.innerText('[data-testid=comms]')).includes('reactor containment failing'));

// Canvas renders non-black pixels
const lit = await page.evaluate(() => {
  const c = document.querySelector('[data-testid=viewscreen] canvas');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++;
  return n;
});
check('viewscreen canvas renders', lit > 500, `${lit} lit pixels`);

await send('Scan the Kestrel');
let nar = await narrative();
check('typed command echoed in narrative', nar.includes('Scan the Kestrel'));
check('sensor response to scan', nar.includes('twenty-three life signs'));
check('assess objective complete', (await page.innerText('[data-testid=objectives]')).toLowerCase().includes('complete'));
check('turn advanced', (await page.innerText('[data-testid=mission-clock]')).includes('TURN 1'));

await send('Hail the cruiser');
check('cruiser reply in comms log', (await page.innerText('[data-testid=comms]')).includes('Prefect Sorel Vane'));

await send('gibberish order xyz');
check('unknown order handled', (await narrative()).includes('did not recognise'));

// Save / load
await checkToast('desktop');
check('save toast', (await page.innerText('[data-testid=toast]')).includes('Saved'));
await send('Raise shields');
check('shields raised', (await page.innerText('[data-testid=shield-state]')) === 'RAISED');
await page.click('[data-testid=load]');
await page.waitForTimeout(150);
check('load restores pre-shield state', (await page.innerText('[data-testid=shield-state]')) === 'LOWERED');
await page.reload({ waitUntil: 'networkidle' });
await page.click('[data-testid=load]');
await page.waitForTimeout(150);
check('save survives reload', (await page.innerText('[data-testid=mission-clock]')).includes('TURN 2'));

// Voice synthesis (stubbed) and recognition (stubbed)
await page.click('[data-testid=voice-toggle]');
await send('Status report');
const spoken = await page.evaluate(() => window.__spoken.length);
check('speech synthesis invoked when voice on', spoken > 0, `${spoken} utterances`);
await page.click('[data-testid=voice-toggle]');
await page.click('[data-testid=mic-button]');
await page.waitForTimeout(200);
check('speech recognition fills input', (await page.inputValue('[data-testid=command-input]')) === 'scan the cruiser');
await page.press('[data-testid=command-input]', 'Enter');
await page.waitForTimeout(150);
check('voice-filled command executes', (await page.innerText('[data-testid=tactical]')).includes('Ashen Covenant'));
await page.screenshot({ path: `${SHOTS}/02-desktop-midgame.png` });

// Rescue playthrough to an ending
for (const c of ['Approach the Kestrel', 'Approach the Kestrel', 'Approach the Kestrel', 'Evacuate the Kestrel crew', 'Withdraw']) await send(c);
check('rescue ending shown', (await page.innerText('[data-testid=outcome]')).toLowerCase().includes('rescue and withdrawal'));
const objText = (await page.innerText('[data-testid=objectives]')).toLowerCase();
check('no objective left active after ending', !/\bactive\b/.test(objText), objText.replace(/\n/g, ' | '));
await page.screenshot({ path: `${SHOTS}/03-desktop-ending.png` });

page.once('dialog', (d) => d.accept());
await page.click('[data-testid=restart]');
await page.waitForTimeout(300);
check('voice note cleared on restart', !(await page.locator('.mic-note').allInnerTexts()).some((t) => t.startsWith('Heard')));
check('restart resets', (await page.innerText('[data-testid=mission-clock]')).includes('TURN 0') && !(await page.locator('[data-testid=outcome]').count()));

// Responsive layouts
for (const [name, w, h] of [['tablet-portrait', 820, 1180], ['tablet-landscape', 1180, 820], ['phone', 390, 844]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(400);
  if (await page.locator('[data-testid=skip-intro]').count()) await page.click('[data-testid=skip-intro]');
  await send('Scan the Kestrel');
  await checkToast(name);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`${name}: no horizontal overflow`, overflow <= 0, `overflow ${overflow}px`);
  check(`${name}: command input visible`, await page.locator('[data-testid=command-input]').isVisible());
  await page.screenshot({ path: `${SHOTS}/04-${name}.png`, fullPage: true });
  page.once('dialog', (d) => d.accept());
  await page.click('[data-testid=restart]');
}

check('no console errors', errors.length === 0, errors.join(' | '));
await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(`${SHOTS}/results.json`, JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
