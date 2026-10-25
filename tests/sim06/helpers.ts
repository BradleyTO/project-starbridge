import { expect } from 'vitest';
import { ionScenario } from '../../src/scenarios/ion';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { ion, otherCh, type Channel, type IonVariant } from '../../src/scenarios/ion/setup';

export const ION = ionScenario;

export function startI(seed: number | string): WorldState {
  return completeIntro(ION.create(seed), ION);
}

/** Play orders through the offline interpreter, checking invariants after each; stops at an ending. */
export function playI(s: WorldState, cmds: string[], check = true): WorldState {
  for (const c of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(ION, s, c);
    if (check) {
      expect(checkInvariants(s), `after "${c}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${c}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

/** Wait until an ending (or the turn limit). */
export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playI(s, ['wait'], check);
  return s;
}

/** First seed whose variant matches. */
export function seedWhere(pred: (v: IonVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(ion(ION.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names and placeholders from other simulations that must never appear in this one's narration. */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|delegat\w*)\b|\[[a-zA-Z_]+\]|undefined|NaN/;

export const calmOf = (v: IonVariant, b: number): Channel => v.calm[b];
export const roughOf = (v: IonVariant, b: number): Channel => otherCh(v.calm[b]);

import { band, gutRead, stranded } from '../../src/scenarios/ion/agents';

/** Keep an impatient master with the convoy once she has said she is going (talk, not force). */
function keepTeague(s: WorldState): WorldState {
  const v = ion(s);
  if (s.flags.teagueAlone || s.outcome) return s;
  if ((s.counters.teagueHold ?? 0) >= v.patience - 1) s = playI(s, ['hail Captain Teague', 'Stay with us, Captain. Not yet. We will get you through together.', 'close the channel']);
  return s;
}

/**
 * A careful captain: hears both masters and has the doctor listen to them, deals with an unfit
 * master with their consent, backs the helm and asks for his feel in every band, waits when he
 * cannot read it or a lull is coming, and takes a crew off any hull that goes dark.
 */
export function careful(seed: number | string): WorldState {
  let s = playI(startI(seed), ['hail Captain Brack', 'Which channel would you take through the Fringe?', 'hail Captain Teague', 'Which channel would you take?', 'close the channel', 'Doctor, how do the masters sound?']);
  if (s.flags.foundUnfit) {
    const who = ion(s).unfit === 'mule' ? 'Captain Brack' : 'Captain Teague';
    s = playI(s, [`hail ${who}`, 'Captain, are you fit to fly the Maw?', 'Will you hand the helm to your mate?', 'close the channel']);
  }
  for (let guard = 0; guard < 30 && !s.outcome && band(s) < 3; guard++) {
    s = keepTeague(s);
    s = playI(s, ['Varga, what does the model say?', 'Adeyemi, I trust your gut. What does your gut say?']);
    const g = gutRead(s);
    if (g.kind === 'unsure' || g.kind === 'lullComing' || g.kind === 'rough') s = playI(s, ['wait']);
    else if (g.kind === 'lullNow') s = playI(s, ['go']);
    else s = playI(s, [`take us through the ${g.ch} channel`]);
    if (!s.outcome && HAULERS_DARK(s)) s = playI(s, ['Take the crew off.']);
  }
  if (!s.outcome && stranded(s)) s = playI(s, ['Take the crew off.']);
  return s;
}

const HAULERS_DARK = (s: WorldState) => !!s.flags.anyAdrift && (['Mule', 'Gannet'] as const).some((k) => (s.counters[`adrift${k}`] ?? 0) > 0 && !s.flags[`crewOff${k}`] && !s.flags[`lost${k}`]);
