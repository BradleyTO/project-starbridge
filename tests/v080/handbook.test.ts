/**
 * v0.8.0: the ISA-COM-001 regulation database, search, bridge commands, spoiler safety and save compatibility.
 * v0.8.2: the First Edition (11 articles, 71 subsections, Annex T; 44 permanent ids).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ANNEX,
  ARTICLES,
  CODE,
  HANDBOOK,
  PREAMBLE,
  SECTIONS,
  article,
  citationLabel,
  citedArticle,
  enforcementNoteVisible,
  playedScenarios,
  resolve,
  search,
  section,
  textAt,
  visibleTraining,
} from '../../src/handbook';
import { handbookRequest } from '../../src/handbook/command';
import { SIMULATIONS } from '../../src/scenarios/catalogue';
import { TRAINING_SCENARIOS } from '../../src/scenarios/registry';
import { evaluate } from '../../src/evaluation/evaluate';
import { reviewFinding } from '../../src/universe/world';
import { Universe } from '../../src/universe/controller';
import { defaultLedger } from '../../src/universe/credits';
import { KEYS, localRepository, memoryStorage } from '../../src/universe/repository';
import { K, KESTREL, TALLIS, TS } from '../v07/fixtures';

const V07_IDS = ['reg-7.1', 'reg-7.2', 'reg-7.3', 'reg-7.4', 'reg-12', 'border-accords-4', 'roe-1', 'roe-2', 'roe-3', 'care-1', 'care-2', 'quarantine-1', 'quarantine-2', 'honesty-1', 'asylum-1'];
/** The 27 ids added in the drafts (Draft 3), kept with the 15 pre-edition ids. */
const DRAFT_IDS = ['cmd-1', 'cmd-2', 'cmd-3', 'cmd-4', 'cmd-5', 'roe-4', 'roe-5', 'care-3', 'care-4', 'orders-2', 'orders-1', 'conduct-1', 'conduct-2', 'asylum-2', 'health-1', 'health-2', 'contact-1', 'contact-2', 'contact-3', 'service-1', 'service-2', 'service-3', 'service-4', 'service-5', 'service-6', 'border-accords-2', 'border-accords-9'];
const scenarioOf = (n: number) => SIMULATIONS.find((x) => x.number === n)?.scenarioId;
const srcFiles = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? srcFiles(join(dir, f)) : /\.tsx?$/.test(f) ? [join(dir, f)] : []));
const SUBS = CODE.flatMap((a) => a.subsections);

describe('the First Edition', () => {
  it('is the First Edition: 11 articles, 71 subsections and an Annex of 5 treaty provisions', () => {
    expect(HANDBOOK.edition).toBe('First Edition');
    expect(CODE.map((a) => a.title)).toEqual(['General Provisions', 'Command and Accountability', 'Use of Force', 'Duty of Care', 'Orders and Directives', 'Honesty and Integrity', 'Protection, Asylum and Custody', 'Health and Biological Hazards', 'Contact, Jurisdiction and Disputed Space', 'Review and Appeal', 'Records, Duty and Rank']);
    expect(CODE.map((a) => a.subsections.length)).toEqual([8, 6, 9, 7, 10, 4, 4, 3, 8, 8, 4]);
    expect(SUBS).toHaveLength(71);
    expect(ANNEX.map((x) => `${x.number} ${x.instrument}${x.provisional ? ' (Provisional)' : ''}`)).toEqual(['T.1 Border Accords, Art. 2 (Provisional)', 'T.2 Border Accords, Art. 4', 'T.3 Border Accords, Art. 9 (Provisional)', 'T.4 Colonial Quarantine Accord, §1', 'T.5 Colonial Quarantine Accord, §2']);
    for (const a of CODE) a.subsections.forEach((s, j) => expect(s.number).toBe(`${a.number}.${j + 1}`));
  });
  it('each subsection is one short rule ("shall", "shall not" or "may")', () => {
    for (const s of SUBS) {
      expect(s.text, s.number).toMatch(/^[A-Z].*\.$/);
      expect(s.text, s.number).not.toMatch(/\. [A-Z]/);
      expect(s.text, s.number).toMatch(/\b(shall|may)\b/);
      expect(s.text.split(' ').length, s.number).toBeLessThanOrEqual(45);
    }
    expect(PREAMBLE.split(/\n/)).toHaveLength(1);
  });
  it('the four approval amendments are in the text', () => {
    expect(section('3.1')!.text).toContain('while reasonable peaceful alternatives remain available');
    expect(section('5.9')!.text).toBe('A member ordered to commit an act contrary to this Code or to an applicable treaty shall refuse, state the reason and ensure that the refusal is logged.');
    expect(section('7.2')!.text).toBe('A person shall not be handed over where credible evidence indicates a serious risk of persecution, torture or grave harm, even if assurances have been offered.');
    expect(section('10.7')!.text).toBe('Where ISA Fleet Command’s own conduct is in question, ISA personnel may refer an allegation or an appeal directly to the ISA Office of Independent Review, without Fleet Command’s permission.');
  });
  it('says "the ISA" throughout and ships no drafting material', () => {
    const code = JSON.stringify({ CODE, ANNEX, PREAMBLE });
    expect(code + JSON.stringify(ARTICLES)).not.toMatch(/Agency/);
    expect(code).not.toMatch(/Draft|Proposal|pending approval|\[NEW\]|Brad|Appendix|Concordance/i);
    expect(JSON.stringify(ARTICLES)).not.toMatch(/Brad|Appendix|Concordance|Register of changes|Drafting note|open question/i);
    expect(HANDBOOK.issuer).toBe('Intergalactic Space Agency (ISA)');
    expect(section('9.6')!.text).toContain('the Calloway Reach');
  });
});

