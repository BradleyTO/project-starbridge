/**
 * v0.6.1: who can speak in the current session, and which voice key each log line belongs to.
 */
import type { LogEntry, WorldState } from '../engine/types';
import type { ScenarioModule } from '../engine/scenario';
import { CREW_PROFILES, GENERIC_PROFILE, LABEL_PROFILES, RELIEF_PROFILES, npcProfile, type VoiceProfile } from './profiles';

export const npcKey = (scenarioId: string, characterId: string) => `npc:${scenarioId}:${characterId}`;

/**
 * Members in casting priority: the computer and bridge crew first (so their voices never depend on
 * the scenario), then the scenario's characters with any hints it declares, then Fleet Command,
 * then relief officers, and last the generic fallback.
 */
export function castMembers(s: WorldState | null, scenario: ScenarioModule | null): VoiceProfile[] {
  const npcs: VoiceProfile[] = [];
  if (s) {
    // A scenario that declares voice hints declares every character who speaks on comms; one that
    // declares none has all its non-crew characters cast with neutral defaults.
    const declared = scenario?.voices?.(s);
    const hints = declared ?? {};
    for (const id of Object.keys(s.characters).sort()) {
      const c = s.characters[id];
      if (c.ship === 'halcyon') continue;
      if (declared && !declared[id]) continue;
      npcs.push(npcProfile(npcKey(s.scenarioId, id), c.name, c.role, hints[id]));
    }
  }
  return [...CREW_PROFILES, ...npcs, ...LABEL_PROFILES, ...RELIEF_PROFILES, GENERIC_PROFILE];
}

/** The voice key of a log line (lines saved before v0.6.1 have none: it is worked out from the speaker's name). */
export function voiceKeyOf(e: Pick<LogEntry, 'speaker' | 'voice'>, s: WorldState | null): string {
  if (e.voice) return e.voice;
  if (e.speaker === 'Ship computer') return 'computer';
  if (e.speaker === 'Narrator') return 'narrator';
  if (s) {
    const name = e.speaker.replace(/ \(injured\)$/, '');
    for (const [id, c] of Object.entries(s.characters)) if (c.name === name) return c.ship === 'halcyon' ? id : npcKey(s.scenarioId, id);
  }
  return `label:${e.speaker}`;
}
