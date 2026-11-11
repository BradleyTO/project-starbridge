/** Offline dialogue for The Ninefold Lock: Lt. Kaminski in the depot's entry hall (contact A) and Quartermaster-Commander Kovar of the Ordinal (contact B). */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { CUTTER, DEPOT_CAP, KAMINSKI, KOVAR } from './setup';
import { kaminskiRespond, kovarRespond } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isCutter = (p: Party) => p === 'cruiser';

const FILLER = new Set(['kamStatus', 'kovarStatus', 'kamAfter', 'kovarAfter']);

export const ninefoldDialogue: DialogueProvider = {
  id: 'ninefold-offline',
  speakerName(_s, party: Party) {
    return isCutter(party) ? KOVAR : KAMINSKI;
  },
  vesselName(_s, party: Party) {
    return isCutter(party) ? CUTTER : DEPOT_CAP;
  },
  greet(s, party) {
    const r: Report[] = [];
    return done(isCutter(party) ? kovarRespond(s, '', r) : kaminskiRespond(s, '', r), r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isCutter(a.to) ? 'kovar' : 'kaminski';
    const len = s.log.length;
    const last = s.log[len - 1];
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isCutter(a.to) ? kovarRespond(s, t, r) : kaminskiRespond(s, t, r);
    if (next.characters[who]?.status !== 'dead') next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key) && !t;
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