describe('the regulation records and the mapping', () => {
  it('keeps all 42 ids plus general-1 and general-2; none lost or reused', () => {
    const ids = ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(44);
    expect([...ids].sort()).toEqual([...V07_IDS, ...DRAFT_IDS, 'general-1', 'general-2'].sort());
    const drafts = ARTICLES.flatMap((a) => (a.internal.draftNumber ? [a.internal.draftNumber] : []));
    expect(new Set(drafts).size).toBe(42);
  });
  it('every id resolves to a subsection, and every subsection has an id', () => {
    const ids = new Set(ARTICLES.map((a) => a.id));
    for (const s of SECTIONS) expect(ids.has(s.id), s.number).toBe(true);
    for (const s of SUBS) for (const x of s.also) expect(ids.has(x), `${s.number} also ${x}`).toBe(true);
    const primary = ARTICLES.flatMap((a) => a.sections);
    expect(primary.sort()).toEqual(SECTIONS.map((s) => s.number).sort());
    for (const a of ARTICLES) {
      expect(a.sections.length, a.id).toBeGreaterThan(0);
      expect(a.number).toBe(a.sections[0]);
      for (const n of a.sections) expect(section(n)?.id, `${a.id} → ${n}`).toBe(a.id);
    }
  });
  it('the 15 pre-edition ids map as approved', () => {
    const at = Object.fromEntries(V07_IDS.map((id) => [id, article(id)!.number]));
    expect(at).toEqual({ 'reg-7.1': '5.4', 'reg-7.2': '5.5', 'reg-7.3': '5.6', 'reg-7.4': '5.7', 'reg-12': '5.1', 'border-accords-4': 'T.2', 'roe-1': '3.3', 'roe-2': '3.1', 'roe-3': '3.9', 'care-1': '4.1', 'care-2': '4.2', 'quarantine-1': 'T.4', 'quarantine-2': 'T.5', 'honesty-1': '6.1', 'asylum-1': '7.1' });
    expect(article('asylum-1')!.sections).toEqual(['7.1', '7.2', '7.3']);
    expect(article('asylum-2')!.sections).toEqual(['7.4']);
    expect(article('general-1')!.sections).toEqual(['1.5', '1.6']);
    expect(article('general-2')!.sections).toEqual(['1.7']);
  });
  it('revision 1 is the First Edition text; revision 0 the v0.7 wording; draft text is not a revision', () => {
    for (const a of ARTICLES) {
      expect(a.revision, a.id).toBe(1);
      expect(a.revisions.map((r) => r.rev), a.id).toEqual(V07_IDS.includes(a.id) ? [0, 1] : [1]);
      expect(a.revisions.at(-1)).toMatchObject({ rev: 1, edition: 'First Edition', text: a.text });
      expect(a.text, a.id).toBe(a.sections.map((n) => section(n)!.text).join(' '));
      for (const f of ['id', 'citation', 'title', 'text'] as const) expect(a[f], `${a.id}.${f}`).toBeTruthy();
      for (const f of ['explanation', 'appliesWhen', 'exceptions'] as const) expect(a.internal[f], `${a.id}.${f}`).toBeTruthy();
      for (const r of a.internal.related) expect(article(r), `${a.id} → ${r}`).toBeDefined();
      for (const t of a.internal.training) expect(t.purpose, a.id).toMatch(/^[A-Z].*\.$/);
    }
    expect(textAt('roe-1', 0)?.text).toBe('ISA weapons are never used against non-combatants who pose no threat.');
    expect(textAt('roe-1', 1)?.text).toBe(article('roe-1')!.text);
    expect(textAt('cmd-1', 0)).toBeUndefined();
  });
  it('citations display as the subsection and article title, never the id', () => {
    expect(citationLabel('roe-1')).toBe('§3.3 Use of Force');
    expect(citationLabel('reg-7.2')).toBe('§5.5 Orders and Directives');
    expect(citationLabel('asylum-1')).toBe('§7.1 Protection, Asylum and Custody');
    expect(citationLabel('border-accords-4')).toBe('Annex T.2, Border Accords, Art. 4');
    expect(citationLabel('no-such-id')).toBeUndefined();
    for (const a of ARTICLES) expect(a.citation).toBe(citationLabel(a.id));
  });
  it('legal status and enforcement are unchanged (the two new ids are not yet evaluated)', () => {
    expect(ARTICLES.filter((a) => a.legalStatus === 'provisional').map((a) => a.id).sort()).toEqual(['border-accords-2', 'border-accords-9']);
    expect(ARTICLES.filter((a) => a.internal.enforcement.status === 'evaluated').map((a) => a.id).sort()).toEqual(['reg-12', 'reg-7.1', 'reg-7.3', 'service-2', 'service-5']);
    expect(ARTICLES.filter((a) => a.internal.enforcement.status === 'partial')).toHaveLength(20);
    expect(ARTICLES.filter((a) => a.internal.enforcement.status === 'not-yet')).toHaveLength(19);
    for (const a of ARTICLES) expect(a.internal.enforcement.note, a.id).not.toMatch(/v\d+\.\d|\bplanned\b|\bfix\b|evaluator|descriptor|commit gate|\bengine\b|implemented|\bcode\b/i);
  });
});

