/** Training Simulation 007 — Ghost Ledger: a scripted playthrough to every ending. */
import { afterAll, describe, expect, it } from 'vitest';
import type { WorldState } from '../../src/engine/types';
import { LEDGER_ENDINGS } from '../../src/scenarios/ledger/outcome';
import { proven } from '../../src/scenarios/ledger/agents';
import { ledger } from '../../src/scenarios/ledger/setup';
import { LEAK, investigate, logText, nameFor, otherThan, playL, seedWhere, startL, untilEnd } from './helpers';

const reached = new Set<string>();
function ending(s: WorldState, id: string) {
  expect(s.outcome?.id, logText(s).slice(-2500)).toBe(id);
  expect(logText(s)).not.toMatch(LEAK);
  expect(logText(s)).not.toMatch(/Intergalactic Agency|the Agency/);
  reached.add(id);
  return s;
}

const CARRY = seedWhere((v) => v.exfil === 'carry');
const BURST = seedWhere((v) => v.exfil === 'burst');

describe('success endings', () => {
  it('unmasked: the evidence points to one guest alone, and the captain makes the case', () => {
    const s = investigate(CARRY);
    expect(proven(s)).toBe(true);
    const c = ledger(s).culprit;
    ending(playL(s, [`detain ${nameFor(c)}`]), 'unmasked');
  });

  it('counter-feed: a proven thief is allowed to leave with false keys', () => {
    const s = untilEnd(playL(investigate(CARRY), ['Rask, feed them false keys']));
    expect(s.flags.counterFed).toBe(true);
    ending(s, 'counter-feed');
  });

  it('counter-feed: a thief who sends rather than carries sends Okafor’s keys', () => {
    const s = playL(investigate(BURST), ['Rask, feed them false keys']);
    ending(untilEnd(s), 'counter-feed');
    expect(s.flags.feedSent || untilEnd(s).flags.feedSent).toBe(true);
  });

  it('quiet-word: with the evidence in hand, the handler returns the copy, on the record', () => {
    const s = playL(investigate(CARRY), ['hail Courier-Captain Thorne', 'We know your agent copied our keys.', 'Return the copy quietly and we will call it done. It goes in my log.']);
    ending(s, 'quiet-word');
    expect(s.flags.offRecord).toBeFalsy();
  });

  it('caught-in-the-act: outbound traffic watched, and the burst held on the array', () => {
    const s = untilEnd(playL(startL(BURST), ['Szabo, watch all outbound traffic']));
    ending(s, 'caught-in-the-act');
  });
});

describe('partial endings', () => {
  it('locks-changed: the keys rekeyed, the thief never found', () => {
    ending(untilEnd(playL(startL(CARRY), ['Chief, rekey the navigation keys'])), 'locks-changed');
  });

  it('locks-changed: a burst of worthless keys after the rekey', () => {
    ending(untilEnd(playL(startL(BURST), ['Chief, rekey the navigation keys'])), 'locks-changed');
  });

  it('hunch-without-proof: the right guest, held over Rask’s caution', () => {
    const c = ledger(startL(CARRY)).culprit;
    const s = playL(startL(CARRY), [`detain ${nameFor(c)}`]);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/before I hold/);
    ending(playL(s, [`detain ${nameFor(c)}`]), 'hunch-without-proof');
  });
});

describe('failure endings', () => {
  it('wrong-guest: an innocent guest held over Rask’s caution', () => {
    const g = otherThan(ledger(startL(CARRY)).culprit)[0];
    ending(playL(startL(CARRY), [`detain ${nameFor(g)}`, `detain ${nameFor(g)}`]), 'wrong-guest');
  });

  it('keys-gone: nobody does anything, and the copy walks off the ship', () => {
    ending(untilEnd(startL(CARRY)), 'keys-gone');
  });

  it('keys-gone: or is sent off it', () => {
    const s = untilEnd(startL(BURST));
    ending(s, 'keys-gone');
    expect(s.turn).toBeLessThan(ledger(s).departTurn);
  });

  it('guest-harmed: force ordered on a guest after Rask refuses', () => {
    const s = playL(startL(CARRY), ['interview Mr Vesk', 'restrain him']);
    expect(s.outcome).toBeNull();
    expect(logText(s)).toMatch(/I won't lay hands on anyone/);
    ending(playL(s, ['restrain him']), 'guest-harmed');
  });

  it('diplomatic-incident: a tractor beam on a Directorate diplomatic courier', () => {
    ending(untilEnd(playL(startL(CARRY), ['tractor beam on the Amber Script'])), 'diplomatic-incident');
  });
});

afterAll(() => {
  const all = [...LEDGER_ENDINGS.success, ...LEDGER_ENDINGS.partial, ...LEDGER_ENDINGS.failure];
  expect([...reached].sort()).toEqual([...all].sort());
});
