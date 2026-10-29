// Headless smoke test: v0.8.0 (Captain's Handbook, scripts/smoke-handbook.mjs), v0.7 / v0.7.1 (records, idle bridge), v0.6.1 (crew voices), v0.6 (multi-scenario + Training Simulation 002), v0.5 / M3.1 (bridge-first startup, Active Duty, organic traffic, science, first contact)
// plus the v0.2–v0.4 checks (which now enter their simulations from the bridge, as a player does).
// Usage: npm run build && npx vite preview --port 4173 &  then  node scripts/smoke.mjs [url]
// Env: SHOTS_DIR (default ./smoke-shots)
import { chromium } from 'playwright';
import fs from 'node:fs';
import { handbookSmoke } from './smoke-handbook.mjs';

const URL = process.argv[2] || process.env.SMOKE_URL || 'http://localhost:4173/';
const SHOTS = process.env.SHOTS_DIR || './smoke-shots';
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
};

const presetName = () => {
  try {
    if (!sessionStorage.getItem('smoke.askName') && !localStorage.getItem('starbridge.profile.v1')) localStorage.setItem('starbridge.profile.v1', JSON.stringify({ schema: 'starbridge.profile', version: 1, name: 'Rowan Ashby', prompted: true, history: [] }));
  } catch {}
};
const stubs = () => {
  window.__spoken = [];
  // v0.7: earlier sections run as an already-named captain (the naming prompt has its own section).
  try {
    if (!sessionStorage.getItem('smoke.askName') && !localStorage.getItem('starbridge.profile.v1')) localStorage.setItem('starbridge.profile.v1', JSON.stringify({ schema: 'starbridge.profile', version: 1, name: 'Rowan Ashby', prompted: true, history: [] }));
  } catch {}
  if ('speechSynthesis' in window) {
    window.speechSynthesis.speak = (u) => window.__spoken.push(u.text);
    window.speechSynthesis.cancel = () => {};
  }
  window.SpeechRecognition = window.webkitSpeechRecognition = class {
    start() { setTimeout(() => { this.onresult?.({ results: [[{ transcript: window.__transcript || 'scan the cruiser' }]] }); this.onend?.(); }, 50); }
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


/** v0.5: the app opens on the idle bridge; a simulation starts only when the captain asks for one. */
const BEGIN = 'Computer, begin the Kestrel Incident simulation';
const withSeed = (seed) => URL + (URL.includes('?') ? '&' : '?') + `seed=${seed}`;
const skipIntro = async (pg) => { if (await pg.locator('[data-testid=skip-intro]').count()) await pg.click('[data-testid=skip-intro]'); await pg.waitForTimeout(150); };
const sendOn = async (pg, cmd, wait = 150) => { await pg.fill('[data-testid=command-input]', cmd); await pg.press('[data-testid=command-input]', 'Enter'); await pg.waitForTimeout(wait); };
const gotoSim = async (pg, seed) => {
  await pg.goto(withSeed(seed), { waitUntil: 'networkidle' });
  await skipIntro(pg);
  await sendOn(pg, BEGIN, 1100);
  await pg.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
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

await gotoSim(page, 2);
check('title', (await page.title()).includes('Starbridge'), await page.title());
for (const id of ['viewscreen', 'ship-status', 'narrative', 'command', 'tactical', 'comms', 'objectives', 'save', 'load', 'restart', 'new-scenario', 'systems']) {
  check(`panel visible: ${id}`, await page.locator(`[data-testid=${id}]`).isVisible());
}
check('badge says simulation / offline interpreter', /SIMULATION\s*·\s*OFFLINE INTERPRETER/i.test(await page.innerText('[data-testid=demo-badge]')), await page.innerText('[data-testid=demo-badge]'));
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
// v0.5 (deliberate change): with the Prefect's channel open, an unclear line goes to him and he asks for clarification.
check('unknown line handled in character (channel party asks to clarify)', /didn't follow|Speak plainly|asking for something, or telling me/.test((await narrative()) + (await page.innerText('[data-testid=comms]'))));

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
await page.waitForTimeout(1000);
// v0.5: the simulation ends and the captain is back on the bridge, with a debrief (deliberate change from v0.4).
check('v0.5: sim end returns to the bridge with a debrief', (await page.getAttribute('[data-testid=mode-banner]', 'data-mode')) === 'bridge' && (await page.locator('[data-testid=outcome][data-debrief="1"]').count()) === 1 && /SIMULATION ENDED/.test(await narrative()));
const objText = (await page.innerText('[data-testid=objectives]')).toLowerCase();
check('no objective left active after ending', !/\bactive\b/.test(objText), objText.replace(/\n/g, ' | '));
await page.screenshot({ path: `${SHOTS}/03-desktop-ending.png` });

await page.click('[data-testid=outcome-same]');
await page.waitForTimeout(300);
await page.click('[data-testid=restart]');
await page.waitForTimeout(300);
check('voice note cleared on restart', !(await page.locator('.mic-note').allInnerTexts()).some((t) => t.startsWith('Heard')));
check('restart keeps the seed and resets', (await page.innerText('[data-testid=mission-clock]')).includes('TURN 0') && (await page.innerText('[data-testid=seed]')).includes('SEED 2') && !(await page.locator('[data-testid=outcome]').count()));
await page.click('[data-testid=new-scenario]');
await page.waitForTimeout(200);
check('new scenario picks a new seed', !/^SEED 2$/.test((await page.innerText('[data-testid=seed]')).trim()), await page.innerText('[data-testid=seed]'));

// v0.3: the captain's compound spatial order, typed verbatim, played to completion
const USER_ORDER = 'Get us inbetween the two ships. Keep the weapons down and shields down. We don\'t want to appear hostile. And hail them on screen.';
await gotoSim(page, 42);
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


// ============================================================== v0.4 =====
// Fresh context = empty localStorage (a new captain).
{
  const ctx4 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx4.addInitScript(stubs);
  const p4 = await ctx4.newPage();
  p4.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p4.on('pageerror', (e) => errors.push(String(e)));
  const nar4 = () => p4.locator('[data-testid=narrative]').innerText();
  const send4 = async (cmd) => {
    await p4.fill('[data-testid=command-input]', cmd);
    await p4.press('[data-testid=command-input]', 'Enter');
    await p4.waitForTimeout(120);
  };
  const banner = () => p4.getAttribute('[data-testid=mode-banner]', 'data-mode');
  const hub = async (tab) => {
    if (!(await p4.locator('[data-testid=hub]').count())) await p4.click('[data-testid=open-hub]');
    await p4.click(`[data-testid=hub-tab-${tab}]`);
    await p4.waitForTimeout(120);
  };
  const closeHub = async () => { if (await p4.locator('[data-testid=hub]').count()) await p4.click('[data-testid=hub-close]'); await p4.waitForTimeout(100); };
  const credits = async () => Number(await p4.getAttribute('[data-testid=credits]', 'data-remaining'));
  const outcomeTitle = async () => ((await p4.locator('[data-testid=outcome]').count()) ? (await p4.innerText('[data-testid=outcome]')).split('\n')[0].trim() : '');
  const playToOutcome = async (orders, max = 45) => {
    for (const o of orders) { if (await p4.locator('[data-testid=outcome]').count()) break; await send4(o); }
    for (let i = 0; i < max && !(await p4.locator('[data-testid=outcome]').count()); i++) await send4('wait');
    return outcomeTitle();
  };

  // --- critical interpreter regressions, typed into the UI
  await gotoSim(p4, 42);
  await p4.click('[data-testid=skip-intro]');
  check('v0.4: a simulation started from the bridge is a SIMULATION', (await banner()) === 'simulation', await p4.innerText('[data-testid=mode-banner]'));
  let mark = (await nar4()).length;
  await send4('Bring us in, activate shields, do not power up weapons, and hail the ship.');
  let said = (await nar4()).slice(mark);
  check('v0.4 (a): helm closes on the Kestrel', /Setting course for the Kestrel|course for the Kestrel/i.test(said), said.slice(0, 200));
  check('v0.4 (a): shields raised', (await p4.innerText('[data-testid=shield-state]')) === 'RAISED');
  check('v0.4 (a): weapons stay SAFE', (await p4.innerText('[data-testid=weapons-state]')).startsWith('SAFE'));
  check('v0.4 (a): hold on weapons shown in orders strip', /weapons stay powered down/i.test(await p4.innerText('[data-testid=orders-strip]')));
  check('v0.4 (a): comms opened to the Kestrel', /Kestrel/.test(await p4.innerText('[data-testid=comms]')));
  for (let i = 0; i < 3; i++) await send4('wait');
  check('v0.4 (a): weapons still SAFE three minutes later', (await p4.innerText('[data-testid=weapons-state]')).startsWith('SAFE'));

  // Safety: an untargeted "Fire" with both ships in view asks rather than guessing.
  await gotoSim(p4, 42);
  await p4.click('[data-testid=skip-intro]');
  await send4('Fire');
  check('v0.4 safety: bare "Fire" asks which contact', /Fire on which contact/.test(await p4.innerText('[data-testid=clarification]')));
  check('v0.4 safety: nothing fired', (await p4.innerText('[data-testid=weapons-state]')).startsWith('SAFE') && !/beams|torpedo away|firing/i.test((await nar4()).slice(-300)));
  await send4('Lower shields and raise them again');
  check('v0.4 safety: contradictory shields order asks', /Raise or lower the shields/.test(await p4.innerText('[data-testid=clarification]')) && (await p4.innerText('[data-testid=shield-state]')) === 'LOWERED');
  await gotoSim(p4, 4);
  await p4.click('[data-testid=skip-intro]');
  mark = (await nar4()).length;
  await send4('No matter what, keep us between the Kestrel and the cruiser. If the Kestrel arms its weapons, raise our shields, but not until then.');
  const strip = await p4.innerText('[data-testid=orders-strip]');
  check('v0.4 (b): persistent interpose + standing order shown', /no matter what/i.test(strip) && /When Kestrel arms weapons/i.test(strip), strip.replace(/\n/g, ' | '));
  check('v0.4 (b): shields NOT raised before the trigger', (await p4.innerText('[data-testid=shield-state]')) === 'LOWERED');
  await send4('red alert');
  check('v0.4 (b): red alert holds shields down per the order', (await p4.innerText('[data-testid=shield-state]')) === 'LOWERED');
  let fired = false;
  for (let i = 0; i < 15 && !fired && !(await p4.locator('[data-testid=outcome]').count()); i++) {
    await send4('wait');
    const k = await p4.innerText('[data-testid=contact-kestrel]');
    const up = (await p4.innerText('[data-testid=shield-state]')) === 'RAISED';
    if (up) { fired = /Point-defence ARMED/i.test(k); break; }
  }
  said = (await nar4()).slice(mark);
  check('v0.4 (b): Kestrel arms → standing order raises shields (and not before)', fired && /Standing order: Kestrel arms weapons/.test(said));
  check('v0.4 (b): player weapons never armed', (await p4.innerText('[data-testid=weapons-state]')).startsWith('SAFE'));
  await p4.screenshot({ path: `${SHOTS}/v04-01-standing-order.png` });

  // --- Living Universe: enable (dev), credits
  await p4.goto(withSeed(3), { waitUntil: 'networkidle' });
  await skipIntro(p4);
  await hub('universe');
  await p4.click('[data-testid=lu-enable]');
  await p4.waitForTimeout(150);
  // v0.5: first activation is a commission (deliberate change: v0.4 enabled the board directly).
  await p4.click('[data-testid=commission-accept]');
  await p4.waitForTimeout(150);
  await hub('universe');
  check('v0.4: 10 canonical starts shown', (await credits()) === 10 && (await p4.getAttribute('[data-testid=credits-remaining]', 'data-remaining')) === '10');
  check('v0.4: three offer classes on the board', (await p4.locator('[data-class=directive]').count()) === 1 && (await p4.locator('[data-class=distress]').count()) === 1 && (await p4.locator('[data-class=voluntary]').count()) >= 1);
  await p4.screenshot({ path: `${SHOTS}/v04-02-universe-board.png`, fullPage: true });
  const distressId = (await p4.getAttribute('[data-class=distress]', 'data-testid')).replace('offer-', '');
  await p4.click(`[data-testid=offer-${distressId}-ignore]`);
  await p4.waitForTimeout(100);
  check('v0.4: ignoring a distress call is free', (await credits()) === 10);

  // --- canonical Kestrel mission
  await p4.locator('[data-class=directive] [data-testid$=-start]').click();
  await p4.waitForTimeout(250);
  check('v0.4: starting a canonical mission costs 1', (await credits()) === 9);
  check('v0.4: banner says CANONICAL', (await banner()) === 'canonical', await p4.innerText('[data-testid=mode-banner]'));
  if (await p4.locator('[data-testid=skip-intro]').count()) await p4.click('[data-testid=skip-intro]');
  const canonTitle = await playToOutcome(['keep us between the kestrel and the cruiser', 'wait', 'wait', 'wait', 'evacuate the crew', 'tell the prefect this is a humanitarian rescue']);
  check('v0.4: canonical mission reaches an outcome', !!canonTitle, canonTitle);
  check('v0.4: outcome marked as canonical history', /Recorded in canonical history/i.test(await p4.innerText('[data-testid=outcome]')));
  check('v0.4: finishing is free', (await credits()) === 9);
  await p4.screenshot({ path: `${SHOTS}/v04-03-canonical-outcome.png` });

  // --- reload: canonical outcome persists; archive entry exists
  await p4.reload({ waitUntil: 'networkidle' });
  await hub('archive');
  const outEl = p4.locator('[data-testid^=archive-outcome-]').first();
  const missionId = (await outEl.getAttribute('data-testid')).replace('archive-outcome-', '');
  const canonText = await outEl.innerText();
  check('v0.4: canonical outcome persists after reload, in the Archive', canonText.toLowerCase().includes(canonTitle.toLowerCase()), canonText);
  await p4.screenshot({ path: `${SHOTS}/v04-04-archive.png`, fullPage: true });

  // --- replay as a simulation with different choices → a different simulated outcome
  let simTitle = '';
  const strategies = [['withdraw', 'wait', 'jump', 'jump', 'jump'], ['red alert', 'arm weapons', 'fire on the cruiser', 'fire on the cruiser', 'fire torpedoes at the cruiser'], ['wait']];
  for (const strat of strategies) {
    await hub('archive');
    await p4.click(`[data-testid=archive-replay-${missionId}]`);
    await p4.waitForTimeout(200);
    if (await p4.locator('[data-testid=skip-intro]').count()) await p4.click('[data-testid=skip-intro]');
    if (strat === strategies[0]) check('v0.4: archive replay runs as SIMULATION', (await banner()) === 'simulation');
    simTitle = await playToOutcome(strat);
    if (simTitle && simTitle.toLowerCase() !== canonTitle.toLowerCase()) break;
  }
  check('v0.4: different choices → different simulated outcome', !!simTitle && simTitle.toLowerCase() !== canonTitle.toLowerCase(), `canon "${canonTitle}" vs sim "${simTitle}"`);
  check('v0.4: simulated outcome labelled as simulated', /Simulated outcome/i.test(await p4.innerText('[data-testid=outcome]')));
  check('v0.4: simulations are free', (await credits()) === 9);
  await p4.screenshot({ path: `${SHOTS}/v04-05-sim-replay-outcome.png` });
  await hub('archive');
  check('v0.4: canonical outcome unchanged after the simulation', (await p4.innerText(`[data-testid=archive-outcome-${missionId}]`)) === canonText);
  check('v0.4: simulated run listed separately', (await p4.locator(`[data-testid=archive-entry-${missionId}] .sim-runs`).count()) === 1);

  // --- ignored distress call → persistent consequence → evidence in a later canonical mission
  await hub('universe');
  let resolved = false;
  for (let i = 0; i < 10 && !resolved; i++) {
    const st = await p4.getAttribute(`[data-testid=closed-${distressId}-event]`, 'data-status');
    resolved = st === 'resolved' || st === 'expired';
    if (!resolved) { await p4.click('[data-testid=advance-time]'); await p4.waitForTimeout(80); }
  }
  const bulletin = resolved ? (await p4.locator('[data-testid^=bulletin-]').allInnerTexts()).find((t) => /Tamsin Grey|hauler/i.test(t)) ?? '' : '';
  check('v0.4: ignored distress call reaches a consequence without the player', resolved && !!bulletin, bulletin);
  await p4.screenshot({ path: `${SHOTS}/v04-06-distress-consequence.png`, fullPage: true });
  await p4.locator('[data-testid^=offer-]:has-text("Reach patrol") [data-testid$=-start]').first().click();
  await p4.waitForTimeout(250);
  if (await p4.locator('[data-testid=skip-intro]').count()) await p4.click('[data-testid=skip-intro]');
  check('v0.4: the next canonical mission opens with the bulletin as evidence', (await nar4()).includes(bulletin.slice(0, 40)) || (await p4.innerText('[data-testid=comms]')).includes(bulletin.slice(0, 40)));
  check('v0.4: second canonical start costs 1 more', (await credits()) === 8);

  // --- zero credits: no canonical starts, simulations still work, history readable
  await hub('settings');
  await p4.fill('[data-testid=dev-credit-limit]', '2');
  await p4.waitForTimeout(100);
  await hub('universe');
  check('v0.4: at zero, canonical starts are disabled', (await credits()) === 0 && (await p4.locator('[data-testid$=-start]:not([disabled])').count()) === 0 && (await p4.locator('[data-testid=credits-exhausted]').count()) === 1);
  check('v0.4: at zero, canonical time is paused (no in-universe penalty)', await p4.locator('[data-testid=advance-time]').isDisabled());
  await p4.screenshot({ path: `${SHOTS}/v04-07-zero-credits.png`, fullPage: true });
  await hub('record');
  check('v0.4: at zero, canonical history readable', /Kestrel Incident/i.test(await p4.innerText('[data-testid=career]')));
  await hub('archive');
  await p4.click('[data-testid=archive-train-TRN-kestrel]');
  await p4.waitForTimeout(200);
  if (await p4.locator('[data-testid=skip-intro]').count()) await p4.click('[data-testid=skip-intro]');
  await send4('scan the kestrel');
  check('v0.4: at zero, simulations still run', (await banner()) === 'simulation' && /TURN 1/.test(await p4.innerText('[data-testid=mission-clock]')));
  await hub('settings');
  check('v0.4: credits are stated as not tamper-proof', /not tamper-proof/i.test(await p4.innerText('[data-testid=credits-disclaimer]')));
  await p4.fill('[data-testid=dev-credit-limit]', '10');
  await closeHub();

  // --- mobile: hub, banner and credits usable on a phone
  await p4.setViewportSize({ width: 390, height: 844 });
  await p4.waitForTimeout(300);
  check('v0.4 phone: mode banner visible', await p4.locator('[data-testid=mode-banner]').isVisible());
  check('v0.4 phone: credits visible', await p4.locator('[data-testid=credits]').isVisible());
  await hub('archive');
  const ov = await p4.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('v0.4 phone: hub has no horizontal overflow', ov <= 0, `overflow ${ov}px`);
  await p4.screenshot({ path: `${SHOTS}/v04-08-phone-archive.png`, fullPage: true });
  await hub('universe');
  await p4.screenshot({ path: `${SHOTS}/v04-09-phone-universe.png`, fullPage: true });
  await hub('record');
  await p4.screenshot({ path: `${SHOTS}/v04-10-phone-record.png`, fullPage: true });
  await ctx4.close();
}

// ============================================================== v0.5 / M3.1 =====
// Bridge-first startup, two-way comms, Active Duty (commission, organic traffic, science, first contact), reserve.
{
  const ctx5 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx5.addInitScript(stubs);
  const p5 = await ctx5.newPage();
  p5.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p5.on('pageerror', (e) => errors.push(String(e)));
  const all5 = async () => (await p5.innerText('[data-testid=narrative]')) + '\n' + (await p5.innerText('[data-testid=comms]'));
  const mode = () => p5.getAttribute('[data-testid=mode-banner]', 'data-mode');
  const hub5 = async (tab) => {
    if (!(await p5.locator('[data-testid=hub]').count())) await p5.click('[data-testid=open-hub]');
    await p5.click(`[data-testid=hub-tab-${tab}]`);
    await p5.waitForTimeout(150);
  };
  const close5 = async () => { if (await p5.locator('[data-testid=hub]').count()) await p5.click('[data-testid=hub-close]'); await p5.waitForTimeout(100); };
  /** Say something on the bridge and return only what was said in reply (crew + comms). */
  const tailAfter = (b, a) => (a.startsWith(b) ? a.slice(b.length) : a.slice(-1200));
  const ask = async (cmd, wait = 1000) => {
    const n0 = await p5.innerText('[data-testid=narrative]');
    const c0 = await p5.innerText('[data-testid=comms]');
    await sendOn(p5, cmd, wait);
    const n1 = await p5.innerText('[data-testid=narrative]');
    const at = n1.lastIndexOf(cmd);
    const narr = at >= 0 ? n1.slice(at + cmd.length) : tailAfter(n0, n1);
    return narr + '\n' + tailAfter(c0, await p5.innerText('[data-testid=comms]'));
  };

  // 1. idle bridge on load
  await p5.goto(URL, { waitUntil: 'networkidle' });
  await p5.waitForTimeout(800);
  check('v0.5: app opens on the idle bridge', (await mode()) === 'bridge' && /holds station/.test(await all5()));
  {
    const page = await p5.innerText('body');
    check('v0.5.1 names: the ISV Halcyon of the Intergalactic Space Agency', /ISV Halcyon/i.test(page) && /Intergalactic Space Agency/i.test(page), page.slice(0, 200));
    check('v0.5.1 names: no Concord / CSV leftovers on the bridge', !/\bConcord\b|\bCSV\b/i.test(page));
  }
  check('v0.5: idle bridge has no contacts, no objectives, no emergency', (await p5.locator('[data-testid=contact-kestrel]').count()) === 0 && (await p5.locator('[data-testid=contact-cruiser]').count()) === 0 && !/distress|warship/i.test(await all5()));
  await skipIntro(p5);
  await p5.screenshot({ path: `${SHOTS}/v05-01-idle-bridge.png` });

  // 2. bridge interaction before any mission
  let r = await ask('First Officer, give me a status report');
  check('v0.5: crew answers on the idle bridge (status)', /All quiet, Captain/.test(r), r.slice(-200));
  r = await ask('Science, what systems are within exploration range?');
  check('v0.5: science survey on the bridge', /systems within exploration range/.test(r), r.slice(-200));
  r = await ask('Okafor, how are the engines?');
  check('v0.5: small talk with an officer', /Chief Dana Okafor/i.test(r) && !/didn't follow/.test(r), r.slice(-160));
  check('v0.5: still on the bridge (no sim without a request)', (await mode()) === 'bridge');

  // 3. voice-style simulation start (stubbed recognition)
  await p5.evaluate(() => { window.__transcript = 'Computer, begin the Kestrel Incident simulation'; });
  await p5.click('[data-testid=mic-button]');
  await p5.waitForTimeout(250);
  check('v0.5 voice: recognised command fills the input', (await p5.inputValue('[data-testid=command-input]')) === 'Computer, begin the Kestrel Incident simulation');
  await p5.press('[data-testid=command-input]', 'Enter');
  await p5.waitForTimeout(1200);
  check('v0.5 voice: spoken request starts the simulation', (await mode()) === 'simulation');
  await skipIntro(p5);

  // 4. multi-turn comms on a persistent channel
  r = await ask('Hail the cruiser', 300);
  check('v0.5 comms: hail opens a persistent channel', (await p5.getAttribute('[data-testid=channel-indicator]', 'data-party')) === 'cruiser', r.slice(-200));
  r = await ask('We are here to rescue the crew of the Kestrel.', 300);
  check('v0.5 comms: the Prefect answers the line (turn 1)', /vane/i.test(r), r.slice(-200));
  r = await ask('How long will you give us?', 300);
  check('v0.5 comms: the conversation continues (turn 2), channel still open', /vane/i.test(r) && (await p5.locator('[data-testid=channel-indicator]').count()) === 1, r.slice(-200));
  r = await ask('Rask, keep weapons safe.', 300);
  check('v0.5 comms: a crew order on an open channel goes to the crew, not the Prefect', /rask/i.test(r) && !/vane/i.test(r) && (await p5.innerText('[data-testid=weapons-state]')).startsWith('SAFE'), r.slice(-200));
  await p5.screenshot({ path: `${SHOTS}/v05-02-sim-comms.png` });

  // 5. ending the simulation returns to the bridge
  await sendOn(p5, 'Computer, end the simulation', 1200);
  check('v0.5: "end the simulation" returns to the bridge', (await mode()) === 'bridge' && /Simulation ended|simulation ends/i.test(await all5()));

  // 6. commission on first activation of Active Duty
  await hub5('settings');
  await p5.click('[data-testid=dev-lu-toggle]');
  await p5.waitForTimeout(300);
  check('v0.5: first activation shows the commission ceremony', (await p5.locator('[data-testid=commission]').count()) === 1);
  {
    const cer = await p5.innerText('[data-testid=commission]');
    check('v0.5.1 names: the commission comes from ISA Fleet Command', /ISA Fleet Command/i.test(cer) && /Intergalactic Space Agency/i.test(cer) && !/Concord|CSV/i.test(cer), cer.slice(0, 200));
  }
  await p5.screenshot({ path: `${SHOTS}/v05-03-commission.png` });
  await p5.click('[data-testid=commission-accept]');
  await p5.waitForTimeout(400);
  await close5();
  await p5.waitForTimeout(1500);
  check('v0.5: commissioned — on active duty', (await p5.getAttribute('[data-testid=mode-banner]', 'data-duty')) === 'active');

  // 7. organic delivery: Fleet hails in; the captain answers by talking
  let txt = await all5();
  check('v0.5 organic: a Fleet directive arrives as a hail on the bridge', /Fleet Command is hailing/.test(txt) && /mandatory directive/.test(txt));
  await p5.screenshot({ path: `${SHOTS}/v05-04-fleet-hail.png` });
  r = await ask('Request clarification from Fleet Command');
  check('v0.5 organic: questioning the directive gets Fleet’s reply', /Directive stands/.test(r), r.slice(-200));
  r = await ask('We refuse the directive, the ship is not fit for duty');
  check('v0.5 organic: refusal by voice is transmitted (free)', /Refusal transmitted/.test(r), r.slice(-200));
  let event = false;
  let quiet = false;
  for (let i = 0; i < 8 && !(event && quiet); i++) {
    r = await ask('Continue the patrol');
    if (/distress call|A request for us|Fleet Command is hailing|News on the Fleet relay|something new on the long-range array/.test(r)) event = true;
    if (/quiet watch/.test(r)) quiet = true;
    if (/Your call, Captain|take it or decline/.test(r)) await ask('Log it and continue');
  }
  check('v0.5 organic: patrol brings events (no mission menu)', event);
  check('v0.5 organic: and quiet periods', quiet);
  await p5.screenshot({ path: `${SHOTS}/v05-05-patrol.png` });

  // 8. science: civilizations detected but not contacted → investigate → first contact
  r = await ask("Science, show me the civilizations we've detected but haven't contacted");
  check('v0.5 science: three uncontacted civilizations listed', /(3|4) systems show signs of a civilization/.test(r), r.slice(-260));
  const target = /contacted: ([A-Z][a-z]+(?: [A-Z][a-z]+)?), /.exec(r)?.[1];
  r = await ask(`Helm, set a course for ${target}`);
  check('v0.5 science: course laid in and the system investigated', /Course laid in/.test(r) && /Confirmed, Captain/.test(r), r.slice(-300));
  r = await ask('Hail them');
  check('v0.5 first contact: hail opens a channel to the civilization', (await p5.getAttribute('[data-testid=channel-indicator]', 'data-party')) === 'kestrel', r.slice(-200));
  r = await ask('Who are your people?');
  check('v0.5 first contact: multi-turn (they answer and ask again)', /We are the/.test(r), r.slice(-200));
  r = await ask('We come in peace. We are explorers from the Agency.');
  check('v0.5 first contact: outcome recorded in canonical history', /Entered in your record/.test(r), r.slice(-260));
  await p5.screenshot({ path: `${SHOTS}/v05-06-first-contact.png` });
  await hub5('record');
  check('v0.5 first contact: in the captain’s career', /First contact with the/.test(await p5.innerText('[data-testid=career]')));
  await hub5('universe');
  check('v0.5: the offer log is secondary (Fleet Command offer log)', /Fleet Command offer log/i.test(await p5.innerText('[data-testid=hub]')));
  await close5();

  // 9. inactive duty (reserve): career preserved, canon frozen
  await hub5('settings');
  await p5.click('[data-testid=dev-lu-toggle]');
  await p5.waitForTimeout(300);
  await hub5('universe');
  check('v0.5 reserve: reserve status shown', (await p5.locator('[data-testid=lu-reserve]').count()) === 1);
  await close5();
  r = await ask('Continue the patrol');
  check('v0.5 reserve: no patrol / canonical time while inactive', /training status/.test(r), r.slice(-200));
  await hub5('record');
  check('v0.5 reserve: career preserved', /First contact with the/.test(await p5.innerText('[data-testid=career]')));
  await close5();

  // 10. mobile
  await p5.setViewportSize({ width: 390, height: 844 });
  await p5.waitForTimeout(400);
  const ov5 = await p5.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const wide5 = await p5.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 4).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)}[${e.getAttribute('data-testid') ?? ''}]`).join(', '));
  check('v0.5 phone: bridge has no horizontal overflow', ov5 <= 0, `overflow ${ov5}px ${wide5}`);
  const ovLong = await p5.evaluate(() => {
    const s = document.querySelector('.comms .log-scroll') || document.querySelector('.comms .panel-body');
    if (!s) return -1;
    const d = document.createElement('div'); d.className = 'log-entry ch-comms'; d.id = 'smoke-long-speaker';
    d.innerHTML = '<span class="log-time">T+01:00</span><span class="log-speaker">Ossari Listening Ring · First Listener Tavin Ossu of the Quiet Council</span><p class="log-text">Smoke layout probe.</p>';
    s.appendChild(d);
    const o = document.documentElement.scrollWidth - window.innerWidth;
    d.remove();
    return o;
  });
  check('v0.5 phone: a long caller name does not widen the comms panel', ovLong === 0, `overflow ${ovLong}px`);
  check('v0.5 phone: command input and mode banner visible', (await p5.locator('[data-testid=command-input]').isVisible()) && (await p5.locator('[data-testid=mode-banner]').isVisible()));
  r = await ask('First Officer, give me a status report');
  check('v0.5 phone: bridge commands work', /Captain/.test(r));
  await p5.screenshot({ path: `${SHOTS}/v05-07-phone-bridge.png`, fullPage: true });
  await ctx5.close();
}

// ============================================================== v0.6 =====
// Multi-scenario foundation + Training Simulation 002: list, archive, launch #2 by name, play to an ending.
{
  const ctx6 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx6.addInitScript(stubs);
  const p6 = await ctx6.newPage();
  p6.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p6.on('pageerror', (e) => errors.push(String(e)));
  const all6 = async () => (await p6.innerText('[data-testid=narrative]')) + '\n' + (await p6.innerText('[data-testid=comms]'));
  const mode6 = () => p6.getAttribute('[data-testid=mode-banner]', 'data-mode');
  const hub6 = async (tab) => {
    if (!(await p6.locator('[data-testid=hub]').count())) await p6.click('[data-testid=open-hub]');
    await p6.click(`[data-testid=hub-tab-${tab}]`);
    await p6.waitForTimeout(150);
  };
  const close6 = async () => { if (await p6.locator('[data-testid=hub]').count()) await p6.click('[data-testid=hub-close]'); await p6.waitForTimeout(100); };

  // Seed 5: an incense allergy and a humane Warden (a short, known path to an ending).
  await p6.goto(withSeed(5), { waitUntil: 'networkidle' });
  await p6.waitForTimeout(600);
  await skipIntro(p6);
  check('v0.6: opens on the idle bridge', (await mode6()) === 'bridge');
  await sendOn(p6, 'Computer, list simulations', 600);
  let t6 = await all6();
  check('v0.6: "list simulations" names #1 and #2', /The Kestrel Incident/.test(t6) && /Quarantine at Tallis Gate/.test(t6), t6.slice(-300));
  check('v0.6: listing does not start a simulation', (await mode6()) === 'bridge');
  await p6.screenshot({ path: `${SHOTS}/sim02-01-list-simulations.png` });
  await hub6('archive');
  const arch = await p6.innerText('[data-testid=hub]');
  check('v0.6: Mission Archive lists Training Simulation 002', /Training Simulation 002: Quarantine at Tallis Gate/.test(arch) && /Training Simulation 001: The Kestrel Incident/.test(arch));
  check('v0.6: archive has a train button for #2', (await p6.locator('[data-testid=archive-train-TRN-tallis]').count()) === 1);
  await p6.screenshot({ path: `${SHOTS}/sim02-02-archive.png` });
  await close6();

  await sendOn(p6, 'Computer, begin the Quarantine at Tallis Gate simulation', 1200);
  await p6.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('v0.6: launch #2 by name starts a simulation', (await mode6()) === 'simulation');
  await p6.waitForTimeout(4500);
  t6 = await all6();
  check('v0.6: #2 intro plays (Tallis Gate, the liner)', /Tallis Gate/.test(t6) && /Mercy of Ilun/.test(t6), t6.slice(0, 300));
  await skipIntro(p6);
  await p6.screenshot({ path: `${SHOTS}/sim02-03-intro.png` });
  check('v0.6: two contacts on sensors, unidentified until scanned', (await p6.locator('[data-testid=contact-kestrel]').count()) === 1 && (await p6.locator('[data-testid=contact-cruiser]').count()) === 1 && !/Kestrel/.test(await p6.innerText('[data-testid=contact-kestrel]')));
  check('v0.6: four objectives for #2', (await p6.locator('[data-testid=objectives] li').count()) === 4);
  for (const c of ['take us to 3,000 km of the liner', 'wait', 'wait']) await sendOn(p6, c, 250);
  await sendOn(p6, 'scan the liner', 300);
  check('v0.6: close scan diagnoses the sickness', /allergic reaction/.test(await all6()));
  await sendOn(p6, 'scan the picket', 300);
  check('v0.6: scans identify the liner and the picket', /Mercy of Ilun/.test(await p6.innerText('[data-testid=contact-kestrel]')) && /Thornwake/.test(await p6.innerText('[data-testid=contact-cruiser]')));
  await sendOn(p6, 'hail the picket', 400);
  check('v0.6: comms session with Warden-Commander Marr', (await p6.getAttribute('[data-testid=channel-indicator]', 'data-party')) === 'cruiser' && /Warden-Commander Isolde Marr/.test(await p6.innerText('[data-testid=comms]')));
  await p6.screenshot({ path: `${SHOTS}/sim02-04-comms.png` });
  await sendOn(p6, 'tell her our scans show it is not contagious', 600);
  await p6.waitForSelector('[data-testid=outcome]');
  const out6 = await p6.innerText('[data-testid=outcome]');
  check('v0.6: #2 played to an ending (Line Lifted)', /Line Lifted/i.test(out6), out6.slice(0, 200));
  t6 = await all6();
  check('v0.6: no Kestrel names leak into #2', !/Kestrel|Prefect|Ashen Covenant|Directorate|\[[a-zA-Z_]+\]/.test(t6), (t6.match(/.{0,60}(Kestrel|Prefect|Ashen Covenant|Directorate|\[[a-zA-Z_]+\]).{0,60}/) ?? [''])[0]);
  await p6.screenshot({ path: `${SHOTS}/sim02-05-outcome.png` });
  await hub6('archive');
  check('v0.6: the #2 run is filed under #2 in the archive', /Line Lifted/i.test((await p6.locator('[data-testid=archive-entry-TRN-tallis]').textContent()) ?? '') && !/Line Lifted/i.test((await p6.locator('[data-testid=archive-entry-TRN-kestrel]').textContent()) ?? ''));
  await close6();
  if (await p6.locator('[data-testid=outcome-new]').count()) {
    await p6.click('[data-testid=outcome-new]');
    await p6.waitForTimeout(800);
    await skipIntro(p6);
    const body6 = await p6.innerText('body');
    check('v0.6: "New scenario" keeps simulation #2 (new seed)', (await mode6()) === 'simulation' && /Training Simulation 002: Quarantine at Tallis Gate/i.test(body6) && !/Kestrel Incident/i.test(body6), body6.slice(0, 160));
  } else check('v0.6: "New scenario" keeps simulation #2 (new seed)', false, 'no outcome-new button');
  await p6.setViewportSize({ width: 390, height: 844 });
  await p6.waitForTimeout(400);
  const ov6 = await p6.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('v0.6 phone: #2 has no horizontal overflow', ov6 <= 0, `overflow ${ov6}px`);
  await p6.screenshot({ path: `${SHOTS}/sim02-06-phone.png`, fullPage: true });
  await sendOn(p6, 'Computer, end the simulation', 1200);
  check('v0.6: ending #2 returns to the bridge', (await mode6()) === 'bridge');
  await ctx6.close();
}

// ============================================================== v0.6.1 =====
// Crew voices with a mocked device voice list: async voiceschanged, distinct casting, preview,
// overrides saved locally, speaker-tagged speech in a simulation, and the scarce-voice fallback.
{
  const voiceMock = (list) => {
    window.__spoken = [];
    window.__voices = [];
    const mk = ([name, lang, local = true]) => ({ name, lang, voiceURI: `mock:${name}`, localService: local, default: name === list[0][0] });
    class FakeUtterance { constructor(text) { this.text = text; this.voice = null; this.pitch = 1; this.rate = 1; this.lang = ''; } }
    window.SpeechSynthesisUtterance = FakeUtterance;
    const synth = window.speechSynthesis;
    synth.getVoices = () => window.__voices;
    synth.speak = (u) => window.__spoken.push({ text: u.text, voice: u.voice?.name ?? null, pitch: u.pitch, rate: u.rate });
    synth.cancel = () => {};
    // Like Chrome: the list is empty at first and arrives later with a voiceschanged event.
    setTimeout(() => {
      window.__voices = list.map(mk);
      synth.dispatchEvent(new Event('voiceschanged'));
    }, 400);
    window.SpeechRecognition = window.webkitSpeechRecognition = class { start() {} stop() {} };
  };
  const MANY = [['Samantha', 'en-US'], ['Alex', 'en-US'], ['Daniel', 'en-GB'], ['Kate', 'en-GB'], ['Serena', 'en-GB'], ['Arthur', 'en-GB'], ['Martha', 'en-GB'], ['Karen', 'en-AU'], ['Catherine', 'en-AU'], ['Moira', 'en-IE'], ['Tessa', 'en-ZA'], ['Victoria', 'en-US'], ['Susan', 'en-US'], ['Fred', 'en-US'], ['Google US English', 'en-US', false], ['Zarvox', 'en-US'], ['Thomas', 'fr-FR']];
  const CREW = ['computer', 'marrow', 'rask', 'varga', 'adeyemi', 'szabo', 'okafor', 'osei', 'narrator'];
  const ctx7 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx7.addInitScript(presetName);
  await ctx7.addInitScript(voiceMock, MANY);
  const p7 = await ctx7.newPage();
  p7.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p7.on('pageerror', (e) => errors.push(String(e)));
  const rows7 = () => p7.evaluate((keys) => keys.map((k) => { const r = document.querySelector(`[data-testid=voice-row-${k}]`); return r ? { k, v: r.getAttribute('data-voice'), p: r.getAttribute('data-pitch'), r: r.getAttribute('data-rate') } : null; }), CREW);
  await p7.goto(withSeed(5), { waitUntil: 'networkidle' });
  await skipIntro(p7);
  await p7.waitForTimeout(600);
  await p7.click('[data-testid=open-hub]');
  await p7.click('[data-testid=hub-tab-voices]');
  await p7.waitForTimeout(300);
  const cnt = p7.locator('[data-testid=voice-count]');
  check('v0.6.1: voices arrive via voiceschanged (14 usable: no cloud, novelty or non-English voices)', (await cnt.getAttribute('data-usable')) === '14', await cnt.innerText());
  let rows = await rows7();
  check('v0.6.1: every crew member and the computer has a different voice', rows.every(Boolean) && new Set(rows.map((r) => r.v)).size === CREW.length, JSON.stringify(rows.map((r) => r?.v)));
  check('v0.6.1: computer is calm (Samantha, rate 0.95); Rask is Alex at low pitch', rows[0].v === 'mock:Samantha' && rows[0].r === '0.95' && rows[2].v === 'mock:Alex' && Number(rows[2].p) < 1);
  await p7.screenshot({ path: `${SHOTS}/v061-01-voice-panel.png`, fullPage: true });
  await p7.click('[data-testid=voice-preview-rask]');
  await p7.waitForTimeout(150);
  let last = await p7.evaluate(() => window.__spoken.at(-1));
  check('v0.6.1: preview speaks with the assigned voice, pitch and rate', last?.voice === 'Alex' && last.pitch === Number(rows[2].p) && /Tactical/.test(last.text), JSON.stringify(last));
  await p7.selectOption('[data-testid=voice-select-rask]', 'mock:Fred');
  await p7.waitForTimeout(150);
  check('v0.6.1: override changes the voice', /Fred/.test(await p7.innerText('[data-testid=voice-assigned-rask]')) && /your choice/.test(await p7.innerText('[data-testid=voice-assigned-rask]')));
  await p7.reload({ waitUntil: 'networkidle' });
  await skipIntro(p7);
  await p7.waitForTimeout(700);
  await p7.click('[data-testid=open-hub]');
  await p7.click('[data-testid=hub-tab-voices]');
  await p7.waitForTimeout(200);
  rows = await rows7();
  check('v0.6.1: override persists across reload (saved locally)', rows[2].v === 'mock:Fred', rows[2].v);
  await p7.click('[data-testid=voice-reset-rask]');
  await p7.waitForTimeout(150);
  rows = await rows7();
  check('v0.6.1: "Automatic" restores the cast voice', rows[2].v === 'mock:Alex', rows[2].v);
  await p7.setViewportSize({ width: 390, height: 844 });
  await p7.waitForTimeout(300);
  const ov7 = await p7.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('v0.6.1 phone: voice panel has no horizontal overflow', ov7 <= 0, `overflow ${ov7}px`);
  await p7.screenshot({ path: `${SHOTS}/v061-02-voice-panel-phone.png`, fullPage: true });
  await p7.setViewportSize({ width: 1440, height: 900 });
  await p7.click('[data-testid=hub-close]');
  // Speech in a simulation: each line is spoken in its speaker's voice.
  await p7.click('[data-testid=voice-toggle]');
  await sendOn(p7, 'Computer, begin the Tallis Gate simulation', 1200);
  await p7.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  await p7.waitForTimeout(100);
  const base7 = await p7.evaluate(() => window.__spoken.length);
  await skipIntro(p7);
  for (const c of ['take us to 3,000 km of the liner', 'scan the liner', 'hail the picket', 'what do you want', 'close the channel', 'status report']) await sendOn(p7, c, 400);
  await p7.click('[data-testid=open-hub]');
  await p7.click('[data-testid=hub-tab-voices]');
  await p7.waitForTimeout(200);
  const castMap = await p7.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-testid^=voice-row-]')].map((r) => [r.getAttribute('data-testid').replace('voice-row-', ''), r.getAttribute('data-voice')])));
  await p7.screenshot({ path: `${SHOTS}/v061-03-voice-panel-in-sim.png`, fullPage: true });
  await p7.click('[data-testid=hub-close]');
  const pairs = await p7.evaluate((base) => {
    const norm = (s) => s.replace(/["“”]/g, '').trim();
    const lines = [...document.querySelectorAll('.log-entry[data-voice]')].map((e) => ({ key: e.getAttribute('data-voice'), text: norm(e.querySelector('.log-text').textContent) }));
    return window.__spoken.slice(base).map((u) => ({ ...u, key: lines.find((l) => l.text === norm(u.text))?.key ?? null }));
  }, base7);
  const tagged = pairs.filter((x) => x.key);
  const byKey = {};
  for (const x of tagged) (byKey[x.key] ??= new Set()).add(x.voice);
  const marrKey = 'npc:tallis-quarantine:marr';
  check('v0.6.1: every spoken line is matched to a tagged speaker', pairs.length > 5 && tagged.length === pairs.length, `${tagged.length}/${pairs.length}`);
  check('v0.6.1: each speaker is always spoken in their cast voice', Object.entries(byKey).every(([k, vs]) => vs.size === 1 && [...vs][0] === (castMap[k] ?? castMap.other ?? '').replace('mock:', '')), JSON.stringify(Object.fromEntries(Object.entries(byKey).map(([k, v]) => [k, [...v]]))));
  check('v0.6.1: Warden-Commander Marr speaks, in a voice no bridge officer uses', !!byKey[marrKey] && !CREW.some((k) => castMap[k] === castMap[marrKey]), castMap[marrKey]);
  check('v0.6.1: at least three different voices heard in one session', new Set(tagged.map((x) => x.voice)).size >= 3);
  await ctx7.close();

  // Scarce voices (like an iPhone with two English voices): shared voices, separated by pitch/rate.
  const ctx8 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx8.addInitScript(presetName);
  await ctx8.addInitScript(voiceMock, [['Samantha', 'en-US'], ['Daniel', 'en-GB']]);
  const p8 = await ctx8.newPage();
  p8.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p8.on('pageerror', (e) => errors.push(String(e)));
  await p8.goto(withSeed(5), { waitUntil: 'networkidle' });
  await skipIntro(p8);
  await p8.waitForTimeout(600);
  await p8.click('[data-testid=open-hub]');
  await p8.click('[data-testid=hub-tab-voices]');
  await p8.waitForTimeout(300);
  const r8 = await p8.evaluate((keys) => keys.map((k) => { const r = document.querySelector(`[data-testid=voice-row-${k}]`); return `${r.getAttribute('data-voice')}|${r.getAttribute('data-pitch')}|${r.getAttribute('data-rate')}`; }), CREW);
  check('v0.6.1 scarce: two voices shared by the crew, nobody sounds identical', new Set(r8.map((x) => x.split('|')[0])).size === 2 && new Set(r8).size === CREW.length, r8.join(' '));
  await p8.screenshot({ path: `${SHOTS}/v061-04-voice-panel-two-voices.png`, fullPage: true });
  await ctx8.close();
}

// ============================================================== v0.7 =====
// Evaluation & Records: the naming prompt, the Service Record (personnel, rename), after-action
// reports for both simulations, the Training section, words not numbers, rename requests declined.
{
  const ctx9 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx9.addInitScript(() => { try { sessionStorage.setItem('smoke.askName', '1'); } catch {} });
  await ctx9.addInitScript(stubs);
  const p9 = await ctx9.newPage();
  p9.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p9.on('pageerror', (e) => errors.push(String(e)));
  const all9 = async () => (await p9.innerText('[data-testid=narrative]')) + '\n' + (await p9.innerText('[data-testid=comms]'));
  const mode9 = () => p9.getAttribute('[data-testid=mode-banner]', 'data-mode');
  const hub9 = async (tab) => {
    if (!(await p9.locator('[data-testid=hub]').count())) await p9.click('[data-testid=open-hub]');
    await p9.click(`[data-testid=hub-tab-${tab}]`);
    await p9.waitForTimeout(150);
  };
  const close9 = async () => { if (await p9.locator('[data-testid=hub]').count()) await p9.click('[data-testid=hub-close]'); await p9.waitForTimeout(100); };
  const noPercent = async (sel) => !/\d\s*%|percent/i.test(await p9.innerText(sel));

  await p9.goto(withSeed(7), { waitUntil: 'networkidle' });
  await p9.waitForTimeout(500);
  check('v0.7: a new captain is asked for a name', await p9.locator('[data-testid=name-prompt]').isVisible());
  await p9.screenshot({ path: `${SHOTS}/v070-01-name-prompt.png` });
  await p9.fill('[data-testid=name-input]', '<script>alert(1)</script>');
  await p9.click('[data-testid=name-save]');
  await p9.waitForTimeout(150);
  check('v0.7: markup in a name is refused with a reason', (await p9.locator('[data-testid=name-error]').count()) === 1 && (await p9.locator('[data-testid=name-prompt]').isVisible()));
  await p9.screenshot({ path: `${SHOTS}/v070-02-name-rejected.png` });
  await p9.fill('[data-testid=name-input]', "  Siobhán   O'Neill-Okafor ");
  await p9.click('[data-testid=name-save]');
  await p9.waitForTimeout(300);
  check('v0.7: a valid name is saved and the prompt closes', (await p9.locator('[data-testid=name-prompt]').count()) === 0);
  await skipIntro(p9);
  await p9.reload({ waitUntil: 'networkidle' });
  await p9.waitForTimeout(500);
  check('v0.7: the prompt is one-time (not shown after reload)', (await p9.locator('[data-testid=name-prompt]').count()) === 0);
  await skipIntro(p9);
  check('v0.7: the crew addresses the captain by rank and surname', /Captain O'Neill-Okafor/.test(await all9()), (await all9()).slice(0, 300));
  await hub9('record');
  const rec = await p9.innerText('[data-testid=record]');
  check('v0.7: Hub tab is the Service Record', /Service Record/.test(await p9.innerText('[data-testid=hub]')));
  check('v0.7: personnel shows name, rank, address and assignment', (await p9.innerText('[data-testid=personnel-name]')) === "Siobhán O'Neill-Okafor" && /Captain/.test(await p9.innerText('[data-testid=personnel-rank]')) && /ISV Halcyon/.test(rec));
  await p9.screenshot({ path: `${SHOTS}/v070-03-service-record.png`, fullPage: true });
  await close9();

  // rename requests for anything else are declined
  await sendOn(p9, 'rename the ship to Dauntless', 400);
  await sendOn(p9, 'call helm Bob', 400);
  const dec = await all9();
  check('v0.7: "rename the ship" is politely declined', /the Halcyon’s name is on her ISA registry/.test(dec));
  check('v0.7: "call helm Bob" is politely declined', /People keep the names they were given/.test(dec));
  await p9.screenshot({ path: `${SHOTS}/v070-04-rename-declined.png` });

  // Kestrel: abandon (seed 7) -> ending -> AAR
  await sendOn(p9, 'Computer, begin the Kestrel Incident simulation', 1200);
  await p9.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  await p9.waitForTimeout(500);
  await skipIntro(p9);
  for (const c of ['charge the jump drive', 'wait', 'wait', 'jump']) await sendOn(p9, c, 350);
  await p9.waitForTimeout(800);
  check('v0.7: #1 ended and the debrief offers the after-action report', (await mode9()) === 'bridge' && (await p9.locator('[data-testid=outcome-aar]').count()) === 1);
  await p9.click('[data-testid=outcome-aar]');
  await p9.waitForTimeout(300);
  let aar = await p9.innerText('[data-testid=aar]');
  check('v0.7: #1 AAR has objectives, decisions, safety, regulations, strengths, improvements, training', ['Objectives', 'Key decisions', 'Crew safety', 'Civilian safety', 'ISA regulations', 'Strengths', 'Areas to improve', 'Recommended training'].every((h) => aar.includes(h)), aar.slice(0, 300));
  check('v0.7: #1 AAR is filed under the captain’s name', /Captain Siobhán O'Neill-Okafor/.test(await p9.innerText('[data-testid=aar-captain]')));
  check('v0.7: #1 AAR has no percentages or scores', await noPercent('[data-testid=aar]'));
  await p9.screenshot({ path: `${SHOTS}/v070-05-aar-kestrel.png`, fullPage: true });
  await close9();

  // Tallis Gate: line lifted (seed 5)
  await p9.goto(withSeed(5), { waitUntil: 'networkidle' });
  await p9.waitForTimeout(500);
  await skipIntro(p9);
  await sendOn(p9, 'Computer, begin the Quarantine at Tallis Gate simulation', 1200);
  await p9.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  await p9.waitForTimeout(500);
  await skipIntro(p9);
  for (const c of ['take us to 3,000 km of the liner', 'wait', 'wait', 'scan the liner', 'hail the picket']) await sendOn(p9, c, 300);
  await sendOn(p9, 'tell her our scans show it is not contagious', 800);
  await p9.waitForTimeout(500);
  if (await p9.locator('[data-testid=outcome-aar]').count()) await p9.click('[data-testid=outcome-aar]');
  await p9.waitForTimeout(300);
  aar = (await p9.locator('[data-testid=aar]').count()) ? await p9.innerText('[data-testid=aar]') : '';
  check('v0.7: #2 AAR (Line Lifted) is available', /Line Lifted/i.test(aar) && /Recommended training/.test(aar), aar.slice(0, 200));
  check('v0.7: #2 AAR has no percentages or scores', !!aar && (await noPercent('[data-testid=aar]')));
  await p9.screenshot({ path: `${SHOTS}/v070-06-aar-tallis.png`, fullPage: true });
  if (await p9.locator('[data-testid=aar-close]').count()) await p9.click('[data-testid=aar-close]');
  await p9.waitForTimeout(200);

  // Training section
  await p9.click('[data-testid=record-tab-training]');
  await p9.waitForTimeout(200);
  const tr = await p9.innerText('[data-testid=record-training]');
  check('v0.7: Training lists both after-action reports', (await p9.locator('[data-testid=evaluations] li').count()) === 2);
  check('v0.7: competencies are words with evidence', /Not yet assessed|Developing|Competent|Proficient|Distinguished/i.test(tr) && (await p9.locator('[data-testid=competencies] li').count()) >= 8);
  check('v0.7: the Training section shows no percentages', await noPercent('[data-testid=record-training]'));
  check('v0.7: training is marked not canonical', /NOT CANONICAL/i.test(tr));
  await p9.screenshot({ path: `${SHOTS}/v070-07-training.png`, fullPage: true });
  await p9.click('[data-testid=record-tab-requests]');
  await p9.waitForTimeout(150);
  check('v0.7: Fleet Requests section present (empty state)', /No requests on file/.test(await p9.innerText('[data-testid=record-requests]')));

  // Rename in the Service Record; progress kept
  await p9.click('[data-testid=record-tab-overview]');
  await p9.waitForTimeout(150);
  await p9.click('[data-testid=rename-open]');
  await p9.fill('[data-testid=rename-input]', 'Jean-Luc Moreau');
  await p9.click('[data-testid=rename-save]');
  await p9.waitForTimeout(300);
  check('v0.7: rename from the Service Record', (await p9.innerText('[data-testid=personnel-name]')) === 'Jean-Luc Moreau' && /Captain Moreau/.test(await p9.innerText('[data-testid=personnel-address]')));
  await p9.screenshot({ path: `${SHOTS}/v070-08-renamed.png`, fullPage: true });
  await p9.click('[data-testid=record-tab-training]');
  await p9.waitForTimeout(150);
  check('v0.7: renaming kept the training record', (await p9.locator('[data-testid=evaluations] li').count()) === 2);
  await p9.locator('[data-testid^=eval-open-]').first().click();
  await p9.waitForTimeout(200);
  check('v0.7: old reports show the current name', /Captain Jean-Luc Moreau/.test(await p9.innerText('[data-testid=aar-captain]')));
  await close9();
  const ls = await p9.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('starbridge.')).sort().join(','));
  check('v0.7: no canonical store created by simulations', !/starbridge\.canon\.v1/.test(ls), ls);

  // phone
  await p9.setViewportSize({ width: 390, height: 844 });
  await hub9('record');
  await p9.click('[data-testid=record-tab-training]');
  await p9.waitForTimeout(300);
  const ov9 = await p9.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('v0.7 phone: Service Record has no horizontal overflow', ov9 <= 0, `overflow ${ov9}px`);
  await p9.screenshot({ path: `${SHOTS}/v070-09-phone-training.png`, fullPage: true });
  await ctx9.close();
}

// ============================================================== v0.7.1 =====
// The idle bridge knows its setting: no scenario contacts, Fleet Command as a comms party,
// training questions answered from the Training Record.
{
  const ctxA = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxA.addInitScript(stubs);
  const pa = await ctxA.newPage();
  pa.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pa.on('pageerror', (e) => errors.push(String(e)));
  // Lines from the crew and comms (never the captain's own words), per panel, so new ones can be told apart.
  const lines = () => pa.evaluate(() => ['narrative', 'comms'].map((id) => [...document.querySelectorAll(`[data-testid=${id}] .log-entry`)].map((e) => ({ who: e.querySelector('.log-speaker')?.textContent ?? '', text: `${e.querySelector('.log-speaker')?.textContent ?? ''}: ${e.querySelector('.log-text')?.textContent ?? ''}` }))));
  const crewText = async () => (await lines()).flat().filter((x) => x.who !== 'Captain').map((x) => x.text).join('\n');
  const askA = async (cmd, wait = 450) => {
    const [n0, c0] = (await lines()).map((x) => x.length);
    await sendOn(pa, cmd, wait);
    const [n1, c1] = await lines();
    return [...n1.slice(n0), ...c1.slice(c0)].filter((x) => x.who !== 'Captain').map((x) => x.text).join('\n');
  };
  await pa.goto(withSeed(7), { waitUntil: 'networkidle' });
  await pa.waitForTimeout(500);
  await skipIntro(pa);
  check('v0.7.1: idle bridge says "No mission. On station."', /No mission\. On station\./.test(await pa.innerText('[data-testid=objectives]')));
  let a = await askA('what training do i need?');
  check('v0.7.1: "what training do I need?" is answered from the (empty) Training Record', /no exercise has been assessed/.test(a) && /recommend/.test(a), a.slice(-300));
  await pa.screenshot({ path: `${SHOTS}/v071-01-training-question.png` });
  a = await askA('hail the ISA', 600);
  check('v0.7.1: "hail the ISA" opens ISA Fleet Command (not a ship)', /Channel open to ISA Fleet Command/.test(a) && /Go ahead, Captain Ashby/.test(a) && !/which vessel/i.test(a), a.slice(-300));
  await pa.screenshot({ path: `${SHOTS}/v071-02-hail-isa.png` });
  a = await askA('hail them');
  check('v0.7.1: hailing with nothing on sensors says so', /No vessels on sensors/.test(a), a.slice(-200));
  a = await askA('scan the cruiser');
  check('v0.7.1: scanning an absent ship: no contacts', /No contacts/.test(a), a.slice(-200));
  a = await askA('fire torpedoes');
  check('v0.7.1: no "which contact" question with nothing on sensors', !/which contact/i.test(a) && /No contacts/.test(a), a.slice(-200));
  for (const c of ['hail fleet command', 'patch me through to Training Command', 'how am I doing?', 'recommend a simulation', 'helm, full stop', 'status report']) await askA(c, 350);
  // Catalogue titles ("The Kestrel Incident") are fair to name as recommendations; scenario ships and people are not.
  const all = (await crewText()).replace(/The Kestrel Incident|Quarantine at Tallis Gate/g, '');
  const leak = all.match(/.{0,50}\b(Kestrel|Arden|Vane|Prefect|Ashen|Covenant|Directorate|Mercy of Ilun|Sabeth|Marr\b|Thornwake|liner|picket|freighter|warship)\b.{0,30}/);
  check('v0.7.1: nothing from Training Simulation 001 or 002 is spoken on the idle bridge', !leak, leak ? leak[0] : '');
  await pa.screenshot({ path: `${SHOTS}/v071-03-idle-bridge-battery.png` });
  // After one assessed exercise, the answer changes.
  await sendOn(pa, 'Computer, begin the Kestrel Incident simulation', 1200);
  await pa.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  await pa.waitForTimeout(500);
  await skipIntro(pa);
  a = await askA('hail fleet command', 500);
  check('v0.7.1: in a simulation, Fleet Command is exercise control', /exercise control/i.test(a), a.slice(-200));
  for (const c of ['charge the jump drive', 'wait', 'wait', 'jump']) await sendOn(pa, c, 350);
  await pa.waitForTimeout(800);
  if (await pa.locator('[data-testid=outcome-dismiss]').count()) await pa.click('[data-testid=outcome-dismiss]');
  a = await askA('how am I doing?');
  check('v0.7.1: with evidence, the XO answers from the record', /One exercise assessed/.test(a) && /Kestrel Abandoned/.test(a), a.slice(-300));
  a = await askA('what training do I need?');
  check('v0.7.1: training needs cite concerns from the record', /concern in/.test(a) && !/\d\s*%/.test(a), a.slice(-300));
  await pa.screenshot({ path: `${SHOTS}/v071-04-training-with-evidence.png` });
  await pa.setViewportSize({ width: 390, height: 844 });
  await pa.waitForTimeout(300);
  const ovA = await pa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('v0.7.1 phone: no horizontal overflow on the bridge', ovA <= 0, `overflow ${ovA}px`);
  await pa.screenshot({ path: `${SHOTS}/v071-05-phone.png`, fullPage: true });
  await ctxA.close();
}

// ============================================================== v0.8.3 =====
// Training Simulation 003: The Quiet Signal. Listed, launched by voice-style command, played to an ending, AAR filed.
{
  const ctxQ = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxQ.addInitScript(stubs);
  const pq = await ctxQ.newPage();
  pq.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pq.on('pageerror', (e) => errors.push(String(e)));
  const allQ = async () => (await pq.innerText('[data-testid=narrative]')) + '\n' + (await pq.innerText('[data-testid=comms]'));
  const modeQ = () => pq.getAttribute('[data-testid=mode-banner]', 'data-mode');
  // Seed 6: the shapes grammar (answers 6 and 12), a greeting, and a scholarly Director.
  await pq.goto(withSeed(6), { waitUntil: 'networkidle' });
  await pq.waitForTimeout(600);
  await skipIntro(pq);
  await sendOn(pq, 'Computer, list simulations', 600);
  check('sim03: "list simulations" names The Quiet Signal', /The Quiet Signal/.test(await allQ()));
  if (!(await pq.locator('[data-testid=hub]').count())) await pq.click('[data-testid=open-hub]');
  await pq.click('[data-testid=hub-tab-archive]');
  await pq.waitForTimeout(150);
  check('sim03: Mission Archive lists Training Simulation 003', /Training Simulation 003: The Quiet Signal/.test(await pq.innerText('[data-testid=hub]')) && (await pq.locator('[data-testid=archive-train-TRN-quiet]').count()) === 1);
  await pq.click('[data-testid=hub-close]');
  await pq.waitForTimeout(100);
  await sendOn(pq, 'Computer, begin the Quiet Signal simulation', 1200);
  await pq.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('sim03: launch by name starts a simulation', (await modeQ()) === 'simulation');
  await pq.waitForTimeout(4500);
  await skipIntro(pq);
  let tq = await allQ();
  check('sim03: intro plays (the Teyma pulsar, the senders, a Directorate signals ship)', /Teyma pulsar/.test(tq) && /signalling by silence/.test(tq) && /Directorate signals ship/.test(tq), tq.slice(0, 300));
  await pq.screenshot({ path: `${SHOTS}/sim03-01-intro.png` });
  check('sim03: two contacts on sensors', (await pq.locator('[data-testid=contact-kestrel]').count()) === 1 && (await pq.locator('[data-testid=contact-cruiser]').count()) === 1);
  for (const c of ['Szabo, work on the code', 'scan the pulsar', 'use the main dish as a receiver', 'wait', 'wait', 'wait']) await sendOn(pq, c, 300);
  check('sim03: Szabo completes the decode', /The grammar is shapes/.test(await allQ()));
  await sendOn(pq, 'hail the directorate ship', 400);
  check('sim03: comms session with Signals Director Brenn', (await pq.getAttribute('[data-testid=channel-indicator]', 'data-party')) === 'cruiser' && /Signals Director Halia Brenn/.test(await pq.innerText('[data-testid=comms]')));
  await sendOn(pq, 'will you hold your transmission?', 400);
  await pq.screenshot({ path: `${SHOTS}/sim03-02-comms.png` });
  for (const c of ['Szabo, send them 6', 'Szabo, send them 12', 'wait', 'hail the senders']) await sendOn(pq, c, 400);
  await sendOn(pq, 'Greetings. We are the ISV Halcyon, and we come in peace.', 800);
  await pq.waitForSelector('[data-testid=outcome]');
  const outQ = await pq.innerText('[data-testid=outcome]');
  check('sim03: played to an ending (Contact Established)', /Contact Established/i.test(outQ), outQ.slice(0, 200));
  tq = await allQ();
  check('sim03: no other simulation\'s names leak in', !/Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|\[[a-zA-Z_]+\]|undefined/.test(tq), (tq.match(/.{0,60}(Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|\[[a-zA-Z_]+\]|undefined).{0,60}/) ?? [''])[0]);
  await pq.screenshot({ path: `${SHOTS}/sim03-03-outcome.png` });
  if (await pq.locator('[data-testid=outcome-aar]').count()) await pq.click('[data-testid=outcome-aar]');
  await pq.waitForTimeout(300);
  const aarQ = (await pq.locator('[data-testid=aar]').count()) ? await pq.innerText('[data-testid=aar]') : '';
  check('sim03: AAR is available, cites regulations and has no percentages', /Contact Established/i.test(aarQ) && /ISA regulations/.test(aarQ) && !/\d\s*%/.test(aarQ), aarQ.slice(0, 200));
  await pq.screenshot({ path: `${SHOTS}/sim03-04-aar.png`, fullPage: true });
  if (await pq.locator('[data-testid=aar-close]').count()) await pq.click('[data-testid=aar-close]');
  await pq.setViewportSize({ width: 390, height: 844 });
  await pq.waitForTimeout(400);
  const ovQ = await pq.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('sim03 phone: no horizontal overflow', ovQ <= 0, `overflow ${ovQ}px`);
  await ctxQ.close();
}

// ============================================================== v0.8.4 =====
// Training Simulation 004: Reactor Night. Listed, launched by voice-style command, played to an ending, AAR filed.
{
  const ctxR = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxR.addInitScript(stubs);
  const pr = await ctxR.newPage();
  pr.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pr.on('pageerror', (e) => errors.push(String(e)));
  const allR = async () => (await pr.innerText('[data-testid=narrative]')) + '\n' + (await pr.innerText('[data-testid=comms]'));
  const modeR = () => pr.getAttribute('[data-testid=mode-banner]', 'data-mode');
  // Seed 2: a lying temperature sensor (the spine valve is ruled out first) and a panicked pod pilot.
  await pr.goto(withSeed(2), { waitUntil: 'networkidle' });
  await pr.waitForTimeout(600);
  await skipIntro(pr);
  await sendOn(pr, 'Computer, list simulations', 600);
  check('sim04: "list simulations" names Reactor Night', /Reactor Night/.test(await allR()));
  if (!(await pr.locator('[data-testid=hub]').count())) await pr.click('[data-testid=open-hub]');
  await pr.click('[data-testid=hub-tab-archive]');
  await pr.waitForTimeout(150);
  check('sim04: Mission Archive lists Training Simulation 004', /Training Simulation 004: Reactor Night/.test(await pr.innerText('[data-testid=hub]')) && (await pr.locator('[data-testid=archive-train-TRN-reactor]').count()) === 1);
  await pr.click('[data-testid=hub-close]');
  await pr.waitForTimeout(100);
  await sendOn(pr, 'Computer, begin the Reactor Night simulation', 1200);
  await pr.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('sim04: launch by name starts a simulation', (await modeR()) === 'simulation');
  await pr.waitForTimeout(4500);
  await skipIntro(pr);
  let tr = await allR();
  check('sim04: intro plays (ship\'s night, the work pod Tern, the tender Larkspur)', /Ship’s night aboard the ISV Halcyon/.test(tr) && /work pod Tern/.test(tr) && /Larkspur/.test(tr), tr.slice(0, 300));
  await pr.screenshot({ path: `${SHOTS}/sim04-01-intro.png` });
  check('sim04: two contacts on sensors', (await pr.locator('[data-testid=contact-kestrel]').count()) === 1 && (await pr.locator('[data-testid=contact-cruiser]').count()) === 1);
  for (const c of ["Okafor, what's failing?", 'scan our ship']) await sendOn(pr, c, 300);
  check('sim04: the tender shows as the ISV Larkspur, not an unidentified warship', /ISV Larkspur/.test(await pr.innerText('[data-testid=contact-cruiser]')) && !/Unidentified/.test(await pr.innerText('[data-testid=contact-cruiser]')));
  await sendOn(pr, 'hail the pod', 900);
  check('sim04: comms session with Crewman Paley', (await pr.getAttribute('[data-testid=channel-indicator]', 'data-party')) === 'kestrel' && /Crewman Ines Paley/i.test(await pr.innerText('[data-testid=comms]')));
  await sendOn(pr, 'how are you doing?', 400);
  await pr.screenshot({ path: `${SHOTS}/sim04-02-comms.png` });
  for (const c of ['close the channel', 'wait', 'wait']) await sendOn(pr, c, 300);
  check('sim04: Chief Okafor finds the fault', /The core temperature sensor is reading low/.test(await allR()));
  for (const c of ['Okafor, take the regulator off automatic', 'wait', 'wait']) await sendOn(pr, c, 400);
  await pr.waitForSelector('[data-testid=outcome]');
  const outR = await pr.innerText('[data-testid=outcome]');
  check('sim04: played to an ending (A Clean Save)', /A Clean Save/i.test(outR), outR.slice(0, 200));
  tr = await allR();
  check('sim04: no other simulation\'s names leak in', !/Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|Cantor|Brenn|Teyma|\[[a-zA-Z_]+\]|undefined/.test(tr), (tr.match(/.{0,60}(Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|Cantor|Brenn|Teyma|\[[a-zA-Z_]+\]|undefined).{0,60}/) ?? [''])[0]);
  await pr.screenshot({ path: `${SHOTS}/sim04-03-outcome.png` });
  if (await pr.locator('[data-testid=outcome-aar]').count()) await pr.click('[data-testid=outcome-aar]');
  await pr.waitForTimeout(300);
  const aarR = (await pr.locator('[data-testid=aar]').count()) ? await pr.innerText('[data-testid=aar]') : '';
  check('sim04: AAR is available, cites regulations and has no percentages', /A Clean Save/i.test(aarR) && /ISA regulations/.test(aarR) && !/\d\s*%/.test(aarR), aarR.slice(0, 200));
  await pr.screenshot({ path: `${SHOTS}/sim04-04-aar.png`, fullPage: true });
  if (await pr.locator('[data-testid=aar-close]').count()) await pr.click('[data-testid=aar-close]');
  await pr.setViewportSize({ width: 390, height: 844 });
  await pr.waitForTimeout(400);
  const ovR = await pr.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('sim04 phone: no horizontal overflow', ovR <= 0, `overflow ${ovR}px`);
  await ctxR.close();
}

// ============================================================== v0.8.5 =====
// Training Simulation 005: The Saltglass Accord. Listed, launched by voice-style command, mediated to an accord, AAR filed.
{
  const ctxS = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxS.addInitScript(stubs);
  const ps = await ctxS.newPage();
  ps.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  ps.on('pageerror', (e) => errors.push(String(e)));
  const allS = async () => (await ps.innerText('[data-testid=narrative]')) + '\n' + (await ps.innerText('[data-testid=comms]'));
  const modeS = () => ps.getAttribute('[data-testid=mode-banner]', 'data-mode');
  await ps.goto(withSeed(5), { waitUntil: 'networkidle' });
  await ps.waitForTimeout(600);
  await skipIntro(ps);
  await sendOn(ps, 'Computer, list simulations', 600);
  check('sim05: "list simulations" names The Saltglass Accord', /The Saltglass Accord/.test(await allS()));
  if (!(await ps.locator('[data-testid=hub]').count())) await ps.click('[data-testid=open-hub]');
  await ps.click('[data-testid=hub-tab-archive]');
  await ps.waitForTimeout(150);
  check('sim05: Mission Archive lists Training Simulation 005', /Training Simulation 005: The Saltglass Accord/.test(await ps.innerText('[data-testid=hub]')) && (await ps.locator('[data-testid=archive-train-TRN-saltglass]').count()) === 1);
  await ps.click('[data-testid=hub-close]');
  await ps.waitForTimeout(100);
  await sendOn(ps, 'Computer, begin the Saltglass Accord simulation', 1200);
  await ps.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('sim05: launch by name starts a simulation', (await modeS()) === 'simulation');
  await ps.waitForTimeout(4500);
  await skipIntro(ps);
  let tr = await allS();
  check('sim05: intro plays (Saltglass, two clans, mediate not rule)', /Saltglass/.test(tr) && /Clan Rhune/.test(tr) && /Clan Tarvo/.test(tr) && /mediate, not to rule/.test(tr), tr.slice(0, 300));
  await ps.screenshot({ path: `${SHOTS}/sim05-01-intro.png` });
  check('sim05: both clan ships on sensors by name', /Long Thaw/.test(await ps.innerText('[data-testid=contact-kestrel]')) && /Cold Hearth/.test(await ps.innerText('[data-testid=contact-cruiser]')));
  await sendOn(ps, 'Szabo, how do they sound?', 400);
  const read = (await allS()).match(/(Speaker Rhune|Holder Tarvo) wants this to work/);
  check('sim05: Szabo reads the room', !!read);
  const soft = read ? read[1] : 'Holder Tarvo';
  const hard = soft === 'Speaker Rhune' ? 'Holder Tarvo' : 'Speaker Rhune';
  await sendOn(ps, `open a private channel to ${soft}`, 900);
  check('sim05: a private side-room channel opens', /side room/i.test(await allS()));
  for (const c of ['What do you really need?', 'May I raise that at the table?']) await sendOn(ps, c, 400);
  await ps.screenshot({ path: `${SHOTS}/sim05-02-side-room.png` });
  for (const c of ['close the channel', `Marrow, have a quiet word with ${hard}`, `open a channel to ${soft}`, 'Thank you for coming. I hear you.', 'Will you both agree to a standstill on the ice while we talk?', 'wait', 'wait', `open a channel to ${soft}`, 'Would you tell them what you told me?']) await sendOn(ps, c, 400);
  check('sim05: both needs go on the table', /Objective COMPLETE: Find out what each clan actually needs/.test(await allS()));
  await sendOn(ps, 'I propose you share Saltglass: both needs, written into one accord.', 600);
  await ps.waitForSelector('[data-testid=outcome]');
  const outS = await ps.innerText('[data-testid=outcome]');
  check('sim05: mediated to an ending (The Saltglass Accord)', /The Saltglass Accord/i.test(outS), outS.slice(0, 200));
  tr = await allS();
  const LEAK5 = /Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|Cantor|Brenn|Teyma|Paley|Larkspur|\[[a-zA-Z_]+\]|undefined/;
  check('sim05: no other simulation\'s names leak in', !LEAK5.test(tr), (tr.match(new RegExp(`.{0,60}(${LEAK5.source}).{0,60}`)) ?? [''])[0]);
  await ps.screenshot({ path: `${SHOTS}/sim05-03-outcome.png` });
  if (await ps.locator('[data-testid=outcome-aar]').count()) await ps.click('[data-testid=outcome-aar]');
  await ps.waitForTimeout(300);
  const aarS = (await ps.locator('[data-testid=aar]').count()) ? await ps.innerText('[data-testid=aar]') : '';
  check('sim05: AAR is available, cites regulations and has no percentages', /The Saltglass Accord/i.test(aarS) && /ISA regulations/.test(aarS) && !/\d\s*%/.test(aarS), aarS.slice(0, 200));
  await ps.screenshot({ path: `${SHOTS}/sim05-04-aar.png`, fullPage: true });
  if (await ps.locator('[data-testid=aar-close]').count()) await ps.click('[data-testid=aar-close]');
  await ps.setViewportSize({ width: 390, height: 844 });
  await ps.waitForTimeout(400);
  const ovS = await ps.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('sim05 phone: no horizontal overflow', ovS <= 0, `overflow ${ovS}px`);
  await ctxS.close();
}

// ============================================================== v0.8.6 =====
// Training Simulation 006: Ion Season. Listed, launched by voice-style command, the convoy led through on the helm's read, AAR filed.
{
  const ctxI = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxI.addInitScript(stubs);
  const pi = await ctxI.newPage();
  pi.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pi.on('pageerror', (e) => errors.push(String(e)));
  const allI = async () => (await pi.innerText('[data-testid=narrative]')) + '\n' + (await pi.innerText('[data-testid=comms]'));
  const modeI = () => pi.getAttribute('[data-testid=mode-banner]', 'data-mode');
  await pi.goto(withSeed(6), { waitUntil: 'networkidle' });
  await pi.waitForTimeout(600);
  await skipIntro(pi);
  await sendOn(pi, 'Computer, list simulations', 600);
  check('sim06: "list simulations" names Ion Season', /Ion Season/.test(await allI()));
  if (!(await pi.locator('[data-testid=hub]').count())) await pi.click('[data-testid=open-hub]');
  await pi.click('[data-testid=hub-tab-archive]');
  await pi.waitForTimeout(150);
  check('sim06: Mission Archive lists Training Simulation 006', /Training Simulation 006: Ion Season/.test(await pi.innerText('[data-testid=hub]')) && (await pi.locator('[data-testid=archive-train-TRN-ion]').count()) === 1);
  await pi.click('[data-testid=hub-close]');
  await pi.waitForTimeout(100);
  await sendOn(pi, 'Computer, begin the Ion Season simulation', 1200);
  await pi.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('sim06: launch by name starts a simulation', (await modeI()) === 'simulation');
  await pi.waitForTimeout(4500);
  await skipIntro(pi);
  let tr = await allI();
  check('sim06: intro plays (Corrie Drift, three bands, two masters)', /Corrie Drift/.test(tr) && /the Fringe, the Combs and the Maw/.test(tr) && /Captain Brack/.test(tr) && /Captain Teague/.test(tr), tr.slice(0, 300));
  await pi.screenshot({ path: `${SHOTS}/sim06-01-intro.png` });
  check('sim06: both haulers on sensors by name', /Saffron Mule/.test(await pi.innerText('[data-testid=contact-kestrel]')) && /Gannet's Luck/.test(await pi.innerText('[data-testid=contact-cruiser]')));
  for (const c of ['hail Captain Brack', 'Which channel would you take?', 'hail Captain Teague', 'Which channel would you take?', 'close the channel', 'Doctor, how do the masters sound?']) await sendOn(pi, c, 400);
  tr = await allI();
  check('sim06: the doctor listens to the masters', /sounds tired and cross|I don't like how Captain (Brack|Teague) sounds/.test(tr));
  const unfit = tr.match(/I don't like how Captain (Brack|Teague) sounds/);
  if (unfit) for (const c of [`hail Captain ${unfit[1]}`, 'Captain, are you fit to fly the Maw?', 'Will you hand the helm to your mate?', 'close the channel']) await sendOn(pi, c, 400);
  await pi.screenshot({ path: `${SHOTS}/sim06-02-masters.png` });
  const ASK = 'Adeyemi, I trust your gut. What does your gut say?';
  let readGut = false;
  for (let i = 0; i < 24 && !(await pi.locator('[data-testid=outcome]').count()); i++) {
    const before = await allI();
    if (/One more minute, then I go on my own line/.test(before.slice(-600))) for (const c of ['hail Captain Teague', 'Stay with us, Captain. Not yet.', 'close the channel']) await sendOn(pi, c, 400);
    await sendOn(pi, ASK, 500);
    const t = await allI();
    const reply = t.slice(t.lastIndexOf('What does your gut say?'));
    const ch = reply.match(/(high|low)\. The (high|low) channel\. I can feel it/);
    if (ch) readGut = true;
    if (/slack now|gone slack/.test(reply)) await sendOn(pi, 'go', 700);
    else if (ch) await sendOn(pi, `take us through the ${ch[2]} channel`, 700);
    else if (/won't go slack again/.test(reply)) await sendOn(pi, 'go with your gut', 700);
    else await sendOn(pi, 'wait', 500);
    if (/gone dark/.test((await allI()).slice(-800))) await sendOn(pi, 'Take the crew off.', 600);
  }
  check('sim06: the helm gives his own read when backed', readGut);
  await pi.waitForSelector('[data-testid=outcome]');
  const outI = await pi.innerText('[data-testid=outcome]');
  check('sim06: led to an ending (Clear Water, The Lull, A Steady Hand or Weathered Through)', /Clear Water|The Lull|A Steady Hand|Weathered Through/i.test(outI), outI.slice(0, 200));
  tr = await allI();
  const LEAK6 = /Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|Cantor|Brenn|Teyma|Paley|Larkspur|Saltglass|Rhune|Tarvo|Hollis|\[[a-zA-Z_]+\]|undefined|Intergalactic Agency/;
  check('sim06: no other simulation\'s names leak in', !LEAK6.test(tr), (tr.match(new RegExp(`.{0,60}(${LEAK6.source}).{0,60}`)) ?? [''])[0]);
  await pi.screenshot({ path: `${SHOTS}/sim06-03-outcome.png` });
  if (await pi.locator('[data-testid=outcome-aar]').count()) await pi.click('[data-testid=outcome-aar]');
  await pi.waitForTimeout(300);
  const aarI = (await pi.locator('[data-testid=aar]').count()) ? await pi.innerText('[data-testid=aar]') : '';
  check('sim06: AAR is available, cites regulations and has no percentages', /Ion Season/i.test(aarI) && /ISA regulations/.test(aarI) && !/\d\s*%/.test(aarI), aarI.slice(0, 200));
  await pi.screenshot({ path: `${SHOTS}/sim06-04-aar.png`, fullPage: true });
  if (await pi.locator('[data-testid=aar-close]').count()) await pi.click('[data-testid=aar-close]');
  await pi.setViewportSize({ width: 390, height: 844 });
  await pi.waitForTimeout(400);
  const ovI = await pi.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('sim06 phone: no horizontal overflow', ovI <= 0, `overflow ${ovI}px`);
  await ctxI.close();
}

// ============================================================== v0.8.7 =====
// Training Simulation 007: Ghost Ledger. Listed, launched by voice-style command, the thief found on evidence, AAR filed.
{
  const ctxL = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxL.addInitScript(stubs);
  const pl = await ctxL.newPage();
  pl.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pl.on('pageerror', (e) => errors.push(String(e)));
  const allL = async () => (await pl.innerText('[data-testid=narrative]')) + '\n' + (await pl.innerText('[data-testid=comms]'));
  const modeL = () => pl.getAttribute('[data-testid=mode-banner]', 'data-mode');
  const ended = async () => (await pl.locator('[data-testid=outcome]').count()) > 0;
  await pl.goto(withSeed(7), { waitUntil: 'networkidle' });
  await pl.waitForTimeout(600);
  await skipIntro(pl);
  await sendOn(pl, 'Computer, list simulations', 600);
  check('sim07: "list simulations" names Ghost Ledger', /Ghost Ledger/.test(await allL()));
  if (!(await pl.locator('[data-testid=hub]').count())) await pl.click('[data-testid=open-hub]');
  await pl.click('[data-testid=hub-tab-archive]');
  await pl.waitForTimeout(150);
  check('sim07: Mission Archive lists Training Simulation 007', /Training Simulation 007: Ghost Ledger/.test(await pl.innerText('[data-testid=hub]')) && (await pl.locator('[data-testid=archive-train-TRN-ledger]').count()) === 1);
  await pl.click('[data-testid=hub-close]');
  await pl.waitForTimeout(100);
  await sendOn(pl, 'Computer, begin the Ghost Ledger simulation', 1200);
  await pl.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('sim07: launch by name starts a simulation', (await modeL()) === 'simulation');
  await pl.waitForTimeout(4500);
  await skipIntro(pl);
  let tr = await allL();
  check('sim07: intro plays (Vell Crossing, the keys, four guests)', /Vell Crossing/.test(tr) && /navigation keys/.test(tr) && /Attaché Ysolde Krenn/.test(tr) && /Commander Leander Fosse/.test(tr), tr.slice(0, 300));
  await pl.screenshot({ path: `${SHOTS}/sim07-01-intro.png` });
  check('sim07: both ships alongside on sensors by name', /Marrick Lark/.test(await pl.innerText('[data-testid=contact-kestrel]')) && /Amber Script/.test(await pl.innerText('[data-testid=contact-cruiser]')));
  for (const c of ['Szabo, watch all outbound traffic', 'Varga, when were the keys copied?', 'Rask, pull the door logs', 'Varga, what device took the copy?']) await sendOn(pl, c, 400);
  tr = await allL();
  check('sim07: the evidence comes in (copy time, badge logs, port trace)', /keys were copied at 21:\d\d/.test(tr) && /Badge logs for the reception/.test(tr) && /The copy went onto/.test(tr));
  await pl.screenshot({ path: `${SHOTS}/sim07-02-evidence.png` });
  let culprit = null;
  let checked = false;
  for (const g of ['Attaché Krenn', 'Mr Vesk', 'Ms Sallow', 'Commander Fosse']) {
    if (culprit || (await ended())) break;
    await sendOn(pl, 'Rask, what do we have?', 400);
    const board = (await allL()).slice(-700);
    const m = board.match(/It points to ([A-Z][a-zé]+ [A-Z][a-z]+), and only/);
    if (m) { culprit = m[1]; break; }
    const at = Math.max(board.lastIndexOf('Still on the board'), board.lastIndexOf('One name left'));
    const left = at >= 0 ? board.slice(at) : board;
    if (!left.includes(g)) continue;
    for (const c of [`interview ${g}`, 'your badge says you left the reception', 'check that story']) await sendOn(pl, c, 400);
    if (/bears it out|doesn't bear that out/.test((await allL()).slice(-900))) checked = true;
  }
  if (!culprit && !(await ended())) {
    await sendOn(pl, 'Rask, what do we have?', 400);
    const m = (await allL()).slice(-700).match(/It points to ([A-Z][a-zé]+ [A-Z][a-z]+), and only/);
    if (m) culprit = m[1];
  }
  check('sim07: the case is made from the ship’s own records (stories checked where needed)', checked || culprit !== null || (await ended()), `checked=${checked} culprit=${culprit}`);
  if (culprit && !(await ended())) await sendOn(pl, `detain ${culprit}`, 800);
  for (let i = 0; i < 20 && !(await ended()); i++) await sendOn(pl, 'wait', 400);
  await pl.waitForSelector('[data-testid=outcome]');
  const outL = await pl.innerText('[data-testid=outcome]');
  check('sim07: led to an ending (The Ledger Balanced or Caught in the Act)', /The Ledger Balanced|Caught in the Act/i.test(outL), outL.slice(0, 200));
  tr = await allL();
  const LEAK7 = /Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|Cantor|Brenn|Teyma|Paley|Larkspur|Saltglass|Rhune|Tarvo|Hollis|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|\[[a-zA-Z_]+\]|undefined|Intergalactic Agency|the Agency/;
  check('sim07: no other simulation\'s names leak in', !LEAK7.test(tr), (tr.match(new RegExp(`.{0,60}(${LEAK7.source}).{0,60}`)) ?? [''])[0]);
  await pl.screenshot({ path: `${SHOTS}/sim07-03-outcome.png` });
  if (await pl.locator('[data-testid=outcome-aar]').count()) await pl.click('[data-testid=outcome-aar]');
  await pl.waitForTimeout(300);
  const aarL = (await pl.locator('[data-testid=aar]').count()) ? await pl.innerText('[data-testid=aar]') : '';
  check('sim07: AAR is available, cites regulations and has no percentages', /Ghost Ledger/i.test(aarL) && /ISA regulations/.test(aarL) && !/\d\s*%/.test(aarL), aarL.slice(0, 200));
  await pl.screenshot({ path: `${SHOTS}/sim07-04-aar.png`, fullPage: true });
  if (await pl.locator('[data-testid=aar-close]').count()) await pl.click('[data-testid=aar-close]');
  await pl.setViewportSize({ width: 390, height: 844 });
  await pl.waitForTimeout(400);
  const ovL = await pl.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('sim07 phone: no horizontal overflow', ovL <= 0, `overflow ${ovL}px`);
  await ctxL.close();
}

// ============================================================== v0.8.8 =====
// Training Simulation 008: The Lantern Drift. Listed, launched by name, the doctor's triage, an ending, AAR filed.
{
  const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxD.addInitScript(stubs);
  const pd = await ctxD.newPage();
  pd.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pd.on('pageerror', (e) => errors.push(String(e)));
  const allD = async () => (await pd.innerText('[data-testid=narrative]')) + '\n' + (await pd.innerText('[data-testid=comms]'));
  const modeD = () => pd.getAttribute('[data-testid=mode-banner]', 'data-mode');
  const ended = async () => (await pd.locator('[data-testid=outcome]').count()) > 0;
  await pd.goto(withSeed(8), { waitUntil: 'networkidle' });
  await pd.waitForTimeout(600);
  await skipIntro(pd);
  await sendOn(pd, 'Computer, list simulations', 600);
  check('sim08: "list simulations" names The Lantern Drift', /Lantern Drift/.test(await allD()));
  if (!(await pd.locator('[data-testid=hub]').count())) await pd.click('[data-testid=open-hub]');
  await pd.click('[data-testid=hub-tab-archive]');
  await pd.waitForTimeout(150);
  check('sim08: Mission Archive lists Training Simulation 008', /Training Simulation 008: The Lantern Drift/.test(await pd.innerText('[data-testid=hub]')) && (await pd.locator('[data-testid=archive-train-TRN-lantern]').count()) === 1);
  await pd.click('[data-testid=hub-close]');
  await pd.waitForTimeout(100);
  await sendOn(pd, 'Computer, begin the Lantern Drift simulation', 1200);
  await pd.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('sim08: launch by name starts a simulation', (await modeD()) === 'simulation');
  await pd.waitForTimeout(4500);
  await skipIntro(pd);
  let tr = await allD();
  check('sim08: intro plays (the Drift, the Eventide, Wick, the manifest, the Sorrel)', /Lantern Drift/.test(tr) && /Eventide/.test(tr) && /Wick/.test(tr) && /manifest/.test(tr) && /ISV Sorrel/.test(tr), tr.slice(0, 300));
  await pd.screenshot({ path: `${SHOTS}/sim08-01-intro.png` });
  check('sim08: the generation ship and the tug on sensors by name', /Eventide/.test(await pd.innerText('[data-testid=contact-kestrel]')) && /Kittiwake/.test(await pd.innerText('[data-testid=contact-cruiser]')));
  for (const c of ['Varga, scan the cryo banks', 'hail the Eventide', 'May we come aboard?', 'close the channel', 'Doctor, assess the sleepers']) await sendOn(pd, c, 400);
  for (let i = 0; i < 6 && !/My assessment, Captain/.test(await allD()) && !(await ended()); i++) await sendOn(pd, 'wait', 400);
  tr = await allD();
  check('sim08: the officers read the ship (thermal scan, the doctor\'s assessment)', /Thermal scan of the cryo deck/.test(tr) && /My assessment, Captain/.test(tr), tr.slice(-400));
  await pd.screenshot({ path: `${SHOTS}/sim08-02-assessment.png` });
  for (const c of ['hail the Eventide', 'Our doctor has examined them, and the scan shows the banks are failing. Not all of them will live.', 'close the channel', 'Chief, run a power line to the banks', 'Doctor, wake them in your triage order', 'hail the tug', 'Our scans show nine hundred living people aboard her.', 'close the channel', 'Adeyemi, put us between the tug and the Eventide']) {
    if (await ended()) break;
    await sendOn(pd, c, 400);
  }
  for (let i = 0; i < 40 && !(await ended()); i++) await sendOn(pd, 'wait', 400);
  await pd.waitForSelector('[data-testid=outcome]');
  const outD = await pd.innerText('[data-testid=outcome]');
  check('sim08: led to an ending (A Keeper’s Rest, Borrowed Light, The Speaker’s Choice, Salvage and Salvation or A Hard Count)', /A Keeper’s Rest|Borrowed Light|The Speaker’s Choice|Salvage and Salvation|A Hard Count/i.test(outD), outD.slice(0, 200));
  tr = await allD();
  const LEAK8 = /Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|Cantor|Brenn|Teyma|Paley|Larkspur|Saltglass|Rhune|Tarvo|Hollis|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Krenn|Vesk|Sallow|Fosse|Vell Crossing|\[[a-zA-Z_]+\]|undefined|Intergalactic Agency|the Agency/;
  check('sim08: no other simulation\'s names leak in', !LEAK8.test(tr), (tr.match(new RegExp(`.{0,60}(${LEAK8.source}).{0,60}`)) ?? [''])[0]);
  await pd.screenshot({ path: `${SHOTS}/sim08-03-outcome.png` });
  if (await pd.locator('[data-testid=outcome-aar]').count()) await pd.click('[data-testid=outcome-aar]');
  await pd.waitForTimeout(300);
  const aarD = (await pd.locator('[data-testid=aar]').count()) ? await pd.innerText('[data-testid=aar]') : '';
  check('sim08: AAR is available, cites regulations and has no percentages', /Lantern Drift/i.test(aarD) && /ISA regulations/.test(aarD) && !/\d\s*%/.test(aarD), aarD.slice(0, 200));
  await pd.screenshot({ path: `${SHOTS}/sim08-04-aar.png`, fullPage: true });
  if (await pd.locator('[data-testid=aar-close]').count()) await pd.click('[data-testid=aar-close]');
  await pd.setViewportSize({ width: 390, height: 844 });
  await pd.waitForTimeout(400);
  const ovD = await pd.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('sim08 phone: no horizontal overflow', ovD <= 0, `overflow ${ovD}px`);
  await ctxD.close();
}

// ============================================================== v0.8.9 =====
// Training Simulation 009: The Long Picket. Listed, launched by name, Marrow's read, his orders, an ending, AAR filed.
{
  const ctxP = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxP.addInitScript(stubs);
  const pp = await ctxP.newPage();
  pp.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pp.on('pageerror', (e) => errors.push(String(e)));
  const allP = async () => (await pp.innerText('[data-testid=narrative]')) + '\n' + (await pp.innerText('[data-testid=comms]'));
  const modeP = () => pp.getAttribute('[data-testid=mode-banner]', 'data-mode');
  const endedP = async () => (await pp.locator('[data-testid=outcome]').count()) > 0;
  await pp.goto(withSeed(9), { waitUntil: 'networkidle' });
  await pp.waitForTimeout(600);
  await skipIntro(pp);
  await sendOn(pp, 'Computer, list simulations', 600);
  check('sim09: "list simulations" names The Long Picket', /Long Picket/.test(await allP()));
  if (!(await pp.locator('[data-testid=hub]').count())) await pp.click('[data-testid=open-hub]');
  await pp.click('[data-testid=hub-tab-archive]');
  await pp.waitForTimeout(150);
  check('sim09: Mission Archive lists Training Simulation 009', /Training Simulation 009: The Long Picket/.test(await pp.innerText('[data-testid=hub]')) && (await pp.locator('[data-testid=archive-train-TRN-picket]').count()) === 1);
  await pp.click('[data-testid=hub-close]');
  await pp.waitForTimeout(100);
  await sendOn(pp, 'Computer, begin the Long Picket simulation', 1200);
  await pp.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('sim09: launch by name starts a simulation', (await modeP()) === 'simulation');
  await pp.waitForTimeout(4500);
  await skipIntro(pp);
  let tr = await allP();
  check('sim09: intro plays (the Narrows, Wrenmoor, the Iron Psalm, Roake)', /Sable Narrows/.test(tr) && /Wrenmoor/.test(tr) && /Iron Psalm/.test(tr) && /Lucan Roake/.test(tr), tr.slice(0, 300));
  await pp.screenshot({ path: `${SHOTS}/sim09-01-intro.png` });
  check('sim09: the colony and the picket on sensors by name', /Wrenmoor/.test(await pp.innerText('[data-testid=contact-kestrel]')) && /Iron Psalm/.test(await pp.innerText('[data-testid=contact-cruiser]')));
  for (const c of ['hail the picket', 'close the channel', 'Marrow, what do you make of him?', 'Szabo, listen to the picket’s traffic', 'wait', 'wait']) await sendOn(pp, c, 400);
  tr = await allP();
  check('sim09: the officers read the picket (Marrow\'s read, his orders)', /My read, Captain/.test(tr) && /I have his orders/.test(tr), tr.slice(-400));
  await pp.screenshot({ path: `${SHOTS}/sim09-02-read.png` });
  for (const c of ['hail the picket', 'You may inspect one crate, for your log.', 'close the channel', 'wait', 'wait', 'wait', 'wait', 'hail the picket', 'We are carrying reactor assemblies for Wrenmoor.', 'You may inspect us, as a courtesy and without conceding your claim.', 'close the channel']) {
    if (await endedP()) break;
    await sendOn(pp, c, 400);
  }
  for (let i = 0; i < 40 && !(await endedP()); i++) await sendOn(pp, 'wait', 400);
  await pp.waitForSelector('[data-testid=outcome]');
  const outP = await pp.innerText('[data-testid=outcome]');
  check('sim09: led to an ending', /Called and Raised|A Line in His Log|Old Acquaintance|Nothing to Hide|Through the Line|Under False Colours|The Narrows Incident|Directorate Custody|The Long Way Round|Wrenmoor Goes Dark/i.test(outP), outP.slice(0, 200));
  tr = await allP();
  const LEAK9 = /Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|Cantor|Brenn|Teyma|Paley|Larkspur|Saltglass|Rhune|Tarvo|Hollis|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Krenn|Vesk|Sallow|Fosse|Vell Crossing|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|\[[a-zA-Z_]+\]|undefined|Intergalactic Agency|the Agency/;
  check('sim09: no other simulation\'s names leak in', !LEAK9.test(tr), (tr.match(new RegExp(`.{0,60}(${LEAK9.source}).{0,60}`)) ?? [''])[0]);
  await pp.screenshot({ path: `${SHOTS}/sim09-03-outcome.png` });
  if (await pp.locator('[data-testid=outcome-aar]').count()) await pp.click('[data-testid=outcome-aar]');
  await pp.waitForTimeout(300);
  const aarP = (await pp.locator('[data-testid=aar]').count()) ? await pp.innerText('[data-testid=aar]') : '';
  check('sim09: AAR is available, cites regulations and has no percentages', /Long Picket/i.test(aarP) && /ISA regulations/.test(aarP) && !/\d\s*%/.test(aarP), aarP.slice(0, 200));
  await pp.screenshot({ path: `${SHOTS}/sim09-04-aar.png`, fullPage: true });
  if (await pp.locator('[data-testid=aar-close]').count()) await pp.click('[data-testid=aar-close]');
  await pp.setViewportSize({ width: 390, height: 844 });
  await pp.waitForTimeout(400);
  const ovP = await pp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('sim09 phone: no horizontal overflow', ovP <= 0, `overflow ${ovP}px`);
  await ctxP.close();
}

// ============================================================== v0.8.10 ====
// Training Simulation 010: The Gardener. Listed, launched by name, Varga's study, the Claimwarden held, an ending, AAR filed.
{
  const ctxG = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxG.addInitScript(stubs);
  const pg = await ctxG.newPage();
  pg.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pg.on('pageerror', (e) => errors.push(String(e)));
  const allG = async () => (await pg.innerText('[data-testid=narrative]')) + '\n' + (await pg.innerText('[data-testid=comms]'));
  const modeG = () => pg.getAttribute('[data-testid=mode-banner]', 'data-mode');
  const endedG = async () => (await pg.locator('[data-testid=outcome]').count()) > 0;
  await pg.goto(withSeed(10), { waitUntil: 'networkidle' });
  await pg.waitForTimeout(600);
  await skipIntro(pg);
  await sendOn(pg, 'Computer, list simulations', 600);
  check('sim10: "list simulations" names The Gardener', /The Gardener/.test(await allG()));
  if (!(await pg.locator('[data-testid=hub]').count())) await pg.click('[data-testid=open-hub]');
  await pg.click('[data-testid=hub-tab-archive]');
  await pg.waitForTimeout(150);
  check('sim10: Mission Archive lists Training Simulation 010', /Training Simulation 010: The Gardener/.test(await pg.innerText('[data-testid=hub]')) && (await pg.locator('[data-testid=archive-train-TRN-gardener]').count()) === 1);
  await pg.click('[data-testid=hub-close]');
  await pg.waitForTimeout(100);
  await sendOn(pg, 'Computer, begin the Gardener simulation', 1200);
  await pg.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  check('sim10: launch by name starts a simulation', (await modeG()) === 'simulation');
  await pg.waitForTimeout(4500);
  await skipIntro(pg);
  let tr = await allG();
  check('sim10: intro plays (the Cobble Field, the Hobnail, Spindle)', /Cobble Field/.test(tr) && /Hobnail/.test(tr) && /Spindle/.test(tr), tr.slice(0, 300));
  await pg.screenshot({ path: `${SHOTS}/sim10-01-intro.png` });
  check('sim10: the station and the tender on sensors by name', /Spindle/.test(await pg.innerText('[data-testid=contact-kestrel]')) && /Hobnail/.test(await pg.innerText('[data-testid=contact-cruiser]')));
  for (const c of ['Varga, study the growth', 'send a probe to take a sample', 'hail the tender', 'I promise we will protect your claims. Hold your charges.', 'close the channel', 'wait', 'wait']) await sendOn(pg, c, 400);
  tr = await allG();
  check('sim10: Varga studies it and reports what it is', /It is alive|it is not alive/.test(tr), tr.slice(-400));
  await pg.screenshot({ path: `${SHOTS}/sim10-02-study.png` });
  for (const c of ['hail the station', 'How does it reach your claims?', 'close the channel', 'wait', 'wait', 'wait']) {
    if (await endedG()) break;
    await sendOn(pg, c, 400);
  }
  for (let i = 0; i < 40 && !(await endedG()); i++) await sendOn(pg, 'wait', 400);
  await pg.waitForSelector('[data-testid=outcome]');
  const outG = await pg.innerText('[data-testid=outcome]');
  check('sim10: led to an ending', /Led Away|A Line in the Field|Only Stone|The Long Sleep|Right by Luck|The Claims Overrun|Scorched Rock|Crake's Fire|Seeded the Claims|Grown Into the Hull|Left to the Miners|Shots in the Field/i.test(outG), outG.slice(0, 200));
  tr = await allG();
  const LEAK10 = /Kestrel|Prefect|Ashen Covenant|Tallis|Sabeth|Thornwake|Cantor|Brenn|Teyma|Paley|Larkspur|Saltglass|Rhune|Tarvo|Hollis|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Krenn|Vesk|Sallow|Fosse|Vell Crossing|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|\[[a-zA-Z_]+\]|undefined|Intergalactic Agency|the Agency/;
  check('sim10: no other simulation\'s names leak in', !LEAK10.test(tr), (tr.match(new RegExp(`.{0,60}(${LEAK10.source}).{0,60}`)) ?? [''])[0]);
  await pg.screenshot({ path: `${SHOTS}/sim10-03-outcome.png` });
  if (await pg.locator('[data-testid=outcome-aar]').count()) await pg.click('[data-testid=outcome-aar]');
  await pg.waitForTimeout(300);
  const aarG = (await pg.locator('[data-testid=aar]').count()) ? await pg.innerText('[data-testid=aar]') : '';
  check('sim10: AAR is available, cites regulations and has no percentages', /Gardener/i.test(aarG) && /ISA regulations/.test(aarG) && !/\d\s*%/.test(aarG), aarG.slice(0, 200));
  await pg.screenshot({ path: `${SHOTS}/sim10-04-aar.png`, fullPage: true });
  if (await pg.locator('[data-testid=aar-close]').count()) await pg.click('[data-testid=aar-close]');
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.waitForTimeout(400);
  const ovG = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('sim10 phone: no horizontal overflow', ovG <= 0, `overflow ${ovG}px`);
  await ctxG.close();
}

// ============================================================== v0.8.0 =====
// The Captain's Handbook: contents, articles, search, bridge commands in every timeline (state untouched),
// report citations, spoiler safety, desktop and phone width.
await handbookSmoke({ browser, URL, SHOTS, check, errors, stubs });

check('no console errors', errors.length === 0, errors.join(' | '));
await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(`${SHOTS}/results.json`, JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
