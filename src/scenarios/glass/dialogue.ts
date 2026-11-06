/**
 * Offline dialogue for The Glass Nebula: Surveyor Nessa Vale on the shuttle Citrine (often
 * garbled or delayed until the science is in), and the automated buoy Prism (telemetry only).
 */
import type { DialogueProvider } from '../../engine/dialogue';
import type { Applied } from '../../engine/reduce';
import type { Report } from '../../engine/report';
import { comms } from '../../engine/report';
import { setFlag, setMemory } from '../../engine/state';
import type { WorldState } from '../../engine/types';
import type { Party } from '../../engine/schema';
import { BUOY, SHUTTLE, VALE } from './setup';
import { prismRespond, settled, valeRespond, vars } from './agents';

const done = (s: WorldState, r: Report[]): Applied => ({ state: s, reports: r });
const isBuoy = (p: Party) => p === 'cruiser';

const FILLER = new Set(['valeAlive', 'valeFailing', 'valeGarbledHelp', 'valeGarbledStay', 'prismTelemetry']);

export const glassDialogue: DialogueProvider = {
  id: 'glass-offline',
  speakerName(_s, party: Party) {
    return isBuoy(party) ? `Buoy ${BUOY}` : VALE;
  },
  vesselName(_s, party: Party) {
    return isBuoy(party) ? BUOY : SHUTTLE;
  },
  greet(s, party) {
    const r: Report[] = [];
    if (isBuoy(party)) {
      r.push(comms('prism', settled(s) ? 'prismAfter' : 'prismTelemetry', vars(s)));
      s = setFlag(s, 'hailedPrism');
    } else {
      r.push(comms('vale', settled(s) ? 'valeAfter' : 'valeGreet', vars(s)));
      s = setFlag(s, 'hailedVale');
    }
    return done(s, r);
  },
  respond(s, a) {
    const r: Report[] = [];
    const t = (a.text ?? '').toLowerCase();
    const who = isBuoy(a.to) ? 'prism' : 'vale';
    const len = s.log.length;
    const last = s.log[len - 1];
    const again = (s.characters[who]?.memory?.replyLog ?? -1) === len || (!!last && String(last.voice ?? '').startsWith('npc:'));
    let next = isBuoy(a.to) ? prismRespond(s, t, r) : valeRespond(s, t, r);
    next = setMemory(next, who, 'replyLog', len);
    const filler = r.length === 1 && FILLER.has(r[0].key);
    return done(next, again && filler ? [] : r);
  },
  onPromiseBroken(s: WorldState): Applied {
    return { state: s, reports: [] };
  },
};