describe('every regulation the game cites exists in the database', () => {
  it('simulation descriptors: listed regulations and marker regulations', () => {
    for (const sim of SIMULATIONS) {
      const d = TRAINING_SCENARIOS[sim.scenarioId]!.evaluation!;
      for (const r of d.regulations) expect(article(r), `${sim.trainingId}: ${r}`).toBeDefined();
      for (const m of d.markers) if (m.regulation) expect(article(m.regulation), `${sim.trainingId}: ${m.id}`).toBeDefined();
    }
  });
  it('every regulation id written anywhere in the source', () => {
    const cited = new Set<string>();
    for (const f of srcFiles('src').filter((x) => !x.includes(`${join('src', 'handbook')}`))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/regulation:\s*'([^']+)'|regulation\('([^']+)'\)|regulations:\s*\[([^\]]*)\]/g)) {
        if (m[1]) cited.add(m[1]);
        if (m[2]) cited.add(m[2]);
        if (m[3]) for (const x of m[3].matchAll(/'([^']+)'/g)) cited.add(x[1]);
      }
    }
    expect(cited.size).toBeGreaterThan(8);
    for (const id of cited) expect(article(id), id).toBeDefined();
  });
  it('the crew refusal path (roe-1) and evaluations of real runs cite only database articles', () => {
    const runs = [evaluate(KESTREL.pyrrhic(), K, OPTS), evaluate(KESTREL.handover(), K, OPTS), evaluate(TALLIS.orderedFireOnLiner(), TS, OPTS), evaluate(TALLIS.incident(), TS, OPTS)];
    for (const e of runs) for (const r of e.regulations) expect(article(r.id), r.id).toBeDefined();
    expect(runs[2].regulations.some((r) => r.id === 'roe-1')).toBe(true);
  });
  it('disciplinary review rules resolve to their articles', () => {
    const rules = ['Reg. 12: failure to carry out a lawful directive.', 'Reg. 7.2: a directive may be declined when the ship is not fit for duty (hull below 60%).', 'Reg. 7.3: an existing lifesaving commitment takes precedence over a directive.', 'Reg. 7.4: a directive that would breach treaty law may be refused.', 'Reg. 7.1: a directive refused without a stated reason.'];
    expect(rules.map((r) => citedArticle(r)?.id)).toEqual(['reg-12', 'reg-7.2', 'reg-7.3', 'reg-7.4', 'reg-7.1']);
    const src = readFileSync('src/universe/world.ts', 'utf8');
    for (const m of src.matchAll(/rule = '([^']+)'/g)) expect(citedArticle(m[1]), m[1]).toBeDefined();
    expect(reviewFinding({ trigger: 'refused', reason: '', evidence: [] }).finding).toBe('reprimand');
  });
});

