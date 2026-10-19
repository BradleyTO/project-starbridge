/**
 * Full scripted playthroughs in natural language through the offline
 * interpreter, with invariants checked after every order. Seeds are fixed, so
 * these are exact regression tests of the deterministic simulation.
 */
import { describe, expect, it } from 'vitest';
import { checkInvariants } from '../src/engine/invariants';
import { play, start, textSince } from './helpers';

const EVAC = ['approach the kestrel', 'scan the kestrel', 'wait', 'lower shields and evacuate the crew', 'evacuate the crew'];

function assertEnded(s: ReturnType<typeof start>, id: string) {
  expect(s.outcome?.id, textSince(s).slice(-1500)).toBe(id);
  expect(s.objectives.some((o) => o.status === 'active')).toBe(false);
  expect(checkInvariants(s)).toEqual([]);
}

describe('withdrawal', () => {
  it('rescue then jump out (seed 2) → Rescue and Withdrawal', () => {
    const s = play(start(2), [...EVAC, 'withdraw', 'wait', 'jump']);
    assertEnded(s, 'rescue-withdrawal');
    expect(s.ships.kestrel.souls).toBe(0);
    expect(s.counters.kestrelDead ?? 0).toBe(0);
  });

  it('trapped crew are left behind without a rescue team (seed 1) → Partial Rescue', () => {
    const s0 = start(1);
    expect(s0.variant.complication).toBe('trappedCrew');
    const s = play(s0, [...EVAC, 'withdraw', 'wait', 'jump']);
    assertEnded(s, 'partial-withdrawal');
  });

  it('a rescue team frees the trapped crew (seed 1)', () => {
    const s = play(start(1), [...EVAC, 'send a rescue team to cut them out', 'evacuate the crew', 'withdraw', 'wait', 'jump']);
    expect(s.counters.trapped ?? 0).toBe(0);
    assertEnded(s, 'rescue-withdrawal');
  });

  it('jumping away immediately abandons the Kestrel', () => {
    const s = play(start(7), ['charge the jump drive', 'wait', 'wait', 'jump']);
    assertEnded(s, 'abandoned');
  });
});

describe('diplomacy', () => {
  it('humanitarian + legal arguments open a rescue corridor (seed 5)', () => {
    const s = play(start(5), ['hail the cruiser', 'approach the kestrel', 'tell them this is a humanitarian rescue', 'remind them the border accords forbid this', 'evacuate the crew', 'evacuate the crew', 'wait', 'wait', 'wait']);
    assertEnded(s, 'rescue-corridor');
    expect(s.flags.shotsFired).toBeFalsy();
    expect(s.objectives.find((o) => o.id === 'escalation')?.status).toBe('complete');
  });

  it('evidence from the passenger forces a negotiated release (seed 11, prisoner)', () => {
    const s0 = start(11);
    const s = play(s0, [...EVAC, 'scan the compartment', 'beam the passenger aboard', 'ask the passenger what they know', 'hail the cruiser', 'tell the prefect we have evidence of the labour colonies', 'wait', 'wait', 'wait']);
    assertEnded(s, 'negotiated-release');
    expect(s.characters.passenger.ship).toBe('halcyon');
  });

  it('a personal appeal works when the passenger is his sibling (seed 5)', () => {
    const s0 = start(5);
    expect(s0.variant.passenger).toBe('sibling');
    const s = play(s0, [...EVAC, 'scan the compartment', 'beam the passenger aboard', 'ask the passenger what they know', 'hail the cruiser', 'appeal to the prefect, his sibling is aboard', 'wait', 'wait', 'wait']);
    assertEnded(s, 'negotiated-release');
  });

  it('trading the passenger buys peace (seed 2) → The Price of Peace', () => {
    const s = play(start(2), [...EVAC, 'scan the compartment', 'beam the passenger aboard', 'offer the prefect the passenger in exchange for safe passage', 'wait', 'wait', 'wait', 'wait']);
    assertEnded(s, 'handover');
    expect(s.characters.passenger.ship).toBe('cruiser');
  });
});

describe('science', () => {
  it('Arden lies until trusted, then the compartment scan reveals the passenger', () => {
    let s = play(start(3), ['approach the kestrel', 'ask captain arden what is in the compartment']);
    expect(s.facts.passenger_identity.known).toBe(false);
    s = play(s, ['scan the kestrel', 'wait', 'evacuate the crew', 'scan the compartment']);
    expect(s.facts.passenger_identity.known).toBe(true);
    expect(s.objectives.find((o) => o.id === 'secret')?.status).toBe('complete');
  });

  it('boosted sensors at close range reveal the cruiser’s shield weakness', () => {
    let s = play(start(4), ['divert 50% power from tractor to sensors', 'scan the cruiser']);
    expect(s.facts.cruiser_weakness.known).toBe(false); // too far away
    s = play(s, ['approach the cruiser', 'wait', 'wait', 'scan the cruiser']);
    expect(s.facts.cruiser_weakness.known).toBe(true);
  });
});

