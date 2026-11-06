import { expect } from 'vitest';
import { glassScenario } from '../../src/scenarios/glass';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { glass, type GlassVariant } from '../../src/scenarios/glass/setup';
import { modelReady } from '../../src/scenarios/glass/agents';

export const GL_SIM = glassScenario;

export function startG(seed: number | string): WorldState {
  return completeIntro(GL_SIM.create(seed), GL_SIM);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playG(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(GL_SIM, s, cmd);
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

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playG(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: GlassVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(glass(GL_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Tamber|Stavely|Seraphine|Vory|Stern Mercy|Calderon|Seventh Bell|Harrow Lane|Caradoc|Thistledown|Kemble|Quell|Dividend|Starfall|habitat|Hagfish|Draycott|Skerrit|Veyl|Gavel|Grist|Bryony|Intergalactic|the Agency)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export { glass, knows, modelReady };

const P = (s: WorldState, ...c: string[]) => playG(s, c);

/** Wait until Varga's full model is in. */
export function modelThem(s: WorldState): WorldState {
  s = P(s, 'Varga, model the nebula');
  return until(s, (x) => modelReady(x), 20);
}

/**
 * The careful captain: start the model, wait for it, then go to the true locus and recover.
 */
export function careful(seed: number | string): WorldState {
  let s = modelThem(startG(seed));
  const v = glass(s);
  if (v.echo === 'help-false') {
    s = P(s, 'turn back');
  } else if (v.physics === 'shear') {
    s = P(s, 'use the Fold');
  } else {
    s = P(s, 'recover the shuttle crew');
    s = until(s, (x) => !!x.outcome || (x.counters.pos ?? 0) > 0, 8);
    if (!s.outcome) s = P(s, 'recover the shuttle crew');
  }
  return untilEnd(s);
}

/** Plunge after the help signal without a model. */
export function plungeBlind(seed: number | string): WorldState {
  return untilEnd(playG(startG(seed), ['go deep after them', ...waits(12)]));
}

/** Responsible Brought Home: model first, then recover at the true locus (stay-false, not shear). */
export function responsibleHome(seed: number | string): WorldState {
  let s = modelThem(startG(seed));
  s = P(s, 'recover the shuttle crew');
  s = until(s, (x) => !!x.outcome || !!x.flags.rescuedDirect || !!x.flags.endHome, 12);
  if (!s.outcome) s = P(s, 'recover the shuttle crew');
  return untilEnd(s);
}

/** Reckless path that may still recover: plunge first, then model, then recover. */
export function recklessThenRecover(seed: number | string): WorldState {
  let s = playG(startG(seed), ['go deep after them', 'wait', 'wait']);
  s = modelThem(s);
  s = P(s, 'recover the shuttle crew');
  s = until(s, (x) => !!x.outcome, 15);
  return untilEnd(s);
}
