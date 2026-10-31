/**
 * Offline dialogue for Ember Tide: Overseer Dagny Strome at Ketter's Rest, and Lifter-Master
 * Joss Ferrier on the ore lifter Mattock.
 *
 * Strome wants her furnace banked and her people alive, in that order only until she is given a
 * reason to change it; what she needs to hear depends on her seeded temper and on what the Halcyon
 * actually knows. Ferrier wants one more ore run; whether a warning is enough, or he needs a reason,
 * is seeded too.
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { FERRIER, LIFTER, OUTPOST, STROME } from './setup';
import { ferrierRespond, settled, stromeRespond, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isLifter = (p: Party) => p === 'cruiser';

const FILLER = new Set(['stromeStatus', 'stromeAfter', 'ferrierStatus', 'ferrierAfter', 'ferrierCarrying', 'ferrierDocked']);

export const emberDialogue: DialogueProvider = {
  id: 'ember-tide-offline',
  speakerName(_s, party: Party) {
    return isLifter(party) ? FERRIER : STROME;
  },
  vesselName(_s, party: Party) {
    return isLifter(party) ? LIFTER : OUTPOST;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isLifter(party)) {
      r.push(comms('ferrier', settled(s) ? 'ferrierAfter' : 'ferrierGreet', vars(s)));
      s = setFlag(s, 'spokeFerrier');
    } else {
      r.push(comms('strome', settled(s) ? 'stromeAfter' : 'stromeGreet', vars(s)));
      s = setFlag(s, 'spokeStrome');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isLifter(a.to) ? 'ferrier' : 'strome';
    const len = s.log.length;
    const last = s.log[len - 1];
    // Two sentences of one line reach here as two utterances: the second does not earn a stock
    // "listening" reply when the first already drew an answer.
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isLifter(a.to) ? ferrierRespond(s, t, r) : stromeRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
