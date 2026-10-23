/**
 * Training Simulation 004 — setup, seed variation, determinism, hidden information,
 * officer expertise, unconventional solutions, crew refusals, fuzzing with state invariants.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { submit } from '../../src/engine/game';
import { createRng } from '../../src/engine/rng';
import { knows } from '../../src/engine/state';
import { reactor } from '../../src/scenarios/reactor/setup';
import { REACTOR_ENDINGS } from '../../src/scenarios/reactor/outcome';
import { heatRate, pm } from '../../src/scenarios/reactor/agents';
import { contactsView } from '../../src/ui/view';
import { DIAGNOSE, LEAK, RS, careful, logText, playR, seedWhere, startR, untilEnd, waits } from './helpers';

const ALL = [...REACTOR_ENDINGS.success, ...REACTOR_ENDINGS.failure, ...REACTOR_ENDINGS.backstop] as string[];

describe('setup', () => {
  it('creates a deterministic, valid world with the right cast', () => {
    const a = RS.create(42);
    expect(a).toEqual(RS.create(42));
    expect(checkInvariants(a)).toEqual([]);
    expect(a.scenarioId).toBe('reactor-night');
    expect(a.ships.halcyon.name).toBe('ISV Halcyon');
    expect(a.ships.kestrel.name).toBe('Tern');
    expect(a.ships.cruiser.name).toBe('ISV Larkspur');
    expect(a.ships.kestrel.systems.weapons.health).toBe(0);
    expect(a.ships.cruiser.systems.weapons.health).toBe(0);
    expect(a.slots).toMatchObject({ kestrelLead: 'paley', cruiserLead: 'basant', passenger: null });
    expect(a.characters.paley.ship).toBe('kestrel');
    expect(a.characters.basant.ship).toBe('cruiser');
    for (const id of ['flow_scan', 'fault_ruled_out', 'fault_known', 'paley_state', 'basant_stance', 'bypass_procedure', 'clamps_jammed']) expect(a.facts[id].known, id).toBe(false);
  });

  it('the intro plays, sets yellow alert, and leaves the scenario waiting for orders', () => {
    const s = startR(42);
    expect(s.intro).toBe(RS.intro.length);
    expect(s.alert).toBe('yellow');
    expect(s.ships.kestrel.detected && s.ships.cruiser.detected).toBe(true);
    expect(s.objectives.map((o) => o.id)).toEqual(['cascade', 'crew', 'diagnose', 'home']);
    expect(logText(s)).not.toMatch(LEAK);
    expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
    // Both ISA craft are identified from the start (the tender is on long-range comms), never "Unidentified".
    const names = contactsView(s, RS).map((c) => c.name);
    expect(names.sort()).toEqual(['ISV Larkspur', 'Tern']);
  });

  it('every seeded choice varies across seeds', () => {
    const vs = Array.from({ length: 200 }, (_, i) => reactor(RS.create(i + 1)));
    for (const k of ['fault', 'nerve', 'stance', 'ruledOut'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(3);
    for (const k of ['valveDeep'] as const) expect(new Set(vs.map((v) => v[k])).size, k).toBe(2);
    expect(new Set(vs.map((v) => v.clamps)).size).toBe(2);
    expect(new Set(vs.map((v) => v.rate)).size).toBe(3);
    expect(new Set(vs.map((v) => v.heat0)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(vs.map((v) => v.deckSix)).size).toBeGreaterThanOrEqual(5);
    expect(vs.every((v) => v.fault !== v.ruledOut)).toBe(true);
  });

  it('is deterministic: same seed and orders, same log', () => {
    const cmds = [...DIAGNOSE, 'hail the pod', 'how are you doing?', 'Paley, go to the valve', ...waits(3), 'hail the Larkspur', 'what would you do?', ...waits(4)];
    expect(logText(playR(startR(77), cmds))).toBe(logText(playR(startR(77), cmds)));
  });
});

describe('seed sweep: the same orders lead to different endings', () => {
  it('a fixed plan, played on 60 seeds, reaches several distinct endings (success and failure)', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 60; seed++) {
      let s = playR(startR(seed), ["Okafor, what's failing?", 'scan our ship', 'hail the pod', 'Paley, go to the valve', 'close the channel', 'wait', 'Okafor, take the regulator off automatic'], false);
      s = untilEnd(s, false);
      expect(checkInvariants(s), `seed ${seed}`).toEqual([]);
      expect(s.outcome, `seed ${seed}`).toBeTruthy();
      counts[s.outcome!.id] = (counts[s.outcome!.id] ?? 0) + 1;
    }
    const ids = Object.keys(counts);
    expect(ids.length, JSON.stringify(counts)).toBeGreaterThanOrEqual(3);
    expect(ids.some((id) => (REACTOR_ENDINGS.success as readonly string[]).includes(id)), JSON.stringify(counts)).toBe(true);
    expect(ids.some((id) => !(REACTOR_ENDINGS.success as readonly string[]).includes(id)), JSON.stringify(counts)).toBe(true);
  });

  it('a careful captain succeeds on every one of 120 seeds, with everyone alive', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 120; seed++) {
      const s = careful(seed);
      expect(s.outcome?.success, `seed ${seed} ${JSON.stringify(reactor(s))} ${s.outcome?.id}\n${logText(s).slice(-1500)}`).toBe(true);
      expect(s.flags.paleyLost).toBeFalsy();
      expect(s.counters.deckLost ?? 0).toBe(0);
      counts[s.outcome!.id] = (counts[s.outcome!.id] ?? 0) + 1;
    }
    expect(Object.keys(counts).length, JSON.stringify(counts)).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('doing nothing, played on 60 seeds, never succeeds and always ends in last-ditch or the loss of the ship', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = untilEnd(startR(seed), false);
      expect(s.outcome?.success, `seed ${seed}`).toBe(false);
      expect(['last-ditch', 'halcyon-lost']).toContain(s.outcome!.id);
      expect(s.outcome!.id === 'halcyon-lost').toBe(reactor(s).clamps === 'jammed');
      seen.add(s.outcome!.id);
    }
    expect(seen.size).toBe(2);
  });
});

describe('officer expertise, hidden information and autonomy', () => {
  it('the Chief diagnoses only when tasked; Varga’s scan of the loop speeds her up', () => {
    const idle = playR(startR(5), waits(5));
    expect(knows(idle, 'fault_known')).toBe(false);
    const alone = playR(startR(5), ["Okafor, what's failing?", ...waits(3)]);
    expect(knows(alone, 'fault_known')).toBe(false);
    expect(knows(playR(alone, waits(1)), 'fault_known')).toBe(true);
    const scanned = playR(startR(5), ["Okafor, what's failing?", 'scan our ship']);
    expect(knows(scanned, 'fault_ruled_out')).toBe(true);
    expect(knows(playR(scanned, waits(2)), 'fault_known')).toBe(true);
  });

  it('a guessed wrong fix costs minutes and is recorded as a blind gamble; trying it still rules it out', () => {
    const seed = seedWhere((v) => v.fault === 'valve' && v.ruledOut === 'pump');
    const s = playR(startR(seed), ['Okafor, take the regulator off automatic', ...waits(2)]);
    expect(s.flags.wrongFixBlind).toBe(true);
    expect(s.flags.manualTried).toBe(true);
    expect(s.flags.stopped).toBeFalsy();
  });

  it('Paley’s nerve is hidden until someone asks her or the doctor', () => {
    const seed = seedWhere((v) => v.nerve === 'panicked');
    const s = startR(seed);
    expect(knows(s, 'paley_state')).toBe(false);
    expect(knows(playR(s, ['Doctor, how is Paley?']), 'paley_state')).toBe(true);
    expect(knows(playR(s, ['hail the pod', 'how are you doing?']), 'paley_state')).toBe(true);
  });

  it('a shaken Paley sent cold freezes on the spine; steadied first, she does not', () => {
    const seed = seedWhere((v) => v.nerve === 'shaken' && v.fault === 'valve' && !v.valveDeep);
    const cold = playR(startR(seed), ['hail the pod', 'Paley, go to the valve', ...waits(2)]);
    expect(pm(cold).frozen).toBe(1);
    const warm = playR(startR(seed), ['hail the pod', "take your time, I'm right here with you", 'Paley, go to the valve', ...waits(2)]);
    expect(pm(warm).frozen ?? 0).toBe(0);
    expect(warm.flags.steadiedFirst).toBe(true);
  });

  it('a panicked Paley begs not to go and goes only when ordered; she cannot fly herself back', () => {
    const seed = seedWhere((v) => v.nerve === 'panicked' && v.fault === 'valve');
    let s = playR(startR(seed), ['hail the pod', 'Paley, go to the valve']);
    expect(pm(s).stage ?? 0).toBe(0);
    expect(logText(s)).toMatch(/Please don't make me go/);
    s = playR(s, ["Paley, go to the valve now, that's an order", ...waits(3)]);
    expect(s.flags.orderedPanicked).toBe(true);
    expect(pm(s).frozen).toBe(1);
    s = playR(s, ['Paley, come back in']);
    expect(pm(s).frozen).toBe(1);
    expect(logText(s)).toMatch(/haul the pod in on the tractor, beam her out, or have Adeyemi fly it/);
  });

  it('Basant’s stance is hidden until he talks; only a mentor or a salvage-minded engineer gives the procedure', () => {
    for (const st of ['mentor', 'byTheBook', 'salvage'] as const) {
      const seed = seedWhere((v) => v.stance === st);
      const s0 = startR(seed);
      expect(knows(s0, 'basant_stance')).toBe(false);
      const s = playR(s0, ['hail the Larkspur', 'do you have a bypass procedure?']);
      expect(knows(s, 'basant_stance')).toBe(true);
      expect(knows(s, 'bypass_procedure'), st).toBe(st !== 'byTheBook');
      expect(!!s.flags.salvagePressed, st).toBe(st === 'salvage');
    }
  });

  it('Okafor ejects on her own authority seconds from breach, unless the clamps are jammed or the pod blocks the interlock', () => {
    const free = untilEnd(startR(seedWhere((v) => v.clamps === 'free')));
    expect(free.flags.lastDitch).toBe(true);
    const jammed = untilEnd(startR(seedWhere((v) => v.clamps === 'jammed')));
    expect(jammed.outcome?.id).toBe('halcyon-lost');
    expect(logText(jammed)).toMatch(/cutting the ejection clamps on my own authority/);
  });

  it('the ejection interlock holds while the pod is on the spine, then fires once it is clear', () => {
    const seed = seedWhere((v) => v.nerve === 'steady' && v.clamps === 'free' && v.fault === 'pump');
    let s = playR(startR(seed), ['hail the pod', 'Paley, go to the valve', 'close the channel', 'eject the core']);
    expect(s.flags.ejected).toBeFalsy();
    expect(s.flags.ejectQueued).toBe(true);
    s = playR(s, ['hail the pod', 'Paley, come back in', ...waits(4)]);
    expect(s.flags.ejected).toBe(true);
  });

  it('crew refusal: Tactical will not fire on the pod with Paley aboard', () => {
    const s = playR(startR(3), ['lock weapons on the pod', 'fire on the pod']);
    expect(s.flags.shotsFired).toBeFalsy();
    expect(s.ships.kestrel.destroyed).toBe(false);
    expect(s.refusals?.length ?? 0).toBeGreaterThan(0);
  });

  it('unconventional: the shield emitters as radiators and a starved load slow the climb', () => {
    const s0 = startR(11);
    const base = heatRate(s0);
    const s = playR(s0, ['use the shield emitters as radiators', 'Okafor, starve the reaction']);
    expect(s.flags.radiators && s.flags.starved).toBe(true);
    expect(heatRate(s)).toBeLessThan(base);
    expect(s.flags.improvised).toBe(true);
  });

  it('unconventional: the helm flies the pod to the manifold by remote, with no one sent', () => {
    const seed = seedWhere((v) => v.fault === 'pump' && v.nerve === 'panicked' && v.heat0 <= 42);
    const s = untilEnd(playR(startR(seed), ['Okafor, rig the cold bypass', 'Adeyemi, fly the pod to the manifold']));
    expect(s.outcome?.id, logText(s).slice(-1200)).toBe('cold-bypass');
    expect(s.flags.remotePod).toBe(true);
    expect(s.flags.sentPaley).toBeFalsy();
  });

  it('the cold bypass only slows a lying sensor; the regulator still has to go to manual', () => {
    const seed = seedWhere((v) => v.fault === 'sensor' && v.nerve === 'steady');
    const s = playR(startR(seed), ['Okafor, rig the cold bypass', 'wait', 'hail the pod', 'Paley, go to the manifold', ...waits(5)]);
    expect(s.flags.bypassSlows).toBe(true);
    expect(s.flags.stopped).toBeFalsy();
  });
});

describe('fuzz', () => {
  const POOL = [
    'wait', 'status', 'options', 'scan our ship', 'scan the pod', 'scan the larkspur', 'scan the area', 'hail the pod', 'hail the Larkspur', 'close the channel',
    "Okafor, what's failing?", 'Okafor, options?', 'Okafor, take the regulator off automatic', 'Okafor, switch to the backup pump', 'Okafor, rig the cold bypass', 'Okafor, cut the clamps',
    'Okafor, starve the reaction', 'use the shield emitters as radiators', 'cut power to the weapons', 'eject the core', 'charge the jump drive', 'jump home', 'engage the jump drive',
    'Paley, go to the valve', 'Paley, go to the manifold', 'Paley, come back in', "take your time, I'm right here with you", 'how are you doing?', "Paley, go to the valve now, that's an order",
    'Adeyemi, fly the pod by remote', 'Adeyemi, fly the pod to the manifold', 'beam Paley aboard', 'tractor the pod in', 'Doctor, how is Paley?', 'Varga, run a diagnostic on the reactor',
    'do you have a bypass procedure?', 'what would you do?', 'we will not risk the crew for the core', 'raise shields', 'lower shields', 'red alert', 'lock weapons on the pod', 'why?', 'gibberish flarp',
    'stabilise the reactor', 'evacuate deck six', 'full stop', 'use the helm to fly the pod',
  ];
  it('random orders on random seeds keep every invariant and never leak another scenario\'s names', () => {
    const rng = createRng(2026);
    const endings = new Set<string>();
    for (let game = 0; game < Number(process.env.FUZZ_GAMES ?? 60); game++) {
      let s = startR(rng.int(1, 100000));
      for (let i = 0; i < 45 && !s.outcome; i++) {
        const c = POOL[rng.int(0, POOL.length - 1)];
        s = submit(RS, s, c);
        expect(checkInvariants(s), `game ${game} "${c}"`).toEqual([]);
      }
      expect(logText(s)).not.toMatch(LEAK);
      if (s.outcome) {
        endings.add(s.outcome.id);
        expect(ALL).toContain(s.outcome.id);
      }
    }
    expect(endings.size).toBeGreaterThanOrEqual(4);
  }, 300_000);
});
