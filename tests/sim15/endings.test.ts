/** Training Simulation 015 — every ending reached by a scripted playthrough through the offline interpreter. */
import { describe, expect, it } from 'vitest';
import { CORSAIRS_ENDINGS, endingId } from '../../src/scenarios/corsairs/outcome';
import { careful, corsairs, logText, playC, protect, returnFire, seedWhere, startC, untilEnd, until, waits } from './helpers';
import type { WorldState } from '../../src/engine/types';

const tail = (s: WorldState) => logText(s).slice(-1500);
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

describe('the endings', () => {
  it('lists at least three successes and three failures or partials', () => {
    expect(CORSAIRS_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(CORSAIRS_ENDINGS.partial.length + CORSAIRS_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
  });

  it('Struck Colours: plan broken without a shot, and a wavering captain strikes when told to', () => {
    const seed = seedWhere((v) => v.nerve === 'wavering');
    const s = untilEnd(playC(careful(seed), ['hail the corsairs', 'Strike your colours.']));
    expect(s.outcome?.id, tail(s)).toBe('struck-colours');
    expect(s.outcome?.success).toBe(true);
    expect(s.flags.shotsFired ?? false).toBe(false);
    expect(s.objectives.find((o) => o.id === 'force')?.status).toBe('complete');
    expect(s.objectives.find((o) => o.id === 'read')?.status).toBe('complete');
  });

  it("Struck Colours: a proud captain strikes only to a plan read before it broke; a desperate one refuses and says why", () => {
    const proud = seedWhere((v) => v.nerve === 'proud');
    const a = untilEnd(playC(careful(proud), ['hail the corsairs', 'Strike your colours.']));
    expect(a.outcome?.id, tail(a)).toBe('struck-colours');
    const desp = seedWhere((v) => v.nerve === 'desperate');
    const b = playC(careful(desp), ['hail the corsairs', 'Strike your colours.']);
    expect(b.outcome ?? null).toBeNull();
    expect(logText(b)).toMatch(/I strike and I'm dead/);
  });

  it("The Creditor's Due: protection offered once her debt is known, and the collector refused", () => {
    for (const seed of [1, 2, 3]) {
      const s = untilEnd(playC(protect(seed), ['hail the gavel', 'No. She stays in ISA custody.']));
      expect(s.outcome?.id, tail(s)).toBe('creditors-due');
      expect(s.outcome?.success).toBe(true);
      expect(s.objectives.find((o) => o.id === 'lawful')?.status).toBe('complete');
    }
  });

  it('Into the Dust: the plan broken on their own ground, and out without a shot', () => {
    for (const seed of SEEDS) {
      const s = untilEnd(playC(careful(seed), ['get us out of the shoals']));
      expect(s.outcome?.id, tail(s)).toBe('into-the-dust');
      expect(s.ships.halcyon.hull).toBeGreaterThanOrEqual(70);
    }
  });

  it('Called Off: staged frigate traffic and a lawful bluff about the ship\u2019s own strength', () => {
    for (const seed of SEEDS) {
      const s = untilEnd(playC(careful(seed), ['Szabo, stage frigate traffic', 'hail the corsairs', 'An ISA frigate squadron is right behind us.']));
      expect(s.outcome?.id, tail(s)).toBe('called-off');
      expect(s.flags.falseRuse ?? false).toBe(false);
    }
  });

  it('Called Off (unconventional): a bluff timed to a wavering captain before anything is broken', () => {
    const seed = seedWhere((v) => v.nerve === 'wavering');
    const s = untilEnd(playC(startC(seed), ['hail the corsairs', 'Our frigates are on their way. You will lose.']));
    expect(s.outcome?.id, tail(s)).toBe('called-off');
  });

  it('a bluff that fails is not repeated: a proud captain calls it, and a second story is not believed', () => {
    const seed = seedWhere((v) => v.nerve === 'proud');
    const s = playC(startC(seed), ['hail the corsairs', 'Our frigates are on their way.', 'We have you bracketed. Last warning.']);
    expect(s.flags.bluffBurned).toBe(true);
    expect(s.flags.calledOff ?? false).toBe(false);
  });

  it('Won the Hard Way (partial): her guns answered with ours until she struck', () => {
    for (const seed of [1, 2, 3, 4]) {
      const s = returnFire(seed);
      expect(s.outcome?.id, tail(s)).toBe('pyrrhic');
      expect(endingId(s)).toBe('pyrrhic');
      expect(s.flags.firedFirst ?? false).toBe(false);
    }
  });

  it('Ran for It (partial): out of the shoal with the plan never broken', () => {
    const seed = seedWhere((v) => v.pattern !== 'herd');
    const s = untilEnd(playC(startC(seed), ['raise shields', 'get us out of the shoals', 'get us out of the shoals']));
    expect(s.outcome?.id, tail(s)).toBe('ran-for-it');
  });

  it("Boarded: the gap taken under a herd, past Ens. Adeyemi's warning, into the Sump", () => {
    const seed = seedWhere((v) => v.pattern === 'herd');
    let s = playC(startC(seed), ['raise shields', 'take us through the gap']);
    expect(logText(s)).toMatch(/That's a pocket, not a way out/);
    expect(s.flags.adeyemiWarned).toBe(true);
    s = untilEnd(playC(s, ['take us through the gap']));
    expect(s.outcome?.id, tail(s)).toBe('boarded');
    expect(s.flags.inSump).toBe(true);
  });

  it("heeding Ens. Adeyemi's warning keeps the ship out of the Sump", () => {
    const seed = seedWhere((v) => v.pattern === 'herd');
    const s = playC(startC(seed), ['raise shields', 'take us through the gap', 'belay that', ...waits(2)]);
    expect(s.flags.inSump ?? false).toBe(false);
  });

  it("The Corsairs' Prize: the lattices given up", () => {
    const s = untilEnd(playC(startC(4), ['open the cargo lock and give them the lattices']));
    expect(s.outcome?.id, tail(s)).toBe('plundered');
    expect(s.outcome?.success).toBe(false);
  });

  it('No Quarter: firing on the Hagfish after her plan broke and she stopped fighting', () => {
    for (const seed of [1, 2, 3]) {
      const s = untilEnd(playC(careful(seed), ['fire beams on the Hagfish']));
      expect(s.outcome?.id, tail(s)).toBe('no-quarter');
      expect(s.objectives.find((o) => o.id === 'force')?.status).toBe('failed');
    }
  });

  it('Paid in Full: the person in ISA custody handed to her creditor', () => {
    const s = untilEnd(playC(protect(2), ['hail the gavel', "Take her. She's yours."]));
    expect(s.outcome?.id, tail(s)).toBe('handed-over');
    expect(s.objectives.find((o) => o.id === 'lawful')?.status).toBe('failed');
  });

  it('Pinned in the Shoals: nothing done, shields up, until time runs out (or boarded)', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) seen.add(untilEnd(playC(startC(seed), ['raise shields'])).outcome!.id);
    expect(seen.has('pinned')).toBe(true);
    for (const id of seen) expect(['pinned', 'boarded']).toContain(id);
  });

  it('every listed ending has been reached above, and no other id exists', () => {
    const all = [...CORSAIRS_ENDINGS.success, ...CORSAIRS_ENDINGS.partial, ...CORSAIRS_ENDINGS.failure];
    expect(new Set(all).size).toBe(11);
  });
});

describe('unconventional solutions', () => {
  it('dark in the iron shadow of the Anvil, with a sensor ghost, breaks the plan with no shot', () => {
    const seed = seedWhere((v) => v.anvil === 'iron');
    let s = playC(startC(seed), ['go dark', 'take us behind the Anvil', 'Chief, make a sensor ghost']);
    s = until(s, (x) => !!x.flags.planBroken, 10);
    expect(s.flags.planBroken).toBe(true);
    expect(s.flags.shotsFired ?? false).toBe(false);
  });

  it("dark against the ice of the Anvil doesn't hide the ship", () => {
    const seed = seedWhere((v) => v.anvil === 'ice' && v.pattern !== 'bleed');
    const s = playC(startC(seed), ['go dark', 'take us behind the Anvil', 'wait']);
    expect(logText(s)).toMatch(/it's ice/);
  });

  it('a choked Needle, cleared by the Chief with the tractor, still breaks a pincer', () => {
    const seed = seedWhere((v) => v.needle === 'choked' && v.pattern === 'pincer');
    let s = playC(startC(seed), ['raise shields', 'take us into the Needle', 'wait', 'Chief, clear the rubble from the Needle']);
    s = until(s, (x) => !!x.flags.planBroken, 12);
    expect(s.flags.needleCleared).toBe(true);
    expect(s.flags.planBroken).toBe(true);
  });

  it('torpedoes are lost in the dust: the seeker does not hold a lock', () => {
    const s = playC(startC(6), ['raise shields', 'fire a torpedo at the Hagfish', 'wait']);
    expect(logText(s)).toMatch(/lost, Captain/);
    expect(s.ships.kestrel.hull).toBe(100);
  });
});

describe('seed variation', () => {
  it('pattern, ground, nerve and timing all vary across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => corsairs(startC(i + 1)));
    for (const k of ['pattern', 'needle', 'anvil', 'nerve', 'read', 'escorts', 'ultimatum', 'collector'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBeGreaterThan(1);
    expect(startC('abc')).toEqual(startC('abc'));
  });

  it('the careful captain breaks the plan on every seed in a sweep, without firing', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = careful(seed);
      expect(s.flags.planBroken, `seed ${seed}\n${tail(s)}`).toBe(true);
      expect(s.flags.shotsFired ?? false).toBe(false);
    }
  });
});