describe('combat', () => {
  const FIRE = Array(6).fill('fire torpedoes at their weak point');
  const BEAMS = Array(8).fill('fire');
  it('rescue first, then fight using the weakness (seed 4) → Pyrrhic Victory', () => {
    const s = play(start(4), ['approach the kestrel', 'divert 50% power from tractor to sensors', 'scan the kestrel', 'wait', 'evacuate the crew', 'evacuate the crew', 'scan the cruiser', 'red alert', 'scan the cruiser', 'lock on the cruiser', ...FIRE, ...BEAMS]);
    assertEnded(s, 'cruiser-destroyed');
    expect(s.ships.cruiser.destroyed).toBe(true);
    expect(s.objectives.find((o) => o.id === 'escalation')?.status).toBe('failed');
    // Nobody aboard a destroyed ship is alive or talking.
    expect(s.characters.vane.status).toBe('dead');
  });

  it('sitting under the guns of a hostile cruiser can get the Halcyon destroyed', () => {
    const s = play(start(1), ['approach the cruiser', 'wait', 'wait', 'lock on the cruiser', 'fire', 'wait', 'wait', 'wait', 'wait', 'wait', 'wait', 'wait', 'wait', 'wait', 'wait']);
    expect(['halcyon-lost', 'overwhelmed', 'hollow-victory', 'kestrel-lost']).toContain(s.outcome?.id);
    expect(checkInvariants(s)).toEqual([]);
  });

  it('a hostile lock fails the escalation objective immediately', () => {
    const s = play(start(6), ['lock on the cruiser']);
    expect(s.objectives.find((o) => o.id === 'escalation')?.status).toBe('failed');
    expect(s.ships.cruiser.disposition).toBe('hostile');
  });
});

describe('unconventional', () => {
  it('tractor beam as a shield, then tow the Kestrel out (seed 3)', () => {
    const s = play(start(3), ['approach the kestrel', 'wait', 'wait', 'tractor beam the kestrel and use it as a shield', 'evacuate the crew', 'evacuate the crew', 'lock a tractor beam on the kestrel', 'withdraw', 'wait', 'jump']);
    expect(s.log.some((e) => /scattering screen/.test(e.text))).toBe(true);
    assertEnded(s, 'rescue-withdrawal');
  });

  it('venting plasma hides a covert passenger extraction from the cruiser', () => {
    const s = play(start(2), [...EVAC, 'vent plasma to cover us', 'beam the passenger aboard']);
    expect(s.characters.passenger.ship).toBe('halcyon');
    expect(s.flags.vaneSawPassengerMoved).toBeFalsy();
    const seen = play(start(2), [...EVAC, 'beam the passenger aboard']);
    expect(seen.flags.vaneSawPassengerMoved).toBe(true);
  });

  it('ejecting the Kestrel core is an alternative fix for the reactor', () => {
    const results = new Set<string>();
    for (const seed of [2, 3, 4, 5, 6, 7, 8]) {
      const s = play(start(seed), ['approach the kestrel', 'wait', 'wait', 'eject the kestrel core', 'eject the kestrel core']);
      results.add(s.flags.kestrelStable ? 'stable' : s.ships.kestrel.destroyed ? 'lost' : 'unstable');
    }
    expect(results.has('stable')).toBe(true);
  });

  it('a bluff about reinforcements is judged against the Prefect’s temperament', () => {
    const outcomes = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const s = play(start(seed), ['hail the cruiser', 'tell the cruiser our battle group is right behind us', 'wait']);
      outcomes.add((s.characters.vane.memory.bluffUntil ?? -1) >= 0 ? 'believed' : 'called');
    }
    expect(outcomes).toEqual(new Set(['believed', 'called']));
  });

  it('offering a trade of cargo is evaluated, not ignored', () => {
    const s0 = play(start(5), ['hail the cruiser']);
    const s = play(s0, ['offer them the cargo in exchange for safe passage']);
    expect(textSince(s, s0.nextLogId - 1)).toMatch(/Prefect Sorel Vane/);
    expect(s.characters.vane.memory.patience).not.toBe(s0.characters.vane.memory.patience);
  });

  it('nonsensical improvisation is refused in character and costs time', () => {
    const s0 = start(5);
    const s = play(s0, ['ram them with the saucer section']);
    expect(s.turn).toBe(s0.turn + 1);
  });
});
