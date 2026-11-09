import { expect } from 'vitest';
import { hollowScenario } from '../../src/scenarios/hollow';
import { completeIntro } from '../../src/engine/turn';
import { submit } from '../../src/engine/game';
import { checkInvariants, checkTransition } from '../../src/engine/invariants';
import type { WorldState } from '../../src/engine/types';
import { knows } from '../../src/engine/state';
import { hollow, type HollowVariant } from '../../src/scenarios/hollow/setup';

export const HC_SIM = hollowScenario;

export function startH(seed: number | string): WorldState {
  return completeIntro(HC_SIM.create(seed), HC_SIM);
}

export function playH(s: WorldState, cmds: string[], check = true): WorldState {
  for (const cmd of cmds) {
    if (s.outcome) break;
    const prev = s;
    s = submit(HC_SIM, s, cmd);
    if (check) {
      expect(checkInvariants(s), `after "${cmd}"`).toEqual([]);
      expect(checkTransition(prev, s), `after "${cmd}"`).toEqual([]);
    }
  }
  return s;
}

export const waits = (n: number) => Array.from({ length: n }, () => 'wait');

export function untilEnd(s: WorldState, check = true): WorldState {
  for (let i = 0; i < 40 && !s.outcome; i++) s = playH(s, ['wait'], check);
  return s;
}

export function until(s: WorldState, pred: (s: WorldState) => boolean, limit = 30): WorldState {
  for (let i = 0; i < limit && !s.outcome && !pred(s); i++) s = playH(s, ['wait']);
  return s;
}

export function seedWhere(pred: (v: HollowVariant) => boolean, limit = 4000): number {
  for (let i = 1; i <= limit; i++) if (pred(hollow(HC_SIM.create(i)))) return i;
  throw new Error('no seed');
}

export const logText = (s: WorldState) => s.log.map((e) => `${e.speaker}: ${e.text}`).join('\n');

