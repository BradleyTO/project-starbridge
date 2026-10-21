// v0.8.0 smoke: the Captain's Handbook. Imported by scripts/smoke.mjs; also runnable alone:
//   node scripts/smoke-handbook.mjs [url]   (Env: SHOTS_DIR, HANDBOOK_SHOTS for the release screenshots)
import fs from 'node:fs';

/**
 * @param {{ browser: import('playwright').Browser, URL: string, SHOTS: string, check: Function, errors: string[], stubs: Function }} o
 */
export async function handbookSmoke({ browser, URL, SHOTS, check, errors, stubs }) {
  const REL = process.env.HANDBOOK_SHOTS;
  if (REL) fs.mkdirSync(REL, { recursive: true });
  const shot = async (pg, name, opts = {}) => {
    await pg.screenshot({ path: `${SHOTS}/v080-${name}.png`, ...opts });
    if (REL) fs.copyFileSync(`${SHOTS}/v080-${name}.png`, `${REL}/${name}.png`);
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
  const shownArticle = () => pg.getAttribute('[data-testid=handbook-article]', 'data-article');
  const close = async () => { await pg.click('[data-testid=hub-close]'); await pg.waitForTimeout(200); };
  const searchFor = async (q) => { await pg.fill('[data-testid=handbook-search]', q); await pg.click('[data-testid=handbook-search-go]'); await pg.waitForTimeout(150); };
  const resultIds = () => pg.evaluate(() => [...document.querySelectorAll('[data-testid=handbook-results] li[data-article]')].map((e) => e.getAttribute('data-article')));

  // --- idle bridge: open by voice command, read, close: nothing changes.
  await pg.goto(withSeed(7), { waitUntil: 'networkidle' });
  await pg.waitForTimeout(400);
  await skipIntro();
  await send('status report', 400);
  let before = await snapshot();
  await send('Computer, open the handbook');
  check('v0.8.0: "computer, open the handbook" opens the handbook contents on the idle bridge', (await pg.locator('[data-testid=hub]').count()) === 1 && (await view()) === 'contents');
  const contents = await pg.innerText('[data-testid=handbook-contents]');
  check('v0.8.0: contents show ISA-COM-001, the edition label and every chapter', /ISA-COM-001/.test(contents) && /First Edition, Draft 3, pending approval/i.test(contents) && ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'T'].every((c) => contents.includes(c === 'T' ? 'Annex T' : `Chapter ${c}.`)), contents.slice(0, 200));
  check('v0.8.0: contents list all 42 articles', (await pg.locator('.hb-toc-articles li').count()) === 42);
  check('v0.8.0: drafting appendices are not shipped', !/Appendix|Concordance|Register of changes|Drafting notes|\[EXISTING|\[NEW\]|Brad/i.test(contents));
  const width = await pg.evaluate(() => document.querySelector('.hb-paper > div > p.hb-issued')?.getBoundingClientRect().width ?? 0);
  check('v0.8.0 desktop: comfortable reading width (≤ 760px measure)', width > 300 && width <= 760, `${Math.round(width)}px`);
  await shot(pg, '01-handbook-contents', { fullPage: true });
  await close();
  let after = await snapshot();
  check('v0.8.0: opening and closing the handbook on the idle bridge changes nothing', same(before, after), diff(before, after));

  // --- Hub entry, chapter view, article view, search.
  await pg.click('[data-testid=open-hub]');
  await pg.click('[data-testid=hub-tab-handbook]');
  check('v0.8.0: the Command Hub has a Captain\'s Handbook tab', (await view()) !== null);
  await pg.click('[data-testid=handbook-chapter-link-B]');
  check('v0.8.0: a chapter view lists its articles', (await pg.getAttribute('[data-testid=handbook-chapter]', 'data-chapter')) === 'B' && (await pg.locator('.hb-chapter-list > li').count()) === 5);
  await searchFor('B.1');
  check('v0.8.0: searching "B.1" opens Art. B.1 (roe-1)', (await shownArticle()) === 'roe-1');
  const art = await pg.innerText('[data-testid=handbook-article]');
  check('v0.8.0: an article shows authoritative text apart from the commentary', (await pg.locator('[data-testid=handbook-text]').count()) === 1 && /Authoritative text/i.test(art) && /Commentary/i.test(art) && /Explanation/.test(art) && /Examples/.test(art));
  check('v0.8.0: an article shows its legal and enforcement status', /Legal status:\s*In force/.test(art) && /Enforcement status:\s*Partially evaluated/.test(art));
  check('v0.8.0: an article shows its permanent id, revision and former citation', /roe-1/.test(art) && /Revision 1/.test(art) && /formerly Rules of Engagement §1/.test(art));
  await shot(pg, '02-article-B1', { fullPage: true });
  await pg.locator('[data-testid=handbook-related] a[data-article=roe-5]').click();
  await pg.waitForTimeout(150);
  check('v0.8.0: a related-article link opens that article', (await shownArticle()) === 'roe-5');
  for (const [q, id] of [['Art. B.1', 'roe-1'], ['roe-1', 'roe-1'], ['Reg. 7.2', 'reg-7.2']]) {
    await searchFor(q);
    check(`v0.8.0: search "${q}" finds ${id}`, (await shownArticle()) === id);
  }
  const topics = [['pathogen', 'health-1'], ['quarantine', 'quarantine-1'], ['biological containment', 'health-1'], ['rules of engagement', 'roe-1'], ['unlawful order', 'orders-1'], ['first contact', 'contact-1'], ['asylum', 'asylum-1'], ['warning shot', 'roe-5']];
  for (const [q, id] of topics) {
    await searchFor(q);
    const ids = await resultIds();
    check(`v0.8.0: topic search "${q}" ranks ${id} in the top three`, ids.slice(0, 3).includes(id), ids.slice(0, 5).join(' '));
  }
  await searchFor('quarantine');
  await shot(pg, '03-search-results', { fullPage: true });
  // Spoiler-safe: an after-played reference is hidden before the simulation has been run.
  await searchFor('asylum-1');
  const asy = await pg.innerText('[data-testid=handbook-article]');
  check('v0.8.0: after-played training references stay hidden until the simulation is run', !/Training Simulation 001/.test(asy) && /Training Simulation 019/.test(asy), asy.slice(-400));
  await searchFor('health-1');
  check('v0.8.0: an enforcement note that describes an unplayed simulation is withheld', (await pg.locator('[data-testid=handbook-enforcement-withheld]').count()) === 1 && !/Tallis Gate \(/.test(await pg.innerText('[data-testid=handbook-status]')));
  await close();

  // --- in a simulation: the bridge command opens the handbook mid-run; the run is untouched.
  await send('Computer, begin the Kestrel Incident simulation', 1200);
  await pg.waitForSelector('[data-testid=mode-banner][data-mode=simulation]');
  await pg.waitForTimeout(500);
  await skipIntro();
  await send('scan the freighter', 500);
  before = await snapshot();
  await send('show me the regulation on first contact');
  check('v0.8.0: in a simulation, "show me the regulation on first contact" opens Art. H.1', (await shownArticle()) === 'contact-1');
  await shot(pg, '04-bridge-command-in-simulation');
  await close();
  await send('what are the quarantine regulations');
  const qr = await resultIds();
  check('v0.8.0: "what are the quarantine regulations" shows ranked results', (await view()) === 'search' && qr.includes('quarantine-1') && qr.includes('quarantine-2') && qr.includes('health-1'), qr.join(' '));
  await close();
  await send('show me article B.1');
  check('v0.8.0: "show me article B.1" opens Art. B.1 in a simulation', (await shownArticle()) === 'roe-1');
  await close();
  after = await snapshot();
  check('v0.8.0: the simulation is exactly where it was after the handbook (clock, turn, log, objectives, saves)', same(before, after), diff(before, after));
  await send('wait', 400);
  check('v0.8.0: the simulation carries on after the handbook', (await snapshot()).clock !== before.clock);

  // --- report citations open their articles; after the run, the hidden reference appears.
  for (const c of ['charge the jump drive', 'wait', 'wait', 'jump']) await send(c, 350);
  await pg.waitForTimeout(800);
  await pg.click('[data-testid=outcome-aar]');
  await pg.waitForTimeout(300);
  const links = pg.locator('[data-testid=aar-regulations] [data-testid=citation-link]');
  const nLinks = await links.count();
  const nRegs = await pg.locator('[data-testid=aar-regulations] li').count();
  check('v0.8.0: every regulation cited in the after-action report is a link', nRegs > 0 && nLinks === nRegs, `${nLinks}/${nRegs}`);
  await links.first().scrollIntoViewIfNeeded();
  await links.first().hover();
  await shot(pg, '05-report-citation-link');
  const citeId = await links.first().getAttribute('data-article');
  await links.first().click();
  await pg.waitForTimeout(200);
  check('v0.8.0: clicking a report citation opens its article', (await shownArticle()) === citeId, citeId);
  await searchFor('asylum-1');
  check('v0.8.0: after the run, the after-played reference is shown', /Training Simulation 001/.test(await pg.innerText('[data-testid=handbook-article]')));
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
  check('v0.8.0: Active Duty mission under way', before.mode === 'canonical', before.mode);
  await send('computer, open the handbook');
  check('v0.8.0: the handbook opens on Active Duty', (await view()) === 'contents');
  await searchFor('warning shot');
  await close();
  after = await snapshot();
  check('v0.8.0: Active Duty is exactly where it was after the handbook (clock, log, saves)', same(before, after), diff(before, after));

  // --- phone width.
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.waitForTimeout(200);
  await send('show me article D.7');
  await pg.waitForTimeout(200);
  check('v0.8.0 phone: the handbook opens an article', (await shownArticle()) === 'orders-1');
  const ov = await pg.evaluate(() => Math.max(document.documentElement.scrollWidth, document.querySelector('.hub-backdrop')?.scrollWidth ?? 0) - window.innerWidth);
  check('v0.8.0 phone: no horizontal overflow in the handbook', ov <= 0, `overflow ${ov}px`);
  const fs16 = await pg.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.hb-text-body')).fontSize));
  check('v0.8.0 phone: authoritative text is set at a readable size (≥ 16px)', fs16 >= 16, `${fs16}px`);
  await shot(pg, '06-phone-article', { fullPage: true });
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
