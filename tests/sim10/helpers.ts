import { expect } from 'vitest';
import { gardenerScenario } from '../../src/scenarios/gardener';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { gardener, type GardenerVariant } from '../../src/scenarios/gardener/setup';
import { knows } from '../../src/engine/state';

export const GARDENER_SIM = gardenerScenario;

export function startG(seed: number | string): WorldState {
  return completeIntro(GARDENER_SIM.create(seed), GARDENER_SIM);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playG(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(GARDENER_SIM, s, c);
    if (check) {
      expect(checkInvariants(s), `after "${c}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${c}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playG(s, ['wait'], check);
  return s;
}

/** Wait until a condition holds (or the run ends). */
export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playG(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: GardenerVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(gardener(GARDENER_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|delegat\w*|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Intergalactic|the Agency)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export const HOLD_LINE = 'Hold your charges. Give us time to find out what it is.';
export const PROMISE_LINE = 'I promise we will protect your claims. Hold your charges.';
export const ALIVE_LINE = 'It is alive. Our science officer has proved it.';
export const SPORE_LINE = 'If you burn it, it will scatter spores across every rock you own.';
export const STONE_LINE = 'It is just crystal, not alive. You can cut it out.';
export const GAP_LINE = 'It cannot cross open space. Cut the link to your claims.';

/** On a channel to the tender: say these lines, then close it. */
export const toCrake = (...lines: string[]) => ['hail the tender', ...lines, 'close the channel'];
export const toHaskett = (...lines: string[]) => ['hail the station', ...lines, 'close the channel'];

/** Study, sample by probe, and hold the Claimwarden (with a promise if she needs one). */
export function opening(seed: number | string): WorldState {
  let s = playG(startG(seed), ['Varga, study the growth', 'send a probe to take a sample']);
  const v = gardener(s);
  s = playG(s, toCrake(v.temper === 'frightened' ? PROMISE_LINE : HOLD_LINE));
  return s;
}

/**
 * The careful captain: study first, sample by probe, hold the Claimwarden, and act on what the
 * science officer has established, in the order she establishes it. Uses only what the bridge knows.
 */
export function careful(seed: number | string, route: 'auto' | 'lure' | 'line' | 'dim' = 'auto'): WorldState {
  let s = playG(opening(seed), toHaskett('How does it reach your claims?'));
  const v = gardener(s);
  s = until(s, (x) => knows(x, 'alive'));
  if (v.nature === 'stone') return untilEnd(playG(s, toCrake(STONE_LINE)));
  s = until(s, (x) => knows(x, 'drawn') || !!x.flags.reachWarned);
  if (s.flags.reachWarned) s = playG(s, ['Chief, run cold']);
  s = until(s, (x) => knows(x, 'drawn'));
  if (v.drawn === 'heat' && !s.flags.cold) s = playG(s, ['Chief, run cold']);
  s = until(s, (x) => knows(x, 'habit'));
  if (v.nature === 'sporing') s = playG(s, toCrake(SPORE_LINE));
  const pick = route !== 'auto' ? route : v.link !== 'none' ? 'line' : v.drawn === 'light' ? 'dim' : 'lure';
  if (pick === 'line') s = playG(s, toCrake(GAP_LINE));
  else if (pick === 'dim') s = playG(s, toHaskett('Please dim your floodlights.'));
  else s = playG(s, [`Chief, lay a ${v.drawn} lure`]);
  return untilEnd(s);
}
