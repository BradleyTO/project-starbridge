/**
 * Offline dialogue for Hollow Crown: Severin Mallory in the Ostrin Relay (contact A) and Acting
 * Governor Stannard at Government House (contact B). The woman speaking as Tamsin Rook is reached on
 * the relay's line with his leave, through orders ("hail Rook", "tell Rook ..."; agents.ts).
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { HOUSE, MALLORY, RELAY_CAP, STANNARD } from './setup';
import { malloryRespond, rookRespond, stannardRespond } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isHouse = (p: Party) => p === 'cruiser';

const FILLER = new Set(['malloryStatus_edge', 'malloryStatus_strained', 'malloryStatus_calmer', 'malloryAfter', 'stannardStatus', 'stannardAfter', 'rookStatus', 'rookAfter']);

export const hollowDialogue: DialogueProvider = {
  id: 'hollow-offline',
  speakerName(_s, party: Party) {
    return isHouse(party) ? STANNARD : MALLORY;
  },
  vesselName(_s, party: Party) {
    return isHouse(party) ? HOUSE : RELAY_CAP;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isHouse(party)) return done(stannardRespond(s, '', r), r);
    if (party === 'passenger') return done(rookRespond(s, '', r), r);
    return done(malloryRespond(s, '', r), r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = a.to === 'passenger' ? 'rook' : isHouse(a.to) ? 'stannard' : 'mallory';
    const len = s.log.length;
    const last = s.log[len - 1];
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = a.to === 'passenger' ? rookRespond(s, t, r) : isHouse(a.to) ? stannardRespond(s, t, r) : malloryRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key) && !t;
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
