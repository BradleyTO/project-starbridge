/**
 * Training Simulation 004 — scripted playthroughs that reach EVERY listed ending
 * through the offline interpreter (plain-English orders), with invariants checked after each order.
 */
import { describe, expect, it } from 'vitest';
import { REACTOR_ENDINGS } from '../../src/scenarios/reactor/outcome';
import { MAX_TURNS } from '../../src/engine/rules';
import { knows } from '../../src/engine/state';
import type { WorldState } from '../../src/engine/types';
import { reactor } from '../../src/scenarios/reactor/setup';
import { pm } from '../../src/scenarios/reactor/agents';
import { DIAGNOSE, LEAK, RS, logText, playR, seedWhere, startR, untilEnd, waits } from './helpers';

const reached = new Set<string>();
function ending(s: WorldState, id: string) {
  expect(s.outcome?.id, logText(s).slice(-2000)).toBe(id);
  expect(logText(s)).not.toMatch(LEAK);
  expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
  reached.add(id);
  return s;
}
/** Play on, talking Paley through whenever she freezes (chat costs no time, so a wait follows). */
function seeItThrough(s: WorldState): WorldState {
  for (let i = 0; i < 30 && !s.outcome; i++) s = playR(s, pm(s).frozen && !s.flags.paleyLost ? ["breathe, Paley. I'm right here with you", 'wait'] : ['wait']);
  return s;
}
function diagnosed(seed: number): WorldState {
  let s = playR(startR(seed), DIAGNOSE);
  for (let i = 0; i < 4 && !knows(s, 'fault_known'); i++) s = playR(s, ['wait']);
  expect(knows(s, 'fault_known')).toBe(true);
  return s;
}

describe('Reactor Night: success endings', () => {
  it('clean-save: the Chief finds a lying sensor and runs the regulator by hand', () => {
    const s = untilEnd(playR(diagnosed(seedWhere((v) => v.fault === 'sensor')), ['Okafor, take the regulator off automatic']));
    ending(s, 'clean-save');
    expect(s.flags.stopped_manual).toBe(true);
    expect(s.outcome!.success).toBe(true);
  });

  it('clean-save: the Chief finds a failed pump and cross-connects the backup', () => {
    const s = untilEnd(playR(diagnosed(seedWhere((v) => v.fault === 'pump')), ['Okafor, switch to the backup pump']));
    ending(s, 'clean-save');
    expect(s.flags.stopped_pump).toBe(true);
  });

  it("by-hand: a shaken Paley, steadied first, opens the stuck valve herself", () => {
    const seed = seedWhere((v) => v.nerve === 'shaken' && v.fault === 'valve' && !v.valveDeep && v.heat0 <= 42);
    const s = seeItThrough(playR(diagnosed(seed), ['hail the pod', 'how are you doing?', "take your time, I'm right here with you", 'Paley, go to the valve']));
    ending(s, 'by-hand');
    expect(s.flags.steadiedFirst).toBe(true);
  });

  it('by-hand: a shaken Paley sent cold freezes on the spine, and is talked through it', () => {
    const seed = seedWhere((v) => v.nerve === 'shaken' && v.fault === 'valve' && !v.valveDeep && v.heat0 <= 42);
    let s = playR(startR(seed), ['hail the pod', 'Paley, go to the valve', ...waits(2)]);
    expect(pm(s).frozen).toBe(1);
    s = seeItThrough(s);
    ending(s, 'by-hand');
    expect(s.flags.talkedThrough).toBe(true);
  });

  it("cold-bypass: Okafor's improvised bypass, finished at the manifold by a steady Paley", () => {
    const seed = seedWhere((v) => v.nerve === 'steady' && v.fault === 'pump' && v.heat0 <= 42);
    const s = untilEnd(playR(startR(seed), ['Okafor, rig the cold bypass', 'wait', 'hail the pod', 'Paley, go to the manifold']));
    ending(s, 'cold-bypass');
    expect(s.flags.improvised).toBe(true);
  });

  it('cold-bypass: the helm flies the empty-handed pod by remote, so nobody is sent', () => {
    const seed = seedWhere((v) => v.fault === 'valve' && v.nerve === 'panicked' && v.heat0 <= 42);
    const s = untilEnd(playR(startR(seed), ['Okafor, rig the cold bypass', 'Adeyemi, fly the pod to the manifold']));
    ending(s, 'cold-bypass');
    expect(s.flags.remotePod).toBe(true);
  });

  it('limped-home: charge the jump drive, eject the core, jump home on the capacitors', () => {
    const seed = seedWhere((v) => v.clamps === 'free');
    let s = playR(startR(seed), ['charge the jump drive']);
    for (let i = 0; i < 10 && s.ships.halcyon.jump.charge < 100; i++) s = playR(s, ['wait']);
    s = playR(s, ['eject the core']);
    expect(s.flags.ejected && s.flags.storedJump).toBe(true);
    for (let i = 0; i < 10 && !s.outcome; i++) s = playR(s, ['jump home']);
    ending(s, 'limped-home');
    expect(s.counters.deckLost ?? 0).toBe(0);
  });
});

