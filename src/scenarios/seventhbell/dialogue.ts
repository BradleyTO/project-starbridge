/**
 * Offline dialogue for The Seventh Bell: Lt. Cmdr. Jonah Stavely aboard the cutter ISV Tamber
 * (contact A), and Examiner Ilsabet Vory aboard the disabled Directorate courier Seraphine
 * (contact B). Stavely wants to be heard and fears what the record says; Vory wants the truth about
 * her two dead and will not be talked down to. Fleet Command is reached by signal (agents.ts).
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { COURIER, CUTTER, STAVELY, VORY, bell } from './setup';
import { settled, stavelyRespond, vars, voryRespond } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isCourier = (p: Party) => p === 'cruiser';

const FILLER = new Set(['stavelyStatus', 'stavelyWaits', 'stavelyAfter', 'stavelySilent', 'voryStatus', 'voryAfter']);

export const seventhBellDialogue: DialogueProvider = {
  id: 'seventh-bell-offline',
  speakerName(_s, party: Party) {
    return isCourier(party) ? VORY : STAVELY;
  },
  vesselName(_s, party: Party) {
    return isCourier(party) ? COURIER : CUTTER;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isCourier(party)) {
      r.push(comms('vory', settled(s) ? 'voryAfter' : s.flags.voryWalked ? 'voryGone' : s.flags.spokeVory ? 'voryStatus' : 'voryGreets', vars(s)));
      s = setFlag(s, 'spokeVory');
    } else {
      const silent = s.flags.stavelySilent && !s.flags.stavelyOwns;
      r.push(comms('stavely', settled(s) ? 'stavelyAfter' : silent ? 'stavelySilent' : s.flags.spokeStavely ? 'stavelyStatus' : bell(s).bond === 'friend' ? 'stavelyGreetsFriend' : 'stavelyGreets', vars(s)));
      s = setFlag(s, 'spokeStavely');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isCourier(a.to) ? 'vory' : 'stavely';
    const len = s.log.length;
    const last = s.log[len - 1];
    // Two sentences of one line reach here as two utterances: the second does not earn a stock
    // "listening" reply when the first already drew an answer.
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isCourier(a.to) ? voryRespond(s, t, r) : stavelyRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
