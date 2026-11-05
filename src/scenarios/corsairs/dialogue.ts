/**
 * Offline dialogue for Corsairs of the Veyl Shoals: Captain Ione Draycott of the corsair Hagfish,
 * and Collector Amos Skerrit of the Grist Syndicate, aboard the gunship Gavel.
 *
 * Draycott wants the lattices without a fight she cannot win; whether she is desperate, proud or
 * wavering is seeded, and decides what will make her strike, what bluff she will believe, and
 * whether she will take ISA custody. Skerrit wants her debt paid, in marks or in person.
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { CORSAIR, DRAYCOTT, GAVEL, SKERRIT } from './setup';
import { draycottRespond, settled, skerritRespond, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isGavel = (p: Party) => p === 'cruiser';

const FILLER = new Set(['draycottStatus', 'draycottAfter', 'draycottInCustody', 'skerritStatus', 'skerritAfter', 'skerritWatching']);

export const corsairsDialogue: DialogueProvider = {
  id: 'corsairs-offline',
  speakerName(_s, party: Party) {
    return isGavel(party) ? SKERRIT : DRAYCOTT;
  },
  vesselName(_s, party: Party) {
    return isGavel(party) ? GAVEL : CORSAIR;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isGavel(party)) {
      r.push(comms('skerrit', settled(s) ? 'skerritAfter' : 'skerritGreet', vars(s)));
      s = setFlag(s, 'spokeSkerrit');
    } else {
      r.push(comms('draycott', settled(s) ? 'draycottAfter' : 'draycottGreet', vars(s)));
      s = setFlag(s, 'spokeDraycott');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isGavel(a.to) ? 'skerrit' : 'draycott';
    const len = s.log.length;
    const last = s.log[len - 1];
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isGavel(a.to) ? skerritRespond(s, t, r) : draycottRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
