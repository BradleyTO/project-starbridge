/**
 * Interpreter interface. Milestone 2 ships the deterministic OfflineInterpreter.
 * Milestone 3 can add an AI interpreter (server-side, via /api) that returns
 * the same Interpretation JSON; parseInterpretation() validates it, and the
 * offline interpreter is the fallback on timeout or invalid output.
 */
import type { Clarification, Interpretation } from '../engine/schema';
import type { WorldState } from '../engine/types';

export interface InterpreterContext {
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
}

export interface Interpreter {
  readonly id: string;
  readonly label: string;
  interpret(text: string, ctx: InterpreterContext): Promise<Interpretation>;
}

export function contextFrom(s: WorldState): InterpreterContext {
  const visible = (['kestrel', 'cruiser'] as const).filter((id) => s.ships[id].detected && !s.ships[id].destroyed && !(id === 'cruiser' && s.flags.cruiserGone));
  const known = !!s.facts.passenger_identity?.known;
  const p = s.characters.passenger;
  const damaged = Object.entries(s.ships.halcyon.systems)
    .filter(([id, v]) => v.health > 0 && v.health < 100 && id !== 'reactor')
    .sort((a, b) => a[1].health - b[1].health);
  return {
    visible: [...visible],
    lastTarget: s.lastTarget === 'kestrel' || s.lastTarget === 'cruiser' ? s.lastTarget : null,
    lastCommTarget: (['kestrel', 'cruiser', 'passenger'] as const)[(s.counters.lastCommTarget ?? 0) - 1] ?? null,
    pending: s.clarification,
    passengerKnown: known,
    passengerAwake: p.status === 'active' || p.status === 'injured',
    passengerNames: known ? p.name.toLowerCase().replace(/^dr\.?\s*/, '').split(/\s+/).filter((w) => w.length > 2) : [],
    mostDamaged: damaged[0]?.[0] ?? null,
  };
}
