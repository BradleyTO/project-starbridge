import { expect } from 'vitest';
import { tribunalScenario } from '../../src/scenarios/tribunal';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { tribunal, type TribunalVariant } from '../../src/scenarios/tribunal/setup';
import { medicalReady } from '../../src/scenarios/tribunal/agents';

export const TR_SIM = tribunalScenario;

export function startT(seed: number | string): WorldState {
  return completeIntro(TR_SIM.create(seed), TR_SIM);
}

export function playT(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(TR_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playT(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playT(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: TribunalVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(tribunal(TR_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Tamber|Stavely|Seraphine|Vory|Stern Mercy|Calderon|Seventh Bell|Harrow Lane|Caradoc|Thistledown|Kemble|Quell|Dividend|Starfall|habitat|Hagfish|Draycott|Skerrit|Veyl|Gavel|Grist|Bryony|Citrine|Nessa|Prism|Looking Glass|Glass Nebula|Intergalactic|the Agency|Lysa Venn|Teo Maras)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export { tribunal, knows, medicalReady };

const P = (s: WorldState, ...c: string[]) => playT(s, c);

/** Hear Askel, then have Osei prepare the brief, wait until ready. */
export function briefThem(s: WorldState): WorldState {
  s = P(s, 'hail Askel');
  s = P(s, 'Tell me what happened, in your own words.');
  s = P(s, 'Osei, prepare a medical brief');
  return until(s, (x) => medicalReady(x), 10);
}

/** Responsible acquittal path (rescue truth). */
export function carefulAcquittal(seed: number | string): WorldState {
  let s = briefThem(startT(seed));
  s = P(s, 'hail the tribunal');
  s = P(s, 'present the medical brief to the magister');
  return untilEnd(s);
}

/** Reckless then recover: try force first, then medical path. */
export function recklessThenAcquit(seed: number | string): WorldState {
  let s = playT(startT(seed), ['extract Askel by force']);
  s = briefThem(s);
  s = P(s, 'hail the tribunal');
  s = P(s, 'present the medical brief to the magister');
  return untilEnd(s);
}
