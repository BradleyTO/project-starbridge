import { expect } from 'vitest';
import { picketScenario } from '../../src/scenarios/picket';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { picket, type PicketVariant } from '../../src/scenarios/picket/setup';

export const PICKET_SIM = picketScenario;

export function startP(seed: number | string): WorldState {
  return completeIntro(PICKET_SIM.create(seed), PICKET_SIM);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playP(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(PICKET_SIM, s, c);
    if (check) {
      expect(checkInvariants(s), `after "${c}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${c}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playP(s, ['wait'], check);
  return s;
}

export function seedWhere(pred: (v: PicketVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(picket(PICKET_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|delegat\w*|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

/** Learn everything the bridge can learn: hear him, Marrow's read, his traffic, the colony's telemetry, the picket's sweep. */
export function study(s: WorldState): WorldState {
  return playP(s, ['Marrow, what do you make of him?', 'Szabo, listen to the picket’s traffic', 'Chief, read Wrenmoor’s reactor telemetry', 'Varga, scan the picket']);
}

export const HEAR = ['hail the picket', 'close the channel'];
export const READ_HIM = 'Marrow, what do you make of him?';
export const LISTEN = 'Szabo, listen to the picket’s traffic';
export const TOKEN = 'You may inspect one crate, for your log.';
export const COURTESY_LINE = 'You may inspect us, as a courtesy and without conceding your claim.';
export const TRUTH_LINE = 'We are carrying reactor assemblies for Wrenmoor.';
export const RESOLVE_LINE = 'We are going through, with or without your leave.';
export const ESCORT_LINE = 'We are not alone out here. Our escorts are just behind us.';
export const EVIDENCE_CMD = 'send him our scan of the cargo';

/** On a channel to the picket: say these lines, then close it. */
export const toPicket = (...lines: string[]) => ['hail the picket', ...lines, 'close the channel'];

/**
 * The careful captain: hear him, ask Marrow for her read, learn his orders, then choose the road his
 * orders, his temperament and the clock leave open. Uses only what the bridge has been told.
 */
export function careful(seed: number | string): WorldState {
  let s = playP(startP(seed), [...HEAR, READ_HIM, LISTEN, 'wait', 'wait']);
  const v = picket(s);
  const tight = v.reliefAt >= v.deadline;
  if (s.flags.relieved) s = playP(s, toPicket(COURTESY_LINE));
  else if (v.orders === 'pretext') s = playP(s, [EVIDENCE_CMD]);
  else if (v.orders === 'probe' || !tight) s = playP(s, toPicket(TOKEN));
  else if (v.temperament === 'weary') s = playP(s, toPicket(RESOLVE_LINE));
  else if (v.history === 'owed') s = playP(s, ['Marrow, talk to him privately']);
  else s = playP(s, [...toPicket(TRUTH_LINE), 'Marrow, talk to him privately']);
  return untilEnd(s);
}
