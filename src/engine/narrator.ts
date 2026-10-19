/**
 * Narrator interface + the offline TemplateNarrator used in Milestone 2.
 * A Milestone 3 AI narrator can implement the same interface (taking the same
 * structured Reports) and fall back to this one on timeout or invalid output.
 */
import type { Report } from './report';
import type { LogChannel, WorldState } from './types';
import type { ScenarioModule } from './scenario';

export interface LogDraft {
  channel: LogChannel;
  speaker: string;
  text: string;
}

export interface Narrator {
  render(reports: Report[], state: WorldState): LogDraft[];
}

export function resolveSpeaker(s: WorldState, scenario: ScenarioModule, speaker: Report['speaker']): string | null {
  if (typeof speaker === 'object' && 'label' in speaker) return speaker.label;
  if (typeof speaker === 'object') {
    const c = s.characters[speaker.character];
    if (!c || c.status === 'dead' || c.status === 'stasis') return null; // the dead and the sleeping do not speak
    return c.name;
  }
  if (speaker === 'computer') return 'Ship computer';
  if (speaker === 'narrator') return 'Narrator';
  const holders = scenario.roleHolders[speaker] ?? [];
  for (const id of holders) {
    const c = s.characters[id];
    if (c && c.status !== 'dead') return c.status === 'injured' ? `${c.name} (injured)` : c.name;
  }
  // With every holder of the post dead, the computer relays the report — unless the ship itself is gone.
  return s.ships.halcyon.destroyed ? null : 'Ship computer';
}

export class TemplateNarrator implements Narrator {
  private readonly scenario: ScenarioModule;
  constructor(scenario: ScenarioModule) {
    this.scenario = scenario;
  }
  render(reports: Report[], state: WorldState): LogDraft[] {
    const out: LogDraft[] = [];
    for (const r of reports) {
      const speaker = resolveSpeaker(state, this.scenario, r.speaker);
      if (!speaker) continue;
      const t = this.scenario.templates[r.key];
      const text = t ? t(r.vars ?? {}, state) : `[${r.key}] ${JSON.stringify(r.vars ?? {})}`;
      if (!text) continue;
      out.push({ channel: r.channel, speaker, text });
    }
    return out;
  }
}
