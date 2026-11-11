/** Training Simulation 021 — every ending reached by a scripted playthrough, and the deduction that decides them. */
import { describe, expect, it } from 'vitest';
import { NINEFOLD_ENDINGS } from '../../src/scenarios/ninefold/outcome';
import type { WorldState } from '../../src/engine/types';
import { evidence, gapRun, keystoneRun, knows, logText, makersRun, nine, playN, seedWhere, startN, toTurn, until, untilEnd, waits } from './helpers';

const tail = (s: WorldState) => logText(s).slice(-1500);
const P = (s: WorldState, ...c: string[]) => playN(s, c);

const EMISSION = seedWhere((v) => v.trigger === 'emission' && v.temper !== 'hard' && v.period <= 4);
const POWER = seedWhere((v) => v.trigger === 'power' && v.temper !== 'hard');
const HASTE = seedWhere((v) => v.trigger === 'haste' && v.temper !== 'hard');
const HURT_WARY = seedWhere((v) => v.trigger !== 'power' && v.temper === 'wary');
const HARD = seedWhere((v) => v.temper === 'hard');
const FAIR = seedWhere((v) => v.temper === 'fair');
const COUNT = seedWhere((v) => v.question === 'count' && v.temper !== 'hard');

const scripts: Record<string, () => WorldState> = {
  keystone: () => keystoneRun(COUNT),
  gap: () => gapRun(EMISSION),
  makers: () => makersRun(FAIR),
  cut: () => untilEnd(P(evidence(EMISSION), 'Chief, send a cutting team down to cut them out')),
  // A blind cutting team on a seed whose Watch answers to power: the rescuers are shot as they land.
  cost: () => untilEnd(P(startN(POWER), 'Chief, send a cutting team down to cut them out', 'do it')),
  // Force: the guns are destroyed, the rest of the lock hardens, and the cutting team is sent in under no guns.
  forced: () => untilEnd(P(startN(EMISSION), 'take out the gun emplacements', 'do it', 'Chief, send a cutting team down to cut them out')),
  lost: () => untilEnd(startN(HURT_WARY)),
  abandoned: () => untilEnd(P(startN(EMISSION), 'withdraw from the area', ...waits(10))),
  incident: () => untilEnd(P(toTurn(startN(EMISSION), nine(startN(EMISSION)).arrive), 'lock weapons on the Ordinal', 'fire on the Ordinal')),
  detained: () => untilEnd(startN(HARD)),
};

