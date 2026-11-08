/**
 * Offline dialogue for The Weather Engine: Technician Bastian Lowe inside the station (contact A)
 * and Steward Anwen Tull at Meridian Hall (contact B). Marit Quarrie is reached over the colony
 * net through orders ("hail Marit", "tell Marit ..."; agents.ts).
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { ENGINE_CAP, HALL, LOWE, TULL } from './setup';
import { loweRespond, maritRespond, settled, tullRespond, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isHall = (p: Party) => p === 'cruiser';

const FILLER = new Set(['loweStatus', 'loweGreets', 'loweAfter', 'loweAboard', 'tullStatus', 'tullGreets', 'tullAfter', 'maritListening', 'maritAfter']);

export const weatherDialogue: DialogueProvider = {
  id: 'weather-offline',
  speakerName(_s, party: Party) {
    return isHall(party) ? TULL : LOWE;
  },
  vesselName(_s, party: Party) {
    return isHall(party) ? HALL : ENGINE_CAP;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isHall(party)) {
      r.push(comms('tull', settled(s) ? 'tullAfter' : s.flags.spokeTullBefore ? 'tullStatus' : 'tullGreets', vars(s)));
      s = setFlag(s, 'spokeTullBefore');
      s = setFlag(s, 'spokeTull');
    } else if (party === 'passenger') {
      return done(maritRespond(s, '', r), r);
    } else {
      r.push(comms('lowe', settled(s) ? 'loweAfter' : s.ships.kestrel.souls === 0 ? 'loweAboard' : s.flags.spokeLowe ? 'loweStatus' : 'loweGreets', vars(s)));
      s = setFlag(s, 'spokeLowe');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = a.to === 'passenger' ? 'marit' : isHall(a.to) ? 'tull' : 'lowe';
    const len = s.log.length;
    const last = s.log[len - 1];
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = a.to === 'passenger' ? maritRespond(s, t, r) : isHall(a.to) ? tullRespond(s, t, r) : loweRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
