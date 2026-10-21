/** v0.7 after-action evaluation: objectives, decisions, safety, regulations, judgment. No score. */
import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/evaluation/evaluate';
import type { Evaluation } from '../../src/evaluation/types';
import { KESTREL_ENDINGS_FOR_TEST } from './endings';
import { K, KESTREL, TALLIS, TS } from './fixtures';
import { TALLIS_ENDINGS } from '../../src/scenarios/tallis/outcome';
import type { WorldState } from '../../src/engine/types';
import { setTraceEnabled } from '../../src/engine/trace';
import { submit } from '../../src/engine/game';
import { start } from '../helpers';

const opts = { id: 'E', source: 'simulation' as const, refId: 'R', atIso: '2026-10-21T12:00:00.000Z' };
const evK = (s: WorldState) => evaluate(s, K, opts);
const evT = (s: WorldState) => evaluate(s, TS, opts);
const texts = (e: Evaluation) => JSON.stringify(e);

describe('descriptors cover every ending without changing them', () => {
  it('Kestrel: every ending has a tier; ending list and ids are unchanged', () => {
    expect(Object.keys(K.evaluation!.endings).sort()).toEqual([...KESTREL_ENDINGS_FOR_TEST].sort());
  });
  it('Tallis: every listed ending has a tier', () => {
    expect(Object.keys(TS.evaluation!.endings).sort()).toEqual([...TALLIS_ENDINGS.success, ...TALLIS_ENDINGS.failure].sort());
  });
  it('every objective id is classified primary or secondary', () => {
    expect(Object.keys(K.evaluation!.objectives).sort()).toEqual(['assess', 'escalation', 'fate', 'intentions', 'protect', 'secret']);
    expect(Object.keys(TS.evaluation!.objectives).sort()).toEqual(['contain', 'diagnose', 'line', 'pilgrims']);
  });
});

describe('an evaluation records objectives and decisions', () => {
  it('lists every objective with achieved / missed / failed and its priority', () => {
    const s = KESTREL.corridor();
    const e = evK(s);
    expect(e.objectives.map((o) => o.id).sort()).toEqual(s.objectives.map((o) => o.id).sort());
    expect(e.objectives.find((o) => o.id === 'protect')).toMatchObject({ priority: 'primary', result: 'achieved' });
    expect(e.objectives.every((o) => ['achieved', 'missed', 'failed'].includes(o.result))).toBe(true);
  });
  it('lists key decisions with turns and their effect (not every command)', () => {
    const e = evT(TALLIS.teamFirst());
    expect(e.decisions.length).toBeGreaterThan(0);
    const team = e.decisions.find((d) => /medical team/.test(d.order));
    expect(team?.judgment).toBe('reckless');
    expect(e.decisions.every((d) => d.effect.length > 0 && Number.isInteger(d.turn))).toBe(true);
    expect(e.decisions.some((d) => /^wait$/.test(d.order) && !d.judgment)).toBe(false);
  });
  it('covers crew safety, civilian safety, regulations, strengths, improvements and recommendations', () => {
    const e = evK(KESTREL.pyrrhic());
    expect(e.crewSafety.length).toBeGreaterThan(0);
    expect(e.civilianSafety.some((f) => /Ashen Covenant was destroyed/.test(f.text))).toBe(true);
    expect(e.regulations.some((r) => r.id === 'roe-2' && /^Breached/.test(r.applied))).toBe(true);
    expect(e.strengths.length).toBeGreaterThan(0);
    expect(e.improve.some((f) => /opened fire first/.test(f.text))).toBe(true);
    expect(e.recommended.some((r) => /Tactical judgment/.test(r))).toBe(true);
  });
});

describe('different strategies earn appropriate evaluations', () => {
  it('negotiation vs force (Kestrel): diplomacy credited for the corridor, tactical concern and escalation for the fight', () => {
    const talk = evK(KESTREL.corridor());
    const fight = evK(KESTREL.pyrrhic());
    expect(talk.conduct).toBe('exemplary');
    expect(fight.conduct).toBe('reckless');
    expect(talk.competencies.some((c) => c.id === 'diplomacy' && c.sign === 'strength')).toBe(true);
    expect(fight.competencies.some((c) => c.id === 'tactical' && c.sign === 'concern')).toBe(true);
    expect(fight.outcome.tier).toBe('partial');
  });
  it('Tallis: evidence (Line Lifted), tow (Agency Care) and the colony stockpile are credited differently', () => {
    const lifted = evT(TALLIS.lifted());
    const tow = evT(TALLIS.agencyCare());
    const stock = evT(TALLIS.stockpile());
    expect(lifted.outcome.id).toBe('quarantine-lifted');
    expect(tow.outcome.id).toBe('agency-care');
    expect(stock.outcome.id).toBe('cure-delivered');
    expect(lifted.competencies.filter((c) => c.sign === 'strength').map((c) => c.id)).toEqual(expect.arrayContaining(['scientific', 'communications', 'diplomacy']));
    expect(tow.competencies.filter((c) => c.sign === 'strength').map((c) => c.id)).toEqual(expect.arrayContaining(['resources', 'emergency']));
    expect(stock.strengths.some((f) => /antiviral stockpile/.test(f.text))).toBe(true);
  });
  it('the same ending by two routes (Kestrel Negotiated Release: evidence vs a personal appeal) is evaluated on what was done', () => {
    const a = evK(KESTREL.negotiatedEvidence());
    const b = evK(KESTREL.negotiatedAppeal());
    expect(a.outcome.id).toBe('negotiated-release');
    expect(b.outcome.id).toBe('negotiated-release');
    expect(a.decisions.map((d) => d.order)).not.toEqual(b.decisions.map((d) => d.order));
  });
});

