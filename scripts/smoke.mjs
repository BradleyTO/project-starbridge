// Headless smoke test: v0.4 (Simulation / Living Universe / Archive / credits / interpreter) plus the v0.2–v0.3 checks.
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
  await p4.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=42', { waitUntil: 'networkidle' });
  await p4.click('[data-testid=skip-intro]');
  check('v0.4: default load is a SIMULATION', (await banner()) === 'simulation', await p4.innerText('[data-testid=mode-banner]'));
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
  await p4.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=42', { waitUntil: 'networkidle' });
  await p4.click('[data-testid=skip-intro]');
  await send4('Fire');
  check('v0.4 safety: bare "Fire" asks which contact', /Fire on which contact/.test(await p4.innerText('[data-testid=clarification]')));
  check('v0.4 safety: nothing fired', (await p4.innerText('[data-testid=weapons-state]')).startsWith('SAFE') && !/beams|torpedo away|firing/i.test((await nar4()).slice(-300)));
  await send4('Lower shields and raise them again');
  check('v0.4 safety: contradictory shields order asks', /Raise or lower the shields/.test(await p4.innerText('[data-testid=clarification]')) && (await p4.innerText('[data-testid=shield-state]')) === 'LOWERED');
  await p4.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=4', { waitUntil: 'networkidle' });
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
  await p4.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=3', { waitUntil: 'networkidle' });
  await p4.click('[data-testid=skip-intro]');
  await hub('universe');
  await p4.click('[data-testid=lu-enable]');
  await p4.waitForTimeout(150);
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

check('no console errors', errors.length === 0, errors.join(' | '));
await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(`${SHOTS}/results.json`, JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
