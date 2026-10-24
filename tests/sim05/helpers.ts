import { expect } from 'vitest';
import { saltglassScenario } from '../../src/scenarios/saltglass';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { saltglass, type SaltglassVariant } from '../../src/scenarios/saltglass/setup';

export const SG = saltglassScenario;

export function startS(seed: number | string): WorldState {
  return completeIntro(SG.create(seed), SG);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playS(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    s = submit(SG, s, c);
    if (check) expect(checkInvariants(s), `after "${c}"`).toEqual([]);
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

/** Wait until an ending (or the turn limit). */
export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playS(s, ['wait'], check);
  return s;
}

/** First seed whose variant matches. */
export function seedWhere(pred: (v: SaltglassVariant) => boolean, limit = 3000): number {
  for (let i = 1; i <= limit; i++) if (pred(saltglass(SG.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK = /\b(Kestrel|Vane|Arden|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Marr|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern)\b|\[[a-zA-Z_]+\]|undefined|NaN/;

import { DELEGATE_SHORT, type Clan } from '../../src/scenarios/saltglass/setup';

export const other = (c: Clan): Clan => (c === 'rhune' ? 'tarvo' : 'rhune');
export const softOf = (v: SaltglassVariant): Clan => other(v.hard);
export const short = (c: Clan) => DELEGATE_SHORT[c];

/**
 * A careful mediator: reads the room, hears the moderate in private and asks leave, sends Marrow to
 * the hardliner, secures a standstill, and lets the moderate put the need on the table herself.
 * Leaves the table with both needs said and both delegates listening; terms are up to the caller.
 */
export function careful(seed: number | string): WorldState {
  const s0 = startS(seed);
  const v = saltglass(s0);
  const soft = softOf(v);
  let s = playS(s0, [
    'Szabo, how do they sound?',
    `open a private channel to ${short(soft)}`,
    'What do you really need?',
    'May I raise that at the table?',
    'close the channel',
    `Marrow, have a quiet word with ${short(v.hard)}`,
    `open a channel to ${short(soft)}`,
    'Thank you for coming. I hear you.',
    'Will you both agree to a standstill on the ice while we talk?',
    'wait',
    'wait',
  ]);
  s = playS(s, [`open a channel to ${short(soft)}`, 'Would you tell them what you told me?']);
  return s;
}
