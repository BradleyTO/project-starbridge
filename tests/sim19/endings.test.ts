/** Training Simulation 019 — every ending reached by a scripted playthrough. */
import { describe, expect, it } from 'vitest';
import { HOLLOW_ENDINGS } from '../../src/scenarios/hollow/outcome';
import type { WorldState } from '../../src/engine/types';
import { askOut, calmed, careful, holdStannard, knows, logText, playH, seedWhere, startH, unmask, untilEnd, waits } from './helpers';

const tail = (s: WorldState) => logText(s).slice(-1500);
const P = (s: WorldState, ...c: string[]) => playH(s, c);

const AGENT = seedWhere((v) => v.impostor === 'agent' && v.condition !== 'grief');
const ACC = seedWhere((v) => v.impostor === 'accomplice');
const GRIEF = seedWhere((v) => v.condition === 'grief' && v.impostor !== 'accomplice');
const WIT = seedWhere((v) => v.impostor === 'witness');

const INSULTS = ['hail the relay', 'You are finished. You lost.', 'You are a disgrace and a coward.', 'You have five minutes or we come in.', 'You are nobody now, a has-been.'];

const scripts: Record<string, () => WorldState> = {
  surrender: () => careful(AGENT),
  asylum: () => careful(WIT),
  rescue: () => untilEnd(P(startH(AGENT), 'scan the relay core', 'hail the relay', 'We will send food across in a pod.', 'wait', 'beam the hostages out')),
  'by-force': () => untilEnd(P(calmed(startH(AGENT)), 'close the channel', 'Rask, storm the relay', 'do it')),
  'hollow-crown': () => untilEnd(P(startH(GRIEF), ...INSULTS)),
  strike: () => untilEnd(startH(AGENT)),
  harmed: () => untilEnd(P(startH(AGENT), ...INSULTS)),
  pyre: () => untilEnd(P(startH(ACC), 'Rask, storm the relay', 'do it')),
  'handed-over': () => {
    const s = P(startH(AGENT), 'hail Government House', 'We will hand him over to you.', 'close the channel');
    return untilEnd(askOut(holdStannard(unmask(P(calmed(s), 'close the channel')))));
  },
  stormed: () => untilEnd(P(startH(AGENT), 'Rask, storm the relay', 'do it')),
  abandoned: () => untilEnd(P(startH(AGENT), 'Helm, take us out of the system', 'engage the jump drive')),
};

describe('the endings', () => {
  it('lists at least three successes and three failures or partials', () => {
    expect(HOLLOW_ENDINGS.success.length).toBeGreaterThanOrEqual(3);
    expect(HOLLOW_ENDINGS.partial.length + HOLLOW_ENDINGS.failure.length).toBeGreaterThanOrEqual(3);
  });

  for (const [id, fn] of Object.entries(scripts)) {
    it(`reaches "${id}" by a scripted playthrough`, () => {
      const s = fn();
      expect(s.outcome?.id, tail(s)).toBe(id);
      expect(s.outcome?.success).toBe((HOLLOW_ENDINGS.success as readonly string[]).includes(id));
    });
  }

  it('every id in HOLLOW_ENDINGS has a script', () => {
    for (const id of [...HOLLOW_ENDINGS.success, ...HOLLOW_ENDINGS.partial, ...HOLLOW_ENDINGS.failure]) expect(scripts[id], id).toBeDefined();
  });

  it('Dr. Osei is pivotal: without her reading, talk alone never brings him out', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const s0 = P(startH(seed), 'hail the relay', 'Tell me what happened.', 'The ISA can offer you protection and a fair hearing before Fleet Command.', 'I hear you.', 'Go on, I am listening.');
      const s = untilEnd(playH(s0, ['Will you let them go and come out to us?', 'Will you let them go and come out to us?'], false), false);
      expect(knows(s, 'condition')).toBe(false);
      expect(['surrender', 'asylum', 'handed-over']).not.toContain(s.outcome?.id);
    }
  });

  it('with Dr. Osei and the false hostage unmasked, the careful approach wins on every seed tried', () => {
    for (let seed = 1; seed <= 40; seed++) expect(careful(seed).outcome?.success, `seed ${seed}`).toBe(true);
  });

  it('if the planted agent is still talking to the Guard when he walks out, the Guard goes in', () => {
    const s = untilEnd(askOut(holdStannard(P(calmed(startH(AGENT)), 'close the channel'))));
    expect(s.outcome?.id, tail(s)).toBe('strike');
    expect(s.flags.strikeDuringSurrender).toBe(true);
  });

  it('if the accomplice still holds the trigger when he walks out, the relay burns', () => {
    const s = untilEnd(askOut(holdStannard(P(calmed(startH(ACC)), 'close the channel'))));
    expect(s.outcome?.id, tail(s)).toBe('pyre');
  });

  it('unconventional: the supply pod is also a transporter window, and with the core known clean everyone comes out', () => {
    const s = scripts.rescue();
    expect(s.outcome?.success).toBe(true);
    expect(s.flags.forceWhileTalking ?? false).toBe(false);
  });

  it('beaming during the window with a live charge nobody has found sets it off', () => {
    const s = untilEnd(P(startH(ACC), 'hail the relay', 'We will send food across in a pod.', 'wait', 'beam the hostages out'));
    expect(s.outcome?.id, tail(s)).toBe('pyre');
  });

  it('telling the successor the core is wired when the scan says it is clean is a false claim', () => {
    const s = P(startH(AGENT), 'scan the relay core', 'hail Government House', 'The core is wired; your team would set off the charge.');
    expect(s.flags.falseClaim, tail(s)).toBe(true);
  });

  it('do-nothing gives more than one failure across seeds and never a success', () => {
    const ids = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) ids.add(untilEnd(playH(startH(seed), waits(25), false), false).outcome!.id);
    expect(ids.size).toBeGreaterThanOrEqual(2);
    for (const id of ids) expect(HOLLOW_ENDINGS.success).not.toContain(id);
  });
});
