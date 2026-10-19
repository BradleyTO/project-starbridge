/**
 * Structured narration requests. The validator, reducer and NPC agents emit
 * Reports (a template key + variables + who should speak). A Narrator turns
 * them into log lines: the offline TemplateNarrator in M2, an AI narrator in M3.
 * Reports never change state.
 */
import type { LogChannel } from './types';

export type SpeakerRole = 'xo' | 'tactical' | 'sensors' | 'helm' | 'comms' | 'engineering' | 'medical' | 'computer' | 'narrator';

export interface Report {
  channel: LogChannel;
  /** A bridge role (resolved to whoever currently holds it) or a specific character id. */
  speaker: SpeakerRole | { character: string } | { label: string };
  key: string;
  vars?: Record<string, string | number>;
}

export const say = (speaker: Report['speaker'], key: string, vars?: Report['vars'], channel: LogChannel = 'crew'): Report => ({ channel, speaker, key, vars });
export const comms = (character: string, key: string, vars?: Report['vars']): Report => ({ channel: 'comms', speaker: { character }, key, vars });
export const sys = (key: string, vars?: Report['vars']): Report => ({ channel: 'system', speaker: 'computer', key, vars });
export const narrate = (key: string, vars?: Report['vars']): Report => ({ channel: 'narrative', speaker: 'narrator', key, vars });
