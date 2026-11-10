import { expect } from 'vitest';
import { gravityScenario } from '../../src/scenarios/gravity';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { grav, tolerance, type GravityVariant } from '../../src/scenarios/gravity/setup';

export const GE_SIM = gravityScenario;

export function startG(seed: number | string): WorldState {
  return completeIntro(GE_SIM.create(seed), GE_SIM);
}

export function playG(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(GE_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playG(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30, check = true): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playG(s, ['wait'], check);
  return s;
}

export function seedWhere(pred: (v: GravityVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(grav(GE_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names from every other simulation (and setting words the handbook must not use). */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Plumb Line|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Tamber|Stavely|Seraphine|Vory|Stern Mercy|Calderon|Seventh Bell|Harrow Lane|Caradoc|Thistledown|Kemble|Quell|Dividend|Starfall|habitat|Hagfish|Draycott|Skerrit|Veyl|Gavel|Grist|Bryony|Citrine|Nessa|Prism|Looking Glass|Glass Nebula|Askel|Lirra|Soth|Yasha|Toras|Brask|Quiet Stone|Orun|Kesh Varo|Meridian|Quarrie|Marit|Anwen|Bastian|Greywall|Weather Engine|Aubrel|Ostrin|Mallory|Severin|Stannard|Tamsin|Rook|Civic Guard|Government House|hostages?|Intergalactic|the Agency|Lysa Venn|Teo Maras|Directorate)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export { grav, knows, tolerance };

const P = (s: WorldState, ...c: string[]) => playG(s, c);

/** Hold until the given turn (waiting), unless the run ends first. */
export function toTurn(s: WorldState, t: number, check = true): WorldState {
  return until(s, (x) => x.turn >= t, 40, check);
}

/**
 * Careful and gut-led: relay the data, clear the outer sections, have the Chief listen, wait in the
 * outer band for the peak, go deep for it, ask her read as soon as the frame talks, pull back whenever
 * she hears the frame go quiet, and take the ship out on the crack (the shriek on a strong frame she
 * vouches for), or once the peak is well past.
 */
export function careful(seed: number | string, opts: { relay?: boolean; brace?: boolean } = {}): WorldState {
  const s = P(startG(seed), ...(opts.relay === false ? [] : ['Szabo, relay our data to the observatory']), 'clear the outer sections', ...(opts.brace ? ['Chief, reinforce the frame'] : []), 'Chief, listen to the frame');
  return drive(s);
}

/** The gut-led loop: read the ship, not the gauges. */
export function drive(s: WorldState): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) {
    const v = grav(s);
    const d = s.counters.depth ?? 0;
    if (s.flags.withdrawing || s.flags.clear) {
      s = P(s, 'wait');
      continue;
    }
    if (s.flags.soundGroan && !knows(s, 'feel')) {
      s = P(s, 'Chief, how does she feel?');
      continue;
    }
    const cue = (s.counters.cueAt ?? 0) === s.turn && !!s.flags.lastCueTell;
    if (cue && d >= 2) {
      s = P(s, 'pull back');
      continue;
    }
    const vouched = knows(s, 'feel') && v.hull === 'strong';
    if (s.flags.soundShriek || (s.flags.soundCrack && !vouched) || s.turn > v.peakAt + 4) {
      s = P(s, 'take us out');
      continue;
    }
    // A tired frame: back to the middle band, and no deeper.
    if (knows(s, 'feel') && v.hull === 'tired') {
      s = P(s, d >= 3 ? 'pull back' : 'wait');
      continue;
    }
    if (d < 3 && s.turn >= v.peakAt - 4 && !cue && (s.counters.cueAt ?? 0) !== s.turn) {
      s = P(s, 'take us deeper');
      if (s.counters.pendingWarn) s = P(s, 'wait');
      continue;
    }
    s = P(s, 'wait');
  }
  return s;
}

/** By the book: go deep for the peak and come out when the gauges pass the rated limit, never asking the Chief. */
export function byBook(seed: number | string, check = true): WorldState {
  let s = playG(startG(seed), ['Szabo, relay our data to the observatory', 'clear the outer sections'], check);
  const v = grav(s);
  s = until(s, (x) => x.turn >= v.peakAt - 4, 40, check);
  s = playG(s, ['take us deeper'], check);
  s = until(s, (x) => !!x.flags.pastBook || x.turn > v.peakAt + 4 || !!x.flags.soundShriek, 40, check);
  return untilEnd(playG(s, ['take us out'], check), check);
}

/** The probe route: copy to the observatory, cut the probe loose near the peak, and climb out. */
export function probeRun(seed: number | string): WorldState {
  let s = P(startG(seed), 'Szabo, relay our data to the observatory');
  const v = grav(s);
  s = until(s, (x) => x.turn >= v.peakAt - 2);
  return untilEnd(P(s, 'release the probe', 'take us out'));
}
