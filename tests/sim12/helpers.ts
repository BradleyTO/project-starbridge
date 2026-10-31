import { expect } from 'vitest';
import { emberScenario } from '../../src/scenarios/embertide';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { ember, bankable, type EmberVariant } from '../../src/scenarios/embertide/setup';

export const EMBER_SIM = emberScenario;
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;

export function startE(seed: number | string): WorldState {
  return completeIntro(EMBER_SIM.create(seed), EMBER_SIM);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playE(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(EMBER_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playE(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playE(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: EmberVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(ember(EMBER_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|delegat\w*|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Penhale|Corley|Toller|Hadley|Intergalactic|the Agency)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export const toStrome = (...lines: string[]) => ['hail the outpost', ...lines, 'close the channel'];
export const toFerrier = (...lines: string[]) => ['hail the lifter', ...lines, 'close the channel'];

export const CARRY_LINE = 'Carry people, not ore.';
export const WHY_LINE = 'The flare will kill anyone left in the open.';
export const COME_IN_LINE = 'Come in now, because our science officer says the flare is minutes away.';
export const BARE_COME_IN = 'Come in and dock with us.';
export const BARE_CARRY = 'Carry people for us.';
export const shareLine = (s: WorldState) => `Our science officer's forecast: the flare comes no sooner than ${c(s, 'lo') - s.turn} minutes from now.`;
export const DAWN_LINE = "It is not the flare. Our science officer says it's a false dawn. Keep working.";
export const PLENTY_LINE = 'You have plenty of time. Nothing will happen.';

/** Reading the star with everything the Halcyon has, lifting at once, the lifter warned, the forecast shared. */
export function opening(seed: number | string, opts: { probe?: boolean; boost?: boolean } = {}): WorldState {
  let s = playE(startE(seed), ['begin the evacuation', 'Varga, forecast the flare']);
  if (opts.boost !== false) s = playE(s, ['boost the sensors']);
  if (opts.probe !== false) s = playE(s, ['launch a probe toward the star']);
  s = playE(s, toFerrier(CARRY_LINE, WHY_LINE));
  s = playE(s, ['hail the outpost']);
  s = playE(s, [shareLine(s), 'close the channel']);
  return s;
}

/** One minute of the careful captain's watch: decide from what the bridge knows, or wait. */
export interface Watch { team?: boolean; pull?: boolean; shadow?: boolean }
export function carefulStep(s: WorldState, w: Watch = {}): WorldState {
  const lo = c(s, 'lo');
  if (s.flags.falseDawn && s.flags.falseDawnCalled && !s.flags.reassured && !s.flags.banked && c(s, 'liftOrderedAt') === 0 && c(s, 'bank') > 0) return playE(s, toStrome(DAWN_LINE));
  if (c(s, 'bank') > 0 && !s.flags.banked && c(s, 'liftOrderedAt') === 0) {
    if (w.team !== false && !s.flags.teamSent && c(s, 'bankDone') + 2 > lo && c(s, 'bankDone') - 3 + 2 <= lo && s.turn + 4 < lo) return playE(s, ['Chief, send a team down to help bank the furnace']);
    if (w.pull !== false && s.turn + 3 >= lo && c(s, 'bankDone') > s.turn + 1) return playE(s, ['Tell Strome to pull the banking crew']);
  }
  if (w.shadow !== false && !s.flags.inShadow && c(s, 'shadowOrderedAt') === 0 && s.turn + 4 >= lo) return playE(s, ["Helm, take us into the moon's shadow"]);
  return playE(s, ['wait']);
}

export type Route = 'auto' | 'noTeam' | 'shelter';

/**
 * The careful captain: reads the star, lifts early, warns the lifter, holds the furnace crew exactly
 * as long as the forecast allows, and acts only on what the bridge knows.
 * 'noTeam' keeps the ship's engineers aboard; 'shelter' has Varga sound the galleries first and
 * shelters the outpost below ground if, and only if, she finds them deep and dry.
 */
export function careful(seed: number | string, route: Route = 'auto', opts: { probe?: boolean; boost?: boolean } = {}): WorldState {
  let s: WorldState;
  if (route === 'shelter') {
    s = playE(startE(seed), ['Varga, survey the galleries', 'Varga, forecast the flare']);
    s = until(s, (x) => knows(x, 'galleries'));
    if (ember(s).galleries === 'deep') {
      s = playE(s, toFerrier(COME_IN_LINE));
      s = playE(s, toStrome('Take everyone into the lower galleries.'));
      for (let i = 0; i < 40 && !s.outcome; i++) s = !s.flags.inShadow && c(s, 'shadowOrderedAt') === 0 && s.turn + 4 >= c(s, 'lo') ? playE(s, ["Helm, take us into the moon's shadow"]) : playE(s, ['wait']);
      return s;
    }
    s = playE(s, ['begin the evacuation', ...toFerrier(CARRY_LINE, WHY_LINE)]);
    s = playE(s, ['hail the outpost']);
    s = playE(s, [shareLine(s), 'close the channel']);
  } else s = opening(seed, opts);
  for (let i = 0; i < 40 && !s.outcome; i++) s = carefulStep(s, { team: route !== 'noTeam' });
  return s;
}

/** Keep the careful watch (with some duties dropped) until the run ends. */
export function watch(s: WorldState, w: Watch): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = carefulStep(s, w);
  return s;
}

export { ember, bankable };