/** Names from every other simulation (and setting words the handbook must not use). */
export const LEAK =
  /\b(Kestrel|Vane|Arden|Hollis|Ashen Covenant|Prefect|freighter|compartment|isotopes?|Calloway|Reach|Tallis|Sabeth|Thornwake|Ilun|Brenn|Cantor|Teyma|pulsar|Paley|Basant|Larkspur|Tern|Saltglass|Rhune|Tarvo|Edda|Caius|Long Thaw|Cold Hearth|Brack|Teague|Saffron Mule|Gannet|Corrie Drift|Hesper|Maw|ore hauler|Krenn|Vesk|Sallow|Fosse|Thorne|Vell Crossing|navigation keys|Ysolde|Eventide|Wick|Vollan|Kittiwake|Orrey|Sorrel|Drover|Lantern|cryo|sleepers?|Roake|Dahl|Marchbank|Wrenmoor|Iron Psalm|Sable Narrows|picket|Crake|Haskett|Gardener|Coldwater|Penhale|Corley|Toller|Hadley|Myrr|Ketter|Mattock|Ember Tide|Strome|Ferrier|furnace|Tamber|Stavely|Seraphine|Vory|Stern Mercy|Calderon|Seventh Bell|Harrow Lane|Caradoc|Thistledown|Kemble|Quell|Dividend|Starfall|habitat|Hagfish|Draycott|Skerrit|Veyl|Gavel|Grist|Bryony|Citrine|Nessa|Prism|Looking Glass|Glass Nebula|Askel|Lirra|Soth|Yasha|Toras|Brask|Quiet Stone|Orun|Kesh Varo|Meridian|Quarrie|Marit|Anwen|Bastian|Greywall|Weather Engine|Intergalactic|the Agency|Lysa Venn|Teo Maras)\b|\[[a-zA-Z_]+\]|\[missing|undefined|NaN/;

export { hollow, knows };

const P = (s: WorldState, ...c: string[]) => playH(s, c);

/** The remedy line that fits his condition (after Dr. Osei has assessed him). */
export function remedyLine(v: HollowVariant): string {
  if (v.condition === 'exhausted') return 'Take all the time you need. Nobody is coming in; you can rest.';
  if (v.condition === 'grief') return 'I am sorry about your son, Aris.';
  return 'Dr. Osei can send your medication across in a pod.';
}

/** Find out who the false hostage is and take away her means of harm. */
export function unmask(s: WorldState): WorldState {
  const v = hollow(s);
  s = until(P(s, 'Szabo, check the duty roster'), (x) => knows(x, 'impostor'), 3);
  if (v.impostor === 'agent') {
    s = until(P(s, 'Szabo, trace the transmissions from the relay'), (x) => knows(x, 'agent'), 3);
    return P(s, 'Szabo, jam her transmitter');
  }
  if (v.impostor === 'accomplice') return P(s, 'scan the relay core', 'Szabo, jam the trigger');
  return P(s, 'hail Rook', 'We know you are not Tamsin Rook. The ISA will protect you.');
}

/** Ask the successor to hold, the way that works on her. */
export function holdStannard(s: WorldState): WorldState {
  const v = hollow(s);
  s = P(s, 'hail Government House');
  if (v.successor === 'cautious') s = P(s, 'Please hold your team; there are lives in there.');
  else if (v.successor === 'political') s = P(s, 'He will stay in ISA custody; he has asked for our protection.');
  else if (v.impostor === 'agent') s = P(s, 'We know about your agent, Corporal Dace.');
  else if (v.impostor === 'accomplice') s = P(s, 'The core is wired; your team would set off the charge.');
  return P(s, 'close the channel');
}

/** Hear him, have Osei assess him and give the remedy that fits; leaves the channel open. */
export function calmed(s: WorldState): WorldState {
  s = P(s, 'hail the relay', 'Doctor, assess the governor', 'Tell me what happened.', 'The ISA can offer you protection and a fair hearing before Fleet Command.');
  s = until(s, (x) => knows(x, 'condition'), 4);
  const v = hollow(s);
  s = P(s, remedyLine(v));
  if (v.condition === 'withdrawal') s = playH(s, ['wait']);
  return s;
}

/** Ask him to come out; if he is not ready, keep listening and ask again. */
export function askOut(s: WorldState): WorldState {
  s = P(s, 'hail the relay', 'Will you let them go and come out to us?');
  for (let i = 0; i < 3 && !s.outcome && !s.flags.surrendering; i++) s = P(s, 'I hear you. Tell me what happened.', 'Will you let them go and come out to us?');
  return s;
}

/** Responsible: hear him, have Osei assess him, unmask the hostage, offer a hearing, the remedy, then ask. */
export function careful(seed: number | string): WorldState {
  let s = P(startH(seed), 'hail the relay', 'Doctor, assess the governor', 'Tell me what happened.', 'The ISA can offer you protection and a fair hearing before Fleet Command.');
  s = until(s, (x) => knows(x, 'condition'), 4);
  const v = hollow(s);
  s = P(s, remedyLine(v));
  if (v.condition === 'withdrawal') s = playH(s, ['wait']);
  s = P(s, 'close the channel');
  s = unmask(s);
  s = holdStannard(s);
  return untilEnd(askOut(s));
}

/** Reckless, but the same ending: pressed to surrender before anyone has assessed him, then the careful route. */
export function reckless(seed: number | string): WorldState {
  let s = P(startH(seed), 'hail the relay', 'Will you let them go and come out to us?', 'Doctor, assess the governor', 'The ISA can offer you protection and a fair hearing before Fleet Command.', 'Tell me what happened.');
  s = until(s, (x) => knows(x, 'condition'), 4);
  const v = hollow(s);
  s = P(s, remedyLine(v));
  if (v.condition === 'withdrawal') s = playH(s, ['wait']);
  s = P(s, 'Tell me what happened.', 'close the channel');
  s = unmask(s);
  s = holdStannard(s);
  return untilEnd(askOut(s));
}
