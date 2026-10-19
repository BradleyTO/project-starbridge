/**
 * Familiarity memory: how this captain talks and what the crew has drilled
 * with them. It persists across BOTH modes, but it is never a record of
 * events: a simulated casualty is counted as training performance only.
 */
import type { TurnResult } from '../engine/turn';
import type { WorldState } from '../engine/types';
import type { Timeline } from '../engine/types';
import type { FamiliarityMemory } from './types';

/** Terms we track to learn the captain's preferred vocabulary. */
const TERMS: [string, RegExp][] = [
  ['hail', /\bhail\b/i],
  ['open a channel', /\bopen (a )?(channel|frequenc)/i],
  ['shields up', /\bshields? up\b|\braise (the |our )?shields?\b/i],
  ['interpose', /\binterpose\b|\bbetween\b/i],
  ['beam', /\bbeam\b/i],
  ['transport', /\btransport\b/i],
];

export function learnFromCommand(f: FamiliarityMemory, timeline: Timeline, text: string, results: TurnResult['results']): FamiliarityMemory {
  const terms = { ...f.terms };
  for (const [term, re] of TERMS) if (re.test(text)) terms[term] = (terms[term] ?? 0) + 1;
  const comms = { ...f.comms };
  const drilled = { ...f.training.drilled };
  const aliases = { ...f.aliases };
  for (const r of results) {
    if (r.status === 'rejected') continue;
    const a = r.action;
    if (a.type === 'communicate' && a.intent === 'open') {
      if (a.onScreen) comms.onScreen += 1;
      else comms.offScreen += 1;
    }
    // Only simulator runs count as drills.
    if (timeline === 'simulation' && a.type === 'maneuver') drilled[a.intent] = (drilled[a.intent] ?? 0) + 1;
    if (a.type === 'learn') aliases[a.phrase.toLowerCase().trim()] = a.meaning.trim();
  }
  return { ...f, terms, comms, aliases, training: { ...f.training, drilled } };
}

export function recordSimulationEnd(f: FamiliarityMemory, final: WorldState): FamiliarityMemory {
  const id = final.outcome?.id ?? 'unfinished';
  const casualties = Object.values(final.characters).filter((c) => c.ship === 'halcyon' && c.status === 'dead').length;
  return {
    ...f,
    training: {
      ...f.training,
      simRuns: f.training.simRuns + 1,
      outcomes: { ...f.training.outcomes, [id]: (f.training.outcomes[id] ?? 0) + 1 },
      simulatedCasualties: f.training.simulatedCasualties + casualties,
    },
  };
}

/** Comms puts hails on screen by default once the captain has clearly shown that preference. */
export function prefersOnScreen(f: FamiliarityMemory): boolean {
  const total = f.comms.onScreen + f.comms.offScreen;
  return f.comms.onScreen >= 3 && f.comms.onScreen / total >= 0.75;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Expand captain-taught phrases ("go dark" → "lower shields and weapons safe") before parsing. */
export function expandAliases(text: string, aliases: Record<string, string>): { text: string; used: string[] } {
  let out = text;
  const used: string[] = [];
  // Longest phrases first so "go dark now" beats "go dark".
  for (const phrase of Object.keys(aliases).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(^|[^a-z])${escapeRe(phrase)}(?=$|[^a-z])`, 'gi');
    if (re.test(out)) {
      used.push(phrase);
      out = out.replace(re, (_m, pre: string) => `${pre}${aliases[phrase]}`);
    }
  }
  return { text: out, used };
}
