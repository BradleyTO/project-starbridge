import { expect } from 'vitest';
import { starfallScenario } from '../../src/scenarios/starfall';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { starfall, type StarfallVariant } from '../../src/scenarios/starfall/setup';

export const STAR_SIM = starfallScenario;
const c = (s: WorldState, k: string) => s.counters[k] ?? 0;

export function startS(seed: number | string): WorldState {
  return completeIntro(STAR_SIM.create(seed), STAR_SIM);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playS(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(STAR_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playS(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playS(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: StarfallVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(starfall(STAR_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Tamber|Stavely|Seraphine|Vory|Stern Mercy|Calderon|Seventh Bell|Harrow Lane|Intergalactic|the Agency)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export const toKemble = (...lines: string[]) => ['hail the habitat', ...lines, 'close the channel'];
export const toQuell = (...lines: string[]) => ['hail the yacht', ...lines, 'close the channel'];

export const ASK_COUNT = 'Is everyone aboard on your manifest?';
export const TELL_SCOOP = 'Our scan shows people in the lower scoop works. Bring them up to the ring.';

export type Route = 'line' | 'duarte' | 'plain';

/**
 * The careful captain: asks the Chief what the hull will take, gives the helm to Adeyemi and means
 * it (steadying him first if he needs it), has Varga count the living at the first dock, asks for
 * the pilot's read once he has flown it, and stays inside the Chief's limit unless people would
 * otherwise be left. 'duarte' gives the senior pilot the helm instead; 'plain' keeps Adeyemi but
 * never asks his read.
 */
export function careful(seed: number | string, route: Route = 'line'): WorldState {
  let s = startS(seed);
  s = playS(s, ['Chief, how much can the hull take?']);
  const count = 'Varga, count the life signs aboard the habitat. Take us down.';
  if (route === 'duarte') return carefulWatch(playS(s, [`Lt. Duarte, take the helm. ${count}`]), route);
  const steady = starfall(s).nerve === 'shaken' ? 'Adeyemi, take a breath, I trust you. ' : '';
  const helm = route === 'line' ? 'Adeyemi, the helm is yours, fly it your way. ' : '';
  s = playS(s, [`${steady}${helm}Adeyemi, break off at the Chief's limit. ${count}`]);
  return carefulWatch(s, route);
}

export function carefulWatch(s: WorldState, route: Route = 'line'): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) {
    if (s.flags.countFound && !s.flags.scoopUp) s = playS(s, toKemble(TELL_SCOOP));
    else if (route === 'line' && c(s, 'trips') >= 1 && !s.flags.lineOffered && !s.flags.askedPilot) s = playS(s, ['Adeyemi, how would you fly it?']);
    else if (s.flags.lineOffered && !s.flags.lineApproved && route !== 'duarte') s = playS(s, ['Fly your line.']);
    else if (s.flags.paused && c(s, 'upper') > 0 && !s.flags.rescueOn) s = playS(s, ['one more descent']);
    else s = playS(s, ['wait']);
  }
  return s;
}

export { starfall, knows };

/**
 * The same watch as the careful captain, but nobody asks the Chief and nobody sets a limit: the
 * ship goes down again whenever there are people waiting.
 */
export function blind(seed: number | string, route: Route = 'plain'): WorldState {
  const helm = route === 'line' ? 'Adeyemi, the helm is yours, fly it your way. ' : route === 'duarte' ? 'Lt. Duarte, take the helm. ' : '';
  const s = playS(startS(seed), [`${helm}Varga, count the life signs aboard the habitat. Take us down.`]);
  return carefulWatch(s, route);
}

/** Flying the ship from the chair: orders to the pilot in the middle of every descent. */
export function fromTheChair(seed: number | string): WorldState {
  let s = playS(startS(seed), ['Varga, count the life signs aboard the habitat. Take us down.']);
  for (let i = 0; i < 40 && !s.outcome; i++) {
    if (s.flags.countFound && !s.flags.scoopUp) s = playS(s, toKemble(TELL_SCOOP));
    else if ((s.counters.tripStart ?? 0) > 0 && (s.counters.tripOverrides ?? 0) < 2) s = playS(s, [(s.counters.tripOverrides ?? 0) === 0 ? 'Adeyemi, bank left.' : 'Adeyemi, more power.']);
    else if (s.flags.paused && c(s, 'upper') > 0) s = playS(s, ['one more descent']);
    else s = playS(s, ['wait']);
  }
  return s;
}

/** Cutting the scoop works loose (with a reason the company will accept) and towing the habitat out. */
export function cutAndTow(seed: number | string, pilotLine = 'Adeyemi, the helm is yours, fly it your way.'): WorldState {
  let s = playS(startS(seed), ['Chief, how much can the hull take?', `${pilotLine} Tell Factor Kemble to cut the scoop works loose because the people aboard will die otherwise.`]);
  s = until(s, (x) => !!x.flags.cutLoose);
  s = playS(s, ['Adeyemi, take the habitat in tow']);
  return untilEnd(s);
}
