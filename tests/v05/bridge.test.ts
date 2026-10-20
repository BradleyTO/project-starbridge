/** v0.5 (M3.1) bridge-first startup: the idle bridge, bridge commands, simulations only on request. */
import { describe, expect, it } from 'vitest';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import { completeIntro } from '../../src/engine/turn';
import type { WorldState } from '../../src/engine/types';
import { bridgeScenario, createBridge } from '../../src/scenarios/bridge';
import { scenarioFor } from '../../src/scenarios/registry';
import { K, lastId, play, start, textSince } from '../helpers';

const B = bridgeScenario;
const bridge = (seed = 7) => completeIntro(createBridge(seed), B);
const say = (s: WorldState, ...cmds: string[]) => {
  for (const c of cmds) {
    s = submit(B, s, c);
    expect(checkInvariants(s), c).toEqual([]);
  }
  return s;
};

describe('the idle bridge', () => {
  it('starts quiet: no contacts, no objectives, green alert, no outcome, no emergency', () => {
    const s = bridge();
    expect(s.scenarioId).toBe('bridge');
    expect(s.ships.kestrel.detected).toBe(false);
    expect(s.ships.cruiser.detected).toBe(false);
    expect(s.objectives).toEqual([]);
    expect(s.alert).toBe('green');
    expect(s.outcome).toBeNull();
    expect(checkInvariants(s)).toEqual([]);
    expect(textSince(s)).toMatch(/holds station/);
    expect(textSince(s)).not.toMatch(/distress|Kestrel|warship/i);
  });

  it('stays idle: 30 minutes of waiting brings no emergency and no outcome, with quiet periods', () => {
    let s = bridge();
    const lines: number[] = [];
    for (let i = 0; i < 30; i++) {
      const at = lastId(s);
      s = say(s, 'wait');
      lines.push(s.log.filter((e) => e.id > at && e.speaker !== 'Captain' && !/Holding and monitoring/.test(e.text)).length);
    }
    expect(s.outcome).toBeNull();
    expect(s.ships.kestrel.detected || s.ships.cruiser.detected).toBe(false);
    const withChatter = lines.filter((n) => n > 0).length;
    expect(withChatter).toBeGreaterThan(3); // routine activity happens
    expect(withChatter).toBeLessThan(25); // …but not every minute
  });

  it('is deterministic for a seed', () => {
    const a = say(bridge(3), 'wait', 'wait', 'wait', 'wait', 'wait');
    const b = say(bridge(3), 'wait', 'wait', 'wait', 'wait', 'wait');
    expect(a.log.map((e) => e.text)).toEqual(b.log.map((e) => e.text));
  });
});

describe('talking to the crew before any mission', () => {
  it('"First Officer, give me a status report."', () => {
    const s0 = bridge();
    const s = say(s0, 'First Officer, give me a status report.');
    expect(textSince(s, lastId(s0))).toMatch(/Marrow: All quiet, Captain\. Hull 100%.*No contacts, no standing mission/);
  });

  it('"Science, what systems are within exploration range?"', () => {
    const s0 = bridge();
    const s = say(s0, 'Science, what systems are within exploration range?');
    const log = textSince(s, lastId(s0));
    expect(log).toMatch(/Varga: 5 systems within exploration range: /);
    for (const x of s.survey!.systems) expect(log).toContain(x.name);
    expect(s.time - s0.time).toBe(10);
  });

  it('"Computer, open the simulation archive." asks the app to open it', () => {
    const s0 = bridge();
    const s = say(s0, 'Computer, open the simulation archive.');
    expect(s.uiRequest?.kind).toBe('openArchive');
    expect(textSince(s, lastId(s0))).toMatch(/Ship computer: Simulation archive open/);
    expect(s.time).toBe(s0.time);
  });

  it('small talk is answered in character and changes nothing', () => {
    const s0 = bridge();
    const s = say(s0, 'Okafor, how are the engines?', 'Rask, how are you?');
    const log = textSince(s, lastId(s0));
    expect(log).toMatch(/Okafor: /);
    expect(log).toMatch(/Rask: /);
    expect(log).not.toMatch(/didn't follow/);
    expect(s.ships.halcyon).toEqual({ ...s0.ships.halcyon });
  });

  it('ordinary orders still work on the bridge; there is nobody to hail or shoot', () => {
    const s0 = bridge();
    const s = say(s0, 'raise shields', 'hail the cruiser', 'fire on the cruiser');
    expect(s.ships.halcyon.shields.raised).toBe(true);
    expect(s.flags.shotsFired).toBeFalsy();
    expect(s.comms?.channels.length ?? 0).toBe(0);
  });
});

describe('a simulation starts only on explicit request', () => {
  it('typed and voice-style requests ask for the Kestrel Incident', () => {
    for (const line of ['Computer, begin the Kestrel Incident simulation.', 'computer begin the kestrel incident simulation', 'start a simulation', "let's run a drill"]) {
      const s = say(bridge(), line);
      expect(s.uiRequest, line).toMatchObject({ kind: 'beginSim', id: 'TRN-kestrel' });
    }
  });

  it('nothing else starts one', () => {
    let s = bridge();
    s = say(s, 'status report', 'scan the area', 'wait', 'help', 'Science, what systems are within exploration range?');
    expect(s.uiRequest?.kind === 'beginSim').toBe(false);
  });

  it('an unknown simulation name is answered, not guessed', () => {
    const s0 = bridge();
    const s = say(s0, 'Computer, run the Battle of Orion simulation');
    expect(s.uiRequest ?? null).toBeNull();
    expect(textSince(s, lastId(s0))).toMatch(/no simulation called "battle of orion"/i);
  });

  it('inside a simulation: "end the simulation" asks to return; beginning another is refused', () => {
    const s0 = start(14);
    let s = play(s0, ['Computer, begin the Kestrel Incident simulation']);
    expect(s.uiRequest ?? null).toBeNull();
    expect(textSince(s, lastId(s0))).toMatch(/already running/);
    s = play(s, ['Computer, end the simulation']);
    expect(s.uiRequest?.kind).toBe('endSim');
  });

  it('"end the simulation" on the real bridge is refused', () => {
    const s = say(bridge(), 'computer, end simulation');
    expect(s.uiRequest ?? null).toBeNull();
  });

  it('the registry resolves both scenarios', () => {
    expect(scenarioFor('bridge')).toBe(B);
    expect(scenarioFor(K.id)).toBe(K);
  });
});
