import { expect } from 'vitest';
import { lanternScenario } from '../../src/scenarios/lantern';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { lantern, type LanternVariant } from '../../src/scenarios/lantern/setup';

export const LANTERN = lanternScenario;

export function startD(seed: number | string): WorldState {
  return completeIntro(LANTERN.create(seed), LANTERN);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playD(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(LANTERN, s, c);
    if (check) {
      expect(checkInvariants(s), `after "${c}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${c}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playD(s, ['wait'], check);
  return s;
}

export function seedWhere(pred: (v: LanternVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(lantern(LANTERN.create(i)))) return i;
  throw new Error('no seed');
}

/** The first seed whose playthrough (from a fresh start) satisfies pred. */
export function seedPlaying(pred: (s: WorldState, v: LanternVariant) => boolean, play: (seed: number) => WorldState, filter: (v: LanternVariant) => boolean = () => true, limit = 400): number {
  for (let i = 1; i <= limit; i++) {
    const v = lantern(LANTERN.create(i));
    if (!filter(v)) continue;
    if (pred(play(i), v)) return i;
  }
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|delegat\w*|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

/** Ask the custodian's leave, scan, and have the doctor assess (waits until she has a triage order). */
export function prepare(s: WorldState, scan = true): WorldState {
  s = playD(s, [...(scan ? ['Varga, scan the cryo banks'] : []), 'hail the Eventide', 'May we come aboard?', 'close the channel', 'Doctor, assess the sleepers']);
  for (let i = 0; i < 6 && !s.flags.assessed && !s.outcome; i++) s = playD(s, ['wait']);
  return s;
}

/** The line that earns every temperament's leave once the doctor has seen them: evidence, her word, and the truth. */
export const CONSENT_LINE = 'Our doctor has examined them, and the scan shows the banks are failing. Not all of them will live.';

export function getConsent(s: WorldState): WorldState {
  return playD(s, ['hail the Eventide', CONSENT_LINE, 'close the channel']);
}

/** Keep the salvor off without a deal: tell him (with evidence), and put the Halcyon in his way. */
export function deterTug(s: WorldState): WorldState {
  s = playD(s, ['hail the tug', 'Our scans show nine hundred living people aboard her.', 'close the channel']);
  if (!s.flags.stoodOff) s = playD(s, ['Adeyemi, put us between the tug and the Eventide']);
  return s;
}

/** The careful rescue: scan, leave, assessment, honest consent, power line, triage order, tug deterred. */
export function careful(seed: number | string, opts: { power?: boolean; tug?: boolean } = {}): WorldState {
  let s = getConsent(prepare(startD(seed)));
  if (opts.power !== false) s = playD(s, ['Chief, run a power line to the banks']);
  s = playD(s, ['Doctor, wake them in your triage order']);
  if (opts.tug !== false) s = deterTug(s);
  return untilEnd(s);
}

/** Salvage deal: licence checked (or not), the salvor told there are people aboard, the tender accepted. */
export function dealRun(seed: number, checkFirst: boolean): WorldState {
  let s = getConsent(prepare(startD(seed)));
  s = playD(s, ['Doctor, wake them in your triage order']);
  if (checkFirst) s = playD(s, ["Szabo, check the salvor's licence"]);
  s = playD(s, ['hail the tug', 'There are nine hundred living people aboard her.', 'Agreed. The hull is yours once our sleepers are off her. Send the tender.', 'close the channel']);
  return untilEnd(s);
}
