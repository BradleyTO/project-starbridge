import { expect } from 'vitest';
import { corsairsScenario } from '../../src/scenarios/corsairs';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { corsairs, type CorsairVariant } from '../../src/scenarios/corsairs/setup';

export const COR_SIM = corsairsScenario;

export function startC(seed: number | string): WorldState {
  return completeIntro(COR_SIM.create(seed), COR_SIM);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playC(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(COR_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playC(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playC(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: CorsairVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(corsairs(COR_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Tamber|Stavely|Seraphine|Vory|Stern Mercy|Calderon|Seventh Bell|Harrow Lane|Caradoc|Thistledown|Kemble|Quell|Dividend|Starfall|habitat|Intergalactic|the Agency)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export const toDraycott = (...lines: string[]) => ['hail the corsairs', ...lines, 'close the channel'];
export const toSkerrit = (...lines: string[]) => ['hail the gavel', ...lines, 'close the channel'];

export { corsairs, knows };

const P = (s: WorldState, ...c: string[]) => playC(s, c);

/** Rask's read: asked every minute until he is sure (he may be torn between two patterns at first). */
export function readThem(s: WorldState): WorldState {
  for (let i = 0; i < 8 && !knows(s, 'pattern') && !s.outcome; i++) s = P(s, 'Rask, what are they doing?', 'wait');
  return s;
}

/** The right ground for the pattern that was read and the ground the charts showed. */
export function counterMove(s: WorldState): WorldState {
  const v = corsairs(s);
  if (v.pattern === 'bleed' && v.anvil !== 'iron') return P(s, 'charge the flagship');
  if (v.pattern !== 'bleed' && v.needle === 'open') return P(s, 'take us into the Needle');
  if (v.anvil === 'iron') return P(s, 'go dark', 'take us behind the Anvil');
  return P(s, 'take us into the Needle', 'Chief, clear the rubble from the Needle');
}

/**
 * The careful captain: shields up, the beacon's charts, Rask's read, then the ground that counters
 * the pattern, held until their plan breaks. No shot fired.
 */
export function careful(seed: number | string): WorldState {
  let s = P(startC(seed), 'raise shields', 'Szabo, pull the charts from the beacon');
  s = readThem(s);
  s = counterMove(s);
  return until(s, (x) => !!x.flags.planBroken, 12);
}

/** Careful, then offer the beaten captain ISA protection once her debt is known, and wait for the collector. */
export function protect(seed: number | string): WorldState {
  let s = P(careful(seed), 'Szabo, listen to their traffic', 'hail the corsairs', 'We can offer you ISA protection.', 'close the channel');
  return until(s, (x) => !!x.flags.gavelHere);
}

/** Shields up, wait for her to open fire, then answer it with the beams until it is over. */
export function returnFire(seed: number | string): WorldState {
  let s = until(P(startC(seed), 'raise shields'), (x) => !!x.flags.opened);
  for (let i = 0; i < 30 && !s.outcome; i++) s = P(s, 'fire beams on the Hagfish');
  return untilEnd(s);
}

/** Shields up and open fire on the Hagfish at once, while she has only made demands. */
export function fireFirst(seed: number | string): WorldState {
  let s = P(startC(seed), 'raise shields');
  for (let i = 0; i < 30 && !s.outcome; i++) s = P(s, 'fire beams on the Hagfish');
  return untilEnd(s);
}
