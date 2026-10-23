import { expect } from 'vitest';
import { reactorScenario } from '../../src/scenarios/reactor';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { reactor, type ReactorVariant } from '../../src/scenarios/reactor/setup';

export const RS = reactorScenario;

export function startR(seed: number | string): WorldState {
  return completeIntro(RS.create(seed), RS);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playR(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    s = submit(RS, s, c);
    if (check) expect(checkInvariants(s), `after "${c}"`).toEqual([]);
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

/** Wait until an ending (or the turn limit). */
export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playR(s, ['wait'], check);
  return s;
}

/** First seed whose variant matches. */
export function seedWhere(pred: (v: ReactorVariant) => boolean, limit = 3000): number {
  for (let i = 1; i <= limit; i++) if (pred(reactor(RS.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK = /\b(Kestrel|Vane|Arden|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Marr|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar)\b|\[[a-zA-Z_]+\]|undefined|NaN/;

/** Diagnose properly: task the Chief, read the coolant loop, and give her the minutes. */
export const DIAGNOSE = ["Okafor, what's failing?", 'scan our ship', 'wait', 'wait'];

/** The fix for a known fault from inside the hull (null when the fix is outside). */
export const INSIDE_FIX: Record<string, string | null> = { sensor: 'Okafor, take the regulator off automatic', pump: 'Okafor, switch to the backup pump', valve: null };

import { knows } from '../../src/engine/state';
import { pm, settled } from '../../src/scenarios/reactor/agents';

/**
 * A careful captain: has the Chief find the fault (with Varga's scan), fixes it from inside the hull
 * when it can be, asks how Paley is before sending her, steadies her if she is frightened, sends the
 * helm instead if she is panicking, and keeps a stored-jump ejection in reserve.
 */
export function careful(seed: number | string): WorldState {
  let s = playR(startR(seed), DIAGNOSE);
  for (let i = 0; i < 4 && !knows(s, 'fault_known'); i++) s = playR(s, ['wait']);
  const v = reactor(s);
  const inside = INSIDE_FIX[v.fault];
  if (inside) s = playR(s, [inside]);
  else if (v.nerve === 'panicked') s = playR(s, ['hail the pod', 'how are you doing?', 'Paley, come back in', 'close the channel', 'Okafor, rig the cold bypass', 'Adeyemi, fly the pod to the manifold']);
  else s = playR(s, ['hail the pod', 'how are you doing?', "take your time, I'm right here with you", 'Paley, go to the valve']);
  for (let i = 0; i < 25 && !s.outcome; i++) {
    if (pm(s).frozen) s = playR(s, ["breathe, Paley. I'm right here with you"]);
    else if (!settled(s) && (s.counters.heat ?? 0) >= 82 && !s.flags.ejectOrdered) s = playR(s, ['charge the jump drive', 'wait', 'eject the core', 'jump home']);
    else s = playR(s, [s.flags.ejected && s.flags.storedJump ? 'jump home' : 'wait']);
  }
  return s;
}