describe('reckless and responsible success are distinguishable', () => {
  it('Tallis Cure: an isolation ward first vs a team sent unprotected (both reach cure-delivered)', () => {
    const careful = evT(TALLIS.wardFirst());
    const lucky = evT(TALLIS.teamFirst());
    expect(careful.outcome.id).toBe('cure-delivered');
    expect(lucky.outcome.id).toBe('cure-delivered');
    expect(careful.conduct).not.toBe(lucky.conduct);
    expect(lucky.conduct).toBe('mixed');
    expect(lucky.crewSafety[0].text).toMatch(/unprotected/);
    expect(careful.crewSafety.some((f) => /isolation ward/.test(f.text))).toBe(true);
    expect(lucky.improve.some((f) => /unprotected/.test(f.text))).toBe(true);
    expect(careful.improve.some((f) => /unprotected/.test(f.text))).toBe(false);
    expect(lucky.regulations.find((r) => r.id === 'care-2')?.applied).toMatch(/^Breached/);
    expect(careful.regulations.find((r) => r.id === 'care-2')?.applied).toMatch(/^Upheld/);
  });
  it('a bought peace (handing over the fugitive) is not graded like a negotiated one', () => {
    const bought = evK(KESTREL.handover());
    expect(bought.outcome.tier).toBe('partial');
    expect(bought.regulations.find((r) => r.id === 'asylum-1')?.applied).toMatch(/^Breached/);
    expect(evK(KESTREL.negotiatedEvidence()).regulations.find((r) => r.id === 'asylum-1')?.applied).toMatch(/^Upheld/);
  });
});

describe('justified failures are recognised', () => {
  it('holding fire on the lawful colony picket while it fires on the liner: a failure, recorded as principled', () => {
    const s = TALLIS.heldFire();
    const e = evT(s);
    expect(s.outcome?.id).toBe('liner-destroyed');
    expect(e.outcome.tier).toBe('failure');
    expect(e.conduct).toBe('principled');
    expect(e.principled).toMatch(/Held fire on the colony picket/);
    expect(e.competencies.some((c) => c.id === 'ethics' && c.sign === 'strength')).toBe(true);
  });
  it('doing nothing at all is not principled, and ordering fire on the civilian liner is a concern even though Tactical refused', () => {
    expect(evT(TALLIS.doNothing()).conduct).toBe('insufficient');
    const e = evT(TALLIS.orderedFireOnLiner());
    expect(e.principled).toBeUndefined();
    expect(e.improve.some((f) => /non-combatants/.test(f.text))).toBe(true);
    expect(e.regulations.find((r) => r.id === 'roe-1')?.applied).toMatch(/^Breached/);
  });
});

