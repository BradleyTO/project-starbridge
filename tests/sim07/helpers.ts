import { expect } from 'vitest';
import { ledgerScenario } from '../../src/scenarios/ledger';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { GUEST_SHORT, ledger, type Guest, type LedgerVariant } from '../../src/scenarios/ledger/setup';

export const LEDGER = ledgerScenario;

export function startL(seed: number | string): WorldState {
  return completeIntro(LEDGER.create(seed), LEDGER);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playL(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(LEDGER, s, c);
    if (check) {
      expect(checkInvariants(s), `after "${c}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${c}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playL(s, ['wait'], check);
  return s;
}

export function seedWhere(pred: (v: LedgerVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(ledger(LEDGER.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');
export const short = (g: Guest) => GUEST_SHORT[g];

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|delegat\w*|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

import { GUESTS } from '../../src/scenarios/ledger/setup';
import { proven, suspects } from '../../src/scenarios/ledger/agents';

const NAME_FOR: Record<Guest, string> = { krenn: 'Attaché Krenn', vesk: 'Mr Vesk', sallow: 'Ms Sallow', fosse: 'Commander Fosse' };
export const nameFor = (g: Guest) => NAME_FOR[g];

/**
 * A careful investigator: times the copy, pulls the door logs, traces the device, then hears and
 * checks each remaining suspect's story against the ship's record until the evidence points to one
 * guest alone. Never touches anyone; never accuses on less than proof.
 */
export function investigate(seed: number | string): WorldState {
  let s = playL(startL(seed), ['Varga, when were the keys copied?', 'Rask, pull the door logs', 'Varga, what device took the copy?']);
  for (let guard = 0; guard < 6 && !s.outcome && !proven(s); guard++) {
    const left = suspects(s).filter((g) => !s.characters[g].memory.checked);
    const g = left[0];
    if (!g) break;
    s = playL(s, [`interview ${nameFor(g)}`, 'your badge says you left the reception', 'check that story']);
  }
  return s;
}

export const otherThan = (g: Guest) => GUESTS.filter((x) => x !== g);
