/** Deterministic weapons resolution, damage, and destruction. */
import type { Rng } from './rng';
import type { Report } from './report';
import { narrate, say } from './report';
import type { ShipId, SystemId, WorldState } from './types';
import { SYSTEM_IDS } from './types';
import { BEAM_RANGE, TORPEDO_RANGE, clamp, efficiency, range } from './rules';
import { addTension, patchCharacter, patchShip, patchSystem, setCounter, setFlag } from './state';

export interface AttackResult {
  state: WorldState;
  reports: Report[];
  hit: boolean;
  hullDamage: number;
}

const BASE_DAMAGE: Record<ShipId, { beams: number; torpedoes: number }> = {
  halcyon: { beams: 18, torpedoes: 34 },
  cruiser: { beams: 20, torpedoes: 30 },
  kestrel: { beams: 0, torpedoes: 0 },
};

export function weaponRange(weapon: 'beams' | 'torpedoes'): number {
  return weapon === 'beams' ? BEAM_RANGE : TORPEDO_RANGE;
}

/**
 * Resolve one attack. Escalation flags are set by the caller's context
 * (player vs NPC); this function only handles physics and damage.
 */
export function resolveAttack(
  s: WorldState,
  attacker: ShipId,
  target: ShipId,
  weapon: 'beams' | 'torpedoes',
  rng: Rng,
  opts: { aimAtWeakness?: boolean; protectedBy?: 'tractorShield' | 'shieldExtend' | null } = {},
): AttackResult {
  const reports: Report[] = [];
  const a = s.ships[attacker];
  const t = s.ships[target];
  if (a.destroyed || t.destroyed) return { state: s, reports, hit: false, hullDamage: 0 };
  const d = range(s, attacker, target);
  if (d > weaponRange(weapon)) return { state: s, reports, hit: false, hullDamage: 0 };

  s = { ...s, fx: [...s.fx, { kind: weapon === 'beams' ? 'beam' : 'torpedo', from: attacker, to: target }] };

  let hitChance = 0.85 - (d / weaponRange(weapon)) * 0.2;
  if (s.counters[`evasive_${target}`] === s.turn) hitChance -= 0.3;
  if (s.variant.complication === 'ionStorm') hitChance -= 0.08;
  const hit = rng.next() < clamp(hitChance, 0.2, 0.95);
  if (!hit) return { state: s, reports, hit: false, hullDamage: 0 };

  const eff = Math.max(0.2, efficiency(a, 'weapons'));
  let dmg = Math.round(BASE_DAMAGE[attacker][weapon] * eff * (0.8 + rng.next() * 0.4));
  if (opts.protectedBy === 'tractorShield') dmg = Math.round(dmg * 0.4);
  if (opts.protectedBy === 'shieldExtend') dmg = Math.round(dmg * 0.5);

  // Shields absorb first (unless a known emitter weakness is exploited by torpedoes).
  let toHull = dmg;
  if (t.shields.raised && t.shields.strength > 0) {
    const bypass = opts.aimAtWeakness && weapon === 'torpedoes' ? 0.75 : 0;
    const shielded = dmg * (1 - bypass);
    const absorb = Math.min(shielded, t.shields.strength * Math.max(0.3, efficiency(t, 'shields')));
    toHull = Math.round(dmg - absorb);
    const strength = clamp(Math.round(t.shields.strength - absorb * 1.15), 0, 100);
    s = patchShip(s, target, { shields: { raised: strength > 0, strength } });
    if (strength === 0) reports.push(say(target === 'halcyon' ? 'tactical' : 'tactical', target === 'halcyon' ? 'shieldsCollapsed' : 'enemyShieldsDown', { ship: t.name }));
  }
  toHull = Math.max(0, toHull);
  if (toHull > 0) {
    const hull = clamp(s.ships[target].hull - toHull, 0, 100);
    s = patchShip(s, target, { hull });
    // Collateral system damage.
    const candidates = SYSTEM_IDS.filter((id) => s.ships[target].systems[id].health > 0);
    if (candidates.length) {
      const sysId: SystemId = rng.pick(candidates);
      s = patchSystem(s, target, sysId, { health: s.ships[target].systems[sysId].health - Math.round(toHull * 1.6) });
    }
    if (target === 'kestrel') s = patchShip(s, 'kestrel', (k) => ({ containment: clamp(k.containment - 6, 0, 100) }));
    if (target === 'halcyon') s = injureOfficer(s, toHull, rng, reports);
    if (hull <= 0) s = destroyShip(s, target, reports);
  }
  return { state: s, reports, hit: true, hullDamage: toHull };
}

const BRIDGE_IDS = ['rask', 'varga', 'adeyemi', 'szabo', 'okafor', 'marrow'];

function injureOfficer(s: WorldState, damage: number, rng: Rng, reports: Report[]): WorldState {
  if (damage < 10 || !rng.chance(0.35)) return s;
  const living = BRIDGE_IDS.filter((id) => s.characters[id] && s.characters[id].status !== 'dead');
  if (!living.length) return s;
  const id = rng.pick(living);
  const c = s.characters[id];
  const fatal = c.status === 'injured' && s.ships.halcyon.hull < 30 && rng.chance(0.4);
  s = patchCharacter(s, id, fatal ? { status: 'dead', memory: { ...c.memory, deathTurn: s.turn } } : { status: 'injured' });
  reports.push(say('medical', fatal ? 'officerKilled' : 'officerInjured', { name: c.name, role: c.role }));
  return s;
}

export function destroyShip(s: WorldState, id: ShipId, reports: Report[], opts: { quiet?: boolean } = {}): WorldState {
  const ship = s.ships[id];
  if (ship.destroyed) return s;
  const souls = ship.souls;
  const systems = { ...ship.systems };
  for (const k of SYSTEM_IDS) systems[k] = { health: 0, power: 0, status: 'destroyed' };
  s = patchShip(s, id, { destroyed: true, hull: 0, souls: 0, systems, shields: { raised: false, strength: 0 }, weapons: { state: 'safe', target: null }, tractor: { target: null }, disposition: 'destroyed' });
  // Release any locks or tractor beams on the wreck.
  for (const other of ['halcyon', 'kestrel', 'cruiser'] as ShipId[]) {
    const o = s.ships[other];
    if (o.tractor.target === id) s = patchShip(s, other, { tractor: { target: null } });
    if (o.weapons.target === id) s = patchShip(s, other, { weapons: { state: o.weapons.state === 'safe' ? 'safe' : 'armed', target: null } });
  }
  for (const c of Object.values(s.characters)) {
    if (c.ship === id && c.status !== 'dead') s = patchCharacter(s, c.id, { status: 'dead', memory: { ...c.memory, deathTurn: s.turn } });
  }
  if (id === 'kestrel') s = setCounter(s, 'kestrelDead', (s.counters.kestrelDead ?? 0) + souls);
  s = { ...s, fx: [...s.fx, { kind: 'explosion', from: id, to: id }] };
  s = setFlag(s, `${id}Destroyed`);
  s = addTension(s, id === 'kestrel' ? 15 : 40);
  if (!opts.quiet) reports.push(narrate('shipDestroyed', { ship: ship.name, souls }));
  return s;
}
