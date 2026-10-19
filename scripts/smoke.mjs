// Headless smoke test for the v0.3 UI (includes the v0.2 checks).
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

const SEEDED = URL + (URL.includes('?') ? '&' : '?') + 'seed=2';
await page.goto(SEEDED, { waitUntil: 'networkidle' });
check('title', (await page.title()).includes('Starbridge'), await page.title());
for (const id of ['viewscreen', 'ship-status', 'narrative', 'command', 'tactical', 'comms', 'objectives', 'save', 'load', 'restart', 'new-scenario', 'systems']) {
  check(`panel visible: ${id}`, await page.locator(`[data-testid=${id}]`).isVisible());
}
check('badge says simulation / offline interpreter', /SIMULATION\s*·\s*OFFLINE INTERPRETER/i.test(await page.innerText('[data-testid=demo-badge]')));
check('seed from URL shown', (await page.innerText('[data-testid=seed]')).includes('SEED 2'));
await page.waitForTimeout(4500);
check('intro plays on timer', (await narrative()).includes('distress beacon'));
await page.screenshot({ path: `${SHOTS}/01-desktop-intro.png` });

await page.click('[data-testid=skip-intro]');
await page.waitForTimeout(200);
check('skip intro reveals cruiser', await page.locator('[data-testid=contact-cruiser]').isVisible());
check('four objectives', (await page.locator('[data-testid=objectives] li').count()) === 4);
check('yellow alert after intro', (await page.innerText('[data-testid=alert-level]')).includes('YELLOW'));
check('beacon in comms log', (await page.innerText('[data-testid=comms]')).includes('reactor containment failing'));
check('suggestion chips offered', (await page.locator('[data-testid=suggestions] .chip').count()) > 0);

const lit = await page.evaluate(() => {
  const c = document.querySelector('[data-testid=viewscreen] canvas');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++;
  return n;
});
check('viewscreen canvas renders', lit > 500, `${lit} lit pixels`);

await send('Could you scan the Kestrel and hail the cruiser, please');
let nar = await narrative();
check('typed command echoed in narrative', nar.includes('Could you scan the Kestrel and hail the cruiser, please'));
check('multi-order: sensor result', /reactor containment \d+%/.test(nar));
check('multi-order: Prefect replies in comms', (await page.innerText('[data-testid=comms]')).includes('Prefect Sorel Vane'));
check('assess objective complete', (await page.innerText('[data-testid=objectives]')).toLowerCase().includes('complete'));
check('one turn for a multi-order sentence', (await page.innerText('[data-testid=mission-clock]')).includes('TURN 1'));
check('kestrel details shown after scan', /aboard/.test(await page.innerText('[data-testid=contact-kestrel]')));

await send('purple monkey dishwasher');
check('unknown order handled in character', (await narrative()).includes("didn't follow"));

await send('approach');
check('ambiguous order asks a clarifying question', await page.locator('[data-testid=clarification]').isVisible());
await page.locator('[data-testid=clarification] .chip', { hasText: 'Kestrel' }).click();
await page.waitForTimeout(200);
check('clarification answered → helm order', (await narrative()).includes('Setting course for the Kestrel'));

// Save / load (full world state incl. seed)
await checkToast('desktop');
check('save toast', (await page.innerText('[data-testid=toast]')).includes('Saved'));
const savedClock = await page.innerText('[data-testid=mission-clock]');
await send('Raise shields');
check('shields raised', (await page.innerText('[data-testid=shield-state]')) === 'RAISED');
await page.click('[data-testid=load]');
await page.waitForTimeout(150);
check('load restores pre-shield state', (await page.innerText('[data-testid=shield-state]')) === 'LOWERED');
await page.goto(URL, { waitUntil: 'networkidle' });
await page.click('[data-testid=load]');
await page.waitForTimeout(150);
check('save survives reload (turn + seed)', (await page.innerText('[data-testid=mission-clock]')) === savedClock && (await page.innerText('[data-testid=seed]')).includes('SEED 2'), savedClock);

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
let kText = '';
for (let i = 0; i < 8; i++) {
  const before = (await page.innerText('[data-testid=mission-clock]'));
  await send(i === 0 ? 'lower shields and beam the crew aboard' : 'evacuate the crew');
  kText = (await page.innerText('[data-testid=contact-kestrel]')).toLowerCase();
  if (kText.includes('no life signs')) break;
  if ((await page.innerText('[data-testid=mission-clock]')) === before) await send('wait'); // out of range: let the helm close
}
check('kestrel shows evacuated (not distressed) once empty', kText.includes('evacuated') && !kText.includes('distressed'), kText.replace(/\n/g, ' | '));
for (const c of ['withdraw', 'wait', 'jump', 'jump']) {
  if (await page.locator('[data-testid=outcome]').count()) break;
  await send(c);
}
const outcome = (await page.locator('[data-testid=outcome]').count()) ? await page.innerText('[data-testid=outcome]') : '';
check('rescue ending shown', /rescue and withdrawal/i.test(outcome), outcome.split('\n')[0]);
const objText = (await page.innerText('[data-testid=objectives]')).toLowerCase();
check('no objective left active after ending', !/\bactive\b/.test(objText), objText.replace(/\n/g, ' | '));
await page.screenshot({ path: `${SHOTS}/03-desktop-ending.png` });