describe('no score, deterministic, inert', () => {
  it('contains no percentage and no numeric grade', () => {
    for (const run of [...Object.values(KESTREL), ...Object.values(TALLIS)]) {
      const s = run();
      const e = evaluate(s, s.scenarioId === 'tallis' ? TS : K, opts);
      const shown = [e.conduct, e.outcome.note, ...e.strengths, ...e.improve, ...e.crewSafety, ...e.civilianSafety].map((x) => (typeof x === 'string' ? x : x.text)).join(' ');
      expect(shown).not.toMatch(/%|\bscore\b|\/\s?10\b|\bgrade [A-F]\b/i);
      expect(texts(e)).not.toMatch(/undefined|NaN|\[object/);
    }
  });
  it('same seed and orders give the identical evaluation', () => {
    expect(evT(TALLIS.teamFirst())).toEqual(evT(TALLIS.teamFirst()));
    expect(evK(KESTREL.corridor())).toEqual(evK(KESTREL.corridor()));
  });
  it('the trace changes nothing in play: with it off, every scripted run ends in an identical state (minus the trace)', () => {
    const strip = (s: WorldState) => {
      const { trace: _t, ...rest } = s;
      return rest;
    };
    for (const run of [...Object.values(KESTREL), ...Object.values(TALLIS)]) {
      const withTrace = run();
      setTraceEnabled(false);
      try {
        const without = run();
        expect(without.trace).toBeUndefined();
        expect(strip(withTrace)).toEqual(strip(without));
      } finally {
        setTraceEnabled(true);
      }
    }
  });
  it('the idle bridge carries no trace; an unfinished run cannot be evaluated', () => {
    expect(() => evK(start(3))).toThrow(/not ended/);
    expect(submit(K, start(3), 'scan the kestrel').trace?.orders.length).toBe(1);
  });
});

describe('fuzz: random games evaluate cleanly', () => {
  const ORDERS = ['scan the kestrel', 'hail the cruiser', 'approach the kestrel', 'evacuate the crew', 'lower shields', 'raise shields', 'lock on the cruiser', 'fire', 'wait', 'jump', 'charge the jump drive', 'scan the liner', 'hail the picket', 'send a medical team', 'set up an isolation ward', 'lock a tractor beam on the liner', 'tell her our scans show it is not contagious', 'take us to 3,000 km of the liner'];
  it('40 random games per scenario: every section present, no template leaks', () => {
    for (const mod of [K, TS]) {
      for (let g = 0; g < 40; g++) {
        let s = mod.create(1000 + g);
        let x = (g * 7919 + 13) % 997;
        for (let i = 0; i < 40 && !s.outcome; i++) {
          x = (x * 31 + 17) % 9973;
          s = submit(mod, s, ORDERS[x % ORDERS.length]);
        }
        for (let i = 0; i < 40 && !s.outcome; i++) s = submit(mod, s, 'wait');
        if (!s.outcome) continue;
        const e = evaluate(s, mod, opts);
        expect(e.objectives.length).toBeGreaterThan(0);
        expect(e.crewSafety.length && e.civilianSafety.length && e.strengths.length && e.improve.length).toBeTruthy();
        expect(['success', 'partial', 'failure']).toContain(e.outcome.tier);
        expect(texts(e)).not.toMatch(/undefined|NaN|\[object|\{\w+\}/);
      }
    }
  });
});

describe('safety findings never contradict the judgment', () => {
  it('abandoning the Kestrel is not reported as "no civilian lives were lost" on its own', () => {
    const e = evK(KESTREL.abandoned());
    expect(e.outcome.id).toBe('abandoned');
    const civ = e.civilianSafety.map((f) => f.text);
    expect(civ).toContain('Withdrew without attempting a rescue.');
    expect(civ).not.toContain('No civilian or third-party lives were lost.');
    expect(civ.join(' ')).toMatch(/left without help/);
  });
  it('decision effects read cleanly (no ".;" joins)', () => {
    for (const s of [KESTREL.abandoned(), KESTREL.pyrrhic(), TALLIS.incident()]) {
      const e = s.scenarioId === K.id ? evK(s) : evT(s);
      for (const d of e.decisions) expect(d.effect).not.toMatch(/\.;|;;/);
    }
  });
});

describe('every training simulation ships evaluation data (SCENARIO_GUIDE §6b)', () => {
  it('each catalogue simulation has a descriptor whose regulations exist and whose markers are well formed', async () => {
    const { SIMULATIONS } = await import('../../src/scenarios/catalogue');
    const { TRAINING_SCENARIOS } = await import('../../src/scenarios/registry');
    const { REGULATIONS } = await import('../../src/evaluation/regulations');
    const { COMPETENCIES } = await import('../../src/evaluation/competencies');
    const regIds = new Set(REGULATIONS.map((r) => r.id));
    const compIds = new Set<string>(COMPETENCIES.map((c) => c.id));
    for (const sim of SIMULATIONS) {
      const mod = TRAINING_SCENARIOS[sim.scenarioId];
      const d = mod?.evaluation;
      expect(d, `${sim.trainingId} needs an evaluation descriptor`).toBeTruthy();
      expect(Object.keys(d!.endings).length, sim.trainingId).toBeGreaterThan(1);
      expect(Object.values(d!.endings).some((e) => e.tier === 'success'), sim.trainingId).toBe(true);
      for (const r of d!.regulations) expect(regIds.has(r), `${sim.trainingId}: ${r}`).toBe(true);
      for (const c of d!.competencies) expect(compIds.has(c), `${sim.trainingId}: ${c}`).toBe(true);
      for (const m of d!.markers) {
        expect(m.text, m.id).toMatch(/^[A-Z].*[.!]$/);
        if (m.regulation) expect(regIds.has(m.regulation), `${sim.trainingId}: ${m.id}`).toBe(true);
        expect(m.text, m.id).not.toMatch(/\d\s*%/);
      }
    }
  });
});
