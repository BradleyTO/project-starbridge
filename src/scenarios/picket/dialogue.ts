/**
 * Offline dialogue for The Long Picket: the picket commander (Lucan Roake, then his relief Ysara
 * Dahl) on the Iron Psalm, and Reeve Odile Marchbank speaking for Wrenmoor.
 *
 * Roake is clipped and correct and speaks for the Directorate. What moves him (a bluff about the
 * Halcyon's company or her resolve, a face-saving token, waiting out his relief, proof of the cargo,
 * or an old classmate's word) depends on his orders, his temperament and what he already knows (seeded).
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { COLONY, DAHL, PICKET, REEVE, ROAKE } from './setup';
import { marchbankRespond, relieved, roakeRespond, settled, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isPicket = (p: Party) => p === 'cruiser';

const FILLER = new Set(['roakeWaiting', 'dahlWaiting', 'reeveWaiting', 'roakeAfter', 'reeveAfter']);

export const picketDialogue: DialogueProvider = {
  id: 'picket-offline',
  speakerName(s, party: Party) {
    return isPicket(party) ? (relieved(s) ? DAHL : ROAKE) : REEVE;
  },
  vesselName(_s, party: Party) {
    return isPicket(party) ? PICKET : COLONY;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isPicket(party)) {
      if (settled(s)) r.push(comms(relieved(s) ? 'dahl' : 'roake', 'roakeAfter'));
      else if (relieved(s)) r.push(comms('dahl', 'dahlWaiting'));
      else {
        r.push(comms('roake', s.flags.roakeHeard ? 'roakeWaiting' : 'roakeHail'));
        s = setFlag(setFlag(s, 'roakeHeard'), 'roakeHailed');
      }
    } else r.push(comms('marchbank', settled(s) ? 'reeveAfter' : 'reeveWaiting', vars(s)));
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isPicket(a.to) ? (relieved(s) ? 'dahl' : 'roake') : 'marchbank';
    const len = s.log.length;
    const last = s.log[len - 1];
    // Two sentences of one line reach here as two utterances: the second does not earn a stock
    // "listening" reply when the first already drew an answer.
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isPicket(a.to) ? roakeRespond(s, t, r, 'captain') : marchbankRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
