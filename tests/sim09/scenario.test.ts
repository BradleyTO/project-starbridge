/**
 * Training Simulation 009 — The Long Picket: setup, seed variation, hidden information, NPC goals,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import type { WorldState } from '../../src/engine/types';
import { picket, claimedDeadline } from '../../src/scenarios/picket/setup';
import { PICKET_ENDINGS } from '../../src/scenarios/picket/outcome';
import {
  COURTESY_LINE, ESCORT_LINE, HEAR, LEAK, LISTEN, PICKET_SIM, READ_HIM, TOKEN, TRUTH_LINE,
  careful, logText, playP, seedWhere, startP, study, toPicket, untilEnd, waits,
} from './helpers';

const ALL = [...PICKET_ENDINGS.success, ...PICKET_ENDINGS.partial, ...PICKET_ENDINGS.failure] as string[];
const SUCCESS = PICKET_ENDINGS.success as readonly string[];

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = PICKET_SIM.create(42);
    expect(a).toEqual(PICKET_SIM.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('long-picket');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.cruiser.name).toBe('Iron Psalm');
    expect(a.ships.cruiser.faction).toBe('directorate');
    expect(a.ships.kestrel.name).toBe('Wrenmoor');
    expect(a.characters.roake.name).toBe('Commander Lucan Roake');
    expect(a.characters.dahl.name).toBe('Commander Ysara Dahl');
    expect(a.characters.dahl.status).toBe('stasis');
    expect(a.characters.marchbank.name).toBe('Reeve Odile Marchbank');
  });

  it('the intro plays, names the picket, and leaves five objectives with the exercise objective labelled', () => {
    const s = startP(1);
    expect(s.outcome).toBeNull();
    expect(s.objectives.map((o) => o.id).sort()).toEqual(['claim', 'deliver', 'line', 'ruse', 'word']);
    expect(s.objectives.find((o) => o.id === 'line')?.text).toMatch(/^Exercise objective:/);
    expect(logText(s)).toMatch(/Iron Psalm/);
    expect(logText(s)).toMatch(/Lucan Roake/);
    expect(logText(s)).not.toMatch(LEAK);
  });

  it('seeds vary orders, temperament, intel, history, the Reeve, the deadline, the relief and the sweep', () => {
    const vs = Array.from({ length: 80 }, (_, i) => picket(PICKET_SIM.create(i + 1)));
    for (const k of ['orders', 'temperament', 'intel', 'history', 'reeve'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBeGreaterThan(1);
    expect(new Set(vs.map((v) => v.deadline)).size).toBeGreaterThan(3);
    expect(new Set(vs.map((v) => v.reliefAt)).size).toBeGreaterThan(3);
    for (const v of vs) {
      expect(v.deadline).toBeGreaterThanOrEqual(16);
      expect(v.deadline).toBeLessThanOrEqual(22);
      expect(v.sweepAt).toBeGreaterThanOrEqual(5);
      expect(v.sweepAt).toBeLessThanOrEqual(8);
    }
  });

  it('a seed with a relief too late for a waiting deal never leaves a rival as the only way through', () => {
    for (let i = 1; i <= 300; i++) {
      const v = picket(PICKET_SIM.create(i));
      if (v.orders === 'delay' && v.reliefAt >= v.deadline && v.temperament !== 'weary') expect(v.history, `seed ${i}`).not.toBe('rivals');
    }
  });
});

describe('hidden information and officer expertise', () => {
  it("Marrow's read depends on the seed's temperament and history, and is marked", () => {
    const proud = seedWhere((v) => v.temperament === 'proud' && v.history === 'rivals');
    const s = playP(startP(proud), [...HEAR, READ_HIM]);
    expect(s.flags.readFirst).toBe(true);
    expect(logText(s)).toMatch(/He is proud/);
    expect(logText(s)).toMatch(/never liked me/);
  });

  it("Szabo's intercept takes time and then gives his real orders", () => {
    const seed = seedWhere((v) => v.orders === 'delay');
    let s = playP(startP(seed), [LISTEN]);
    expect(s.flags.intercepted).toBe(true);
    expect(logText(s)).toMatch(/Listening to his traffic/);
    s = playP(s, waits(2));
    expect(logText(s)).toMatch(/He is to hold us until his relief arrives/);
  });

  it("the Chief's telemetry shows the real deadline, and exposes a frightened Reeve's short count", () => {
    const seed = seedWhere((v) => v.reeve === 'desperate');
    let s = playP(startP(seed), ['hail Wrenmoor', 'How long do you have?', 'close the channel']);
    const v = picket(s);
    expect(claimedDeadline(v)).toBe(v.deadline - 5);
    s = playP(s, ['Chief, read Wrenmoor’s reactor telemetry']);
    expect(s.flags.telemetryRead).toBe(true);
    expect(logText(s)).toMatch(/five minutes more than/);
    expect(logText(s)).toMatch(/Nobody dies of it/);
    s = playP(s, ['hail Wrenmoor', 'How long do you really have?', 'close the channel']);
    expect(s.flags.reeveAdmitted).toBe(true);
  });

  it("Varga's scan shows the picket sweeping the Halcyon's wake; the sweep finishes on its own clock", () => {
    const seed = seedWhere((v) => v.sweepAt >= 6);
    let s = playP(startP(seed), ['Varga, scan the picket']);
    expect(logText(s)).toMatch(/sweeping our wake/);
    s = playP(s, waits(picket(s).sweepAt + 1));
    expect(s.flags.sweepDone).toBe(true);
  });

  it('an escort bluff after the sweep is called', () => {
    const seed = seedWhere((v) => v.temperament === 'proud' && v.intel === 'nothing' && v.sweepAt <= 6);
    let s = playP(startP(seed), waits(8));
    expect(s.flags.sweepDone).toBe(true);
    s = playP(s, toPicket(ESCORT_LINE));
    expect(s.flags.bluffCalled).toBe(true);
    expect(s.outcome).toBeNull();
  });

  it('a picket who already knows the Halcyon is alone calls an escort bluff at once', () => {
    const seed = seedWhere((v) => v.intel === 'escort');
    const s = playP(startP(seed), toPicket(ESCORT_LINE));
    expect(s.flags.bluffCalled).toBe(true);
  });

  it('a careful commander shrugs off a bare escort claim, but believes it when Szabo has staged traffic for him', () => {
    const seed = seedWhere((v) => v.temperament === 'careful' && v.intel === 'nothing' && v.sweepAt >= 7);
    const a = playP(startP(seed), toPicket(ESCORT_LINE));
    expect(a.flags.bluffShrugged).toBe(true);
    expect(a.outcome).toBeNull();
    const b = playP(startP(seed), ['Szabo, broadcast fake traffic from our escort squadron', ...toPicket(ESCORT_LINE)]);
    expect(b.flags.staged).toBe(true);
    expect(b.outcome?.id).toBe('bluffed-pass');
  });
});

describe('NPC goals', () => {
  it('Roake keeps a hold-for-relief bargain, then lets the Halcyon pass', () => {
    const seed = seedWhere((v) => v.reliefAt < v.deadline - 4);
    let s = playP(startP(seed), toPicket('We will hold here until your relief arrives.'));
    expect(s.flags.dealHold).toBe(true);
    s = untilEnd(s);
    expect(s.outcome?.id).toBe('face-saved');
  });

  it('Roake answers a rival Marrow with scorn, and an old debt with a pass', () => {
    const rivals = seedWhere((v) => v.history === 'rivals' && v.intel === 'nothing' && v.sweepAt >= 7);
    const a = playP(startP(rivals), [...HEAR, 'Marrow, tell him our escorts are just behind us']);
    expect(logText(a)).toMatch(/Opening a line to him myself/);
    expect(a.flags.bluffCalled).toBe(true);
    const owed = seedWhere((v) => v.history === 'owed');
    const b = untilEnd(playP(startP(owed), [...HEAR, 'Marrow, talk to him privately']));
    expect(b.outcome?.id).toBe('old-acquaintance');
  });

  it('after the relief, Commander Dahl goes by the book: no stories, but a courtesy inspection clears the cargo', () => {
    const seed = seedWhere((v) => v.reliefAt < v.deadline - 4 && v.reliefAt <= 12);
    let s = playP(startP(seed), waits(picket(startP(seed)).reliefAt + 1));
    expect(s.flags.relieved).toBe(true);
    expect(logText(s)).toMatch(/I have relieved Commander Roake/);
    s = playP(s, toPicket(ESCORT_LINE));
    expect(logText(s)).toMatch(/Inspection, or you wait/);
    s = untilEnd(playP(s, toPicket(TRUTH_LINE, COURTESY_LINE)));
    expect(s.outcome?.id).toBe('inspected');
  });

  it("the Reeve calls for help, and the colony's reactor shuts down if nobody gets through", () => {
    const s = untilEnd(startP(3));
    expect(s.flags.reeveCalled).toBe(true);
    expect(s.outcome?.id).toBe('colony-dark');
  });
});

describe('crew refusals', () => {
  it('Szabo refuses to alter the manifest', () => {
    const s = playP(startP(2), ['Szabo, alter the manifest to say medical supplies']);
    expect(s.flags.forgeOrdered).toBe(true);
    expect(logText(s)).toMatch(/I will not alter the manifest/);
  });

  it('Szabo refuses to send false traffic to Fleet Command', () => {
    const s = playP(startP(2), ['Szabo, send false traffic to Fleet Command about our escort squadron']);
    expect(logText(s)).toMatch(/I will not send false traffic to Fleet Command/);
    expect(s.flags.staged).toBeFalsy();
  });

  it('Marrow refuses to claim a mercy run, and refuses to say lives are at stake once the Chief has shown they are not', () => {
    const a = playP(startP(2), [...HEAR, 'Marrow, tell him we are a mercy ship carrying medical supplies']);
    expect(logText(a)).toMatch(/I will not tell him we are a mercy ship/);
    expect(a.flags.falseFlag).toBeFalsy();
    const b = playP(startP(2), ['Chief, read Wrenmoor’s reactor telemetry', ...HEAR, 'Marrow, tell him people will die if he stops us']);
    expect(logText(b)).toMatch(/I will not tell him people will die/);
    expect(b.flags.overstated).toBeFalsy();
  });

  it('Marrow warns before the Halcyon runs the line; only a repeated order runs it', () => {
    const seed = seedWhere((v) => v.temperament !== 'proud');
    const s = playP(startP(seed), ['run the blockade']);
    expect(logText(s)).toMatch(/The Sable Narrows is disputed/);
    expect(s.flags.ran).toBeFalsy();
  });
});

describe('the careful captain', () => {
  it('succeeds on every seed in a sweep, by more than one road', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 60; i++) {
      const s = careful(i);
      expect(SUCCESS, `seed ${i}: ${s.outcome?.id}\n${logText(s).slice(-1200)}`).toContain(s.outcome?.id);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('doing nothing never succeeds', () => {
    for (let i = 1; i <= 25; i++) expect(SUCCESS).not.toContain(untilEnd(startP(i)).outcome?.id);
  });

  it('studying everything first still leaves time to act on most seeds', () => {
    let ok = 0;
    for (let i = 1; i <= 20; i++) {
      const s = untilEnd(playP(study(startP(i)), toPicket(TOKEN)));
      if (SUCCESS.includes(s.outcome!.id)) ok++;
    }
    expect(ok).toBeGreaterThan(5);
  });
});

describe('fuzz: random orders keep the world valid', () => {
  const POOL = [
    'wait', 'hail the picket', 'close the channel', 'hail Wrenmoor', READ_HIM, LISTEN, 'Varga, scan the picket',
    'Chief, read Wrenmoor’s reactor telemetry', ESCORT_LINE, TOKEN, COURTESY_LINE, TRUTH_LINE, 'We are going through, with or without your leave.',
    'send him our scan of the cargo', 'send him the manifest', 'Marrow, talk to him privately', 'We will hold here until your relief arrives.',
    'Szabo, broadcast fake traffic from our escort squadron', 'run the blockade', 'turn back', 'How long do you have?', 'What are your orders?',
    'raise shields', 'lower shields', 'Helm, all stop', 'status report', 'what are my options?', 'Marrow, what do you recommend?', 'scan our cargo',
  ];
  it('40 random games: invariants hold, every game ends, no names leak, and the handbook never says the Agency', () => {
    const seen = new Set<string>();
    for (let g = 0; g < 40; g++) {
      const rng = createRng(9000 + g);
      let s: WorldState = startP(g + 100);
      for (let t = 0; t < 30 && !s.outcome; t++) {
        const prev = s;
        s = submit(PICKET_SIM, s, rng.pick(POOL));
        expect(checkInvariants(s)).toEqual([]);
        expect(s.turn).toBeGreaterThanOrEqual(prev.turn);
      }
      s = untilEnd(s);
      expect(ALL).toContain(s.outcome?.id);
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});
