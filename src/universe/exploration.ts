/**
 * v0.5 (M3.1) the long-range survey on Active Duty: a small, seeded exploration system.
 *
 * Science keeps a list of systems in range. Three carry signs of a civilization that the
 * Agency has never contacted; a fourth is found later by a routine science reading. Each
 * civilization has a hidden disposition: not every one wants to join the Agency. The captain
 * can order a course to investigate (a new canonical start: one credit, like any other), and
 * what first contact settles is written once, through the commit gate.
 */
import { addCareer, addEvent } from './canon';
import { hashSeed } from './hash';
import { contactOutcome, type Approach } from '../engine/firstContact';
export type { Approach };
import type { CanonicalState, Civilization, ContactOutcome, Exploration, ExploredSystem } from './types';

export const STATION = 'station';
export const STATION_NAME = 'the Tessarine patrol station';

const NAMES = ['Ostrava', 'Kepler Vale', 'Ilyria', 'Merrow', 'Castellan', 'Veyra', 'Sable Drift', 'Hadrian', 'Orelle', 'Quillon', 'Teshra', 'Corvane'];
const STARS = ['K2 orange dwarf', 'G5 yellow dwarf', 'M1 red dwarf', 'F8 white star', 'binary K/M pair', 'G2 yellow dwarf'];

/** Original civilizations for the proof of concept (people, leader, where they meet the Halcyon, how they feel about outsiders). */
const CIVS: (Civilization & { hint: string })[] = [
  { id: 'ossari', people: 'Ossari', leader: 'First Listener Tavin Ossu', station: 'Ossari Listening Ring', stationClass: 'Civilian orbital station', souls: 340, disposition: 'open', hint: 'Structured radio emissions on a fourteen-hour cycle — possibly artificial.' },
  { id: 'kethren', people: 'Kethren', leader: 'Warden Isk Hallowmere', station: 'Kethren high platform', stationClass: 'Civilian orbital platform', souls: 120, disposition: 'cautious', hint: 'Regular heat sources in orbit of the fourth planet — too regular for volcanism.' },
  { id: 'lumae', people: 'Lumae', leader: 'Councillor Ves Amaranthe of the Quiet Council', station: 'Lumae orbital lattice', stationClass: 'Civilian orbital lattice', souls: 90, disposition: 'isolationist', hint: 'A lattice of metallic objects in high orbit. No transmissions at all.' },
  { id: 'drassk', people: 'Drassk', leader: 'Holdmaster Varek Dunmoor', station: 'Drassk guardship Iron Patience', stationClass: 'Armed system guardship', souls: 60, disposition: 'guarded', hint: 'Intermittent drive flares near the gas giant — something is moving under power.' },
];

function pick<T>(xs: T[], h: number): T {
  return xs.splice(h % xs.length, 1)[0];
}

