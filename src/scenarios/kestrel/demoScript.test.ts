import { describe, expect, it } from 'vitest';
import { createInitialState } from './initialState';
import { OPENING_BEATS, advanceOpening, applyCommand, completeOpening, parseCommand } from './demoScript';
import { getContact } from '../../engine/state';
import type { WorldState } from '../../engine/types';

const run = (cmds: string[], s: WorldState = createInitialState()) => cmds.reduce(applyCommand, s);

describe('opening beats', () => {
  it('reveals both contacts and four objectives', () => {
    const s = completeOpening(createInitialState());
    expect(s.beat).toBe(OPENING_BEATS.length);
    expect(getContact(s, 'kestrel').visible).toBe(true);
    expect(getContact(s, 'cruiser').visible).toBe(true);
    expect(s.objectives.map((o) => o.id)).toEqual(['assess', 'intentions', 'protect', 'escalation']);
    expect(s.alert).toBe('yellow');
  });
  it('advanceOpening is a no-op after the intro', () => {
    const s = completeOpening(createInitialState());
    expect(advanceOpening(s)).toBe(s);
  });
  it('does not mutate its input', () => {
    const s0 = createInitialState();
    const snapshot = JSON.stringify(s0);
    advanceOpening(s0);
    applyCommand(s0, 'scan the kestrel');
    expect(JSON.stringify(s0)).toBe(snapshot);
  });
});

describe('parseCommand', () => {
  it.each([
    ['Scan the Kestrel', 'scan', 'kestrel'],
    ['hail the cruiser', 'hail', 'cruiser'],
    ['Engage tractor beam', 'tractor', null],
    ['Lower shields', 'shieldsDown', null],
    ['shields up', 'shieldsUp', null],
    ['Tell them this is a humanitarian rescue', 'diplomacy', null],
    ['Evacuate the Kestrel crew', 'evacuate', 'kestrel'],
    ['scan the cargo hold', 'scan', 'compartment'],
    ['make it so', 'unknown', null],
  ])('%s → %s', (input, intent, target) => {
    expect(parseCommand(input)).toEqual({ intent, target });
  });
});

describe('commands', () => {
  it('logs the captain order and is deterministic', () => {
    const a = run(['scan the kestrel', 'hail the cruiser']);
    const b = run(['scan the kestrel', 'hail the cruiser']);
    expect(a).toEqual(b);
    expect(a.log.some((e) => e.channel === 'captain' && e.text === 'scan the kestrel')).toBe(true);
  });

  it('scanning reveals hidden compartment and completes assessment', () => {
    const s = run(['scan the kestrel']);
    expect(s.objectives.find((o) => o.id === 'assess')?.status).toBe('complete');
    expect(s.objectives.find((o) => o.id === 'secret')?.status).toBe('active');
    expect(s.turn).toBe(1);
  });

  it('time-consuming orders advance the cruiser; free orders do not', () => {
    const s0 = completeOpening(createInitialState());
    const r0 = getContact(s0, 'cruiser').range;
    const s1 = applyCommand(s0, 'status report');
    expect(getContact(s1, 'cruiser').range).toBe(r0);
    const s2 = applyCommand(s1, 'wait');
    expect(getContact(s2, 'cruiser').range).toBe(r0 - 30000);
  });

  it('validates range and shields before transporting', () => {
    let s = run(['evacuate the crew']);
    expect(s.flags.crewEvacuated).toBeUndefined();
    s = run(['approach', 'approach', 'approach', 'raise shields', 'evacuate the crew'], s);
    expect(s.flags.crewEvacuated).toBeUndefined();
    expect(s.log.at(-1)?.text).toMatch(/shields are up/i);
    s = run(['lower shields', 'evacuate the crew'], s);
    expect(s.flags.crewEvacuated).toBe(true);
  });

  it('rescue then withdraw yields the rescue ending', () => {
    const s = run(['approach', 'approach', 'approach', 'evacuate the crew', 'withdraw']);
    expect(s.outcome?.id).toBe('rescue');
    expect(s.objectives.find((o) => o.id === 'protect')?.status).toBe('complete');
  });

  it('waiting too long loses the Kestrel', () => {
    const s = run(Array(9).fill('wait'));
    expect(s.outcome?.id).toBe('kestrel-lost');
  });

  it('stabilising the reactor stops the countdown', () => {
    const s = run(['approach', 'approach', 'approach', 'stabilize the reactor', ...Array(10).fill('wait')]);
    expect(s.outcome).toBeNull();
    expect(s.flags.kestrelStabilized).toBe(true);
  });

  it('diplomacy fails with weapons locked, succeeds otherwise', () => {
    const hot = run(['lock weapons on the cruiser', 'explain this is a humanitarian rescue']);
    expect(hot.flags.cruiserPlacated).toBeUndefined();
    const calm = run(['explain this is a humanitarian rescue']);
    expect(calm.flags.cruiserPlacated).toBe(true);
    expect(calm.objectives.find((o) => o.id === 'intentions')?.status).toBe('complete');
  });

  it('firing on the cruiser ends the demo and fails escalation objective', () => {
    const s = run(['fire on the cruiser']);
    expect(s.outcome?.id).toBe('shots-fired');
    expect(s.objectives.find((o) => o.id === 'escalation')?.status).toBe('failed');
  });

  it('refuses to fire on the civilian ship', () => {
    const s = run(['fire on the kestrel']);
    expect(s.outcome).toBeNull();
  });

  it('ignores commands after the simulation ends', () => {
    const s = run(['withdraw']);
    expect(s.outcome?.id).toBe('abandoned');
    const s2 = applyCommand(s, 'scan the cruiser');
    expect(getContact(s2, 'cruiser').scanned).toBe(false);
  });
});
