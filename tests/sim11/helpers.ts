import { expect } from 'vitest';
import { coldwaterScenario } from '../../src/scenarios/coldwater';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { coldwater, type ColdwaterVariant } from '../../src/scenarios/coldwater/setup';
import { knows } from '../../src/engine/state';

export const COLDWATER_SIM = coldwaterScenario;

export function startC(seed: number | string): WorldState {
  return completeIntro(COLDWATER_SIM.create(seed), COLDWATER_SIM);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playC(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(COLDWATER_SIM, s, c);
    if (check) {
      expect(checkInvariants(s), `after "${c}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${c}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playC(s, ['wait'], check);
  return s;
}

/** Wait until a condition holds (or the run ends). */
export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playC(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: ColdwaterVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(coldwater(COLDWATER_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|delegat\w*|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Cobble|Spindle|Claimwarden|growth|miners?|tender|Intergalactic|the Agency)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export const RECORD = "Chief, pull the plant's sensor record";
export const INSPECT = 'Chief, inspect the sister valve';
export const DOWN = 'go down to engineering';
export const ACK_LINE = 'I am sorry about Callum Strand. He was one of ours, and he should not have died.';
export const truthLine = (v: ColdwaterVariant) =>
  `${v.falsifier === 'penhale' ? 'Lieutenant Penhale' : 'Petty Officer Corley'} ${v.method === 'deleted' ? 'deleted his report' : 'signed off an inspection that never happened'}. The record proves it.${v.chiefSigned ? " The Chief's countersignature is on it too; she signed it in good faith without checking." : ''}`;
export const falsName = (v: ColdwaterVariant) => (v.falsifier === 'penhale' ? 'Penhale' : 'Corley');
export const innoName = (v: ColdwaterVariant) => (v.falsifier === 'penhale' ? 'Corley' : 'Penhale');

/**
 * The careful captain: pull the record, have the sister valve inspected, hear the officer the
 * record names, relieve him pending review, go down, acknowledge the loss and tell the watch.
 */
export function careful(seed: number | string): WorldState {
  let s = playC(startC(seed), [RECORD, INSPECT, 'Doctor, what killed him?']);
  const v = coldwater(s);
  s = until(s, (x) => knows(x, 'record'));
  s = playC(s, [`question ${falsName(v)}`, `relieve ${falsName(v)} pending review`, DOWN, ACK_LINE, truthLine(v)]);
  return untilEnd(s);
}
