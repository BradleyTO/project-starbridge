import { describe, expect, it } from 'vitest';
import { createInitialState } from './initialState';
import { applyCommand, hasEscalated } from './demoScript';
import { getContact } from '../../engine/state';
import type { WorldState } from '../../engine/types';

const run = (cmds: string[], s: WorldState = createInitialState()) => cmds.reduce(applyCommand, s);
const status = (s: WorldState, id: string) => s.objectives.find((o) => o.id === id)?.status;
const CLOSE = ['approach', 'approach', 'approach'];

describe('objective end states', () => {
  const endings: Record<string, string[]> = {
    rescue: [...CLOSE, 'evacuate the crew', 'withdraw'],
    abandoned: ['withdraw'],
    'kestrel-lost': Array(9).fill('wait'),
    'shots-fired': ['scan the kestrel', 'fire on the cruiser'],
  };
  for (const [id, cmds] of Object.entries(endings)) {
    it(`no objective is left active after the "${id}" ending`, () => {
      const s = run(cmds);
      expect(s.outcome?.id).toBe(id);
      expect(s.objectives.filter((o) => o.status === 'active')).toEqual([]);
    });
  }

  it('fast rescue: unattempted informational objectives are missed, rescue and restraint complete', () => {
    const s = run(endings.rescue);
    expect(status(s, 'assess')).toBe('missed');
    expect(status(s, 'intentions')).toBe('missed');
    expect(status(s, 'protect')).toBe('complete');
    expect(status(s, 'escalation')).toBe('complete');
  });

  it('compartment objective completes when discovered', () => {
    const s = run(['scan the kestrel', ...CLOSE, 'scan the compartment', 'hail the cruiser', 'evacuate the crew', 'withdraw']);
    expect(status(s, 'secret')).toBe('complete');
    expect(status(s, 'assess')).toBe('complete');
    expect(status(s, 'intentions')).toBe('complete');
  });

  it('compartment objective is missed when detected but never resolved', () => {
    const s = run(['scan the kestrel', ...CLOSE, 'evacuate the crew', 'withdraw']);
    expect(status(s, 'secret')).toBe('missed');
  });

  it('abandonment and loss fail the protect objective', () => {
    expect(status(run(endings.abandoned), 'protect')).toBe('failed');
    expect(status(run(endings['kestrel-lost']), 'protect')).toBe('failed');
  });

  it('shots fired fails protect (crew still aboard) and escalation', () => {
    const s = run(endings['shots-fired']);
    expect(status(s, 'protect')).toBe('failed');
    expect(status(s, 'escalation')).toBe('failed');
  });
});

describe('escalation rule', () => {
  it('cruiser locking weapons on the Kestrel fails escalation immediately and permanently', () => {
    let s = run([...CLOSE, 'wait', 'wait', 'wait']); // six turns: cruiser 210,000 → 30,000 km
    expect(s.flags.cruiserLockedKestrel).toBe(true);
    expect(status(s, 'escalation')).toBe('failed');
    expect(getContact(s, 'cruiser').disposition).toBe('hostile');
    s = run(['evacuate the crew', 'withdraw'], s);
    expect(s.outcome?.id).toBe('rescue');
    expect(status(s, 'escalation')).toBe('failed');
  });

  it('locking our weapons on the cruiser fails escalation, even after standing down', () => {
    let s = run(['lock weapons on the cruiser']);
    expect(status(s, 'escalation')).toBe('failed');
    s = run(['stand down', ...CLOSE, 'evacuate the crew', 'withdraw'], s);
    expect(hasEscalated(s)).toBe(true);
    expect(status(s, 'escalation')).toBe('failed');
  });

  it('standing down clears weapon posture so diplomacy is possible again', () => {
    const s = run(['lock weapons on the cruiser', 'stand down', 'explain this is a humanitarian rescue']);
    expect(s.flags.weaponsHot).toBe(false);
    expect(s.flags.cruiserPlacated).toBe(true);
  });

  it('early diplomacy prevents the lock and keeps escalation clean over a long mission', () => {
    const s = run(['explain this is a humanitarian rescue', ...CLOSE, 'stabilize the reactor', ...Array(6).fill('wait'), 'evacuate the crew', 'withdraw']);
    expect(s.flags.cruiserLockedKestrel).toBeUndefined();
    expect(getContact(s, 'cruiser').range).toBeGreaterThanOrEqual(60000);
    expect(s.outcome?.id).toBe('rescue');
    expect(status(s, 'escalation')).toBe('complete');
  });

  it('late placation never pushes the cruiser backwards', () => {
    let s = run(Array(6).fill('wait'));
    const r = getContact(s, 'cruiser').range;
    s = run(['explain this is a humanitarian rescue'], s);
    expect(getContact(s, 'cruiser').range).toBeLessThanOrEqual(r);
  });

  it('is deterministic', () => {
    const cmds = ['scan the kestrel', 'lock weapons', 'wait', 'stand down', 'approach'];
    expect(run(cmds)).toEqual(run(cmds));
  });
});

describe('destroyed Kestrel', () => {
  it('refuses Kestrel actions after breach and reports a consistent rescue', () => {
    let s = run([...CLOSE, 'evacuate the crew', 'wait', 'wait', 'wait', 'wait', 'wait']);
    expect(s.flags.kestrelDestroyed).toBe(true);
    const before = s.turn;
    s = run(['approach the kestrel', 'scan the kestrel', 'engage tractor beam'], s);
    expect(s.turn).toBe(before);
    expect(s.log.at(-1)?.text).toMatch(/Kestrel is gone/);
    s = run(['withdraw'], s);
    expect(s.outcome?.id).toBe('rescue');
    expect(s.outcome?.summary).toMatch(/lost to her reactor breach/);
  });
});