const OPTS = { id: 'E', source: 'simulation' as const, refId: 'R', atIso: '2026-10-21T12:00:00.000Z' };

describe('exercise objectives are not regulations', () => {
  it('no objective id or text is an article, and none leaks into the handbook', () => {
    const shipped = JSON.stringify({ CODE, ANNEX, PREAMBLE, ARTICLES }).toLowerCase();
    for (const sim of SIMULATIONS) {
      const mod = TRAINING_SCENARIOS[sim.scenarioId]!;
      const s = mod.create(1);
      for (const o of s.objectives) {
        expect(article(o.id), o.id).toBeUndefined();
        expect(resolve(o.id), o.id).toBeUndefined();
        expect(shipped).not.toContain(o.text.toLowerCase());
      }
      for (const key of Object.keys(mod.evaluation!.objectives)) expect(article(key), key).toBeUndefined();
    }
  });
  it('evaluations never list an objective as a regulation', () => {
    for (const e of [evaluate(KESTREL.abandoned(), K, OPTS), evaluate(TALLIS.teamFirst(), TS, OPTS)]) {
      const objIds = new Set(e.objectives.map((o) => o.id));
      for (const r of e.regulations) expect(objIds.has(r.id)).toBe(false);
    }
  });
  it('the handbook names no scenario characters or ships (catalogue titles only, in internal training references)', () => {
    const shipped = JSON.stringify({ CODE, ANNEX, PREAMBLE, records: ARTICLES.map((a) => ({ ...a, internal: { ...a.internal, training: a.internal.training.map((t) => t.purpose), enforcement: null } })) });
    expect(shipped).not.toMatch(/\b(Kestrel|Arden|Vane|Prefect|Ashen|Covenant|Mercy of Ilun|Sabeth|Thornwake|Tallis)\b/);
  });
});

describe('search', () => {
  const top = (q: string) => search(q)[0]?.section.number;
  const ids = (q: string, n = 3) => [...new Set(search(q).map((h) => h.section.id))].slice(0, n);
  it('finds subsections and articles by number', () => {
    for (const q of ['3.3', '§3.3', '§ 3.3', 'section 3.3', 'Art. 3.3', 'ISA-COM-001 §3.3']) {
      expect(search(q).map((h) => h.section.number), q).toEqual(['3.3']);
    }
    for (const q of ['Art. 3', 'Article 3', 'article 3', '§3']) {
      expect(search(q).map((h) => h.section.number), q).toEqual(['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9']);
    }
    expect(top('10.7')).toBe('10.7');
    expect(top('T.2')).toBe('T.2');
    expect(top('Annex T.4')).toBe('T.4');
    expect(search('the Annex').map((h) => h.section.number)).toEqual(['T.1', 'T.2', 'T.3', 'T.4', 'T.5']);
    expect(resolve('12.1')).toBeUndefined();
    expect(resolve('Article 12')).toBeUndefined();
  });
  it('finds old citations, draft numbers and ids at their First Edition subsection', () => {
    expect(top('Reg. 7.2')).toBe('5.5');
    expect(top('Regulation 12')).toBe('5.1');
    expect(top('Rules of Engagement §1')).toBe('3.3');
    expect(top('Border Accords, Art. 4')).toBe('T.2');
    expect(top('Code of Conduct §9')).toBe('7.1');
    expect(top('Colonial Quarantine Accord §1')).toBe('T.4');
    expect(top('B.1')).toBe('3.3');
    expect(top('Art. B.1')).toBe('3.3');
    expect(top('article b1')).toBe('3.3');
    expect(top('ISA-COM-001 Art. D.7')).toBe('5.8');
    expect(top('roe-1')).toBe('3.3');
    expect(search('B.1')).toHaveLength(1);
    for (const a of ARTICLES) {
      if (a.formerly) expect(top(a.formerly), a.formerly).toBe(a.number);
      expect(top(a.id), a.id).toBe(a.number);
    }
  });
  it('finds subsections by topic alias', () => {
    expect(ids('pathogen')).toContain('health-1');
    expect(ids('quarantine', 6)).toEqual(expect.arrayContaining(['quarantine-1', 'quarantine-2', 'health-1']));
    expect(ids('biological containment', 1)).toEqual(['health-1']);
    expect(ids('rules of engagement', 5).sort()).toEqual(['roe-1', 'roe-2', 'roe-3', 'roe-4', 'roe-5']);
    expect(ids('unlawful order', 1)).toEqual(['orders-1']);
    expect(ids('first contact', 1)).toEqual(['contact-1']);
    expect(ids('asylum', 1)).toEqual(['asylum-1']);
    expect(ids('warning shot', 1)).toEqual(['roe-5']);
    expect(ids('warning shots', 1)).toEqual(['roe-5']);
    expect(ids('torture', 1)).toEqual(['asylum-1']);
    expect(ids('extraordinary circumstances', 1)).toEqual(['general-1']);
    expect(ids('office of independent review', 1)).toEqual(['service-3']);
    expect(search('')).toEqual([]);
    expect(search('xyzzy plugh')).toEqual([]);
  });
  it('every topic alias finds its regulation among the results', () => {
    const misses: string[] = [];
    for (const a of ARTICLES) for (const t of a.topics) if (!search(t).some((h) => h.section.id === a.id)) misses.push(`${a.id}: ${t}`);
    expect(misses).toEqual([]);
  });
});

