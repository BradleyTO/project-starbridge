/** Training Simulation 019 — scenario shape, seed sweep, fuzz and state invariants. */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../../src/engine/invariants';
import { HC_SIM, LEAK, careful, hollow, logText, playH, startH, untilEnd, waits } from './helpers';
import { SCENARIO_TITLE } from '../../src/scenarios/hollow/setup';
import { settled } from '../../src/scenarios/hollow/agents';
import { interpretSync } from '../../src/interpreter/parser';
import { contextFrom } from '../../src/interpreter/types';

describe('scenario shape', () => {
  it('title matches catalogue form and create is deterministic', () => {
    expect(HC_SIM.title).toBe(SCENARIO_TITLE);
    expect(HC_SIM.title).toMatch(/^Training Simulation 019: /);
    const a = HC_SIM.create(42);
    const b = HC_SIM.create(42);
    expect(a).toEqual(b);
    expect(a.scenarioId).toBe('hollow-crown');
    expect(a.provenance.timeline).toBe('simulation');
  });

  it('setup: a civilian relay with the hostages and the governor aboard, and his condition and the false hostage hidden', () => {
    const s = HC_SIM.create(9);
    const v = hollow(s);
    expect(s.ships.kestrel.classification).toMatch(/Civilian/);
    expect(s.ships.kestrel.souls).toBe(v.hostages + 1);
    expect(s.facts.condition.known).toBe(false);
    expect(s.facts.impostor.known).toBe(false);
    expect(s.facts.siege.known).toBe(true);
  });

  it('seed sweep: his condition, the false hostage, the successor and the clocks all vary', () => {
    const cond = new Set<string>();
    const imp = new Set<string>();
    const succ = new Set<string>();
    const strike = new Set<number>();
    const hostages = new Set<number>();
    for (let i = 1; i <= 60; i++) {
      const v = hollow(HC_SIM.create(i));
      cond.add(v.condition);
      imp.add(v.impostor);
      succ.add(v.successor);
      strike.add(v.strikeAt);
      hostages.add(v.hostages);
    }
    expect(cond.size).toBe(3);
    expect(imp.size).toBe(3);
    expect(succ.size).toBe(3);
    expect(strike.size).toBeGreaterThanOrEqual(3);
    expect(hostages.size).toBeGreaterThanOrEqual(2);
  });

  it('seed sweep: the same careful approach ends differently across seeds, and blunt approaches differ too', () => {
    const ids = new Set<string>();
    for (let i = 1; i <= 40; i++) ids.add(careful(i).outcome!.id);
    expect(ids.has('surrender')).toBe(true);
    expect(ids.has('asylum')).toBe(true);
    const mixed = new Set<string>();
    const scripts = [['Rask, storm the relay', 'do it'], ['hail the relay', 'You are finished. You lost.', 'You are a disgrace.'], waits(3)];
    for (let i = 1; i <= 20; i++) for (const c of scripts) mixed.add(untilEnd(playH(startH(i), c, false), false).outcome!.id);
    expect(mixed.size).toBeGreaterThanOrEqual(4);
  });

  it('speech reaches the people it is meant for', () => {
    let s = playH(startH(3), ['hail the relay']);
    let ctx = contextFrom(s);
    expect(interpretSync('Tell me what happened to you', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'speak', to: 'kestrel' }] });
    expect(interpretSync('Doctor, assess the governor', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'improvise' }] });
    s = playH(s, ['close the channel', 'hail Government House']);
    ctx = contextFrom(s);
    expect(interpretSync('Please hold your team', ctx)).toMatchObject({ kind: 'actions', actions: [{ type: 'speak', to: 'cruiser' }] });
    s = playH(s, ['close the channel', 'hail Rook', 'Who are you really?']);
    expect(s.log[s.log.length - 1].speaker).toMatch(/Rook|Osei|Szabo|Marrow/);
  });

  it("fuzzed playthroughs never leak other simulations' names or missing keys", () => {
    const seeds = [1, 5, 7, 10, 19, 31, 44, 55, 66, 77];
    const cmds = [
      ['hail the relay', 'Doctor, assess the governor', 'Tell me what happened.', 'wait', 'wait', 'I am sorry about your son.', 'Take your time, rest.', 'We can send your medication.', 'close the channel', 'Szabo, check the duty roster', 'wait', 'Szabo, trace the transmissions', 'scan the relay core', 'Szabo, jam the trigger', 'Szabo, jam her transmitter'],
      ['hail the relay', 'We will restore you as governor.', 'You are a criminal.', 'Rook is a spy for the Guard.', 'Will you surrender?'],
      ['hail Government House', 'We will hand him over to you.', 'Recall your agent.', 'Hold your team.', 'We will not hand him over.', 'close the channel'],
      ['fire on the relay', 'fire on Government House', 'Rask, storm the relay', 'do it', 'beam the hostages out', 'beam Mallory aboard'],
      ['hail Rook', 'Who are you really?', 'We will protect you.', 'Send it to us.', 'status', 'options', 'objectives'],
      ['send a supply pod', 'wait', 'beam Rook aboard', 'hail the relay', 'The ISA will give you a fair hearing.'],
      ['go ahead', 'raise shields', 'red alert', 'target the relay', 'helm, take us out', 'engage the jump drive'],
      waits(20),
    ];
    for (const seed of seeds) {
      for (const c of cmds) {
        const s = untilEnd(playH(startH(seed), c, false), false);
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

  it('the civilian relay cannot be fired on while people are aboard', () => {
    const s = playH(startH(4), ['fire on the relay', 'fire on the Ostrin Relay']);
    expect(s.outcome).toBeNull();
    expect(s.ships.kestrel.souls).toBe(hollow(s).hostages + 1);
  });
});
