/**
 * Consistency checks for any WorldState. Used by tests after every step of
 * scripted playthroughs and random fuzzing; returns human-readable violations.
 */
import type { WorldState } from './types';
import { SHIP_IDS, SYSTEM_IDS } from './types';
import { TRACTOR_RANGE, deriveStatus, range } from './rules';

export function checkInvariants(s: WorldState): string[] {
  const v: string[] = [];
  const num = (label: string, x: number, lo: number, hi: number) => {
    if (typeof x !== 'number' || !Number.isFinite(x)) v.push(`${label} is not a finite number (${x})`);
    else if (x < lo || x > hi) v.push(`${label}=${x} outside [${lo}, ${hi}]`);
  };
  num('turn', s.turn, 0, 1000);
  num('tension', s.relations.tension, 0, 100);
  num('torpedoes', s.counters.torpedoes ?? 0, 0, 6);
  num('trapped', s.counters.trapped ?? 0, 0, 10);
  if (!Number.isInteger(s.rng)) v.push('rng state must be an integer');

  for (const id of SHIP_IDS) {
    const sh = s.ships[id];
    num(`${id}.hull`, sh.hull, 0, 100);
    num(`${id}.shields.strength`, sh.shields.strength, 0, 100);
    num(`${id}.containment`, sh.containment, 0, 100);
    num(`${id}.souls`, sh.souls, 0, 10000);
    num(`${id}.jump.charge`, sh.jump.charge, 0, 100);
    if (!Number.isInteger(sh.souls)) v.push(`${id}.souls not an integer`);
    if (!Number.isFinite(sh.position.x) || !Number.isFinite(sh.position.y)) v.push(`${id}.position not finite`);
    if (!Number.isFinite(sh.velocity.x) || !Number.isFinite(sh.velocity.y)) v.push(`${id}.velocity not finite`);
    num(`${id}.heading`, sh.heading, 0, 359.99);
    // Speed never exceeds the ship's nominal limit at maximum engine efficiency.
    const speed = Math.hypot(sh.velocity.x, sh.velocity.y);
    if (speed > sh.perf.maxSpeed * 1.25 + 1) v.push(`${id} speed ${Math.round(speed)} km/s exceeds limit ${sh.perf.maxSpeed}`);
    if (sh.nav && sh.nav.speedFactor > 1) v.push(`${id} nav speed factor above 1`);
    for (const sid of SYSTEM_IDS) {
      const sys = sh.systems[sid];
      num(`${id}.${sid}.health`, sys.health, 0, 100);
      num(`${id}.${sid}.power`, sys.power, 0, 150);
      if (sys.status !== deriveStatus(sys)) v.push(`${id}.${sid}.status ${sys.status} inconsistent with health/power`);
    }
    if (sh.destroyed) {
      if (sh.hull !== 0) v.push(`${id} destroyed but hull ${sh.hull}`);
      if (sh.souls !== 0) v.push(`${id} destroyed but ${sh.souls} souls aboard`);
      if (sh.shields.raised) v.push(`${id} destroyed with shields raised`);
      if (sh.tractor.target) v.push(`${id} destroyed but tractor engaged`);
      if (sh.weapons.state === 'locked') v.push(`${id} destroyed but weapons locked`);
    } else if (sh.hull <= 0 && id !== 'kestrel') v.push(`${id} hull 0 but not destroyed`);
    if (sh.shields.raised && sh.systems.shields.health <= 0) v.push(`${id} shields raised with destroyed generator`);
    if (sh.weapons.state === 'locked' && (!sh.weapons.target || s.ships[sh.weapons.target].destroyed)) v.push(`${id} locked on a missing/destroyed target`);
    if (sh.tractor.target) {
      if (s.ships[sh.tractor.target].destroyed) v.push(`${id} tractor on destroyed ship`);
      else if (range(s, id, sh.tractor.target) > TRACTOR_RANGE * 1.5 + 1) v.push(`${id} tractor beyond reach (${Math.round(range(s, id, sh.tractor.target))} km)`);
    }
  }
  const k = s.ships.kestrel;
  if (!k.destroyed && k.souls === 0 && k.disposition === 'distressed') v.push('Kestrel shows distressed although evacuated');
  if (k.disposition === 'evacuated' && k.souls > 0) v.push('Kestrel marked evacuated with souls aboard');
  if (s.flags.kestrelStable && k.containment <= 0 && !k.destroyed) v.push('stable Kestrel with zero containment');

  for (const c of Object.values(s.characters)) {
    num(`${c.id}.trust`, c.trust, -100, 100);
    if (s.ships[c.ship].destroyed && c.status !== 'dead') v.push(`${c.name} alive aboard destroyed ${c.ship}`);
    const death = c.memory.deathTurn;
    if (c.status === 'dead' && typeof death === 'number') {
      const spoke = s.log.find((e) => e.turn > death && e.speaker.startsWith(c.name));
      if (spoke) v.push(`${c.name} spoke after death: "${spoke.text.slice(0, 40)}"`);
    }
    if (c.status === 'stasis' && c.ship !== 'kestrel' && c.ship !== 'cruiser') v.push(`${c.name} in stasis aboard ${c.ship}`);
  }
  const activeHelm = s.orders.list.filter((o) => o.dept === 'helm' && !o.label.startsWith('Charge jump') && (o.status === 'acknowledged' || o.status === 'underway' || o.maintaining));
  if (activeHelm.length > 1) v.push(`${activeHelm.length} helm manoeuvres active at once`);
  if (s.outcome && s.objectives.some((o) => o.status === 'active')) v.push('objective still active after outcome');
  const ids = s.log.map((e) => e.id);
  if (new Set(ids).size !== ids.length) v.push('duplicate log ids');
  if (s.log.some((e) => e.text.startsWith('['))) v.push(`missing template: ${s.log.find((e) => e.text.startsWith('['))?.text}`);
  return v;
}

/**
 * Checks between consecutive states: no ship moves further in one step than its
 * speed limit allows over the elapsed time (no teleporting). A jump ends the
 * simulation, so it is exempt.
 */
export function checkTransition(prev: WorldState, next: WorldState): string[] {
  const v: string[] = [];
  const dt = Math.max(0, next.time - prev.time);
  for (const id of SHIP_IDS) {
    const a = prev.ships[id];
    const b = next.ships[id];
    if (b.destroyed || next.flags.jumped) continue;
    const moved = Math.hypot(b.position.x - a.position.x, b.position.y - a.position.y);
    const limit = Math.max(a.perf.maxSpeed, s(a), s(b)) * 1.25 * dt + 50;
    if (moved > limit) v.push(`${id} moved ${Math.round(moved)} km in ${dt}s (limit ${Math.round(limit)})`);
    if (next.turn < prev.turn) v.push('time went backwards');
  }
  return v;
}
const s = (sh: { velocity: { x: number; y: number } }) => Math.hypot(sh.velocity.x, sh.velocity.y);
