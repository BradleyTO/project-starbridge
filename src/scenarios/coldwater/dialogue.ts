/**
 * Offline dialogue for Coldwater: Director Annick Toller on Coldwater Station, and Inspector-Commander
 * Noor Hadley of the ISA Safety Inspectorate on the courier Plumb Line.
 *
 * Toller needs the power beam back and will take the captain's word if it is given. Hadley will open
 * an independent review of the death on request, but only on an honest account: she asks whether
 * there is anything in the log the captain does not stand behind, and she will not keep anything quiet.
 * The striking watch is aboard the Halcyon and is reached in person or over the intercom (agents.ts).
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { COURIER, HADLEY, STATION, TOLLER } from './setup';
import { hadleyRespond, settled, tollerRespond, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isCourier = (p: Party) => p === 'cruiser';

const FILLER = new Set(['tollerStatus', 'tollerAfter', 'hadleyStatus', 'hadleyAfter']);

export const coldwaterDialogue: DialogueProvider = {
  id: 'coldwater-offline',
  speakerName(_s, party: Party) {
    return isCourier(party) ? HADLEY : TOLLER;
  },
  vesselName(_s, party: Party) {
    return isCourier(party) ? COURIER : STATION;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isCourier(party)) {
      r.push(comms('hadley', settled(s) ? 'hadleyAfter' : s.flags.spokeHadley ? 'hadleyStatus' : 'hadleyGreets', vars(s)));
      s = setFlag(s, 'spokeHadley');
    } else {
      if (settled(s)) r.push(comms('toller', 'tollerAfter'));
      else if (s.flags.tollerCalled) r.push(comms('toller', 'tollerStatus', vars(s)));
      else {
        r.push(comms('toller', 'tollerCall', vars(s)));
        s = setFlag(s, 'tollerCalled');
      }
      s = setFlag(s, 'spokeToller');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isCourier(a.to) ? 'hadley' : 'toller';
    const len = s.log.length;
    const last = s.log[len - 1];
    // Two sentences of one line reach here as two utterances: the second does not earn a stock
    // "listening" reply when the first already drew an answer.
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isCourier(a.to) ? hadleyRespond(s, t, r) : tollerRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
