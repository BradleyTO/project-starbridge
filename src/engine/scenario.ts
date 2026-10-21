import type { Rng } from './rng';
import type { Applied, ScenarioHooks } from './reduce';
import type { Objective, Outcome, ShipId, WorldState } from './types';
import type { SpeakerRole } from './report';
import type { VoiceHint } from '../voice/profiles';

export type TemplateFn = (vars: Record<string, string | number>, s: WorldState) => string;

/** Everything scenario-specific the generic engine needs. */
export interface ScenarioModule {
  id: string;
  title: string;
  create(seed: number | string): WorldState;
  /** Timed exposition beats played before the first order. */
  intro: ((s: WorldState) => Applied)[];
  hooks: ScenarioHooks;
  /** Independent NPC agents + environment + pending events, once per turn. */
  simulate(s: WorldState, rng: Rng): Applied;
  objectives(s: WorldState, ended: boolean): Objective[];
  detectOutcome(s: WorldState): Outcome | null;
  templates: Record<string, TemplateFn>;
  roleHolders: Record<Exclude<SpeakerRole, 'computer' | 'narrator'>, readonly string[]>;
  /** Context-sensitive order suggestions for the UI (and the XO's "options"). */
  suggestions(s: WorldState): string[];
  /** Player-visible sensor details for a contact (only what the crew actually knows). */
  contactDetails(s: WorldState, id: ShipId): string[];
  /** v0.6.1 (optional): voice hints for the scenario's own characters, by character id. */
  voices?(s: WorldState): Record<string, VoiceHint>;
}
