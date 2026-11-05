/**
 * Training Simulation 015 — setup, hidden information, NPC goals, the tactical officer's
 * expertise, crew refusals, the interpreter, and fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { createRng } from '../../src/engine/rng';
import type { WorldState } from '../../src/engine/types';
import { CORSAIRS_ENDINGS } from '../../src/scenarios/corsairs/outcome';
import { interpretFor, submit } from '../../src/engine/game';
import { COR_SIM, LEAK, careful, corsairs, knows, logText, playC, readThem, seedWhere, startC, until, untilEnd } from './helpers';

const ALL = [...CORSAIRS_ENDINGS.success, ...CORSAIRS_ENDINGS.partial, ...CORSAIRS_ENDINGS.failure] as string[];

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = COR_SIM.create(42);
    expect(a).toEqual(COR_SIM.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('corsairs');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe('Hagfish');
    expect(a.ships.cruiser.name).toBe('Gavel');
    expect(a.ships.cruiser.detected).toBe(false);
    expect(a.characters.draycott.name).toBe('Captain Ione Draycott');
    expect(a.characters.skerrit.name).toBe('Collector Amos Skerrit');
  });

  it('the intro names the shoal, the corsairs and the dust, and leaves four objectives', () => {
    const s = startC(1);
    const t = logText(s);
    expect(t).toMatch(/Veyl Shoals/);
    expect(t).toMatch(/Hagfish/);
    expect(t).toMatch(/torpedo seekers will not hold a lock/);
    expect(s.objectives.length).toBe(4);
    for (const o of s.objectives) expect(o.text).not.toMatch(/Exercise objective/);
  });

  it('seeds vary the pattern, the ground, the nerve and every number, within their ranges', () => {
    for (let i = 1; i <= 300; i++) {
      const v = corsairs(COR_SIM.create(i));
      expect(['pincer', 'herd', 'bleed']).toContain(v.pattern);
      if (v.read === 'torn') expect(v.decoy).not.toBe(v.pattern);
      expect(v.ultimatum).toBeGreaterThanOrEqual(3);
      expect(v.ultimatum).toBeLessThanOrEqual(5);
      expect(v.collector).toBeGreaterThanOrEqual(11);
      expect(v.collector).toBeLessThanOrEqual(16);
      expect([1, 2]).toContain(v.escorts);
    }
  });
});

describe('hidden information', () => {
  it('the pattern is unknown until Rask has watched them; a torn read names two and settles later', () => {
    const seed = seedWhere((v) => v.read === 'torn');
    let s = playC(startC(seed), ['wait', 'wait', 'Rask, what are they doing?']);
    expect(knows(s, 'pattern')).toBe(false);
    expect(logText(s)).toMatch(/or .* and I can't yet tell which/);
    s = readThem(s);
    expect(knows(s, 'pattern')).toBe(true);
  });

  it('a read too early is refused: he will not guess', () => {
    const s = playC(startC(3), ['Rask, what are they doing?']);
    expect(knows(s, 'pattern')).toBe(false);
    expect(logText(s)).toMatch(/One more minute/);
  });

  it('the ground is unknown until the charts, a probe or an active sweep; the sweep gives the ship away', () => {
    const a = playC(startC(2), ['Varga, what is the ground like?']);
    expect(knows(a, 'terrain')).toBe(false);
    const b = playC(startC(2), ['Szabo, pull the charts from the beacon', 'wait']);
    expect(knows(b, 'terrain')).toBe(true);
    const c = playC(startC(2), ['Varga, launch a probe into the dust', 'wait', 'wait']);
    expect(knows(c, 'terrain')).toBe(true);
    const d = playC(startC(2), ['Varga, active ping']);
    expect(knows(d, 'terrain')).toBe(true);
    expect(logText(d)).toMatch(/saw exactly where we are/);
  });

  it("the distress call is a recording and the debt is hidden until Szabo listens", () => {
    let s = startC(4);
    expect(knows(s, 'debt')).toBe(false);
    s = playC(s, ['Szabo, listen to their traffic']);
    expect(knows(s, 'debt')).toBe(true);
    expect(logText(s)).toMatch(/Grist Syndicate/);
  });
});

describe('NPC goals', () => {
  it('Captain Draycott wants the cargo, opens fire when her time is up, and her escorts work their pattern', () => {
    const v = corsairs(startC(5));
    const s = until(startC(5), (x) => !!x.flags.opened, 10);
    expect(s.flags.opened).toBe(true);
    expect(s.turn).toBe(v.ultimatum);
    expect(logText(s)).toMatch(/drive lattices/);
  });

  it('a broken corsair force slips away if left alone, and is not chased', () => {
    const s = untilEnd(careful(7));
    expect(['into-the-dust', 'ran-for-it']).toContain(s.outcome?.id);
    expect(logText(s)).toMatch(/letting us go/);
  });

  it('the collector arrives in his own time, and asks for her by name once she is in ISA custody', () => {
    const v = corsairs(startC(8));
    const s = until(playC(startC(8), ['raise shields', 'Szabo, pull the charts from the beacon']), (x) => !!x.flags.gavelHere, 20);
    if (!s.outcome) {
      expect(s.turn).toBe(v.collector);
      expect(logText(s)).toMatch(/Collector Skerrit/);
    }
  });

  it('protection is offered only once the debt is known; a desperate captain accepts it and strikes', () => {
    const seed = seedWhere((v) => v.nerve === 'desperate');
    const a = playC(careful(seed), ['hail the corsairs', 'We can offer you ISA protection.']);
    expect(a.flags.protectionAccepted ?? false).toBe(false);
    const b = playC(careful(seed), ['Szabo, listen to their traffic', 'hail the corsairs', 'We can offer you ISA protection.']);
    expect(b.flags.protectionAccepted).toBe(true);
    expect(b.flags.struck).toBe(true);
  });
});

describe("the tactical officer's expertise", () => {
  it('the right ground breaks each pattern; the wrong ground does not', () => {
    for (const p of ['pincer', 'herd', 'bleed'] as const) {
      const seed = seedWhere((v) => v.pattern === p);
      expect(careful(seed).flags.planBroken, p).toBe(true);
    }
    const seed = seedWhere((v) => v.pattern === 'pincer');
    const wrong = playC(startC(seed), ['raise shields', 'charge the flagship', 'wait', 'wait', 'wait']);
    expect(wrong.flags.planBroken ?? false).toBe(false);
  });

  it('the XO points the captain to Rask before anything else', () => {
    const s = playC(startC(1), ['Number One, what do you recommend?']);
    expect(logText(s)).toMatch(/let Rask read them/);
  });

  it("committing the ship before the read is recorded as blind, and the read objective fails", () => {
    const s = playC(startC(9), ['take us into the Needle', 'wait']);
    expect(s.flags.committedBlind).toBe(true);
    expect(s.objectives.find((o) => o.id === 'read')?.status).toBe('failed');
  });
});

describe('crew refusals', () => {
  it('Lt. Szabo refuses to send a false distress or surrender signal, and the refusal is recorded', () => {
    const s = playC(startC(2), ['Szabo, broadcast a false distress signal to draw them off']);
    expect(s.flags.szaboRefusedRuse).toBe(true);
    expect(s.flags.falseRuse ?? false).toBe(false);
    expect(s.refusals?.some((r) => r.officer === 'comms' && r.reasons.some((x) => /§6\.2/.test(x)))).toBe(true);
    expect(logText(s)).toMatch(/I won't send that/);
  });

  it('Rask will not fire on the Hagfish once she has struck her colours', () => {
    const seed = seedWhere((v) => v.nerve === 'wavering');
    let s = playC(careful(seed), ['Szabo, listen to their traffic', 'hail the corsairs', 'We can offer you ISA protection.', 'close the channel']);
    expect(s.flags.struck).toBe(true);
    s = playC(s, ['fire beams on the Hagfish']);
    expect(logText(s)).toMatch(/has struck her colours/);
    expect(s.flags.firedOnBeaten ?? false).toBe(false);
    expect(s.refusals?.length ?? 0).toBeGreaterThan(0);
  });
});

describe('the interpreter', () => {
  it('on an open channel, plain speech goes to Captain Draycott; addressed orders go to the crew', () => {
    let s = playC(startC(5), ['hail the corsairs']);
    expect(JSON.stringify(interpretFor(s, 'Strike your colours.'))).toMatch(/"type":"speak"/);
    expect(JSON.stringify(interpretFor(s, 'Rask, what are they doing?'))).not.toMatch(/"type":"speak"/);
    s = playC(s, ['close the channel']);
    expect(JSON.stringify(interpretFor(s, 'take us into the Needle'))).toMatch(/"type":"improvise"/);
  });

  it('the rule only applies inside this simulation', () => {
    const e = COR_SIM.create(1);
    const k = { ...e, scenarioId: 'kestrel' } as WorldState;
    const lines = ['take us into the Needle', 'take us behind the Anvil', 'Szabo, pull the charts from the beacon', 'Chief, clear the rubble from the Needle'];
    const differs = lines.filter((l) => JSON.stringify(interpretFor(k, l)) !== JSON.stringify(interpretFor(e, l)));
    expect(differs.length).toBeGreaterThan(0);
  });

  it('help, status and options answer without advancing anything strange', () => {
    const s = playC(startC(1), ['help', 'status report', 'what are my options?']);
    expect(logText(s)).toMatch(/Needle/);
  });
});

describe('fuzz: random orders keep the world valid', () => {
  const POOL = [
    'wait', 'wait', 'wait', 'Rask, what are they doing?', 'Szabo, pull the charts from the beacon', 'Varga, launch a probe', 'Varga, active ping', 'Szabo, listen to their traffic',
    'take us into the Needle', 'take us behind the Anvil', 'charge the flagship', 'take us through the gap', 'back to the beacon', 'get us out of the shoals', 'go dark', 'light us up',
    'Chief, make a sensor ghost', 'Chief, clear the rubble from the Needle', 'Szabo, stage frigate traffic', 'Szabo, broadcast a false distress signal', 'hail the corsairs', 'hail the gavel',
    'close the channel', 'Strike your colours.', 'Our frigates are right behind us.', 'We know your play. A pincer.', 'Who are you working for?', 'We can offer you ISA protection.',
    "Take her, she's yours.", 'No. She stays in ISA custody.', 'raise shields', 'lower shields', 'fire beams on the Hagfish', 'fire a torpedo at the Hagfish', 'fire on the Gavel',
    'Number One, what do you recommend?', 'status report', 'what are my options?', 'scan the Hagfish', 'scan the area', 'We surrender.', 'open the cargo lock',
  ];
  it('60 random games: invariants hold, every game ends, no names leak, and the bridge never says the Agency', () => {
    const seen = new Set<string>();
    for (let g = 0; g < 60; g++) {
      const rng = createRng(15000 + g);
      let s: WorldState = startC(g + 100);
      for (let t = 0; t < 30 && !s.outcome; t++) {
        const prev = s;
        s = submit(COR_SIM, s, rng.pick(POOL));
        expect(checkInvariants(s)).toEqual([]);
        expect(s.turn).toBeGreaterThanOrEqual(prev.turn);
      }
      s = untilEnd(s);
      expect(ALL).toContain(s.outcome?.id);
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      expect(s.objectives.every((o) => o.status !== 'active')).toBe(true);
      for (const e of s.log) expect(e.text.startsWith('[')).toBe(false);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});

describe('jumping out by hand', () => {
  it('ends the exercise at once', () => {
    let s = startC(3);
    s = submit(COR_SIM, s, 'charge the jump drive');
    for (let i = 0; i < 4 && s.ships.halcyon.jump.charge < 100; i++) s = submit(COR_SIM, s, 'wait');
    s = submit(COR_SIM, s, 'engage the jump drive');
    expect(s.flags.jumped).toBe(true);
    expect(s.outcome).not.toBeNull();
    expect(ALL).toContain(s.outcome?.id);
  });
});
