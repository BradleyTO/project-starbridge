import type { Character, LogChannel, Ship, ShipId, SystemId, WorldState } from './types';
import { deriveStatus, clamp } from './rules';

/** Pure state helpers. Each returns a new WorldState and never mutates its input. */

export function addLog(s: WorldState, channel: LogChannel, speaker: string, text: string): WorldState {
  return { ...s, log: [...s.log, { id: s.nextLogId, time: s.time, turn: s.turn, channel, speaker, text }], nextLogId: s.nextLogId + 1 };
}

export function patchShip(s: WorldState, id: ShipId, patch: Partial<Ship> | ((ship: Ship) => Partial<Ship>)): WorldState {
  const ship = s.ships[id];
  const p = typeof patch === 'function' ? patch(ship) : patch;
  return { ...s, ships: { ...s.ships, [id]: { ...ship, ...p } } };
}

export function patchSystem(s: WorldState, id: ShipId, sys: SystemId, patch: { health?: number; power?: number }): WorldState {
  return patchShip(s, id, (ship) => {
    const cur = ship.systems[sys];
    const health = clamp(Math.round(patch.health ?? cur.health), 0, 100);
    const power = health <= 0 ? 0 : clamp(Math.round(patch.power ?? cur.power), 0, 150);
    return { systems: { ...ship.systems, [sys]: { health, power, status: deriveStatus({ health, power }) } } };
  });
}

export function patchCharacter(s: WorldState, id: string, patch: Partial<Character> | ((c: Character) => Partial<Character>)): WorldState {
  const c = s.characters[id];
  if (!c) return s;
  const p = typeof patch === 'function' ? patch(c) : patch;
  const next = { ...c, ...p };
  next.trust = clamp(Math.round(next.trust), -100, 100);
  return { ...s, characters: { ...s.characters, [id]: next } };
}

export function adjustTrust(s: WorldState, id: string, delta: number): WorldState {
  return patchCharacter(s, id, (c) => ({ trust: c.trust + delta }));
}

export function setMemory(s: WorldState, id: string, key: string, value: number): WorldState {
  return patchCharacter(s, id, (c) => ({ memory: { ...c.memory, [key]: value } }));
}

export function setFlag(s: WorldState, flag: string, value = true): WorldState {
  return { ...s, flags: { ...s.flags, [flag]: value } };
}

export function setCounter(s: WorldState, key: string, value: number): WorldState {
  return { ...s, counters: { ...s.counters, [key]: value } };
}

export function addTension(s: WorldState, delta: number): WorldState {
  return { ...s, relations: { ...s.relations, tension: clamp(Math.round(s.relations.tension + delta), 0, 100) } };
}

/** Reveal a hidden fact to the player (idempotent). */
export function revealFact(s: WorldState, id: string): WorldState {
  const f = s.facts[id];
  if (!f || f.known) return s;
  return { ...s, facts: { ...s.facts, [id]: { ...f, known: true, discoveredTurn: s.turn } } };
}

export function knows(s: WorldState, factId: string): boolean {
  return !!s.facts[factId]?.known;
}

export function schedule(s: WorldState, kind: string, inTurns: number, data: Record<string, string | number | boolean> = {}): WorldState {
  const id = `${kind}-${s.turn + inTurns}-${s.pending.length}`;
  return { ...s, pending: [...s.pending, { id, kind, dueTurn: s.turn + inTurns, data }] };
}

export function cancelEvents(s: WorldState, kind: string): WorldState {
  return { ...s, pending: s.pending.filter((e) => e.kind !== kind) };
}

export function formatMissionClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `T+${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function formatRange(km: number): string {
  if (km >= 10000) return `${Math.round(km / 1000).toLocaleString('en-US')},000 km`;
  return `${Math.round(km).toLocaleString('en-US')} km`;
}
