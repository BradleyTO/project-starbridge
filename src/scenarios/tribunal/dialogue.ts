/**
 * Offline dialogue for Tribunal at Kesh Varo: Crewman Jory Askel in Orun Hold (contact A),
 * Magister Lirra Soth of the Quiet Stone Tribunal (contact B). Keeper Dorn and Pilgrim Toras
 * speak through the tribunal channel or as passenger when hailed; Fleet is by signal (agents.ts).
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { ASKEL, HOLD, SITE_CAP, SOTH } from './setup';
import { askelRespond, dornRespond, settled, sothRespond, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isTribunal = (p: Party) => p === 'cruiser';

const FILLER = new Set(['askelStatus', 'askelWaits', 'askelAfter', 'sothStatus', 'sothGreets', 'sothAfter', 'dornWaits', 'dornAfter']);

export const tribunalDialogue: DialogueProvider = {
  id: 'tribunal-offline',
  speakerName(_s, party: Party) {
    return isTribunal(party) ? SOTH : ASKEL;
  },
  vesselName(_s, party: Party) {
    return isTribunal(party) ? SITE_CAP : HOLD;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isTribunal(party)) {
      r.push(comms('soth', settled(s) ? 'sothAfter' : s.flags.spokeSoth ? 'sothStatus' : 'sothGreets', vars(s)));
      s = setFlag(s, 'spokeSoth');
    } else if (party === 'passenger') {
      r.push(comms('dorn', settled(s) ? 'dornAfter' : 'dornWaits', vars(s)));
    } else {
      r.push(comms('askel', settled(s) ? 'askelAfter' : s.flags.heardAskel ? 'askelStatus' : 'askelWaits', vars(s)));
      s = setFlag(s, 'spokeAskel');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = a.to === 'passenger' ? 'dorn' : isTribunal(a.to) ? 'soth' : 'askel';
    const len = s.log.length;
    const last = s.log[len - 1];
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next =
      a.to === 'passenger' ? dornRespond(s, t, r) : isTribunal(a.to) ? sothRespond(s, t, r) : askelRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
