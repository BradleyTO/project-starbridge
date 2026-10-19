import { describe, expect, it } from 'vitest';
import { patchCharacter, patchShip, revealFact, setMemory } from '../../src/engine/state';
import { believedHolder } from '../../src/scenarios/kestrel/agents';
import { checkInvariants } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { act, lastId, play, start, textSince } from '../helpers';

function near(s: WorldState, km = 2000): WorldState {
  const k = s.ships.kestrel.position;
  const d = Math.hypot(k.x, k.y);
  return patchShip(s, 'halcyon', { position: { x: k.x - (k.x / d) * km, y: k.y - (k.y / d) * km } });
}

describe('Captain Arden (Kestrel)', () => {
  it('hides the passenger while trust is low, and reveals it when trusted', () => {
    let s = revealFact(near(start(5)), 'compartment_exists');
    s = act(s, { type: 'communicate', target: 'kestrel', intent: 'ask', topic: 'cargo' });
    expect(s.flags.ardenLied).toBe(true);
    expect(s.facts.passenger_identity.known).toBe(false);
    s = patchCharacter(s, 'arden', { trust: 60 });
    s = act(s, { type: 'communicate', target: 'kestrel', intent: 'ask', topic: 'cargo' });
    expect(s.facts.passenger_identity.known).toBe(true);
    expect(s.flags.compartmentOpen).toBe(true);
  });

  it('trusts the Halcyon less after threats', () => {
    const s0 = start(5);
    const s = act(s0, { type: 'communicate', target: 'kestrel', intent: 'warn' });
    expect(s.characters.arden.trust).toBeLessThan(s0.characters.arden.trust + 5);
  });
});

describe('Prefect Vane (cruiser)', () => {
  it('approaches and hails on his own schedule', () => {
    const s = play(start(8), ['wait', 'wait', 'wait', 'wait']);
    expect(s.characters.vane.memory.hailed).toBe(1);
    expect(s.facts.cruiser_intent.known).toBe(true);
  });

  it('loses patience while the Halcyon hovers near the Kestrel, but not when it keeps away', () => {
    const hovering = play(near(start(8)), ['hail the cruiser', 'wait', 'wait', 'wait']);
    const away = play(start(8), ['hail the cruiser', 'take us to 60,000 km from the kestrel', 'wait', 'wait']);
    expect(hovering.characters.vane.memory.patience ?? 0).toBeLessThan(away.characters.vane.memory.patience ?? 0);
  });

  it('retreats when badly damaged, according to temperament', () => {
    let s = start(8);
    s = patchShip(s, 'cruiser', { hull: 20, position: { x: 0, y: 60000 } });
    s = setMemory(s, 'vane', 'hailed', 1);
    s = act(s, { type: 'wait' });
    expect(s.flags.cruiserRetreating).toBe(true);
    for (let i = 0; i < 6; i++) s = act(s, { type: 'wait' });
    expect(s.flags.cruiserGone).toBe(true);
    expect(s.ships.cruiser.detected).toBe(false);
  });

  it('will not fire on the ship he believes carries his quarry', () => {
    const s = play(start(3), ['approach the kestrel', 'scan the kestrel', 'wait', 'evacuate the crew', 'scan the compartment', 'beam the passenger aboard', 'wait', 'wait', 'wait', 'wait']);
    expect(believedHolder(s)).toBe('halcyon');
    expect(s.flags.cruiserFired).toBeFalsy();
    expect(s.ships.halcyon.hull).toBeGreaterThan(80);
  });

  it('returns fire when fired upon', () => {
    let s = start(9);
    s = patchShip(s, 'cruiser', { position: { x: 0, y: 30000 } });
    s = setMemory(s, 'vane', 'hailed', 1);
    s = act(s, { type: 'weapons', mode: 'lock', target: 'cruiser' }, { type: 'weapons', mode: 'fire', target: 'cruiser', weapon: 'beams' });
    expect(s.characters.vane.memory.attacking).toBe(1);
    expect(checkInvariants(s)).toEqual([]);
  });

  it('leaves once his quarry is dead', () => {
    let s = start(8);
    s = patchCharacter(s, 'passenger', { status: 'dead' });
    s = setMemory(s, 'vane', 'hailed', 1);
    s = act(s, { type: 'wait' });
    expect(s.flags.cruiserRetreating).toBe(true);
  });
});

describe('the hidden passenger', () => {
  it('wakes when the stasis pod loses power as containment fails', () => {
    let s = start(8);
    s = patchShip(s, 'kestrel', { containment: 9 });
    s = act(s, { type: 'wait' });
    expect(s.characters.passenger.status).toBe('active');
    expect(textSince(s)).toMatch(/stasis pod is failing/);
  });

  it('dies if left aboard when the Kestrel breaches', () => {
    let s = start(8);
    s = patchShip(s, 'kestrel', { containment: 1 });
    s = act(s, { type: 'wait' }, { type: 'wait' });
    s = act(s, { type: 'wait' });
    expect(s.ships.kestrel.destroyed).toBe(true);
    expect(s.characters.passenger.status).toBe('dead');
    expect(s.characters.arden.status).toBe('dead');
  });
});

describe('own officers', () => {
  it('give one-time advisories rather than repeating them every turn', () => {
    const s = play(start(8), ['wait', 'wait', 'wait', 'wait', 'wait', 'wait']);
    const lines = s.log.map((e) => e.text);
    expect(new Set(lines.filter((l) => /time is passing/i.test(l))).size).toBeLessThanOrEqual(1);
    expect(lines.filter((l) => /time is passing/i.test(l)).length).toBeLessThanOrEqual(1);
  });

  it('a relief officer speaks when the primary is dead; the dead stay silent', () => {
    let s = start(8);
    s = patchCharacter(s, 'rask', { status: 'dead', memory: { deathTurn: s.turn } });
    const from = lastId(s);
    s = play(s, ['raise shields']);
    const t = textSince(s, from);
    expect(t).not.toMatch(/Teodor Rask:/);
    expect(t).toMatch(/Shields up/);
    expect(checkInvariants(s)).toEqual([]);
  });
});
