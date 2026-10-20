/**
 * DialogueProvider: who answers when the captain talks to another vessel.
 *
 * v0.5 ships an offline, deterministic provider per scenario (structured intents, contextual
 * state, reusable lines with variation). Active Duty can later plug an AI provider in behind
 * the same interface: it receives the same session (CommsState), the classified line and the
 * world, and must return state + Reports. The engine still owns channels, time, promises and
 * every ship action; a provider can only change NPC memory/attitude and add lines.
 */
import type { Applied } from './reduce';
import type { ProposedAction, Party } from './schema';
import type { Rng } from './rng';
import type { CommsPromise, WorldState } from './types';

export type SpeakAction = Extract<ProposedAction, { type: 'speak' }>;

export interface DialogueProvider {
  readonly id: string;
  /** Name shown on the channel indicator ("Prefect Sorel Vane"). */
  speakerName(s: WorldState, party: Party): string;
  /** Vessel name for the indicator ("Ashen Covenant"). */
  vesselName(s: WorldState, party: Party): string;
  /** The other party's first words when the Halcyon opens a channel. */
  greet(s: WorldState, party: Party, rng: Rng, opts: { private: boolean }): Applied;
  /** Answer a line of speech on an open channel. */
  respond(s: WorldState, line: SpeakAction, rng: Rng): Applied;
  /** A promise the captain made has just been broken (the engine detected it). */
  onPromiseBroken(s: WorldState, p: CommsPromise): Applied;
  /** Scenario-specific commitment checks once per order and once per turn. */
  tick?(s: WorldState): Applied;
}
