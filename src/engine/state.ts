import type { Contact, LogChannel, Objective, ObjectiveStatus, WorldState } from './types';

/** Pure helpers. Every function returns a new WorldState and never mutates its input. */

export function addLog(s: WorldState, channel: LogChannel, speaker: string, text: string): WorldState {
  return {
    ...s,
    log: [...s.log, { id: s.nextLogId, time: s.time, channel, speaker, text }],
    nextLogId: s.nextLogId + 1,
  };
}

export function updateContact(s: WorldState, id: string, patch: Partial<Contact>): WorldState {
  return { ...s, contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

export function getContact(s: WorldState, id: string): Contact {
  const c = s.contacts.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown contact ${id}`);
  return c;
}

export function setObjective(s: WorldState, id: string, status: ObjectiveStatus): WorldState {
  return { ...s, objectives: s.objectives.map((o) => (o.id === id ? { ...o, status } : o)) };
}

export function addObjective(s: WorldState, o: Objective): WorldState {
  if (s.objectives.some((x) => x.id === o.id)) return s;
  return { ...s, objectives: [...s.objectives, o] };
}

export function setFlag(s: WorldState, flag: string, value = true): WorldState {
  return { ...s, flags: { ...s.flags, [flag]: value } };
}

export function setCounter(s: WorldState, key: string, value: number): WorldState {
  return { ...s, counters: { ...s.counters, [key]: value } };
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Fictional calendar: "Cycle 4127.<day-fraction>" derived from the mission clock. */
export function formatMissionClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `T+${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function formatRange(km: number): string {
  if (km >= 10000) return `${Math.round(km / 1000).toLocaleString('en-US')},000 km`;
  return `${Math.round(km).toLocaleString('en-US')} km`;
}