/** The survey as it stands on the captain's first day: deterministic from the canonical seed. */
export function seedExploration(seed: number): Exploration {
  const names = [...NAMES];
  const civs = CIVS.map((c) => ({ ...c }));
  const order: (Civilization & { hint: string })[] = [];
  for (let i = 0; i < 4; i++) order.push(pick(civs, hashSeed(seed, `civ:${i}`)));
  const systems: ExploredSystem[] = [];
  for (let i = 0; i < 6; i++) {
    const name = pick(names, hashSeed(seed, `sys:${i}`));
    const civ = i < 4 ? order[i] : null;
    const { hint, ...profile } = civ ?? { hint: '' };
    const detected = i < 3;
    systems.push({
      id: `sys-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      star: STARS[hashSeed(seed, `star:${i}`) % STARS.length],
      distanceLy: 3 + (hashSeed(seed, `d:${i}`) % 150) / 10,
      bearing: hashSeed(seed, `b:${i}`) % 360,
      signal: detected ? 'possible' : 'none',
      note: detected ? hint : 'No artificial signals detected.',
      civ: civ ? (profile as Civilization) : null,
      detectedAt: detected ? 0 : null,
      investigated: false,
      contacted: false,
      outcome: null,
    });
  }
  systems.sort((a, b) => a.distanceLy - b.distanceLy);
  return { location: STATION, systems, investigation: null, delivered: [], lastDeliveryAt: null, traffic: [] };
}

/** Read the survey (a frozen canon's survey is returned as-is: callers must not mutate it outside a commit). */
export function explorationOf(c: { seed: number; exploration?: unknown }): Exploration {
  return (c.exploration as Exploration | undefined) ?? seedExploration(c.seed);
}

/** Mutating helper inside a commit: create the survey on first use. */
export function ensureExploration(d: CanonicalState): Exploration {
  if (!d.exploration) d.exploration = seedExploration(d.seed);
  return d.exploration;
}

export function systemById(e: Exploration, id: string): ExploredSystem | undefined {
  return e.systems.find((x) => x.id === id);
}

/** "Veyra", "the Veyra system", "veyra iv" → the system (or the station). */
export function resolvePlace(e: Exploration, spoken: string): string | null {
  const t = spoken.toLowerCase().replace(/\b(the|system|star|planet|world)\b/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (/\b(station|patrol (area|route|station)|home|base|back|tessarine|agency( space| survey space)?|isa space|concord( space| survey space)?)\b/.test(t)) return STATION;
  const hit = e.systems.find((x) => t.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(t));
  if (hit) return hit.id;
  const civ = e.systems.find((x) => x.civ && x.signal !== 'none' && t.includes(x.civ.people.toLowerCase()) && (x.investigated || x.contacted));
  return civ?.id ?? null;
}

export function placeName(e: Exploration, id: string): string {
  return id === STATION ? STATION_NAME : (systemById(e, id)?.name ?? id);
}

function position(e: Exploration, id: string): { x: number; y: number } {
  const s = id === STATION ? null : systemById(e, id);
  if (!s) return { x: 0, y: 0 };
  const r = (s.bearing * Math.PI) / 180;
  return { x: Math.cos(r) * s.distanceLy, y: Math.sin(r) * s.distanceLy };
}

export function distanceLy(e: Exploration, from: string, to: string): number {
  const a = position(e, from);
  const b = position(e, to);
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 10) / 10;
}

/** Jump-drive transit: an hour and a quarter per light year, never under an hour. */
export function travelHours(e: Exploration, from: string, to: string): number {
  return Math.max(1, Math.round(distanceLy(e, from, to) * 1.25));
}

/** Civilian traffic (distress calls, colony requests) reaches the Halcyon only near the patrol area. */
export function nearPatrolArea(e: Exploration): boolean {
  return distanceLy(e, e.location, STATION) <= 6;
}

/** Detected but not yet contacted: what science lists when the captain asks. */
export function uncontacted(e: Exploration): ExploredSystem[] {
  return e.systems.filter((x) => x.signal !== 'none' && x.civ && !x.contacted);
}

/** A routine science reading finds a civilization nobody had noticed. */
export function detectCivilization(d: CanonicalState, e: Exploration, systemId: string, appVersion: string): ExploredSystem {
  const s = systemById(e, systemId)!;
  const hint = CIVS.find((c) => c.id === s.civ?.id)?.hint ?? 'Possible artificial signals.';
  s.signal = 'possible';
  s.note = hint;
  s.detectedAt = d.clock;
  addEvent(d, { title: `Science reading: possible civilization at ${s.name}`, summary: hint, ships: ['ISV Halcyon'], characters: ['Lt. Oona Varga'], factions: ['concord'], classification: 'exploration', authority: 'observed', status: 'active', missionId: null, decisions: [], consequences: [], links: [] }, appVersion);
  return s;
}

/** The Halcyon reaches an investigated system: science confirms what is there. */
export function arrive(d: CanonicalState, e: Exploration, systemId: string, appVersion: string): ExploredSystem | null {
  e.location = systemId;
  const s = systemById(e, systemId);
  if (!s) return null;
  if (s.civ && e.investigation?.systemId === systemId && !s.investigated) {
    s.investigated = true;
    s.signal = 'confirmed';
    s.note = `${s.civ.people} civilization confirmed. Their ${s.civ.stationClass.toLowerCase()} is in orbit: ${s.civ.station}.`;
    e.investigation.arrivedAt = d.clock;
    addEvent(d, { title: `Investigation: ${s.name}`, summary: `The Halcyon arrived at ${s.name} and confirmed a ${s.civ.people} civilization.`, ships: ['ISV Halcyon', s.civ.station], characters: [], factions: ['concord'], classification: 'exploration', authority: 'captain', status: 'active', missionId: null, decisions: [`Captain ordered a course to investigate ${s.name}.`], consequences: [], links: [] }, appVersion);
  }
  return s;
}

export const OUTCOME_TEXT: Record<ContactOutcome, string> = {
  'membership-talks': 'they asked to open talks on joining the Agency',
  'trade-contact': 'they agreed to trade and keep talking, and made it clear they will not join the Agency',
  'wary-contact': 'contact was made; they remain wary of the Agency',
  declined: 'they declined contact and asked the Halcyon to leave; their wish was respected',
  'warned-off': 'they warned the Halcyon out of their system',
  hostile: 'the meeting went badly; they now regard the Agency as a threat',
};

export function recordContact(d: CanonicalState, e: Exploration, systemId: string, approach: Approach, appVersion: string): ContactOutcome {
  const s = systemById(e, systemId)!;
  const outcome = contactOutcome(s.civ!.disposition, approach);
  s.contacted = true;
  s.outcome = outcome;
  e.investigation = null;
  const text = `First contact with the ${s.civ!.people} at ${s.name}: ${OUTCOME_TEXT[outcome]}.`;
  const ev = addEvent(d, { title: `First contact: the ${s.civ!.people}`, summary: text, ships: ['ISV Halcyon', s.civ!.station], characters: [s.civ!.leader], factions: ['concord'], classification: 'exploration', authority: 'captain', status: 'resolved', missionId: null, decisions: [`Captain's approach: ${approach}.`], consequences: [text], links: [] }, appVersion);
  addCareer(d, text, null, ev.id);
  return outcome;
}
