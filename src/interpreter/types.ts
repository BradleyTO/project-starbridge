/**
 * Interpreter interface. Milestone 2 ships the deterministic OfflineInterpreter.
 * Milestone 3 can add an AI interpreter (server-side, via /api) that returns
 * the same Interpretation JSON; parseInterpretation() validates it, and the
 * offline interpreter is the fallback on timeout or invalid output.
 */
import type { Clarification, Interpretation } from '../engine/schema';
import type { WorldState } from '../engine/types';
import { leadOf } from '../engine/state';
import { settingOf, type Setting } from '../engine/setting';

export interface InterpreterContext {
  /**
   * v0.7.1: where the ship is (station / simulation <id> / Active Duty mission). The interpreter's
   * vocabulary follows it: a scenario's own names exist only while that scenario runs.
   * Absent (hand-built test contexts): the v0.6 behaviour (the Kestrel's built-in words).
   */
  setting?: Setting;
  visible: ('kestrel' | 'cruiser')[];
  lastTarget: 'kestrel' | 'cruiser' | null;
  /** Last party the captain spoke to (pronouns in speech orders prefer this). */
  lastCommTarget: 'kestrel' | 'cruiser' | 'passenger' | null;
  pending: Clarification | null;
  passengerKnown: boolean;
  passengerAwake: boolean;
  /** Lower-case name tokens for the passenger (only if known to the player). */
  passengerNames: string[];
  /** Most damaged repairable Halcyon system, if any. */
  mostDamaged: string | null;
  /** The Halcyon's current weapons lock, if any (an untargeted "fire" uses it). */
  weaponsTarget?: 'kestrel' | 'cruiser' | null;
  /** v0.5: the channel the captain is talking on (open or muted), if any. */
  channel?: { party: 'kestrel' | 'cruiser' | 'passenger'; state: 'open' | 'muted'; private: boolean } | null;
  /** v0.5: channels on hold. */
  held?: ('kestrel' | 'cruiser' | 'passenger')[];
  /** v0.5: an officer refused an order in the last few minutes (a bare "why?" asks them). */
  recentRefusal?: boolean;
  /** v0.5: on the idle bridge — live (Active Duty) or not, whether a call awaits an answer, survey place names. */
  duty?: { live: boolean; incoming: boolean; places: string[] } | null;
  /** v0.6: the scenario's own words for the two contact slots (absent: the Kestrel's built-in words only). */
  names?: { kestrel: string[]; cruiser: string[] } | null;
  /** v0.6: how clarifying questions name the two contacts ("the Mercy of Ilun"). */
  labels?: { kestrel: string; cruiser: string } | null;
  /** v0.6: the contact-A system an engineering team fixes, and words naming it (absent: the Kestrel's reactor). */
  contactRepair?: string | null;
  contactRepairWords?: string[];
}

export interface Interpreter {
  readonly id: string;
  readonly label: string;
  interpret(text: string, ctx: InterpreterContext): Promise<Interpretation>;
}

export function contextFrom(s: WorldState): InterpreterContext {
  const visible = (['kestrel', 'cruiser'] as const).filter((id) => s.ships[id].detected && !s.ships[id].destroyed && !(id === 'cruiser' && s.flags.cruiserGone));
  const known = !!s.facts.passenger_identity?.known;
  const p = leadOf(s, 'passenger');
  const damaged = Object.entries(s.ships.halcyon.systems)
    .filter(([id, v]) => v.health > 0 && v.health < 100 && id !== 'reactor')
    .sort((a, b) => a[1].health - b[1].health);
  return {
    visible: [...visible],
    lastTarget: s.lastTarget === 'kestrel' || s.lastTarget === 'cruiser' ? s.lastTarget : null,
    lastCommTarget: (['kestrel', 'cruiser', 'passenger'] as const)[(s.counters.lastCommTarget ?? 0) - 1] ?? null,
    pending: s.clarification,
    passengerKnown: known,
    passengerAwake: !!p && (p.status === 'active' || p.status === 'injured'),
    passengerNames: known && p ? p.name.toLowerCase().replace(/^dr\.?\s*/, '').split(/\s+/).filter((w) => w.length > 2) : [],
    mostDamaged: damaged[0]?.[0] ?? null,
    weaponsTarget: s.ships.halcyon.weapons.target === 'kestrel' || s.ships.halcyon.weapons.target === 'cruiser' ? s.ships.halcyon.weapons.target : null,
    channel: activeChannel(s),
    held: (s.comms?.channels ?? []).filter((c) => c.state === 'hold').map((c) => c.party),
    recentRefusal: (s.refusals ?? []).some((r) => r.turn >= s.turn - 3),
    setting: settingOf(s),
    // v0.7.1: on station the only nameable contact is a first-contact civilization actually on sensors.
    ...(s.scenarioId === 'bridge' ? stationNames(s) : {}),
    ...(s.slots ? { names: { kestrel: namesFor(s, 'kestrel'), cruiser: namesFor(s, 'cruiser') }, labels: { kestrel: `the ${s.ships.kestrel.name}`, cruiser: `the ${s.ships.cruiser.name}` }, contactRepair: s.slots.kestrelRepair, contactRepairWords: s.slots.kestrelRepairWords } : {}),
    duty: s.scenarioId === 'bridge' ? { live: !!s.duty?.live, incoming: !!s.duty?.incoming, places: (s.survey?.systems ?? []).map((x) => x.name.toLowerCase()) } : null,
  };
}

/** v0.7.1: station vocabulary — the first-contact party when one is on sensors, otherwise nothing. */
function stationNames(s: WorldState): Pick<InterpreterContext, 'names' | 'labels'> {
  const k = s.ships.kestrel;
  const c = s.duty?.contact;
  const words = k.detected && c ? [c.station, c.people, c.leader, c.system].filter(Boolean).map((w) => w.toLowerCase()) : [];
  return { names: { kestrel: words, cruiser: [] }, labels: { kestrel: k.detected ? `the ${k.name.replace(/^the /i, '')}` : 'no contact', cruiser: 'no second contact' } };
}

/** A slot's words: its ship's declared aliases plus its lead character's name (surname, full name). */
function namesFor(s: WorldState, slot: 'kestrel' | 'cruiser'): string[] {
  const out = new Set((s.ships[slot].aliases ?? []).map((w) => w.toLowerCase()));
  out.add(s.ships[slot].name.toLowerCase());
  const lead = leadOf(s, slot);
  if (lead) {
    const n = lead.name.toLowerCase().replace(/^(capt\.?|captain|cmdr\.?|commander|dr\.?|warden-commander|warden|prefect|lt\.?)\s+/, '');
    out.add(n);
    const last = n.split(/\s+/).pop();
    if (last && last.length > 2) out.add(last);
  }
  return [...out].filter(Boolean);
}

function activeChannel(s: WorldState): InterpreterContext['channel'] {
  const c = s.comms;
  if (!c?.active) return null;
  const ch = c.channels.find((x) => x.party === c.active);
  if (!ch || ch.state === 'hold') return null;
  return { party: ch.party, state: ch.state, private: ch.private };
}
