/**
 * Training Simulation 003 — setup, seed variation, determinism, hidden information,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import { quiet, ANSWERS } from '../../src/scenarios/quiet/setup';
import { QUIET_ENDINGS } from '../../src/scenarios/quiet/outcome';
import { sm } from '../../src/scenarios/quiet/agents';
import { LEAK, QS, logText, playQ, rightAnswer, decoyAnswer, seedWhere, startQ, waits } from './helpers';

const ALL = [...QUIET_ENDINGS.success, ...QUIET_ENDINGS.failure, ...QUIET_ENDINGS.backstop] as string[];

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = QS.create(42);
    expect(a).toEqual(QS.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('quiet-signal');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe('Teyma contact');
    expect(a.ships.cruiser.name).toBe('Cantor');
    expect(a.ships.kestrel.systems.weapons.health).toBe(0);
    expect(a.slots).toMatchObject({ kestrelLead: 'senders', cruiserLead: 'brenn', passenger: null });
    expect(a.characters.senders.ship).toBe('kestrel');
    expect(a.characters.brenn.ship).toBe('cruiser');
    for (const id of ['pulsar_timing', 'courier_crewed', 'ledger_identity', 'partial_decode', 'grammar_known', 'senders_intent', 'director_temperament', 'director_wrong']) expect(a.facts[id].known, id).toBe(false);
  });

  it('the intro plays and leaves the scenario waiting for orders', () => {
    const s = startQ(42);
    expect(s.intro).toBe(QS.intro.length);
    expect(s.ships.kestrel.detected && s.ships.cruiser.detected).toBe(true);
    expect(s.objectives.map((o) => o.id)).toEqual(['understand', 'answer', 'peaceful', 'rival']);
    expect(logText(s)).not.toMatch(LEAK);
  });

  it('every seeded choice varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => quiet(QS.create(i + 1)));
    for (const k of ['grammar', 'decoy', 'intent', 'director'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(3);
    expect(new Set(vs.map((v) => v.leanRight)).size).toBe(2);
    expect(new Set(vs.map((v) => v.directorRight)).size).toBe(2);
    expect(new Set(vs.map((v) => v.patience)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(vs.map((v) => v.directorTurn)).size).toBeGreaterThanOrEqual(5);
    expect(vs.every((v) => v.grammar !== v.decoy)).toBe(true);
  });

  it('is deterministic: same seed and orders, same log', () => {
    const cmds = ['Szabo, work on the code', 'scan the pulsar', ...waits(4), 'hail the directorate ship', 'who are you?', ...waits(4)];
    expect(logText(playQ(startQ(77), cmds))).toBe(logText(playQ(startQ(77), cmds)));
  });
});

describe('seed sweep: the same orders lead to different endings', () => {
  it('a careful plan, played on 60 seeds, reaches several distinct endings (success and failure)', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      let s = playQ(startQ(seed), ['Szabo, work on the code', 'scan the pulsar', 'use the main dish as a receiver', 'hail the directorate ship', 'will you hold your transmission?', ...waits(3)], false);
      if (!s.outcome) s = playQ(s, [`Szabo, send them ${rightAnswer(s, 0)}`, `Szabo, send them ${rightAnswer(s, 1)}`, 'wait', 'hail the senders', 'Greetings from the ISV Halcyon.', 'open the range to 80000 km from the pulsar', ...waits(14)], false);
      expect(checkInvariants(s), `seed ${seed}`).toEqual([]);
      const id = s.outcome?.id ?? 'none';
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(Object.keys(counts).length, JSON.stringify(counts)).toBeGreaterThanOrEqual(3);
    expect(Object.keys(counts).some((x) => (QUIET_ENDINGS.success as readonly string[]).includes(x)), JSON.stringify(counts)).toBe(true);
    expect(Object.keys(counts).some((x) => (QUIET_ENDINGS.failure as readonly string[]).includes(x)), JSON.stringify(counts)).toBe(true);
    expect(counts.none ?? 0).toBe(0);
  });

  it('doing nothing, played on 60 seeds, never succeeds and always ends', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const s = playQ(startQ(seed), waits(31), false);
      counts[s.outcome!.id] = (counts[s.outcome!.id] ?? 0) + 1;
    }
    expect(Object.keys(counts).length, JSON.stringify(counts)).toBeGreaterThanOrEqual(2);
    expect(Object.keys(counts).every((x) => (QUIET_ENDINGS.failure as readonly string[]).includes(x)), JSON.stringify(counts)).toBe(true);
  });
});

describe('officer expertise, hidden information and autonomy', () => {
  it('Szabo decodes only when tasked; the pulsar timing and the main dish speed her up', () => {
    const idle = playQ(startQ(11), waits(4));
    expect(idle.counters.decode).toBe(0);
    const plain = playQ(startQ(11), ['Szabo, work on the code', ...waits(3)]);
    const helped = playQ(startQ(11), ['Szabo, work on the code', 'scan the pulsar', 'use the main dish as a receiver', ...waits(1)]);
    expect(plain.counters.decode).toBeGreaterThan(0);
    expect(helped.counters.decode).toBeGreaterThan(plain.counters.decode);
    expect(helped.facts.pulsar_timing.known).toBe(true);
    expect(helped.flags.dishRigged).toBe(true);
  });

  it('a partial decode offers two readings; only the full decode is certain', () => {
    const s = playQ(startQ(12), ['Szabo, work on the code', ...waits(3)]);
    expect(s.facts.partial_decode.known).toBe(true);
    expect(s.facts.grammar_known.known).toBe(false);
    const t = logText(s);
    expect(t).toContain(String(rightAnswer(s, 0)));
    expect(t).toContain(String(decoyAnswer(s, 0)));
  });

  it('echoing the pattern back buys time, once', () => {
    let s = startQ(13);
    const before = sm(s).deadline;
    s = playQ(s, ['hail the senders', 'echo the pattern back to them']);
    expect(sm(s).deadline).toBe(before + 3);
    s = playQ(s, ['echo the pattern back to them']);
    expect(sm(s).deadline).toBe(before + 3);
  });

  it('the Director\'s temperament and her mistake are hidden until earned', () => {
    const seed = seedWhere((v) => !v.directorRight);
    let s = playQ(startQ(seed), ['hail the directorate ship']);
    expect(s.facts.director_temperament.known).toBe(false);
    expect(s.facts.director_wrong.known).toBe(false);
    s = playQ(s, ['who are you?', 'what are you doing here?', 'what do you make of the signal?', 'close the channel', 'Szabo, work on the code', 'scan the pulsar', 'use the main dish as a receiver', ...waits(3)]);
    expect(s.facts.director_temperament.known).toBe(true);
    expect(s.facts.grammar_known.known).toBe(true);
    expect(s.facts.director_wrong.known).toBe(true);
  });

  it('a scholarly Director holds her transmission when asked; a hardliner does not', () => {
    const sch = playQ(startQ(seedWhere((v) => v.director === 'scholar')), ['hail the directorate ship', 'will you hold your transmission?']);
    expect(sch.characters.brenn.memory.holding).toBe(1);
    const hard = playQ(startQ(seedWhere((v) => v.director === 'hardliner')), ['hail the directorate ship', 'will you hold your transmission?']);
    expect(hard.characters.brenn.memory.holding ?? 0).toBe(0);
  });

  it('a wrong rival answer costs the contact a strike even if the Halcyon did nothing wrong', () => {
    const seed = seedWhere((v) => !v.directorRight && v.director === 'hardliner' && v.directorTurn <= v.patience);
    const s = playQ(startQ(seed), waits(quiet(QS.create(seed)).directorTurn + 1));
    expect(sm(s).strikes ?? 0).toBeGreaterThan(0);
  });

  it('crew refusal: Tactical will not target the unarmed courier', () => {
    const s = playQ(startQ(3), ['lock weapons on the courier', 'fire on the courier']);
    expect(s.flags.shotsFired).toBeFalsy();
    expect(s.flags.lockedOnSenders).toBeFalsy();
    expect(s.refusals?.length ?? 0).toBeGreaterThan(0);
  });

  it('unconventional: putting the Halcyon in the Ledger\'s beam blocks a wrong rival answer without a shot', () => {
    const seed = seedWhere((v) => v.director === 'hardliner' && !v.directorRight && v.directorTurn >= 9);
    const s = playQ(startQ(seed), ['put us between the cantor and the senders', ...waits(quiet(QS.create(seed)).directorTurn + 1)]);
    expect(s.flags.beamBlocked, logText(s).slice(-1500)).toBe(true);
    expect(s.flags.shotsFired).toBeFalsy();
    expect(sm(s).strikes ?? 0).toBe(0);
  });

  it('answers are parsed from digits, words and named shapes', () => {
    for (const [g, [a]] of Object.entries(ANSWERS)) {
      const seed = seedWhere((v) => v.grammar === g);
      const s = playQ(startQ(seed), ['hail the senders', `${a}`]);
      expect(question(s), g).toBe(1);
    }
    const seed = seedWhere((v) => v.grammar === 'geometry');
    expect(question(playQ(startQ(seed), ['hail the senders', 'six']))).toBe(1);
    expect(question(playQ(startQ(seed), ['hail the senders', 'a hexagon']))).toBe(1);
  });
});

import { question } from '../../src/scenarios/quiet/agents';

describe('fuzz', () => {
  const POOL = [
    'wait', 'scan the pulsar', 'scan the cantor', 'scan the area', 'hail the senders', 'hail the directorate ship', 'close the channel', 'status', 'options',
    'Szabo, work on the code', 'Szabo, how close are you?', 'Szabo, what do you think?', 'use the main dish as a receiver', 'echo the pattern back',
    '13', '6', '4', '31', '12', 'seven', 'Szabo, send them 13', 'Szabo, send them 6', 'Szabo, send them 4', 'hello', 'goodbye', 'greetings from the ISV Halcyon',
    'will you hold your transmission?', 'we should work on the decode together', 'who are you?', 'warn them about the glitch', 'we will fire on you',
    'put us between the cantor and the senders', 'open the range to 80000 km from the pulsar', 'take us to 20,000 km of the courier', 'raise shields', 'red alert',
    'lock weapons on the cantor', 'lock weapons on the courier', 'charge the jump drive', 'full stop', 'why?', 'gibberish flarp',
  ];
  it('random orders on random seeds keep every invariant and never leak another scenario\'s names', () => {
    const rng = createRng(2026);
    const endings = new Set<string>();
    for (let game = 0; game < Number(process.env.FUZZ_GAMES ?? 40); game++) {
      let s = startQ(rng.int(1, 100000));
      for (let i = 0; i < 45 && !s.outcome; i++) {
        const c = POOL[rng.int(0, POOL.length - 1)];
        s = submit(QS, s, c);
        expect(checkInvariants(s), `game ${game} "${c}"`).toEqual([]);
      }
      expect(logText(s)).not.toMatch(LEAK);
      if (s.outcome) {
        endings.add(s.outcome.id);
        expect(ALL).toContain(s.outcome.id);
      }
    }
    expect(endings.size).toBeGreaterThanOrEqual(3);
  });
});
