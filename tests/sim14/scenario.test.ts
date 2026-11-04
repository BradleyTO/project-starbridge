/**
 * Training Simulation 014 — setup, hidden information, NPC goals, crew advice and refusals, the
 * pilot's expertise, unconventional solutions, the interpreter, and fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { createRng } from '../../src/engine/rng';
import type { WorldState } from '../../src/engine/types';
import { STARFALL_ENDINGS } from '../../src/scenarios/starfall/outcome';
import { tripStrain } from '../../src/scenarios/starfall/agents';
import { interpretFor, submit } from '../../src/engine/game';
import { LEAK, STAR_SIM, TELL_SCOOP, careful, knows, logText, playS, seedWhere, starfall, startS, toKemble, toQuell, until, untilEnd } from './helpers';

const ALL = [...STARFALL_ENDINGS.success, ...STARFALL_ENDINGS.partial, ...STARFALL_ENDINGS.failure] as string[];
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;
const HAND = 'Adeyemi, the helm is yours, fly it your way.';

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = STAR_SIM.create(42);
    expect(a).toEqual(STAR_SIM.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('starfall');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe('Thistledown');
    expect(a.ships.cruiser.name).toBe('Dividend');
    expect(a.characters.kemble.name).toBe('Factor Idris Kemble');
    expect(a.characters.quell.name).toBe('Agent Sabra Quell');
    expect(a.characters.relief_helm.name).toMatch(/Duarte/);
  });

  it('the intro names the planet, the habitat and both pilots, and leaves four objectives', () => {
    const s = startS(1);
    const t = logText(s);
    expect(t).toMatch(/Caradoc/);
    expect(t).toMatch(/Thistledown/);
    expect(t).toMatch(/Adeyemi has the hands/);
    expect(t).toMatch(/Lt\. Duarte is the senior pilot/);
    expect(s.objectives.map((o) => o.id)).toEqual(['people', 'ship', 'count', 'helm']);
    expect(t).not.toMatch(LEAK);
  });

  it('seeds vary the storm, the ensign, the Factor, the agent and every number, within their ranges', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const v = starfall(STAR_SIM.create(seed));
      expect(['squall', 'gale', 'shear']).toContain(v.storm);
      expect(v.sink).toBeGreaterThanOrEqual(3);
      expect(v.sink).toBeLessThanOrEqual(4);
      expect(v.depth0).toBeGreaterThanOrEqual(34);
      expect(v.depth0).toBeLessThanOrEqual(42);
      expect(v.tolerance).toBeGreaterThanOrEqual(72);
      expect(v.tolerance).toBeLessThanOrEqual(90);
      expect(v.hidden === 0).toBe(v.count === 'honest');
      expect(STAR_SIM.create(seed).ships.kestrel.souls).toBe(v.manifest + v.hidden);
    }
  });
});

describe('hidden information', () => {
  it("the hull's limit is unknown until the Chief is asked", () => {
    let s = startS(4);
    expect(knows(s, 'tolerance')).toBe(false);
    s = playS(s, ['Chief, how much can the hull take?']);
    expect(knows(s, 'tolerance')).toBe(true);
    expect(logText(s)).toMatch(new RegExp(`I'll sign for ${starfall(s).tolerance}`));
  });

  it("the ensign's line exists only once he has flown it, and Varga's orbital model doubts it", () => {
    let s = playS(startS(6), [`${HAND} Take us down.`]);
    expect(s.flags.lineOffered).toBeFalsy();
    s = until(s, (x) => c(x, 'trips') >= 1);
    if (!s.flags.lineOffered) s = playS(s, ['Adeyemi, how would you fly it?']);
    expect(s.flags.lineOffered, logText(s).slice(-800)).toBe(true);
    expect(logText(s)).toMatch(/column of rising air/);
    expect(logText(s)).toMatch(/my model has that side of the habitat as sinking air/);
  });

  it('the line really does ease the strain: the same descent costs less on it', () => {
    const s = startS(9);
    const on = { ...s, flags: { ...s.flags, lineApproved: true } };
    expect(tripStrain(on, 60)).toBeLessThan(tripStrain(s, 60));
  });

  it('a shaken ensign keeps his read to himself unless he has been backed', () => {
    const seed = seedWhere((v) => v.nerve === 'shaken');
    let s = playS(startS(seed), ['Take us down.']);
    s = until(s, (x) => c(x, 'trips') >= 1);
    s = playS(s, ['Adeyemi, how would you fly it?']);
    expect(s.flags.lineOffered).toBeFalsy();
    expect(logText(s)).toMatch(/Forget it/);
    s = playS(s, ['Adeyemi, take a breath, I trust you. How would you fly it?']);
    expect(s.flags.lineOffered, logText(s).slice(-800)).toBe(true);
  });
});

describe('NPC goals', () => {
  it('a company agent asks for the habitat whole; a pragmatic one puts people first', () => {
    const co = seedWhere((v) => v.agent === 'company');
    const pr = seedWhere((v) => v.agent === 'pragmatic');
    expect(logText(playS(startS(co), ['wait', 'wait']))).toMatch(/tow the habitat out whole/);
    expect(logText(playS(startS(pr), ['wait', 'wait']))).toMatch(/Get the people first/);
  });

  it("under a company agent the Factor won't cut the works without a reason he can give them", () => {
    const seed = seedWhere((v) => v.agent === 'company');
    let s = playS(startS(seed), ['Tell Factor Kemble to cut the scoop works loose.']);
    expect(s.flags.cutBalked, logText(s).slice(-600)).toBe(true);
    expect(c(s, 'cutAt')).toBe(0);
    s = playS(s, ['Tell Factor Kemble to cut the scoop works loose because everyone aboard will die otherwise.']);
    expect(c(s, 'cutAt')).toBeGreaterThan(0);
  });

  it('a company agent who hears why yields, and then the Factor cuts on the plain order', () => {
    const seed = seedWhere((v) => v.agent === 'company');
    let s = playS(startS(seed), toQuell('We have to cut the scoop works loose because the people aboard will die otherwise.'));
    expect(s.flags.quellAgreed, logText(s).slice(-600)).toBe(true);
    s = playS(s, ['Tell Factor Kemble to cut the scoop works loose.']);
    expect(c(s, 'cutAt')).toBeGreaterThan(0);
  });

  it('cutting the works brings the hidden scoop hands up first, and slows the sinking to a crawl', () => {
    const seed = seedWhere((v) => v.count !== 'honest' && v.agent === 'pragmatic');
    let s = playS(startS(seed), ['Tell Factor Kemble to cut the scoop works loose.']);
    expect(s.flags.scoopUp).toBe(true);
    s = until(s, (x) => !!x.flags.cutLoose);
    const d = c(s, 'depth');
    s = playS(s, ['wait']);
    expect(c(s, 'depth') - d).toBe(1);
  });
});

describe('crew advice and refusals', () => {
  it('asked, the Chief warns before the limit; not asked, she reports after it', () => {
    const seed = seedWhere((v) => v.storm === 'shear' && v.tolerance <= 78 && v.nerve === 'steady');
    const a = until(playS(startS(seed), ['Chief, how much can the hull take?', 'Take us down.']), (x) => !!x.flags.okaforWarned, 30);
    expect(a.flags.warnedBeforeLimit, logText(a).slice(-800)).toBe(true);
    expect(logText(a)).toMatch(/That puts her past the \d+ I'll sign for/);
    const b = until(playS(startS(seed), ['Take us down.']), (x) => !!x.flags.okaforWarned || !!x.outcome, 30);
    if (b.flags.okaforWarned) {
      expect(b.flags.warnedBeforeLimit).toBeFalsy();
      expect(logText(b)).toMatch(/nobody asked/);
    }
  });

  it("an eager ensign says the hull will take it; the Chief, asked, flags that it isn't his call", () => {
    const seed = seedWhere((v) => v.nerve === 'eager');
    const s = playS(startS(seed), ['Adeyemi, how much can the hull take?', 'Chief, how much can the hull take?']);
    expect(logText(s)).toMatch(/She'll take it, Captain/);
    expect(s.flags.okaforEagerNote).toBe(true);
  });

  it('the senior pilot will not tow in a gale or a shear (crew refusal)', () => {
    const seed = seedWhere((v) => v.storm !== 'squall' && v.agent === 'pragmatic');
    let s = playS(startS(seed), ['Lt. Duarte, take the helm.', 'Tell Factor Kemble to cut the scoop works loose.']);
    s = until(s, (x) => !!x.flags.cutLoose);
    s = playS(s, ['Lt. Duarte, take the habitat in tow']);
    expect(s.flags.duarteNoTow, logText(s).slice(-600)).toBe(true);
    expect(logText(s)).toMatch(/can't hold a tow in this by instruments/);
  });

  it('the tractor cannot lift the habitat with its scoop works still on', () => {
    const s = playS(startS(3), ['Adeyemi, take the habitat in tow']);
    expect(logText(s)).toMatch(/far too heavy for the tractor/);
    expect(c(s, 'towStart')).toBe(0);
  });

  it('orders from the chair in mid-descent cost the hull, and the ensign says so', () => {
    let s = playS(startS(5), [`${HAND} Take us down.`]);
    const a = c(s, 'tripEnd');
    s = playS(s, ['Adeyemi, bank left.']);
    expect(c(s, 'overrides')).toBe(1);
    expect(c(s, 'tripEnd')).toBe(a + 1);
    expect(logText(s)).toMatch(/That costs us/);
  });

  it('the senior pilot cannot hold a dock as deep as the ensign can', () => {
    const seed = seedWhere((v) => v.storm === 'shear');
    const s = until(playS(startS(seed), ['Lt. Duarte, take the helm. Take us down.']), (x) => !!x.flags.dockWarned || !!x.outcome, 30);
    expect(logText(s)).toMatch(/past what I can hold by instruments/);
  });

  it('officers answer questions about the storm, the hull, the pilots and the count', () => {
    const s = playS(startS(2), ['Varga, what is the storm doing?', 'Chief, how much can the hull take?', 'Number One, who should fly?', 'How many people are aboard the habitat?']);
    const t = logText(s);
    expect(knows(s, 'storm')).toBe(true);
    expect(t).not.toMatch(/\[[a-zA-Z_]+\]|undefined|NaN/);
  });
});

describe('the interpreter', () => {
  it('on an open channel, plain speech goes to the person on the channel; addressed orders go to the crew', () => {
    let s = playS(startS(5), ['hail the habitat']);
    expect(JSON.stringify(interpretFor(s, 'Bring everyone to the ring, we are coming down.'))).toMatch(/"type":"speak"/);
    expect(JSON.stringify(interpretFor(s, 'Varga, count the life signs'))).toMatch(/"type":"improvise"/);
    s = playS(s, ['close the channel']);
    expect(JSON.stringify(interpretFor(s, 'take us down'))).toMatch(/"type":"improvise"/);
  });

  it('"Lt. Duarte, take the helm" goes to the senior pilot, and "Adeyemi, the helm is yours" to the ensign', () => {
    const a = playS(startS(5), ['Lt. Duarte, take the helm']);
    expect(c(a, 'pilot')).toBe(2);
    const b = playS(startS(5), [HAND]);
    expect(b.flags.delegated).toBe(true);
    expect(c(b, 'pilot')).toBe(1);
  });

  it('the rule only applies inside Starfall', () => {
    const e = STAR_SIM.create(1);
    const k = { ...e, scenarioId: 'kestrel' } as WorldState;
    const lines = ['take us down', 'Adeyemi, the helm is yours', 'cut the scoop works loose', 'Varga, count the life signs'];
    const differs = lines.filter((l) => JSON.stringify(interpretFor(k, l)) !== JSON.stringify(interpretFor(e, l)));
    expect(differs.length).toBeGreaterThan(0);
  });
});

describe('the careful captain', () => {
  it('succeeds by more than one road: the line, the senior pilot in a squall, and the tow', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 40; i++) {
      seen.add(careful(i).outcome!.id);
      if (starfall(STAR_SIM.create(i)).storm === 'squall') seen.add(careful(i, 'duarte').outcome!.id);
    }
    expect(seen.has('ensigns-line')).toBe(true);
    expect(seen.has('every-soul')).toBe(true);
  });

  it('a defensive Factor shown the count brings his scoop hands up, and nobody is left', () => {
    const seed = seedWhere((v) => v.count === 'defensive');
    const s = careful(seed);
    expect(s.flags.scoopUp).toBe(true);
    expect(c(s, 'deadCiv')).toBe(0);
  });

  it('the Factor told by name about the lower works brings them up', () => {
    const seed = seedWhere((v) => v.count === 'ashamed');
    const s = playS(startS(seed), toKemble(TELL_SCOOP));
    expect(s.flags.scoopUp).toBe(true);
  });
});

describe('fuzz: random orders keep the world valid', () => {
  const POOL = [
    'wait', 'wait', 'take us down', 'one more descent', HAND, 'Lt. Duarte, take the helm', 'Adeyemi, take the helm back', 'Adeyemi, take a breath, I trust you.',
    'Chief, how much can the hull take?', "Adeyemi, break off at the Chief's limit.", 'Adeyemi, how would you fly it?', 'Fly your line.', 'Adeyemi, bank left.', 'Adeyemi, more power.',
    'abort the descent', 'Varga, count the life signs aboard the habitat', 'Varga, read the storm', 'hail the habitat', 'hail the yacht', 'close the channel', TELL_SCOOP,
    'Is everyone aboard on your manifest?', 'Tell Factor Kemble to cut the scoop works loose.', 'Cut the scoop works loose because people will die otherwise.', 'take the habitat in tow',
    'I promise we will save the scoop works.', 'The people come first.', 'Number One, what do you recommend?', 'status report', 'what are my options?', 'raise shields',
    'fire on the Dividend', 'scan the habitat', 'scan the area', 'transport the people aboard', 'leave the system', 'Helm, all stop',
  ];
  it('40 random games: invariants hold, every game ends, no names leak, and the bridge never says the Agency', () => {
    const seen = new Set<string>();
    for (let g = 0; g < 40; g++) {
      const rng = createRng(14000 + g);
      let s: WorldState = startS(g + 100);
      for (let t = 0; t < 30 && !s.outcome; t++) {
        const prev = s;
        s = submit(STAR_SIM, s, rng.pick(POOL.filter((x) => x !== 'leave the system' || t > 20)));
        expect(checkInvariants(s)).toEqual([]);
        expect(s.turn).toBeGreaterThanOrEqual(prev.turn);
      }
      s = untilEnd(s);
      expect(ALL).toContain(s.outcome?.id);
      expect(logText(s)).not.toMatch(LEAK);
      expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
      expect(s.objectives.every((o) => o.status !== 'active')).toBe(true);
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

describe('jumping out by hand', () => {
  it('ends the exercise at once and is judged on who was left behind', () => {
    let s = startS(3);
    s = submit(STAR_SIM, s, 'charge the jump drive');
    for (let i = 0; i < 4 && s.ships.halcyon.jump.charge < 100; i++) s = submit(STAR_SIM, s, 'wait');
    expect(s.ships.halcyon.jump.charge).toBe(100);
    s = submit(STAR_SIM, s, 'engage the jump drive');
    expect(s.flags.jumped).toBe(true);
    expect(s.outcome?.id).toBe('abandoned');
    expect(s.outcome?.success).toBe(false);
  });
});