describe('bridge commands open the handbook (and nothing else)', () => {
  it('recognises the handbook requests', () => {
    expect(handbookRequest('Computer, open the handbook')).toEqual({ kind: 'contents' });
    expect(handbookRequest('computer open handbook.')).toEqual({ kind: 'contents' });
    expect(handbookRequest("Open the Captain's Handbook")).toEqual({ kind: 'contents' });
    expect(handbookRequest('what are the regulations?')).toEqual({ kind: 'contents' });
    expect(handbookRequest('Computer, show me section 3.3')).toEqual({ kind: 'part', part: '3', section: '3.3' });
    expect(handbookRequest('show me §3.3')).toEqual({ kind: 'part', part: '3', section: '3.3' });
    expect(handbookRequest('show me 7.2')).toEqual({ kind: 'part', part: '7', section: '7.2' });
    expect(handbookRequest('open article 5')).toEqual({ kind: 'part', part: '5' });
    expect(handbookRequest('show me Art. 3')).toEqual({ kind: 'part', part: '3' });
    expect(handbookRequest('show me the annex')).toEqual({ kind: 'part', part: 'T' });
    expect(handbookRequest('show me Annex T.2')).toEqual({ kind: 'part', part: 'T', section: 'T.2' });
    // Old citations and draft numbers still work, and open the First Edition subsection.
    expect(handbookRequest('Computer, show me article B.1')).toEqual({ kind: 'part', part: '3', section: '3.3' });
    expect(handbookRequest('show me Art. D.7')).toEqual({ kind: 'part', part: '5', section: '5.8' });
    expect(handbookRequest('show me Reg. 7.2')).toEqual({ kind: 'part', part: '5', section: '5.5' });
    expect(handbookRequest('show me roe-1')).toEqual({ kind: 'part', part: '3', section: '3.3' });
    expect(handbookRequest('show me the regulation on first contact')).toEqual({ kind: 'part', part: '9', section: '9.1' });
    expect(handbookRequest('what are the quarantine regulations')).toEqual({ kind: 'search', query: 'quarantine' });
    expect(handbookRequest('What are our rules of engagement?')).toEqual({ kind: 'search', query: 'rules of engagement' });
    expect(handbookRequest('what does the handbook say about asylum')).toEqual({ kind: 'part', part: '7', section: '7.1' });
    expect(handbookRequest('search the handbook for warning shots')?.kind).toBeTruthy();
  });
  it('leaves ordinary orders, questions and duty responses to the interpreter', () => {
    for (const t of ['fire phasers', 'hail the freighter', 'show me the kestrel', 'on screen', 'scan the cruiser', 'set course for tallis gate', 'Computer, begin the Kestrel Incident simulation', 'what training do I need?', 'how am I doing?', 'status report', 'refuse, the directive is unlawful under the accords', 'I refuse: it breaches treaty law', 'raise shields', 'fire a warning shot across her bow', 'tell the prefect the border accords forbid this', 'open a channel to the liner', 'show me article Z.9', 'show me article 12', 'show me section 3.12', 'secure the bridge', 'computer, list simulations', 'red alert']) {
      expect(handbookRequest(t), t).toBeNull();
    }
  });
  it('is context-free: the same request on the idle bridge, in a simulation and on Active Duty', async () => {
    // The app routes a handbook request before the interpreter and the engine (App.onCommand), so it cannot
    // issue an order, take time or change state in any timeline. The router is a pure function of the text.
    const src = readFileSync('src/App.tsx', 'utf8');
    const i = src.indexOf('const hb = handbookRequest(text);');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(src.indexOf('await interpreter.interpret('));
    expect(src.slice(i, src.indexOf('setBusy(true)', i))).not.toMatch(/dispatch|processOrders|universe\.|stateRef\.current\s*=/);
    const handbookSrc = srcFiles('src/handbook').map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(handbookSrc).not.toMatch(/from '\.\.\/(engine|universe|interpreter|scenarios)/);
  });
});

describe('spoiler safety (internal data)', () => {
  const none = playedScenarios(null);
  it('after-played references and notes stay withheld until the Training Record shows the simulation was run', () => {
    const asy = article('asylum-1')!;
    expect(visibleTraining(asy, none, scenarioOf).map((t) => t.simulation)).toEqual([19]);
    expect(enforcementNoteVisible(asy, none, scenarioOf)).toBe(false);
    const played = playedScenarios({ evaluations: [{ scenarioId: 'kestrel-incident' }], archived: [] });
    expect(visibleTraining(asy, played, scenarioOf).map((t) => t.simulation)).toEqual([1, 19]);
    expect(enforcementNoteVisible(asy, played, scenarioOf)).toBe(true);
    const q2 = article('quarantine-2')!;
    expect(visibleTraining(q2, played, scenarioOf)).toEqual([]);
    expect(visibleTraining(q2, playedScenarios({ evaluations: [], archived: [{ scenarioId: 'tallis-quarantine' }] }), scenarioOf)).toHaveLength(1);
    expect(enforcementNoteVisible(article('health-1')!, none, scenarioOf)).toBe(false);
    expect(enforcementNoteVisible(article('health-1')!, playedScenarios({ evaluations: [{ scenarioId: 'tallis-quarantine' }], archived: [] }), scenarioOf)).toBe(true);
    expect(enforcementNoteVisible(article('cmd-1')!, none, scenarioOf)).toBe(true);
  });
  it('exactly the three after-played references are kept, with their flags', () => {
    const after = ARTICLES.flatMap((a) => a.internal.training.filter((t) => t.afterPlayed).map((t) => `${a.id}:${t.simulation}`)).sort();
    expect(after).toEqual(['asylum-1:1', 'border-accords-9:1', 'quarantine-2:2']);
  });
  it('the code itself carries no internal notes, training references or enforcement text', () => {
    const code = JSON.stringify({ CODE, ANNEX, PREAMBLE });
    expect(code).not.toMatch(/Training Simulation|Enforcement|Commentary|Explanation|Kestrel|Tallis/);
    for (const a of ARTICLES) {
      expect(code, a.id).not.toContain(a.internal.explanation);
      for (const t of a.internal.training) expect(code).not.toContain(t.purpose);
    }
  });
});

describe('saves and records', () => {
  const NOW = new Date(2026, 9, 21, 10, 0);
  const make = (storage = memoryStorage()) => new Universe({ repo: localRepository(storage, () => defaultLedger(NOW)), appVersion: '0.8.0', scenarios: { [K.id]: K, [TS.id]: TS }, now: () => NOW });
  it('v0.7.1 saves (training.v1, profile.v1, sim.v1, canon.v1) still load, and their citations resolve', () => {
    const saved = JSON.parse(readFileSync('tests/v080/fixtures/v071-saves.json', 'utf8')) as Record<string, string | null>;
    const storage = memoryStorage();
    for (const [k, v] of Object.entries(saved)) if (v !== null) storage.setItem(k, v);
    const u = make(storage);
    expect(u.profile().name).toBe('Rowan Ashby');
    expect(u.training().evaluations).toHaveLength(2);
    expect(u.repo.sims.read().runs.length).toBeGreaterThanOrEqual(2);
    expect(u.canon()).not.toBeNull();
    for (const e of u.training().evaluations) for (const r of e.regulations) expect(article(r.id), r.id).toBeDefined();
    // Stored reports keep their original wording.
    const raw = JSON.parse(saved[KEYS.training]!);
    expect(u.training().evaluations.map((e) => e.regulations)).toEqual(raw.evaluations.map((e: { regulations: unknown }) => e.regulations));
    expect(playedScenarios(u.training())).toEqual(new Set(['kestrel-incident', 'tallis-quarantine']));
  });
  it('simulation evaluations write no canonical discipline', () => {
    const storage = memoryStorage();
    const u = make(storage);
    u.setActiveDuty(true);
    u.acceptCommission();
    const canon = storage.getItem(KEYS.canon);
    for (const [id, f] of [['TRN-kestrel', KESTREL.handover()], ['TRN-tallis', TALLIS.orderedFireOnLiner()], ['TRN-kestrel', KESTREL.pyrrhic()]] as const) u.finishSimulation(u.startTraining(id, f.seed as number), f);
    expect(u.canon()!.discipline).toEqual([]);
    expect(storage.getItem(KEYS.canon)).toBe(canon);
  });
});

describe('print export', () => {
  it('emits the First Edition code: title block, preamble, contents, every subsection and the Annex, nothing internal', async () => {
    const { exportMarkdown } = await import('../../src/handbook/export');
    const md = exportMarkdown();
    expect(md).toContain('# ISA-COM-001');
    expect(md).toContain('*First Edition*');
    expect(md).toContain(PREAMBLE);
    for (const s of SUBS) expect(md, s.number).toContain(`**${s.number}** ${s.text}`);
    for (const x of ANNEX) expect(md, x.number).toContain(x.text);
    expect(md.match(/\*\(Provisional\)\*/g)).toHaveLength(2);
    expect(md).not.toMatch(/Training Simulation|Commentary|Enforcement|Revision|Draft|Brad/);
    for (const a of ARTICLES) expect(md, a.id).not.toMatch(new RegExp(`(?<![\\w-])${a.id.replace('.', '\\.')}(?![\\w-])`));
  });
});

describe('wording lock', () => {
  it('the First Edition wording, numbering and mapping match tests/v080/fixtures/handbook-lock.json', async () => {
    const { createHash } = await import('node:crypto');
    const h = (t: string) => createHash('sha256').update(t).digest('hex').slice(0, 16);
    const lock = JSON.parse(readFileSync('tests/v080/fixtures/handbook-lock.json', 'utf8')) as {
      sections: Record<string, string>;
      preamble: string;
      records: Record<string, { sections: string[]; revision: number; revisions: string[] }>;
    };
    expect(Object.fromEntries(SECTIONS.map((s) => [s.number, h(s.text)]))).toEqual(lock.sections);
    expect(h(PREAMBLE)).toBe(lock.preamble);
    const now = Object.fromEntries(ARTICLES.map((a) => [a.id, { sections: a.sections, revision: a.revision, revisions: a.revisions.map((r) => `${r.rev}:${h(`${r.title}\n${r.text}`)}`) }]));
    // Ids are never removed; an approved new revision appends (earlier revisions stay identical).
    for (const [id, l] of Object.entries(lock.records)) {
      expect(now[id], id).toBeDefined();
      expect(now[id].revisions.slice(0, l.revisions.length), id).toEqual(l.revisions);
      if (now[id].revision === l.revision) expect(now[id].sections, id).toEqual(l.sections);
    }
    expect(Object.keys(now).sort()).toEqual(Object.keys(lock.records).sort());
  });
  it('revision 0 is byte-identical to v0.8.1 (the v0.7 wording the evaluator reads)', () => {
    const v081 = { 'roe-1': '0:5ca4300e165ee6ee', 'roe-2': '0:94c317726e127bb6', 'roe-3': '0:6c89c4cc2fad54ea', 'care-1': '0:342e4b8ea381a905', 'care-2': '0:0525ba546eb332ad' };
    const lock = JSON.parse(readFileSync('tests/v080/fixtures/handbook-lock.json', 'utf8')) as { records: Record<string, { revisions: string[] }> };
    for (const [id, r0] of Object.entries(v081)) expect(lock.records[id].revisions[0], id).toBe(r0);
  });
});
