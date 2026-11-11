import { expect } from 'vitest';
import { ninefoldScenario } from '../../src/scenarios/ninefold';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { isGap, nextGap, nine, tranHurt, type NinefoldVariant } from '../../src/scenarios/ninefold/setup';

export const NL_SIM = ninefoldScenario;

export function startN(seed: number | string): WorldState {
  return completeIntro(NL_SIM.create(seed), NL_SIM);
}

export function playN(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(NL_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playN(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30, check = true): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playN(s, ['wait'], check);
  return s;
}

export function seedWhere(pred: (v: NinefoldVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(nine(NL_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names from every other simulation (and setting words the handbook must not use). */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Plumb Line|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Tamber|Stavely|Seraphine|Vory|Stern Mercy|Calderon|Seventh Bell|Harrow Lane|Caradoc|Thistledown|Kemble|Quell|Dividend|Starfall|habitat|Hagfish|Draycott|Skerrit|Veyl|Gavel|Grist|Bryony|Citrine|Nessa|Prism|Looking Glass|Glass Nebula|Askel|Lirra|Soth|Yasha|Toras|Brask|Quiet Stone|Orun|Kesh Varo|Meridian|Quarrie|Marit|Anwen|Bastian|Greywall|Weather Engine|Aubrel|Ostrin|Mallory|Severin|Stannard|Tamsin|Rook|Civic Guard|Government House|hostages?|Intergalactic|the Agency|Lysa Venn|Teo Maras|Vagrant|Corriden|Lisle|Aalto|Benedikt|Lodestar|neutron)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export { nine, knows, isGap, nextGap, tranHurt };

const P = (s: WorldState, ...c: string[]) => playN(s, c);

/** Hold until the given turn (waiting), unless the run ends first. */
export function toTurn(s: WorldState, t: number, check = true): WorldState {
  return until(s, (x) => x.turn >= t, 40, check);
}

/** The approach order that the Watch, as Rask has read it, will let through. */
export function approachFor(v: NinefoldVariant): string {
  return v.trigger === 'emission' ? 'take us in' : v.trigger === 'haste' ? 'take us in slowly' : 'take us in cold';
}

/**
 * The evidence routine: hail the team, hear what happened on the pad, pull the shuttle's log and
 * ask Rask what the Watch answers to. Afterwards the trigger is known on every seed.
 */
export function evidence(seed: number | string): WorldState {
  return P(startN(seed), 'hail Lieutenant Kaminski', 'what happened on the pad?', 'close the channel', "Szabo, pull the Pipit's log", 'Rask, what sets off the Watch?');
}

/** Through the Gap, by the book: evidence, a matching approach, watch the screen, time the beam. */
export function gapRun(seed: number | string): WorldState {
  let s = evidence(seed);
  const v = nine(s);
  s = P(s, approachFor(v), 'Varga, watch the screen');
  s = until(s, (x) => knows(x, 'cycle') && (x.counters.range ?? 0) === 2, 30);
  s = P(s, 'beam them out at the next gap');
  return untilEnd(s);
}

/** The keystone route: read whatever the question needs off the depot, then answer it. */
export function keystoneRun(seed: number | string): WorldState {
  let s = P(startN(seed), 'Rask, what is this thing?');
  const v = nine(s);
  s = until(s, (x) => knows(x, 'question'), 10);
  const look = v.question === 'count' ? 'what does the board by the door show?' : v.question === 'ring' ? 'describe the hall and the doors' : 'what is in the storage bays?';
  s = P(s, 'hail Lieutenant Kaminski', look, 'close the channel');
  if (v.question === 'count') s = P(s, 'Rask, read the board');
  if (v.question === 'ring') s = P(s, 'Rask, which ring are they in?');
  const ans = v.question === 'count' ? String(v.live) : v.question === 'ring' ? (v.hall === 'outer' ? 'the outer ring' : 'the middle ring') : v.stores === 'nothing' ? 'nothing' : v.stores;
  s = P(s, `answer the keystone: ${ans}`);
  return untilEnd(s);
}

/** Ask the makers: tell Kovar honestly what happened, promise nothing taken and no scans, ask her to stand it down, and stay out of reach. */
export function makersRun(seed: number | string): WorldState {
  let s = startN(seed);
  const v = nine(s);
  s = toTurn(s, v.arrive - 1);
  s = P(s, 'hail the Ordinal', 'Our survey team was surveying the depot when the doors sealed. We will take nothing and make no scans of your depot. Will you stand the lock down?', 'close the channel');
  return untilEnd(s);
}
