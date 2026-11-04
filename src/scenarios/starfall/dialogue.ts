/**
 * Offline dialogue for Starfall: Factor Idris Kemble on the habitat Thistledown, and Agent Sabra
 * Quell on the company yacht Dividend.
 *
 * Kemble wants his people off and his post kept; whether his manifest is complete, and whether he
 * owns up when asked, is seeded. Quell wants the company's scoop works saved; whether she will help
 * with the head count, or let the plant go, is seeded too.
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { HABITAT, KEMBLE, QUELL, YACHT } from './setup';
import { kembleRespond, quellRespond, settled, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isYacht = (p: Party) => p === 'cruiser';

const FILLER = new Set(['kembleStatus', 'kembleAfter', 'quellStatus', 'quellAfter']);

export const starfallDialogue: DialogueProvider = {
  id: 'starfall-offline',
  speakerName(_s, party: Party) {
    return isYacht(party) ? QUELL : KEMBLE;
  },
  vesselName(_s, party: Party) {
    return isYacht(party) ? YACHT : HABITAT;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isYacht(party)) {
      r.push(comms('quell', settled(s) ? 'quellAfter' : 'quellGreet', vars(s)));
      s = setFlag(s, 'spokeQuell');
    } else {
      r.push(comms('kemble', settled(s) ? 'kembleAfter' : 'kembleGreet', vars(s)));
      s = setFlag(s, 'spokeKemble');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isYacht(a.to) ? 'quell' : 'kemble';
    const len = s.log.length;
    const last = s.log[len - 1];
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isYacht(a.to) ? quellRespond(s, t, r) : kembleRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
