import { expect } from 'vitest';
import { weatherScenario } from '../../src/scenarios/weather';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { weather, type WeatherVariant } from '../../src/scenarios/weather/setup';

export const WE_SIM = weatherScenario;

export function startW(seed: number | string): WorldState {
  return completeIntro(WE_SIM.create(seed), WE_SIM);
}

export function playW(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(WE_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playW(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playW(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: WeatherVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(weather(WE_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names from every other simulation (and setting words the handbook must not use). */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Tamber|Stavely|Seraphine|Vory|Stern Mercy|Calderon|Seventh Bell|Harrow Lane|Caradoc|Thistledown|Kemble|Quell|Dividend|Starfall|habitat|Hagfish|Draycott|Skerrit|Veyl|Gavel|Grist|Bryony|Citrine|Nessa|Prism|Looking Glass|Glass Nebula|Askel|Lirra|Soth|Yasha|Toras|Brask|Quiet Stone|Orun|Kesh Varo|Intergalactic|the Agency|Lysa Venn|Teo Maras)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export { weather, knows };

const P = (s: WorldState, ...c: string[]) => playW(s, c);

/** Get the papers the key is built from (the journal needs Marit won over first). */
export function getSource(s: WorldState): WorldState {
  const v = weather(s);
  if (v.key === 'poem') return P(s, 'Szabo, get the poems from the colony archive', 'hail the Steward', 'what was his favourite poem?', 'close the channel');
  if (v.key === 'letters') return P(s, 'hail the Steward', "ask the Steward for the founder's letters, lives depend on it", 'close the channel');
  return winMarit(s);
}

/** Win Marit over honestly, whatever her grievance. */
export function winMarit(s: WorldState): WorldState {
  const v = weather(s);
  if (v.grievance === 'blame') {
    s = P(s, 'hail the Steward', 'Tell me the truth about Elias Quarrie', 'close the channel');
    return P(s, 'tell Marit the Steward admits the council drove him', 'ask Marit for the journal');
  }
  if (v.grievance === 'legacy') {
    s = P(s, 'hail the Steward', 'Will the Hall pledge to name the Engine for him and keep his rules?', 'close the channel');
    return P(s, 'tell Marit the Hall has pledged to keep his name and his rules', 'ask Marit for the journal');
  }
  s = until(P(s, 'Szabo, read the lock'), (x) => !!x.flags.lockRead, 4);
  return P(s, 'tell Marit the lock has a governor and safeguards; he built it so it cannot run wild', 'ask Marit for the journal');
}

/** Responsible: read the lock, shelter early, get the right papers, let Szabo work and vouch, enter it. */
export function carefulKey(seed: number | string): WorldState {
  let s = P(startW(seed), 'Szabo, read the lock', 'Varga, give me a landfall time', 'order the colony to shelter');
  s = getSource(s);
  s = P(s, 'Szabo, work the cipher');
  s = until(s, (x) => !!x.flags.candidate && !x.counters.workAt, 8);
  if (s.flags.candidateUnsure) s = until(P(s, 'Szabo, verify the key'), (x) => !x.flags.candidateUnsure, 4);
  s = P(s, 'Szabo, enter the key');
  return untilEnd(s);
}

/** Reckless, but the same ending: try the motto first, leave the colony in the open, then the key. */
export function recklessKey(seed: number | string): WorldState {
  let s = P(startW(seed), 'enter the motto', 'Szabo, read the lock');
  s = getSource(s);
  s = P(s, 'Szabo, work the cipher');
  s = until(s, (x) => !!x.flags.candidate && !x.counters.workAt, 8);
  if (s.flags.candidateUnsure) s = until(P(s, 'Szabo, verify the key'), (x) => !x.flags.candidateUnsure, 4);
  s = P(s, 'Szabo, enter the key');
  return untilEnd(s);
}