describe('Reactor Night: failure and partial endings', () => {
  it('saved-at-cost: the core goes only after the reactor room shielding fails', () => {
    // A seed whose climb lands on 92 or 93: past the shielding, short of the Chief's own ejection at 94.
    let s = startR(1);
    for (let seed = 1; seed < 500; seed++) {
      s = startR(seed);
      if (reactor(s).clamps !== 'free') continue;
      for (let i = 0; i < 40 && !s.flags.deckHit; i++) s = playR(s, ['wait']);
      if (!s.flags.ejected && !s.outcome) break;
    }
    expect(s.flags.deckHit && !s.flags.ejected).toBe(true);
    s = playR(s, ['eject the core', 'wait']);
    ending(s, 'saved-at-cost');
    expect(s.counters.deckLost).toBe(reactor(s).deckSix);
  });

  it('dead-in-space: ejecting early with nothing stored to jump on', () => {
    const s = playR(startR(seedWhere((v) => v.clamps === 'free')), ['eject the core', 'wait']);
    ending(s, 'dead-in-space');
  });

  it('hard-jump: jumping with the cascade still running', () => {
    let s = playR(startR(9), ['charge the jump drive', 'wait', 'wait']);
    for (let i = 0; i < 10 && !s.outcome; i++) s = playR(s, ['jump home']);
    ending(s, 'hard-jump');
  });

  it('last-ditch: no order from the bridge; the Chief ejects on her own authority', () => {
    ending(untilEnd(startR(seedWhere((v) => v.clamps === 'free'))), 'last-ditch');
  });

  it('halcyon-lost: no order from the bridge and jammed clamps', () => {
    ending(untilEnd(startR(seedWhere((v) => v.clamps === 'jammed'))), 'halcyon-lost');
  });

  it('halcyon-lost: a panicked Paley ordered out freezes on the spine and the interlock holds', () => {
    const seed = seedWhere((v) => v.nerve === 'panicked' && v.fault === 'valve' && !v.valveDeep && v.heat0 <= 40);
    const s = untilEnd(playR(startR(seed), ['hail the pod', "Paley, go to the valve now, that's an order"]));
    ending(s, 'halcyon-lost');
    expect(s.flags.paleyLost).toBe(true);
  });

  it('stalemate: radiators, a starved load and a bypass on a lying sensor hold the cascade for thirty minutes', () => {
    const seed = seedWhere((v) => v.fault === 'sensor' && v.nerve === 'steady');
    let s = playR(startR(seed), ['use the shield emitters as radiators', 'Okafor, starve the reaction', 'Okafor, rig the cold bypass', 'wait', 'hail the pod', 'Paley, go to the manifold']);
    for (let i = 0; i < 45 && !s.outcome; i++) s = playR(s, ['wait']);
    ending(s, 'stalemate');
    expect(s.turn).toBeGreaterThanOrEqual(MAX_TURNS);
  });

  it('every listed ending was reached (≥3 successes, ≥3 failures)', () => {
    expect(REACTOR_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(REACTOR_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
    for (const id of [...REACTOR_ENDINGS.success, ...REACTOR_ENDINGS.failure, ...REACTOR_ENDINGS.backstop]) expect(reached.has(id), id).toBe(true);
  });
});

void RS;
