/** Training Simulation 020 — scenario shape, seed sweep, fuzz and state invariants. */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { GE_SIM, LEAK, byBook, careful, grav, logText, playG, probeRun, startG, untilEnd, waits } from './helpers';
import { SCENARIO_TITLE } from '../../src/scenarios/gravity/setup';
import { settled } from '../../src/scenarios/gravity/agents';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';

describe('scenario shape', () => {
  it('title matches catalogue form and create is deterministic', () => {
    expect(GE_SIM.title).toBe(SCENARIO_TITLE);
    expect(GE_SIM.title).toMatch(/^Training Simulation 020: /);
    const a = GE_SIM.create(42);
    const b = GE_SIM.create(42);
    expect(a).toEqual(b);
    expect(a.scenarioId).toBe('gravitys-edge');
    expect(a.provenance.timeline).toBe('simulation');
  });

  it('setup: an empty probe on her tether, a civilian observatory, and the frame and the star hidden', () => {
    const s = GE_SIM.create(9);
    expect(s.ships.kestrel.souls).toBe(0);
    expect(s.ships.cruiser.classification).toMatch(/Civilian/);
    expect(s.ships.halcyon.souls).toBe(212);
    expect(s.facts.feel.known).toBe(false);
    expect(s.facts.tell.known).toBe(false);
    expect(s.facts.pass.known).toBe(true);
    expect(s.slots?.passenger).toBeNull();
  });

  it('the intro plays to yellow alert with objectives, and the exercise objective is labelled', () => {
    const s = startG(3);
    expect(s.alert).toBe('yellow');
    expect(s.objectives.map((o) => o.id)).toEqual(['record', 'ship', 'read', 'copy']);
    expect(s.objectives.find((o) => o.id === 'read')!.text).toMatch(/^Exercise objective/);
    expect(logText(s)).not.toMatch(LEAK);
  });

  it('seed sweep: the frame, the gauges, the glitches and the clocks all vary', () => {
    const hull = new Set<string>();
    const gauges = new Set<string>();
    const gl = new Set<string>();
    const peak = new Set<number>();
    const falseAt = new Set<boolean>();
    for (let i = 1; i <= 60; i++) {
      const v = grav(GE_SIM.create(i));
      hull.add(v.hull);
      gauges.add(v.gauges);
      gl.add(v.glitches);
      peak.add(v.peakAt);
      falseAt.add(v.falseAt > 0);
    }
    expect(hull.size).toBe(3);
    expect(gauges.size).toBe(3);
    expect(gl.size).toBe(3);
    expect(peak.size).toBeGreaterThanOrEqual(3);
    expect(falseAt.size).toBe(2);
  });

  it('seed sweep: the same plan ends differently across seeds, including a success', () => {
    const ids = new Set<string>();
    for (let i = 1; i <= 60; i++) ids.add(byBook(i, false).outcome!.id);
    expect(ids.size).toBeGreaterThanOrEqual(3);
    expect(ids.has('full-record') || ids.has('early-out')).toBe(true);
    const c = new Set<string>();
    for (let i = 1; i <= 40; i++) c.add(careful(i).outcome!.id);
    expect(c.has('full-record')).toBe(true);
    expect(c.has('early-out')).toBe(true);
  });

  it('orders and questions reach the right people', () => {
    let s = startG(3);
    let ctx = contextFrom(s);
    expect(interpretSync('take us deeper', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'improvise' }] });
    expect(interpretSync('Chief, reinforce the frame', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'improvise' }] });
    expect(interpretSync('release the probe', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'improvise' }] });
    expect(interpretSync('Chief, how does she feel?', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'bridge' }] });
    expect(interpretSync('pull back', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'improvise' }] });
    s = playG(s, ['hail the observatory']);
    ctx = contextFrom(s);
    expect(interpretSync('Please turn your dish and take our data', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'speak', to: 'cruiser' }] });
    s = playG(s, ['Please turn your dish and take our data.']);
    expect(s.flags.relayOrdered).toBe(true);
  });

  it('every suggestion is an order the interpreter understands', () => {
    let s = startG(5);
    for (let i = 0; i < 12 && !s.outcome; i++) {
      for (const o of GE_SIM.suggestions!(s)) {
        const r = interpretSync(o, contextFrom(s));
        expect(r.kind, o).not.toBe('none');
        expect(r.kind, o).not.toBe('clarify');
      }
      s = playG(s, [i === 2 ? 'take us deeper' : 'wait']);
    }
  });

  it("fuzzed playthroughs never leak other simulations' names or missing keys", () => {
    const seeds = [1, 5, 7, 10, 19, 31, 44, 55, 66, 77];
    const cmds = [
      ['take us deeper', 'take us deeper', 'do it', 'Chief, how does she feel?', 'status', 'pull back', 'take us out'],
      ['Szabo, relay our data to the observatory', 'boost sensors', 'take us deeper', 'wait', 'release the probe', 'take us out'],
      ['hail the observatory', 'We will get you the whole pass.', 'What do you know about the glitches?', 'No promises; the ship comes first.', 'close the channel'],
      ['fire on the observatory', 'fire on the probe', 'raise shields', 'red alert', 'engage the jump drive'],
      ['Chief, listen to the frame', 'turn the ship end-on to the star', 'Chief, reinforce the frame', 'clear the outer sections', 'how much data do we have?', 'options', 'objectives', 'help'],
      ['xyzzy plugh', 'go ahead', 'beam the probe aboard', 'tractor the probe', 'take us deeper', 'take us deeper', 'take us deeper', 'do it'],
      ['take us deeper', 'helm, take us out of the system', 'engage the jump drive'],
      waits(30),
    ];
    for (const seed of seeds) {
      for (const c of cmds) {
        const s = untilEnd(playG(startG(seed), c, false), false);
        const text = logText(s);
        expect(text, `seed ${seed}`).not.toMatch(LEAK);
        expect(text).not.toMatch(/\[missing|the the\b|a the\b/i);
        expect(checkInvariants(s)).toEqual([]);
        expect(s.outcome, `seed ${seed} ${c[0]}`).not.toBeNull();
        expect(settled(s) || s.turn >= 30).toBeTruthy();
        for (const k of Object.keys(s.counters)) expect(Number.isInteger(s.counters[k]), k).toBe(true);
        expect(s.objectives.filter((o) => o.status === 'active')).toEqual([]);
      }
    }
  });

  it('the civilian observatory cannot be fired on', () => {
    const s = playG(startG(4), ['fire on the observatory', 'fire on Lisle Observatory']);
    expect(s.outcome).toBeNull();
    expect(s.ships.cruiser.souls).toBe(46);
    expect(s.ships.cruiser.hull).toBe(100);
  });

  it('the probe route works on every seed tried', () => {
    for (let i = 1; i <= 20; i++) expect(probeRun(i).outcome?.id, `seed ${i}`).toBe('probe-record');
  });
});