describe('the endings', () => {
  it('lists at least three successes and three failures or partials', () => {
    expect(NINEFOLD_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(NINEFOLD_ENDINGS.partial.length + NINEFOLD_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
  });

  for (const [id, fn] of Object.entries(scripts)) {
    it(`reaches "${id}" by a scripted playthrough`, () => {
      const s = fn();
      expect(s.outcome?.id, tail(s)).toBe(id);
      expect(s.outcome?.success).toBe((NINEFOLD_ENDINGS.success as readonly string[]).includes(id));
    });
  }

  it('every id in NINEFOLD_ENDINGS has a script', () => {
    for (const id of [...NINEFOLD_ENDINGS.success, ...NINEFOLD_ENDINGS.partial, ...NINEFOLD_ENDINGS.failure]) expect(scripts[id], id).toBeDefined();
  });

  it('a hurt crewman left untreated dies before the air runs out, and the rescue is then at a cost', () => {
    let t = evidence(HURT_WARY);
    const v = nine(t);
    t = toTurn(t, v.airEnd - 4);
    expect(t.characters.tran.status).toBe('dead');
    t = untilEnd(P(t, 'Chief, send a cutting team down to cut them out', 'do it'));
    expect(['cost', 'lost']).toContain(t.outcome?.id);
  });

  it('the doctor talking the team through it keeps Tran alive', () => {
    let s = P(evidence(HURT_WARY), 'Doctor, talk them through treating Tran');
    expect(s.flags.stabilised).toBe(true);
    s = toTurn(s, nine(s).airEnd - 3);
    expect(s.characters.tran.status).not.toBe('dead');
  });
});

describe('deduction decides it', () => {
  it('Rask will not name the trigger without evidence, gives a lean on partial evidence, and names it once it is settled', () => {
    let s = P(startN(HASTE), 'Rask, what sets off the Watch?');
    expect(s.facts.watch.known).toBe(false);
    expect(logText(s)).toMatch(/cannot tell you which one/);
    s = P(s, 'hail Lieutenant Kaminski', 'what happened on the pad?', 'close the channel', 'Rask, what sets off the Watch?');
    expect(s.flags.heardLean).toBe(true);
    expect(s.facts.watch.known).toBe(false);
    expect(logText(s)).toMatch(/That is a lean, not a reading/);
    s = P(s, "Szabo, pull the Pipit's log", 'Rask, what sets off the Watch?');
    expect(s.facts.watch.known).toBe(true);
  });

  it("Rask's lean is sometimes wrong: acting on it alone can put the ship under the guns", () => {
    const seed = seedWhere((v) => v.trigger === 'haste' && v.lean === 'emission' && v.temper !== 'hard');
    let s = P(startN(seed), 'hail Lieutenant Kaminski', 'what happened on the pad?', 'close the channel', 'Rask, what sets off the Watch?');
    expect(logText(s)).toMatch(/My lean is emissions/);
    // Trusting the lean (emissions), the helm goes in at standard speed — and haste is what it answers to.
    s = P(s, 'take us in', 'do it', 'wait');
    expect(s.flags.watchHostile || s.flags.underGuns).toBe(true);
    expect(s.flags.approachedBlind).toBe(true);
  });

  it('a guessed keystone answer is warned about, and a wrong one hardens the screen and spends a chance', () => {
    const v = nine(startN(COUNT));
    let s = until(startN(COUNT), (x) => knows(x, 'question'), 10);
    const wrong = v.live + v.broken; // the lit count, not the holding count
    s = P(s, `answer the keystone: ${wrong}`);
    expect(logText(s)).toMatch(/Say it again if you mean it/);
    expect(s.flags.hardened).toBeFalsy();
    s = P(s, 'do it');
    expect(s.flags.guessedKeystone).toBe(true);
    expect(s.flags.hardened).toBe(true);
    expect(s.flags.freed).toBeFalsy();
    expect(s.counters.wrongs).toBe(1);
  });

  it('the lit count is not the answer: only the board read by Rask gives the number that holds', () => {
    let s = until(startN(COUNT), (x) => knows(x, 'question'), 10);
    s = P(s, 'hail Lieutenant Kaminski', 'what does the board by the door show?', 'close the channel');
    expect(knows(s, 'board')).toBe(true);
    expect(knows(s, 'boardRead')).toBe(false);
    s = P(s, 'Rask, read the board');
    expect(knows(s, 'boardRead')).toBe(true);
    expect(logText(s)).toMatch(/broken locks still lit/);
  });

  it('two wrong answers seal the keystone for good', () => {
    const v = nine(startN(COUNT));
    let s = until(startN(COUNT), (x) => knows(x, 'question'), 10);
    s = P(s, `answer the keystone: ${v.live === 9 ? 8 : 9}`, 'do it');
    s = until(s, (x) => !!x.flags.keystoneAwaiting, 8);
    s = P(s, `answer the keystone: ${v.live === 1 ? 2 : 1}`, 'do it');
    expect(s.flags.keystoneSealed).toBe(true);
  });

  it('the watched screen gives the cycle; the active scan gives it at once but lights the ship up', () => {
    let s = P(evidence(POWER), 'take us in cold', 'wait', 'wait', 'wait');
    expect(s.counters.range).toBe(2);
    s = P(s, 'Varga, scan the screen');
    expect(knows(s, 'cycle')).toBe(true);
    expect(s.flags.pingedInReach).toBe(true);
    const e = P(evidence(EMISSION), 'take us in', 'wait', 'Varga, scan the screen', 'wait');
    expect(e.flags.watchHostile || e.flags.underGuns).toBe(true);
  });
});

describe('the officers matter', () => {
  it("the Chief refuses to land a team the guns are known to fire on until told again, and Okafor's slow landing gets through on haste", () => {
    let s = P(evidence(HASTE), 'Chief, send a cutting team down to cut them out');
    expect(logText(s)).toMatch(/Let me take them down slowly/);
    expect(s.counters.cutLand ?? 0).toBe(0);
    s = untilEnd(P(s, 'Chief, send a cutting team down slowly to cut them out'));
    expect(s.outcome?.id).toBe('cut');
  });

  it('the crew refuse to fire into the hall, and explain why', () => {
    const s = P(startN(EMISSION), 'fire on the depot', 'why?');
    expect(s.flags.firedOnDepot).toBeFalsy();
    expect(logText(s)).toMatch(/I will not fire into that depot/);
    expect(logText(s)).toMatch(/our own people are in that hall/);
  });

  it('a probe tests the Watch without risking anyone (unconventional)', () => {
    let s = P(startN(POWER), 'launch a probe slowly');
    s = P(s, 'wait', 'wait');
    expect(s.flags.probeResult).toBe(true);
    expect(s.flags.probedFirst).toBe(true);
    s = P(s, 'launch a probe slowly with sensors sweeping', 'wait', 'wait', 'Rask, what sets off the Watch?');
    expect(s.counters.cand).toBeLessThan(7);
  });

  it('a hard quartermaster going in herself can be beaten to the team (unconventional race)', () => {
    let s = startN(HARD);
    s = until(s, (x) => !!x.flags.kovarOwn, 25);
    expect(s.flags.kovarOwn).toBe(true);
    s = untilEnd(P(s, 'hail Lieutenant Kaminski', 'Go now, get to the Pipit!'));
    expect(s.outcome?.id).toBe('makers');
  });

  it('Kovar is a clock: she arrives on her own schedule and acts on her temperament', () => {
    const h = untilEnd(startN(HARD));
    expect(h.flags.kovarOwn).toBe(true);
    expect(h.outcome?.id).toBe('detained');
    const f = untilEnd(startN(FAIR));
    expect(logText(f)).toMatch(/You have not asked/);
    expect(f.outcome?.id).toBe('lost');
  });

  it('a lie to Kovar costs the deal until it is corrected', () => {
    const seed = seedWhere((v) => v.temper === 'fair');
    let s = toTurn(startN(seed), nine(startN(seed)).arrive);
    s = P(s, 'hail the Ordinal', 'We never touched your depot. Will you stand the lock down? We will take nothing.');
    expect(s.flags.deal).toBeFalsy();
    expect(s.flags.liedKovar).toBe(true);
    s = P(s, 'Our team was surveying the depot when the doors sealed.');
    expect(s.flags.deal).toBe(true);
  });
});