await page.click('[data-testid=restart]');
await page.waitForTimeout(300);
check('voice note cleared on restart', !(await page.locator('.mic-note').allInnerTexts()).some((t) => t.startsWith('Heard')));
check('restart keeps the seed and resets', (await page.innerText('[data-testid=mission-clock]')).includes('TURN 0') && (await page.innerText('[data-testid=seed]')).includes('SEED 2') && !(await page.locator('[data-testid=outcome]').count()));
await page.click('[data-testid=new-scenario]');
await page.waitForTimeout(200);
check('new scenario picks a new seed', !/^SEED 2$/.test((await page.innerText('[data-testid=seed]')).trim()), await page.innerText('[data-testid=seed]'));

// v0.3: the captain's compound spatial order, typed verbatim, played to completion
const USER_ORDER = 'Get us inbetween the two ships. Keep the weapons down and shields down. We don\'t want to appear hostile. And hail them on screen.';
await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=42', { waitUntil: 'networkidle' });
await page.click('[data-testid=skip-intro]');
await page.waitForTimeout(200);
const logStart = (await narrative()).length;
await send(USER_ORDER);
let v3 = (await narrative()).slice(logStart);
check('v0.3: order echoed', v3.includes(USER_ORDER));
check('v0.3: helm acknowledges interpose with ETA', /Plotting an interpose course between the Kestrel and the Ashen Covenant.*ETA/.test(v3));
check('v0.3: tactical confirms weapons safe', /Weapons are (already )?safe/.test(v3));
check('v0.3: tactical confirms shields down', /Shields are (already )?down|Shields down/.test(v3));
check('v0.3: both ships hailed on screen', /Hailing both ships\. Putting them on screen/.test(v3));
check('v0.3: helm reports underway', /Underway\. Heading \d+/.test(v3));
check('v0.3: nothing misunderstood', !/didn't (follow|understand)|Couldn't parse/i.test(v3));
check('v0.3: shields remain lowered', (await page.innerText('[data-testid=shield-state]')) === 'LOWERED');
const helmOrder = page.locator('[data-testid=orders-strip] [data-dept=helm]').last();
check('v0.3: orders strip shows helm interpose underway', (await helmOrder.getAttribute('data-status')) === 'underway' && /Interpose/i.test(await helmOrder.innerText()), await helmOrder.innerText());
check('v0.3: course line drawn on tactical', (await page.locator('[data-testid=course-line]').count()) === 1);
await page.screenshot({ path: `${SHOTS}/05-v03-order-underway.png` });
let inPosition = false;
for (let i = 0; i < 8 && !inPosition; i++) {
  await send('wait');
  inPosition = (await narrative()).slice(logStart).includes("We're in position between them, Captain");
}
v3 = (await narrative()).slice(logStart);
check('v0.3: helm reports in position between them', inPosition);
check('v0.3: orders strip shows interpose maintaining', (await helmOrder.getAttribute('data-status')) === 'maintaining', await helmOrder.getAttribute('data-status'));
check('v0.3: Vane reacts to the shields-down interposition (comms)', /between my guns and that freighter with your shields down/.test(v3 + (await page.innerText('[data-testid=comms]'))));
const pos = async (sel) => { const el = page.locator(sel); return { x: +(await el.getAttribute('data-x')), y: +(await el.getAttribute('data-y')) }; };
const H = await pos('[data-testid=tactical-halcyon]');
const K = await pos('[data-contact=kestrel]');
const C = await pos('[data-contact=cruiser]');
const dx = C.x - K.x, dy = C.y - K.y, len2 = dx * dx + dy * dy;
const t = ((H.x - K.x) * dx + (H.y - K.y) * dy) / len2;
const off = Math.hypot(K.x + t * dx - H.x, K.y + t * dy - H.y);
const span = Math.sqrt(len2);
check('v0.3: Halcyon lies between the Kestrel and the cruiser on tactical', t > 0.01 && t < 0.99 && off <= Math.max(1500, 0.1 * span), JSON.stringify({ H, K, C, t: +t.toFixed(3), offLineKm: Math.round(off) }));
await page.screenshot({ path: `${SHOTS}/06-v03-in-position.png` });
await page.locator('[data-testid=tactical]').screenshot({ path: `${SHOTS}/07-v03-tactical.png` });
await page.click('[data-testid=zoom-near]');
await page.waitForTimeout(150);
await page.locator('[data-testid=tactical]').screenshot({ path: `${SHOTS}/08-v03-tactical-local.png` });
await page.click('[data-testid=zoom-all]');

// Responsive layouts
for (const [name, w, h] of [['tablet-portrait', 820, 1180], ['tablet-landscape', 1180, 820], ['phone', 390, 844]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(400);
  if (await page.locator('[data-testid=skip-intro]').count()) await page.click('[data-testid=skip-intro]');
  await send('scan the kestrel');
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
