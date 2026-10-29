/**
 * Offline dialogue for The Gardener: Claimwarden Bettine Crake on the mining tender Hobnail, and
 * Assayer Lorne Haskett on the claims station Spindle.
 *
 * Crake wants the growth burned, and will burn it herself when her charges are set. What holds her
 * (time, a promise, or what the science officer has proved) depends on her seeded temper and on
 * what the Halcyon actually knows. Haskett knows the field and how the growth's rock touches the claims.
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { CRAKE, HASKETT, STATION, TENDER } from './setup';
import { crakeRespond, haskettRespond, settled, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isTender = (p: Party) => p === 'cruiser';

const FILLER = new Set(['crakeWaiting', 'crakeAfter', 'haskettStatus', 'haskettAfter', 'crakeStillStanding']);

export const gardenerDialogue: DialogueProvider = {
  id: 'gardener-offline',
  speakerName(_s, party: Party) {
    return isTender(party) ? CRAKE : HASKETT;
  },
  vesselName(_s, party: Party) {
    return isTender(party) ? TENDER : STATION;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isTender(party)) {
      if (settled(s)) r.push(comms('crake', 'crakeAfter'));
      else if (s.flags.crakeHailed) r.push(comms('crake', 'crakeWaiting', vars(s)));
      else {
        r.push(comms('crake', 'crakeHail', vars(s)));
        s = setFlag(s, 'crakeHailed');
      }
      s = setFlag(s, 'spokeCrake');
    } else {
      if (settled(s)) r.push(comms('haskett', 'haskettAfter'));
      else if (s.flags.haskettCalled) r.push(comms('haskett', 'haskettStatus', vars(s)));
      else {
        r.push(comms('haskett', 'haskettCall', vars(s)));
        s = setFlag(s, 'haskettCalled');
      }
      s = setFlag(s, 'spokeHaskett');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isTender(a.to) ? 'crake' : 'haskett';
    const len = s.log.length;
    const last = s.log[len - 1];
    // Two sentences of one line reach here as two utterances: the second does not earn a stock
    // "listening" reply when the first already drew an answer.
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isTender(a.to) ? crakeRespond(s, t, r) : haskettRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
