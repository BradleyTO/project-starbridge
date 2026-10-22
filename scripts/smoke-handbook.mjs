// v0.8.0 smoke: the Captain's Handbook (v0.8.2: the First Edition code). Imported by scripts/smoke.mjs; also runnable alone:
//   node scripts/smoke-handbook.mjs [url]   (Env: SHOTS_DIR, HANDBOOK_SHOTS for the release screenshots)
import fs from 'node:fs';

/**
 * @param {{ browser: import('playwright').Browser, URL: string, SHOTS: string, check: Function, errors: string[], stubs: Function }} o
 */
export async function handbookSmoke({ browser, URL, SHOTS, check, errors, stubs }) {
  const REL = process.env.HANDBOOK_SHOTS;
  if (REL) fs.mkdirSync(REL, { recursive: true });
  const shot = async (pg, name, opts = {}) => {
    await pg.screenshot({ path: `${SHOTS}/v082-${name}.png`, ...opts });
    if (REL) fs.copyFileSync(`${SHOTS}/v082-${name}.png`, `${REL}/${name}.png`);
  };
  const withSeed = (seed) => URL + (URL.includes('?') ? '&' : '?') + `seed=${seed}`;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(stubs);
  const pg = await ctx.newPage();
  pg.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  pg.on('pageerror', (e) => errors.push(String(e)));
  const send = async (cmd, wait = 200) => { await pg.fill('[data-testid=command-input]', cmd); await pg.press('[data-testid=command-input]', 'Enter'); await pg.waitForTimeout(wait); };
  const skipIntro = async () => { if (await pg.locator('[data-testid=skip-intro]').count()) await pg.click('[data-testid=skip-intro]'); await pg.waitForTimeout(150); };
  /** Everything a handbook visit must leave alone: clock and turn, mode, log, objectives, every saved key. */
  const snapshot = () => pg.evaluate(() => ({
    clock: document.querySelector('[data-testid=mission-clock]')?.textContent,
    mode: document.querySelector('[data-testid=mode-banner]')?.getAttribute('data-mode'),
    log: document.querySelector('[data-testid=narrative]')?.textContent,
    comms: document.querySelector('[data-testid=comms]')?.textContent,
    objectives: document.querySelector('[data-testid=objectives]')?.textContent,
    status: document.querySelector('[data-testid=ship-status]')?.textContent,
    store: Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('starbridge.')).sort().map((k) => [k, localStorage.getItem(k)])),
  }));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const diff = (a, b) => Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).join(', ');
  const view = () => pg.getAttribute('[data-testid=handbook]', 'data-view');
    const close = async () => { await pg.click('[data-testid=hub-close]'); await pg.waitForTimeout(200); };
  const searchFor = async (q) => { await pg.fill('[data-testid=handbook-search]', q); await pg.click('[data-testid=handbook-search-go]'); await pg.waitForTimeout(150); };

  const shownPart = () => pg.getAttribute('[data-testid=handbook-article]', 'data-part');
  const shownFocus = () => pg.getAttribute('[data-testid=handbook-article]', 'data-focus');
  const at = async () => `${await shownPart()}|${await shownFocus()}`;
  const resultSections = () => pg.evaluate(() => [...document.querySelectorAll('[data-testid=handbook-results] li[data-section]')].map((e) => e.getAttribute('data-section')));
  /** Text the player can read in the handbook: no internal ids or notes may appear in it. */
  const INTERNAL = /(?<![\w-])(cmd-\d|roe-\d|care-\d|reg-\d+(?:\.\d)?|orders-\d|honesty-1|conduct-\d|asylum-\d|health-\d|contact-\d|service-\d|general-\d|border-accords-\d|quarantine-\d)(?![\w-])|Training Simulation|Enforcement status|Commentary|Revision \d/;
  const leaks = async () => (await pg.innerText('[data-testid=handbook]')).match(INTERNAL)?.[0] ?? '';

  // --- idle bridge: open by voice command, read, close: nothing changes.
  await pg.goto(withSeed(7), { waitUntil: 'networkidle' });
  await pg.waitForTimeout(400);
  await skipIntro();
  await send('status report', 400);
  let before = await snapshot();
  await send('Computer, open the handbook');
  check('v0.8.2: "computer, open the handbook" opens the contents on the idle bridge', (await pg.locator('[data-testid=hub]').count()) === 1 && (await view()) === 'contents');
  const contents = await pg.innerText('[data-testid=handbook-contents]');
  check('v0.8.2: contents show ISA-COM-001, "First Edition", the preamble and Articles 1–11 and the Annex', /ISA-COM-001/.test(contents) && /First Edition/i.test(contents) && !/Draft|pending approval/i.test(contents) && /Preamble/i.test(contents) && /Article 1\. General Provisions/.test(contents) && /Article 11\. Records, Duty and Rank/.test(contents) && /Annex\. Treaties the ISA Observes/.test(contents), contents.slice(0, 200));
  check('v0.8.2: the contents list 11 articles and the Annex', (await pg.locator('[data-testid=handbook-contents] .hb-toc li').count()) === 12);
  check('v0.8.2: no internal ids, notes or drafting material in the contents', !(await leaks()) && !/Appendix|Concordance|\[NEW\]|Brad/i.test(contents), await leaks());
  const width = await pg.evaluate(() => document.querySelector('[data-testid=handbook-preamble]')?.getBoundingClientRect().width ?? 0);
  check('v0.8.2 desktop: comfortable reading width (≤ 760px measure)', width > 300 && width <= 760, `${Math.round(width)}px`);
  await shot(pg, '01-contents', { fullPage: true });
  await close();
  let after = await snapshot();
  check('v0.8.2: opening and closing the handbook on the idle bridge changes nothing', same(before, after), diff(before, after));

  // --- Hub entry, an article, search by number, old citation and topic.
  await pg.click('[data-testid=open-hub]');
  await pg.click('[data-testid=hub-tab-handbook]');
  check('v0.8.2: the Command Hub has a Captain\'s Handbook tab', (await view()) !== null);
  await pg.click('[data-testid=handbook-part-link-3]');
  const art = await pg.innerText('[data-testid=handbook-article]');
  check('v0.8.2: Article 3 lists its nine subsections', (await shownPart()) === '3' && (await pg.locator('[data-testid=handbook-article] .hb-rule').count()) === 9 && /Use of Force/.test(art) && /while reasonable peaceful alternatives remain available/.test(art));
  check('v0.8.2: an article shows only the code (no ids, commentary, training references or status lines)', !(await leaks()) && !/Explanation|Examples|Legal status|formerly/i.test(art), await leaks());
  await shot(pg, '02-article-3', { fullPage: true });
  for (const [q, want] of [['3.3', '3|3.3'], ['§3.3', '3|3.3'], ['Art. 3', '3|'], ['Article 5', '5|'], ['Reg. 7.2', '5|5.5'], ['Rules of Engagement §1', '3|3.3'], ['B.1', '3|3.3'], ['Annex T.2', 'T|T.2']]) {
    await searchFor(q);
    check(`v0.8.2: search "${q}" opens ${want.replace('|', ' at ') || want}`, (await at()) === want, await at());
  }
  check('v0.8.2: a cited subsection is highlighted', (await pg.locator('.hb-rule.hb-focus[data-section="T.2"]').count()) === 1);
  const topics = [['pathogen', ['8.1', '8.2']], ['quarantine', ['T.4', 'T.5']], ['biological containment', ['8.1', '8.2']], ['rules of engagement', ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9']], ['unlawful order', ['5.8', '5.9', '5.10']], ['first contact', ['9.1', '9.2']], ['asylum', ['7.1', '7.2', '7.3']], ['warning shot', ['3.6', '3.7', '3.8']]];
  for (const [q, want] of topics) {
    await searchFor(q);
    const got = await resultSections();
    check(`v0.8.2: topic search "${q}" ranks §${want[0]} or its siblings in the top three`, got.slice(0, 3).some((n) => want.includes(n)), got.slice(0, 5).join(' '));
  }
  await searchFor('quarantine');
  check('v0.8.2: search results show no internal ids', !(await leaks()), await leaks());
  await shot(pg, '03-search', { fullPage: true });
  await close();

  // --- in a simulation: the bridge command opens the handbook mid-run; the run is untouched.
  await send('Computer, begin the Kestrel Incident simulation', 1200);
  await pg.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  await pg.waitForTimeout(500);
  await skipIntro();
  await send('scan the freighter', 500);
  before = await snapshot();
  await send('show me the regulation on first contact');
  check('v0.8.2: in a simulation, "show me the regulation on first contact" opens §9.1', (await at()) === '9|9.1', await at());
  await shot(pg, '06-bridge-command-in-simulation');
  await close();
  await send('what are the quarantine regulations');
  const qr = await resultSections();
  check('v0.8.2: "what are the quarantine regulations" shows ranked results', (await view()) === 'search' && qr.includes('T.4') && qr.includes('T.5') && qr.includes('8.1'), qr.join(' '));
  await close();
  await send('show me section 3.3');
  check('v0.8.2: "show me section 3.3" opens §3.3 in a simulation', (await at()) === '3|3.3', await at());
  await close();
  await send('show me article B.1');
  check('v0.8.2: "show me article B.1" (a draft number) opens §3.3 in a simulation', (await at()) === '3|3.3', await at());
  await close();
  after = await snapshot();
  check('v0.8.2: the simulation is exactly where it was after the handbook (clock, turn, log, objectives, saves)', same(before, after), diff(before, after));
  await send('wait', 400);
  check('v0.8.2: the simulation carries on after the handbook', (await snapshot()).clock !== before.clock);

  // --- report citations: "§3.3 Use of Force", no ids, each opens its subsection.
  for (const c of ['charge the jump drive', 'wait', 'wait', 'jump']) await send(c, 350);
  await pg.waitForTimeout(800);
  await pg.click('[data-testid=outcome-aar]');
  await pg.waitForTimeout(300);
  const links = pg.locator('[data-testid=aar-regulations] [data-testid=citation-link]');
  const nLinks = await links.count();
  const nRegs = await pg.locator('[data-testid=aar-regulations] li').count();
  check('v0.8.2: every regulation cited in the after-action report is a link', nRegs > 0 && nLinks === nRegs, `${nLinks}/${nRegs}`);
  const labels = await links.allInnerTexts();
  check('v0.8.2: report citations read "§n Title" or "Annex T.n, …", with no internal ids', labels.every((l) => /^(§\d{1,2}\.\d{1,2} [A-Z]|Annex T\.\d, )/.test(l) && !INTERNAL.test(l)), labels.join(' | '));
  check('v0.8.2: the report regulations list shows no internal ids', !INTERNAL.test(await pg.innerText('[data-testid=aar-regulations]')));
  await links.first().scrollIntoViewIfNeeded();
  await links.first().hover();
  await shot(pg, '05-report-citation');
  const citeAt = await links.first().getAttribute('data-section');
  await links.first().click();
  await pg.waitForTimeout(200);
  check('v0.8.2: clicking a report citation opens its subsection', (await shownFocus()) === citeAt, `${citeAt} → ${await at()}`);
  await close();

  // --- Active Duty: open and close mid-mission; the canonical mission is untouched.
  await pg.click('[data-testid=open-hub]');
  await pg.click('[data-testid=hub-tab-universe]');
  await pg.click('[data-testid=lu-enable]');
  await pg.waitForTimeout(150);
  await pg.click('[data-testid=commission-accept]');
  await pg.waitForTimeout(150);
  if (!(await pg.locator('[data-testid=hub]').count())) await pg.click('[data-testid=open-hub]');
  await pg.click('[data-testid=hub-tab-universe]');
  await pg.locator('[data-class=directive] [data-testid$=-start]').click();
  await pg.waitForTimeout(300);
  await skipIntro();
  await send('scan the freighter', 500);
  before = await snapshot();
  check('v0.8.2: Active Duty mission under way', before.mode === 'canonical', before.mode);
  await send('computer, open the handbook');
  check('v0.8.2: the handbook opens on Active Duty', (await view()) === 'contents');
  await searchFor('warning shot');
  await close();
  await send('show me §5.9');
  check('v0.8.2: "show me §5.9" opens §5.9 on Active Duty', (await at()) === '5|5.9', await at());
  await close();
  after = await snapshot();
  check('v0.8.2: Active Duty is exactly where it was after the handbook (clock, log, saves)', same(before, after), diff(before, after));

  // --- phone width.
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.waitForTimeout(200);
  await send('show me article 7');
  await pg.waitForTimeout(200);
  check('v0.8.2 phone: the handbook opens Article 7', (await shownPart()) === '7' && (await pg.locator('[data-testid=handbook-article] .hb-rule').count()) === 4);
  const ov = await pg.evaluate(() => Math.max(document.documentElement.scrollWidth, document.querySelector('.hub-backdrop')?.scrollWidth ?? 0) - window.innerWidth);
  check('v0.8.2 phone: no horizontal overflow in the handbook', ov <= 0, `overflow ${ov}px`);
  const fs16 = await pg.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.hb-rule-text')).fontSize));
  check('v0.8.2 phone: the code is set at a readable size (≥ 16px)', fs16 >= 16, `${fs16}px`);
  await shot(pg, '04-phone', { fullPage: true });
  await close();
  await ctx.close();
}

// Standalone: node scripts/smoke-handbook.mjs [url]
if (import.meta.url === `file://${process.argv[1]}`) {
  const { chromium } = await import('playwright');
  const URL = process.argv[2] || process.env.SMOKE_URL || 'http://localhost:4173/';
  const SHOTS = process.env.SHOTS_DIR || './smoke-shots';
  fs.mkdirSync(SHOTS, { recursive: true });
  const results = [];
  const check = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
  const stubs = () => {
    try { if (!localStorage.getItem('starbridge.profile.v1')) localStorage.setItem('starbridge.profile.v1', JSON.stringify({ schema: 'starbridge.profile', version: 1, name: 'Rowan Ashby', prompted: true, history: [] })); } catch {}
    if ('speechSynthesis' in window) { window.speechSynthesis.speak = () => {}; window.speechSynthesis.cancel = () => {}; }
  };
  const errors = [];
  const browser = await chromium.launch();
  await handbookSmoke({ browser, URL, SHOTS, check, errors, stubs });
  check('no console errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}
