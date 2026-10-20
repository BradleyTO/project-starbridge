/**
 * Training Simulation 002 — setup, seed variation, determinism, hidden information,
 * unconventional solutions, crew refusals, fuzzing with state invariants, and template hygiene.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import { tallis } from '../../src/scenarios/tallis/setup';
import { TALLIS_ENDINGS } from '../../src/scenarios/tallis/outcome';
import { LEAK, TS, logText, playT, seedWhere, startT, waits } from './helpers';

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = TS.create(42);
    const b = TS.create(42);
    expect(a).toEqual(b);
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('tallis-quarantine');
    expect(a.ships.kestrel.name).toBe('Mercy of Ilun');
    expect(a.ships.cruiser.name).toBe('Thornwake');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.halcyon.faction).toBe('concord');
    expect(a.slots).toMatchObject({ kestrelLead: 'sabeth', cruiserLead: 'marr', passenger: null, kestrelRepair: 'lifeSupport' });
    expect(a.characters.sabeth.ship).toBe('kestrel');
    expect(a.characters.marr.ship).toBe('cruiser');
    expect(a.characters.passenger).toBeUndefined();
    // Hidden information starts hidden.
    for (const id of ['cause_known', 'first_cases', 'marr_kin', 'colony_stock', 'liner_status']) expect(a.facts[id].known, id).toBe(false);
  });

  it('the intro plays and leaves the scenario waiting for orders', () => {
    const s = startT(42);
    expect(s.intro).toBe(TS.intro.length);
    expect(s.ships.kestrel.detected && s.ships.cruiser.detected).toBe(true);
    expect(s.alert).toBe('yellow');
    expect(s.objectives.map((o) => o.id)).toEqual(['diagnose', 'pilgrims', 'line', 'contain']);
    expect(logText(s)).not.toMatch(LEAK);
  });

  it('every seeded choice varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => tallis(TS.create(i + 1)));
    expect(new Set(vs.map((v) => v.cause)).size).toBe(3);
    expect(new Set(vs.map((v) => v.warden)).size).toBe(3);
    expect(new Set(vs.map((v) => v.kin)).size).toBe(2);
    expect(new Set(vs.map((v) => v.runTurn)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(Array.from({ length: 50 }, (_, i) => TS.create(i + 1).ships.kestrel.souls)).size).toBeGreaterThan(10);
  });

  it('is deterministic: same seed and orders, same log', () => {
    const cmds = ['take us to 3,000 km of the liner', 'wait', 'wait', 'scan the liner', 'hail the picket', 'tell her our scans show it is not contagious', ...waits(5)];
    expect(logText(playT(startT(77), cmds))).toBe(logText(playT(startT(77), cmds)));
  });
});

describe('seed sweep: the same orders lead to different endings', () => {
  const PLAN = ['take us to 3,000 km of the liner', 'wait', 'wait', 'scan the liner', 'hail the picket', 'tell her our scans show it is not contagious', 'close the channel', 'set up an isolation ward', 'lower shields and send a medical team', ...waits(25)];
  it('a careful plan, played on 60 seeds, reaches several distinct endings (success and failure)', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const s = playT(startT(seed), PLAN, false);
      expect(checkInvariants(s), `seed ${seed}`).toEqual([]);
      const id = s.outcome?.id ?? 'none';
      counts[id] = (counts[id] ?? 0) + 1;
    }
    const ids = Object.keys(counts);
    expect(ids.length, JSON.stringify(counts)).toBeGreaterThanOrEqual(3);
    expect(ids.some((x) => (TALLIS_ENDINGS.success as readonly string[]).includes(x))).toBe(true);
    expect(counts.none ?? 0).toBe(0);
  });

  it('doing nothing, played on 60 seeds, ends differently depending on the Warden', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      const s = playT(startT(seed), waits(31), false);
      counts[s.outcome!.id] = (counts[s.outcome!.id] ?? 0) + 1;
    }
    expect(Object.keys(counts).length, JSON.stringify(counts)).toBeGreaterThanOrEqual(2);
    expect(Object.keys(counts).every((x) => (TALLIS_ENDINGS.failure as readonly string[]).includes(x)), JSON.stringify(counts)).toBe(true);
  });
});

describe('characters, hidden information and autonomy', () => {
  it('Sabeth reveals how it started only when asked; the Warden\'s brother only to the right question', () => {
    const seed = seedWhere((v) => v.kin);
    let s = playT(startT(seed), ['hail the liner']);
    expect(s.facts.first_cases.known).toBe(false);
    s = playT(s, ['how did the sickness start?']);
    expect(s.facts.first_cases.known).toBe(true);
    expect(s.facts.marr_kin.known).toBe(false);
    s = playT(s, ['who is aboard?']);
    expect(s.facts.marr_kin.known).toBe(true);
  });

  it('an argument is only evidence if the crew has found it', () => {
    const seed = seedWhere((v) => v.cause === 'panic' && v.warden === 'humane');
    const s = playT(startT(seed), ['hail the picket', 'it is not contagious, lift the quarantine']);
    expect(s.characters.marr.memory.lifted).toBe(0);
    expect(logText(s)).toMatch(/Wishing is not evidence/);
  });

  it('honesty: telling a Warden the fever is harmless does not work once the crew knows it is contagious', () => {
    const seed = seedWhere((v) => v.cause === 'fever' && v.warden === 'humane');
    const s = playT(startT(seed), ['take us to 3,000 km of the liner', 'wait', 'wait', 'scan the liner', 'hail the picket', 'our scans show it is not contagious']);
    expect(s.characters.marr.memory.lifted).toBe(0);
  });

  it('Sabeth waits when given a reason, and stops running when asked with one', () => {
    const seed = seedWhere((v) => v.cause === 'toxin' && v.runTurn <= 8);
    let s = playT(startT(seed), ['hail the liner', 'please hold your position']);
    expect(logText(s)).toMatch(/Give me a reason to wait/);
    s = playT(s, ['close the channel', 'take us to 3,000 km of the liner', 'wait', 'wait', 'scan the liner', 'hail the liner', 'Captain Sabeth, we know what is making them sick and help is coming, please hold on']);
    expect(s.flags.sabethHolding).toBe(true);
    expect(s.characters.sabeth.memory.runAt).toBeGreaterThan(s.turn);
  });

  it('crew refusal: Tactical will not fire on the pilgrim liner', () => {
    const s = playT(startT(3), ['lock weapons on the liner', 'fire on the liner']);
    expect(s.flags.shotsFired).toBeFalsy();
    expect(s.refusals?.length ?? 0).toBeGreaterThan(0);
    expect(logText(s)).toMatch(/Mercy of Ilun/);
  });

  it('interposing: a non-strict Warden will not fire through an Agency ship', () => {
    const seed = seedWhere((v) => v.warden === 'humane' && v.cause !== 'fever');
    const s = playT(startT(seed), ['put us between the liner and the picket', ...waits(28)]);
    expect(logText(s)).toMatch(/will not fire through you/);
    expect(s.ships.kestrel.destroyed).toBe(false);
  });

  it('unconventional: screening the transporter lets the Halcyon take fever patients aboard safely', () => {
    const seed = seedWhere((v) => v.cause === 'fever');
    const s = playT(startT(seed), ['take us to 3,000 km of the liner', 'wait', 'wait', 'set the transporter biofilters to screen for the virus', 'lower shields and evacuate the pilgrims', 'evacuate the pilgrims', ...waits(4)]);
    expect(s.flags.transporterFilter).toBe(true);
    expect(s.flags.exposed).toBeFalsy();
    expect(s.counters.rescued).toBeGreaterThan(0);
  });
});

describe('fuzz', () => {
  const POOL = [
    'wait', 'scan the liner', 'scan the picket', 'hail the liner', 'hail the picket', 'close the channel', 'status', 'options',
    'take us to 3,000 km of the liner', 'put us between the liner and the picket', 'raise shields', 'lower shields', 'red alert',
    'send a medical team', 'evacuate the pilgrims', 'set up an isolation ward', 'fix their water recycler', 'lock a tractor beam on the liner',
    'release the tractor beam', 'charge the jump drive', 'how did it start?', 'who is aboard?', 'our scans show it is not contagious',
    'please hold your fire', 'send us your antiviral stockpile', 'your brother is aboard', 'hold your position', 'we will fire on you',
    'extend our shields around the liner', 'use the tractor beam as a shield', 'divert power to sensors', 'why?', 'full stop',
    'lock weapons on the picket', 'fire a warning shot at the picket', 'we can take you to an Agency hospital', 'gibberish flarp',
  ];
  it('random orders on random seeds keep every invariant and never leak another scenario\'s names', () => {
    const rng = createRng(2026);
    const endings = new Set<string>();
    for (let game = 0; game < 40; game++) {
      let s = startT(rng.int(1, 100000));
      for (let i = 0; i < 45 && !s.outcome; i++) {
        const c = POOL[rng.int(0, POOL.length - 1)];
        s = submit(TS, s, c);
        expect(checkInvariants(s), `game ${game} "${c}"`).toEqual([]);
      }
      expect(logText(s)).not.toMatch(LEAK);
      if (s.outcome) endings.add(s.outcome.id);
      for (const id of endings) expect([...TALLIS_ENDINGS.success, ...TALLIS_ENDINGS.failure]).toContain(id);
    }
    expect(endings.size).toBeGreaterThanOrEqual(3);
  });
});
