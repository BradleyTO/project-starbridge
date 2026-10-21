/** v0.8.0: the ISA-COM-001 regulation database, search, bridge commands, spoiler safety and save compatibility. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ARTICLES,
  CHAPTERS,
  FRONT_MATTER,
  HANDBOOK,
  article,
  citedArticle,
  enforcementNoteVisible,
  playedScenarios,
  resolve,
  search,
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
const scenarioOf = (n: number) => SIMULATIONS.find((x) => x.number === n)?.scenarioId;
const srcFiles = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? srcFiles(join(dir, f)) : /\.tsx?$/.test(f) ? [join(dir, f)] : []));

describe('the regulation database', () => {
  it('is the First Edition, Draft 3: 42 articles in chapters A–I and Annex T', () => {
    expect(HANDBOOK.edition).toBe('First Edition, Draft 3, pending approval');
    expect(ARTICLES).toHaveLength(42);
    expect(CHAPTERS.map((c) => c.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'T']);
    const per = Object.fromEntries(CHAPTERS.map((c) => [c.id, ARTICLES.filter((a) => a.chapter === c.id).length]));
    expect(per).toEqual({ A: 5, B: 5, C: 4, D: 7, E: 3, F: 2, G: 2, H: 3, I: 6, T: 5 });
  });
  it('the 15 pre-edition ids are unchanged and keep their place', () => {
    for (const id of V07_IDS) expect(article(id)?.id, id).toBe(id);
    expect(article('roe-1')?.number).toBe('B.1');
    expect(article('reg-7.2')?.number).toBe('D.4');
    expect(article('quarantine-1')?.number).toBe('T.4');
  });
  it('ids and numbers are unique, and every article carries every field', () => {
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(42);
    expect(new Set(ARTICLES.map((a) => a.number)).size).toBe(42);
    for (const a of ARTICLES) {
      for (const f of ['id', 'citation', 'title', 'text', 'explanation', 'appliesWhen', 'exceptions'] as const) expect(a[f], `${a.id}.${f}`).toBeTruthy();
      expect(a.examples.proper && a.examples.improper, a.id).toBeTruthy();
      expect(a.number.startsWith(`${a.chapter}.`), a.id).toBe(true);
      expect(['in-force', 'provisional']).toContain(a.legalStatus);
      expect(['evaluated', 'partial', 'not-yet']).toContain(a.enforcement.status);
      expect(a.enforcement.note, a.id).toBeTruthy();
      expect(a.revision).toBe(a.revisions.at(-1)!.rev);
      expect(a.revisions.at(-1)!.text).toBe(a.text);
      for (const r of a.related) expect(article(r), `${a.id} → ${r}`).toBeDefined();
      for (const t of a.training) {
        expect(t.simulation).toBeGreaterThanOrEqual(1);
        expect(t.purpose, a.id).toMatch(/^[A-Z].*\.$/);
      }
    }
  });
  it('legal status and enforcement are as approved in Draft 2 (unchanged in Draft 3)', () => {
    expect(ARTICLES.filter((a) => a.legalStatus === 'provisional').map((a) => a.id).sort()).toEqual(['border-accords-2', 'border-accords-9']);
    expect(ARTICLES.filter((a) => a.enforcement.status === 'evaluated').map((a) => a.id).sort()).toEqual(['reg-12', 'reg-7.1', 'reg-7.3', 'service-2', 'service-5']);
    expect(ARTICLES.filter((a) => a.enforcement.status === 'partial')).toHaveLength(20);
    expect(ARTICLES.filter((a) => a.enforcement.status === 'not-yet')).toHaveLength(17);
  });
  it('textAt returns the wording in force at a revision', () => {
    expect(textAt('roe-1', 0)?.text).toBe('ISA weapons are never used against non-combatants who pose no threat.');
    expect(textAt('roe-1', 1)?.text).toBe(article('roe-1')!.text);
    expect(textAt('cmd-1', 0)).toBeUndefined();
  });
  it('enforcement notes are player-facing: no release numbers or developer terms (Draft 3)', () => {
    for (const a of ARTICLES) expect(a.enforcement.note, a.id).not.toMatch(/v\d+\.\d|\bplanned\b|\bfix\b|evaluator|descriptor|commit gate|\bengine\b|implemented|\bcode\b/i);
  });
  it('says "the ISA" throughout; the title block spells out the name once', () => {
    expect(JSON.stringify({ ARTICLES, CHAPTERS, FRONT_MATTER })).not.toMatch(/Agency/);
    expect(HANDBOOK.issuer).toBe('Intergalactic Space Agency (ISA)');
  });
  it('ships no drafting material (status flags, change notes, appendices, approver)', () => {
    const shipped = JSON.stringify({ ARTICLES, CHAPTERS, FRONT_MATTER });
    expect(shipped).not.toMatch(/\[EXISTING|\[NEW\]|Appendix|Concordance|Register of changes|Drafting note|Brad|open question/i);
    for (const a of ARTICLES) expect(Object.keys(a)).not.toEqual(expect.arrayContaining(['change', 'old', 'st']));
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
    const shipped = JSON.stringify({ ARTICLES, FRONT_MATTER }).toLowerCase();
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
  it('the handbook names no scenario characters or ships (catalogue titles only, in training references)', () => {
    const shipped = JSON.stringify(ARTICLES.map((a) => ({ ...a, training: a.training.map((t) => t.purpose), enforcement: null })));
    expect(shipped).not.toMatch(/\b(Kestrel|Arden|Vane|Prefect|Ashen|Covenant|Mercy of Ilun|Sabeth|Thornwake|Tallis)\b/);
  });
});

describe('search', () => {
  it('finds articles by number, id and earlier citation', () => {
    const top = (q: string) => search(q)[0]?.article.id;
    expect(top('B.1')).toBe('roe-1');
    expect(top('Art. B.1')).toBe('roe-1');
    expect(top('article b1')).toBe('roe-1');
    expect(top('ISA-COM-001 Art. D.7')).toBe('orders-1');
    expect(top('roe-1')).toBe('roe-1');
    expect(top('Reg. 7.2')).toBe('reg-7.2');
    expect(top('Regulation 12')).toBe('reg-12');
    expect(top('Annex T.4')).toBe('quarantine-1');
    expect(top('Rules of Engagement §1')).toBe('roe-1');
    expect(top('Border Accords, Art. 4')).toBe('border-accords-4');
    expect(top('Code of Conduct §9')).toBe('asylum-1');
    expect(search('B.1')).toHaveLength(1);
  });
  it('finds articles by topic alias', () => {
    const ids = (q: string, n = 3) => search(q).slice(0, n).map((h) => h.article.id);
    expect(ids('pathogen')).toContain('health-1');
    expect(ids('quarantine')).toContain('quarantine-1');
    expect(ids('quarantine', 6)).toEqual(expect.arrayContaining(['quarantine-1', 'quarantine-2', 'health-1']));
    expect(ids('biological containment', 1)).toEqual(['health-1']);
    expect(ids('rules of engagement', 5).sort()).toEqual(['roe-1', 'roe-2', 'roe-3', 'roe-4', 'roe-5']);
    expect(ids('unlawful order', 1)).toEqual(['orders-1']);
    expect(ids('first contact', 1)).toEqual(['contact-1']);
    expect(ids('asylum', 1)).toEqual(['asylum-1']);
    expect(ids('warning shot', 1)).toEqual(['roe-5']);
    expect(ids('warning shots', 1)).toEqual(['roe-5']);
    expect(search('')).toEqual([]);
    expect(search('xyzzy plugh')).toEqual([]);
  });
});

describe('bridge commands open the handbook (and nothing else)', () => {
  it('recognises the handbook requests', () => {
    expect(handbookRequest('Computer, open the handbook')).toEqual({ kind: 'contents' });
    expect(handbookRequest('computer open handbook.')).toEqual({ kind: 'contents' });
    expect(handbookRequest("Open the Captain's Handbook")).toEqual({ kind: 'contents' });
    expect(handbookRequest('what are the regulations?')).toEqual({ kind: 'contents' });
    expect(handbookRequest('Computer, show me article B.1')).toEqual({ kind: 'article', id: 'roe-1' });
    expect(handbookRequest('show me Art. D.7')).toEqual({ kind: 'article', id: 'orders-1' });
    expect(handbookRequest('show me Reg. 7.2')).toEqual({ kind: 'article', id: 'reg-7.2' });
    expect(handbookRequest('show me roe-1')).toEqual({ kind: 'article', id: 'roe-1' });
    expect(handbookRequest('show me the regulation on first contact')).toEqual({ kind: 'article', id: 'contact-1' });
    expect(handbookRequest('what are the quarantine regulations')).toEqual({ kind: 'search', query: 'quarantine' });
    expect(handbookRequest('What are our rules of engagement?')).toEqual({ kind: 'search', query: 'rules of engagement' });
    expect(handbookRequest('what does the handbook say about asylum')).toEqual({ kind: 'article', id: 'asylum-1' });
    expect(handbookRequest('search the handbook for warning shots')?.kind).toBeTruthy();
  });
  it('leaves ordinary orders, questions and duty responses to the interpreter', () => {
    for (const t of ['fire phasers', 'hail the freighter', 'show me the kestrel', 'on screen', 'scan the cruiser', 'set course for tallis gate', 'Computer, begin the Kestrel Incident simulation', 'what training do I need?', 'how am I doing?', 'status report', 'refuse, the directive is unlawful under the accords', 'I refuse: it breaches treaty law', 'raise shields', 'fire a warning shot across her bow', 'tell the prefect the border accords forbid this', 'open a channel to the liner', 'show me article Z.9', 'computer, list simulations', 'red alert']) {
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

describe('spoiler safety', () => {
  const none = playedScenarios(null);
  it('after-played references and notes stay hidden until the Training Record shows the simulation was run', () => {
    const asy = article('asylum-1')!;
    expect(visibleTraining(asy, none, scenarioOf).map((t) => t.simulation)).toEqual([19]);
    expect(enforcementNoteVisible(asy, none, scenarioOf)).toBe(false);
    const played = playedScenarios({ evaluations: [{ scenarioId: 'kestrel-incident' }], archived: [] });
    expect(visibleTraining(asy, played, scenarioOf).map((t) => t.simulation)).toEqual([1, 19]);
    expect(enforcementNoteVisible(asy, played, scenarioOf)).toBe(true);
    const q2 = article('quarantine-2')!;
    expect(visibleTraining(q2, played, scenarioOf)).toEqual([]);
    expect(visibleTraining(q2, playedScenarios({ evaluations: [], archived: [{ scenarioId: 'tallis-quarantine' }] }), scenarioOf)).toHaveLength(1);
    // A note naming a simulation waits for that simulation, even without an after-played reference.
    expect(enforcementNoteVisible(article('health-1')!, none, scenarioOf)).toBe(false);
    expect(enforcementNoteVisible(article('health-1')!, playedScenarios({ evaluations: [{ scenarioId: 'tallis-quarantine' }], archived: [] }), scenarioOf)).toBe(true);
    expect(enforcementNoteVisible(article('cmd-1')!, none, scenarioOf)).toBe(true);
  });
  it('exactly the three after-played references from Draft 2 (unchanged in Draft 3)', () => {
    const after = ARTICLES.flatMap((a) => a.training.filter((t) => t.afterPlayed).map((t) => `${a.id}:${t.simulation}`)).sort();
    expect(after).toEqual(['asylum-1:1', 'border-accords-9:1', 'quarantine-2:2']);
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
  it('renders every article from the database, authoritative text apart from commentary', async () => {
    const { exportMarkdown } = await import('../../src/handbook/export');
    const md = exportMarkdown();
    for (const a of ARTICLES) {
      expect(md, a.id).toContain(`> ${a.text}`);
      expect(md, a.id).toContain(`Id \`${a.id}\``);
    }
    expect(md.match(/\*\*AUTHORITATIVE TEXT\*\*/g)).toHaveLength(42);
    expect(md.match(/\*\*COMMENTARY\*\*/g)).toHaveLength(42);
    expect(md).toContain(HANDBOOK.edition);
    expect(md).not.toMatch(/Appendix|\[EXISTING|\[NEW\]|Brad/);
  });
  it('is spoiler-safe by default; --all includes after-played references, marked', async () => {
    const { exportMarkdown } = await import('../../src/handbook/export');
    const safe = exportMarkdown();
    const all = exportMarkdown({ all: true });
    expect(safe).not.toContain("Protecting a person who has asked for the ISA's help.");
    expect(safe).not.toContain('Assessed in Quarantine at Tallis Gate');
    expect(all).toContain('Assessed in Quarantine at Tallis Gate');
    expect(all).toContain("Protecting a person who has asked for the ISA's help.");
    expect(all).toContain('shown in game only after this simulation has been run');
  });
});

describe('wording lock', () => {
  it('no article is renamed, renumbered or reworded without a new revision (tests/v080/fixtures/handbook-lock.json)', async () => {
    const { createHash } = await import('node:crypto');
    const lock = JSON.parse(readFileSync('tests/v080/fixtures/handbook-lock.json', 'utf8')) as Record<string, { number: string; revision: number; revisions: string[] }>;
    const now = Object.fromEntries(ARTICLES.map((a) => [a.id, { number: a.number, revision: a.revision, revisions: a.revisions.map((r) => `${r.rev}:${createHash('sha256').update(`${r.title}\n${r.text}`).digest('hex').slice(0, 16)}`) }]));
    // Ids are never removed; an approved new revision appends to the lock (earlier revisions stay identical).
    for (const [id, l] of Object.entries(lock)) {
      expect(now[id], id).toBeDefined();
      expect(now[id].revisions.slice(0, l.revisions.length), id).toEqual(l.revisions);
      if (now[id].revision === l.revision) expect(now[id].number, id).toBe(l.number);
    }
    expect(Object.keys(now).sort()).toEqual(Object.keys(lock).sort());
  });
});
